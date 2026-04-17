---
name: ftrack-actions
description: ftrack custom action handlers - Python BaseAction, UI forms, discovery, launch patterns
trigger: action, handler, ui form, custom action, BaseAction
---

# ftrack Action Handler Expert

Build custom ftrack actions with UI forms, discovery logic, and robust error handling (Python-specific).

## Prerequisites

```bash
pip install ftrack-python-api
pip install ftrack-action-handler
```

## Core Concepts

### Action Lifecycle
1. **Discover**: Determine if action should be shown
2. **Interface** (optional): Show UI form for user input
3. **Launch**: Execute action with user selections/values

### BaseAction Class
Framework for building actions with built-in session management and error handling.

---

## Basic Action

```python
from ftrack_action_handler.action import BaseAction

class SimpleAction(BaseAction):
    """Simple action without UI form."""
    
    # Action metadata
    label = 'Simple Action'
    identifier = 'com.example.simple'
    description = 'A simple action example'
    
    def discover(self, event):
        """Determine if action should be shown.
        
        Args:
            event: Discovery event with selection data
            
        Returns:
            dict with 'items' list, or None to hide action
        """
        selection = event['data'].get('selection', [])
        
        # Show action only for tasks
        if all(item.get('entityType') == 'task' for item in selection):
            return {
                'items': [{
                    'label': self.label,
                    'actionIdentifier': self.identifier,
                    'description': self.description
                }]
            }
        
        return None
    
    def launch(self, event):
        """Execute the action.
        
        Args:
            event: Launch event with selection and values
            
        Returns:
            dict with 'success' and 'message'
        """
        selection = event['data'].get('selection', [])
        
        try:
            for item in selection:
                entity_id = item['entityId']
                entity_type = item['entityType']
                
                # Get entity
                entity = self.session.get(entity_type, entity_id)
                
                # Perform action
                entity['description'] = 'Updated by action'
            
            # Commit all changes
            self.session.commit()
            
            return {
                'success': True,
                'message': f'Updated {len(selection)} items'
            }
            
        except Exception as e:
            # Rollback on error
            self.session.rollback()
            return {
                'success': False,
                'message': f'Error: {str(e)}'
            }


def register(session):
    """Register action with ftrack."""
    action = SimpleAction(session)
    action.register()
```

---

## Action with UI Form

```python
from ftrack_action_handler.action import BaseAction

class FormAction(BaseAction):
    """Action with user input form."""
    
    label = 'Create Tasks'
    identifier = 'com.example.create_tasks'
    
    def discover(self, event):
        """Show action on project entities."""
        selection = event['data'].get('selection', [])
        
        if len(selection) == 1 and selection[0].get('entityType') == 'project':
            return {
                'items': [{
                    'label': self.label,
                    'actionIdentifier': self.identifier
                }]
            }
    
    def interface(self, session, entities, values):
        """Build UI form.
        
        Args:
            session: ftrack session
            entities: Selected entities
            values: Previously entered values (for validation/multi-step)
            
        Returns:
            list of form field definitions
        """
        # Get status options
        statuses = session.query('select id, name from Status').all()
        status_options = [
            {'label': s['name'], 'value': s['id']}
            for s in statuses
        ]
        
        # Get task type options
        types = session.query('select id, name from Type where entity_type is "Task"').all()
        type_options = [
            {'label': t['name'], 'value': t['id']}
            for t in types
        ]
        
        return [
            {
                'label': 'Task Names',
                'name': 'task_names',
                'type': 'textarea',
                'value': '',
                'empty_text': 'Enter task names (one per line)'
            },
            {
                'label': 'Task Type',
                'name': 'type_id',
                'type': 'enumerator',
                'data': type_options,
                'value': type_options[0]['value'] if type_options else None
            },
            {
                'label': 'Status',
                'name': 'status_id',
                'type': 'enumerator',
                'data': status_options,
                'value': status_options[0]['value'] if status_options else None
            },
            {
                'label': 'Priority',
                'name': 'priority',
                'type': 'number',
                'value': 3
            }
        ]
    
    def launch(self, event):
        """Execute action with form values."""
        selection = event['data']['selection']
        values = event['data'].get('values')
        
        # First call: show form
        if not values:
            return {
                'items': self.interface(
                    self.session,
                    selection,
                    values
                )
            }
        
        # Second call: process form values
        try:
            # Validate input
            task_names = values.get('task_names', '').strip().split('\n')
            task_names = [name.strip() for name in task_names if name.strip()]
            
            if not task_names:
                return {
                    'success': False,
                    'message': 'Please enter at least one task name'
                }
            
            # Get parent project
            project_id = selection[0]['entityId']
            project = self.session.get('Project', project_id)
            
            # Create tasks
            created_tasks = []
            for name in task_names:
                task = self.session.create('Task', {
                    'name': name,
                    'parent': project,
                    'type_id': values['type_id'],
                    'status_id': values['status_id'],
                    'priority': int(values['priority'])
                })
                created_tasks.append(task)
            
            # Commit all at once
            self.session.commit()
            
            return {
                'success': True,
                'message': f'Created {len(created_tasks)} tasks'
            }
            
        except Exception as e:
            self.session.rollback()
            return {
                'success': False,
                'message': f'Error: {str(e)}'
            }


def register(session):
    action = FormAction(session)
    action.register()
```

