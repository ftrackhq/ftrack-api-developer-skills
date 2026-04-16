# ftrack Python API Examples

Comprehensive examples for using the ftrack Python API.

## Files Overview

| File | Description |
|------|-------------|
| **action_handlers.py** | Base and advanced action handlers with UI forms |
| **custom_location_s3.py** | Custom storage locations (S3, disk) |
| **resource_transformers.py** | File path transformers and organization |
| **exception_handling.py** | Error handling patterns and retry decorators |
| **performance_optimization.py** | Query optimization, caching, batch operations |

## Quick Start

### Installation

```bash
pip install ftrack-python-api
```

### Environment Variables

```bash
export FTRACK_SERVER=https://your-instance.ftrackapp.com
export FTRACK_API_USER=your-username
export FTRACK_API_KEY=your-api-key
```

### Basic Usage

```python
import ftrack_api

# Use context manager (recommended)
with ftrack_api.Session() as session:
    projects = session.query('select name from Project').all()
    for project in projects:
        print(project['name'])
```

## Running Examples

```bash
# Run action handler
python action_handlers.py

# Run performance examples
python performance_optimization.py

# Run with custom environment
FTRACK_SERVER=https://custom.ftrackapp.com python action_handlers.py
```

## Best Practices

### Session Management
```python
# ✓ GOOD: Use context manager
with ftrack_api.Session() as session:
    # operations

# ✓ GOOD: Disable event hub if not needed
session = ftrack_api.Session(auto_connect_event_hub=False)
```

### Query Optimization
```python
# ✓ GOOD: Project specific attributes
session.query('select name, status.name from Task where project.id is "{0}"'.format(pid))

# ✗ AVOID: Fetch all attributes
session.query('Task').all()
```

### Batch Operations
```python
# ✓ GOOD: Single commit
with session.auto_populating():
    tasks = [session.create('Task', data) for data in task_data]
session.commit()
```

## Resources

- [Official Python API Docs](https://developer.ftrack.com/api-clients/python/)
- [API Reference](https://ftrack-python-api.readthedocs.io/)
- [GitHub Repository](https://github.com/ftrackhq/ftrack-python-api)
- [Recipes](https://github.com/ftrackhq/ftrack-recipes)
