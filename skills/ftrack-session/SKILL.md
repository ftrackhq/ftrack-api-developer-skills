---
name: ftrack-session
description: ftrack session management - initialization, authentication, caching, connection pooling
---

TRIGGER when: code contains `ftrack_api.Session()` or `new ftrack.Session()`; file deals with session initialization, authentication, API keys, cache management; user asks about connecting to ftrack, session setup, API authentication, or connection pooling.
SKIP: general authentication, HTTP sessions, database connections without ftrack.

# ftrack Session Management Expert

Master session initialization, authentication, caching, and connection management for optimal performance.

## Quick Start

Detect user's language:
- **Python**: `ftrack_api.Session()`, context managers
- **JavaScript**: `new ftrack.Session()`, `await session.initializing`

---

## Python Session Management

### Basic Session
```python
import ftrack_api

# Auto-connect to event hub (default)
session = ftrack_api.Session()

# Disable event hub (better for scripts)
session = ftrack_api.Session(auto_connect_event_hub=False)

# Custom server/credentials
session = ftrack_api.Session(
    server_url='https://company.ftrackapp.com',
    api_key='your-api-key',
    api_user='your-username'
)
```

### Context Manager (Recommended)
```python
# Automatic cleanup
with ftrack_api.Session() as session:
    tasks = session.query('select name from Task').all()
    # Session closed automatically

# With custom config
with ftrack_api.Session(auto_connect_event_hub=False) as session:
    # Do work
    pass
```

### Manual Cleanup
```python
session = ftrack_api.Session()
try:
    # Do work
    tasks = session.query('select name from Task').all()
finally:
    # Always close
    session.close()
```

### Environment Variables
```python
import os

# Set before importing ftrack_api
os.environ['FTRACK_SERVER'] = 'https://company.ftrackapp.com'
os.environ['FTRACK_API_KEY'] = 'your-api-key'
os.environ['FTRACK_API_USER'] = 'your-username'

# Auto-picked up by Session()
session = ftrack_api.Session()
```

---

## JavaScript Session Management

### Basic Session
```javascript
import ftrack from '@ftrack/api';

const session = new ftrack.Session(
  "https://company.ftrackapp.com",
  "user@example.com",
  "api-key"
);

// Wait for initialization
await session.initializing;

// Use session
const tasks = await session.query('select name from Task');

// Cleanup
session.close();
```

### Environment Variables (Node.js)
```javascript
// .env file
// FTRACK_SERVER=https://company.ftrackapp.com
// FTRACK_API_USER=user@example.com
// FTRACK_API_KEY=your-api-key

import dotenv from 'dotenv';
dotenv.config();

const session = new ftrack.Session(
  process.env.FTRACK_SERVER,
  process.env.FTRACK_API_USER,
  process.env.FTRACK_API_KEY
);
```

### React Hook
```javascript
import { useState, useEffect } from 'react';
import ftrack from '@ftrack/api';

function useFtrackSession() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);
  
  useEffect(() => {
    const ftrackSession = new ftrack.Session(
      process.env.REACT_APP_FTRACK_SERVER,
      process.env.REACT_APP_FTRACK_USER,
      process.env.REACT_APP_FTRACK_KEY
    );
    
    ftrackSession.initializing.then(() => {
      setSession(ftrackSession);
      setReady(true);
    });
    
    return () => {
      ftrackSession.close();
    };
  }, []);
  
  return { session, ready };
}

// Usage
function App() {
  const { session, ready } = useFtrackSession();
  
  if (!ready) return <div>Connecting...</div>;
  
  return <Dashboard session={session} />;
}
```

---

## Cache Management (Python)

### Understanding Cache
```python
# Session maintains cache of fetched entities
task = session.query('Task where id is "{0}"'.format(task_id)).one()

# Second query uses cached result (no API call)
same_task = session.get('Task', task_id)

# Check cache
print(f"Cache size: {len(session.cache)}")
```

