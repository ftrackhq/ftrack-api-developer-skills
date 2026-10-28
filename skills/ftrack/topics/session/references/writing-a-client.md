# Writing an ftrack API client

Sources: `ftrack-python-api` 3.1.0 (`session.py`, `entity/factory.py`, `event/hub.py`), `ftrackhq/ftrack-javascript` (`source/session.ts`, `source/operation.ts`), https://developer.ftrack.com/api/endpoint and https://developer.ftrack.com/api/schemas. The bootstrap sequence, schema shape and event-hub handshake below were run against a live workspace (server 26.8.2).

For the wire protocol itself - request envelope, operation payloads, batching, errors - see [raw-http.md](raw-http.md). This file covers what a *client library* has to do on top of it, in the order it has to do it.

## Bootstrap sequence

What both official clients do when a session is constructed:

1. **Build an HTTP client** that sends `ftrack-user` and `ftrack-api-key` on every request (or keeps the session cookie) plus `Content-Type`/`Accept: application/json`, and a `ftrack-strict-api` header if strict mode is on. Keep a cookie jar: the event hub handshake reuses those cookies.
2. **`query_server_information`** - the first call, which doubles as the credentials check. On a live workspace it returns `version`, `schema_hash`, `is_timezone_support_enabled` and `storage_scenario`. Pass `"values": ["version", ...]` to fetch a subset.
3. **Check the server version.** The Python client requires `>= 3.3.11`, skips the check when the version is the literal `"dev"`, and returns without complaint if the version doesn't match `\d+\.\d+\.\d+`. Features gate on this - `encode_media`, `send_user_invite` and friends raise a compatibility error when the server rejects the action.
4. **`query_schemas`** - one call returning a list of schema documents (167 on the workspace tested). Cache it on disk keyed by the `schema_hash` from step 2 and re-fetch only when the hash changes; this is the single biggest start-up cost.
5. **Build entity types** from those schemas (below).
6. **Connect the event hub** only if the caller subscribes or publishes.

Steps 2 and 4 can share one request - they're just two operations in one array.

## The schema document

Each entry in `query_schemas` describes one entity type. Verified keys:

| Key | Meaning for a client |
|---|---|
| `id` | Entity type name, e.g. `Task`. This is what goes in `entity_type` and `__entity_type__` |
| `properties` | Attribute name -> fragment (see below) |
| `primary_key` | Ordered list of attribute names. Usually `["id"]`, but **not always** - `JobComponent` is `["component_id", "job_id"]` and `EntitySetting` is `["parent_id", "group", "name"]`. `entity_key` must carry the values in this order, so don't hard-code a single id anywhere |
| `immutable` | Attributes that cannot be written after creation - reject or ignore local changes to these |
| `computed` | Server-derived attributes. Never send them; the `persisted_only` encoding strategy skips them |
| `required` | Attributes the schema declares required - for Task: `bid`, `status_id`, `type_id`, `priority_id`, `object_type_id`, `sort`, `context_type`, `id`, `name`. Several have schema defaults, so treat this as a validation hint rather than a list the caller must supply |
| `default_projections` | What to select when the caller didn't project anything, e.g. `["context_type", "id", "name"]` for Task |
| `system_projections` | Raw column names the server always projects internally, e.g. `["showid", "context_type"]` for Task |
| `alias_for` | Present when the type is a view over another (Task is `{"id": "Task", "classifiers": {"object_typeid": "..."}}` over Context) |
| `metadata` | Capability flags, e.g. Task has `{"group_by": true, "entity_event": true}` - whether the type can be grouped in queries and whether it emits entity events |
| `$mixin` | A `$ref` to a schema whose properties are merged in - Task mixes in `TypedContext`. Resolve these when building the attribute set |
| `type` | Always `object`; JSON-schema plumbing |

Property fragments, with real examples from `Task`:

| Fragment | Example | Client behaviour |
|---|---|---|
| Scalar | `{"type": "string", "default": ""}` | Plain value |
| Client-generated id | `{"type": "string", "default": "{uid}"}` | Generate a UUID4 locally on create. This is why a batch can reference an entity it creates - see [raw-http.md](raw-http.md) |
| Typed scalar | `{"type": "number"}`, `{"type": "string", "format": "date-time"}` | Decode `date-time` through the `__type__` rules |
| Foreign key | `{"alias_for": "showid", "type": "string", "format": "foreign_key", "description": "Foreign key(s): Project.id"}` | Scalar id; cheaper to query than the relation |
| Single relation | `{"$ref": "Context"}` | Resolves to one entity of that type |
| Collection | `{"alias_for": "context_assignments", "type": "array", "items": {"$ref": "Appointment"}}` | List of entities |
| `restricted_projection` | - | The Python client skips these attributes entirely when building the class |

`alias_for` on a property maps the public name onto a legacy column name; send and query the public name.

## Encoding outbound values

Beyond the date and entity-reference rules in [raw-http.md](raw-http.md), a client that holds entity objects must decide *which* attributes to serialise. The Python client calls this the entity attribute strategy:

