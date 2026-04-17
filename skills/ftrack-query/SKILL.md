---
name: ftrack-query
description: ftrack query optimization - projections, filtering, pagination for Python & JavaScript
trigger: query, search, filter, find
---

# ftrack Query Optimization Expert

Optimize ftrack queries for performance and efficiency in both Python and JavaScript.

## Quick Start

Detect user's language first:
- **Python**: `.py`, `session.query()`, `import ftrack_api`
- **JavaScript**: `.js`, `.ts`, `await session.query()`, `import ftrack`

## Core Principles

### 1. Always Use Projections
```
✓ select name, status.name from Task
✗ select * from Task
✗ Task (no projection)
```

### 2. Filter at Database Level
```
✓ where project.id is "uuid"
✗ Fetch all, then filter in code
```

### 3. Use IDs Over Names
```
✓ where project.id is "abc-123"
✗ where project.name is "Project Name"  (slower)
```

---

## Python Query Patterns

### Basic Query
```python
import ftrack_api

session = ftrack_api.Session()

# Optimal: project attributes
tasks = session.query(
    'select name, status.name, priority from Task '
    'where project.id is "{0}"'.format(project_id)
).all()

# Get single result
task = session.query(
    'select name from Task where id is "{0}"'.format(task_id)
).one()

# Count without fetching
count = session.query('Task where project.id is "{0}"'.format(pid)).count()
```

### Advanced Filtering
```python
# Multiple conditions
tasks = session.query(
    'select name, status.name from Task '
    'where project.id is "{0}" and status.name in ("Active", "Review")'
).format(project_id).all()

# Hierarchy traversal
tasks = session.query(
    'select name from Task '
    'where ancestors any (id is "{0}")'.format(parent_id)
).all()

# Date ranges
recent = session.query(
    'select name, created_at from Task '
    'where created_at > "{0}"'.format('2026-01-01')
).all()

# Relationship traversal
tasks = session.query(
    'select name, parent.name, project.name from Task '
    'where project.id is "{0}"'.format(project_id)
).all()
```

### Pagination
```python
# Set page size
query = session.query(
    'select name, status.name from Task '
    'order by created_at desc'
)
query.page_size = 200
results = query.all()  # Fetches in batches

# Manual pagination
offset = 0
limit = 100
while True:
    batch = session.query(
        'select name from Task offset {0} limit {1}'.format(offset, limit)
    ).all()
    if not batch:
        break
    process(batch)
    offset += limit
```

### Sorting
```python
# Single field
tasks = session.query(
    'select name from Task order by created_at desc'
).all()

# Multiple fields
tasks = session.query(
    'select name, priority from Task '
    'order by priority desc, created_at asc'
).all()
```

---

## JavaScript Query Patterns

### Basic Query
```javascript
import ftrack from '@ftrack/api';

const session = new ftrack.Session(
  "https://company.ftrackapp.com",
  "user@example.com",
  "api-key"
);

await session.initializing;

// Optimal: project attributes
const response = await session.query(
  `select name, status.name, priority from Task where project.id is "${projectId}"`
);
const tasks = response.data;

// Get single entity
const task = await session.get('Task', taskId);

// Count results
const countResponse = await session.query(
  `select id from Task where project.id is "${projectId}"`
);
const count = countResponse.data.length;
```

### Advanced Filtering
```javascript
// Multiple conditions
const response = await session.query(
  `select name, status.name from Task 
   where project.id is "${projectId}" 
   and status.name in ("Active", "Review")`
);

// Hierarchy traversal
const tasks = await session.query(
  `select name from Task where ancestors any (id is "${parentId}")`
);

// Date ranges
const recent = await session.query(
  `select name, created_at from Task where created_at > "2026-01-01"`
);

// Relationship traversal
const tasks = await session.query(
  `select name, parent.name, project.name from Task where project.id is "${projectId}"`
);
```

### Pagination
```javascript
// Manual pagination
const pageSize = 100;
let offset = 0;
let allTasks = [];

while (true) {
  const response = await session.query(
    `select name from Task offset ${offset} limit ${pageSize}`
  );
  
  if (response.data.length === 0) break;
  
  allTasks = allTasks.concat(response.data);
  offset += pageSize;
}

// Or use offset/limit in single call
const page1 = await session.query('Task', {offset: 0, limit: 100});
const page2 = await session.query('Task', {offset: 100, limit: 100});
```