### Clear Cache
```python
# Clear specific entity type
session.cache.clear('Task')

# Clear entire cache
session.cache.clear()

# Clear after bulk operations
for i in range(1000):
    task = session.create('Task', {...})
    if i % 100 == 0:
        session.commit()
        session.cache.clear('Task')  # Prevent memory issues
```

### Cache Control
```python
# Disable cache for specific query
session.cache_key_maker = lambda entity, keys: None

# Custom cache key
def custom_cache_key(entity, keys):
    """Generate cache key."""
    return (entity.entity_type, tuple(sorted(keys.items())))

session.cache_key_maker = custom_cache_key
```

### Auto-Populating Context
```python
# Optimize bulk creates
with session.auto_populating():
    tasks = [
        session.create('Task', {
            'name': f'Task {i}',
            'parent_id': project_id
        })
        for i in range(100)
    ]

# Commit once outside context
session.commit()
```

---

## Connection Pooling (JavaScript)

### Session Manager
```javascript
class SessionManager {
  constructor(config) {
    this.config = config;
    this.sessions = [];
    this.maxSessions = 5;
  }
  
  async getSession() {
    // Reuse existing idle session
    const idle = this.sessions.find(s => !s.busy);
    if (idle) {
      idle.busy = true;
      return idle.session;
    }
    
    // Create new if under limit
    if (this.sessions.length < this.maxSessions) {
      const session = new ftrack.Session(
        this.config.server,
        this.config.user,
        this.config.key
      );
      
      await session.initializing;
      
      const entry = { session, busy: true };
      this.sessions.push(entry);
      return session;
    }
    
    // Wait for available session
    await new Promise(resolve => setTimeout(resolve, 100));
    return this.getSession();
  }
  
  releaseSession(session) {
    const entry = this.sessions.find(s => s.session === session);
    if (entry) {
      entry.busy = false;
    }
  }
  
  async closeAll() {
    await Promise.all(
      this.sessions.map(s => s.session.close())
    );
    this.sessions = [];
  }
}

// Usage
const manager = new SessionManager({
  server: 'https://company.ftrackapp.com',
  user: 'user@example.com',
  key: 'api-key'
});

async function processTask(taskId) {
  const session = await manager.getSession();
  try {
    const task = await session.get('Task', taskId);
    // Process task
  } finally {
    manager.releaseSession(session);
  }
}

// Cleanup
await manager.closeAll();
```

---

## Performance Optimization

### Python: Lazy Loading
```python
# Query returns proxies, not full entities
tasks = session.query('Task where project.id is "{0}"'.format(pid)).all()

# Accessing attribute triggers fetch if not cached
for task in tasks:
    print(task['name'])  # Fetches if needed
```

### Python: Batch Commits
```python
# BAD: Multiple commits
for data in task_data:
    task = session.create('Task', data)
    session.commit()  # Slow!

# GOOD: Single commit
tasks = [session.create('Task', data) for data in task_data]
session.commit()  # Fast!
```

### JavaScript: Batch Requests
```javascript
// BAD: Multiple requests
const task1 = await session.get('Task', id1);
const task2 = await session.get('Task', id2);
const task3 = await session.get('Task', id3);

// GOOD: Single query
const tasks = await session.query(
  `select name, status.name from Task where id in ("${id1}", "${id2}", "${id3}")`
);
```

### Connection Reuse
```python
# BAD: New session per operation
def get_task(task_id):
    session = ftrack_api.Session()
    task = session.get('Task', task_id)
    session.close()
    return task

# GOOD: Reuse session
session = ftrack_api.Session()

def get_task(task_id):
    return session.get('Task', task_id)

# Use across multiple calls
task1 = get_task(id1)
task2 = get_task(id2)

session.close()
```

---

## Authentication Patterns

### API Key (Production)
```python
# Most secure for production
session = ftrack_api.Session(
    server_url='https://company.ftrackapp.com',
    api_key='your-api-key',
    api_user='api_user@company.com'
)
```

### Personal API Key
```python
# For user-specific scripts
# Get from: ftrack > Account > API Keys
session = ftrack_api.Session(
    server_url='https://company.ftrackapp.com',
    api_key='user-personal-key',
    api_user='user@company.com'
)
```

