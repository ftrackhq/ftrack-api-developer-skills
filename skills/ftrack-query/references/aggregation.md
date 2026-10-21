# Aggregation with group by

Source: https://developer.ftrack.com/api-clients/examples/group-by and https://developer.ftrack.com/api-clients/python/querying.

Let the server count and sum rather than downloading every entity and counting in client code.

## Requirements

- ftrack Studio 4.12+ (`group by` on relations such as `status.name` needs 25.9+).
- A **strict** session: Python `strict_api=True`, JavaScript `{ strictApi: true }`.
- Run through **`session.call`**, not `session.query` - results are rows, not entities.
- Supported on common entities such as `Task` and `Project`. The workspace API reference (Help menu) marks which entities support `group by`.
- Functions: `count()`, `sum()`, `avg()`, `min()`, `max()`. Not on relationship attributes.

Rows come back as plain dicts keyed by the grouped attributes plus `<function>_<attribute>` (e.g. `count_id`). If unsure about a key name, print one row.

Strict mode rejects `$custom_attribute` syntax and returns only projected fields, so keep a separate strict session for aggregation if the rest of your code relies on non-strict behaviour.

## Python

```python
import ftrack_api

stats_session = ftrack_api.Session(strict_api=True, auto_connect_event_hub=False)

result = stats_session.call([{
    'action': 'query',
    'expression': (
        'select count(id), status_id from Task '
        'where project_id is "{0}" group by status_id'.format(project_id)
    ),
}])
rows = result[0]['data']     # [{'status_id': '...', 'count_id': 12}, ...]

statuses = {
    s['id']: s for s in stats_session.query(
        'select id, name, color, state.short from Status'
    )
}
chart = [
    {
        'name': statuses[r['status_id']]['name'],
        'value': r['count_id'],
        'color': statuses[r['status_id']]['color'],
    }
    for r in rows
]
```

Several dimensions: `group by project_id, status_id`.

## JavaScript

Group by is only documented for Python; the JavaScript client sends the same operation through `session.call`.

```javascript
import { Session, operation, expression } from "@ftrack/api";

const statsSession = new Session(serverUrl, apiUser, apiKey, { strictApi: true });

const [counts, statuses] = await statsSession.call([
  operation.query(
    expression`select count(id), status_id from Task where project_id is "${projectId}" group by status_id`
  ),
  operation.query("select id, name, color, state.short from Status"),
]);

const statusById = Object.fromEntries(statuses.data.map((s) => [s.id, s]));
const chart = counts.data.map((row) => ({
  name: statusById[row.status_id].name,
  value: row.count_id,
  color: statusById[row.status_id].color,
}));
```

Several operations in one `call` are sent in a single request and run in a single transaction.

## Common dashboard numbers

**Completion percentage** - group by status, then sum by state:

```python
done = sum(r['count_id'] for r in rows if statuses[r['status_id']]['state']['short'] == 'DONE')
total = sum(r['count_id'] for r in rows)
pct = 100.0 * done / total if total else 0.0
```

State short codes: `NOT_STARTED`, `IN_PROGRESS`, `BLOCKED`, `DONE`.

**Progress by task type** - `select count(id), type_id, status_id from Task where project_id is "..." group by type_id, status_id`, then map `type_id` via `select id, name from Type`.

**Totals** - `select sum(bid), project_id from Task group by project_id` (bid is in seconds).

## When to aggregate in client code

- Server older than 4.12, or the entity doesn't support `group by`.
- Grouping by a computed value (e.g. month of a date) or a custom attribute.

Then project only the fields you need, filter with `where`, and count in code. In Python, `task['status']['state']['short']` (not `task['status']['state']`) gives the state code. In JavaScript the same value is `task.status.state.short`.
