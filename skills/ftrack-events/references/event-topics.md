# Event topics

Sources: https://developer.ftrack.com/websocket-events/event-list and https://developer.ftrack.com/api-clients/python/event-list.

Every event has the shape `{"topic": ..., "data": {...}, "source": {...}, "target": "optional expression"}`. Events go through the event server as JSON over socket.io (namespace `ftrack.event`), except synchronous Python API events, which stay inside the session.

## Server events

### `ftrack.update`

Published when entities change.

```python
data = {"entities": [{
    "action": "update",          # add | update | remove | move | encoded (AssetVersion media encoded)
    "entityId": "eb16970c-...",
    "entityType": "task",        # legacy names: task (any TypedContext), show (Project), assetversion, ...
    "keys": ["statusid"],        # legacy attribute names: statusid, thumbid, name, ...
    "changes": {"statusid": {"old": "44ddd0fe-...", "new": "44dd9fb2-..."}},
    "parents": [{"entityId": "5671dcb0-...", "entityType": "show"}],
}]}
source = {"user": {"id": "...", "username": "..."}, ...}
```

`move` is sent when a task's parent changes. `data.pushToken` is present when the change came from a session that set the `ftrack-pushtoken` header.

### `ftrack.action.discover`

The web UI asks for available actions. Reply with `{"items": [{"label", "actionIdentifier", "variant"?, "description"?, "icon"?, "actionData"?}]}`.

```python
data = {"context": {"selection": [{"entityId": "...", "entityType": "task"}]}}
```

### `ftrack.action.launch`

A user ran an action. `data` holds `actionIdentifier`, `actionData`, `context.selection` and, after a form, `values`. Reply with `{"success": True, "message": "..."}` or a form (`{"items": [...]}`). See ftrack-actions.

### `ftrack.action.trigger-user-interface`

Publish to show UI in the web client for a user (only supported by `applicationId ftrack.client.web`):

```python
Event(
    topic="ftrack.action.trigger-user-interface",
    data={"type": "message", "success": True, "message": "A message to the user."},
    target='applicationId=ftrack.client.web and user.id="USER-ID"',
)
```

Form and widget types also need `actionIdentifier` and `selection`.

### `ftrack.location.request-resolve`

The server needs a filesystem path for a component in a location (e.g. the components widget):

```python
data = {"locationName": "london", "componentId": "...", "platform": "Linux", "serverUrl": "..."}
# reply: {"path": "/fully/resolved/path"}
```

### `ftrack.location.component-added` / `ftrack.location.component-removed`

Published by the Python API when a component is added to or removed from a location: `data = {"component_id": ..., "location_id": ...}` (the server event list documents `componentId`/`locationId`; handle both).

### `ftrack.dynamic-enumerator`

The server wants options for a dynamic enumerator custom attribute:

```python
data = {"attributeName": "my_dynamic_enumerator",
        "recordData": {"entity": {"entityType": "task", "entityId": "..."}, "changes": {}},
        "query": "", "sorters": [], "groupers": [], "filters": [...]}
# reply: [{"name": "Menu item name", "value": "menu_item_value"}, ...]
```

### `ftrack.connect`

The server asks ftrack Connect to do something, e.g. `data = {"action": "start", "plugin": "publish", "entity": {"entityId": ..., "entityType": "task"}}`.

## Python API session events (synchronous, local)

Subscribe to these in plugins loaded by the session. Return values are passed back directly.

| Topic | `data` | Expected return |
|---|---|---|
| `ftrack.api.session.configure-location` | `{"session": session}` | Nothing; configure location accessors/structures (see ftrack-files) |
| `ftrack.api.session.construct-entity-type` | `{"schema": ..., "schemas": ...}` | A Python class for the entity type |
| `ftrack.api.session.get-file-type-from-string` | `{"file_path": ...}` | File extension string, e.g. for `a_file.geo.bz` |
| `ftrack.api.session.ready` | `{"session": session}` | Nothing; runs during initialization, keep it fast |
| `ftrack.api.session.reset` | `{"session": session}` | Nothing |
