// ftrack JavaScript client examples (Node.js 20+).
// Reads credentials from FTRACK_SERVER, FTRACK_API_USER and FTRACK_API_KEY.
// Usage: node crud-examples.js <shotId> [fileToUpload]

import { openAsBlob } from "node:fs";
import { basename } from "node:path";
import { Session, operation, expression, error } from "@ftrack/api";

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
    { parent_id: shotId, parent_type: "Shot", key, value },
    ["parent_id", "key"]
  );
}

async function uploadFile(session, path, versionId) {
  const blob = await openAsBlob(path);
  const file = new File([blob], basename(path));
  const [{ data: component }] = await session.createComponent(file, {
    data: versionId ? { version_id: versionId } : {},
    onProgress: (percent) => process.stdout.write(`\rUploading ${Math.round(percent)}%`),
  });
  process.stdout.write("\n");
  return component;
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
    const component = await uploadFile(session, filePath);
    console.log("Uploaded component", component.id);
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
