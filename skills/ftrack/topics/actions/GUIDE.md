# ftrack actions

An action appears in the ftrack web UI's actions menu for a selection. When the UI opens the menu it publishes `ftrack.action.discover`; every running action server replies with the actions it offers. When the user clicks one, the UI publishes `ftrack.action.launch` and the server runs it and replies with a message, a form, or a widget.

Actions run in **your** process (an "action server"), with the permissions of that process's API key - not of the user who clicks.

## Python with ftrack-action-handler

```bash
pip install ftrack-python-api ftrack-action-handler
```

```python
import logging
import ftrack_api
from ftrack_action_handler.action import BaseAction


class SetDescription(BaseAction):
    identifier = "my-company.set-description"   # unique, stable
    label = "Set description"
    variant = None                              # same label + different variants are grouped
    description = "Set the description on the selected items"

    def discover(self, session, entities, event):
        # entities: list of (entity_type, entity_id); hierarchy items arrive as "TypedContext"
        return bool(entities) and all(t in ("TypedContext", "AssetVersion") for t, _ in entities)

    def interface(self, session, entities, event):
        if event["data"].get("values"):
            return None                         # form submitted -> launch() runs
        return [{"type": "text", "label": "Description", "name": "description"}]

    def launch(self, session, entities, event):
        text = event["data"]["values"]["description"]
        for entity_type, entity_id in entities:
            session.get(entity_type, entity_id)["description"] = text
        try:
            session.commit()
        except Exception:
            session.rollback()
            raise
        return {"success": True, "message": "Updated {0} items".format(len(entities))}


def register(session, **kw):
    if not isinstance(session, ftrack_api.Session):
        return
    SetDescription(session).register()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    session = ftrack_api.Session(auto_connect_event_hub=True)   # required: off by default
    register(session)
    session.event_hub.wait()
```

How `BaseAction` works:
- `register()` subscribes to `ftrack.action.discover` and to `ftrack.action.launch` filtered on your `identifier`. It does **not** connect the event hub - create the session with `auto_connect_event_hub=True`, or `wait()` raises `EventHubConnectionError`. (Older docs show `ftrack_api.Session()` without it; that no longer works.)
- `discover` returns truthy to show the action. `interface` returns a list of form fields (shown as a form) or `None`. `launch` returns `True`/`False` or `{"success": bool, "message": str}` (both keys required).
- Form values arrive in `event["data"]["values"]` when `launch` (and `interface`) are called again after submit.
- `AdvancedBaseAction` adds `allowed_roles`, `allowed_groups`, `allowed_types`, `ignored_types`, `allow_empty_context`, `limit_to_user`, `run_as_user`, job helpers and per-user settings. See [references/action-handler.md](references/action-handler.md).

## Responses and form fields

```python
{"success": True, "message": "Done", "type": "message"}
{"type": "form", "title": "Options", "submit_button_label": "Run", "items": [...], "width": 600, "height": 400}
{"type": "widget", "url": "https://.../widget.html", "title": "My widget", "payload": {...}}
```

Field types: `text`, `textarea`, `number`, `boolean`, `date` (ISO value), `enumerator` (`data: [{"label", "value"}]`, optional `multi_select: True`), `label` (Markdown `value` only), `hidden` (carry state between steps). Every input needs a `name`; `value` sets the default. Full details: [references/ui-forms.md](references/ui-forms.md).

## Rules

1. **Check permissions yourself.** The action runs as the server's API user; anyone who can see it can run it. Restrict in `discover`/`launch` (e.g. `AdvancedBaseAction.allowed_roles`, or check `event["source"]["user"]`).
2. **Keep `discover` fast** - it runs every time any user opens the actions menu. No heavy queries there.
3. **Long work**: reply quickly and report progress through a `Job` (see `AdvancedBaseAction.create_job`) or a message via `ftrack.action.trigger-user-interface`.
4. **Use a unique `identifier`** per action and per deployment; two servers with the same identifier both launch.
5. **Personal/dev actions**: subscribe with `and source.user.username=<you>` (or `AdvancedBaseAction(limit_to_user=...)`) so only you see them.
6. **Deploy** as a long-running service (or as a plugin on `FTRACK_EVENT_PLUGIN_PATH` loaded by ftrack Connect for user-machine actions), with a global API key and a process supervisor.

## JavaScript actions

There is no action handler library for JavaScript; subscribe to the topics directly (Node.js < 22 also needs the `ws` package for the event hub):

```javascript
session.eventHub.subscribe("topic=ftrack.action.discover", (event) => ({
  items: [{ label: "Timelogs", actionIdentifier: "my-company.timelogs" }],
}));
session.eventHub.subscribe(
  "topic=ftrack.action.launch",
  async (event) => {
    if (event.data.actionIdentifier !== "my-company.timelogs") return;   // JS can't filter on data
    if (!event.data.values) return { items: [{ type: "text", name: "comment", label: "Comment" }] };
    return { success: true, message: "Saved" };
  }
);
```

Selections arrive as `event.data.selection` with legacy `entityType` names (`task` for hierarchy items). See [examples/javascript/timelog-action.js](examples/javascript/timelog-action.js).

## Reference files

Files are under `${CLAUDE_SKILL_DIR}/topics/actions`. Read only what the question needs.

| File | Read when |
|---|---|
| [references/ui-forms.md](references/ui-forms.md) | All response types, every form field type with options, widget payload, remote UI triggering |
| [references/action-handler.md](references/action-handler.md) | BaseAction and AdvancedBaseAction attributes and methods, raw discover/launch payloads |
| [examples/python/actions.py](examples/python/actions.py) | Runnable: simple action, form with enumerator, AdvancedBaseAction with roles and a job |
| [examples/javascript/timelog-action.js](examples/javascript/timelog-action.js) | Runnable Node.js action with a form (based on ftrack-recipes) |

More working actions: https://github.com/ftrackhq/ftrack-recipes/tree/main/python/actions. Docs: https://developer.ftrack.com/extending-ftrack/actions, https://developer.ftrack.com/extending-ftrack/ftrack-action-handler/using.
