---
name: ftrack-api-developer
description: ftrack API development expert - Python & JavaScript APIs, events, queries, and integrations
trigger: ftrack
---

# ftrack API Development Expert

Support both Python and JavaScript ftrack APIs. **Token optimization**: Load language-specific guides only when needed.

## Detect Language Context

Before loading examples, detect user's language:
- **Python indicators**: `.py`, `import ftrack_api`, `session.query()`, mentions "Python"
- **JavaScript indicators**: `.js`, `.ts`, `import ftrack`, `await session.query()`, mentions "JavaScript"/"JS"/"Node"/"browser"
- **If unclear**: Ask user which language they're using

## Official Resources (Use WebFetch to verify)

- **Developer Hub**: https://developer.ftrack.com/
- **Python API**: https://developer.ftrack.com/api-clients/python/
- **JavaScript API**: https://developer.ftrack.com/api-clients/javascript/
- **API Reference**: https://ftrack-python-api.readthedocs.io/en/stable/api_reference/
- **Performance Tips**: https://help.ftrack-studio.backlight.co/hc/en-us/articles/13129842496535
- **Python GitHub**: https://github.com/ftrackhq/ftrack-python
- **Recipes**: https://github.com/ftrackhq/ftrack-recipes
- **Action Handler**: https://github.com/ftrackhq/ftrack-action-handler
- **WebSocket Events**: https://developer.ftrack.com/websocket-events/

## Core Concepts (Both Languages)

### Sessions
All API communication through `Session` object. Manages connections, authentication, caching.

### Entities
Dict-like objects representing ftrack resources:
- `Project`, `Task`, `AssetVersion`, `Component`, `Note`, `User`, `Status`, `Type`
- Support relationship traversal
- Provide validation

### Querying
Use ftrack query language:
- **Always project specific attributes** (not `select *`)
- Filter at database level (not in code)
- Use IDs instead of names when possible

### Events
WebSocket-based real-time updates:
- Subscribe with topic filters
- Handle asynchronously
- Target specific entity types

---

## Python-Specific Guide

<details>
<summary><b>Click to expand Python patterns (load only when needed)</b></summary>

### Session Management

```python
import ftrack_api

# ✓ RECOMMENDED: Context manager
with ftrack_api.Session() as session:
    # Auto-cleanup
    pass

# Manual (disable event hub if not needed)
session = ftrack_api.Session(auto_connect_event_hub=False)
try:
    # work
finally:
    session.close()
```

### Query Optimization

```python
# ✓ OPTIMAL: Project attributes
session.query('select name, status.name from Task where project.id is "{0}"'.format(pid))

# ✗ AVOID: Fetch all attributes
session.query('Task').all()

# ✓ Use ancestors for hierarchy
session.query('Task where ancestors any (id is "{0}")'.format(project_id))

# ✓ Pagination
query = session.query('Task order by created_at desc')
query.page_size = 200
results = query.all()
```

### Batch Operations

```python
# ✓ Single commit for multiple creates
with session.auto_populating():
    tasks = [session.create('Task', data) for data in task_data]
session.commit()

# ✓ Bulk updates
tasks = session.query('Task where status.name is "In Progress"').all()
for task in tasks:
    task['priority'] = 3
session.commit()  # One commit
```

### Event Handling

```python
# ✓ Targeted subscription
def handle_task_update(event):
    if event['data'].get('entityType') != 'task':
        return
    # process
    return {'success': True}

session.event_hub.subscribe(
    'topic=ftrack.update and data.entityType is "task"',
    handle_task_update
)
```

### Action Handler (Base Pattern)

```python
from ftrack_action_handler.action import BaseAction

class MyAction(BaseAction):
    label = 'Action Name'
    identifier = 'com.example.action'
    
    def discover(self, event):
        selection = event['data'].get('selection', [])
        if all(i.get('entityType') == 'task' for i in selection):
            return {'items': [{'label': self.label, 'actionIdentifier': self.identifier}]}
    
    def launch(self, event):
        try:
            # process
            self.session.commit()
            return {'success': True, 'message': 'Done'}
        except Exception as e:
            self.session.rollback()
            return {'success': False, 'message': str(e)}
```

