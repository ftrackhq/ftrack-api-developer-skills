# ftrack Developer Skill

Expert assistant for ftrack API development (Python and JavaScript).

## Overview

This skill provides deep knowledge of the ftrack API (both Python and JavaScript), helping you build integrations, automate workflows, and optimize your ftrack usage across different platforms and environments.

**Optimized for minimal token usage**: The skill detects your language context (Python or JavaScript) and loads only relevant examples, reducing context consumption by ~89% compared to loading all documentation.

## Features

### Core Capabilities
- **Dual Language Support**: Python and JavaScript (auto-detected or specified)
- **Query Optimization**: Smart projections, filtering, and performance patterns
- **Event Handling**: Real-time WebSocket event subscriptions
- **Action Handlers**: UI forms, discovery, and launch patterns
- **Batch Operations**: Efficient bulk creates/updates
- **Error Handling**: Comprehensive exception patterns
- **Performance**: Caching, pagination, and optimization strategies

### Python-Specific
- Context managers, `auto_populating()`, action handler framework
- Custom locations (S3, disk), resource transformers
- Thread-safe event processing, cache management

### JavaScript-Specific
- Browser & Node.js, async/await patterns, TypeScript support
- File upload/download, CORS handling, event hub integration

## Installation

Install the plugin using Claude Code marketplace:

```bash
/plugin install ftrack-api-developer
```

## Configuration

Set these environment variables for local development:

```bash
export FTRACK_SERVER=https://your-instance.ftrackapp.com
export FTRACK_API_KEY=your-api-key
export FTRACK_API_USER=your-username
```

## Usage

### Invocation

**Explicit invocation:**
```
/ftrack-api-developer
```

**Auto-trigger** by mentioning ftrack API:
```
"How do I query tasks in ftrack?"
"Show me how to create a custom action"
```

### Language Detection

The skill automatically detects your language context:
- **Python**: `.py` files, `import ftrack_api`, mentions "Python"
- **JavaScript**: `.js`/`.ts` files, `import ftrack`, mentions "JS"/"Node"/"browser"

If context is unclear, it will ask which language you're using before loading language-specific examples.

### Common Use Cases

```
"Create a script to query all shots in a sequence with their status"
"Help me set up an event listener for task updates"
"Show me how to implement a custom action handler"
"Optimize this ftrack query for better performance"
"Build a web dashboard to display project status"
"Show me how to upload files from a web form"
"Set up TypeScript types for my ftrack workspace"
```

## Quick Examples

### Query with Projections (Both Languages)

**Python:**
```python
# ✓ Optimized
session.query('select name, status.name from Task where project.id is "{0}"'.format(project_id))
```

**JavaScript:**
```javascript
// ✓ Optimized
await session.query('select name, status.name from Task where project.id is "proj-id"');
```

### Action Handler Pattern (Python)

```python
from ftrack_action_handler.action import BaseAction

class SimpleAction(BaseAction):
    label = 'Update Status'
    identifier = 'com.example.update_status'
    
    def discover(self, event):
        selection = event['data'].get('selection', [])
        if all(item.get('entityType') == 'task' for item in selection):
            return {'items': [{'label': self.label, 'actionIdentifier': self.identifier}]}
    
    def launch(self, event):
        try:
            # Process entities, commit changes
            self.session.commit()
            return {'success': True, 'message': 'Done'}
        except Exception as e:
            self.session.rollback()
            return {'success': False, 'message': str(e)}
```

### Event Handling (Both Languages)

**Python:**
```python
session.event_hub.subscribe('topic=ftrack.update', handler)
```

**JavaScript:**
```javascript
session.eventHub.subscribe('topic=ftrack.update', handler);
session.eventHub.connect();
```

For complete implementations, see `examples/` directory.

## Example Files

The skill includes comprehensive example files organized by language:

### Python Examples (`examples/python/`)

- **`action_handlers.py`**: Base and advanced action handlers with UI forms
- **`custom_location_s3.py`**: Custom storage locations (S3, disk)
- **`resource_transformers.py`**: File path transformers and organization
- **`exception_handling.py`**: Error handling patterns and retry decorators
- **`performance_optimization.py`**: Query optimization, caching, batch operations

### JavaScript Examples (`examples/javascript/`)

- **`session-management.js`**: Session initialization, connection handling, manager patterns
- **`query-operations.js`**: Query patterns, pagination, optimization, query builder
- **`crud-operations.js`**: Create, Read, Update, Delete operations with error handling
- **`event-handling.js`**: Event subscriptions, real-time updates, event hub management
- **`file-operations.js`**: File upload/download, component management, thumbnails
- **`typescript-example.ts`**: Type-safe API usage, repositories, services

Each subdirectory contains a detailed README with usage examples and best practices.

## Best Practices

1. **Session Management**: Always use context managers for sessions
2. **Query Optimization**: Use projections and limit result sets
3. **Error Handling**: Implement comprehensive error handling
4. **Event Patterns**: Follow ftrack event handling conventions
5. **Performance**: Cache results and minimize API calls
6. **Action Handlers**: Validate input, handle errors gracefully, provide clear feedback
7. **UI Forms**: Use appropriate field types, conditional visibility, clear labels

## Resources

### Official Documentation
- [developer.ftrack.com](https://developer.ftrack.com/)
- [Python API Documentation](https://developer.ftrack.com/api-clients/python/)
- [JavaScript API Documentation](https://developer.ftrack.com/api-clients/javascript/)

### Libraries & Tools
- [ftrack-python-api](https://github.com/ftrackhq/ftrack-python-api) - Python client
- [@ftrack/api](https://www.npmjs.com/package/@ftrack/api) - JavaScript/TypeScript client
- [ftrack-action-handler](https://github.com/ftrackhq/ftrack-action-handler) - Python action framework
- [@ftrack/ts-schema-generator](https://www.npmjs.com/package/@ftrack/ts-schema-generator) - TypeScript type generator

### Examples
- [ftrack-recipes](https://github.com/ftrackhq/ftrack-recipes) - Code examples and patterns

## Troubleshooting

### Common Issues

- **Connection Problems**: Verify server URL and credentials
- **Query Timeouts**: Optimize queries and reduce result size
- **Permission Errors**: Check API key permissions
- **Event Not Firing**: Verify subscription topics and patterns

### Debugging Tips

```python
# Enable ftrack logging
import logging
logging.basicConfig(level=logging.DEBUG)

# Check session status
print(session.server_information())

# Validate queries
query = session.query('Task')
print(query.count())  # Check count before iterating
```

## Support

For issues or questions:
- Check the main [README.md](../../README.md) for general troubleshooting
- Review official ftrack developer documentation
- Open an issue in this repository