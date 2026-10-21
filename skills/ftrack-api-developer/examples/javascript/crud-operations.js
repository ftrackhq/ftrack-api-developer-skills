/**
 * ftrack JavaScript API - CRUD Operations Examples
 *
 * Demonstrates Create, Read, Update, Delete operations
 * with best practices and error handling.
 */

import ftrack from '@ftrack/api';

// ============================================================================
// Create Operations
// ============================================================================

/**
 * Create a new task
 */
async function createTask(session, projectId, taskName) {
  try {
    // Get required references first
    const [project, taskType, status] = await Promise.all([
      session.get('Project', projectId),
      session.query('select id from Type where name is "Task"').then(r => r.data[0]),
      session.query('select id from Status where name is "Not Started"').then(r => r.data[0])
    ]);

    const task = await session.create('Task', {
      name: taskName,
      parent_id: project.id,
      type_id: taskType.id,
      status_id: status.id,
      priority: 3
    });

    console.log(`✓ Created task: ${task.name} (${task.id})`);
    return task;

  } catch (error) {
    console.error('✗ Failed to create task:', error.message);
    throw error;
  }
}

/**
 * Create multiple entities efficiently
 */
async function bulkCreateTasks(session, projectId, taskNames) {
  try {
    // Pre-fetch references once
    const [project, taskType, status] = await Promise.all([
      session.get('Project', projectId),
      session.query('select id from Type where name is "Task"').then(r => r.data[0]),
      session.query('select id from Status where name is "Not Started"').then(r => r.data[0])
    ]);

    // Create all tasks
    const createPromises = taskNames.map(name =>
      session.create('Task', {
        name,
        parent_id: project.id,
        type_id: taskType.id,
        status_id: status.id
      })
    );

    const tasks = await Promise.all(createPromises);
    console.log(`✓ Created ${tasks.length} tasks`);

    return tasks;

  } catch (error) {
    console.error('✗ Bulk create failed:', error.message);
    throw error;
  }
}

/**
 * Create with nested relationships
 */
async function createTaskWithNote(session, projectId, taskName, noteContent) {
  // Create task first
  const task = await createTask(session, projectId, taskName);

  // Create note attached to task
  const note = await session.create('Note', {
    content: noteContent,
    parent_id: task.id,
    parent_type: 'Task'
  });

  console.log(`✓ Created note on task: ${note.id}`);

  return { task, note };
}

// ============================================================================
// Read Operations
// ============================================================================

/**
 * Get entity with error handling
 */
async function getEntity(session, entityType, entityId) {
  try {
    const entity = await session.get(entityType, entityId);
    return entity;
  } catch (error) {
    if (error.response?.status === 404) {
      console.log(`${entityType} not found: ${entityId}`);
      return null;
    }
    throw error;
  }
}

/**
 * Get entity with specific attributes
 */
async function getTaskDetails(session, taskId) {
  const response = await session.query(
    `select name, status.name, priority, parent.name, ` +
    `assignees.username, project.name ` +
    `from Task where id is "${taskId}"`
  );

  return response.data[0] || null;
}

/**
 * Get related entities
 */
async function getTaskNotes(session, taskId) {
  const response = await session.query(
    `select content, author.username, date ` +
    `from Note where parent_id is "${taskId}" ` +
    `order by date desc`
  );

  return response.data;
}

// ============================================================================
// Update Operations
// ============================================================================

/**
 * Update single entity
 */
async function updateTaskStatus(session, taskId, newStatusName) {
  try {
    // Get the new status
    const statusResponse = await session.query(
      `select id from Status where name is "${newStatusName}"`
    );

    if (statusResponse.data.length === 0) {
      throw new Error(`Status not found: ${newStatusName}`);
    }

    // Update the task
    await session.update('Task', taskId, {
      status_id: statusResponse.data[0].id
    });

    console.log(`✓ Updated task ${taskId} status to ${newStatusName}`);

  } catch (error) {
    console.error('✗ Update failed:', error.message);
    throw error;
  }
}

/**
 * Update multiple attributes
 */
async function updateTask(session, taskId, updates) {
  try {
    await session.update('Task', taskId, updates);
    console.log(`✓ Updated task ${taskId}`);

    // Return updated entity
    return await getEntity(session, 'Task', taskId);

  } catch (error) {
    console.error('✗ Update failed:', error.message);
    throw error;
  }
}

/**
 * Bulk update multiple entities
 */
async function bulkUpdateTaskPriority(session, taskIds, newPriority) {
  try {
    const updatePromises = taskIds.map(id =>
      session.update('Task', id, { priority: newPriority })
    );

    await Promise.all(updatePromises);
    console.log(`✓ Updated ${taskIds.length} tasks to priority ${newPriority}`);

  } catch (error) {
    console.error('✗ Bulk update failed:', error.message);
    throw error;
  }
}

/**
 * Conditional update
 */
async function updateInProgressTasks(session, projectId) {
  // Query tasks to update
  const response = await session.query(
    `select id, priority from Task ` +
    `where project.id is "${projectId}" ` +
    `and status.name is "In Progress"`
  );

  const tasks = response.data;

  // Update tasks with low priority
  const updates = tasks
    .filter(task => task.priority < 3)
    .map(task => session.update('Task', task.id, { priority: 3 }));

  await Promise.all(updates);
  console.log(`✓ Updated ${updates.length} low-priority tasks`);

  return updates.length;
}

