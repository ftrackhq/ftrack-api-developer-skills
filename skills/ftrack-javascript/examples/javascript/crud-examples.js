// ftrack JavaScript client examples (Node.js 20+).
// Reads credentials from FTRACK_SERVER, FTRACK_API_USER and FTRACK_API_KEY.
// Usage: node crud-examples.js <shotId> [fileToUpload]

import { readFile } from "node:fs/promises";
import { basename, extname } from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { Session, operation, expression, error, SERVER_LOCATION_ID } from "@ftrack/api";

// createComponent() needs XMLHttpRequest (browsers only); in Node.js use the upload protocol directly.
export async function uploadFileNode(session, path, data = {}) {
  const bytes = await readFile(path);
  const id = randomUUID();
  const ext = extname(path);
  const name = data.name ?? basename(path, ext);
  const [, meta] = await session.call([
    operation.create("FileComponent", { id, name, file_type: ext, size: bytes.length, ...data }),
    { action: "get_upload_metadata", component_id: id, file_name: `${name}${ext}`, file_size: bytes.length,
      checksum: createHash("md5").update(bytes).digest("base64") },
  ]);
  const res = await fetch(meta.url, { method: "PUT", headers: meta.headers, body: bytes });
  if (!res.ok) throw new Error(`Upload failed: HTTP ${res.status}`);
  await session.create("ComponentLocation", { component_id: id, location_id: SERVER_LOCATION_ID });
  return id;
}

const { FTRACK_SERVER, FTRACK_API_USER, FTRACK_API_KEY } = process.env;

async function firstId(session, queryExpression) {
  const { data } = await session.query(queryExpression);
  if (!data.length) throw new Error(`Nothing matched: ${queryExpression}`);
  return data[0].id;
}

async function createTask(session, shotId, name) {
  const typeId = await firstId(session, 'select id from Type where name is "Lighting"');
  const { data: task } = await session.create("Task", {
    name,
    parent_id: shotId,
    type_id: typeId,
  });
  return task;
}

async function setStatus(session, taskId, statusName) {
  const statusId = await firstId(
    session,
    expression`select id from Status where name is "${statusName}"`
  );
  await session.update("Task", [taskId], { status_id: statusId });
}

async function addTasksAtomically(session, shotId, names, typeId) {
  // All creates succeed or none do.
  const responses = await session.call(
    names.map((name) => operation.create("Task", { name, parent_id: shotId, type_id: typeId }))
  );
  return responses.map((response) => response.data);
}

async function tagShot(session, shotId, key, value) {
  // Creates the metadata entry, or updates its value if the key already exists.
  return session.ensure(
    "Metadata",
    { parent_id: shotId, parent_type: "TypedContext", key, value },
    ["parent_id", "key"]
  );
}

async function uploadFile(session, path, versionId) {
  return uploadFileNode(session, path, versionId ? { version_id: versionId } : {});
}

async function main(shotId, filePath) {
  const session = new Session(FTRACK_SERVER.replace(/\/+$/, ""), FTRACK_API_USER, FTRACK_API_KEY);
  await session.initializing;

  const task = await createTask(session, shotId, "lighting_example");
  console.log("Created task", task.id);

  try {
    await setStatus(session, task.id, "In Progress");
  } catch (e) {
    if (!(e instanceof error.ServerError)) throw e;
    console.warn("Could not set status:", e.message);
  }

  console.log(await tagShot(session, shotId, "example", "true"));

  if (filePath) {
    const componentId = await uploadFile(session, filePath);
    console.log("Uploaded component", componentId);
  }

  await session.delete("Task", [task.id]);
  console.log("Deleted task", task.id);
}

if (process.argv[2]) {
  main(process.argv[2], process.argv[3]).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

export { createTask, setStatus, addTasksAtomically, tagShot, uploadFile };
