---
name: ftrack-typescript
description: ftrack TypeScript integration - type-safe API usage, schema generation, repositories
trigger: typescript, types, type-safe, ts
---

# ftrack TypeScript Expert

Build type-safe ftrack applications with generated schemas, repositories, and service patterns.

## Prerequisites

```bash
npm install @ftrack/api
npm install --save-dev @ftrack/ts-schema-generator typescript
```

---

## Schema Generation

### Generate Types
```bash
# Generate TypeScript types for your workspace
npx @ftrack/ts-schema-generator \
  --server https://company.ftrackapp.com \
  --user user@example.com \
  --apiKey your-api-key \
  --output src/types/ftrack-schema.ts
```

### Generated Schema Example
```typescript
// src/types/ftrack-schema.ts (auto-generated)
export interface Task {
  id: string;
  name: string;
  description?: string;
  status: Status;
  status_id: string;
  parent: TypedContext;
  parent_id: string;
  project: Project;
  project_id: string;
  priority: number;
  assignments: Appointment[];
  type: Type;
  type_id: string;
  created_at: string;
  updated_at: string;
}

export interface Status {
  id: string;
  name: string;
  color: string;
  state: string;
}

export interface Project {
  id: string;
  name: string;
  full_name: string;
  schema_id: string;
  created_at: string;
}

// ... more entity types
```

---

## Type-Safe Queries

### Basic Queries
```typescript
import ftrack from '@ftrack/api';
import { Task, Status, Project } from './types/ftrack-schema';

const session = new ftrack.Session(
  "https://company.ftrackapp.com",
  "user@example.com",
  "api-key"
);

await session.initializing;

// Type-safe query
const response = await session.query<Task>(
  `select name, status.name, priority from Task where project.id is "${projectId}"`
);

// response.data is typed as Task[]
const tasks: Task[] = response.data;

tasks.forEach(task => {
  console.log(task.name); // ✓ Type-safe
  console.log(task.status.name); // ✓ Type-safe
  // console.log(task.nonexistent); // ✗ Compile error
});
```

### Query with Partial Types
```typescript
// Only querying subset of fields
interface TaskSummary {
  id: string;
  name: string;
  status: Pick<Status, 'id' | 'name'>;
}

const response = await session.query<TaskSummary>(
  'select name, status.name from Task'
);

const summaries: TaskSummary[] = response.data;
```

---

## Repository Pattern

### Base Repository
```typescript
import ftrack from '@ftrack/api';

export abstract class BaseRepository<T> {
  constructor(
    protected session: ftrack.Session,
    protected entityType: string
  ) {}
  
  async getById(id: string): Promise<T> {
    return this.session.get<T>(this.entityType, id);
  }
  
  async query(expression: string): Promise<T[]> {
    const response = await this.session.query<T>(expression);
    return response.data;
  }
  
  async create(data: Partial<T>): Promise<T> {
    return this.session.create<T>(this.entityType, data);
  }
  
  async update(id: string, data: Partial<T>): Promise<T> {
    return this.session.update<T>(this.entityType, id, data);
  }
  
  async delete(id: string): Promise<void> {
    await this.session.delete(this.entityType, id);
  }
}
```

### Task Repository
```typescript
import { Task, Status } from './types/ftrack-schema';
import { BaseRepository } from './base-repository';

export class TaskRepository extends BaseRepository<Task> {
  constructor(session: ftrack.Session) {
    super(session, 'Task');
  }
  
  async getByProject(projectId: string): Promise<Task[]> {
    return this.query(
      `select name, status.name, priority from Task where project.id is "${projectId}"`
    );
  }
  
  async getActive(projectId: string): Promise<Task[]> {
    return this.query(
      `select name, status.name from Task 
       where project.id is "${projectId}" 
       and status.state is "active"`
    );
  }
  
  async updateStatus(taskId: string, statusId: string): Promise<Task> {
    return this.update(taskId, { status_id: statusId });
  }
  
  async assignUser(taskId: string, userId: string): Promise<void> {
    await this.session.create('Appointment', {
      context_id: taskId,
      resource_id: userId,
      type: 'assignment'
    });
  }
  
  async getByStatus(projectId: string, statusName: string): Promise<Task[]> {
    return this.query(
      `select name, assignments from Task 
       where project.id is "${projectId}" 
       and status.name is "${statusName}"`
    );
  }
}
```