### Service Account
```python
# For automated services/actions
# Create dedicated service account with minimal permissions
session = ftrack_api.Session(
    server_url='https://company.ftrackapp.com',
    api_key='service-account-key',
    api_user='service@company.com'
)
```

---

## Error Handling

### Connection Errors (Python)
```python
import ftrack_api.exception

try:
    session = ftrack_api.Session()
    tasks = session.query('Task').all()
except ftrack_api.exception.ServerError as e:
    print(f"Server error: {e}")
except ftrack_api.exception.NotFoundError as e:
    print(f"Not found: {e}")
except Exception as e:
    print(f"Connection error: {e}")
finally:
    if 'session' in locals():
        session.close()
```

### Connection Errors (JavaScript)
```javascript
try {
  const session = new ftrack.Session(
    server,
    user,
    key
  );
  
  await session.initializing;
  
  const tasks = await session.query('Task');
} catch (error) {
  if (error.response?.status === 401) {
    console.error('Authentication failed');
  } else if (error.response?.status === 404) {
    console.error('Server not found');
  } else {
    console.error('Connection error:', error.message);
  }
}
```

### Retry Logic
```python
import time

def create_session_with_retry(max_attempts=3):
    """Create session with retry logic."""
    for attempt in range(max_attempts):
        try:
            session = ftrack_api.Session()
            # Test connection
            session.query('User').first()
            return session
        except Exception as e:
            if attempt < max_attempts - 1:
                wait = 2 ** attempt  # Exponential backoff
                print(f"Connection failed, retrying in {wait}s...")
                time.sleep(wait)
            else:
                raise Exception(f"Failed after {max_attempts} attempts: {e}")

session = create_session_with_retry()
```

---

## Configuration Best Practices

### Python Config File
```python
# config.py
import os

FTRACK_CONFIG = {
    'server_url': os.getenv('FTRACK_SERVER', 'https://company.ftrackapp.com'),
    'api_key': os.getenv('FTRACK_API_KEY'),
    'api_user': os.getenv('FTRACK_API_USER'),
    'auto_connect_event_hub': os.getenv('FTRACK_AUTO_CONNECT', 'false').lower() == 'true'
}

# Usage
from config import FTRACK_CONFIG
session = ftrack_api.Session(**FTRACK_CONFIG)
```

### JavaScript Config
```javascript
// config.js
export const ftrackConfig = {
  server: process.env.FTRACK_SERVER || 'https://company.ftrackapp.com',
  user: process.env.FTRACK_API_USER,
  key: process.env.FTRACK_API_KEY
};

// Usage
import { ftrackConfig } from './config';
const session = new ftrack.Session(
  ftrackConfig.server,
  ftrackConfig.user,
  ftrackConfig.key
);
```

---

## Session Information

### Python
```python
# Get server info
info = session.server_information
print(f"Server: {info['server_version']}")

# Get current user
user = session.query('User where username is "{0}"'.format(
    session._api_user
)).one()
print(f"Logged in as: {user['email']}")
```

### JavaScript
```javascript
// Get server info
const info = await session.getServerInformation();
console.log('Server:', info.version);

// Get current user
const response = await session.query(
  `select email from User where username is "${session.apiUser}"`
);
console.log('Logged in as:', response.data[0].email);
```

---

## Best Practices

1. **Use Context Managers** (Python): Ensures cleanup
2. **Disable Event Hub**: If not needed (scripts/batch jobs)
3. **Reuse Sessions**: Don't create per-operation
4. **Clear Cache**: After bulk operations
5. **Environment Variables**: For credentials (never hardcode)
6. **Connection Pooling**: For high-traffic applications
7. **Error Handling**: Always wrap in try/catch
8. **Batch Operations**: Commit once, not per entity

---

## Official Resources

- **Python Session**: https://ftrack-python-api.readthedocs.io/en/stable/introduction.html#session
- **JavaScript Session**: https://developer.ftrack.com/api-clients/javascript/getting-started.html
- **Authentication**: https://developer.ftrack.com/api-clients/authentication.html
