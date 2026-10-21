# Action user interfaces

Source: https://developer.ftrack.com/extending-ftrack/actions (User interface section).

A launch handler (or `interface()` in `BaseAction`) can answer with one of three responses.

## Message

```python
{"success": True, "message": "Ran my custom action successfully!", "type": "message"}
```

`type` defaults to a message when you return just `success` and `message`.

## Form

```python
{
    "type": "form",
    "title": "Foobar",
    "submit_button_label": "Save",
    "items": [ ... ],
    "width": 1280,    # optional, pixels
    "height": 800,    # optional, pixels
}
```

Returning `{"items": [...]}` also shows a form. After submit, the UI publishes `ftrack.action.launch` again with the same `actionIdentifier` and selection plus `data.values` = `{field_name: value}`. Keep actions stateless: put anything you need later into `hidden` fields.

### Field types

All input fields take `name` (key in `values`), `label`, and an optional default `value`.

| `type` | Notes |
|---|---|
| `text` | Single line string. `empty_text` sets placeholder text |
| `textarea` | Multi-line string |
| `number` | Number |
| `boolean` | `True` / `False` |
| `date` | ISO date string, e.g. `datetime.date.today().isoformat()` |
| `enumerator` | Dropdown; `data: [{"label": "Option 1", "value": "opt1"}, ...]`; `multi_select: True` for several values |
| `label` | Display-only Markdown in `value`; no `name` or `label` |
| `hidden` | Invisible value passed back on submit |

```python
items = [
    {"type": "label", "value": "## Rename items"},
    {"type": "enumerator", "label": "Attribute", "name": "attribute",
     "value": "name", "data": [{"label": "Name", "value": "name"},
                               {"label": "Description", "value": "description"}]},
    {"type": "text", "label": "Find", "name": "find"},
    {"type": "text", "label": "Replace", "name": "replace"},
    {"type": "hidden", "name": "step", "value": "confirm"},
]
```

## Widget

Show your own HTML page in an iframe:

```python
{"type": "widget", "url": "https://my-server/widget.html", "title": "Foobar", "payload": {"foo": "bar"}}
```

The page receives an `ftrack.widget.load` message with the selection, the current user's credentials and your payload:

```javascript
{
  topic: "ftrack.widget.load",
  data: {
    selection: [{ id: "TASK-ID", type: "TypedContext" }],
    credentials: { serverUrl: "https://...", apiUser: "username", apiKey: "..." },
    payload: { foo: "bar" },
  },
}
```

Serve widgets over HTTPS (same protocol as ftrack). See ftrack-dashboards for building widget pages with `@ftrack/web-widget`.

## Triggering a UI without a launch

Any process can show a message, form or widget to a user by publishing `ftrack.action.trigger-user-interface` (supported by the web UI only):

```python
session.event_hub.publish(
    ftrack_api.event.base.Event(
        topic="ftrack.action.trigger-user-interface",
        data={"type": "message", "success": True, "message": "Good job adding a timelog!"},
        target='applicationId=ftrack.client.web and user.id="{0}"'.format(user_id),
    ),
    on_error="ignore",
)
```

Forms and widgets triggered this way also need `actionIdentifier` (the action to launch on submit) and `selection` in `data`.
