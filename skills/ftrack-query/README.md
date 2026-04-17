# ftrack Query Optimization

Focused skill for optimizing ftrack queries in Python and JavaScript.

## What This Skill Covers

- Query syntax and projections
- Filtering at database level
- Using IDs vs names for performance
- Pagination strategies
- Advanced query patterns
- Query optimization checklist
- Performance best practices

## When to Use

Invoke this skill when working with:
- Searching for entities (tasks, shots, assets, etc.)
- Writing queries with `select` and `where`
- Optimizing slow queries
- Implementing pagination
- Filtering and sorting results

## Quick Example

### Python
```python
# Optimized query with projections
tasks = session.query(
    'select name, status.name from Task where project.id is "{0}"'.format(project_id)
).all()
```

### JavaScript
```javascript
// Optimized query with projections
const response = await session.query(
  `select name, status.name from Task where project.id is "${projectId}"`
);
```

## Invocation

```bash
/ftrack-query
```

Or automatically via `/ftrack-api-developer` when query-related keywords detected.

## Token Usage

~800 tokens (vs 3,500 for full ftrack skill)

## Related Skills

- `/ftrack-session` - For session/cache management
- `/ftrack-events` - For real-time query updates
