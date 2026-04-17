---
name: ftrack-events
description: ftrack real-time event handling - WebSocket subscriptions, event hub, async processing
trigger: event, webhook, real-time, subscribe, listen
---

# ftrack Event Handling Expert

Master real-time event subscriptions and WebSocket-based updates in ftrack.

## Quick Start

Detect user's language:
- **Python**: `session.event_hub.subscribe()`, `ftrack_api.event`
- **JavaScript**: `session.eventHub.subscribe()`, `session.eventHub.connect()`

## Core Concepts

### Event Hub
WebSocket connection for real-time updates from ftrack server.

### Topics
Filter events by topic patterns:
- `ftrack.update` - Entity updates
- `ftrack.create` - Entity creation
- `ftrack.delete` - Entity deletion
- `ftrack.action.*` - Action events
- `ftrack.location.*` - Location events

### Event Data Structure
```json
{
  "topic": "ftrack.update",
  "data": {
    "entityType": "task",
    "entities": [{"id": "...", "changes": {}}],
    "user": {"id": "..."}
  },
  "source": {"user": {"id": "..."}}
}
```

---

## Python Event Handling

### Basic Subscription
```python
import ftrack_api

session = ftrack_api.Session()

def handle_update(event):
    """Handle entity updates."""
    entity_type = event['data'].get('entityType')
    print(f"Updated: {entity_type}")
    
    # Return value indicates success
    return {'success': True}

# Subscribe to all updates
session.event_hub.subscribe('topic=ftrack.update', handle_update)

# Wait for events (blocking)
session.event_hub.wait()
```

### Targeted Subscriptions
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
    'topic=ftrack.update and data.entityType is "task"',
    handle_task_update
)

# Filter by specific entity
def handle_specific_project(event):
    """Only processes updates to specific project."""
    entities = event['data'].get('entities', [])
    for entity in entities:
        if entity.get('parentId') == specific_project_id:
            process_update(entity)
    return {'success': True}

session.event_hub.subscribe(
    'topic=ftrack.update and data.entityType is "task"',
    handle_specific_project
)
```

### Multiple Handlers
```python
def handle_create(event):
    """Handle entity creation."""
    entity_type = event['data'].get('entityType')
    print(f"Created: {entity_type}")
    return {'success': True}

def handle_delete(event):
    """Handle entity deletion."""
    entity_type = event['data'].get('entityType')
    print(f"Deleted: {entity_type}")
    return {'success': True}

# Subscribe multiple handlers
session.event_hub.subscribe('topic=ftrack.create', handle_create)
session.event_hub.subscribe('topic=ftrack.delete', handle_delete)

session.event_hub.wait()
```

### Async Processing
```python
import threading
import queue

event_queue = queue.Queue()

def event_handler(event):
    """Queue events for async processing."""
    event_queue.put(event)
    return {'success': True}

def process_events():
    """Background worker to process queued events."""
    while True:
        event = event_queue.get()
        try:
            # Process event (may take time)
            heavy_processing(event)
        except Exception as e:
            print(f"Error processing event: {e}")
        finally:
            event_queue.task_done()

# Start background worker
worker = threading.Thread(target=process_events, daemon=True)
worker.start()

# Subscribe with queueing handler
session.event_hub.subscribe('topic=ftrack.update', event_handler)
session.event_hub.wait()
```

### Batch Event Processing
```python
import time

class BatchEventProcessor:
    def __init__(self, session, batch_size=10, interval=5):
        self.session = session
        self.batch_size = batch_size
        self.interval = interval
        self.events = []
        self.last_flush = time.time()
    
    def handle_event(self, event):
        """Accumulate events and process in batches."""
        self.events.append(event)
        
        # Flush if batch is full or interval elapsed
        if (len(self.events) >= self.batch_size or 
            time.time() - self.last_flush > self.interval):
            self.flush()
        
        return {'success': True}
    
    def flush(self):
        """Process accumulated events."""
        if not self.events:
            return
        
        print(f"Processing batch of {len(self.events)} events")
        
        # Process all events
        for event in self.events:
            process_single_event(event)
        
        # Commit once for all changes
        self.session.commit()
        
        self.events = []
        self.last_flush = time.time()

