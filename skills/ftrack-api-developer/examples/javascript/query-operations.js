/**
 * ftrack JavaScript API - Query Operations Examples
 *
 * Demonstrates query patterns, optimization techniques,
 * and best practices for data retrieval.
 */

import ftrack from '@ftrack/api';

// ============================================================================
// Basic Query Patterns
// ============================================================================

/**
 * Simple query with projections
 */
async function basicQuery(session) {
  // ✓ OPTIMAL: Project specific attributes
  const response = await session.query(
    'select name, full_name, status.name from Project'
  );

  console.log(`Found ${response.data.length} projects`);

  response.data.forEach(project => {
    console.log(`- ${project.name}: ${project.status.name}`);
  });

  return response.data;
}

/**
 * Query with filtering
 */
async function filteredQuery(session) {
  // Use ID filtering for better performance
  const projectId = 'your-project-id';

  const response = await session.query(
    `select name, status.name, parent.name from Task where project.id is "${projectId}"`
  );

  return response.data;
}

/**
 * Query with multiple conditions
 */
async function complexQuery(session) {
  const response = await session.query(
    'select name, status.name, priority from Task ' +
    'where status.name in ("In Progress", "Waiting for Review") ' +
    'and priority > 2'
  );

  return response.data;
}

// ============================================================================
// Pagination Patterns
// ============================================================================

/**
 * Basic pagination
 */
async function paginatedQuery(session, offset = 0, limit = 100) {
  const response = await session.query(
    'select name, status.name from Task',
    { offset, limit }
  );

  console.log(`Retrieved ${response.data.length} tasks (offset: ${offset})`);
  return response.data;
}

/**
 * Fetch all pages
 */
async function fetchAllPages(session, query, pageSize = 100) {
  let allResults = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const response = await session.query(query, {
      offset,
      limit: pageSize
    });

    allResults = allResults.concat(response.data);

    console.log(`Fetched page ${Math.floor(offset / pageSize) + 1}: ${response.data.length} items`);

    hasMore = response.data.length === pageSize;
    offset += pageSize;
  }

  console.log(`Total items fetched: ${allResults.length}`);
  return allResults;
}

/**
 * Cursor-based pagination (more efficient)
 */
async function cursorBasedPagination(session, entityType = 'Task', batchSize = 100) {
  let results = [];
  let lastId = null;

  while (true) {
    let query;
    if (lastId) {
      query = `select id, name from ${entityType} where id > "${lastId}" order by id asc limit ${batchSize}`;
    } else {
      query = `select id, name from ${entityType} order by id asc limit ${batchSize}`;
    }

    const response = await session.query(query);

    if (response.data.length === 0) {
      break;
    }

    results = results.concat(response.data);
    lastId = response.data[response.data.length - 1].id;

    console.log(`Fetched batch: ${response.data.length} items (total: ${results.length})`);
  }

  return results;
}

// ============================================================================
// Query Optimization
// ============================================================================

/**
 * Efficient relationship queries
 */
async function optimizedRelationshipQuery(session, projectIds) {
  // ✓ OPTIMAL: Use IN clause for multiple IDs
  const idList = projectIds.map(id => `"${id}"`).join(', ');

  const response = await session.query(
    `select name, status.name, project.name from Task where project.id in (${idList})`
  );

  return response.data;
}

/**
 * Hierarchy queries with ancestors
 */
async function hierarchyQuery(session, projectId) {
  // ✓ OPTIMAL: Use ancestors for hierarchy traversal
  const response = await session.query(
    `select name, parent.name from Task where ancestors any (id is "${projectId}")`
  );

  return response.data;
}

/**
 * Query with ordering
 */
async function orderedQuery(session) {
  const response = await session.query(
    'select name, created_at, priority from Task ' +
    'where status.name is "In Progress" ' +
    'order by priority desc, created_at asc ' +
    'limit 50'
  );

  return response.data;
}

// ============================================================================
// Entity Retrieval
// ============================================================================

/**
 * Get single entity by ID
 */