---

## Form Field Types

### Text Input
```python
{
    'label': 'Task Name',
    'name': 'task_name',
    'type': 'text',
    'value': 'Default Value',
    'empty_text': 'Enter task name...'
}
```

### Textarea
```python
{
    'label': 'Description',
    'name': 'description',
    'type': 'textarea',
    'value': '',
    'empty_text': 'Enter description...'
}
```

### Number
```python
{
    'label': 'Priority',
    'name': 'priority',
    'type': 'number',
    'value': 3
}
```

### Checkbox
```python
{
    'label': 'Send Notification',
    'name': 'notify',
    'type': 'boolean',
    'value': True
}
```

### Dropdown (Enumerator)
```python
{
    'label': 'Status',
    'name': 'status_id',
    'type': 'enumerator',
    'data': [
        {'label': 'Not Started', 'value': 'status-id-1'},
        {'label': 'In Progress', 'value': 'status-id-2'},
        {'label': 'Complete', 'value': 'status-id-3'}
    ],
    'value': 'status-id-1'
}
```

### Date Picker
```python
{
    'label': 'Due Date',
    'name': 'due_date',
    'type': 'date',
    'value': '2026-12-31'
}
```

### Entity Selector
```python
{
    'label': 'Assigned User',
    'name': 'user_id',
    'type': 'entity',
    'entity_type': 'User',
    'value': None
}
```

---

## Advanced Patterns

### Multi-Step Form
```python
class MultiStepAction(BaseAction):
    """Action with conditional form steps."""
    
    label = 'Multi-Step Action'
    identifier = 'com.example.multistep'
    
    def interface(self, session, entities, values):
        """Show different form based on previous values."""
        
        # Step 1: Choose action type
        if not values:
            return [
                {
                    'label': 'Action Type',
                    'name': 'action_type',
                    'type': 'enumerator',
                    'data': [
                        {'label': 'Create Tasks', 'value': 'create'},
                        {'label': 'Update Status', 'value': 'update'}
                    ]
                }
            ]
        
        # Step 2: Show fields based on action type
        action_type = values.get('action_type')
        
        if action_type == 'create':
            return [
                {'label': 'Task Names', 'name': 'task_names', 'type': 'textarea'},
                {'label': 'Submit', 'name': 'submit', 'type': 'boolean', 'value': False}
            ]
        elif action_type == 'update':
            statuses = session.query('select id, name from Status').all()
            return [
                {
                    'label': 'New Status',
                    'name': 'status_id',
                    'type': 'enumerator',
                    'data': [{'label': s['name'], 'value': s['id']} for s in statuses]
                },
                {'label': 'Submit', 'name': 'submit', 'type': 'boolean', 'value': False}
            ]
    
    def launch(self, event):
        """Handle multi-step form submission."""
        values = event['data'].get('values')
        
        if not values or not values.get('submit'):
            # Show form (or next step)
            return {
                'items': self.interface(
                    self.session,
                    event['data']['selection'],
                    values
                )
            }
        
        # Process final submission
        action_type = values['action_type']
        
        if action_type == 'create':
            return self._create_tasks(values)
        elif action_type == 'update':
            return self._update_status(values)
```

### Validation
```python
class ValidatedAction(BaseAction):
    """Action with input validation."""
    
    def launch(self, event):
        values = event['data'].get('values')
        
        if not values:
            return {'items': self.interface(self.session, [], values)}
        
        # Validate inputs
        errors = self._validate(values)
        if errors:
            # Return form with error message
            return {
                'success': False,
                'message': '\n'.join(errors),
                'items': self.interface(self.session, [], values)
            }
        
        # Process valid input
        return self._process(values)
    
    def _validate(self, values):
        """Validate form values."""
        errors = []
        
        task_name = values.get('task_name', '').strip()
        if not task_name:
            errors.append('Task name is required')
        elif len(task_name) < 3:
            errors.append('Task name must be at least 3 characters')
        
        priority = values.get('priority')
        if priority is not None:
            try:
                priority = int(priority)
                if priority < 1 or priority > 5:
                    errors.append('Priority must be between 1 and 5')
            except ValueError:
                errors.append('Priority must be a number')
        
        return errors
```

