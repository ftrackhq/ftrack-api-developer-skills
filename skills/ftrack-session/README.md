# ftrack Session Management

Focused skill for session initialization, authentication, and caching in ftrack.

## What This Skill Covers

- Session initialization patterns
- Context managers (Python)
- Environment variable configuration
- Cache management
- Connection pooling
- Authentication strategies
- Performance optimization
- Error handling

## When to Use

Invoke this skill when working with:
- Setting up ftrack connection
- Managing session lifecycle
- Configuring authentication
- Optimizing cache usage
- Connection pooling for high-traffic apps
- Session cleanup and error handling

## Quick Example

### Python
```python
# Context manager (recommended)
with ftrack_api.Session() as session:
    tasks = session.query('select name from Task').all()
    # Session closed automatically

# Disable event hub for scripts
session = ftrack_api.Session(auto_connect_event_hub=False)
```

### JavaScript
```javascript
const session = new ftrack.Session(
  "https://company.ftrackapp.com",
  "user@example.com",
  "api-key"
);

await session.initializing;

// Use session...

// Cleanup
session.close();
```

## Invocation

```bash
/ftrack-session
```

Or automatically via `/ftrack-api-developer` when session-related keywords detected.

## Token Usage

~400 tokens (vs 3,500 for full ftrack skill)

## Related Skills

- `/ftrack-query` - For using sessions to query
- `/ftrack-events` - For event hub management
