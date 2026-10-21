---
name: ftrack-javascript
description: ftrack JavaScript integration - async patterns, browser/Node.js, bundling, ES6+ features
---

TRIGGER when: JavaScript/JS file imports `@ftrack/api`; code uses async/await with ftrack Session; browser/Node.js code with ftrack; user asks about ftrack in JavaScript, ES6+, React integration, webpack/bundling with ftrack.
SKIP: TypeScript files (use ftrack-typescript instead), Python ftrack code, general JavaScript without ftrack.

# ftrack JavaScript Expert

**Strategy**: Quick reference first → Fetch online docs if needed → Load local examples as fallback

## Environment Detection
- **Browser**: DOM available, `window` object, ES6 modules
- **Node.js**: `process.env`, filesystem access, CommonJS or ES modules
- **React**: JSX syntax, hooks, component patterns

---

## Quick Reference (Use First - 70% of Queries)

### Core Principles
✓ **Use async/await**: Modern promise handling over `.then()` chains
✓ **Error handling**: Always wrap in try/catch blocks
✓ **Wait for initializing**: `await session.initializing` before using session
✓ **Close sessions**: Call `session.close()` when done
✓ **Parse responses**: Access data with `response.data`
✗ Avoid callback chains (use async/await instead)
✗ Never ignore promise rejections
✗ Don't forget to wait for `session.initializing`

### Session Initialization

**Node.js**
```javascript
import ftrack from '@ftrack/api';

const session = new ftrack.Session(
  process.env.FTRACK_SERVER,
  process.env.FTRACK_API_USER,
  process.env.FTRACK_API_KEY
);

await session.initializing;
// Ready to use
```

**Browser**
```javascript
import ftrack from '@ftrack/api';

const session = new ftrack.Session(
  'https://company.ftrackapp.com',
  'user@example.com',
  'api-key'
);

await session.initializing;
```

**With Error Handling**
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

### Query Patterns

**Basic Query**
```javascript
async function getTasks(projectId) {
  const response = await session.query(
    `select name, status.name from Task where project.id is "${projectId}"`
  );
  return response.data;
}
```

**Error Handling**
```javascript
async function getTaskSafely(taskId) {
  try {
    const task = await session.get('Task', taskId);
    return task;
  } catch (error) {
    console.error('Task not found:', error);
    return null;
  }
}
```

**Iteration**
```javascript
async function processAllTasks() {
  const response = await session.query('select name from Task');
  
  response.data.forEach(task => {
    console.log(task.name);
  });
}
```

### CRUD Operations

**Create**
```javascript
const task = await session.create('Task', {
  name: 'New Task',
  parent_id: parentId,
  type_id: taskTypeId
});
```

**Update**
```javascript
const task = await session.get('Task', taskId);
task.name = 'Updated Name';
await session.commit();
```

**Delete**
```javascript
await session.delete('Task', taskId);
await session.commit();
```

### File Upload (Browser)

```javascript
// HTML: <input type="file" id="fileInput">
const file = document.getElementById('fileInput').files[0];

const component = await session.create('FileComponent', {
  name: file.name,
  file_type: file.type,
  size: file.size,
  version_id: assetVersionId
});

await session.upload(component.id, file, {
  onProgress: (progress) => {
    const percent = Math.round((progress.loaded / progress.total) * 100);
    console.log(`Progress: ${percent}%`);
  }
});
```

### React Integration

**Basic Hook**
```javascript
import { useState, useEffect } from 'react';

function TaskList({ projectId }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchTasks() {
      try {
        const response = await session.query(
          `select name from Task where project.id is "${projectId}"`
        );
        setTasks(response.data);
      } catch (error) {
        console.error('Failed to load tasks:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchTasks();
  }, [projectId]);
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <ul>
      {tasks.map(task => <li key={task.id}>{task.name}</li>)}
    </ul>
  );
}
```

**Custom Session Hook**
```javascript
function useFtrackSession() {
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    async function init() {
      try {
        const s = new ftrack.Session(server, user, key);
        await s.initializing;
        setSession(s);
      } catch (err) {
        setError(err);
      }
    }
    
    init();
    
    return () => {
      if (session) session.close();
    };
  }, []);
  
  return { session, error };
}
```

### Node.js Patterns

