// ftrack session examples (JavaScript, @ftrack/api).
// Reads credentials from FTRACK_SERVER, FTRACK_API_USER and FTRACK_API_KEY.
// Usage: node session-examples.js <shotId>

import { Session, operation, expression, error } from "@ftrack/api";

export async function createSession() {
  const { FTRACK_SERVER, FTRACK_API_USER, FTRACK_API_KEY } = process.env;
  const session = new Session(FTRACK_SERVER.replace(/\/+$/, ""), FTRACK_API_USER, FTRACK_API_KEY);
  try {
    await session.initializing;
  } catch (e) {
    if (e instanceof error.ServerPermissionDeniedError) {
      throw new Error("ftrack rejected the credentials: " + e.message);
    }
    throw e;
  }
  return session;
}

export async function safeQuery(session, queryExpression) {
  try {
    return (await session.query(queryExpression)).data;
  } catch (e) {
    if (e instanceof error.ServerPermissionDeniedError) {
      console.error("No permission:", e.message);
      return [];
    }
    // ServerError / ServerValidationError: bad query or data, retrying won't help.
    // Anything else is a network error from fetch and may be retried.
    throw e;
  }
}

export async function addLightingTask(session, shotId, typeId) {
  // One request, one transaction: both operations succeed or neither does.
  const [created] = await session.call([
    operation.create("Task", { name: "lighting", parent_id: shotId, type_id: typeId }),
    operation.update("Shot", [shotId], { description: "lighting task added" }),
  ]);
  return created.data;
}

export async function cancellableQuery(session, queryExpression, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return (await session.query(queryExpression, { signal: controller.signal })).data;
  } catch (e) {
    if (e instanceof error.AbortError) return null;
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

async function main(shotId) {
  const session = await createSession();
  console.log("Server version:", session.serverVersion);

  const shots = await safeQuery(
    session,
    expression`select name, created_at from Shot where id is "${shotId}"`
  );
  console.log(shots);

  // ISO strings instead of Moment (1.x) / dayjs (2.x) objects, e.g. for JSON storage.
  const { data } = await session.query(
    expression`select created_at from Shot where id is "${shotId}"`,
    { decodeDatesAsIso: true }
  );
  console.log(data[0]?.created_at);
}

if (process.argv[2]) {
  main(process.argv[2]).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
