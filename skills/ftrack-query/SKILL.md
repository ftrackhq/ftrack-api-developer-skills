---
name: ftrack-query
description: ftrack query language for Python and JavaScript - select/where syntax, projections, has/any relationship filters, ordering, pagination, performance, and server-side aggregation with group by. Use when code calls `session.query()` or contains ftrack query strings, or the user asks how to search, filter, count or aggregate ftrack entities (tasks, assets, versions, projects, notes). Not for SQL or non-ftrack databases.
when_to_use: "Code signals: `session.query(`, `session.call(` with a `group by` expression, `operation.query(`, query strings such as `select ... from Task where ...`, `project_id is \"`, `ancestors any (`, `has (`, `order by`, `offset ... limit`, `count(id)`, or server errors mentioning ParseError or subqueries. Requests like \"find all tasks with status X\", \"filter shots\", \"get versions for an asset\", \"count tasks per status\", \"ftrack query is slow\", \"paginate ftrack results\", \"numbers for a dashboard\"."
---

# ftrack query language

The ftrack query language looks like SQL but **is not SQL**. Most SQL idioms (`*`, `JOIN`, `AS`, `DISTINCT`, `UNION`, `count()` without `group by`) are unsupported and either error or silently return wrong results.

```
select <projections> from <EntityType>
  [where <criteria>]
  [group by <attributes>]          # strict mode + session.call only
  [order by <attribute> [asc|desc], ...]
  [offset <n>] [limit <n>]
```

Clauses must appear in this order. One entity type per query (PascalCase, case-sensitive: `Task`, `Project`, `AssetVersion`, `TypedContext`, ...).

## Rules that matter most

1. **Project what you need.** Accessing an unprojected attribute triggers an extra request per entity (Python auto-populates on access). `select name, status.name from Task` loads both in one round trip. Don't over-project either.
2. **Filter on the server**, never fetch-all-then-filter in code.
3. **Prefer native id columns**: `project_id is "..."` is faster than `project.id is "..."` (no join).
4. **Use `ancestors any (id is "...")`** instead of `parent.parent.parent.id`, and `descendants` instead of `children`.
5. **Batch by id**: one `where id in ("a", "b", "c")` query instead of a query per id.
6. **Multiple conditions on one related entity need `any` (collection) or `has` (scalar).** Without them each condition can match a different related row - no error, wrong results:
   ```
   # wrong: key and value may match two different metadata rows
   Project where metadata.key is "color" and metadata.value is "red"
   # right
   Project where metadata any (key is "color" and value is "red")
   Note where author has (first_name is "Jane" and last_name is "Doe")
   ```
7. **Status state is an entity.** Compare `status.state.short` (`NOT_STARTED`, `IN_PROGRESS`, `BLOCKED`, `DONE`), not `status.state`.
8. **Aggregate on the server** with `group by` instead of counting in client code - see [references/aggregation.md](references/aggregation.md).
9. Avoid leading wildcards (`like "%foo"`) on large tables - they are full scans. `like "foo%"` can use an index.

## Python (`ftrack_api`)

```python
# Lazy result; the request is sent when iterated, indexed, or .all() is called
tasks = session.query(
    'select name, status.name from Task where project_id is "{0}"'.format(project_id)
).all()

task = session.query('select name from Task where id is "{0}"'.format(task_id)).one()
# .one() raises NoResultFoundError / MultipleResultsFoundError
latest = session.query(
    'select version from AssetVersion where asset_id is "{0}" order by version desc'.format(asset_id)
).first()   # None if no match; .one()/.first() fail if the expression already has a limit

# Paging is automatic; page_size is an argument (default 500), not an attribute
for version in session.query('select id from AssetVersion', page_size=200):
    ...
```

The Python client accepts a bare `Task where ...` (it injects default projections), but an explicit `select` is clearer and cheaper.

There is no escaping helper in Python: when interpolating user-supplied strings, escape `"` as `\"`. IDs are safe.

## JavaScript (`@ftrack/api`)

```javascript
import { Session, expression } from "@ftrack/api";

// expression`...` escapes quotes in interpolated values (prevents query injection)
const response = await session.query(
  expression`select name, status.name from Task where project_id is "${projectId}"`
);
const tasks = response.data;               // array of plain objects
const nextOffset = response.metadata.next.offset;   // null when there are no more pages
```

JavaScript does not page automatically. Use `offset`/`limit` and loop on `metadata.next.offset` (see [examples/javascript/query-examples.js](examples/javascript/query-examples.js)).

## Operators (cheat sheet)

| Operator | Example |
|---|---|
| `is` / `=`, `is_not` / `!=` | `status.name is "In Progress"` |
| `<` `<=` `>` `>=` (also `before`, `after`) | `end_date before "2026-01-01"` |
| `in`, `not_in` | `status.name in ("Review", "Approved")` |
| `like`, `not_like` (case-insensitive, `%` wildcard) | `name like "sh010%"` |
| `has (...)` / `any (...)` | `metadata any (key is "color" and value is "red")` |
| `not`, `and`, `or`, parentheses | `not status is active` |
| `none` (null) | `thumbnail_id is_not none` |
| `attr[Type]` cast | `parent[Project].status is "hidden"` |

Dates are quoted ISO 8601 without timezone (`"2026-04-20T09:00:00"`), interpreted in the server's timezone. Custom attributes use a `$` prefix (`select $deadline from Task`) and are rejected in strict mode.

## Reference files

Files are under `${CLAUDE_SKILL_DIR}`. Read only what the question needs.

| File | Read when |
|---|---|
| [references/query-language.md](references/query-language.md) | Full grammar: all operators, has/any semantics, casting, subqueries and their limits, ordering, paging metadata, literals, strict mode |
| [references/aggregation.md](references/aggregation.md) | Counts, sums, averages, dashboard numbers: `group by` with `session.call` in Python and JavaScript, strict mode, mapping ids to names |
| [examples/python/query_examples.py](examples/python/query_examples.py) | Runnable Python: projections, one/first, paging, batching, has/any, group by |
| [examples/javascript/query-examples.js](examples/javascript/query-examples.js) | Runnable JavaScript: `expression`, manual paging, batching, `session.call` with group by |

Online source of truth if something isn't covered: https://developer.ftrack.com/api/query-language, https://developer.ftrack.com/api-clients/python/querying, https://developer.ftrack.com/api/performance.

Never invent entity types or attribute names. If unsure, inspect the schema (`session.types` / `session.schemas` in Python, `session.schemas` in JavaScript) or probe with `select id from <Type> limit 1`.