### Project Repository
```typescript
import { Project } from './types/ftrack-schema';
import { BaseRepository } from './base-repository';

export class ProjectRepository extends BaseRepository<Project> {
  constructor(session: ftrack.Session) {
    super(session, 'Project');
  }
  
  async getAll(): Promise<Project[]> {
    return this.query('select name, full_name, created_at from Project');
  }
  
  async getByName(name: string): Promise<Project | null> {
    const projects = await this.query(
      `select name, full_name from Project where name is "${name}"`
    );
    return projects[0] || null;
  }
  
  async getActive(): Promise<Project[]> {
    return this.query(
      'select name, full_name from Project where status is "active"'
    );
  }
}
```

---

## Service Layer

### Task Service
```typescript
import ftrack from '@ftrack/api';
import { TaskRepository } from './repositories/task-repository';
import { Task } from './types/ftrack-schema';

export class TaskService {
  private taskRepo: TaskRepository;
  
  constructor(private session: ftrack.Session) {
    this.taskRepo = new TaskRepository(session);
  }
  
  async createBulkTasks(
    projectId: string,
    taskNames: string[],
    typeId: string,
    statusId: string
  ): Promise<Task[]> {
    const tasks: Task[] = [];
    
    for (const name of taskNames) {
      const task = await this.taskRepo.create({
        name,
        parent_id: projectId,
        type_id: typeId,
        status_id: statusId,
        priority: 3
      } as Partial<Task>);
      
      tasks.push(task);
    }
    
    return tasks;
  }
  
  async advanceTaskStatus(taskId: string): Promise<Task> {
    const task = await this.taskRepo.getById(taskId);
    const nextStatus = await this.getNextStatus(task.status_id);
    
    if (!nextStatus) {
      throw new Error('Task is at final status');
    }
    
    return this.taskRepo.updateStatus(taskId, nextStatus.id);
  }
  
  async getTaskStatistics(projectId: string): Promise<TaskStats> {
    const tasks = await this.taskRepo.getByProject(projectId);
    
    const stats: TaskStats = {
      total: tasks.length,
      byStatus: {},
      byPriority: {}
    };
    
    tasks.forEach(task => {
      const statusName = task.status.name;
      stats.byStatus[statusName] = (stats.byStatus[statusName] || 0) + 1;
      
      const priority = task.priority;
      stats.byPriority[priority] = (stats.byPriority[priority] || 0) + 1;
    });
    
    return stats;
  }
  
  private async getNextStatus(currentStatusId: string): Promise<Status | null> {
    // Implement workflow logic
    const response = await this.session.query<Status>(
      `select name, sort from Status order by sort`
    );
    
    const statuses = response.data;
    const currentIndex = statuses.findIndex(s => s.id === currentStatusId);
    
    return currentIndex < statuses.length - 1 
      ? statuses[currentIndex + 1] 
      : null;
  }
}

interface TaskStats {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<number, number>;
}
```

---

## React Integration

### Context Provider
```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';
import ftrack from '@ftrack/api';

interface FtrackContextType {
  session: ftrack.Session | null;
  ready: boolean;
}

const FtrackContext = createContext<FtrackContextType>({
  session: null,
  ready: false
});

export const FtrackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<ftrack.Session | null>(null);
  const [ready, setReady] = useState(false);
  
  useEffect(() => {
    const ftrackSession = new ftrack.Session(
      process.env.REACT_APP_FTRACK_SERVER!,
      process.env.REACT_APP_FTRACK_USER!,
      process.env.REACT_APP_FTRACK_KEY!
    );
    
    ftrackSession.initializing.then(() => {
      setSession(ftrackSession);
      setReady(true);
    });
    
    return () => {
      ftrackSession.close();
    };
  }, []);
  
  return (
    <FtrackContext.Provider value={{ session, ready }}>
      {children}
    </FtrackContext.Provider>
  );
};

export const useFtrack = () => useContext(FtrackContext);
```

### Custom Hooks
```typescript
import { useState, useEffect } from 'react';
import { useFtrack } from './ftrack-context';
import { Task } from './types/ftrack-schema';
import { TaskRepository } from './repositories/task-repository';

export function useTasks(projectId: string) {
  const { session, ready } = useFtrack();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    if (!ready || !session) return;
    
    const taskRepo = new TaskRepository(session);
    
    taskRepo.getByProject(projectId)
      .then(setTasks)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [session, ready, projectId]);
  
  return { tasks, loading, error };
}

// Usage in component
function TaskList({ projectId }: { projectId: string }) {
  const { tasks, loading, error } = useTasks(projectId);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <ul>
      {tasks.map(task => (
        <li key={task.id}>
          {task.name} - {task.status.name}
        </li>
      ))}
    </ul>
  );
}
```

---

## Express API

