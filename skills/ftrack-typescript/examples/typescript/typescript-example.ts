// Typed @ftrack/api usage with generated workspace types.
// Generate the types first:  npx ftrack-ts-schema-generator ./__generated__ schema.ts
// Reads credentials from FTRACK_SERVER, FTRACK_API_USER and FTRACK_API_KEY.
// Usage: npx tsx typescript-example.ts <projectId>

import { Session, expression, error } from "@ftrack/api";
import type { EntityData, EntityTypeMap } from "./__generated__/schema.js";

type Task = EntityData<"Task">;

export async function createSession(): Promise<Session<EntityTypeMap>> {
  const { FTRACK_SERVER, FTRACK_API_USER, FTRACK_API_KEY } = process.env;
  if (!FTRACK_SERVER || !FTRACK_API_USER || !FTRACK_API_KEY) {
    throw new Error("Set FTRACK_SERVER, FTRACK_API_USER and FTRACK_API_KEY");
  }
  const session = new Session<EntityTypeMap>(FTRACK_SERVER, FTRACK_API_USER, FTRACK_API_KEY);
  await session.initializing;
  return session;
}

export async function tasksInProject(
  session: Session<EntityTypeMap>,
  projectId: string,
): Promise<Task[]> {
  // The type argument is the entity type name. decodeDatesAsIso makes date
  // values strings, matching the generated types.
  const { data } = await session.query<"Task">(
    expression`select name, status.name, end_date from Task where project_id is "${projectId}" order by name`,
    { decodeDatesAsIso: true },
  );
  return data;
}

export async function createTask(
  session: Session<EntityTypeMap>,
  parentId: string,
  typeId: string,
  name: string,
): Promise<Task> {
  // Entity type inferred from "Task"; the data object is checked against Task.
  const { data } = await session.create("Task", {
    name,
    parent_id: parentId,
    type_id: typeId,
  });
  return data;
}

export async function setStatus(
  session: Session<EntityTypeMap>,
  taskId: string,
  statusName: string,
): Promise<void> {
  const { data } = await session.query<"Status">(
    expression`select id from Status where name is "${statusName}"`,
  );
  if (!data.length) throw new Error(`No status named ${statusName}`);
  await session.update("Task", [taskId], { status_id: data[0].id });
}

export function describe(task: Task): string {
  const due = task.end_date ? ` due ${task.end_date.slice(0, 10)}` : "";
  return `${task.name} [${task.status?.name ?? "no status"}]${due}`;
}

export function customAttribute(task: Task, key: string) {
  // custom_attributes entries carry key and value; projected via "select custom_attributes ...".
  return task.custom_attributes?.find((attribute) => attribute.key === key)?.value;
}

async function main(projectId: string) {
  const session = await createSession();
  try {
    for (const task of await tasksInProject(session, projectId)) {
      console.log(describe(task));
    }
  } catch (e) {
    if (e instanceof error.ServerPermissionDeniedError) {
      console.error("No access:", e.message);
      return;
    }
    throw e;
  }
}

if (process.argv[2]) {
  main(process.argv[2]).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