### Bulk Operations
```python
class BulkUpdateAction(BaseAction):
    """Update multiple entities efficiently."""
    
    label = 'Bulk Status Update'
    identifier = 'com.example.bulk_update'
    
    def discover(self, event):
        """Show on multiple task selection."""
        selection = event['data'].get('selection', [])
        
        if (len(selection) > 1 and 
            all(item.get('entityType') == 'task' for item in selection)):
            return {
                'items': [{
                    'label': f'{self.label} ({len(selection)} tasks)',
                    'actionIdentifier': self.identifier
                }]
            }
    
    def launch(self, event):
        selection = event['data']['selection']
        values = event['data'].get('values')
        
        if not values:
            # Show form
            statuses = self.session.query('select id, name from Status').all()
            return {
                'items': [{
                    'label': 'New Status',
                    'name': 'status_id',
                    'type': 'enumerator',
                    'data': [{'label': s['name'], 'value': s['id']} for s in statuses]
                }]
            }
        
        try:
            # Update all tasks
            status_id = values['status_id']
            
            for item in selection:
                task = self.session.get('Task', item['entityId'])
                task['status_id'] = status_id
            
            # Single commit for all changes
            self.session.commit()
            
            return {
                'success': True,
                'message': f'Updated {len(selection)} tasks'
            }
            
        except Exception as e:
            self.session.rollback()
            return {'success': False, 'message': str(e)}
```

---

## Action Server

```python
import logging
import ftrack_api

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def register_actions(session):
    """Register all actions."""
    from my_actions import SimpleAction, FormAction, BulkUpdateAction
    
    SimpleAction(session).register()
    FormAction(session).register()
    BulkUpdateAction(session).register()
    
    logger.info('Actions registered')

def main():
    """Run action server."""
    session = ftrack_api.Session(auto_connect_event_hub=True)
    
    # Register actions
    register_actions(session)
    
    logger.info('Action server running. Press Ctrl+C to exit.')
    
    # Wait for events
    session.event_hub.wait()

if __name__ == '__main__':
    main()
```

---

## Deployment

### Docker
```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "action_server.py"]
```

### Systemd Service
```ini
[Unit]
Description=ftrack Action Server
After=network.target

[Service]
Type=simple
User=ftrack
WorkingDirectory=/opt/ftrack-actions
Environment="FTRACK_SERVER=https://company.ftrackapp.com"
Environment="FTRACK_API_KEY=your-key"
Environment="FTRACK_API_USER=your-user"
ExecStart=/usr/bin/python3 action_server.py
Restart=always

[Install]
WantedBy=multi-user.target
```

---

## Best Practices

1. **Validate Input**: Always validate form values before processing
2. **Error Handling**: Use try/except and rollback on errors
3. **Batch Commits**: Commit once for multiple operations
4. **Clear Feedback**: Return descriptive success/error messages
5. **Discovery Logic**: Show actions only where relevant
6. **Logging**: Log actions for debugging and auditing
7. **Testing**: Test with various selection types and edge cases

---

## Common Patterns

### Status Workflow
```python
class StatusWorkflowAction(BaseAction):
    """Advance task through status workflow."""
    
    WORKFLOW = {
        'Not Started': 'In Progress',
        'In Progress': 'Review',
        'Review': 'Approved',
        'Approved': 'Complete'
    }
    
    def discover(self, event):
        selection = event['data'].get('selection', [])
        
        if len(selection) == 1 and selection[0].get('entityType') == 'task':
            task_id = selection[0]['entityId']
            task = self.session.get('Task', task_id)
            current_status = task['status']['name']
            
            if current_status in self.WORKFLOW:
                next_status = self.WORKFLOW[current_status]
                return {
                    'items': [{
                        'label': f'Advance to {next_status}',
                        'actionIdentifier': self.identifier
                    }]
                }
    
    def launch(self, event):
        task_id = event['data']['selection'][0]['entityId']
        task = self.session.get('Task', task_id)
        current_status_name = task['status']['name']
        next_status_name = self.WORKFLOW[current_status_name]
        
        # Find next status
        next_status = self.session.query(
            'Status where name is "{0}"'.format(next_status_name)
        ).one()
        
        task['status'] = next_status
        self.session.commit()
        
        return {
            'success': True,
            'message': f'Status updated to {next_status_name}'
        }
```

---

## Official Resources

- **Action Handler**: https://github.com/ftrackhq/ftrack-action-handler
- **Examples**: https://github.com/ftrackhq/ftrack-recipes
- **Python API**: https://ftrack-python-api.readthedocs.io/
