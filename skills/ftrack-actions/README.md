# ftrack Action Handlers

Focused skill for building custom ftrack actions with UI forms (Python-only).

## What This Skill Covers

- BaseAction framework
- Discovery and launch patterns
- UI form building (all field types)
- Multi-step forms
- Input validation
- Bulk operations
- Deployment strategies

## When to Use

Invoke this skill when working with:
- Custom ftrack actions
- UI forms for user input
- Action discovery logic
- Bulk entity updates via actions
- Workflow automation through actions
- Action server deployment

## Quick Example

```python
from ftrack_action_handler.action import BaseAction

class SimpleAction(BaseAction):
    label = 'Update Status'
    identifier = 'com.example.update_status'
    
    def discover(self, event):
        # Show action only for tasks
        selection = event['data'].get('selection', [])
        if all(item.get('entityType') == 'task' for item in selection):
            return {'items': [{'label': self.label, 'actionIdentifier': self.identifier}]}
    
    def launch(self, event):
        # Execute action
        try:
            # Process entities
            self.session.commit()
            return {'success': True, 'message': 'Done'}
        except Exception as e:
            self.session.rollback()
            return {'success': False, 'message': str(e)}
```

## Invocation

```bash
/ftrack-actions
```

Or automatically via `/ftrack-api-developer` when action-related keywords detected.

## Token Usage

~700 tokens (vs 3,500 for full ftrack skill)

## Language Support

**Python only** - JavaScript API does not support action handlers

## Related Skills

- `/ftrack-query` - For querying entities in actions
- `/ftrack-events` - For triggering actions via events