### Query Builder Pattern
```javascript
// Reusable query builder
class QueryBuilder {
  constructor(session, entityType) {
    this.session = session;
    this.entityType = entityType;
    this.projections = [];
    this.conditions = [];
  }
  
  select(...fields) {
    this.projections.push(...fields);
    return this;
  }
  
  where(condition) {
    this.conditions.push(condition);
    return this;
  }
  
  async execute() {
    const projection = this.projections.length > 0 
      ? `select ${this.projections.join(', ')} from ` 
      : '';
    const where = this.conditions.length > 0 
      ? ` where ${this.conditions.join(' and ')}` 
      : '';
    
    const query = `${projection}${this.entityType}${where}`;
    const response = await this.session.query(query);
    return response.data;
  }
}

// Usage
const tasks = await new QueryBuilder(session, 'Task')
  .select('name', 'status.name')
  .where(`project.id is "${projectId}"`)
  .where('status.name is "Active"')
  .execute();
```

---

## Performance Optimization

### Caching Common Data (Python)
```python
# Cache statuses (fetched once per session)
_status_cache = {}

def get_status_by_name(session, name):
    if name not in _status_cache:
        _status_cache[name] = session.query(
            'select id, name from Status where name is "{0}"'.format(name)
        ).one()
    return _status_cache[name]

# Clear cache when needed
_status_cache.clear()
session.cache.clear('Status')
```

### Batch Queries (JavaScript)
```javascript
// Instead of multiple queries
const task1 = await session.get('Task', id1);
const task2 = await session.get('Task', id2);
const task3 = await session.get('Task', id3);

// Use single query with 'in' clause
const tasks = await session.query(
  `select name, status.name from Task where id in ("${id1}", "${id2}", "${id3}")`
);
```

### Projection Optimization
```python
# Only fetch what you need
# BAD: Fetches all attributes including large thumbnails
tasks = session.query('Task').all()

# GOOD: Specific attributes only
tasks = session.query(
    'select id, name, status.name from Task where project.id is "{0}"'
).format(project_id).all()

# Avoid fetching relationships unless needed
# BAD: Fetches entire user objects
tasks = session.query('select name, assignments from Task').all()

# GOOD: Fetch only needed user attributes
tasks = session.query('select name, assignments.resource.name from Task').all()
```

---

## Query Syntax Reference

### Operators
```
# Comparison
is, is_not, >, <, >=, <=

# Lists
in ("value1", "value2")
not_in ("value1", "value2")

# Relationships
has, not_has
any, not_any

# Logical
and, or, not

# Pattern matching (limited support)
like "pattern%"
```

### Common Patterns
```python
# Project tasks
'select name from Task where project.id is "{project_id}"'

# Active shots in sequence
'select name from Shot where parent.id is "{seq_id}" and status.name is "Active"'

# Tasks assigned to user
'select name from Task where assignments.resource.id is "{user_id}"'

# Recent notes
'select text, author.username from Note where created_at > "{date}"'

# Asset versions by type
'select version, asset.name from AssetVersion where asset.type.name is "Geometry"'
```

---

## Error Handling

### Python
```python
try:
    task = session.query('Task where id is "{0}"'.format(task_id)).one()
except ftrack_api.exception.NoResultFoundError:
    print(f"Task {task_id} not found")
except ftrack_api.exception.MultipleResultsFoundError:
    print("Query returned multiple results, expected one")
except ftrack_api.exception.ServerError as e:
    print(f"Server error: {e}")
```

### JavaScript
```javascript
try {
  const task = await session.get('Task', taskId);
} catch (error) {
  if (error.response?.status === 404) {
    console.log('Task not found');
  } else {
    console.error('Query error:', error.message);
  }
}
```

---

## Performance Checklist

- [ ] Used `select` with specific attributes (not `select *`)
- [ ] Filtered by IDs instead of names when possible
- [ ] Applied filters at database level (not in code)
- [ ] Set appropriate page size for large result sets
- [ ] Cached common reference data (statuses, types)
- [ ] Used `in` clauses instead of multiple queries
- [ ] Avoided fetching relationships unless needed
- [ ] Tested query count before iterating large result sets

---

## Official Resources

- **Query Language**: https://developer.ftrack.com/ftrack-query-syntax/
- **Python API**: https://ftrack-python-api.readthedocs.io/
- **JavaScript API**: https://developer.ftrack.com/api-clients/javascript/
- **Performance Tips**: https://help.ftrack-studio.backlight.co/hc/en-us/articles/13129842496535
