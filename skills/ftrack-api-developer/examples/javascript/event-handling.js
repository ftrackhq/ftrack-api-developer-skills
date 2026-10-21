/**
 * ftrack JavaScript API - Event Handling Examples
 *
 * Demonstrates event subscriptions, handlers, and real-time
 * updates using the ftrack event hub.
 */

import ftrack from '@ftrack/api';

// ============================================================================
// Basic Event Subscription
// ============================================================================

/**
 * Subscribe to all update events
 */
function subscribeToUpdates(session, handler) {
  session.eventHub.subscribe('topic=ftrack.update', handler);
  console.log('✓ Subscribed to update events');
}

/**
 * Simple event handler
 */
function simpleUpdateHandler(event) {
  console.log('Event received:', {
    topic: event.topic,
    entityType: event.data?.entityType,
    action: event.data?.action
  });
}

// ============================================================================
// Filtered Event Subscriptions
// ============================================================================

/**
 * Subscribe to task updates only
 */
function subscribeToTaskUpdates(session, handler) {
  session.eventHub.subscribe(
    'topic=ftrack.update and data.entityType is "task"',
    handler
  );
  console.log('✓ Subscribed to task update events');
}

/**
 * Subscribe to specific status changes
 */
function subscribeToStatusChanges(session, handler) {
  session.eventHub.subscribe(
    'topic=ftrack.update and data.changes.status',
    handler
  );
  console.log('✓ Subscribed to status change events');
}

/**
 * Subscribe to project-specific events
 */
function subscribeToProjectEvents(session, projectId, handler) {
  session.eventHub.subscribe(
    `topic=ftrack.update and data.parent.id is "${projectId}"`,
    handler
  );
  console.log(`✓ Subscribed to events for project ${projectId}`);
}

// ============================================================================
// Event Handlers
// ============================================================================

/**
 * Task update handler with filtering
 */
function handleTaskUpdate(event) {
  const { data } = event;

  // Filter for task entities
  if (data.entityType !== 'task') {
    return;
  }

  console.log(`Task updated: ${data.entityId}`);

  // Check for status changes
  if (data.changes?.status) {
    console.log(`  Status changed: ${data.changes.status.old} → ${data.changes.status.new}`);
  }

  // Check for priority changes
  if (data.changes?.priority) {
    console.log(`  Priority changed: ${data.changes.priority.old} → ${data.changes.priority.new}`);
  }
}

/**
 * Handler with async operations
 */
async function handleTaskUpdateAsync(session, event) {
  const { data } = event;

  if (data.entityType !== 'task') {
    return;
  }

  try {
    // Fetch full entity details
    const task = await session.get('Task', data.entityId);
    console.log(`Task "${task.name}" was updated`);

    // Perform additional operations
    if (data.changes?.status?.new === 'completed') {
      console.log(`  Task completed! Notifying team...`);
      // Send notifications, trigger workflows, etc.
    }

  } catch (error) {
    console.error('Error handling task update:', error.message);
  }
}

// ============================================================================
// Event Hub Manager Class
// ============================================================================

/**
 * Manages event hub connections and subscriptions
 */
class EventHubManager {
  constructor(session) {
    this.session = session;
    this.subscriptions = new Map();
    this.isConnected = false;
  }

  /**
   * Connect to event hub
   */
  connect() {
    if (this.isConnected) {
      console.log('Already connected to event hub');
      return;
    }

    this.session.eventHub.connect();
    this.isConnected = true;
    console.log('✓ Connected to event hub');
  }

  /**
   * Disconnect from event hub
   */
  disconnect() {
    if (!this.isConnected) {
      return;
    }

    // Unsubscribe all
    this.unsubscribeAll();

    this.session.eventHub.disconnect();
    this.isConnected = false;
    console.log('✓ Disconnected from event hub');
  }

  /**
   * Subscribe with automatic handler wrapping
   */
  subscribe(name, topic, handler) {
    const wrappedHandler = (event) => {
      try {
        handler(event);
      } catch (error) {
        console.error(`Error in handler "${name}":`, error);
      }
    };

    this.session.eventHub.subscribe(topic, wrappedHandler);
    this.subscriptions.set(name, { topic, handler: wrappedHandler });

    console.log(`✓ Subscribed: ${name}`);
  }

  /**
   * Unsubscribe by name
   */
  unsubscribe(name) {
    const subscription = this.subscriptions.get(name);
    if (subscription) {
      this.session.eventHub.unsubscribe(subscription.topic, subscription.handler);
      this.subscriptions.delete(name);
      console.log(`✓ Unsubscribed: ${name}`);
    }
  }

  /**
   * Unsubscribe all
   */
  unsubscribeAll() {
    for (const name of this.subscriptions.keys()) {
      this.unsubscribe(name);
    }
  }

  /**
   * List active subscriptions
   */
  listSubscriptions() {
    return Array.from(this.subscriptions.keys());
  }
}

// ============================================================================
// Real-time Dashboard Example
// ============================================================================

/**
 * Real-time task dashboard
 */
class TaskDashboard {
  constructor(session, projectId) {
    this.session = session;
    this.projectId = projectId;
    this.tasks = new Map();
    this.eventHub = new EventHubManager(session);
  }

