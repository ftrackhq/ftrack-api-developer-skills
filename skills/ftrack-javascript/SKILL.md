---
name: ftrack-javascript
description: ftrack JavaScript integration - async patterns, browser/Node.js, bundling, ES6+ features
trigger: javascript, js, async, await, browser, nodejs, webpack
---

# ftrack JavaScript Expert

Build modern ftrack applications with JavaScript ES6+, async/await patterns, and best practices for both browser and Node.js environments.

## Prerequisites

```bash
# Node.js
npm install @ftrack/api

# Browser (via CDN)
<script src="https://unpkg.com/@ftrack/api"></script>
```

---

## Session Initialization

### Node.js Session
```javascript
import ftrack from '@ftrack/api';

const session = new ftrack.Session(
  process.env.FTRACK_SERVER,
  process.env.FTRACK_API_USER,
  process.env.FTRACK_API_KEY
);

// Wait for initialization
await session.initializing;

// Always close when done
session.close();
```

### Browser Session
```javascript
// Using ES6 modules
import ftrack from '@ftrack/api';

const session = new ftrack.Session(
  'https://company.ftrackapp.com',
  'username',
  'api-key'
);

await session.initializing;
```

### With Error Handling
```javascript
async function createSession() {
  try {
    const session = new ftrack.Session(
      process.env.FTRACK_SERVER,
      process.env.FTRACK_API_USER,
      process.env.FTRACK_API_KEY
    );

    await session.initializing;
    console.log('✓ Session initialized');
    return session;

  } catch (error) {
    console.error('Session initialization failed:', error);
    throw error;
  }
}
```

---

## Async/Await Patterns

### Basic Query Pattern
```javascript
async function getTasks(session, projectId) {
  const response = await session.query(
    `select name, status.name from Task where project.id is "${projectId}"`
  );

  return response.data;
}
```

### Error Handling
```javascript
async function getTaskSafely(session, taskId) {
  try {
    const task = await session.get('Task', taskId);
    return task;

  } catch (error) {
    if (error.response?.status === 404) {
      console.log('Task not found');
      return null;
    }
    throw error; // Re-throw unexpected errors
  }
}
```

### Parallel Operations
```javascript
async function fetchMultipleEntities(session) {
  // Execute queries in parallel using Promise.all
  const [projects, tasks, users] = await Promise.all([
    session.query('select name from Project limit 10'),
    session.query('select name from Task limit 10'),
    session.query('select username from User limit 10')
  ]);

  return {
    projects: projects.data,
    tasks: tasks.data,
    users: users.data
  };
}
```

### Sequential Operations
```javascript
async function updateTaskSequentially(session, taskId) {
  // Fetch task
  const task = await session.get('Task', taskId);
  console.log('Current status:', task.status.name);

  // Update status
  const statusResponse = await session.query(
    'select id from Status where name is "In Progress"'
  );
  const newStatus = statusResponse.data[0];

  // Update and commit
  task.status_id = newStatus.id;
  await session.commit();

  console.log('✓ Task updated');
}
```

---

## Promise Patterns

### Chaining Promises
```javascript
function getProjectTasks(session, projectName) {
  return session.query(
    `select id from Project where name is "${projectName}"`
  )
    .then(response => response.data[0])
    .then(project => {
      return session.query(
        `select name, status.name from Task where project.id is "${project.id}"`
      );
    })
    .then(response => response.data)
    .catch(error => {
      console.error('Error fetching tasks:', error);
      return [];
    });
}
```

### Promise.race for Timeouts
```javascript
async function queryWithTimeout(session, query, timeout = 5000) {
  const queryPromise = session.query(query);

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Query timeout')), timeout);
  });

  try {
    const response = await Promise.race([queryPromise, timeoutPromise]);
    return response.data;
  } catch (error) {
    console.error('Query failed:', error.message);
    throw error;
  }
}
```

---

## Browser-Specific Patterns

### File Upload from Browser
```javascript
// HTML: <input type="file" id="fileInput">

async function uploadFile(session, componentId) {
  const fileInput = document.getElementById('fileInput');
  const file = fileInput.files[0];

  if (!file) {
    console.error('No file selected');
    return;
  }

  try {
    await session.upload(componentId, file);
    console.log('✓ File uploaded');
  } catch (error) {
    console.error('Upload failed:', error);
  }
}
```

### Download File in Browser
```javascript
async function downloadFile(session, componentId) {
  try {
    const blob = await session.download(componentId);

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'file.ext';
    link.click();

    // Cleanup
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error('Download failed:', error);
  }
}
```

