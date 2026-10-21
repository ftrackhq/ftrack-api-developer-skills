---
name: ftrack-typescript
description: ftrack TypeScript integration - type-safe API usage, schema generation, repositories
---

TRIGGER when: TypeScript file (.ts/.tsx) imports `@ftrack/api`; code contains ftrack type definitions, interfaces for Task/Project/Asset; file uses `session.query<T>()` with generics; user asks about ftrack with TypeScript, type-safe queries, schema generation, or typed repositories.
IMPORTANT: When TypeScript is detected, ALWAYS load both ftrack-javascript AND ftrack-typescript as TypeScript builds on JavaScript.
SKIP: JavaScript files without types, Python code, general TypeScript without ftrack.

# ftrack TypeScript Expert

**Strategy**: Quick reference first → Fetch online docs if needed → Reference ftrack-javascript for base patterns

**Note**: TypeScript builds on JavaScript. For session setup, queries, and CRUD operations, also reference ftrack-javascript patterns.

## Prerequisites
```bash
npm install @ftrack/api
npm install --save-dev @ftrack/ts-schema-generator typescript
```

---

## Quick Reference (Use First - 70% of Queries)

### Core Principles
✓ **Generate schemas**: Use `@ftrack/ts-schema-generator` to create types
✓ **Type queries**: `session.query<Task>(...)` for type-safe results
✓ **Repository pattern**: Wrap session with typed methods
✓ **Avoid `any` types**: Always use generated or defined types
✗ Avoid manual type definitions (generate from workspace)
✗ Never use `as any` to bypass type checking
✗ Don't skip type parameters in generic methods

### Generate Types from Workspace

```bash
# Generate TypeScript types
npx @ftrack/ts-schema-generator \
  --server https://company.ftrackapp.com \
  --user user@example.com \
  --apiKey your-api-key \
  --output src/types/ftrack-schema.ts
```

**Generated types include**: Task, Project, Shot, AssetVersion, Status, User, and all custom entities from your workspace.

### Type-Safe Query

```typescript
import ftrack from '@ftrack/api';
import { Task, Status } from './types/ftrack-schema';

const session = new ftrack.Session(server, user, key);
await session.initializing;

// Type-safe query - response.data is Task[]
const response = await session.query<Task>(
  `select name, status.name from Task where project.id is "${projectId}"`
);

const tasks: Task[] = response.data;

tasks.forEach(task => {
  console.log(task.name); // ✓ Type-safe
  console.log(task.status.name); // ✓ Nested property typed
});
```

### Type-Safe CRUD

```typescript
// Create with type
const newTask = await session.create<Task>('Task', {
  name: 'New Task',
  parent_id: parentId,
  type_id: taskTypeId
});

// Get with type
const task = await session.get<Task>('Task', taskId);
task.name = 'Updated Name'; // ✓ Type-checked
await session.commit();
```

### Repository Pattern

```typescript
// TaskRepository.ts
import ftrack from '@ftrack/api';
import { Task, Status } from './types/ftrack-schema';

export class TaskRepository {
  constructor(private session: typeof ftrack.Session) {}
  
  async getById(id: string): Promise<Task> {
    return await this.session.get<Task>('Task', id);
  }
  
  async getByProject(projectId: string): Promise<Task[]> {
    const response = await this.session.query<Task>(
      `select name, status.name from Task where project.id is "${projectId}"`
    );
    return response.data;
  }
  
  async updateStatus(taskId: string, statusId: string): Promise<void> {
    const task = await this.getById(taskId);
    task.status_id = statusId;
    await this.session.commit();
  }
  
  async create(data: Partial<Task>): Promise<Task> {
    const task = await this.session.create<Task>('Task', data);
    await this.session.commit();
    return task;
  }
}

// Usage
const taskRepo = new TaskRepository(session);
const tasks = await taskRepo.getByProject(projectId);
```

### Service Pattern

```typescript
// TaskService.ts
export class TaskService {
  constructor(
    private taskRepository: TaskRepository,
    private statusRepository: StatusRepository
  ) {}
  
  async completeTask(taskId: string): Promise<void> {
    const doneStatus = await this.statusRepository.getByName('Done');
    await this.taskRepository.updateStatus(taskId, doneStatus.id);
  }
  
  async createTaskWithDefaults(name: string, parentId: string): Promise<Task> {
    const defaultType = await this.getDefaultTaskType();
    const defaultStatus = await this.statusRepository.getByName('Not Started');
    
    return await this.taskRepository.create({
      name,
      parent_id: parentId,
      type_id: defaultType.id,
      status_id: defaultStatus.id,
      priority: 50
    });
  }
}
```

