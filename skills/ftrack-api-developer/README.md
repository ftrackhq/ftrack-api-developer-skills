# ftrack Developer Skill

Expert assistant for ftrack Python API development.

## Overview

This skill provides deep knowledge of the ftrack Python API, helping you build integrations, automate workflows, and optimize your ftrack usage.

## Features

- **Session Management**: Connection handling, context managers, and session lifecycle
- **Query Optimization**: Projections, filtering, pagination, and performance tuning
- **Event Handling**: Event subscriptions, handlers, and async processing
- **Action Handlers**: Base and advanced action patterns with UI forms
- **Custom Locations**: Storage location implementations
- **Resource Transformers**: File path transformation and organization
- **Performance Optimization**: Caching, batching, and monitoring
- **Exception Handling**: Comprehensive error patterns and recovery
- **Security**: Authentication, permissions, and input validation

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

### Common Use Cases

```
"Create a script to query all shots in a sequence with their status"
"Help me set up an event listener for task updates"
"Show me how to implement a custom widget"
"Optimize this ftrack query for better performance"
"Explain ftrack session management best practices"
```

## Examples

### Query Optimization

```python
# Before optimization
session.query('Task where project.name is "My Project"')

# After optimization with skill guidance
session.query('Task where project.id is {0}'.format(project_id))
```

### Event Handling

```python
import ftrack_api

class TaskUpdateHandler(object):
    def __init__(self, session):
        self.session = session
        
    def discover(self, event):
        # Skill helps implement proper event discovery
        pass
        
    def launch(self, event):
        # Skill provides event handling patterns
        pass

def register(session):
    # Skill shows proper registration pattern
    session.event_hub.subscribe(
        'topic=ftrack.update',
        TaskUpdateHandler(session)
    )
```

### Action Handlers

The skill provides comprehensive coverage of both **Base** and **Advanced** action handlers:

**Base Action Handler:**
```python
from ftrack_action_handler.action import BaseAction

class SimpleAction(BaseAction):
    """Basic action with discovery and launch."""
    
    label = 'Update Status'
    identifier = 'com.example.update_status'
    
    def register(self):
        """Register with event hub."""
        self.session.event_hub.subscribe(
            'topic=ftrack.action.discover and source.user.username={0}'.format(
                self.session.api_user
            ),
            self.discover
        )
        
        self.session.event_hub.subscribe(
            'topic=ftrack.action.launch and data.actionIdentifier={0}'.format(
                self.identifier
            ),
            self.launch
        )
    
    def discover(self, event):
        """Control when action appears."""
        selection = event['data'].get('selection', [])
        
        # Show only for tasks
        if all(item.get('entityType') == 'task' for item in selection):
            return {
                'items': [{
                    'label': self.label,
                    'actionIdentifier': self.identifier
                }]
            }
    
    def launch(self, event):
        """Execute the action."""
        selection = event['data'].get('selection', [])
        
        try:
            # Process entities
            for item in selection:
                entity = self.session.get('Task', item['entityId'])
                entity['status'] = self.session.query(
                    'Status where name is "Completed"'
                ).one()
            
            self.session.commit()
            
            return {
                'success': True,
                'message': f'Updated {len(selection)} tasks'
            }
        except Exception as e:
            self.session.rollback()
            return {'success': False, 'message': str(e)}
```

**Advanced Action with UI Form:**
```python
class AdvancedAction(BaseAction):
    """Advanced action with custom UI."""
    
    def interface(self, session, entities, values):
        """Return custom form."""
        return [
            {
                'label': 'Task Name',
                'name': 'task_name',
                'type': 'text',
                'value': values.get('task_name', '')
            },
            {
                'label': 'Priority',
                'name': 'priority',
                'type': 'number',
                'value': values.get('priority', 3)
            },
            {
                'label': 'Status',
                'name': 'status',
                'type': 'enumerator',
                'data': [
                    {'label': 'Not Started', 'value': 'not_started'},
                    {'label': 'In Progress', 'value': 'in_progress'}
                ]
            },
            {
                'label': 'Auto-assign',
                'name': 'auto_assign',
                'type': 'boolean',
                'value': values.get('auto_assign', False)
            }
        ]
    
    def launch(self, event):
        """Execute with form values."""
        values = event['data'].get('values', {})
        
        # Show form if no values
        if not values:
            return {
                'items': self.interface(self.session, [], values)
            }
        
        # Process with form input
        try:
            task = self.session.create('Task', {
                'name': values['task_name'],
                'priority': int(values.get('priority', 3))
            })
            self.session.commit()
            
            return {
                'success': True,
                'message': f'Created task: {task["name"]}'
            }
        except Exception as e:
            self.session.rollback()
            return {'success': False, 'message': str(e)}
```

See `examples/action_handlers.py` for complete implementations including:
- Simple status update actions
- Advanced actions with UI forms
- Batch processing with progress tracking
- Context-aware actions that adapt to entity types

## Example Files

The skill includes comprehensive example files:

- **`examples/action_handlers.py`**: Base and advanced action handlers
  - Simple status update action
  - Advanced action with UI forms
  - Batch processing with progress tracking
  - Context-aware actions
  
- **`examples/custom_location_s3.py`**: Custom storage locations
  - S3 location implementation
  - Local filesystem location

- **`examples/resource_transformers.py`**: File path transformers
  - Project-based organization
  - Versioned file naming
  - Date-based archiving

- **`examples/exception_handling.py`**: Error handling patterns
  - Comprehensive exception handling
  - Retry decorators
  - Event handler error recovery

- **`examples/performance_optimization.py`**: Performance patterns
  - Query optimization
  - Batch operations
  - Caching strategies

## Best Practices

1. **Session Management**: Always use context managers for sessions
2. **Query Optimization**: Use projections and limit result sets
3. **Error Handling**: Implement comprehensive error handling
4. **Event Patterns**: Follow ftrack event handling conventions
5. **Performance**: Cache results and minimize API calls
6. **Action Handlers**: Validate input, handle errors gracefully, provide clear feedback
7. **UI Forms**: Use appropriate field types, conditional visibility, clear labels

## Resources

- [developer.ftrack.com](https://developer.ftrack.com/)
- [ftrack-recipes](https://github.com/ftrackhq/ftrack-recipes)
- [ftrack-action-handler](https://github.com/ftrackhq/ftrack-action-handler)

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