# `@ftrack/api` reference

Source: `source/session.ts`, `source/event_hub.ts`, `source/types.ts`, `source/error.ts` and README in https://github.com/ftrackhq/ftrack-javascript.

## Exports

```javascript
import {
  Session,            // API session
  EventHub, Event,    // event hub (session.eventHub is an EventHub)
  operation,          // operation.query / create / update / delete / search builders
  expression,         // tagged template that escapes quotes in interpolated values
  error,              // error classes
  projectSchema,      // project schema helpers
  SERVER_LOCATION_ID, // id of the ftrack.server location
} from "@ftrack/api";
```

## Session methods

| Method | Returns |
|---|---|
| `new Session(serverUrl, apiUser, apiKey, options?)` | Session (initializes in the background) |
| `initializing` | `Promise<Session>` |
| `query(expression, options?)` | `{ action: "query", data: T[], metadata: { next: { offset } } }` |
| `search({ expression, entityType, terms?, contextId?, objectTypeIds? }, options?)` | `{ data, metadata }` |
| `create(entityType, data, options?)` | `{ action: "create", data: T }` |
| `update(entityType, keys, data, options?)` | `{ action: "update", data: T }` |
| `delete(entityType, keys, options?)` | `{ action: "delete", data: true }` |
| `ensure(entityType, data, identifyingKeys?)` | The existing or created entity; updates differing non-identifying values; throws if several match |
| `call(operations, options?)` | Array of responses in operation order; one transaction |
| `createComponent(file, { name?, data?, onProgress?, signal?, onAborted? })` | `[componentCreate, componentLocationCreate, uploadMetadata]` |
| `getComponentUrl(componentId)` | Download URL (contains the API key) |
| `thumbnailUrl(componentId, { size = 300 })` | Thumbnail URL (contains the API key) |
| `getServerInformation()`, `getServerVersion()`, `getSchemas()`, `getSchema(type)` | Server data |
| `getPrimaryKeyAttributes(type)`, `getIdentifyingKey(entity)` | Schema helpers |

Constructor options: `autoConnectEventHub`, `eventHubOptions`, `serverInformationValues`, `clientToken`, `apiEndpoint` (default `/api`), `additionalHeaders`, `strictApi`, `ensureSerializableResponse`.

Per-request options (`query`, `search`, `call`, mutations): `signal`, `additionalHeaders`, `decodeDatesAsIso`, `ensureSerializableResponse`; mutations also accept `pushToken`.

`keys` for `update`/`delete` is a primary key value or array, usually `[id]`.

## Operations for `call`

```javascript
operation.query("select id from Task where ...")
operation.create("Task", { name, parent_id, type_id })
operation.update("Task", [taskId], { status_id })
operation.delete("Task", [taskId])
operation.search({ expression, entityType, terms })
```

All operations in one `call` run in a single server transaction. Results come back in the same order.

## Uploads

`createComponent(file)` accepts a `File` or `Blob` (available in browsers and Node.js 20+). It creates a `FileComponent`, uploads the data (multipart for large files) and registers it in the `ftrack.server` location. `onProgress` receives a percentage. Abort with `signal`; `onAborted` is called after cleanup. `data` is merged into the created `FileComponent` (`name`, `file_type`, `size` and `id` are filled from the file unless given), so it can attach the component to a version:

```javascript
const [{ data: component }] = await session.createComponent(file, {
  data: { name: "main", version_id: versionId },
});
```

See ftrack-files for attaching components to asset versions and for encoding media.

## Event hub (`session.eventHub`)

| Method | Notes |
|---|---|
| `connect()` / `isConnected()` | Or `autoConnectEventHub: true` |
| `subscribe(subscription, callback, subscriber?)` | Returns a subscriber id. Only `topic=value` (with `*` wildcards). Returning a value other than `null`/`undefined` from the callback sends it as a reply |
| `unsubscribe(id)` | Returns `true` if removed |
| `publish(event, { onReply?, timeout? })` | Resolves with the event id; timeout in seconds (default 30) |
| `publishAndWaitForReply(event, { timeout })` | Resolves with the first reply |
| `getSubscriberByIdentifier(id)` | Subscriber info or `null` |

`new Event(topic, data)`. Limitations vs Python: no data/source filters in subscriptions, targeted events reach all topic subscribers, no priorities or stopping events.

## Errors (`error.*`)

| Class | When |
|---|---|
| `ServerPermissionDeniedError` | Invalid credentials or missing permission |
| `ServerValidationError` | Validation failed |
| `ServerError` | Other server errors, including query syntax errors |
| `AbortError` | Request aborted via `signal` |
| `CreateComponentError` | Upload failed |
| `NotUniqueError` | Event hub subscriber id already used |
| `EventServerConnectionTimeoutError`, `EventServerReplyTimeoutError`, `EventServerPublishError` | Event hub failures |

All extend `Error`; check with `instanceof`. Network failures surface as the runtime's `fetch` error.

## Dates

Datetimes decode to dayjs objects by default; `decodeDatesAsIso: true` returns ISO 8601 strings. Date-only values decode to `YYYY-MM-DD` strings. Outgoing `Date`/dayjs values are encoded as ISO 8601 UTC.