### Action with UI Form

```python
class FormAction(BaseAction):
    def interface(self, session, entities, values):
        return [
            {'label': 'Name', 'name': 'task_name', 'type': 'text'},
            {'label': 'Priority', 'name': 'priority', 'type': 'number', 'value': 3},
            {'label': 'Status', 'name': 'status', 'type': 'enumerator',
             'data': [{'label': 'Not Started', 'value': 'ns'}]}
        ]
    
    def launch(self, event):
        values = event['data'].get('values', {})
        if not values:
            return {'items': self.interface(self.session, [], values)}
        
        # process with values
        task = self.session.create('Task', {'name': values['task_name']})
        self.session.commit()
        return {'success': True}
```

### Custom Location (S3)

```python
import ftrack_api.structure.standard
import ftrack_api.accessor.disk

class S3Location(ftrack_api.entity.location.Location):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.accessor = S3Accessor(bucket='my-bucket')
        self.structure = ftrack_api.structure.standard.StandardStructure()
```

### Performance Tips

1. **Cache common data**: Statuses, types, users
2. **Use `auto_populating()`** for bulk creates
3. **Clear cache strategically**: `session.cache.clear('Task')`
4. **Batch event processing**: Accumulate and commit in batches
5. **Disable event hub** if not needed

</details>

---

## JavaScript-Specific Guide

<details>
<summary><b>Click to expand JavaScript patterns (load only when needed)</b></summary>

### Session Management

```javascript
import ftrack from '@ftrack/api';

// Initialize
const session = new ftrack.Session(
  "https://company.ftrackapp.com",
  "user@example.com",
  "api-key"
);

await session.initializing;

// Cleanup
session.close();
```

### Query Patterns

```javascript
// ✓ OPTIMAL: Project attributes
const response = await session.query(
  'select name, status.name from Task where project.id is "proj-id"'
);
const tasks = response.data;

// ✗ AVOID: Fetch all
const all = await session.query('Task');

// Pagination
const page1 = await session.query('Task', {offset: 0, limit: 100});
const page2 = await session.query('Task', {offset: 100, limit: 100});
```

### Create & Update

```javascript
// Create
const task = await session.create('Task', {
  name: 'New Task',
  parent_id: projectId,
  type_id: taskTypeId,
  status_id: statusId
});

// Update
await session.update('Task', taskId, {
  status_id: completedStatusId,
  priority: 4
});

// Delete
await session.delete('Task', taskId);
```

### Event Handling

```javascript
// Subscribe
session.eventHub.subscribe('topic=ftrack.update', (event) => {
  const tasks = event.data.entities.filter(e => e.entityType === 'Task');
  if (tasks.length > 0) {
    updateUI(tasks);
  }
});

// Connect
session.eventHub.connect();

// Cleanup
session.eventHub.disconnect();
```

### File Upload

```javascript
// Browser upload
async function uploadFile(file, assetVersionId) {
  const component = await session.create('FileComponent', {
    name: file.name,
    file_type: file.type,
    size: file.size,
    version_id: assetVersionId
  });
  
  await session.upload(component.id, file);
  return component;
}
```

### TypeScript Support

```bash
# Generate types for your workspace
npx @ftrack/ts-schema-generator \
  --server https://company.ftrackapp.com \
  --user user@example.com \
  --apiKey key
```

```typescript
import { Task, Project, Status } from './generated-schema';

const tasks: Task[] = await session.query<Task>(
  'select name, status.name from Task'
);
```

### Performance Tips

1. **Batch queries**: Use `in` clauses instead of multiple queries
2. **Close unused connections**: Call `session.close()`
3. **Disconnect event hub**: When not needed
4. **Use specific projections**: Select only needed fields
5. **Handle CORS**: Set proper headers for browser apps

