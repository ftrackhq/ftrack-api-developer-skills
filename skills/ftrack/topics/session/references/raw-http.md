# Raw HTTP API (operations endpoint)

Sources: https://developer.ftrack.com/api/endpoint, https://developer.ftrack.com/api/operations/ (per-operation pages), `ftrack_api.session.Session.call`/`encode`/`decode` in `ftrack-python-api` 3.1.0, and `source/operation.ts` + `source/session.ts` in `ftrackhq/ftrack-javascript`. Batching, encoding and error shapes below were run against a live workspace.

Use this when working without an official client (Go, C#, PHP, shell) or when sending an action the clients don't wrap. If you're building a reusable wrapper rather than making a few calls, read [writing-a-client.md](writing-a-client.md) as well - it covers the bootstrap order, schema interpretation and response decoding a client library needs on top of this protocol.

## The envelope

One endpoint, always `POST`:

```
POST https://<workspace>.ftrackapp.com/api
Content-Type: application/json
Accept: application/json
ftrack-user: <username>
ftrack-api-key: <key>
```

**The body is a JSON array of operations and the response is a JSON array of results at matching indices.** The API is batch-only - even a single operation is an array of one, and `[]` is a valid request that returns `[]`. Credentials are only needed on the first request; a standard session cookie carries authentication afterwards.

Strip any trailing slash from the server URL before appending `/api`: `FTRACK_SERVER` often ends in one, and `//api` returns an HTML 404 page rather than a JSON error.

## Many actions per call, many results at once

This is the point of the endpoint: send as many operations as you need in one round trip and read every result from the returned array. Operations may mix freely - queries alongside writes, different entity types, repeated actions.

```bash
curl "${FTRACK_SERVER%/}/api" -X POST \
  -H "Content-Type: application/json" -H "Accept: application/json" \
  -H "ftrack-user: $FTRACK_API_USER" -H "ftrack-api-key: $FTRACK_API_KEY" \
  --data '[
    {"action": "query_server_information", "values": ["version"]},
    {"action": "query", "expression": "select name from Project where status is active limit 2"},
    {"action": "query", "expression": "select first_name from User limit 1"}
  ]'
```

The response has three entries, in the order the operations were sent:

```json
[
  {"version": "26.8.2"},
  {"action": "query",
   "data": [{"__entity_type__": "Project", "id": "...", "context_type": "show", "name": "hero"},
            {"__entity_type__": "Project", "id": "...", "context_type": "show", "name": "bunny"}],
   "metadata": {"next": {"offset": 2}}},
  {"action": "query",
   "data": [{"__entity_type__": "User", "id": "...", "first_name": "Lorenzo"}],
   "metadata": {"next": {"offset": 1}}}
]
```

Notes verified against a live workspace:

- Each `query` result carries its own `metadata.next.offset`, so several independent paged queries can advance in one request. Use that value for the next page, not `offset + limit`.
- Rows always include `__entity_type__` and the primary key, even when not projected.
- Results from non-query actions are not wrapped in `data`/`metadata` - `query_server_information` returns its values as a flat object.

**All operations in one request share one server-side transaction: if any operation fails, every operation in the batch is rolled back.** That makes a single call the way to get atomicity - create a parent and its children, or update several entities, as one unit. The flip side is that one bad operation discards the whole batch, including results that would have succeeded, so don't bundle unrelated work just to save a round trip.

Ids don't have to come from the server first: entity types whose schema gives `id` the default `"{uid}"` accept a client-generated UUID (this is what the Python client does), so a later operation in the same batch can reference an entity an earlier one creates - e.g. `create` a Shot with a chosen `id`, then `create` a Task with that value as `parent_id`.

The official clients expose this as `session.call(operations)`: Python `session.call([{...}, {...}])`, JavaScript `session.call([operation.create(...), operation.update(...)])`. The JavaScript `Operation` type ends in `{ action: string; [key: string]: any }`, so any action can be passed through even without a typed helper. Python's `session.commit()` is itself one `call` holding all staged operations.

## Encoding values

| Type | Form |
|---|---|
| Date and time | Naive value in the server's timezone, ISO 8601 string. Both clients send `{"__type__": "datetime", "value": "<ISO 8601>"}`, and the server returns `__type__` `datetime` or `date` objects |
| Entity | Encode an entity fully **once**; every other mention is a reference `{"__entity_type__": "<EntityType>", "<primary key>": "<value>"}` (usually `id`) |

Only top-level entities are encoded for an operation - a `create` does not recursively create nested entities, so give each entity in a tree its own `create` operation (they can all go in the same request).

When decoding, the fully encoded copy of an entity may sit at any nesting depth with all other mentions as references. Walk the response recursively and expand references so they point at the same object; `Session.merge` in the Python client is the reference implementation, and [writing-a-client.md](writing-a-client.md) spells out the identity-map algorithm.

## Operation payloads

Verified from client source. `entity_key` is the primary key value or a list of them (the Python client sends a list; `operation.create` in the JavaScript client omits `entity_key` entirely).

| Action | Payload |
|---|---|
| `query` | `{"action": "query", "expression": "select ... from ... where ..."}` -> `{action, data, metadata}` |
| `search` | `{"action": "search", "expression"?, "entity_type"?, "terms"?: [], "context_id"?, "object_type_ids"?: []}` |
| `create` | `{"action": "create", "entity_type": T, "entity_data": {"__entity_type__": T, ...values}}` (Python also sends `entity_key`) |
| `update` | `{"action": "update", "entity_type": T, "entity_key": [id], "entity_data": {"__entity_type__": T, attr: value}}` |
| `delete` | `{"action": "delete", "entity_type": T, "entity_key": [id]}` |
| `query_server_information` | `{"action": "query_server_information", "values"?: ["version", ...]}` - omit `values` for everything |
| `query_schemas` | `{"action": "query_schemas"}` - the full workspace schema |
| `get_upload_metadata` | `{"action": "get_upload_metadata", "component_id", "file_name", "file_size", "checksum"?, "parts"?}` -> signed `url` + `headers` |
| `encode_media` | `{"action": "encode_media", "component_id", "version_id", "keep_original": true}` -> a `Job` |
| `get_widget_url` | `{"action": "get_widget_url", "name", "theme", "entity_type"?, "entity_key"?: [id]}` |
| `send_user_invite` | `{"action": "send_user_invite", "user_id"}` |
| `send_review_session_invite` | `{"action": "send_review_session_invite", "review_session_invitee_id"}` |
| `reset_remote` | `{"action": "reset_remote", "reset_type", "entity_type"?, "entity_key"?}` |

The Python client sends one operation per invitee for `send_user_invite` and `send_review_session_invite`, batching them all into a single `call` - the normal pattern for applying one action across many entities.

The server accepts more operations than the clients wrap. https://developer.ftrack.com/api/operations/ lists them all with payloads and responses - parse query, permissions, storage usage, generate signed URL, complete multipart upload, convert entity, assume user, the delayed jobs (CSV import, LDAP sync, review-session feedback export) and the API-key/user security-role grants. Read the relevant page for the exact `action` value instead of deriving it from the page title: the two reset-remote pages, for example, are both the single `reset_remote` action distinguished by `reset_type`.

## Errors

| Case | Response |
|---|---|
| Bad credentials or other exceptional failure | HTTP error status, details in the body and in an `FTRACK_ERROR` header |
| Operation failure, default mode | **HTTP 200** with the array replaced by `{"exception": "<Name>", "content": "<details>", "error_code": <code or null>}` |
| Operation failure, strict mode | Same body with an HTTP 5xx status |

Because the error object replaces the whole array, there are no partial results to inspect - check for an `exception` key before treating the response as a list. Add `ftrack-strict-api: true` to get real HTTP status codes (and to enable `group by` and aggregates); see [query-language.md](../../query/references/query-language.md) for what else strict mode changes.