### Real-time UI Updates
```javascript
class TaskList {
  constructor(session, containerId) {
    this.session = session;
    this.container = document.getElementById(containerId);
    this.tasks = new Map();
  }

  async initialize(projectId) {
    // Load initial tasks
    const response = await this.session.query(
      `select id, name, status.name from Task where project.id is "${projectId}"`
    );

    this.renderTasks(response.data);

    // Subscribe to updates
    this.session.eventHub.subscribe(
      'topic=ftrack.update and data.entityType is "task"',
      (event) => this.handleUpdate(event)
    );
  }

  renderTasks(tasks) {
    this.container.innerHTML = '';

    tasks.forEach(task => {
      this.tasks.set(task.id, task);
      const div = document.createElement('div');
      div.id = `task-${task.id}`;
      div.textContent = `${task.name} - ${task.status.name}`;
      this.container.appendChild(div);
    });
  }

  async handleUpdate(event) {
    const taskId = event.data.entityId;
    const task = await this.session.get('Task', taskId);

    // Update UI
    const element = document.getElementById(`task-${taskId}`);
    if (element) {
      element.textContent = `${task.name} - ${task.status.name}`;
    }
  }
}
```

---

## Node.js-Specific Patterns

### File System Operations
```javascript
import fs from 'fs/promises';
import path from 'path';

async function uploadFileFromDisk(session, componentId, filePath) {
  try {
    // Read file
    const buffer = await fs.readFile(filePath);
    const blob = new Blob([buffer]);

    // Upload
    await session.upload(componentId, blob);
    console.log(`✓ Uploaded: ${path.basename(filePath)}`);

  } catch (error) {
    console.error('Upload failed:', error);
  }
}

async function downloadFileToDisk(session, componentId, outputPath) {
  try {
    const blob = await session.download(componentId);
    const buffer = Buffer.from(await blob.arrayBuffer());

    await fs.writeFile(outputPath, buffer);
    console.log(`✓ Downloaded to: ${outputPath}`);

  } catch (error) {
    console.error('Download failed:', error);
  }
}
```

### Environment Configuration
```javascript
import dotenv from 'dotenv';
dotenv.config();

function getSessionConfig() {
  const required = ['FTRACK_SERVER', 'FTRACK_API_USER', 'FTRACK_API_KEY'];

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing environment variable: ${key}`);
    }
  }

  return {
    server: process.env.FTRACK_SERVER,
    user: process.env.FTRACK_API_USER,
    apiKey: process.env.FTRACK_API_KEY
  };
}

// Usage
const config = getSessionConfig();
const session = new ftrack.Session(config.server, config.user, config.apiKey);
```

### CLI Scripts
```javascript
#!/usr/bin/env node

import ftrack from '@ftrack/api';
import { Command } from 'commander';

const program = new Command();

program
  .name('ftrack-cli')
  .description('ftrack CLI tool')
  .version('1.0.0');

program
  .command('list-tasks')
  .description('List tasks in a project')
  .argument('<project-id>', 'Project ID')
  .action(async (projectId) => {
    const session = new ftrack.Session(
      process.env.FTRACK_SERVER,
      process.env.FTRACK_API_USER,
      process.env.FTRACK_API_KEY
    );

    await session.initializing;

    const response = await session.query(
      `select name, status.name from Task where project.id is "${projectId}"`
    );

    response.data.forEach(task => {
      console.log(`- ${task.name}: ${task.status.name}`);
    });

    session.close();
  });

program.parse();
```

---

## ES6+ Features

### Destructuring
```javascript
// Destructure response
const { data } = await session.query('select name from Project');

// Destructure task properties
const { name, status, priority } = task;
```

### Spread Operator
```javascript
// Combine arrays
const allEntities = [...projects, ...tasks, ...shots];

// Clone and modify
const updatedTask = { ...task, priority: 5 };
```

### Array Methods
```javascript
// Filter high-priority tasks
const highPriority = tasks.filter(task => task.priority >= 4);

// Map to names
const taskNames = tasks.map(task => task.name);

// Find specific task
const task = tasks.find(t => t.name === 'Animation');

// Reduce to count by status
const statusCounts = tasks.reduce((acc, task) => {
  const status = task.status.name;
  acc[status] = (acc[status] || 0) + 1;
  return acc;
}, {});
```

### Template Literals
```javascript
// Build queries dynamically
const projectId = 'abc123';
const query = `select name from Task where project.id is "${projectId}"`;

// Multi-line queries
const complexQuery = `
  select name, status.name, parent.name
  from Task
  where project.id is "${projectId}"
  and status.name in ("In Progress", "Review")
  order by priority desc
`;
```

### Optional Chaining
```javascript
// Safe property access
const statusName = task.status?.name ?? 'Unknown';
const assigneeName = task.assignments?.[0]?.user?.name;

