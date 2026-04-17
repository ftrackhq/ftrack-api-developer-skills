# ftrack Event Handling

Focused skill for real-time event subscriptions and WebSocket management in ftrack.

## What This Skill Covers

- Event hub initialization
- Topic-based subscriptions
- Event filtering patterns
- Async event processing
- Batch event handling
- Connection management
- React/UI integration

## When to Use

Invoke this skill when working with:
- Real-time updates from ftrack
- WebSocket connections
- Event-driven workflows
- Auto-updating dashboards
- Triggering actions on entity changes
- Building reactive UIs

## Quick Example

### Python
```python
def handle_update(event):
    print(f"Updated: {event['data']['entityType']}")
    return {'success': True}

session.event_hub.subscribe('topic=ftrack.update', handle_update)
session.event_hub.wait()
```

### JavaScript
```javascript
session.eventHub.subscribe('topic=ftrack.update', (event) => {
  console.log('Updated:', event.data.entityType);
});

session.eventHub.connect();
```

## Invocation

```bash
/ftrack-events
```

Or automatically via `/ftrack-api-developer` when event-related keywords detected.

## Token Usage

~600 tokens (vs 3,500 for full ftrack skill)

## Related Skills

- `/ftrack-query` - For fetching initial data
- `/ftrack-session` - For connection management
