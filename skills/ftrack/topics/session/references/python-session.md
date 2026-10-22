# Python session reference (`ftrack_api`)

Sources: https://developer.ftrack.com/api-clients/python/understanding-sessions, /caching, /environment-variables, /security-and-authentication, and `source/ftrack_api/session.py` in https://github.com/ftrackhq/ftrack-python.

Install: `pip install ftrack-python-api`.

## Constructor

```python
ftrack_api.Session(
    server_url=None,            # else FTRACK_SERVER
    api_key=None,               # else FTRACK_API_KEY (or legacy FTRACK_APIKEY)
    api_user=None,              # else FTRACK_API_USER, else getpass.getuser()
    auto_populate=True,         # fetch missing attribute values on access
    plugin_paths=None,          # else FTRACK_EVENT_PLUGIN_PATH
    cache=None,                 # cache instance or callable(session) -> cache
    cache_key_maker=None,
    auto_connect_event_hub=False,
    schema_cache_path=None,     # else FTRACK_API_SCHEMA_CACHE_PATH
    plugin_arguments=None,      # dict passed to plugin register() functions
    timeout=60,                 # seconds per HTTP request
    cookies=None,
    headers=None,               # extra HTTP headers on every request
    strict_api=False,           # sends ftrack-strict-api header; needed for group by
)
```

Creating a session downloads server information and schemas, so reuse one per process. Multiple sessions (even to different servers) can coexist in one process.

`with ftrack_api.Session() as session:` closes the session on exit; otherwise call `session.close()`. `session.closed` reports state.

## Environment variables

| Variable | Purpose |
|---|---|
| `FTRACK_SERVER` | Server URL, e.g. `https://mycompany.ftrackapp.com` |
| `FTRACK_API_USER` | Username to act as |
| `FTRACK_API_KEY` | API key (`FTRACK_APIKEY` accepted for backwards compatibility) |
| `FTRACK_EVENT_PLUGIN_PATH` | Plugin directories, separated by `os.pathsep` |
| `FTRACK_API_SCHEMA_CACHE_PATH` | Directory for the cached schema |
| `HTTP_PROXY` / `HTTPS_PROXY` | Proxy for requests (e.g. `HTTPS_PROXY=http://proxy.mycompany.com:8080`) |
| `REQUESTS_CA_BUNDLE` | CA bundle for servers with self-signed certificates |

## Unit of work

```python
user = session.create('User', {'username': 'jane'})
user['email'] = 'jane@example.com'
other = session.create('User', {'username': 'bjorn'})
session.commit()
```

- Operations are recorded in `session.recorded_operations` and sent on `commit()`. Commit compresses them (a create followed by updates on the same entity becomes one create).
- The whole batch runs in one server transaction: all or nothing.
- **On failure the recorded operations are kept.** Call `session.rollback()` to discard them and detach uncommitted new entities; don't reuse those entity objects afterwards.
- Queries are always sent immediately and don't see uncommitted creates. Results are merged with local changes, so a modified-but-uncommitted value stays visible on the entity.
- Relationship attributes take entity objects: `task['status'] = status` (or set the `*_id` attribute to an id).

## Notes

Entities with a `notes` relation (tasks, versions, ...) have `create_note(content, author, recipients=None, category=None, labels=None)`:

```python
user = session.query('User where username is "{0}"'.format(session.api_user)).one()
note = task.create_note("Looks good", author=user, recipients=[reviewer])   # users or groups
session.commit()
```

- Stages the Note and its `Recipient` links; nothing is saved until `commit()`.
- `labels` takes `NoteLabel` entities (servers with NoteLabel support); `category` is the older single-category form, deprecated where NoteLabel exists. Passing both raises `ValueError`.
- Reply to a note with `note.create_reply(content, author)`.

Source: `ftrack_api/entity/note.py` (ftrack-python-api 3.1.0).

## Auto-population

Accessing an attribute that isn't loaded sends a request to fetch it. Convenient in small scripts, slow in loops: project attributes in the query instead (see the `query` topic).

```python
with session.auto_populating(False):
    print(user['email'])     # ftrack_api.symbol.NOT_SET if not loaded
```

Also `session.auto_populate = False` for the whole session. `session.populate(entities, 'name, status.name')` batch-loads attributes for entities you already have.

## Caching

Each session has a `LayeredCache`: an in-memory cache on top, plus any cache you pass. `session.get('User', user_id)` returns the cached instance without a request if it is already loaded.

Persistent file cache shared between runs:

```python
import os, tempfile
import ftrack_api, ftrack_api.cache

cache_path = os.path.join(tempfile.gettempdir(), 'ftrack_session_cache.dbm')

def cache_maker(session):
    return ftrack_api.cache.SerialisedCache(
        ftrack_api.cache.FileCache(cache_path),
        encode=session.encode,
        decode=session.decode,
    )

session = ftrack_api.Session(cache=cache_maker)
```

Serialising to disk has a cost; measure before adopting. To avoid persisting uncommitted data, wrap the cache in a `ftrack_api.cache.ProxyCache` subclass that skips entities whose `ftrack_api.inspection.state(entity)` is `ftrack_api.symbol.CREATED`, and encode with `functools.partial(session.encode, entity_attribute_strategy='persisted_only')`.

Custom backends implement `ftrack_api.cache.Cache` (`get`, `set`, `remove`).

`session.reset()` clears local state and cache - use it in long-running services that need fresh data. Entity objects from before the reset are invalid.

## Entity types and schema

```python
print(session.types.keys())                       # entity types on this server
isinstance(entity, session.types['Project'])      # classes are built per session
{schema['id'] for schema in session.schemas}      # raw schemas
```

Set `schema_cache_path` (or `FTRACK_API_SCHEMA_CACHE_PATH`) to avoid re-downloading schemas on every start.

## Plugins

Plugins are Python files exposing `register(session, **kwargs)`, discovered from `plugin_paths` or `FTRACK_EVENT_PLUGIN_PATH`. They typically subscribe to session events, e.g. to configure locations:

```python
def configure_locations(event):
    session = event['data']['session']
    ...

def register(session, **kw):
    session.event_hub.subscribe('topic=ftrack.api.session.configure-location', configure_locations)
```

Extra values for `register` come from `Session(plugin_arguments={...})`.

## Strict mode

`strict_api=True` sends `ftrack-strict-api: true` on every request: only projected attributes are returned, `group by`/aggregates work (via `session.call`), and `$custom_attribute` syntax is rejected. Use a separate strict session for aggregation if the rest of the code relies on default behaviour.

## Exceptions

From `ftrack_api.exception` (all subclass `ftrack_api.exception.Error`):

| Exception | Raised when |
|---|---|
| `ServerError` | Any error returned by the server: parse errors, permission denied, validation, invalid credentials. The message contains the server exception name and details. |
| `ServerCompatibilityError` | The server version doesn't support the client |
| `NoResultFoundError` / `MultipleResultsFoundError` | `.one()` found zero / several results (both subclass `IncorrectResultError`) |
| `NotFoundError`, `NotUniqueError` | Lookup helpers found nothing / more than one |
| `ImmutableAttributeError` | Assigning to an immutable attribute such as `id` |
| `OperationError`, `InvalidStateError` | Invalid local operation |
| `EventHubConnectionError` | Event hub connection failed |
| `LocationError` and subclasses | Component/location problems (see the `files` topic) |

Not wrapped by the client: `requests.exceptions.ConnectionError` and `requests.exceptions.Timeout` for network failures. Retry these (with backoff) and transient 5xx errors; don't retry errors caused by bad queries, permissions or validation.
