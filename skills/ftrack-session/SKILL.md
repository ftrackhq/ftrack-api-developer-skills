---
name: ftrack-session
description: ftrack session management - initialization, authentication, caching, connection pooling
---

TRIGGER when: code contains `ftrack_api.Session()` or `new ftrack.Session()`; file deals with session initialization, authentication, API keys, cache management; user asks about connecting to ftrack, session setup, API authentication, or connection pooling.
SKIP: general authentication, HTTP sessions, database connections without ftrack.

# ftrack Session Management Expert

**Strategy**: Quick reference first → Fetch online docs if needed → Load local examples as fallback

## Language Detection
- **Python**: `ftrack_api.Session()`, context managers, `import ftrack_api`
- **JavaScript**: `new ftrack.Session()`, `await session.initializing`, `import ftrack`

---

## Quick Reference (Use First - 70% of Queries)

### Core Patterns

**Python - Basic Session**
```python
import ftrack_api

# Auto-connect (default)
session = ftrack_api.Session()

# Script mode (no event hub)
session = ftrack_api.Session(auto_connect_event_hub=False)

# Custom credentials
session = ftrack_api.Session(
    server_url='https://company.ftrackapp.com',
    api_key='your-api-key',
    api_user='your-username'
)
```

**Python - Context Manager (Recommended)**
```python
# Automatic cleanup
with ftrack_api.Session() as session:
    tasks = session.query('select name from Task').all()
    # Session closed automatically
```

**Python - Environment Variables**
```python
import os
os.environ['FTRACK_SERVER'] = 'https://company.ftrackapp.com'
os.environ['FTRACK_API_KEY'] = 'your-api-key'
os.environ['FTRACK_API_USER'] = 'your-username'

session = ftrack_api.Session()  # Auto-picked up
```

**JavaScript - Basic Session**
```javascript
import ftrack from '@ftrack/api';

const session = new ftrack.Session(
  "https://company.ftrackapp.com",
  "user@example.com",
  "api-key"
);

await session.initializing;  // Wait for ready
const tasks = await session.query('select name from Task');
session.close();  // Cleanup
```

**JavaScript - With Error Handling**
```javascript
async function createSession() {
  try {
    const session = new ftrack.Session(server, user, key);
    await session.initializing;
    return session;
  } catch (error) {
    console.error('Session failed:', error);
    throw error;
  }
}
```

**Key Principles:**
- ✓ Use context managers in Python
- ✓ Wait for `session.initializing` in JavaScript
- ✓ Disable event hub for scripts (`auto_connect_event_hub=False`)
- ✓ Always close sessions when done
- ✓ Use environment variables for credentials

**→ This quick reference handles most session setup. For advanced usage, continue below.**

---

## Online Resources (Fetch for Detailed Info)

### When to Fetch
- User needs cache configuration details
- Questions about connection pooling or performance
- Advanced authentication scenarios
- Server information or capabilities
- Plugin or hook configuration

### Python Documentation
**URL**: `https://developer.ftrack.com/api-clients/python/session.html`
**Fetch Prompt**:
```
Extract ftrack Python session management patterns. Include:
- Session initialization with all parameters
- Cache configuration and strategies
- Auto-populating and lazy loading
- Connection pooling
- Server information access
- Plugin and schema setup
Format as markdown with code examples.
```

### JavaScript Documentation
**URL**: `https://developer.ftrack.com/api-clients/javascript/session.html`
**Fetch Prompt**:
```
Extract ftrack JavaScript session patterns. Include:
- Session initialization with options
- Promise-based initialization
- Connection management
- Error handling
- Environment configuration
Format as markdown with async/await examples.
```

### Authentication Guide
**URL**: `https://developer.ftrack.com/ftrack/api/authentication.html`
**Fetch Prompt**:
```
Extract ftrack authentication methods and best practices. Include:
- API key generation
- User authentication
- Service accounts
- Security considerations
Format as markdown.
```

### WebFetch Decision Tree

**IMPORTANT**: Actively check user query for trigger phrases, then use WebFetch.

