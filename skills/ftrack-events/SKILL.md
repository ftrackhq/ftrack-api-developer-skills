---
name: ftrack-events
description: ftrack real-time event handling - WebSocket subscriptions, event hub, async processing
---

TRIGGER when: code uses `session.event_hub` (Python) or `session.eventHub` (JavaScript); file contains event subscriptions, WebSocket handling, or ftrack.update/create/delete topics; user asks about ftrack events, real-time updates, webhooks, or event subscriptions.
SKIP: ftrack actions (use ftrack-actions), general event handling without ftrack, HTTP webhooks.

# ftrack Event Handling Expert

**Strategy**: Quick reference first → Fetch online docs if needed → Load local examples as fallback

## Language Detection
- **Python**: `session.event_hub.subscribe()`, `ftrack_api.event`
- **JavaScript**: `session.eventHub.subscribe()`, `eventHub.connect()`

---

## Quick Reference (Use First - 70% of Queries)

### Core Principles
✓ **Filter by topic**: Subscribe to specific events (`ftrack.update`, `ftrack.create`, etc.)
✓ **Return status**: Handler must return `{'success': True}` (Python) or Promise (JavaScript)
✓ **Async processing**: Use queues for heavy work to avoid blocking event hub
✓ **Targeted subscriptions**: Filter by entity type in topic expression
✗ Avoid subscribing to all topics without filters (performance impact)
✗ Never block the event hub thread with long operations

### Core Concepts
- **Event Hub**: WebSocket connection for real-time updates from ftrack server
- **Topics**: Event filters (`ftrack.update`, `ftrack.create`, `ftrack.delete`, `ftrack.action.*`)
- **Event Data**: JSON structure with `topic`, `data.entities`, `data.entityType`, `source.user`

### Python Quick Patterns

**Basic Subscription**
```python
import ftrack_api

session = ftrack_api.Session()

def handle_update(event):
    """Handle entity updates."""
    entity_type = event['data'].get('entityType')
    print(f"Updated: {entity_type}")
    return {'success': True}

# Subscribe to all updates
session.event_hub.subscribe('topic=ftrack.update', handle_update)

# Wait for events (blocking)
session.event_hub.wait()
```

**Targeted Topic Filter**
```python
# Filter by entity type in topic
def handle_task_update(event):
    """Only processes task updates."""
    for entity in event['data'].get('entities', []):
        task_id = entity['entityId']
        changes = entity.get('changes', {})
        print(f"Task {task_id} changed: {changes}")
    return {'success': True}

session.event_hub.subscribe(
    'topic=ftrack.update and data.entityType is "Task"',
    handle_task_update
)
```

**Multiple Handlers**
```python
def handle_create(event):
    print(f"Created: {event['data'].get('entityType')}")
    return {'success': True}

def handle_delete(event):
    print(f"Deleted: {event['data'].get('entityType')}")
    return {'success': True}

session.event_hub.subscribe('topic=ftrack.create', handle_create)
session.event_hub.subscribe('topic=ftrack.delete', handle_delete)
session.event_hub.wait()
```

**Async Processing with Queue**
```python
import threading
import queue

event_queue = queue.Queue()

def event_handler(event):
    """Queue events for async processing."""
    event_queue.put(event)
    return {'success': True}

def process_events():
    """Background worker."""
    while True:
        event = event_queue.get()
        try:
            heavy_processing(event)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            event_queue.task_done()

# Start worker
worker = threading.Thread(target=process_events, daemon=True)
worker.start()

# Subscribe with queueing handler
session.event_hub.subscribe('topic=ftrack.update', event_handler)
session.event_hub.wait()
```

**Error Handling**
```python
def safe_handler(event):
    """Handler with error handling."""
    try:
        process_event(event)
        return {'success': True}
    except Exception as e:
        print(f"Handler error: {e}")
        return {'success': False, 'message': str(e)}
```

### JavaScript Quick Patterns

**Basic Subscription**
```javascript
import ftrack from '@ftrack/api';

const session = new ftrack.Session(server, user, key);
await session.initializing;

// Subscribe to events
session.eventHub.subscribe('topic=ftrack.update', (event) => {
  console.log('Update:', event.data.entityType);
});

// Connect to event server
await session.eventHub.connect();
```