# Usage
processor = BatchEventProcessor(session)
session.event_hub.subscribe('topic=ftrack.update', processor.handle_event)
session.event_hub.wait()
```

### Stop Propagation
```python
def handle_first(event):
    """First handler - stops propagation if condition met."""
    if should_stop_propagation(event):
        # Stop event from reaching other handlers
        event.stop()
        return {'success': True, 'message': 'Event handled, stopping propagation'}
    return {'success': True}

def handle_second(event):
    """Second handler - only runs if first didn't stop."""
    print("Processing in second handler")
    return {'success': True}

# Register in priority order
session.event_hub.subscribe(
    'topic=ftrack.update',
    handle_first,
    priority=100  # Higher priority runs first
)
session.event_hub.subscribe(
    'topic=ftrack.update',
    handle_second,
    priority=50
)
```

---

## JavaScript Event Handling

### Basic Subscription
```javascript
import ftrack from '@ftrack/api';

const session = new ftrack.Session(
  "https://company.ftrackapp.com",
  "user@example.com",
  "api-key"
);

await session.initializing;

// Subscribe to updates
session.eventHub.subscribe('topic=ftrack.update', (event) => {
  const entityType = event.data.entityType;
  console.log(`Updated: ${entityType}`);
});

// Connect to event hub
session.eventHub.connect();

// Disconnect when done
// session.eventHub.disconnect();
```

### Targeted Subscriptions
```javascript
// Filter by entity type
session.eventHub.subscribe('topic=ftrack.update', (event) => {
  const tasks = event.data.entities.filter(e => e.entityType === 'Task');
  
  if (tasks.length > 0) {
    console.log(`${tasks.length} tasks updated`);
    updateUI(tasks);
  }
});

// Filter by specific project
const projectId = 'abc-123';

session.eventHub.subscribe('topic=ftrack.update', (event) => {
  const projectEntities = event.data.entities.filter(e => 
    e.parentId === projectId || e.projectId === projectId
  );
  
  if (projectEntities.length > 0) {
    handleProjectUpdates(projectEntities);
  }
});

session.eventHub.connect();
```

### Multiple Event Types
```javascript
// Create events
session.eventHub.subscribe('topic=ftrack.create', (event) => {
  console.log('Created:', event.data.entityType);
  handleCreate(event.data);
});

// Update events
session.eventHub.subscribe('topic=ftrack.update', (event) => {
  console.log('Updated:', event.data.entityType);
  handleUpdate(event.data);
});

// Delete events
session.eventHub.subscribe('topic=ftrack.delete', (event) => {
  console.log('Deleted:', event.data.entityType);
  handleDelete(event.data);
});

session.eventHub.connect();
```

### React Integration
```javascript
import { useEffect, useState } from 'react';
import ftrack from '@ftrack/api';

function TaskDashboard() {
  const [tasks, setTasks] = useState([]);
  const [session] = useState(() => new ftrack.Session(/*...*/));
  
  useEffect(() => {
    // Initialize session
    session.initializing.then(() => {
      // Load initial data
      loadTasks();
      
      // Subscribe to real-time updates
      session.eventHub.subscribe('topic=ftrack.update', handleTaskUpdate);
      session.eventHub.connect();
    });
    
    // Cleanup
    return () => {
      session.eventHub.disconnect();
      session.close();
    };
  }, []);
  
  const handleTaskUpdate = (event) => {
    const taskUpdates = event.data.entities.filter(e => e.entityType === 'Task');
    
    if (taskUpdates.length > 0) {
      // Update state with new data
      setTasks(prevTasks => {
        const updated = [...prevTasks];
        taskUpdates.forEach(update => {
          const index = updated.findIndex(t => t.id === update.entityId);
          if (index >= 0) {
            updated[index] = { ...updated[index], ...update.changes };
          }
        });
        return updated;
      });
    }
  };
  
  const loadTasks = async () => {
    const response = await session.query('select name, status.name from Task');
    setTasks(response.data);
  };
  
  return (
    <div>
      {tasks.map(task => (
        <div key={task.id}>{task.name} - {task.status.name}</div>
      ))}
    </div>
  );
}
```

### Connection Management
```javascript
class EventManager {
  constructor(session) {
    this.session = session;
    this.connected = false;
    this.reconnectTimer = null;
  }
  
