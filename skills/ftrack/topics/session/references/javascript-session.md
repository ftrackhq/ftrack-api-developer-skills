# JavaScript session reference (`@ftrack/api`)

Sources: https://developer.ftrack.com/api-clients/javascript/tutorial, https://developer.ftrack.com/api-clients/client-comparison, and `source/session.ts` / `source/error.ts` in https://github.com/ftrackhq/ftrack-javascript.

Install: `npm install @ftrack/api`. The package has named exports only:

```javascript
import { Session, operation, expression, error } from "@ftrack/api";
```

## Constructor

```javascript
const session = new Session(serverUrl, apiUser, apiKey, {
  autoConnectEventHub: false,     // connect the event hub immediately
  eventHubOptions: {},            // options for the event hub
  serverInformationValues: null,  // extra server information to fetch at init
  clientToken: undefined,         // identifies this client in update events
  apiEndpoint: "/api",
  additionalHeaders: {},          // sent with every request
  strictApi: false,               // adds ftrack-strict-api: true to every request
  ensureSerializableResponse: false,
});
```

All three positional arguments are required; the constructor throws if any is empty. Pass the server URL **without a trailing slash**: the client appends `/api`, and `https://x.ftrackapp.com/` makes every request fail with a JSON parse error (the Python client tolerates the slash). Node.js has no built-in env loading for these, so read them yourself (e.g. `process.env.FTRACK_SERVER`).

## Initialization

The constructor returns immediately and starts fetching server information and schemas.

```javascript
await session.initializing;   // resolves to the session, rejects on bad URL/credentials
session.initialized;          // true once done
session.serverVersion;        // after initialization
```

Requests made before initialization finishes wait for it. There is no `close()` and no event emitter on the session.

## Requests

| Method | Notes |
|---|---|
| `query(expression, options?)` | Returns `{ action, data, metadata }`; `metadata.next.offset` for paging |
| `search({ expression, entityType, terms, contextId?, objectTypeIds? }, options?)` | Text search |
| `create(entityType, data, options?)` | Sent immediately; returns `{ data }` with the created entity |
| `update(entityType, keys, data, options?)` | `keys` is usually `[id]` |
| `delete(entityType, keys, options?)` | |
| `ensure(entityType, data, identifyingKeys?)` | Get or create; resolves to the entity, throws a plain `Error` if several match |
| `call(operations, options?)` | Several operations in one request and one transaction |
| `createComponent(file, options?)` | Upload a file - browsers only (see the `files` topic for Node.js) |
| `getSchemas()`, `getServerInformation()`, `getServerVersion()` | |

There is no unit of work: every `create`/`update`/`delete` is its own request. For changes that must succeed or fail together, use `call`:

```javascript
await session.call([
  operation.create("Task", { name: "lighting", parent_id: shotId, type_id: typeId }),
  operation.update("Shot", [shotId], { description: "lighting added" }),
]);
```

Options accepted by `query`, `call` and the mutation methods:

| Option | Effect |
|---|---|
| `signal` | `AbortSignal` to cancel the request (rejects with `error.AbortError`) |
| `additionalHeaders` | Extra headers for this request, e.g. `{ "ftrack-strict-api": "true" }` for one strict call |
| `decodeDatesAsIso` | Return datetimes as ISO 8601 strings instead of Moment (1.x) / dayjs (2.x) objects |
| `ensureSerializableResponse` | Skip normalization so the response is plain, serializable JSON |

## Strict mode

Turn it on per call with `additionalHeaders: { "ftrack-strict-api": "true" }`, or for every request with `strictApi: true`. Strict mode is required for `group by` and rejects `$custom_attribute` syntax, so don't enable it session-wide if you query custom attributes that way.

## Dates

By default datetimes are decoded into Moment objects in the current 1.x release (dayjs objects in the 2.0 beta), in UTC when the server has timezone support. Pass `decodeDatesAsIso: true` to get ISO strings, which are easier to store or send to other contexts. When sending dates, Date, Moment and dayjs values are encoded as ISO 8601 in UTC.

## Errors

Exported under `error`; use `instanceof`. Each has `message` and optional `errorCode`.

| Class | When |
|---|---|
| `error.ServerPermissionDeniedError` | Invalid credentials (`FTAuthenticationError`) or missing permission |
| `error.ServerValidationError` | Server validation failed |
| `error.ServerError` | Any other server error, including query syntax errors |
| `error.AbortError` | Request cancelled through `signal` |
| `error.CreateComponentError` | Upload failed |
| `error.EventServerConnectionTimeoutError`, `error.EventServerReplyTimeoutError`, `error.EventServerPublishError` | Event hub problems |

Network failures surface as the `fetch` error of your runtime (e.g. `TypeError: fetch failed` in Node.js).

## Browser use

Never embed an API key in code served to browsers. ftrack dashboard widgets receive the current user's server URL, username and API key from ftrack at runtime (see the `dashboards` topic); other browser apps should call your own backend, which holds the key.