**Environment Variables**
```javascript
// .env file
// FTRACK_SERVER=https://company.ftrackapp.com
// FTRACK_API_USER=username
// FTRACK_API_KEY=api-key

import 'dotenv/config';
import ftrack from '@ftrack/api';

const session = new ftrack.Session(
  process.env.FTRACK_SERVER,
  process.env.FTRACK_API_USER,
  process.env.FTRACK_API_KEY
);
```

**Batch Processing**
```javascript
async function processBatch(taskIds) {
  const promises = taskIds.map(id => session.get('Task', id));
  const tasks = await Promise.all(promises);
  
  tasks.forEach(task => {
    task.status_id = newStatusId;
  });
  
  await session.commit();
}
```

**→ This quick reference handles most JavaScript ftrack patterns. For advanced usage, continue below.**

---

## Online Resources (Fetch for Detailed Info)

### When to Fetch
- User asks for "complete JavaScript API reference"
- Needs browser vs Node.js differences
- Installation and getting-started steps
- Advanced async patterns or performance optimization
- Official module imports and exports

### JavaScript API Documentation
**URL**: `https://developer.ftrack.com/api-clients/javascript/`
**Fetch Prompt**:
```
Extract ftrack JavaScript API patterns and reference. Include:
- Session initialization for browser and Node.js
- Async/await query patterns
- CRUD operations with examples
- File upload and download
- Event hub integration
- Error handling best practices
- Promise-based operations
- Browser vs Node.js differences
- Performance optimization tips
Format as markdown with ES6+ async/await examples.
```

### JavaScript Query Documentation
**URL**: `https://developer.ftrack.com/api/query-language`
**Fetch Prompt**:
```
Extract ftrack JavaScript query patterns. Include:
- Query syntax with string interpolation
- Response data access (response.data)
- Async iteration patterns
- Error handling in queries
- Pagination with JavaScript
- Query optimization tips
Format as markdown with modern ES6+ examples.
```

### Installation & Tutorial
**URLs**: `https://developer.ftrack.com/api-clients/javascript/installing`, `https://developer.ftrack.com/api-clients/javascript/tutorial`
**Fetch Prompt**:
```
Extract ftrack JavaScript API installation and getting-started steps. Include package install, session creation, first query, create/update/delete. Format as markdown.
```

**Note**: ftrack has no official bundling guide. `@ftrack/api` is a standard npm ES module, so answer webpack/Vite/Rollup questions with general bundler knowledge rather than fetching.

### WebFetch Decision Tree

**IMPORTANT**: Actively check user query for trigger phrases, then use WebFetch.

