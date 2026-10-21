---
name: ftrack-actions
description: ftrack custom actions in Python - `BaseAction` / ftrack-action-handler, discover and launch, UI forms, running an action server. Use when code imports `ftrack_action_handler` or subclasses `BaseAction`, or the user wants to add a custom action or action UI form to ftrack. Python only; not for event listeners in general (use ftrack-events).
when_to_use: "Code signals: `import ftrack_action_handler`, `from ftrack_action_handler.action import BaseAction`, classes with `discover` and `launch` methods, `identifier = ` and `label = ` class attributes, topics `ftrack.action.discover` / `ftrack.action.launch`, returning `items` with UI form widgets. Requests like \"custom ftrack action\", \"add a menu action in ftrack\", \"action with a form\", \"run a script from the ftrack actions menu\"."
---

# ftrack Action Handler Expert

**Strategy**: Quick reference first → Fetch online docs if needed → Load local examples as fallback

**IMPORTANT**: Actions are Python-only. JavaScript API does not support custom actions.

## Prerequisites
```bash
pip install ftrack-python-api
pip install ftrack-action-handler
```

---

## Quick Reference (Use First - 70% of Queries)

### Core Principles
✓ **Extend BaseAction**: Use `ftrack_action_handler.action.BaseAction`
✓ **Implement discover()**: Return action metadata or None to hide
✓ **Implement launch()**: Execute action logic, return success/message
✓ **Session available**: Use `self.session` (auto-managed by BaseAction)
✓ **Commit changes**: Always call `self.session.commit()` after modifications
✗ Avoid complex forms on first iteration (start simple)
✗ Never skip validation of user input
✗ Don't forget error handling and rollback

### Action Lifecycle
1. **Discover**: Determine if action should be shown based on selection
2. **Interface** (optional): Show UI form for user input
3. **Launch**: Execute action with user selections and form values

### Simple Action (No Form)

```python
from ftrack_action_handler.action import BaseAction

class SimpleAction(BaseAction):
    """Simple action without UI form."""
    
    label = 'Simple Action'
    identifier = 'com.example.simple'
    description = 'Updates selected tasks'
    
    def discover(self, event):
        """Show action only for tasks."""
        selection = event['data'].get('selection', [])
        
        if all(item.get('entityType') == 'task' for item in selection):
            return {
                'items': [{
                    'label': self.label,
                    'actionIdentifier': self.identifier
                }]
            }
        return None
    
    def launch(self, event):
        """Execute the action."""
        selection = event['data'].get('selection', [])
        
        try:
            for item in selection:
                entity = self.session.get(item['entityType'], item['entityId'])
                entity['description'] = 'Updated by action'
            
            self.session.commit()
            
            return {
                'success': True,
                'message': f'Updated {len(selection)} items'
            }
        except Exception as e:
            self.session.rollback()
            return {
                'success': False,
                'message': str(e)
            }

# Register action
def register(session):
    SimpleAction(session).register()
```

### Action with Text Input Form

```python
class FormAction(BaseAction):
    """Action with text input form."""
    
    label = 'Update Description'
    identifier = 'com.example.form'
    
    def discover(self, event):
        return {
            'items': [{
                'label': self.label,
                'actionIdentifier': self.identifier
            }]
        }
    
    def interface(self, event):
        """Build UI form."""
        values = event['data'].get('values', {})
        
        # If no values, show form
        if not values:
            return [
                {
                    'type': 'text',
                    'label': 'Description',
                    'name': 'description',
                    'value': ''
                }
            ]
        
        # Values submitted, return None to proceed to launch
        return None
    
    def launch(self, event):
        """Execute with form values."""
        values = event['data'].get('values', {})
        description = values.get('description', '')
        
        if not description:
            return {'success': False, 'message': 'Description required'}
        
        selection = event['data'].get('selection', [])
        
        for item in selection:
            entity = self.session.get(item['entityType'], item['entityId'])
            entity['description'] = description
        
        self.session.commit()
        
        return {
            'success': True,
            'message': f'Updated {len(selection)} items'
        }
```

### Action with Dropdown Selection

```python
class StatusAction(BaseAction):
    """Action with status dropdown."""
    
    label = 'Change Status'
    identifier = 'com.example.status'
    
    def interface(self, event):
        values = event['data'].get('values', {})
        
        if not values:
            # Get available statuses
            statuses = self.session.query('Status').all()
            
            return [
                {
                    'type': 'enumerator',
                    'label': 'New Status',
                    'name': 'status_id',
                    'data': [
                        {'label': s['name'], 'value': s['id']}
                        for s in statuses
                    ]
                }
            ]
        
        return None
    
    def launch(self, event):
        values = event['data'].get('values', {})
        status_id = values.get('status_id')
        selection = event['data'].get('selection', [])
        
        for item in selection:
            entity = self.session.get(item['entityType'], item['entityId'])
            entity['status_id'] = status_id
        
        self.session.commit()
        
        return {'success': True, 'message': 'Status updated'}
```

