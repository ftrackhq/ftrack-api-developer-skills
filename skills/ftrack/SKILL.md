---
name: ftrack
description: "ftrack Studio API development in Python and JavaScript/TypeScript - data model, sessions and API keys, queries and group-by aggregation, event hub and webhooks, custom actions, files/components/locations/review media, @ftrack/api, generated TypeScript types, dashboard widgets and dependency setup. Routes to topic guides bundled in this skill."
when_to_use: "Code: `ftrack_api`, `ftrack_action_handler`, `@ftrack/api`, `@ftrack/web-widget`, `@ftrack/ts-schema-generator`, `session.query(`, `session.commit()`, `event_hub.subscribe(`, `create_component(`, `FTRACK_API_KEY`, `*.ftrackapp.com`. Asks: write, fix or explain ftrack scripts, queries, listeners, actions, publishes, widgets, types; install ftrack packages; connect or authenticate. Errors: `No module named 'ftrack_api'`, `Cannot find module '@ftrack/api'`."
---


# ftrack API development

ftrack Studio exposes one HTTP API (`POST https://<workspace>.ftrackapp.com/api`) with two official clients: Python `ftrack_api` (package `ftrack-python-api`) and JavaScript/TypeScript `@ftrack/api`. An event hub (WebSocket) carries change notifications and action requests.

## Data model essentials

- **Project** -> hierarchy of **TypedContext** subtypes (Folder, Episode, Sequence, Shot, AssetBuild, **Task**, Milestone...). Query any of them as `TypedContext`; `parent`, `ancestors`, `descendants`, `project_id` link them.
- **Asset** (on a context) -> **AssetVersion** (linked to the task that produced it) -> **Component** (file metadata) -> **ComponentLocation** (where the data is).
- **Status** (with `state.short`: NOT_STARTED / IN_PROGRESS / BLOCKED / DONE), **Type**, **Priority**, **User**, **Note**, **Timelog**, **Appointment** (assignments), **Metadata**, custom attributes (`$name` in queries, `custom_attributes` on entities).
- The available types and attributes depend on the workspace: check `session.types` / `session.schemas` (Python) or `session.schemas` / generated types (JavaScript) rather than guessing.

## Python vs JavaScript

| | Python | JavaScript |
|---|---|---|
| Writes | Staged, sent by `session.commit()` | Immediate `create`/`update`/`delete`; batch atomically with `session.call` |
| Reads | Lazy-loads unprojected attributes (one request each) | Only projected attributes |
| Paging | Automatic | Manual (`metadata.next.offset`) |
| Events | Full expressions, priorities, plugins | `topic=` subscriptions only |
| Actions | `ftrack-action-handler` | Raw event hub subscriptions |

## Topic guides

This is the only ftrack skill; each topic is a guide inside it. **Before writing or changing ftrack code, read the guide whose signals match** (most tasks need `query` plus one other). Each guide lists its own reference and example files. Paths are under `${CLAUDE_SKILL_DIR}/topics/`.

| Read | When the task or code involves |
|---|---|
| [setup](topics/setup/GUIDE.md) | pip/npm install of ftrack packages, `FTRACK_*` variables, connection check; `No module named 'ftrack_api'`, `Cannot find module '@ftrack/api'` |
| [query](topics/query/GUIDE.md) | `session.query(`, `select ... from ... where`, `has`/`any`, `limit`/`offset`, `group by`, `count(id)`, slow queries |
| [session](topics/session/GUIDE.md) | `ftrack_api.Session(`, `new Session(`, `commit()`/`rollback()`, `strict_api`, API keys, `create_note(`, `ftrack_api.exception.*`, caching, plugins |
| [events](topics/events/GUIDE.md) | `event_hub.subscribe(`, `eventHub.subscribe(`, `ftrack.update`, `event['data']['entities']`, `register(session)`, webhooks |
| [actions](topics/actions/GUIDE.md) | `ftrack_action_handler`, `BaseAction`, `discover`/`launch`, `ftrack.action.launch`, form `items`, action servers |
| [files](topics/files/GUIDE.md) | `create_component(`, `createComponent(`, `AssetVersion`, `encode_media`, `create_thumbnail(`, `get_filesystem_path(`, locations, accessors, S3, sequences |
| [javascript](topics/javascript/GUIDE.md) | imports from `@ftrack/api`, `session.create(`/`update(`/`call(`, `operation.`, `expression` tag, Node.js/browser/React |
| [typescript](topics/typescript/GUIDE.md) | `.ts` files, `Session<EntityTypeMap>`, `query<"Task">`, `__generated__/schema`, `ts-schema-generator` |
| [dashboards](topics/dashboards/GUIDE.md) | `@ftrack/web-widget`, `ftrackWidget.initialize(`, `getCredentials()`, Web view/Custom widget, charts in ftrack |

## Rules that apply everywhere

1. Read credentials from `FTRACK_SERVER`, `FTRACK_API_USER`, `FTRACK_API_KEY`; never hard-code or print API keys.
2. Project the attributes you use and filter on the server; batch ids with `id in (...)`.
3. Prefer native id attributes (`project_id`, `status_id`) and `ancestors any (...)` over long relationship chains.
4. Only connect the event hub for listeners and actions.
5. Verify entity and attribute names against the workspace schema before writing code that depends on them.

Docs: https://developer.ftrack.com/. Working examples: https://github.com/ftrackhq/ftrack-recipes.
