# ftrack-action-handler reference

Source: `source/ftrack_action_handler/action/base.py` and `advanced.py` in https://github.com/ftrackhq/ftrack-action-handler, and https://developer.ftrack.com/extending-ftrack/ftrack-action-handler/using.

Install: `pip install ftrack-action-handler` (needs `ftrack-python-api`).

## BaseAction

Class attributes:

| Attribute | Meaning |
|---|---|
| `identifier` | Required. Unique id; launch events are matched on it |
| `label` | Required. Shown in the actions menu |
| `variant` | Optional. Actions with the same label and different variants are grouped |
| `description` | Optional tooltip text |
| `icon` | Optional icon URL or name |

Methods to override:

| Method | Called on | Return |
|---|---|---|
| `discover(session, entities, event)` | Every `ftrack.action.discover` | Truthy to show the action |
| `interface(session, entities, event)` | Each launch, before `launch` | List of form fields to show a form, or `None` to continue to `launch` |
| `launch(session, entities, event)` | Launch (and again after a form submit) | `True`/`False`, or `{"success": bool, "message": str}` (both keys required; a dict may also be a form/widget response) |

- `entities` is a list of `(entity_type, entity_id)` tuples translated to API names using the session schemas. Hierarchy items (Task, Shot, Sequence...) arrive as `"TypedContext"`; `session.get("TypedContext", id)` returns the concrete entity.
- `event` is the raw event; form values are in `event["data"]["values"]`, the user in `event["source"]["user"]` (`id`, `username`).
- `register(standalone=False)` subscribes to `topic=ftrack.action.discover` and `topic=ftrack.action.launch and data.actionIdentifier=<identifier>`. With `standalone=True` it also calls `session.event_hub.wait()`. It never connects the hub: use `ftrack_api.Session(auto_connect_event_hub=True)`.
- `self.session` and `self.logger` are available.

## AdvancedBaseAction

`AdvancedBaseAction(session, limit_to_user=None, make_unique=False)` extends `BaseAction`:

| Attribute | Effect |
|---|---|
| `allowed_roles` | Security role names (any match) allowed to see the action |
| `allowed_groups` | Group names allowed. **Broken in the current release**: the check never passes, so the action is hidden from everyone. Use `allowed_roles` or check group membership in your own `discover` |
| `allowed_types` / `ignored_types` | Concrete entity type names (`Shot`, `Task`, `AssetVersion`...) every selected item must / must not be |
| `allow_empty_context` | Show the action with nothing selected |
| `limit_to_user` | Only this username sees it; the identifier gets a unique suffix |
| `run_as_user` | Launch with a new session acting as the clicking user (requires the server to use a global API key) |
| `make_unique=True` | Append a UUID to the identifier |

These checks run inside discover and cost queries on every menu open (the user, groups, and one lookup per selected item), so keep the number of `AdvancedBaseAction`s on a busy server reasonable. `discover` is still called afterwards; its default here returns `True`, so you only override it for extra checks.

Environment: `FTRACK_ACTION_PREFIX` prefixes the label and identifier (useful to separate dev and production servers).

Helpers:

| Method | Purpose |
|---|---|
| `get_action_user(event)` | `User` entity of the person who clicked |
| `create_job(event, description)` | Create a running `Job` for the user; returns its id |
| `mark_job_as_done(job_id, description)` / `mark_job_as_failed(job_id, message)` | Finish the job |
| `attach_component_to_job(job_id, component_id, description)` | Attach a file (e.g. a report) for the user to download and mark done |
| `read_settings_from_user(event)` / `write_settings_to_user(event, settings)` | Persist per-user settings for the action |

## Raw payloads

Discover (`ftrack.action.discover`):

```python
event["data"] = {"selection": [{"entityId": "...", "entityType": "task"}]}
# reply
{"items": [{"label": "...", "actionIdentifier": "...", "variant": "...", "description": "...", "icon": "...", "actionData": {...}}]}
```

Launch (`ftrack.action.launch`):

```python
event["data"] = {"actionIdentifier": "...", "actionData": {...},
                 "selection": [{"entityId": "...", "entityType": "task"}],
                 "values": {...}}   # only after a form submit
```

Selections use legacy lower-case `entityType` names (`task` for hierarchy items, `assetversion`, `show`...).