| Strategy | Encodes | Used for |
|---|---|---|
| `modified_only` | Only locally changed attributes | `commit()` - this is the one a unit of work wants |
| `set_only` | Attributes with any value set, without fetching from the server | Default |
| `all` | Everything, fetching unset attributes first | Debugging, full dumps |
| `persisted_only` | Remote values, skipping `computed` | Caching an entity |

Within `entity_data`, nested entity values collapse to an entity reference and collections to a list of references. Drop unset attributes rather than sending null, and always include `__entity_type__`.

## Decoding: the identity map

A response may encode the same entity fully in one place and as a bare reference everywhere else, at any nesting depth. A client has to rebuild object identity or callers get duplicate, half-populated entities.

The algorithm (Python `Session.merge` / `_merge_recursive`, JavaScript `decode` with its `identityMap`):

1. Keep a map for the duration of the decode, keyed by entity type plus primary key *values*. The JavaScript client builds the key by joining them with commas - `[entity.__entity_type__, ...primaryKeyNames.map((name) => entity[name])].join(",")` - where the names come from the schema's `primary_key`.
2. Walk the response depth-first. For each object carrying `__entity_type__`, compute its key.
3. If the key is already in the map, return the existing instance instead of building a new one. This is what makes a reference and its full encoding the same object, and it terminates cycles.
4. Otherwise create (or look up in a longer-lived cache) the instance, put it in the map, then recurse into its attributes - single relations, collections and mapped collections alike - merging each.
5. Convert `{"__type__": "datetime"|"date", "value": ...}` leaves to the language's date type. Respect `is_timezone_support_enabled` from server information when deciding whether values are UTC.

Getting step 3 wrong is the most common way a new client ends up with entities whose relations are empty.

## Optional: a unit of work

Python stages changes locally and flushes them on `commit()`; JavaScript sends each mutation immediately. If you stage, record an operation log and apply these optimisations before sending the batch - the order matters, and it is what `Session.commit` does:

1. Drop every payload for an entity that was created *and* deleted in the same batch.
2. For repeated updates to the same attribute of the same entity, keep only the last.
3. Remove unset values from `entity_data`.
4. Drop payloads whose `entity_data` is now empty or only `__entity_type__`.
5. Collapse an update into an immediately preceding `create` or `update` for the same entity.

Then send the whole batch as one request. On failure the server rolls everything back but the local operation log still holds the operations, so expose a `rollback()` that clears it.

## Paging

A `query` result's `metadata.next.offset` is the offset to request next; stop when it is `null`. Don't compute `offset + limit` - the server prunes rows the user can't see after applying the range, so the two differ. Independent paged queries can each advance inside one batched request.

## Uploads

Components are a three-step dance (`create` the component, `get_upload_metadata`, `PUT` to the signed URL, then `create` the `ComponentLocation`), not a multipart form post. The full sequence with the `ftrack.server` location id is in the `files` topic, `references/review-and-media.md`.

## Event hub

A legacy Socket.IO **protocol 1** connection, not plain WebSocket and not modern Socket.IO:

1. `GET https://<server>/socket.io/1/` with the `ftrack-user`/`ftrack-api-key` headers and the HTTP session cookies. The body is colon-separated - `<session-id>:60:60:websocket` on the workspace tested, i.e. session id, heartbeat timeout, close timeout, comma-separated transports. Fail if `websocket` isn't offered.
2. Open `wss://<server>/socket.io/1/websocket/<session-id>`, passing the same headers and cookies.
3. Frame packets as `<code>:<packet-id>:<path>:<data>`, where `path` is empty and `packet-id` is only set when you want an acknowledgement. Codes: `0` disconnect, `1` connect, `2` heartbeat, `3` message, `4` json, `5` event, `6` acknowledge, `7` error. Reply to heartbeats or the server drops you.
4. Events travel as code `5` under the namespace `ftrack.event`.
5. **Subscribing is itself an event**: publish `ftrack.meta.subscribe` with `{"subscriber": <subscriber metadata>, "subscription": "<expression string>"}` and wait for the acknowledgement.
6. Stamp outgoing events with `source.id` (the hub's own id), `source.user.username` and `source.host`.
7. Reconnect on unintentional disconnect - the Python client retries 30 times at 10-second intervals.

Server-side filtering of subscription expressions is richer than `topic=...`; see the `events` topic for the expression syntax and topic list.

## Checklist

| Must get right | Why |
|---|---|
| Cache schemas against `schema_hash` | Otherwise every session start pays for a 167-document download |
| Identity map on decode | Duplicate entities with empty relations |
| Treat `primary_key` as an ordered list | Composite-key types like `JobComponent` and `EntitySetting` break any client that assumes a single `id` |
| `metadata.next.offset` for paging | Silently skipped or repeated rows |
| Strip trailing `/` before `/api` | `//api` returns an HTML 404 |
| Check for an `exception` key before treating a response as a list | Operational errors arrive with HTTP 200 by default |
| Never send `computed` or `immutable` attributes | Server-side validation errors |
| One batch = one transaction | Both the way to get atomicity and the reason unrelated work shouldn't share a request |