**Trigger detection** (check user's exact query):
```python
trigger_phrases = [
    "show all authentication methods",
    "complete session options",
    "official session docs",
    "cache configuration details",
    "connection pooling patterns",
    "all session parameters",
    "advanced session configuration",
    "session initialization options"
]
```

**Action when trigger detected:**
1. **Detect language**: Python (`ftrack_api.Session`) or JavaScript (`new ftrack.Session`)
2. **Detect topic**: Session init, authentication, or caching
3. **Use WebFetch** with appropriate URL above
4. **If fetch succeeds**: Return formatted docs to user
5. **If fetch fails**: Gracefully fallback to local example (see "Local Examples" section)

**WebFetch Example:**
```markdown
# User asks: "Show me all session parameters for Python"
# Trigger detected: "all session parameters"
# Language detected: "Python"

Use WebFetch tool:
WebFetch(
  url="https://developer.ftrack.com/api-clients/python/session.html",
  prompt="Extract ftrack Python Session initialization parameters. Include all __init__ arguments, cache options, plugin configuration, and connection settings. Format as markdown with examples."
)

If successful: Present docs
If fails: Load examples/python/performance_optimization.py (session section)
```

---

## Local Examples (Fallback - Load Only When Needed)

### When to Load Local
1. WebFetch fails or times out
2. User explicitly requests "local examples" or file names
3. Need complete runnable session management code
4. Advanced caching or pooling implementations

### Available Local Files

**Python Comprehensive Examples**
- **File**: `examples/python/performance_optimization.py`
- **Contains**: Session creation, caching, connection management, batch patterns
- **Load when**: Need Python production session patterns, caching strategies
- **Size**: ~300 lines (session sections ~50 lines)

**JavaScript Comprehensive Examples**
- **File**: `examples/javascript/session-management.js`
- **Contains**: Session initialization, connection handling, manager class, error patterns
- **Load when**: Need JavaScript session patterns, connection pooling, lifecycle management
- **Size**: ~350 lines

**Python Exception Handling**
- **File**: `examples/python/exception_handling.py`
- **Contains**: `ftrack_api.exception` handling, retry decorators, safe commit/rollback patterns
- **Load when**: User needs robust error handling or retry logic around session operations
- **Size**: ~280 lines

### How to Load
Paths are relative to this skill's directory (the folder containing this SKILL.md). Read only the file you need, then extract the sections relevant to the user's question.

---

## Decision Tree

```
User asks about ftrack sessions
  │
  ├─ Basic setup (how to connect)?
  │   └→ Use Quick Reference above ✓
  │
  ├─ Environment variables or credentials?
  │   └→ Use Quick Reference above ✓
  │
  ├─ Cache configuration or advanced options?
  │   ├→ WebFetch session documentation
  │   └→ If fails: Load local examples
  │
  ├─ Authentication methods or security?
  │   ├→ WebFetch authentication guide
  │   └→ If fails: Use Quick Reference + guidance
  │
  ├─ Connection pooling or performance?
  │   ├→ WebFetch session docs
  │   └→ If fails: Load local examples
  │
  └─ Complete example code?
      └→ Load specific example file directly
```

---

## Response Strategy

### For Simple Questions
1. Answer using Quick Reference
2. Show appropriate pattern (Python or JavaScript)
3. Keep concise (1-2 examples)
4. Cite: "From core session patterns"

### For Detailed Questions
1. Start with Quick Reference context
2. WebFetch relevant documentation section
3. Provide specific configuration examples
4. Cite: "From [URL]"
5. If fetch fails: Use local examples + cite filename

### For Advanced Questions
1. Assess complexity (caching, pooling, plugins)
2. WebFetch session documentation first
3. If insufficient, load local examples
4. Provide production-ready code
5. Cite all sources used

### Progressive Disclosure
- Start minimal (quick reference)
- Offer more: "Need cache configuration? I can fetch detailed docs"
- Load comprehensive examples only if requested

---

## Error Handling

### If WebFetch Fails
```markdown
I attempted to fetch the latest session documentation from ftrack's official site,
but it's currently unavailable. I'll use local examples instead.

[Proceed to load relevant local example file]

Note: For current documentation, visit:
https://developer.ftrack.com/api-clients/python/session.html
```

### If Local Files Missing
```markdown
I don't have access to the comprehensive example files.
Let me provide a solution based on the quick reference patterns...

[Use quick reference + standard session patterns]
```

---

## Common Issues & Solutions

### Issue: "Connection Failed"
```python
# Check credentials
print(session.server_information())

# Verify environment variables
import os
print(os.environ.get('FTRACK_SERVER'))
print(os.environ.get('FTRACK_API_USER'))
```

### Issue: "Performance Slow"
```python
# Disable event hub for scripts
session = ftrack_api.Session(auto_connect_event_hub=False)

# Configure cache
session = ftrack_api.Session(cache=my_custom_cache)
```

### Issue: "JavaScript Not Initializing"
```javascript
// Always await initialization
await session.initializing;

// Check for errors
session.on('error', (error) => {
  console.error('Session error:', error);
});
```

---

## Testing Examples

### Should Use Quick Reference Only
Q: "How do I create a ftrack session in Python?"
Q: "Show me basic JavaScript session initialization"
Q: "How do I use environment variables for credentials?"
Q: "What's the recommended way to manage sessions?"

### Should Trigger WebFetch
Q: "How do I configure the session cache in detail?"
Q: "What are all the session initialization parameters?"
Q: "How does connection pooling work in ftrack?"
Q: "Official documentation for session authentication"

### Should Load Local Examples
Q: "Show me the session-management.js file"
Q: "I need complete session lifecycle examples"
Q: WebFetch fails
Q: "Use local examples for session patterns"
