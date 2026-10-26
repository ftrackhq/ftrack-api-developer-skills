# ftrack query language reference

Source: https://developer.ftrack.com/api/query-language and https://developer.ftrack.com/api/performance. Applies to every client (Python, JavaScript, raw HTTP) because the server parses the string.

## Not SQL

| SQL idiom | In ftrack |
|---|---|
| `select *` | Doesn't exist - list fields |
| `AS` aliases, `DISTINCT` | Not supported - rename/dedupe in client code |
| `JOIN ... ON` | Use relationship traversal: `where project.name is "x"` |
| `UNION`, CTEs, window functions | Not supported - run several queries |
| Several entity types in `from` | One type per query |
| `count(...)` / `sum(...)` without `group by` | Not supported - aggregates need `group by` and strict mode |
| `null` | Use `none` |
| Trailing `;`, `--` comments | Not supported |

## Shape

```
select <projections> from <EntityType>
  [where <criteria>]
  [group by <attributes>]
  [order by <attribute> [ascending|descending], ...]
  [offset <n>] [limit <n>]
```

Clauses must be in this order.

## Projections

```
select id, name from Asset
select id, name, versions.version, versions.comment from Asset   # across relationships
select parent.type from Asset                                    # polymorphic relation
select $deadline, $priority from Task                            # custom attributes (non-strict only)
```

- No limit on number or depth of projections, but each relationship stride is a join on the server.
- In non-strict mode the server adds default projections (usually `id` and type info). In strict mode the response contains exactly what you projected.
- Python lets you omit `select` (`session.query('Task where ...')`) and fills in default projections; prefer explicit projections.

## Criteria

Each criterion is `[not] <attribute> <operator> <value>`, combined with `and` / `or`. `and` binds tighter than `or`; use parentheses:

```
select id from Project where status is active and (name like "%thrones" or full_name like "%thrones")
```

### Operators

| Operator | Meaning | Example |
|---|---|---|
| `=`, `is` | Equal | `first_name is "Jane"` |
| `!=`, `is_not` | Not equal | `status.name is_not "Done"` |
| `<`, `before`, `less_than` | Less than | `created_at before "2026-01-01"` |
| `<=` | Less or equal | `version <= 3` |
| `>`, `after`, `greater_than` | Greater than | `start after "2026-03-01T00:00:00"` |
| `>=` | Greater or equal | `bid >= 8` |
| `in`, `not_in` | In list / subquery | `status.name in ("In Progress", "Review")` |
| `like`, `not_like` | Case-insensitive pattern, `%` wildcard | `name like "sh0%"` |
| `has (...)` | Conditions on a scalar relationship | `author has (first_name is "Jane" and last_name is "Doe")` |
| `any (...)` | Conditions on a collection relationship | `metadata any (key is "color" and value is "red")` |

### Relationships

```
select id from Task where project.name like "%thrones" and status.type.name is "Done"
select name from Project where thumbnail is_not none          # relation exists
select id from Task where timelogs.start >= "2026-01-01"      # collection: at least one matches
select id from User where not timelogs any ()                 # empty collection
```

**`has` / `any` change semantics.** Without them, each condition on a relationship is evaluated independently, so on a collection two conditions can be satisfied by two different rows:

```
# Projects where some metadata has key=color and some (maybe other) metadata has value=red
Project where metadata.key is "color" and metadata.value is "red"
# Projects where one metadata row has both
Project where metadata any (key is "color" and value is "red")

Task where assignments any (resource.first_name is "Jane" and end is_not none)
```

Use `has` for scalar relationships with several conditions and `any` for collections.

### Polymorphic casts

Some relations (e.g. `parent`, `resource`) point to several possible types. Cast with `attr[Type]` to use type-specific attributes:

```
select id from TypedContext where parent[Project].status is "hidden"
select name from Project where allocations.resource[Group].memberships any (user.username is "jane")
```

### Subqueries

```
select id from Note where parent_id is "{version_id}"
  or parent_id in (select id from ReviewSessionObject where version_id is "{version_id}")
```

Server limits: maximum depth 2, exactly one projection, no `limit` inside a subquery.

## Literals

- Strings: `"..."` or `'...'`; escape an inner `"` as `\"`. Quote anything with spaces or that could clash with keywords such as `none`.
- Numbers and booleans: unquoted (`version > 3`, `is_active is true`).
- Dates: quoted ISO 8601 without timezone, interpreted in the server timezone: `"2026-04-20"`, `"2026-04-20T09:00:00"`.
- Null: `none`.

## Ordering

```
select id, name from Project order by name
select id, name from Project order by name descending, created_at asc
```

Default is ascending; `asc`/`desc` are aliases. You cannot order by a collection relationship.

## Offset, limit and paging

```
select id from Project offset 5 limit 10
```

Without `limit` a query returns every match - a timeout/502 risk on large tables.

Because results are pruned by permissions, the server may scan past the requested range. The response metadata contains `next.offset`; use that value (not `offset + limit`) for the next page, and stop when it is `null`.

- **Python** pages automatically: `session.query(expr, page_size=200)` (default 500). An explicit `limit` in the expression is honoured as the total result size.
- **JavaScript** returns one page per call: read `response.metadata.next.offset` and loop.

## Strict mode

Sent as the `ftrack-strict-api: true` request header. Python: `ftrack_api.Session(..., strict_api=True)` (whole session). JavaScript: `new Session(url, user, key, { strictApi: true })`, or per call with `session.call(operations, { additionalHeaders: { "ftrack-strict-api": "true" } })`.

- Required for `group by` and aggregate functions.
- Only projected fields are returned (no default projections).
- `$custom_attribute` syntax is rejected; use a non-strict session for those queries.

## Performance checklist

- Project only needed attributes; unprojected access in Python costs an extra request per entity.
- Filter in `where`, never in client code.
- `project_id is "x"` over `project.id is "x"`; native id columns avoid a join.
- `ancestors any (id is "x")` over `parent.parent.parent.id is "x"`; `descendants` over `children`. `parent`/`children` projections are comparatively expensive.
- One `id in (...)` query instead of one query per id.
- `order by ... limit n` for top-N reports instead of loading everything.
- Anchored `like "foo%"` over `like "%foo"`.
- Don't connect the event hub on sessions that only query.
