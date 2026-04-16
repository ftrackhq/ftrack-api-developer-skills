# ftrack JavaScript API Examples

Comprehensive examples for using the ftrack JavaScript API in both browser and Node.js environments.

## Files Overview

| File | Description | Environment |
|------|-------------|-------------|
| **session-management.js** | Session initialization, connection handling, and manager patterns | Both |
| **query-operations.js** | Query patterns, pagination, optimization, and query builder | Both |
| **crud-operations.js** | Create, Read, Update, Delete operations with error handling | Both |
| **event-handling.js** | Event subscriptions, real-time updates, event hub management | Both |
| **file-operations.js** | File upload/download, component management, thumbnails | Both |
| **typescript-example.ts** | Type-safe API usage with TypeScript, repositories, services | Both |

## Quick Start

### Installation

```bash
npm install @ftrack/api
```

### Environment Variables

```bash
export FTRACK_SERVER=https://your-instance.ftrackapp.com
export FTRACK_API_USER=your-username
export FTRACK_API_KEY=your-api-key
```

### Basic Usage

```javascript
import ftrack from '@ftrack/api';

const session = new ftrack.Session(
  process.env.FTRACK_SERVER,
  process.env.FTRACK_API_USER,
  process.env.FTRACK_API_KEY
);

await session.initializing;

// Your code here
const projects = await session.query('select name from Project');
console.log(projects.data);

session.close();
```

## Example Patterns

### 1. Session Management (`session-management.js`)

**Basic Session:**
```javascript
import { createBasicSession } from './session-management.js';
await createBasicSession();
```

**Session Manager (Recommended):**
```javascript
import { FtrackSessionManager } from './session-management.js';

const manager = new FtrackSessionManager({
  server: process.env.FTRACK_SERVER,
  user: process.env.FTRACK_API_USER,
  apiKey: process.env.FTRACK_API_KEY
});

await manager.withSession(async (session) => {
  // Your operations
  const projects = await session.query('select name from Project');
});

manager.disconnect();
```

### 2. Query Operations (`query-operations.js`)

**Optimized Query:**
```javascript
import { basicQuery, QueryBuilder } from './query-operations.js';

// Direct query
const tasks = await basicQuery(session);

// Query builder
const builder = new QueryBuilder('Task')
  .select('name', 'status.name', 'priority')
  .where('status.name is "In Progress"')
  .orderBy('priority', 'desc')
  .limit(10);

const result = await builder.execute(session);
```

**Pagination:**
```javascript
import { fetchAllPages, cursorBasedPagination } from './query-operations.js';

// Fetch all pages
const allTasks = await fetchAllPages(
  session,
  'select name from Task where project.id is "proj-id"',
  100  // page size
);

// Cursor-based (more efficient)
const tasks = await cursorBasedPagination(session, 'Task', 100);
```

### 3. CRUD Operations (`crud-operations.js`)

**Create:**
```javascript
import { createTask, bulkCreateTasks } from './crud-operations.js';

// Single task
const task = await createTask(session, projectId, 'New Task');

// Bulk create
const tasks = await bulkCreateTasks(session, projectId, [
  'Task A', 'Task B', 'Task C'
]);
```

**Update:**
```javascript
import { updateTask, bulkUpdateTaskPriority } from './crud-operations.js';

// Single update
await updateTask(session, taskId, {
  priority: 5,
  description: 'Updated'
});

// Bulk update
await bulkUpdateTaskPriority(session, [taskId1, taskId2], 4);
```

**Delete:**
```javascript
import { deleteTask, safeDeleteTask } from './crud-operations.js';

// Direct delete
await deleteTask(session, taskId);

// Safe delete (checks dependencies)
const deleted = await safeDeleteTask(session, taskId);
```

### 4. Event Handling (`event-handling.js`)

**Simple Subscription:**
```javascript
import { subscribeToTaskUpdates } from './event-handling.js';

subscribeToTaskUpdates(session, (event) => {
  console.log('Task updated:', event.data.entityId);
});

session.eventHub.connect();
```

**Event Hub Manager:**
```javascript
import { EventHubManager } from './event-handling.js';

const eventHub = new EventHubManager(session);

eventHub.subscribe('task-updates', 'topic=ftrack.update', (event) => {
  // Handle event
});

eventHub.connect();

// Later...
eventHub.disconnect();
```

**Real-time Dashboard:**
```javascript
import { TaskDashboard } from './event-handling.js';

const dashboard = new TaskDashboard(session, projectId);
await dashboard.initialize();

// Dashboard now receives real-time updates
// Call dashboard.cleanup() when done
```

### 5. File Operations (`file-operations.js`)

**Upload (Browser):**
```javascript
import { uploadFileBrowser, uploadWithProgress } from './file-operations.js';

// From file input
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];

const component = await uploadFileBrowser(session, file, assetVersionId);

// With progress
await uploadWithProgress(session, file, assetVersionId, (percent) => {
  console.log(`Upload: ${percent}%`);
});
```