### React Hook with Types

```typescript
import { useState, useEffect } from 'react';
import { Task } from './types/ftrack-schema';

function useTasksByProject(projectId: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    async function fetchTasks() {
      try {
        const response = await session.query<Task>(
          `select name, status.name from Task where project.id is "${projectId}"`
        );
        setTasks(response.data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchTasks();
  }, [projectId]);
  
  return { tasks, loading, error };
}

// Component usage
function TaskList({ projectId }: { projectId: string }) {
  const { tasks, loading, error } = useTasksByProject(projectId);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <ul>
      {tasks.map(task => (
        <li key={task.id}>{task.name} - {task.status.name}</li>
      ))}
    </ul>
  );
}
```

### Testing with Types

```typescript
// TaskService.test.ts
import { describe, it, expect, vi } from 'vitest';
import { TaskService } from './TaskService';
import type { Task, Status } from './types/ftrack-schema';

describe('TaskService', () => {
  it('should complete task', async () => {
    // Mock repository
    const mockTaskRepo = {
      getById: vi.fn().mockResolvedValue({
        id: 'task-1',
        name: 'Test Task'
      } as Task),
      updateStatus: vi.fn().mockResolvedValue(undefined)
    };
    
    const mockStatusRepo = {
      getByName: vi.fn().mockResolvedValue({
        id: 'status-done',
        name: 'Done'
      } as Status)
    };
    
    const service = new TaskService(mockTaskRepo, mockStatusRepo);
    
    await service.completeTask('task-1');
    
    expect(mockStatusRepo.getByName).toHaveBeenCalledWith('Done');
    expect(mockTaskRepo.updateStatus).toHaveBeenCalledWith('task-1', 'status-done');
  });
});
```

**→ This quick reference handles most TypeScript patterns. For advanced type patterns or schema customization, continue below.**

---

## Online Resources (Fetch for Detailed Info)

### When to Fetch
- User asks for complete TypeScript integration guide
- Needs schema generator configuration options
- Questions about advanced type patterns or generics
- Official TypeScript examples

### TypeScript Schema Generator Documentation
**URL**: `https://github.com/ftrackhq/ftrack-ts-schema-generator`
**Fetch Prompt**:
```
Extract ftrack TypeScript schema generator usage and configuration. Include:
- Installation and setup
- CLI options and flags
- Generated schema structure
- Customization options
- Type generation patterns
- Best practices
Format as markdown.
```

### JavaScript API Documentation (TypeScript builds on this)
**URL**: `https://developer.ftrack.com/api-clients/javascript/`
**Fetch Prompt**:
```
Extract ftrack JavaScript API patterns for TypeScript adaptation. Include:
- Session initialization
- Query methods with generic type support
- CRUD operations
- Async patterns
Show how to add TypeScript types to these patterns. Format as markdown.
```

### WebFetch Decision Tree

**IMPORTANT**: Actively check user query for trigger phrases, then use WebFetch.