### Multi-Field Form

```python
class ComplexFormAction(BaseAction):
    """Action with multiple form fields."""
    
    label = 'Complex Form'
    identifier = 'com.example.complex'
    
    def interface(self, event):
        values = event['data'].get('values', {})
        
        if not values:
            return [
                {
                    'type': 'text',
                    'label': 'Name',
                    'name': 'name'
                },
                {
                    'type': 'textarea',
                    'label': 'Description',
                    'name': 'description'
                },
                {
                    'type': 'number',
                    'label': 'Priority',
                    'name': 'priority',
                    'value': 50
                },
                {
                    'type': 'boolean',
                    'label': 'Notify Users',
                    'name': 'notify',
                    'value': True
                }
            ]
        
        return None
```

### Form Field Types

```python
# Text input
{'type': 'text', 'label': 'Name', 'name': 'name', 'value': ''}

# Multi-line text
{'type': 'textarea', 'label': 'Description', 'name': 'desc'}

# Number input
{'type': 'number', 'label': 'Priority', 'name': 'priority', 'value': 50}

# Checkbox
{'type': 'boolean', 'label': 'Enable', 'name': 'enabled', 'value': True}

# Dropdown
{
    'type': 'enumerator',
    'label': 'Status',
    'name': 'status',
    'data': [
        {'label': 'Active', 'value': 'active'},
        {'label': 'Done', 'value': 'done'}
    ]
}

# Date picker
{'type': 'date', 'label': 'Due Date', 'name': 'due_date'}

# Entity selector
{
    'type': 'entity',
    'label': 'Assigned To',
    'name': 'assignee',
    'entity_type': 'User'
}
```

### Validation Pattern

```python
def launch(self, event):
    values = event['data'].get('values', {})
    
    # Validate required fields
    if not values.get('name'):
        return {
            'success': False,
            'message': 'Name is required'
        }
    
    # Validate format
    if not re.match(r'^[a-zA-Z0-9_]+$', values['name']):
        return {
            'success': False,
            'message': 'Name must be alphanumeric'
        }
    
    # Execute action
    # ...
```

**→ This quick reference handles most action patterns. For advanced forms or deployment, continue below.**

---

## Online Resources (Fetch for Detailed Info)

### When to Fetch
- User asks for "all form field types" or "complete action API"
- Needs action server deployment patterns
- Questions about advanced validation or multi-step forms
- Official action examples or best practices

### Actions Documentation
**URL**: `https://developer.ftrack.com/extending-ftrack/actions`
**Fetch Prompt**:
```
Extract ftrack action handler patterns and API reference. Include:
- BaseAction class usage and lifecycle
- Discovery logic and filtering
- UI form building with all field types
- Launch execution patterns
- Error handling and validation
- Action server setup and deployment
- Multi-step form patterns
- Bulk operations and performance
Format as markdown with Python code examples.
```

### Action Handler Library Documentation
**URL**: `https://github.com/ftrackhq/ftrack-action-handler`
**Fetch Prompt**:
```
Extract ftrack-action-handler library usage patterns. Include:
- BaseAction subclassing
- Session management
- Event subscription in actions
- Deployment patterns
- Best practices
Format as markdown.
```

### WebFetch Decision Tree

**IMPORTANT**: Actively check user query for trigger phrases, then use WebFetch.

