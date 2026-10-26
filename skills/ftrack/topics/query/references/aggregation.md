# Aggregation with group by

Source: https://developer.ftrack.com/api-clients/examples/group-by and https://developer.ftrack.com/api-clients/python/querying.

Let the server count and sum rather than downloading every entity and counting in client code.

## Requirements

- ftrack Studio 4.12+ (`group by` on relations such as `status.name` needs 25.9+).
- **Strict mode**: Python needs a session created with `strict_api=True`. JavaScript can enable it per call with the `ftrack-strict-api: true` header (or for the whole session with `{ strictApi: true }`).
- Run through **`session.call`**, not `session.query` - results are rows, not entities.
- Supported on common entities such as `Task` and `Project`. The workspace API reference (Help menu) marks which entities support `group by`.
- Functions: `count()`, `sum()`, `avg()`, `min()`, `max()`. Not on relationship attributes.

Rows come back keyed by `<function>_<attribute>` (`count(id)` -> `count_id`, `sum(bid)` -> `sum_bid`, also `avg_`, `min_`, `max_`) plus the grouped values:

- Grouping by an id column (`group by status_id`) returns that column automatically.
- Grouping by a relation (`group by status.name`) returns only the aggregate unless you also project it: `select count(id), status.name from Task group by status.name`. Python then gives the related entity under `status`.
- Without strict mode the server raises `ValidationError: Aggregates are only supported in strict output mode.`
- Aggregating an attribute the user can't read (e.g. `bid` without the permission) raises `PermissionError: Not allowed to read attribute`.

Strict mode rejects `$custom_attribute` syntax and returns only projected fields. In Python, keep a separate strict session for aggregation if the rest of your code relies on non-strict behaviour; in JavaScript, pass the header only on the aggregation call.

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

The developer hub documents group by with Python only, but it works the same from JavaScript through `session.call` with the strict header (tested with `@ftrack/api` 1.11.2; ftrack's own web app does the same).

```javascript
import { operation, expression } from "@ftrack/api";

const [counts, statuses] = await session.call(
  [
    operation.query(
      expression`select count(id), status_id from Task where project_id is "${projectId}" group by status_id`
    ),
    operation.query("select id, name, color, state.short from Status"),
  ],
  { additionalHeaders: { "ftrack-strict-api": "true" } }
);

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
