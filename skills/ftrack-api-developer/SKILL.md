---
name: ftrack-api-developer
description: "Entry point for ftrack Studio API work in Python and JavaScript/TypeScript: core data model, client differences, and which ftrack-* skill covers each task."
when_to_use: "General or mixed ftrack API questions where no single ftrack-* skill fits: \"write an ftrack script\", \"build an ftrack integration\", \"automate ftrack\", code importing `ftrack_api` or `@ftrack/api`, `*.ftrackapp.com` URLs."
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

## Which skill

| Task | Skill |
|---|---|
| Install packages, credentials, connection check | ftrack-setup |
| Query syntax, filters, paging, counts/aggregation | ftrack-query |
| Sessions, API keys, commit/rollback, caching, errors | ftrack-session |
| Event listeners, `ftrack.update`, webhooks | ftrack-events |
| Custom actions and forms | ftrack-actions |
| Publishing, components, locations, thumbnails, review | ftrack-files |
| `@ftrack/api` usage in Node.js/browser/React | ftrack-javascript |
| Typed sessions, generated workspace types | ftrack-typescript |
| Dashboard widgets | ftrack-dashboards |

Load the specific skill(s) for the task; most tasks need ftrack-query plus one other.

## Rules that apply everywhere

1. Read credentials from `FTRACK_SERVER`, `FTRACK_API_USER`, `FTRACK_API_KEY`; never hard-code or print API keys.
2. Project the attributes you use and filter on the server; batch ids with `id in (...)`.
3. Prefer native id attributes (`project_id`, `status_id`) and `ancestors any (...)` over long relationship chains.
4. Only connect the event hub for listeners and actions.
5. Verify entity and attribute names against the workspace schema before writing code that depends on them.

Docs: https://developer.ftrack.com/. Working examples: https://github.com/ftrackhq/ftrack-recipes.