**Trigger detection** (check user's exact query):
```python
trigger_phrases = [
    "schema generator configuration",
    "complete typescript guide",
    "official typescript docs",
    "advanced type patterns",
    "schema customization",
    "typescript examples ftrack"
]
```

**Action when trigger detected:**
1. **Detect topic**: Schema generation, types, or patterns
2. **Use WebFetch** with appropriate URL above
3. **If fetch succeeds**: Return formatted docs to user
4. **If fetch fails**: Reference ftrack-javascript + add type annotations

**WebFetch Example:**
```markdown
# User asks: "Show me schema generator configuration options"
# Trigger detected: "schema generator configuration"

Use WebFetch tool:
WebFetch(
  url="https://github.com/ftrackhq/ftrack-ts-schema-generator",
  prompt="Extract TypeScript schema generator CLI options and configuration. Include all flags, output options, filtering, and customization settings. Format as markdown with examples."
)

If successful: Present docs
If fails: Show basic generation command from quick reference
```

---

## Local Examples (Reference ftrack-javascript)

### When to Reference ftrack-javascript
1. User needs session setup → Use ftrack-javascript + add types
2. User needs query patterns → Use ftrack-javascript query + generic types
3. User needs CRUD operations → Use ftrack-javascript CRUD + type parameters
4. User needs file operations → Use ftrack-javascript files + typed components

**Pattern**: Load ftrack-javascript example, then show how to add TypeScript types.

### Available Local Files
Paths are relative to this skill's directory (the folder containing this SKILL.md).

**TypeScript Examples**
- **File**: `examples/typescript/typescript-example.ts`
- **Contains**: Entity type definitions, typed queries, CRUD, repository/service patterns
- **Load when**: User needs a complete runnable type-safe example
- **Size**: ~470 lines

### Example Transformation

**From JavaScript** (ftrack-javascript):
```javascript
const response = await session.query('select name from Task');
const tasks = response.data;
```

**To TypeScript** (add types):
```typescript
import { Task } from './types/ftrack-schema';

const response = await session.query<Task>('select name from Task');
const tasks: Task[] = response.data; // Now type-safe
```

---

## Decision Tree

```
User asks about ftrack TypeScript
  │
  ├─ Generate types from workspace?
  │   └→ Use Quick Reference (schema generation) ✓
  │
  ├─ Type-safe queries?
  │   └→ Use Quick Reference (typed query) ✓
  │
  ├─ Repository pattern?
  │   └→ Use Quick Reference (repository) ✓
  │
  ├─ React hooks with types?
  │   └→ Use Quick Reference (React hook) ✓
  │
  ├─ Testing with types?
  │   └→ Use Quick Reference (testing) ✓
  │
  ├─ Schema generator config or advanced types?
  │   ├→ WebFetch schema generator docs
  │   └→ If fails: Use quick reference + guidance
  │
  ├─ Session/CRUD/files (JavaScript base patterns)?
  │   └→ Reference ftrack-javascript + show type additions
  │
  └─ Complete TypeScript integration guide?
      ├→ WebFetch JavaScript API docs
      └→ Add TypeScript type annotations to examples
```

---

## Response Strategy

### For Simple Questions
1. Answer using Quick Reference patterns
2. Show appropriate pattern (query, repository, hook)
3. Keep concise (1 example)
4. Cite: "From TypeScript quick reference"

### For Detailed Questions
1. Start with Quick Reference context
2. If trigger detected: WebFetch schema generator docs
3. Provide type-specific examples
4. Cite: "From [URL]"
5. If fetch fails: Use quick reference + additional guidance

### For JavaScript Base Patterns
1. Note that TypeScript builds on JavaScript
2. Reference ftrack-javascript skill for base pattern
3. Show how to add TypeScript types
4. Provide typed version of the pattern

### Progressive Disclosure
- Start minimal (quick reference - generate types + basic query)
- Offer more: "Need schema generator config or advanced patterns? I can fetch official docs"
- Reference ftrack-javascript for JavaScript base patterns + type additions

---

## Key TypeScript Advantages

1. **Type Safety**: Catch errors at compile time, not runtime
2. **IntelliSense**: IDE autocomplete for entity properties
3. **Refactoring**: Rename properties safely across codebase
4. **Documentation**: Types serve as inline documentation
5. **Maintenance**: Easier to maintain large codebases

---

## Common Type Patterns

### Union Types
```typescript
type TaskOrShot = Task | Shot;

function processEntity(entity: TaskOrShot) {
  if ('priority' in entity) {
    // It's a Task
    console.log(entity.priority);
  }
}
```

### Generic Repository
```typescript
class BaseRepository<T> {
  constructor(
    private session: typeof ftrack.Session,
    private entityType: string
  ) {}
  
  async getById(id: string): Promise<T> {
    return await this.session.get<T>(this.entityType, id);
  }
  
  async query(queryString: string): Promise<T[]> {
    const response = await this.session.query<T>(queryString);
    return response.data;
  }
}

const taskRepo = new BaseRepository<Task>(session, 'Task');
const tasks = await taskRepo.query('select name from Task');
```

### Partial Updates
```typescript
async function updateTask(id: string, updates: Partial<Task>): Promise<void> {
  const task = await session.get<Task>('Task', id);
  Object.assign(task, updates);
  await session.commit();
}

// Usage - only update specific fields
await updateTask('task-id', { name: 'New Name', priority: 75 });
```

---

## tsconfig.json Recommendations

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "exclude": ["node_modules"]
}
```