// ============================================================================
// Delete Operations
// ============================================================================

/**
 * Delete single entity
 */
async function deleteTask(session, taskId) {
  try {
    await session.delete('Task', taskId);
    console.log(`✓ Deleted task: ${taskId}`);
  } catch (error) {
    if (error.response?.status === 404) {
      console.log(`Task already deleted: ${taskId}`);
    } else {
      console.error('✗ Delete failed:', error.message);
      throw error;
    }
  }
}

/**
 * Delete multiple entities
 */
async function bulkDeleteTasks(session, taskIds) {
  const results = {
    deleted: [],
    failed: []
  };

  for (const taskId of taskIds) {
    try {
      await session.delete('Task', taskId);
      results.deleted.push(taskId);
    } catch (error) {
      results.failed.push({ taskId, error: error.message });
    }
  }

  console.log(`✓ Deleted ${results.deleted.length} tasks`);
  if (results.failed.length > 0) {
    console.log(`✗ Failed to delete ${results.failed.length} tasks`);
  }

  return results;
}

/**
 * Delete with confirmation (safe delete)
 */
async function safeDeleteTask(session, taskId) {
  // Check if task exists and get details
  const task = await getTaskDetails(session, taskId);

  if (!task) {
    console.log(`Task not found: ${taskId}`);
    return false;
  }

  console.log(`Preparing to delete: ${task.name}`);

  // Check for dependencies (e.g., child tasks)
  const childrenResponse = await session.query(
    `select id from Task where parent_id is "${taskId}"`
  );

  if (childrenResponse.data.length > 0) {
    console.log(`⚠ Task has ${childrenResponse.data.length} children. Delete cancelled.`);
    return false;
  }

  // Proceed with delete
  await session.delete('Task', taskId);
  console.log(`✓ Deleted task: ${task.name}`);

  return true;
}

// ============================================================================
// Complex Operations
// ============================================================================

/**
 * Clone/duplicate a task
 */
async function cloneTask(session, originalTaskId) {
  // Get original task details
  const response = await session.query(
    `select name, parent_id, type_id, status_id, priority, description ` +
    `from Task where id is "${originalTaskId}"`
  );

  const original = response.data[0];

  if (!original) {
    throw new Error(`Task not found: ${originalTaskId}`);
  }

  // Create clone
  const clone = await session.create('Task', {
    name: `${original.name} (Copy)`,
    parent_id: original.parent_id,
    type_id: original.type_id,
    status_id: original.status_id,
    priority: original.priority,
    description: original.description
  });

  console.log(`✓ Cloned task: ${clone.name} (${clone.id})`);

  return clone;
}

/**
 * Move task to different parent
 */
async function moveTask(session, taskId, newParentId) {
  await session.update('Task', taskId, {
    parent_id: newParentId
  });

  console.log(`✓ Moved task ${taskId} to parent ${newParentId}`);
}

/**
 * Assign users to task
 */
async function assignUsers(session, taskId, usernames) {
  // Get user IDs
  const usernameList = usernames.map(u => `"${u}"`).join(', ');
  const usersResponse = await session.query(
    `select id from User where username in (${usernameList})`
  );

  const userIds = usersResponse.data.map(u => u.id);

  // Update task with assignees
  await session.update('Task', taskId, {
    assignments: userIds.map(userId => ({ resource_id: userId }))
  });

  console.log(`✓ Assigned ${userIds.length} users to task ${taskId}`);
}

// ============================================================================
// Usage Examples
// ============================================================================

async function main() {
  const session = new ftrack.Session(
    process.env.FTRACK_SERVER,
    process.env.FTRACK_API_USER,
    process.env.FTRACK_API_KEY
  );

  await session.initializing;

  try {
    const projectId = 'your-project-id';

    // Example 1: Create task
    console.log('\n=== Example 1: Create Task ===');
    const task = await createTask(session, projectId, 'Test Task');

    // Example 2: Update task
    console.log('\n=== Example 2: Update Task ===');
    await updateTask(session, task.id, {
      priority: 5,
      description: 'Updated description'
    });

    // Example 3: Read task details
    console.log('\n=== Example 3: Read Task ===');
    const details = await getTaskDetails(session, task.id);
    console.log('Task details:', details);

    // Example 4: Bulk operations
    console.log('\n=== Example 4: Bulk Create ===');
    const tasks = await bulkCreateTasks(session, projectId, [
      'Task A',
      'Task B',
      'Task C'
    ]);

    // Example 5: Clone task
    console.log('\n=== Example 5: Clone Task ===');
    const cloned = await cloneTask(session, task.id);

    // Cleanup (optional)
    // await deleteTask(session, task.id);

  } finally {
    session.close();
  }
}

// ============================================================================
// Export
// ============================================================================

export {
  createTask,
  bulkCreateTasks,
  createTaskWithNote,
  getEntity,
  getTaskDetails,
  getTaskNotes,
  updateTaskStatus,
  updateTask,
  bulkUpdateTaskPriority,
  updateInProgressTasks,
  deleteTask,
  bulkDeleteTasks,
  safeDeleteTask,
  cloneTask,
  moveTask,
  assignUsers
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