**Targeted Subscription**
```javascript
// Filter by entity type
session.eventHub.subscribe(
  'topic=ftrack.update and data.entityType is "Task"',
  (event) => {
    event.data.entities.forEach(entity => {
      console.log(`Task ${entity.entityId} updated`);
    });
  }
);
```

**React Integration with Debouncing**
```javascript
import { useState, useEffect } from 'react';
import debounce from 'lodash.debounce';

function TaskList() {
  const [tasks, setTasks] = useState([]);
  
  useEffect(() => {
    // Debounced refresh
    const refreshTasks = debounce(() => {
      session.query('select name from Task').then(result => {
        setTasks(result.data);
      });
    }, 500);
    
    // Subscribe to task updates
    const subscription = session.eventHub.subscribe(
      'topic=ftrack.update and data.entityType is "Task"',
      (event) => {
        refreshTasks();
      }
    );
    
    // Cleanup
    return () => subscription.unsubscribe();
  }, []);
  
  return <ul>{tasks.map(t => <li key={t.id}>{t.name}</li>)}</ul>;
}
```

**Error Handling**
```javascript
session.eventHub.subscribe('topic=ftrack.update', async (event) => {
  try {
    await processEvent(event);
  } catch (error) {
    console.error('Event processing failed:', error);
  }
});
```

**Connection Management**
```javascript
// Connect with error handling
try {
  await session.eventHub.connect();
  console.log('Event hub connected');
} catch (error) {
  console.error('Connection failed:', error);
}

// Handle disconnection
session.eventHub.on('disconnect', () => {
  console.log('Event hub disconnected, reconnecting...');
  setTimeout(() => session.eventHub.connect(), 5000);
});
```

**→ This quick reference handles most event subscription scenarios. For advanced patterns, continue below.**

---

## Online Resources (Fetch for Detailed Info)

### When to Fetch
- User asks for "all event topics" or "complete event reference"
- Needs event hub configuration options
- Questions about advanced filtering or batch processing
- Event data structure details
- Performance optimization for high-volume events

### Python Events Documentation
**URL**: `https://developer.ftrack.com/api-clients/python/event_hub.html`
**Fetch Prompt**:
```
Extract ftrack Python event hub patterns and reference. Include:
- Complete event topic list (ftrack.update, create, delete, action, location, etc.)
- Event hub subscription syntax with filtering
- Event data structure and attributes
- Handler return values and error handling
- Connection management and threading
- Performance optimization for high-volume events
- Async processing patterns
Format as markdown with code examples.
```

### JavaScript Events Documentation
**URL**: `https://developer.ftrack.com/api-clients/javascript/event_hub.html`
**Fetch Prompt**:
```
Extract ftrack JavaScript event hub patterns. Include:
- EventHub subscription API
- WebSocket connection management
- Event filtering and topic syntax
- Promise-based handlers
- React/UI integration patterns
- Reconnection and error handling
- Debouncing and throttling strategies
Format as markdown with async/await examples.
```

### Event Topics Reference
**URL**: `https://developer.ftrack.com/ftrack/api/events.html`
**Fetch Prompt**:
```
Extract ftrack event topics and data structures. Include:
- All available event topics
- Event payload structure for each topic
- Entity change tracking format
- User and source information
- Event filtering expressions
Format as concise reference.
```

### WebFetch Decision Tree

**IMPORTANT**: Actively check user query for trigger phrases, then use WebFetch.