### Type-Safe REST API
```typescript
import express from 'express';
import ftrack from '@ftrack/api';
import { TaskService } from './services/task-service';
import { Task } from './types/ftrack-schema';

const app = express();
app.use(express.json());

// Initialize ftrack session
const session = new ftrack.Session(
  process.env.FTRACK_SERVER!,
  process.env.FTRACK_USER!,
  process.env.FTRACK_KEY!
);

await session.initializing;

const taskService = new TaskService(session);

// Get tasks by project
app.get('/api/projects/:projectId/tasks', async (req, res) => {
  try {
    const { projectId } = req.params;
    const tasks = await taskService.taskRepo.getByProject(projectId);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Create task
interface CreateTaskRequest {
  name: string;
  type_id: string;
  status_id: string;
  priority?: number;
}

app.post('/api/projects/:projectId/tasks', async (req, res) => {
  try {
    const { projectId } = req.params;
    const data: CreateTaskRequest = req.body;
    
    const task = await taskService.taskRepo.create({
      ...data,
      parent_id: projectId,
      priority: data.priority || 3
    } as Partial<Task>);
    
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Update task
app.patch('/api/tasks/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const updates: Partial<Task> = req.body;
    
    const task = await taskService.taskRepo.update(taskId, updates);
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.listen(3000, () => {
  console.log('API running on http://localhost:3000');
});
```

---

## Testing

### Jest with TypeScript
```typescript
import ftrack from '@ftrack/api';
import { TaskRepository } from './task-repository';
import { Task } from './types/ftrack-schema';

// Mock ftrack session
jest.mock('@ftrack/api');

describe('TaskRepository', () => {
  let mockSession: jest.Mocked<ftrack.Session>;
  let taskRepo: TaskRepository;
  
  beforeEach(() => {
    mockSession = {
      query: jest.fn(),
      get: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    } as any;
    
    taskRepo = new TaskRepository(mockSession);
  });
  
  it('should get tasks by project', async () => {
    const mockTasks: Task[] = [
      { id: '1', name: 'Task 1', project_id: 'proj-1' } as Task,
      { id: '2', name: 'Task 2', project_id: 'proj-1' } as Task
    ];
    
    mockSession.query.mockResolvedValue({ data: mockTasks });
    
    const tasks = await taskRepo.getByProject('proj-1');
    
    expect(tasks).toEqual(mockTasks);
    expect(mockSession.query).toHaveBeenCalledWith(
      expect.stringContaining('project.id is "proj-1"')
    );
  });
  
  it('should update task status', async () => {
    const updatedTask: Task = {
      id: '1',
      name: 'Task 1',
      status_id: 'new-status-id'
    } as Task;
    
    mockSession.update.mockResolvedValue(updatedTask);
    
    const result = await taskRepo.updateStatus('1', 'new-status-id');
    
    expect(result).toEqual(updatedTask);
    expect(mockSession.update).toHaveBeenCalledWith(
      'Task',
      '1',
      { status_id: 'new-status-id' }
    );
  });
});
```

---

## Type Utilities

### Partial Updates
```typescript
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

async function updateTask(
  taskId: string,
  updates: DeepPartial<Task>
): Promise<Task> {
  return session.update('Task', taskId, updates);
}
```

### Query Builder
```typescript
class TypedQueryBuilder<T> {
  private projections: string[] = [];
  private conditions: string[] = [];
  
  constructor(
    private session: ftrack.Session,
    private entityType: string
  ) {}
  
  select(...fields: Array<keyof T>): this {
    this.projections.push(...(fields as string[]));
    return this;
  }
  
  where(condition: string): this {
    this.conditions.push(condition);
    return this;
  }
  
  async execute(): Promise<T[]> {
    const projection = this.projections.length > 0
      ? `select ${this.projections.join(', ')} from `
      : '';
    
    const where = this.conditions.length > 0
      ? ` where ${this.conditions.join(' and ')}`
      : '';
    
    const query = `${projection}${this.entityType}${where}`;
    const response = await this.session.query<T>(query);
    return response.data;
  }
}

// Usage
const tasks = await new TypedQueryBuilder<Task>(session, 'Task')
  .select('name', 'status', 'priority')
  .where('project.id is "proj-1"')
  .where('status.state is "active"')
  .execute();
```

---

## Best Practices

1. **Generate Types**: Always generate from your workspace schema
2. **Repository Pattern**: Encapsulate data access logic
3. **Service Layer**: Implement business logic separately
4. **Error Handling**: Type errors properly
5. **Mocking**: Use jest.mock for testing
6. **Validation**: Use zod or joi for runtime validation
7. **Documentation**: Document custom types and interfaces

---

## Official Resources

- **TypeScript Generator**: https://www.npmjs.com/package/@ftrack/ts-schema-generator
- **JavaScript API**: https://developer.ftrack.com/api-clients/javascript/
- **TypeScript Docs**: https://www.typescriptlang.org/
