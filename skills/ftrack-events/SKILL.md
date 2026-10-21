---
name: ftrack-events
description: ftrack event hub and webhooks for Python and JavaScript - subscribing to ftrack.update and other topics, the update payload (legacy entityType/keys names, changes), event listener plugins with register(session), replies, publishing, targeting, priorities, pushToken loop prevention, user notifications, and server-side webhooks/automations as an alternative to a listener.
when_to_use: "Code signals: `session.event_hub`, `session.eventHub`, `event_hub.subscribe(`, `event_hub.wait()`, `event_hub.publish(`, `ftrack_api.event.base.Event`, `new Event(` from `@ftrack/api`, `topic=ftrack.update`, `topic=ftrack.*`, `event['data']['entities']`, `entityType`, `statusid` keys, `auto_connect_event_hub=True`, `FTRACK_EVENT_PLUGIN_PATH`, plugin files with `def register(session, **kw)`, `Automation` / `Trigger` / `WebhookAction` entities. Requests like \"listen for status changes in ftrack\", \"react when a version is published\", \"ftrack event listener\", \"cascade status to the shot\", \"ftrack webhook\", \"notify the user in ftrack\". For custom actions use ftrack-actions."
---

# ftrack events

Events are published when things change in ftrack (`ftrack.update`), when the UI asks for actions (`ftrack.action.*`, see ftrack-actions), when paths need resolving (`ftrack.location.*`), and by your own code. Clients connect to the event server over WebSocket through `session.event_hub` (Python) / `session.eventHub` (JavaScript).

## Python listener (canonical layout)

```python
import functools
import logging
import ftrack_api

logger = logging.getLogger("my_company.status_listener")


def on_update(session, event):
    for entity in event["data"].get("entities", []):
        if entity.get("entityType") != "task" or "statusid" not in entity.get("keys", []):
            continue
        task = session.query(
            'select name, status.name, parent.name from TypedContext where id is "{0}"'.format(entity["entityId"])
        ).first()
        if task:
            logger.info("%s is now %s", task["name"], task["status"]["name"])


def register(session, **kw):
    # Plugin entry point; also called by ftrack Connect and other hosts.
    if not isinstance(session, ftrack_api.Session):
        return
    session.event_hub.subscribe("topic=ftrack.update", functools.partial(on_update, session))


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    session = ftrack_api.Session(auto_connect_event_hub=True)
    register(session)
    session.event_hub.wait()   # blocks; Ctrl-C to stop, or wait(duration=seconds)
```

Load it as a plugin by putting the file in a directory on `FTRACK_EVENT_PLUGIN_PATH` (or `Session(plugin_paths=[...])`), or run it directly. `auto_connect_event_hub=True` is required for listeners (default is off).

## The `ftrack.update` payload

```python
event["data"]["entities"] = [{
    "action": "update",            # add | update | remove | move (task reparented); "encoded" for versions
    "entityId": "eb16...",
    "entityType": "task",          # legacy lower-case name, NOT the API entity type
    "keys": ["statusid"],          # legacy attribute names that changed
    "changes": {"statusid": {"old": "44dd...", "new": "44dd..."}},
    "parents": [{"entityId": "5671...", "entityType": "show"}, ...],
}]
event["source"]["user"]["id"]      # user who made the change (may be missing)
```

| Legacy `entityType` | API entity |
|---|---|
| `task` | Any TypedContext: Task, Shot, Sequence, Folder, Milestone... |
| `show` | Project |
| `assetversion` | AssetVersion |

Keys use legacy column names (`statusid`, `thumbid`, `name`, ...). Filter on `entityType`, `action` and `keys` **before** querying, then query with the API name (`TypedContext`, `AssetVersion`) and project what you need. `changes` gives old/new values without a query.

## Subscriptions

`'topic=ftrack.update'`, `'topic=ftrack.*'` (trailing wildcard), `'topic=ftrack.update and source.user.username=jane'`, `'topic=ftrack.update and data.pushToken!=my-script'`. Python supports `and`/`or`/`not` and nested keys; **JavaScript only supports `topic=...`** - filter the rest in the callback.

## Rules

1. **Don't trigger yourself in a loop.** A listener that updates entities receives its own update events. Set a push token on the session (`ftrack_api.Session(headers={"ftrack-pushtoken": "my-listener"}, auto_connect_event_hub=True)`) and subscribe with `and data.pushToken!=my-listener`, or compare old/new values and skip no-op updates.
2. **Commit once per event and roll back on failure** (`session.rollback()` in `except`), otherwise failed operations are resent with the next event.
3. **Keep handlers fast**; events queue while a handler runs. Offload slow work.
4. **Use a dedicated service session** (global API key with a limited role) for long-running listeners, and run them under a process supervisor: the Python hub retries a lost connection 30 times, 10 seconds apart, then gives up.
5. **Only connect the hub when you need events.**

## Replies, publishing, notifications

```python
def on_event(event):
    return {"success": True, "message": "Done"}       # returned value is sent as a reply

session.event_hub.publish(
    ftrack_api.event.base.Event(topic="my-company.topic", data={"key": "value"}),
    on_reply=lambda reply: print(reply["data"]),
)

# Pop up a message for a user in the web UI
session.event_hub.publish(
    ftrack_api.event.base.Event(
        topic="ftrack.action.trigger-user-interface",
        data={"type": "message", "success": True, "message": "Shot status updated"},
        target='applicationId=ftrack.client.web and user.id="{0}"'.format(user_id),
    ),
    on_error="ignore",
)
```

JavaScript equivalents (`subscribe`, `publish`, `publishAndWaitForReply`, `new Event(topic, data)`) are in ftrack-javascript.

## Webhooks instead of a listener

ftrack 24.6+ (cloud only) can POST entity events to an `https://` URL - no long-running process needed. Create an `Automation`, a `Trigger` with a filter such as `entity.entity_type = "Task" and entity.operation = "create"`, and a `WebhookAction` with `webhook_url`. Payloads use API names (`entity.entity_type`, `entity.new`, `entity.old`). Limits: create/update only, 10 enabled webhooks. Details: [references/webhooks.md](references/webhooks.md).

## Reference files

Files are under `${CLAUDE_SKILL_DIR}`. Read only what the question needs.

| File | Read when |
|---|---|
| [references/event-topics.md](references/event-topics.md) | Payloads and expected replies for server topics (`ftrack.update`, `ftrack.action.*`, `ftrack.location.*`, `ftrack.dynamic-enumerator`, `ftrack.connect`) and Python API session events |
| [references/python-event-hub.md](references/python-event-hub.md) | Full Python EventHub API: subscribe/priority/stop, publish (synchronous, on_reply, on_error), targeting, expressions, pushToken, plugins |
| [references/webhooks.md](references/webhooks.md) | Webhook payload, trigger filter syntax, creating automations from Python/JavaScript, permissions |
| [examples/python/cascade_status_listener.py](examples/python/cascade_status_listener.py) | Runnable listener: task status -> shot status, loop prevention, rollback, user notification (based on ftrack-recipes) |
| [examples/javascript/event-listener.js](examples/javascript/event-listener.js) | Runnable Node.js listener with topic subscription and filtering in the callback |

More working listeners: https://github.com/ftrackhq/ftrack-recipes/tree/main/python/events. Docs: https://developer.ftrack.com/api-clients/python/handling-events, https://developer.ftrack.com/websocket-events/event-list, https://developer.ftrack.com/extending-ftrack/webhooks.