async function getEntityById(session, entityType, entityId) {
  try {
    const entity = await session.get(entityType, entityId);
    console.log(`Retrieved ${entityType}: ${entity.name}`);
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
async function getEntityWithProjection(session, entityType, entityId) {
  const response = await session.query(
    `select name, status.name, priority from ${entityType} where id is "${entityId}"`
  );

  return response.data[0] || null;
}

// ============================================================================
// Batch Queries
// ============================================================================

/**
 * Batch query multiple entity types
 */
async function batchQuery(session) {
  // Execute queries in parallel
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

/**
 * Query multiple entities by IDs
 */
async function getMultipleEntities(session, entityType, entityIds) {
  if (entityIds.length === 0) {
    return [];
  }

  const idList = entityIds.map(id => `"${id}"`).join(', ');
  const response = await session.query(
    `select id, name from ${entityType} where id in (${idList})`
  );

  return response.data;
}

// ============================================================================
// Query Utilities
// ============================================================================

/**
 * Count entities matching criteria
 */
async function countEntities(session, query) {
  const response = await session.query(query + ' limit 1');
  // Note: JavaScript API doesn't have direct count,
  // need to fetch and check length or use limit 1 and metadata

  // Alternative: fetch all with pagination to get accurate count
  const allResults = await fetchAllPages(session, query);
  return allResults.length;
}

/**
 * Query builder helper
 */
class QueryBuilder {
  constructor(entityType) {
    this.entityType = entityType;
    this.projections = [];
    this.conditions = [];
    this.orderBy = null;
    this.limitValue = null;
    this.offsetValue = 0;
  }

  select(...fields) {
    this.projections.push(...fields);
    return this;
  }

  where(condition) {
    this.conditions.push(condition);
    return this;
  }

  order(field, direction = 'asc') {
    this.orderBy = `${field} ${direction}`;
    return this;
  }

  limit(value) {
    this.limitValue = value;
    return this;
  }

  offset(value) {
    this.offsetValue = value;
    return this;
  }

  build() {
    let query = '';

    if (this.projections.length > 0) {
      query += `select ${this.projections.join(', ')} from `;
    }

    query += this.entityType;

    if (this.conditions.length > 0) {
      query += ` where ${this.conditions.join(' and ')}`;
    }

    if (this.orderBy) {
      query += ` order by ${this.orderBy}`;
    }

    if (this.limitValue) {
      query += ` limit ${this.limitValue}`;
    }

    return query;
  }

  async execute(session) {
    const query = this.build();
    return await session.query(query, {
      offset: this.offsetValue,
      limit: this.limitValue
    });
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

  try {
    // Example 1: Basic query
    console.log('\n=== Example 1: Basic Query ===');
    await basicQuery(session);

    // Example 2: Pagination
    console.log('\n=== Example 2: Pagination ===');
    await paginatedQuery(session, 0, 10);

    // Example 3: Query builder
    console.log('\n=== Example 3: Query Builder ===');
    const builder = new QueryBuilder('Task')
      .select('name', 'status.name', 'priority')
      .where('status.name is "In Progress"')
      .where('priority > 2')
      .order('priority', 'desc')
      .limit(10);

    const result = await builder.execute(session);
    console.log(`Query builder result: ${result.data.length} tasks`);
    console.log(`Query: ${builder.build()}`);

    // Example 4: Batch queries
    console.log('\n=== Example 4: Batch Queries ===');
    const batchResults = await batchQuery(session);
    console.log('Batch results:', {
      projects: batchResults.projects.length,
      tasks: batchResults.tasks.length,
      users: batchResults.users.length
    });

  } finally {
    session.close();
  }
}

// ============================================================================
// Export
// ============================================================================

export {
  basicQuery,
  filteredQuery,
  complexQuery,
  paginatedQuery,
  fetchAllPages,
  cursorBasedPagination,
  optimizedRelationshipQuery,
  hierarchyQuery,
  orderedQuery,
  getEntityById,
  batchQuery,
  getMultipleEntities,
  QueryBuilder
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
