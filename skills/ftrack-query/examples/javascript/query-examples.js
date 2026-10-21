// ftrack query examples (JavaScript, @ftrack/api).
// Reads credentials from FTRACK_SERVER, FTRACK_API_USER and FTRACK_API_KEY.
// Usage: node query-examples.js <projectId>

import { Session, operation, expression } from "@ftrack/api";

const { FTRACK_SERVER, FTRACK_API_USER, FTRACK_API_KEY } = process.env;

export async function tasksInProject(session, projectId) {
  // expression`` escapes quotes in interpolated values.
  const response = await session.query(
    expression`select name, status.name, type.name from Task where project_id is "${projectId}" order by name`
  );
  return response.data;
}

export async function taskById(session, taskId) {
  const response = await session.query(
    expression`select name, parent.name from Task where id is "${taskId}"`
  );
  return response.data[0] ?? null;
}

export async function tasksByIds(session, taskIds) {
  // One request instead of one per id.
  const ids = taskIds.map((id) => `"${id.replace(/"/g, '\\"')}"`).join(", ");
  const response = await session.query(`select name from Task where id in (${ids})`);
  return response.data;
}

export async function tasksUnder(session, contextId) {
  // Works at any depth and avoids parent.parent... joins.
  const response = await session.query(
    expression`select name from Task where ancestors any (id is "${contextId}")`
  );
  return response.data;
}

export async function projectsWithMetadata(session, key, value) {
  // any (...) makes both conditions apply to the same metadata row.
  const response = await session.query(
    expression`select name from Project where metadata any (key is "${key}" and value is "${value}")`
  );
  return response.data;
}

export async function* iterateAll(session, baseQuery, pageSize = 200) {
  // The JS client returns one page per call. Use metadata.next.offset, not
  // offset + limit, because the server may skip rows filtered by permissions.
  let offset = 0;
  while (offset !== null) {
    const response = await session.query(`${baseQuery} offset ${offset} limit ${pageSize}`);
    yield* response.data;
    offset = response.metadata.next.offset;
  }
}

export async function taskCountsByStatus(session, projectId) {
  // group by needs session.call and strict mode, enabled here for this call only.
  const [counts, statuses] = await session.call(
    [
      operation.query(
        expression`select count(id), status_id from Task where project_id is "${projectId}" group by status_id`
      ),
      operation.query("select id, name from Status"),
    ],
    { additionalHeaders: { "ftrack-strict-api": "true" } }
  );
  const names = Object.fromEntries(statuses.data.map((s) => [s.id, s.name]));
  return Object.fromEntries(counts.data.map((row) => [names[row.status_id], row.count_id]));
}

async function main(projectId) {
  const session = new Session(FTRACK_SERVER, FTRACK_API_USER, FTRACK_API_KEY);
  await session.initializing;

  for (const task of (await tasksInProject(session, projectId)).slice(0, 10)) {
    console.log(task.name, "-", task.status.name, "-", task.type.name);
  }

  for await (const task of iterateAll(
    session,
    expression`select name from Task where project_id is "${projectId}"`
  )) {
    console.log(task.name);
  }

  console.log(await taskCountsByStatus(session, projectId));
}

if (process.argv[2]) {
  main(process.argv[2]).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
