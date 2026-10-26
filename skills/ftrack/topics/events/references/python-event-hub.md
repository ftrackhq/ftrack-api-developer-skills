# Python EventHub reference

Sources: https://developer.ftrack.com/api-clients/python/handling-events and `source/ftrack_api/event/hub.py` in https://github.com/ftrackhq/ftrack-python.

`session.event_hub` exists on every session; it connects only with `ftrack_api.Session(auto_connect_event_hub=True)` or `session.event_hub.connect()`.

## Methods

| Method | Notes |
|---|---|
| `connect()` | Raises `ftrack_api.exception.EventHubConnectionError` if already connected or it fails |
| `connected` | Property |
| `disconnect(unsubscribe=True, reconnect=False)` | |
| `reconnect(attempts=10, delay=5)` | Manual reconnect. Automatic reconnection after an unexpected drop uses 30 attempts, 10 s apart |
| `wait(duration=None)` | Block and process events; `duration` in seconds. Events queue in a background thread as soon as the hub connects, so the first `wait()` may process a burst |
| `subscribe(subscription, callback, subscriber=None, priority=100)` | Returns the subscriber id. Lower `priority` runs first |
| `unsubscribe(subscriber_identifier)` | |
| `get_subscriber_by_identifier(identifier)` | |
| `publish(event, synchronous=False, on_reply=None, on_error="raise")` | `synchronous=True` calls only local handlers and returns their results as a list. `on_error="ignore"` swallows publish errors |
| `publish_reply(source_event, data, source=None)` | Manual reply (returning a value from the handler does this for you) |

## Events

```python
import ftrack_api.event.base

event = ftrack_api.event.base.Event(
    topic="my-company.some-topic",
    data={"key": "value"},
    source={"applicationId": "maya"},           # optional; hub fills id, user.username, host
    target="id=my-custom-subscriber-id",        # optional routing expression
)
```

Events behave like dictionaries (`event["data"]`, `event["source"]`). In a handler, `event.stop()` prevents lower-priority local handlers from running (other processes still receive the event).

## Subscriber information

```python
session.event_hub.subscribe(
    "topic=ftrack.update",
    callback,
    subscriber={"id": "my-unique-subscriber-id", "applicationId": "maya"},
)
```

Targets on published events filter against this information.

## Expressions

Used for subscriptions and targets: `key=value` terms joined with `and` / `or` / `not`, nested keys with dots, one trailing `*` wildcard per value. Comparison operators: `=`, `!=`, `>`, `>=`, `<`, `<=`.

```text
topic=ftrack.location.component-added and data.locationId=london
topic=ftrack.*
topic=ftrack.update and data.pushToken!=TESTING
```

A missing key never matches.

## Push tokens

Tag events caused by your own session so you can ignore them:

```python
session = ftrack_api.Session(headers={"ftrack-pushtoken": "my-listener"}, auto_connect_event_hub=True)
session.event_hub.subscribe("topic=ftrack.update and data.pushToken!=my-listener", callback)
```

## Plugins

A plugin is a `.py` file with `register(session, **kw)`. The session imports every plugin found under `plugin_paths` / `FTRACK_EVENT_PLUGIN_PATH` (searched recursively, `os.pathsep`-separated) and calls `register`. Check `isinstance(session, ftrack_api.Session)` first, because other hosts (older APIs, ftrack Connect) may call `register` with something else. Extra keyword arguments come from `Session(plugin_arguments={...})`.

## Threading

Handlers run from the hub's processing loop, one event at a time. A slow handler delays all following events. Use the session passed via `functools.partial`; don't share one session across threads you start yourself.