  /**
   * Initialize dashboard
   */
  async initialize() {
    // Load initial tasks
    const response = await this.session.query(
      `select id, name, status.name, priority from Task ` +
      `where project.id is "${this.projectId}"`
    );

    response.data.forEach(task => {
      this.tasks.set(task.id, task);
    });

    console.log(`✓ Loaded ${this.tasks.size} tasks`);

    // Subscribe to updates
    this.eventHub.subscribe(
      'task-updates',
      'topic=ftrack.update and data.entityType is "task"',
      (event) => this.handleTaskUpdate(event)
    );

    this.eventHub.connect();
  }

  /**
   * Handle task updates
   */
  async handleTaskUpdate(event) {
    const { data } = event;
    const taskId = data.entityId;

    // Update local cache
    const task = await this.session.get('Task', taskId);
    this.tasks.set(taskId, task);

    console.log(`📊 Dashboard updated: ${task.name}`);

    // Update UI (in browser context)
    this.updateUI(task, data.changes);
  }

  /**
   * Update UI with task changes
   */
  updateUI(task, changes) {
    // In browser: update DOM elements
    console.log(`  Task: ${task.name}`);
    console.log(`  Status: ${task.status?.name}`);
    console.log(`  Priority: ${task.priority}`);

    if (changes) {
      console.log(`  Changes:`, changes);
    }
  }

  /**
   * Cleanup
   */
  cleanup() {
    this.eventHub.disconnect();
    this.tasks.clear();
  }
}

// ============================================================================
// Event Filtering and Processing
// ============================================================================

/**
 * Event filter class
 */
class EventFilter {
  constructor() {
    this.filters = [];
  }

  /**
   * Add filter function
   */
  addFilter(name, filterFn) {
    this.filters.push({ name, filterFn });
  }

  /**
   * Check if event passes all filters
   */
  shouldProcess(event) {
    for (const { name, filterFn } of this.filters) {
      if (!filterFn(event)) {
        console.log(`Event filtered by: ${name}`);
        return false;
      }
    }
    return true;
  }

  /**
   * Create filtered handler
   */
  createHandler(handler) {
    return (event) => {
      if (this.shouldProcess(event)) {
        handler(event);
      }
    };
  }
}

/**
 * Example: Filtered event handler
 */
function createFilteredHandler() {
  const filter = new EventFilter();

  // Only high-priority tasks
  filter.addFilter('high-priority', (event) => {
    return event.data?.priority >= 4;
  });

  // Only specific status changes
  filter.addFilter('status-changes', (event) => {
    return event.data?.changes?.status !== undefined;
  });

  // Create handler
  return filter.createHandler((event) => {
    console.log('🔔 High-priority task status changed!');
    console.log(`  Task: ${event.data.entityId}`);
  });
}

// ============================================================================
// Event Batching
// ============================================================================

/**
 * Batch event processor
 */
class BatchEventProcessor {
  constructor(session, batchSize = 10, flushInterval = 5000) {
    this.session = session;
    this.batchSize = batchSize;
    this.flushInterval = flushInterval;
    this.batch = [];
    this.timer = null;
  }

  /**
   * Add event to batch
   */
  addEvent(event) {
    this.batch.push(event);

    // Process if batch is full
    if (this.batch.length >= this.batchSize) {
      this.flush();
    } else if (!this.timer) {
      // Set timer to flush after interval
      this.timer = setTimeout(() => this.flush(), this.flushInterval);
    }
  }

  /**
   * Process batched events
   */
  async flush() {
    if (this.batch.length === 0) {
      return;
    }

    console.log(`Processing batch of ${this.batch.length} events...`);

    try {
      await this.processBatch(this.batch);
      this.batch = [];
    } catch (error) {
      console.error('Batch processing error:', error);
    } finally {
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }
    }
  }

  /**
   * Process batch of events
   */
  async processBatch(events) {
    // Group events by type
    const grouped = events.reduce((acc, event) => {
      const type = event.data?.entityType || 'unknown';
      if (!acc[type]) acc[type] = [];
      acc[type].push(event);
      return acc;
    }, {});

    // Process each group
    for (const [type, typeEvents] of Object.entries(grouped)) {
      console.log(`  ${type}: ${typeEvents.length} events`);
    }
  }

  /**
   * Cleanup
   */
  cleanup() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.flush();
  }
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

  // Example 1: Simple subscription
  console.log('\n=== Example 1: Simple Event Subscription ===');
  subscribeToUpdates(session, simpleUpdateHandler);

  // Example 2: Event hub manager
  console.log('\n=== Example 2: Event Hub Manager ===');
  const eventHub = new EventHubManager(session);

  eventHub.subscribe('task-updates', 'topic=ftrack.update', handleTaskUpdate);
  eventHub.connect();

  console.log('Active subscriptions:', eventHub.listSubscriptions());

  // Example 3: Task dashboard (uncomment to use)
  // const projectId = 'your-project-id';
  // const dashboard = new TaskDashboard(session, projectId);
  // await dashboard.initialize();

  // Keep running for 30 seconds to receive events
  console.log('\nListening for events for 30 seconds...');
  await new Promise(resolve => setTimeout(resolve, 30000));

  // Cleanup
  eventHub.disconnect();
  session.close();
}

// ============================================================================
// Export
// ============================================================================

export {
  subscribeToUpdates,
  subscribeToTaskUpdates,
  subscribeToStatusChanges,
  subscribeToProjectEvents,
  handleTaskUpdate,
  handleTaskUpdateAsync,
  EventHubManager,
  TaskDashboard,
  EventFilter,
  createFilteredHandler,
  BatchEventProcessor
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