</details>

---

## Query Optimization (Universal)

### Projection Best Practices
```
✓ select name, status.name from Task
✗ select * from Task
✗ Task (no projection)
```

### Filtering
```
✓ where project.id is "uuid"  (use IDs)
✗ where project.name is "Name"  (slower)

✓ where status.name in ("Active", "Review")
✗ Multiple queries for each status
```

### Performance Checklist
- [ ] Projected specific attributes
- [ ] Used IDs instead of names
- [ ] Filtered at database level
- [ ] Set appropriate page size
- [ ] Cached common reference data
- [ ] Disabled event hub if unused

---

## Common Patterns

### Get Project Tasks
```python
# Python
tasks = session.query(
    'select name, status.name from Task '
    'where project.id is "{0}"'.format(project_id)
).all()
```

```javascript
// JavaScript
const response = await session.query(
  `select name, status.name from Task where project.id is "${projectId}"`
);
```

### Bulk Status Update
```python
# Python
status = session.query('Status where name is "Completed"').one()
tasks = session.query('Task where status.name is "In Progress"').all()
for task in tasks:
    task['status'] = status
session.commit()
```

```javascript
// JavaScript
const tasks = await session.query('Task where status.name is "In Progress"');
for (const task of tasks.data) {
  await session.update('Task', task.id, {status_id: completedStatusId});
}
```

### Event Subscription
```python
# Python
session.event_hub.subscribe('topic=ftrack.update', handler)
```

```javascript
// JavaScript
session.eventHub.subscribe('topic=ftrack.update', handler);
session.eventHub.connect();
```

---

## Error Handling

### Python
```python
try:
    task = session.query('Task where id is "{0}"'.format(task_id)).one()
except ftrack_api.exception.NoResultFoundError:
    # Not found
except ftrack_api.exception.ServerError as e:
    # Server error
finally:
    session.rollback()  # If needed
```

### JavaScript
```javascript
try {
  const task = await session.get('Task', taskId);
} catch (error) {
  if (error.response?.status === 404) {
    // Not found
  } else {
    // Other error
  }
}
```

---

## Debug Tips

### Python
```python
import logging
logging.basicConfig(level=logging.DEBUG)

# Check cache
print(f"Cache size: {len(session.cache)}")

# Validate query
query = session.query('Task')
print(f"Count: {query.count()}")
```

### JavaScript
```javascript
// Enable debug logging
session.setDebug(true);

// Check connection
console.log(await session.getServerInformation());
```

---

## When to Fetch Documentation

Use WebFetch when:
- User asks about specific API methods
- Uncertain about syntax/parameters
- Working with newer features
- Need version-specific info
- Checking official examples

**Strategy**: Read documentation FIRST, then provide accurate solution based on current API.

---

## Response Guidelines

1. **Detect language early** - Ask if unclear
2. **Load only needed section** - Don't expand both Python AND JS
3. **Link to examples** - Reference official docs
4. **Optimize queries** - Always suggest projections
5. **Error handling** - Include in all examples
6. **Security** - Validate input, use parameterized queries
7. **Keep responses concise** - Link to docs for deep dives

---

## Example File Reference

See `examples/` directory organized by language:

**Python** (`examples/python/`):
- `action_handlers.py` - Base & advanced actions
- `custom_location_s3.py` - S3 location
- `resource_transformers.py` - File transformers
- `exception_handling.py` - Error patterns
- `performance_optimization.py` - Performance patterns

**JavaScript** (`examples/javascript/`):
- `session-management.js` - Session patterns & pooling
- `query-operations.js` - Query builder & optimization
- `crud-operations.js` - Create, read, update, delete
- `event-handling.js` - Real-time events & dashboard
- `file-operations.js` - Upload/download & thumbnails
- `typescript-example.ts` - Type-safe repositories & services
