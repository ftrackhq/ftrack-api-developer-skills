# ftrack sessions

All communication with ftrack goes through a `Session`. The two official clients behave differently:

| | Python `ftrack_api` | JavaScript `@ftrack/api` |
|---|---|---|
| Writes | Staged locally, sent on `session.commit()` | Sent immediately by `create`/`update`/`delete` |
| Missing attributes | Auto-fetched on access (one request each) | Never fetched - only what you projected |
| Cache | In-memory entity cache, configurable | None |
| Paging | Automatic while iterating | Manual (`metadata.next.offset`) |
| Close | `session.close()` or `with` block | No `close()` - just drop the reference |

## Python

```python
import ftrack_api

# Reads FTRACK_SERVER, FTRACK_API_USER, FTRACK_API_KEY
with ftrack_api.Session() as session:
    task = session.query('select name, status.name from Task where id is "{0}"'.format(task_id)).one()
    task['name'] = 'comp_v2'
    session.commit()          # one request, one server transaction
```

Explicit credentials: `ftrack_api.Session(server_url=..., api_user=..., api_key=...)`.

Useful arguments (all optional): `auto_connect_event_hub=False` (default; only enable when subscribing to events), `strict_api=False`, `timeout=60` (seconds per request), `auto_populate=True`, `cache=`, `plugin_paths=`, `plugin_arguments=`, `schema_cache_path=`, `headers=`.

**Unit of work.** `create`, attribute assignment and `delete` only record operations. `commit()` sends them as one batch in a single transaction; if it fails, nothing is applied **and the operations stay recorded** - call `session.rollback()` before retrying or continuing. Queries always hit the server, so uncommitted creates don't show up in query results.

```python
try:
    session.commit()
except ftrack_api.exception.ServerError:
    session.rollback()
    raise
```

**Errors** (`ftrack_api.exception`): any server-side failure (bad query syntax, permission, validation, bad credentials) is raised as `ServerError` with the server's exception name in the message. `.one()` raises `NoResultFoundError` / `MultipleResultsFoundError`. Network problems and timeouts are `requests.exceptions.ConnectionError` / `requests.exceptions.Timeout`. Only retry those and transient 5xx errors, never `ServerError` caused by a bad query or permissions.

## JavaScript

```javascript
import { Session, error } from "@ftrack/api";

const session = new Session(serverUrl, apiUser, apiKey, {
  // autoConnectEventHub: false (default), strictApi: false (default)
});
await session.initializing;   // rejects if the server or credentials are wrong

try {
  const { data } = await session.query('select name from Project');
} catch (e) {
  if (e instanceof error.ServerPermissionDeniedError) { /* bad credentials or no permission */ }
  else if (e instanceof error.ServerValidationError) { /* invalid data */ }
  else if (e instanceof error.ServerError) { /* other server error, see e.message */ }
  else throw e;
}
```

The package has **named exports only** - `import ftrack from "@ftrack/api"` doesn't work, use `import { Session } from "@ftrack/api"`. Calls made before initialization finishes wait for it automatically, but awaiting `session.initializing` surfaces connection errors early.

Each `create`/`update`/`delete` is its own request. For atomic multi-step changes, send them together with `session.call([operation.create(...), operation.update(...)])` - one transaction, all or nothing.

## Rules

1. **Never hard-code API keys.** Read them from the environment or a secret store. Never ship a key in browser code - dashboard widgets receive the current user's credentials from ftrack (see the `dashboards` topic).
2. **Don't connect the event hub unless you subscribe or publish** - it costs server resources even when idle.
3. **Reuse one session** per script, process or web app. Creating one downloads server information and schemas.
4. **Python: project what you read** to avoid one auto-populate request per attribute (see the `query` topic).
5. **Python: commit in batches**, not once per entity in a loop.
6. **Python: `session.reset()`** clears the local cache in long-running processes that need fresh data. Entities obtained before the reset must not be reused.
7. **Use a global API key with a restricted role** for scripts and services instead of a personal key.

## Reference files

Files are under `${CLAUDE_SKILL_DIR}/topics/session`. Read only what the question needs.

| File | Read when |
|---|---|
| [references/python-session.md](references/python-session.md) | All Python Session arguments, environment variables, unit of work details, notes (`create_note`), auto-population, caching (file cache, selective cache), plugins, schema cache, SSL/proxy, exception list |
| [references/javascript-session.md](references/javascript-session.md) | JavaScript constructor options, initialization, batching with `session.call`, strict mode per call, dates (Moment/dayjs vs ISO), cancellation, error classes |
| [references/authentication.md](references/authentication.md) | Personal vs global API keys, API key roles and project access, raw HTTP authentication headers |
| [examples/python/session_examples.py](examples/python/session_examples.py) | Runnable Python: connect, commit/rollback, retry on network errors, persistent cache, strict session |
| [examples/javascript/session-examples.js](examples/javascript/session-examples.js) | Runnable JavaScript: connect, error classes, atomic `session.call`, cancellation, ISO dates |

Online source of truth: https://developer.ftrack.com/api-clients/python/understanding-sessions, https://developer.ftrack.com/api-clients/python/caching, https://developer.ftrack.com/api-clients/client-comparison, https://developer.ftrack.com/api/authentication.
