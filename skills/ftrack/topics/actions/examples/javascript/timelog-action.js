// ftrack action in Node.js: show and edit the time logs of a selected task.
// Based on ftrack-recipes (javascript/actions/edit_timelogs).
// npm install @ftrack/api ws   (ws is only needed on Node.js < 22)
// Reads FTRACK_SERVER, FTRACK_API_USER, FTRACK_API_KEY. Run: node timelog-action.js

import { Session, operation, expression } from "@ftrack/api";

const IDENTIFIER = "my-company.edit-timelogs";
const { FTRACK_SERVER, FTRACK_API_USER, FTRACK_API_KEY } = process.env;

const session = new Session(FTRACK_SERVER.replace(/\/+$/, ""), FTRACK_API_USER, FTRACK_API_KEY, {
  autoConnectEventHub: true,
});
await session.initializing;

function discover(event) {
  const selection = event.data.selection ?? [];
  // Legacy entityType names: "task" covers every hierarchy item.
  if (selection.length !== 1 || selection[0].entityType !== "task") return;
  return {
    items: [{ label: "Timelogs", description: "Show and edit time logs", actionIdentifier: IDENTIFIER }],
  };
}

async function launch(event) {
  // The JS event hub only filters on topic, so check the identifier here.
  if (event.data.actionIdentifier !== IDENTIFIER) return;

  try {
    if (event.data.values) return await save(event.data.values);

    const contextId = event.data.selection[0].entityId;
    const { data } = await session.query(
      expression`select id, comment, duration, user.first_name, user.last_name from Timelog where context_id is "${contextId}"`
    );
    if (!data.length) return { success: true, message: "No time logs on this task" };

    return {
      type: "form",
      title: "Time logs",
      submit_button_label: "Save",
      items: data.flatMap((log) => [
        { type: "label", value: `**${log.user.first_name} ${log.user.last_name}**` },
        { type: "text", label: "Comment", name: `comment:${log.id}`, value: log.comment ?? "" },
        { type: "number", label: "Duration (s)", name: `duration:${log.id}`, value: log.duration },
        { type: "boolean", label: "Delete", name: `delete:${log.id}`, value: false },
      ]),
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: `Failed: ${error.message}` };
  }
}

async function save(values) {
  const byId = {};
  for (const [key, value] of Object.entries(values)) {
    const [field, id] = key.split(":");
    (byId[id] ??= {})[field] = value;
  }
  const operations = Object.entries(byId).map(([id, fields]) =>
    fields.delete
      ? operation.delete("Timelog", [id])
      : operation.update("Timelog", [id], { comment: fields.comment, duration: Number(fields.duration) })
  );
  await session.call(operations); // one transaction
  return { success: true, message: `Updated ${operations.length} time log(s)` };
}

session.eventHub.subscribe("topic=ftrack.action.discover", discover);
session.eventHub.subscribe("topic=ftrack.action.launch", launch);
console.log("Action registered. Ctrl-C to stop.");