**Trigger detection** (check user's exact query):
```python
trigger_phrases = [
    "show all event topics",
    "complete event reference",
    "official event docs",
    "all event types",
    "event hub configuration",
    "event data structure",
    "performance optimization events",
    "batch event processing"
]
```

**Action when trigger detected:**
1. **Detect language**: Python (`event_hub`) or JavaScript (`eventHub`)
2. **Detect topic**: Event types, configuration, or patterns
3. **Use WebFetch** with appropriate URL above
4. **If fetch succeeds**: Return formatted docs to user
5. **If fetch fails**: Gracefully fallback to local example (see "Local Examples" section)

**WebFetch Example:**
```markdown
# User asks: "Show me all event topics in ftrack"
# Trigger detected: "all event topics"

Use WebFetch tool:
WebFetch(
  url="https://developer.ftrack.com/ftrack/api/events.html",
  prompt="Extract all ftrack event topics with descriptions. Include ftrack.update, create, delete, action, location, and other event types. Show event payload structure. Format as markdown."
)

If successful: Present docs
If fails: Load examples/javascript/event-handling.js and extract topics
```

---

## Local Examples (Fallback - Load Only When Needed)

### When to Load Local
1. WebFetch fails or times out
2. User explicitly requests "show me the example file"
3. Need complete runnable event handling implementation
4. Advanced patterns like batch processing, React integration

### Available Local Files

**JavaScript Event Handling Example**
- **File**: `examples/javascript/event-handling.js`
- **Contains**: Complete event hub setup, React integration, debouncing, batch processing, error handling
- **Load when**: User needs production event handling patterns, UI integration
- **Size**: ~400 lines


### How to Load
Paths are relative to this skill's directory (the folder containing this SKILL.md). Read only the file you need, then extract the sections relevant to the user's question.

---

## Decision Tree

```
User asks about ftrack events
  │
  ├─ Basic subscription (how do I subscribe)?
  │   └→ Use Quick Reference above ✓
  │
  ├─ Filter by entity type?
  │   └→ Use Quick Reference (targeted subscription) ✓
  │
  ├─ Error handling or async processing?
  │   └→ Use Quick Reference (queue pattern) ✓
  │
  ├─ React/UI integration?
  │   └→ Use Quick Reference (React example) ✓
  │
  ├─ Need all event topics or complete reference?
  │   ├→ WebFetch event topics reference
  │   └→ If fails: Load event-handling.js and extract
  │
  ├─ Advanced filtering or performance optimization?
  │   ├→ WebFetch Python/JavaScript event docs
  │   └→ If fails: Load local examples
  │
  └─ Production-ready implementation?
      └→ Load event-handling.js directly
```

---

## Response Strategy

### For Simple Questions
1. Answer using Quick Reference patterns
2. Show appropriate code (Python or JavaScript)
3. Keep concise (1 example)
4. Cite: "From event handling quick reference"

### For Detailed Questions
1. Start with Quick Reference context
2. If trigger detected: WebFetch event documentation
3. Provide topic-specific examples
4. Cite: "From [URL]"
5. If fetch fails: Load local example + cite filename

### For Advanced Questions (React, Performance)
1. Check if Quick Reference covers it (React pattern included)
2. If not: WebFetch event hub docs
3. If insufficient or fails: Load local example file
4. Provide production-ready code
5. Cite all sources used

### Progressive Disclosure
- Start minimal (quick reference - basic subscription)
- Offer more: "Need complete event topic list? I can fetch official docs"
- Load comprehensive examples only if requested or if WebFetch fails

---

## Common Event Topics

**Core Events:**
- `ftrack.update` - Entity updates
- `ftrack.create` - Entity creation
- `ftrack.delete` - Entity deletion

**System Events:**
- `ftrack.action.launch` - Action launched
- `ftrack.action.discover` - Action discovery
- `ftrack.location.*` - Location events
- `ftrack.project.create` - Project created

**Filtering Expressions:**
```python
# By entity type
'topic=ftrack.update and data.entityType is "Task"'

# By multiple types
'topic=ftrack.update and data.entityType in ("Task", "Shot")'

# By topic pattern
'topic=ftrack.action.*'

# Combined filters
'topic=ftrack.update and data.entityType is "Task" and data.user.id is "user-id"'
```

---

## Event Data Structure

```json
{
  "topic": "ftrack.update",
  "data": {
    "entityType": "Task",
    "entities": [
      {
        "entityId": "task-uuid",
        "entityType": "task",
        "changes": {
          "status_id": {
            "new": "new-status-uuid",
            "old": "old-status-uuid"
          }
        },
        "keys": ["status_id"]
      }
    ],
    "user": {
      "id": "user-uuid",
      "username": "john.doe"
    }
  },
  "source": {
    "user": {"id": "user-uuid"},
    "applicationId": "app-uuid"
  }
}
```

---

## Performance Tips

1. **Filter in topic expression**: Reduces handler invocations
2. **Use async queues**: Offload heavy processing from event thread
3. **Debounce UI updates**: Group rapid events (especially in React)
4. **Batch operations**: Accumulate events before processing
5. **Unsubscribe when done**: Clean up subscriptions to free resources
