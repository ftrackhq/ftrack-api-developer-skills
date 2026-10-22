# Widget protocol

Sources: https://developer.ftrack.com/extending-ftrack/widgets, https://developer.ftrack.com/extending-ftrack/actions (Widget section), `@ftrack/web-widget` 1.6.6 type definitions.

`@ftrack/web-widget` wraps these `window.postMessage` messages. Use them directly if you can't use the library.

## Widget -> ftrack

```javascript
{ topic: "ftrack.widget.ready" }                                               // ftrack answers with ftrack.widget.load
{ topic: "ftrack.application.open-sidebar", data: { id, type: "TypedContext" } }
{ topic: "ftrack.application.open-actions", data: { selection: [{ id, type: "TypedContext" }] } }
{ topic: "ftrack.application.navigate", data: { id, type: "TypedContext", module: "project" } }
```

## ftrack -> widget

```javascript
{
  topic: "ftrack.widget.load",
  data: {
    credentials: { serverUrl: "https://x.ftrackapp.com", apiUser: "jane", apiKey: "...", csrfToken: "..." },
    theme: "dark",                                  // or "light"
    entity: { id: "...", type: "TypedContext" },    // dashboards/overview: the current entity, if any
    selection: [{ id: "...", type: "TypedContext" }],   // action widgets: the selection
    payload: { ... },                               // action widgets: the payload the action returned
  },
}

{ topic: "ftrack.widget.update", data: { entity: { id, type } } }   // outliner navigation under a project
```

Credentials are always present; `entity` or `selection` depend on where the widget is shown. Entity types use API names; hierarchy objects are `TypedContext`.

## Library mapping

| Library | Protocol |
|---|---|
| `initialize({ onWidgetLoad, onWidgetUpdate })` | Sends `ftrack.widget.ready`, handles `load` / `update` |
| `getCredentials()`, `getEntity()`, `getActiveTheme()` | Values from the last `ftrack.widget.load` |
| `openSidebar(type, id)`, `openActions(selection)`, `navigate(type, id, module)` | `ftrack.application.*` messages |
| `openPreview(componentId)`, `closeWidget()` | Open the player / close an action window |

## Hosting notes

- HTTPS, same protocol as the ftrack workspace; URL must be in the allowed widget URLs.
- A dashboard with a single Web view widget stretches to the full height.
- Action widgets can set `width` / `height` in the action response.
- The page is an iframe: it must allow framing by your ftrack domain (no `X-Frame-Options: DENY`; set `frame-ancestors` in a CSP to the workspace URL if you use one).
