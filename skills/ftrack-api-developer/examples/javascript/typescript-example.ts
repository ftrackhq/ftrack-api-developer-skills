/**
 * ftrack JavaScript API - TypeScript Examples
 *
 * Demonstrates type-safe ftrack API usage with TypeScript,
 * including schema generation and custom types.
 */

import ftrack from '@ftrack/api';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Basic entity types (use generated schema for complete types)
 */
interface FtrackEntity {
  id: string;
  name?: string;
  __entity_type__: string;
}

interface Project extends FtrackEntity {
  __entity_type__: 'Project';
  full_name: string;
  status: Status;
  start_date?: string;
  end_date?: string;
}

interface Task extends FtrackEntity {
  __entity_type__: 'Task';
  parent_id: string;
  project_id: string;
  type_id: string;
  status: Status;
  priority: number;
  description?: string;
  parent?: Task | Project;
}

interface Status extends FtrackEntity {
  __entity_type__: 'Status';
  state: string;
  sort: number;
}

interface User extends FtrackEntity {
  __entity_type__: 'User';
  username: string;
  email: string;
  is_active: boolean;
}

interface AssetVersion extends FtrackEntity {
  __entity_type__: 'AssetVersion';
  version: number;
  asset_id: string;
  comment?: string;
  thumbnail_id?: string;
}

// ============================================================================
// Session Manager with Types
// ============================================================================

/**
 * Type-safe session manager
 */
class TypedFtrackSession {
  private session: any; // ftrack.Session
  private connected: boolean = false;

  constructor(
    private server: string,
    private user: string,
    private apiKey: string
  ) {}

  async connect(): Promise<void> {
    this.session = new ftrack.Session(this.server, this.user, this.apiKey);
    await this.session.initializing;
    this.connected = true;
  }

  disconnect(): void {
    if (this.session) {
      this.session.close();
      this.connected = false;
    }
  }

  /**
   * Type-safe query method
   */
  async query<T extends FtrackEntity>(query: string): Promise<T[]> {
    if (!this.connected) {
      throw new Error('Session not connected');
    }

    const response = await this.session.query(query);
    return response.data as T[];
  }