**Trigger detection** (check user's exact query):
```python
trigger_phrases = [
    "complete javascript api",
    "official javascript docs",
    "browser vs node.js",
    "getting started javascript",
    "all javascript methods",
    "es6 module setup",
    "performance optimization javascript"
]
```

**Action when trigger detected:**
1. **Detect environment**: Browser, Node.js, or React
2. **Detect topic**: API reference, installation, or patterns
3. **Use WebFetch** with appropriate URL above
4. **If fetch succeeds**: Return formatted docs to user
5. **If fetch fails**: Gracefully fallback to local example (see "Local Examples" section)

**WebFetch Example:**
```markdown
# User asks: "Show me the official getting started for ftrack JavaScript"

WebFetch(
  url="https://developer.ftrack.com/api-clients/javascript/tutorial",
  prompt="Extract the ftrack JavaScript tutorial steps: session setup, querying, creating and updating entities. Format as markdown with code examples."
)

If successful: Present docs
If fails: Load examples/javascript/session-management.js
```

---

## Local Examples (Fallback - Load Only When Needed)

### When to Load Local
1. WebFetch fails or times out
2. User explicitly requests "show me the example file"
3. Need complete runnable JavaScript implementations
4. Advanced patterns like batch processing, React hooks

### Available Local Files

**CRUD Operations Example**
- **File**: `examples/javascript/crud-operations.js`
- **Contains**: Create, read, update, delete patterns with error handling
- **Load when**: User needs comprehensive CRUD examples
- **Size**: ~400 lines

**Query Operations Example**
- **File**: `examples/javascript/query-operations.js`
- **Contains**: Advanced query patterns, pagination, filtering, aggregation
- **Load when**: User needs query optimization patterns
- **Size**: ~400 lines

**Session Management Example**
- **File**: `examples/javascript/session-management.js`
- **Contains**: Session lifecycle, connection pooling, error recovery
- **Load when**: User needs production session patterns
- **Size**: ~350 lines

**Event Handling Example**
- **File**: `examples/javascript/event-handling.js`
- **Contains**: Event subscriptions, React integration, debouncing
- **Load when**: User needs event handling patterns
- **Size**: ~400 lines

**File Operations Example**
- **File**: `examples/javascript/file-operations.js`
- **Contains**: Browser/Node.js file upload/download, progress tracking
- **Load when**: User needs file handling patterns
- **Size**: ~400 lines

### How to Load
Paths are relative to this skill's directory (the folder containing this SKILL.md). Read only the file you need, then extract the sections relevant to the user's question.

---

## Decision Tree

```
User asks about ftrack JavaScript
  │
  ├─ Session setup (how do I connect)?
  │   └→ Use Quick Reference above ✓
  │
  ├─ Query patterns?
  │   └→ Use Quick Reference above ✓
  │
  ├─ CRUD operations?
  │   └→ Use Quick Reference above ✓
  │
  ├─ File upload (browser)?
  │   └→ Use Quick Reference above ✓
  │
  ├─ React integration?
  │   └→ Use Quick Reference (hooks) ✓
  │
  ├─ Complete API reference or browser vs Node.js?
  │   ├→ WebFetch JavaScript API docs
  │   └→ If fails: Load session-management.js
  │
  ├─ Webpack/bundling configuration?
  │   └→ Answer from general bundler knowledge (no official guide)
  │
  └─ Production-ready examples?
      └→ Load specific example file (crud, query, session, etc.)
```

---

## Response Strategy

### For Simple Questions
1. Answer using Quick Reference patterns
2. Show appropriate environment (browser/Node.js/React)
3. Keep concise (1 example)
4. Cite: "From JavaScript quick reference"

### For Detailed Questions
1. Start with Quick Reference context
2. If trigger detected: WebFetch JavaScript documentation
3. Provide environment-specific examples
4. Cite: "From [URL]"
5. If fetch fails: Load local example + cite filename

### For Advanced Questions (Bundling, Performance)
1. Check if Quick Reference covers it
2. If not: WebFetch JavaScript docs (bundling: general knowledge)
3. If insufficient or fails: Load local example file
4. Provide production-ready code
5. Cite all sources used

### Progressive Disclosure
- Start minimal (quick reference - session + query)
- Offer more: "Need the complete API reference? I can fetch official docs"
- Load comprehensive examples only if requested or if WebFetch fails

---

## Common Patterns

### Async Iteration
```javascript
async function processAllProjects() {
  const response = await session.query('select name from Project');
  
  for (const project of response.data) {
    await processProject(project);
  }
}
```

### Parallel Queries
```javascript
async function loadDashboard() {
  const [tasks, projects, users] = await Promise.all([
    session.query('select name from Task'),
    session.query('select name from Project'),
    session.query('select username from User')
  ]);
  
  return { tasks: tasks.data, projects: projects.data, users: users.data };
}
```

### Retry Logic
```javascript
async function queryWithRetry(queryString, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await session.query(queryString);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

### Environment Detection
```javascript
const isNode = typeof process !== 'undefined' && process.versions?.node;
const isBrowser = typeof window !== 'undefined';

if (isNode) {
  // Node.js specific code
  const fs = await import('fs');
} else if (isBrowser) {
  // Browser specific code
  const fileInput = document.getElementById('upload');
}
```

---

## Browser vs Node.js Differences

| Feature | Browser | Node.js |
|---------|---------|---------|
| **Import** | ES modules (`import`) | ES modules or CommonJS (`require`) |
| **Environment** | `window` object | `process.env` |
| **File Upload** | `File` API, `<input type="file">` | `fs.readFileSync()`, `Buffer` |
| **File Download** | `window.open()`, `Blob` | `fs.writeFileSync()`, streams |
| **Auth** | Hardcoded or from form | Environment variables |
| **Bundling** | Webpack, Rollup required | Optional, can run directly |

---

## Performance Tips

1. **Use async/await consistently**: Avoid mixing with `.then()`
2. **Batch operations**: Use `Promise.all()` for parallel queries
3. **Close sessions**: Always call `session.close()` when done
4. **Debounce updates**: In React, debounce rapid state changes
5. **Cache responses**: Store frequently accessed data in state/memory
