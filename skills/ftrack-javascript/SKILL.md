---
name: ftrack-javascript
description: "ftrack JavaScript client @ftrack/api - Session, queries, create/update/delete/ensure, atomic session.call batches, createComponent uploads, eventHub, dates and cancellation in Node.js, browsers and React. Not for Python ftrack code."
when_to_use: "Code signals: `from \"@ftrack/api\"` or `require(\"@ftrack/api\")`, `@ftrack/api` in package.json, `session.initializing`, `session.create(`, `session.update(`, `session.delete(`, `session.ensure(`, `session.call(`, `operation.create(`, the `expression` template tag, `session.createComponent(`, `session.eventHub`, `getComponentUrl`, `thumbnailUrl`, React components or Node.js scripts talking to ftrack. Requests like \"ftrack in JavaScript\", \"Node.js ftrack script\", \"ftrack React app\", \"upload a file to ftrack from the browser\"."
---

# ftrack JavaScript client (`@ftrack/api`)

```bash
npm install @ftrack/api      # Node.js 20+ or a modern browser
```

```javascript
import { Session, operation, expression, error, Event } from "@ftrack/api";
```

Named exports only - `import ftrack from "@ftrack/api"` and `new ftrack.Session(...)` don't work with the current package.

**This client is not the Python client.** There is no `session.get`, no `session.commit()`, no unit of work, no `session.close()`, no attribute lazy-loading and no automatic paging. Code that uses those is wrong.

## Session

```javascript
const session = new Session(serverUrl, apiUser, apiKey, { autoConnectEventHub: false });
await session.initializing;   // rejects on bad URL or credentials
```

Create one session per process or app and share it. Options, errors and strict mode: see ftrack-session.

## Query

```javascript
const { data, metadata } = await session.query(
  expression`select name, status.name from Task where project_id is "${projectId}"`
);
```

- `data` is an array of plain objects with only the projected attributes (plus ids).
- Use the `expression` tag for interpolated values - it escapes quotes.
- Paging is manual: loop with `offset`/`limit` until `metadata.next.offset` is `null`.
- Query syntax and `group by`: see ftrack-query.

## Create, update, delete

Each call is sent immediately and returns `{ data }`.

```javascript
const { data: task } = await session.create("Task", {
  name: "lighting", parent_id: shotId, type_id: typeId,
});
await session.update("Task", [task.id], { status_id: statusId, description: "WIP" });
await session.delete("Task", [task.id]);
// Get or create (updates non-identifying values if they differ); resolves to the entity
const meta = await session.ensure(
  "Metadata",
  { parent_id: shotId, parent_type: "Shot", key: "camera", value: "A" },
  ["parent_id", "key"]
);
```

- Set relations through their id attributes (`status_id`, `parent_id`, `priority_id`, ...).
- Updates take the primary key, so query the id first if you only know a name.
- For several changes that must succeed or fail together, batch them - one request, one transaction:

```javascript
await session.call([
  operation.create("Task", { name: "comp", parent_id: shotId, type_id: typeId }),
  operation.update("Shot", [shotId], { description: "comp added" }),
]);
```

## Files

```javascript
const [componentResponse] = await session.createComponent(file, {   // File or Blob
  data: { name: "main", version_id: versionId },   // optional FileComponent attributes
  onProgress: (percent) => console.log(percent),
  signal: controller.signal,
});
const componentId = componentResponse.data.id;
const downloadUrl = session.getComponentUrl(componentId);
const thumbUrl = session.thumbnailUrl(componentId, { size: 300 });
```

`createComponent` uploads to the `ftrack.server` location. Attaching to a version, encoding and other locations: see ftrack-files. `getComponentUrl` and `thumbnailUrl` embed the API key in the URL - don't log or share them.

## Events

```javascript
session.eventHub.connect();   // or autoConnectEventHub: true
const id = session.eventHub.subscribe("topic=ftrack.update", (event) => {
  console.log(event.data.entities);
});
session.eventHub.unsubscribe(id);
await session.eventHub.publish(new Event("my-company.some-topic", { key: "value" }));
```

Subscriptions only support `topic=...` (wildcards allowed, e.g. `topic=ftrack.*`). Details: see ftrack-events.

## Dates

Datetimes are returned as dayjs objects by default. Pass `{ decodeDatesAsIso: true }` to `query`/`call` to get ISO strings (also what generated TypeScript types declare). Dates you send are encoded as ISO 8601 UTC.

## Environments

- **Node.js**: read `FTRACK_SERVER`, `FTRACK_API_USER`, `FTRACK_API_KEY` from `process.env` and pass them to the constructor - the client doesn't read them itself.
- **Browser**: never ship an API key. ftrack dashboard widgets get the current user's credentials from ftrack at runtime (see ftrack-dashboards); other web apps should go through their own backend.
- **React**: keep the session in a module or context (not per component); pass an `AbortController` signal to requests in `useEffect` and abort in the cleanup.

## Reference files

Files are under `${CLAUDE_SKILL_DIR}`. Read only what the question needs.

| File | Read when |
|---|---|
| [references/client-api.md](references/client-api.md) | Full method and option list, response shapes, error classes, event hub methods |
| [examples/javascript/crud-examples.js](examples/javascript/crud-examples.js) | Runnable Node.js: query, create/update/delete, ensure, atomic call, upload |
| [examples/javascript/react-hooks.jsx](examples/javascript/react-hooks.jsx) | React: shared session context, data hook with cancellation, upload with progress |

Sources: https://github.com/ftrackhq/ftrack-javascript (README and `source/`), https://developer.ftrack.com/api-clients/javascript/.