  /**
   * Type-safe get method
   */
  async get<T extends FtrackEntity>(
    entityType: string,
    entityId: string
  ): Promise<T | null> {
    if (!this.connected) {
      throw new Error('Session not connected');
    }

    try {
      const entity = await this.session.get(entityType, entityId);
      return entity as T;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Type-safe create method
   */
  async create<T extends FtrackEntity>(
    entityType: string,
    data: Partial<T>
  ): Promise<T> {
    if (!this.connected) {
      throw new Error('Session not connected');
    }

    const entity = await this.session.create(entityType, data);
    return entity as T;
  }

  /**
   * Type-safe update method
   */
  async update<T extends FtrackEntity>(
    entityType: string,
    entityId: string,
    updates: Partial<T>
  ): Promise<void> {
    if (!this.connected) {
      throw new Error('Session not connected');
    }

    await this.session.update(entityType, entityId, updates);
  }

  /**
   * Type-safe delete method
   */
  async delete(entityType: string, entityId: string): Promise<void> {
    if (!this.connected) {
      throw new Error('Session not connected');
    }

    await this.session.delete(entityType, entityId);
  }
}

// ============================================================================
// Type-Safe Query Builder
// ============================================================================

/**
 * Fluent query builder with type safety
 */
class TypedQueryBuilder<T extends FtrackEntity> {
  private entityType: string;
  private projections: string[] = [];
  private conditions: string[] = [];
  private orderByClause: string | null = null;
  private limitValue: number | null = null;

  constructor(entityType: string) {
    this.entityType = entityType;
  }

  select(...fields: (keyof T | string)[]): this {
    this.projections.push(...fields.map(f => String(f)));
    return this;
  }

  where(condition: string): this {
    this.conditions.push(condition);
    return this;
  }

  orderBy(field: keyof T | string, direction: 'asc' | 'desc' = 'asc'): this {
    this.orderByClause = `${String(field)} ${direction}`;
    return this;
  }

  limit(value: number): this {
    this.limitValue = value;
    return this;
  }

  build(): string {
    let query = '';

    if (this.projections.length > 0) {
      query += `select ${this.projections.join(', ')} from `;
    }

    query += this.entityType;

    if (this.conditions.length > 0) {
      query += ` where ${this.conditions.join(' and ')}`;
    }

    if (this.orderByClause) {
      query += ` order by ${this.orderByClause}`;
    }

    if (this.limitValue !== null) {
      query += ` limit ${this.limitValue}`;
    }

    return query;
  }

  async execute(session: TypedFtrackSession): Promise<T[]> {
    const query = this.build();
    return await session.query<T>(query);
  }
}

// ============================================================================
// Repository Pattern
// ============================================================================

/**
 * Type-safe repository for tasks
 */
class TaskRepository {
  constructor(private session: TypedFtrackSession) {}

  async findById(taskId: string): Promise<Task | null> {
    return await this.session.get<Task>('Task', taskId);
  }

  async findByProject(projectId: string): Promise<Task[]> {
    return await new TypedQueryBuilder<Task>('Task')
      .select('id', 'name', 'status.name', 'priority')
      .where(`project.id is "${projectId}"`)
      .execute(this.session);
  }

  async findByStatus(statusName: string): Promise<Task[]> {
    return await new TypedQueryBuilder<Task>('Task')
      .select('id', 'name', 'priority', 'project.name')
      .where(`status.name is "${statusName}"`)
      .orderBy('priority', 'desc')
      .execute(this.session);
  }

  async create(data: {
    name: string;
    projectId: string;
    typeId: string;
    statusId: string;
    priority?: number;
  }): Promise<Task> {
    return await this.session.create<Task>('Task', {
      name: data.name,
      parent_id: data.projectId,
      type_id: data.typeId,
      status_id: data.statusId,
      priority: data.priority || 3
    } as Partial<Task>);
  }

  async updateStatus(taskId: string, statusId: string): Promise<void> {
    await this.session.update<Task>('Task', taskId, {
      status_id: statusId
    } as Partial<Task>);
  }

  async updatePriority(taskId: string, priority: number): Promise<void> {
    await this.session.update<Task>('Task', taskId, { priority } as Partial<Task>);
  }

  async delete(taskId: string): Promise<void> {
    await this.session.delete('Task', taskId);
  }
}

/**
 * Type-safe repository for projects
 */
class ProjectRepository {
  constructor(private session: TypedFtrackSession) {}

  async findAll(): Promise<Project[]> {
    return await new TypedQueryBuilder<Project>('Project')
      .select('id', 'name', 'full_name', 'status.name')
      .execute(this.session);
  }

  async findActive(): Promise<Project[]> {
    return await new TypedQueryBuilder<Project>('Project')
      .select('id', 'name', 'full_name', 'status.name')
      .where('status.name is "Active"')
      .execute(this.session);
  }

  async findById(projectId: string): Promise<Project | null> {
    return await this.session.get<Project>('Project', projectId);
  }
}

// ============================================================================
// Service Layer
// ============================================================================

/**
 * High-level service with business logic
 */
class TaskService {
  private taskRepo: TaskRepository;
  private projectRepo: ProjectRepository;

  constructor(session: TypedFtrackSession) {
    this.taskRepo = new TaskRepository(session);
    this.projectRepo = new ProjectRepository(session);
  }

  async getProjectTasks(projectId: string): Promise<Task[]> {
    return await this.taskRepo.findByProject(projectId);
  }

  async getActiveProjectTasks(projectId: string): Promise<Task[]> {
    const project = await this.projectRepo.findById(projectId);

    if (!project || project.status.name !== 'Active') {
      return [];
    }

    return await this.taskRepo.findByProject(projectId);
  }

  async completeTask(taskId: string): Promise<void> {
    const task = await this.taskRepo.findById(taskId);

    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    // Logic to get "Completed" status ID
    const session = (this.taskRepo as any).session;
    const statuses = await session.query<Status>(
      'select id from Status where name is "Completed"'
    );

    if (statuses.length === 0) {
      throw new Error('Completed status not found');
    }

    await this.taskRepo.updateStatus(taskId, statuses[0].id);
    console.log(`✓ Task ${task.name} marked as completed`);
  }

  async createTaskWithDefaults(
    projectId: string,
    taskName: string
  ): Promise<Task> {
    const session = (this.taskRepo as any).session;

    // Get default type and status
    const [taskType, status] = await Promise.all([
      session.query<any>('select id from Type where name is "Task"'),
      session.query<Status>('select id from Status where name is "Not Started"')
    ]);

    return await this.taskRepo.create({
      name: taskName,
      projectId,
      typeId: taskType[0].id,
      statusId: status[0].id,
      priority: 3
    });
  }
}

// ============================================================================
// Usage Examples
// ============================================================================

async function main(): Promise<void> {
  const session = new TypedFtrackSession(
    process.env.FTRACK_SERVER!,
    process.env.FTRACK_API_USER!,
    process.env.FTRACK_API_KEY!
  );

  await session.connect();

  try {
    // Example 1: Type-safe queries
    console.log('\n=== Example 1: Type-Safe Queries ===');
    const projects = await session.query<Project>(
      'select name, full_name, status.name from Project'
    );
    console.log(`Found ${projects.length} projects`);

    // Example 2: Query builder
    console.log('\n=== Example 2: Query Builder ===');
    const tasks = await new TypedQueryBuilder<Task>('Task')
      .select('name', 'status.name', 'priority')
      .where('status.name is "In Progress"')
      .where('priority > 2')
      .orderBy('priority', 'desc')
      .limit(10)
      .execute(session);

    console.log(`Found ${tasks.length} high-priority tasks`);

    // Example 3: Repository pattern
    console.log('\n=== Example 3: Repository Pattern ===');
    const taskRepo = new TaskRepository(session);
    const inProgressTasks = await taskRepo.findByStatus('In Progress');
    console.log(`Tasks in progress: ${inProgressTasks.length}`);

    // Example 4: Service layer
    console.log('\n=== Example 4: Service Layer ===');
    const taskService = new TaskService(session);

    if (projects.length > 0) {
      const projectTasks = await taskService.getProjectTasks(projects[0].id);
      console.log(`Tasks in ${projects[0].name}: ${projectTasks.length}`);
    }

    console.log('\n✓ All type-safe operations completed');

  } finally {
    session.disconnect();
  }
}

// ============================================================================
// Export
// ============================================================================

export {
  TypedFtrackSession,
  TypedQueryBuilder,
  TaskRepository,
  ProjectRepository,
  TaskService,
  // Types
  FtrackEntity,
  Project,
  Task,
  Status,
  User,
  AssetVersion
};

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