// Safe method calls
const result = await session.query(query)?.catch(error => {
  console.error('Query failed:', error);
  return { data: [] };
});
```

---

## Module Bundling

### Webpack Configuration
```javascript
// webpack.config.js
export default {
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    path: './dist'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  }
};
```

### Vite Configuration
```javascript
// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: './src/index.js',
      name: 'FtrackApp',
      fileName: 'ftrack-app'
    }
  }
});
```

---

## Testing Patterns

### Jest Tests
```javascript
import ftrack from '@ftrack/api';

// Mock session
jest.mock('@ftrack/api');

describe('ftrack API', () => {
  let session;

  beforeEach(() => {
    session = {
      query: jest.fn(),
      get: jest.fn(),
      commit: jest.fn(),
      close: jest.fn()
    };

    ftrack.Session.mockReturnValue(session);
  });

  test('should fetch tasks', async () => {
    const mockTasks = [
      { id: '1', name: 'Task 1' },
      { id: '2', name: 'Task 2' }
    ];

    session.query.mockResolvedValue({ data: mockTasks });

    const result = await getTasks(session, 'project-id');

    expect(result).toEqual(mockTasks);
    expect(session.query).toHaveBeenCalledWith(
      expect.stringContaining('Task')
    );
  });
});
```

---

## Error Handling Patterns

### Retry Logic
```javascript
async function queryWithRetry(session, query, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await session.query(query);
      return response.data;

    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error.message);

      if (attempt === maxRetries) {
        throw error;
      }

      // Exponential backoff
      await new Promise(resolve =>
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      );
    }
  }
}
```

### Global Error Handler
```javascript
class ErrorHandler {
  static handle(error, context = '') {
    console.error(`[${context}] Error:`, error.message);

    if (error.response) {
      // API error
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      // Network error
      console.error('Network error - no response received');
    } else {
      // Other error
      console.error('Error:', error.message);
    }

    // Log to monitoring service
    // sendToMonitoring(error, context);
  }
}

// Usage
try {
  await session.query(query);
} catch (error) {
  ErrorHandler.handle(error, 'fetchTasks');
}
```

---

## Performance Optimization

### Debouncing
```javascript
function debounce(func, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

// Usage: debounce search queries
const searchTasks = debounce(async (session, searchTerm) => {
  const response = await session.query(
    `select name from Task where name like "%${searchTerm}%"`
  );
  console.log('Search results:', response.data.length);
}, 300);
```

### Caching
```javascript
class QueryCache {
  constructor(ttl = 60000) {
    this.cache = new Map();
    this.ttl = ttl;
  }

  async query(session, query) {
    const cached = this.cache.get(query);

    if (cached && Date.now() - cached.timestamp < this.ttl) {
      console.log('✓ Cache hit');
      return cached.data;
    }

    console.log('✗ Cache miss');
    const response = await session.query(query);

    this.cache.set(query, {
      data: response.data,
      timestamp: Date.now()
    });

    return response.data;
  }

  clear() {
    this.cache.clear();
  }
}
```

---

## Best Practices

### ✓ DO
- Use async/await for cleaner code
- Handle errors explicitly with try/catch
- Close sessions when done
- Use Promise.all for parallel operations
- Cache frequently accessed data
- Use environment variables for credentials
- Implement retry logic for network failures

### ✗ DON'T
- Don't use callbacks (use async/await instead)
- Don't hard-code credentials
- Don't forget to await async operations
- Don't fetch unnecessary data (use projections)
- Don't create multiple sessions unnecessarily
- Don't ignore errors silently

---

## Common Patterns

### Session Wrapper
```javascript
class FtrackClient {
  constructor(server, user, apiKey) {
    this.session = null;
    this.config = { server, user, apiKey };
  }

  async connect() {
    if (this.session) return;

    this.session = new ftrack.Session(
      this.config.server,
      this.config.user,
      this.config.apiKey
    );

    await this.session.initializing;
    console.log('✓ Connected to ftrack');
  }

  async query(query) {
    if (!this.session) await this.connect();
    return await this.session.query(query);
  }

  disconnect() {
    if (this.session) {
      this.session.close();
      this.session = null;
    }
  }
}
```

---

## Official Resources

- **JavaScript API Docs**: https://developer.ftrack.com/api-clients/javascript/
- **Developer Hub**: https://developer.ftrack.com/
- **NPM Package**: https://www.npmjs.com/package/@ftrack/api
- **GitHub Examples**: https://github.com/ftrackhq/ftrack-recipes