**Upload (Node.js):**
```javascript
import { uploadFileNode, uploadMultipleFiles } from './file-operations.js';

// Single file
const component = await uploadFileNode(session, './file.jpg', assetVersionId);

// Multiple files
const results = await uploadMultipleFiles(
  session,
  ['./file1.jpg', './file2.png'],
  assetVersionId
);
```

**Download:**
```javascript
import { downloadFile, getDownloadUrl } from './file-operations.js';

// Get URL
const url = await getDownloadUrl(session, componentId);

// Download to file (Node.js)
await downloadFile(session, componentId, './output.jpg');
```

**Asset Version with File:**
```javascript
import { createAssetVersionWithFile } from './file-operations.js';

const { assetVersion, component } = await createAssetVersionWithFile(
  session,
  assetId,
  './file.jpg'  // or File object in browser
);
```

### 6. TypeScript (`typescript-example.ts`)

**Type-Safe Session:**
```typescript
import { TypedFtrackSession, Task, Project } from './typescript-example';

const session = new TypedFtrackSession(
  process.env.FTRACK_SERVER!,
  process.env.FTRACK_API_USER!,
  process.env.FTRACK_API_KEY!
);

await session.connect();

// Type-safe queries
const tasks = await session.query<Task>(
  'select name, status.name from Task'
);
```

**Repository Pattern:**
```typescript
import { TaskRepository, ProjectRepository } from './typescript-example';

const taskRepo = new TaskRepository(session);
const projectRepo = new ProjectRepository(session);

// Find operations
const task = await taskRepo.findById(taskId);
const tasks = await taskRepo.findByStatus('In Progress');
const projects = await projectRepo.findActive();

// CRUD operations
const newTask = await taskRepo.create({
  name: 'New Task',
  projectId,
  typeId,
  statusId
});

await taskRepo.updatePriority(taskId, 5);
await taskRepo.delete(taskId);
```

**Service Layer:**
```typescript
import { TaskService } from './typescript-example';

const service = new TaskService(session);

// High-level operations
const tasks = await service.getActiveProjectTasks(projectId);
await service.completeTask(taskId);
const task = await service.createTaskWithDefaults(projectId, 'Task Name');
```

## Running Examples

### Node.js

```bash
# Run with ES modules
node --input-type=module session-management.js

# Or with package.json "type": "module"
node session-management.js

# TypeScript
npm install -g tsx
tsx typescript-example.ts
```

### Browser

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module">
    import ftrack from 'https://cdn.jsdelivr.net/npm/@ftrack/api/+esm';
    import { createBasicSession } from './session-management.js';
    
    // Your code
  </script>
</head>
</html>
```

## Best Practices

### Performance
- ✅ Use projections (`select name, status.name`)
- ✅ Filter at database level (`where project.id is "..."`)
- ✅ Use cursor-based pagination for large datasets
- ✅ Batch operations when possible
- ✅ Close sessions when done

### Error Handling
- ✅ Wrap operations in try-catch
- ✅ Check for 404 on get operations
- ✅ Validate data before create/update
- ✅ Handle network timeouts

### Security
- ✅ Store credentials in environment variables
- ✅ Never commit API keys to git
- ✅ Use HTTPS for all connections
- ✅ Validate user input before queries

### Event Hub
- ✅ Use specific topic filters
- ✅ Disconnect when not needed
- ✅ Handle events asynchronously
- ✅ Filter events in handlers

## Common Patterns

### Connection Management
```javascript
// ✓ GOOD: Use session manager
const manager = new FtrackSessionManager(config);
await manager.withSession(async (session) => {
  // operations
});
manager.disconnect();

// ✗ AVOID: Manual cleanup everywhere
const session = new ftrack.Session(...);
// ... (forget to close)
```

### Query Optimization
```javascript
// ✓ GOOD: Project specific attributes
'select name, status.name from Task where project.id is "..."'

// ✗ AVOID: Fetch all attributes
'select * from Task'
```

### Batch Operations
```javascript
// ✓ GOOD: Parallel operations
await Promise.all(tasks.map(t => session.update('Task', t.id, {...})));

// ✗ AVOID: Sequential operations
for (const task of tasks) {
  await session.update('Task', task.id, {...});
}
```

## Troubleshooting

### Connection Issues
```javascript
// Enable debug logging
session.setDebug(true);

// Check server info
const info = await session.getServerInformation();
console.log('Server:', info);
```

### Query Errors
```javascript
// Test query syntax
try {
  const result = await session.query('invalid query');
} catch (error) {
  console.error('Query error:', error.message);
}
```

### CORS (Browser)
```javascript
// ftrack server must have CORS configured
// Contact your ftrack administrator
```

## Resources

- [Official JavaScript API Docs](https://developer.ftrack.com/api-clients/javascript/)
- [NPM Package](https://www.npmjs.com/package/@ftrack/api)
- [TypeScript Schema Generator](https://www.npmjs.com/package/@ftrack/ts-schema-generator)
- [Developer Hub](https://developer.ftrack.com/)

## Next Steps

1. Review the examples that match your use case
2. Set up environment variables
3. Run the examples to verify connectivity
4. Adapt patterns to your specific needs
5. Check the TypeScript example for type safety
6. Review the main README for Python examples