**Trigger detection** (check user's exact query):
```python
trigger_phrases = [
    "all form field types",
    "complete action API",
    "official action docs",
    "action server deployment",
    "multi-step form",
    "advanced validation",
    "action best practices",
    "all widget types"
]
```

**Action when trigger detected:**
1. **Detect topic**: Form fields, deployment, or API reference
2. **Use WebFetch** with appropriate URL above
3. **If fetch succeeds**: Return formatted docs to user
4. **If fetch fails**: Gracefully fallback to local example (see "Local Examples" section)

**WebFetch Example:**
```markdown
# User asks: "Show me all form field types for ftrack actions"
# Trigger detected: "all form field types"

Use WebFetch tool:
WebFetch(
  url="https://developer.ftrack.com/extending-ftrack/actions",
  prompt="Extract all ftrack action form field types and widgets. Include text, textarea, number, boolean, enumerator, date, entity, and any other available types. Show configuration options and examples. Format as markdown."
)

If successful: Present docs
If fails: Load examples/python/action_handlers.py
```

---

## Local Examples (Fallback - Load Only When Needed)

### When to Load Local
1. WebFetch fails or times out
2. User explicitly requests "show me the example file"
3. Need complete runnable action implementations
4. Advanced patterns like bulk operations, multi-step forms

### Available Local Files

**Action Handlers Example**
- **File**: `examples/python/action_handlers.py`
- **Contains**: Complete action implementations with forms, validation, bulk operations
- **Load when**: User needs production action patterns
- **Size**: ~400 lines

### How to Load
Files are under `${CLAUDE_SKILL_DIR}`. Read only the file you need, then extract the sections relevant to the user's question.

---

## Decision Tree

```
User asks about ftrack actions
  │
  ├─ Simple action (no form)?
  │   └→ Use Quick Reference above ✓
  │
  ├─ Action with text input?
  │   └→ Use Quick Reference (form action) ✓
  │
  ├─ Action with dropdown?
  │   └→ Use Quick Reference (status action) ✓
  │
  ├─ Validation patterns?
  │   └→ Use Quick Reference (validation) ✓
  │
  ├─ Need all form field types or complete API?
  │   ├→ WebFetch actions documentation
  │   └→ If fails: Load action_handlers.py
  │
  ├─ Action server deployment?
  │   ├→ WebFetch action-handler library docs
  │   └→ If fails: Provide basic deployment pattern
  │
  └─ Production-ready examples with bulk operations?
      └→ Load action_handlers.py directly
```

---

## Response Strategy

### For Simple Questions
1. Answer using Quick Reference patterns
2. Show appropriate pattern (simple, form, dropdown)
3. Keep concise (1 example)
4. Cite: "From action quick reference"

### For Detailed Questions
1. Start with Quick Reference context
2. If trigger detected: WebFetch actions documentation
3. Provide field-specific examples
4. Cite: "From [URL]"
5. If fetch fails: Load local example + cite filename

### For Advanced Questions (Multi-step, Bulk)
1. Check if Quick Reference covers it
2. If not: WebFetch actions docs
3. If insufficient or fails: Load local example file
4. Provide production-ready code
5. Cite all sources used

### Progressive Disclosure
- Start minimal (quick reference - simple action or form)
- Offer more: "Need all form field types or deployment guide? I can fetch official docs"
- Load comprehensive examples only if requested or if WebFetch fails

---

## Action Server Deployment (Quick Reference)

**Basic Server**
```python
import logging
from ftrack_action_handler.action import BaseAction

logging.basicConfig(level=logging.INFO)

# Register actions
def register(session):
    SimpleAction(session).register()
    FormAction(session).register()
    StatusAction(session).register()

if __name__ == '__main__':
    import ftrack_api
    
    session = ftrack_api.Session(auto_connect_event_hub=True)
    register(session)
    
    # Keep server running
    session.event_hub.wait()
```

**For complete deployment setup**: Request WebFetch or load `action_handlers.py`

---

## Common Patterns

### Bulk Operations
```python
def launch(self, event):
    selection = event['data'].get('selection', [])
    updated = 0
    
    for item in selection:
        try:
            entity = self.session.get(item['entityType'], item['entityId'])
            entity['description'] = 'Processed'
            updated += 1
        except Exception as e:
            self.logger.warning(f"Failed to update {item['entityId']}: {e}")
    
    self.session.commit()
    
    return {
        'success': True,
        'message': f'Updated {updated}/{len(selection)} items'
    }
```

### Entity Query in Discover
```python
def discover(self, event):
    """Show action only for published assets."""
    selection = event['data'].get('selection', [])
    
    # Query selected entities
    for item in selection:
        entity = self.session.get(item['entityType'], item['entityId'])
        if entity.entity_type == 'AssetVersion' and entity['is_published']:
            return {'items': [{'label': self.label}]}
    
    return None
```

### Progress Reporting (Advanced)
```python
def launch(self, event):
    selection = event['data'].get('selection', [])
    total = len(selection)
    
    for i, item in enumerate(selection):
        entity = self.session.get(item['entityType'], item['entityId'])
        process_entity(entity)
        
        # Update progress
        progress = (i + 1) / total
        self.logger.info(f'Progress: {progress:.0%}')
    
    self.session.commit()
    
    return {'success': True, 'message': 'Complete'}
```