  connect() {
    if (this.connected) return;
    
    this.session.eventHub.connect();
    this.connected = true;
    
    // Handle disconnection
    this.session.eventHub.on('disconnect', () => {
      console.log('Event hub disconnected');
      this.connected = false;
      this.scheduleReconnect();
    });
    
    // Handle reconnection
    this.session.eventHub.on('connect', () => {
      console.log('Event hub connected');
      this.connected = true;
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
    });
  }
  
  scheduleReconnect() {
    // Retry connection after 5 seconds
    this.reconnectTimer = setTimeout(() => {
      console.log('Attempting to reconnect...');
      this.connect();
    }, 5000);
  }
  
  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    this.session.eventHub.disconnect();
    this.connected = false;
  }
}

// Usage
const manager = new EventManager(session);
manager.connect();
```

---

## Event Patterns

### Debounce Updates
```javascript
// Avoid processing duplicate events too quickly
function debounce(fn, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

const debouncedUpdate = debounce((event) => {
  console.log('Processing update after delay');
  handleUpdate(event);
}, 1000);

session.eventHub.subscribe('topic=ftrack.update', debouncedUpdate);
```

### Change Detection (Python)
```python
def handle_status_change(event):
    """Only process when status actually changes."""
    for entity in event['data'].get('entities', []):
        changes = entity.get('changes', {})
        
        # Check if status changed
        if 'statusId' in changes:
            old_status = changes['statusId']['old']
            new_status = changes['statusId']['new']
            print(f"Status changed: {old_status} -> {new_status}")
            
            # Trigger workflow
            if new_status == completed_status_id:
                trigger_completion_workflow(entity['entityId'])
    
    return {'success': True}

session.event_hub.subscribe(
    'topic=ftrack.update and data.entityType is "task"',
    handle_status_change
)
```

---

## Error Handling

### Python
```python
def safe_handler(event):
    """Handler with error handling."""
    try:
        # Process event
        process_event(event)
        return {'success': True}
    except Exception as e:
        # Log error but don't crash event hub
        print(f"Error handling event: {e}")
        return {'success': False, 'message': str(e)}

session.event_hub.subscribe('topic=ftrack.update', safe_handler)
```

### JavaScript
```javascript
session.eventHub.subscribe('topic=ftrack.update', (event) => {
  try {
    processEvent(event);
  } catch (error) {
    console.error('Error handling event:', error);
    // Don't throw - would disconnect event hub
  }
});
```

---

## Performance Tips

1. **Filter Early**: Use topic filters to reduce handler invocations
2. **Batch Operations**: Accumulate changes and commit once
3. **Async Processing**: Use queues for heavy operations
4. **Avoid Blocking**: Keep handlers fast, defer heavy work
5. **Cache Data**: Don't query for same data repeatedly
6. **Debounce**: Avoid processing duplicate events too quickly

---

## Common Use Cases

### Auto-assign Tasks
```python
def auto_assign_task(event):
    """Assign new tasks to next available user."""
    if event['data'].get('entityType') != 'task':
        return
    
    for entity in event['data'].get('entities', []):
        task_id = entity['entityId']
        task = session.query('Task where id is "{0}"'.format(task_id)).one()
        
        if not task['assignments']:
            # Assign to next available user
            user = get_next_available_user(session)
            session.create('Appointment', {
                'context': task,
                'resource': user,
                'type': 'assignment'
            })
            session.commit()
    
    return {'success': True}

session.event_hub.subscribe('topic=ftrack.create and data.entityType is "task"', auto_assign_task)
```

### Status Change Notifications
```javascript
session.eventHub.subscribe('topic=ftrack.update', async (event) => {
  const tasks = event.data.entities.filter(e => e.entityType === 'Task');
  
  for (const task of tasks) {
    if (task.changes?.statusId) {
      // Status changed - send notification
      const taskData = await session.get('Task', task.entityId);
      await sendNotification({
        title: `Task status changed: ${taskData.name}`,
        message: `Now ${taskData.status.name}`
      });
    }
  }
});
```

---

## Official Resources

- **Events Documentation**: https://developer.ftrack.com/websocket-events/
- **Python Event Hub**: https://ftrack-python-api.readthedocs.io/en/stable/event_hub.html
- **JavaScript Events**: https://developer.ftrack.com/api-clients/javascript/events.html
