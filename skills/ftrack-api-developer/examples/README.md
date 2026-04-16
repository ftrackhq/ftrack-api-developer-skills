# ftrack API Examples

Comprehensive examples for both Python and JavaScript ftrack API clients.

## Directory Structure

```
examples/
├── python/              # Python API examples
│   ├── README.md       # Python-specific documentation
│   ├── action_handlers.py
│   ├── custom_location_s3.py
│   ├── exception_handling.py
│   ├── performance_optimization.py
│   └── resource_transformers.py
│
└── javascript/          # JavaScript API examples
    ├── README.md       # JavaScript-specific documentation
    ├── package.json    # Dependencies and scripts
    ├── session-management.js
    ├── query-operations.js
    ├── crud-operations.js
    ├── event-handling.js
    ├── file-operations.js
    └── typescript-example.ts
```

## Quick Navigation

### Python Developers
👉 **[Go to Python Examples](./python/README.md)**

**Key Files:**
- Session management and queries
- Action handlers (base & advanced)
- Custom locations and transformers
- Performance optimization
- Error handling

**Use Cases:**
- Server-side automation
- Event listeners and actions
- Custom storage locations
- Integration scripts
- Pipeline tools

### JavaScript Developers
👉 **[Go to JavaScript Examples](./javascript/README.md)**

**Key Files:**
- Session management and connection pooling
- Query builder and optimization
- CRUD operations
- Real-time event handling
- File upload/download
- TypeScript type safety

**Use Cases:**
- Web applications and dashboards
- Browser extensions
- Node.js services
- Real-time monitoring
- File management UIs
- Type-safe integrations

## Common Patterns Comparison

### Session Management

**Python:**
```python
import ftrack_api

with ftrack_api.Session() as session:
    projects = session.query('select name from Project').all()
```

**JavaScript:**
```javascript
import ftrack from '@ftrack/api';

const session = new ftrack.Session(server, user, apiKey);
await session.initializing;

const projects = await session.query('select name from Project');
session.close();
```

### Query Optimization

**Python:**
```python
# ✓ Optimized
tasks = session.query(
    'select name, status.name from Task '
    'where project.id is "{0}"'.format(project_id)
).all()
```

**JavaScript:**
```javascript
// ✓ Optimized
const response = await session.query(
  `select name, status.name from Task where project.id is "${projectId}"`
);
const tasks = response.data;
```

### Event Handling

**Python:**
```python
def handle_update(event):
    print(f"Entity updated: {event['data']['entityId']}")
    return {'success': True}

session.event_hub.subscribe('topic=ftrack.update', handle_update)
session.event_hub.wait()
```

**JavaScript:**
```javascript
session.eventHub.subscribe('topic=ftrack.update', (event) => {
  console.log(`Entity updated: ${event.data.entityId}`);
});

session.eventHub.connect();
```

### Batch Operations

**Python:**
```python
# Bulk create with single commit
with session.auto_populating():
    tasks = [session.create('Task', data) for data in task_data]
session.commit()
```

**JavaScript:**
```javascript
// Parallel create
const createPromises = taskData.map(data => 
  session.create('Task', data)
);
const tasks = await Promise.all(createPromises);
```

## Environment Setup

### Python

```bash
# Install
pip install ftrack-python-api

# Environment variables
export FTRACK_SERVER=https://your-instance.ftrackapp.com
export FTRACK_API_USER=your-username
export FTRACK_API_KEY=your-api-key

# Run
python examples/python/action_handlers.py
```

### JavaScript

```bash
# Install
npm install @ftrack/api

# Environment variables
export FTRACK_SERVER=https://your-instance.ftrackapp.com
export FTRACK_API_USER=your-username
export FTRACK_API_KEY=your-api-key

# Run
cd examples/javascript
npm install
node session-management.js
```

## Feature Matrix

| Feature | Python | JavaScript | Notes |
|---------|--------|------------|-------|
| **Session Management** | ✅ | ✅ | Both support context managers |
| **Queries** | ✅ | ✅ | Same query language |
| **CRUD Operations** | ✅ | ✅ | Similar patterns |
| **Events** | ✅ | ✅ | WebSocket-based |
| **Action Handlers** | ✅ | ⚠️ | Python has framework |
| **Custom Locations** | ✅ | ⚠️ | Python-specific |
| **File Upload** | ✅ | ✅ | Different implementations |
| **File Download** | ✅ | ✅ | Different implementations |
| **TypeScript** | ❌ | ✅ | JS-only feature |
| **Auto-populating** | ✅ | ⚠️ | Python-specific optimization |

✅ Full support | ⚠️ Partial/different approach | ❌ Not applicable

## Use Case Guide

### Choose Python When:
- Building server-side automation
- Creating ftrack action handlers
- Implementing custom locations
- Need tight integration with Python pipeline tools
- Working with VFX/animation studio workflows

### Choose JavaScript When:
- Building web applications or dashboards
- Creating browser extensions
- Need real-time UI updates
- Prefer type safety with TypeScript
- Building Node.js microservices

### Use Both When:
- Building full-stack applications
- Python backend + JavaScript frontend
- Actions trigger web-based UIs
- Event-driven architectures

## Learning Path

### Beginner
1. Start with session management examples
2. Learn basic queries and CRUD operations
3. Understand entity relationships
4. Practice error handling

### Intermediate
5. Explore event subscriptions
6. Implement file operations
7. Optimize queries and batch operations
8. Build action handlers (Python) or dashboards (JS)

### Advanced
9. Create custom locations (Python)
10. Build type-safe services (TypeScript)
11. Implement real-time monitoring
12. Develop complex integrations

## Best Practices

### Both Languages
- ✅ Use projections in queries
- ✅ Filter at database level
- ✅ Handle errors gracefully
- ✅ Close sessions properly
- ✅ Store credentials in environment variables
- ✅ Use IDs instead of names in filters

### Python-Specific
- ✅ Use context managers (`with` statement)
- ✅ Leverage `auto_populating()` for bulk creates
- ✅ Cache common reference data
- ✅ Disable event hub if not needed

### JavaScript-Specific
- ✅ Use async/await consistently
- ✅ Handle CORS in browser environments
- ✅ Batch operations with `Promise.all()`
- ✅ Disconnect event hub when done
- ✅ Consider TypeScript for type safety

## Getting Help

- **Python Documentation**: [developer.ftrack.com/api-clients/python/](https://developer.ftrack.com/api-clients/python/)
- **JavaScript Documentation**: [developer.ftrack.com/api-clients/javascript/](https://developer.ftrack.com/api-clients/javascript/)
- **API Reference**: [ftrack-python-api.readthedocs.io](https://ftrack-python-api.readthedocs.io/)
- **GitHub Issues**: Report problems or ask questions
- **Community**: ftrack community forums

## Contributing

When adding examples:
1. Keep examples concise (< 200 lines)
2. Include docstrings/comments
3. Add to appropriate language directory
4. Update the respective README
5. Follow existing patterns
6. Include error handling
7. Test with real ftrack instance

## License

Examples are provided as educational resources. Adapt as needed for your use cases.
