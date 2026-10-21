---
name: ftrack-dashboards
description: ftrack custom dashboard widgets - web pages embedded in ftrack (Web view / Custom widget / action widgets) using @ftrack/web-widget for credentials, entity context, theme and navigation, with @ftrack/api for data and server-side aggregation for charts.
when_to_use: "Code: `@ftrack/web-widget`, `ftrackWidget.initialize(`, `getCredentials()`, `getEntity()`, `getActiveTheme()`, `ftrackWidgetLoad`/`ftrackWidgetUpdate`, `ftrack.widget.load`. Asks: ftrack dashboard, custom widget, web view widget, charts or reports inside ftrack."
---

# ftrack dashboard widgets

A widget is your own web page shown in an iframe by ftrack: the **Web view** dashboard widget, the **Custom widget** on Overview, or an action that returns `{"type": "widget", "url": ...}` (see ftrack-actions). ftrack passes the current user's credentials and entity to the page via `postMessage`; `@ftrack/web-widget` handles that.

## Prerequisites

- Enable Custom widgets and add your URL under **System settings > Advanced > Custom widgets > Allowed widget URLs**. Creating a dashboard with a custom widget needs the "Manage custom widget" permission.
- Serve over **HTTPS** (same protocol as ftrack) or the browser blocks it. For local development tunnel your dev server (e.g. ngrok) and use that URL.
- Tick **Inject API credentials** on the widget so the page receives them.
- `npm install @ftrack/api @ftrack/web-widget` (see ftrack-setup).

## Bootstrapping

```javascript
import { Session, operation, expression } from "@ftrack/api";
import { initialize, getCredentials, getEntity, getActiveTheme } from "@ftrack/web-widget";

window.addEventListener("DOMContentLoaded", () => {
  initialize({
    async onWidgetLoad() {
      const { serverUrl, apiUser, apiKey } = getCredentials();
      const session = new Session(serverUrl, apiUser, apiKey);
      await session.initializing;
      render(session, getEntity(), getActiveTheme());   // entity: { id, type } or undefined
    },
    onWidgetUpdate({ data }) {
      // User navigated in the project outliner (only for widgets under a project)
      rerender(data.entity);
    },
  });
});
```

- Credentials only exist inside ftrack: opening the page directly has none, so show a "open this inside ftrack" message instead of crashing.
- Never put an API key in widget code; always use the injected credentials (they're the viewing user's, so permissions follow the user).
- Hierarchy entities arrive as `type: "TypedContext"`; query `TypedContext` (or the concrete type) by id.
- Theme: `getActiveTheme()` returns `"light"` / `"dark"` (also passed as a `theme` query parameter) - switch your stylesheet accordingly.
- The library also fires `ftrackWidgetLoad` / `ftrackWidgetUpdate` events on `window`, and is available as the global `ftrackWidget` when loaded as UMD.

## Talking back to ftrack

| Function | Effect |
|---|---|
| `openSidebar(entityType, entityId)` | Open the ftrack sidebar for an entity |
| `navigate(entityType, entityId, module)` | Navigate the web app (e.g. module `"project"`) |
| `openActions(selection)` | Open the actions window for `[{ id, type }]` |
| `openPreview(componentId)` | Open the media player for a component |
| `closeWidget()` | Close the window when shown from an action |

## Data for charts

Let the server aggregate - one `group by` call instead of downloading every task (details in ftrack-query):

```javascript
const [counts, statuses] = await session.call(
  [
    operation.query(expression`select count(id), status_id from Task where project_id is "${projectId}" group by status_id`),
    operation.query("select id, name, color from Status"),
  ],
  { additionalHeaders: { "ftrack-strict-api": "true" } }
);
```

Use `decodeDatesAsIso: true` for date fields, pass an `AbortController` signal from effects, and keep one session per widget. Any chart library works (Recharts, Chart.js, ...); status colours come from `Status.color`.

## Reference files

Files are under `${CLAUDE_SKILL_DIR}`. Read only what the question needs.

| File | Read when |
|---|---|
| [references/widget-protocol.md](references/widget-protocol.md) | Raw postMessage topics and payloads (no library), credentials object, theme, action widgets |
| [examples/javascript/status-widget.jsx](examples/javascript/status-widget.jsx) | React widget: bootstrapping, project from context, status chart from `group by`, open sidebar |

Docs: https://developer.ftrack.com/extending-ftrack/widgets, https://developer.ftrack.com/extending-ftrack/react_widget, https://www.npmjs.com/package/@ftrack/web-widget.
