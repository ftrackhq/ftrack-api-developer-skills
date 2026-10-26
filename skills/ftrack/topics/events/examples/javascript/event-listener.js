// Listen for ftrack task status changes from Node.js (@ftrack/api).
// Reads credentials from FTRACK_SERVER, FTRACK_API_USER and FTRACK_API_KEY.
// Usage: node event-listener.js

import { Session, Event, expression } from "@ftrack/api";

const { FTRACK_SERVER, FTRACK_API_USER, FTRACK_API_KEY } = process.env;

const session = new Session(FTRACK_SERVER.replace(/\/+$/, ""), FTRACK_API_USER, FTRACK_API_KEY, {
  autoConnectEventHub: true,
});
await session.initializing;

async function onUpdate(event) {
  // The JS client only filters by topic, so filter the payload here.
  for (const entity of event.data.entities ?? []) {
    if (entity.entityType !== "task" || !entity.keys?.includes("statusid")) continue;

    const { data } = await session.query(
      expression`select name, status.name from TypedContext where id is "${entity.entityId}"`
    );
    if (data[0]) console.log(`${data[0].name} -> ${data[0].status?.name}`);
  }
}

const subscriberId = session.eventHub.subscribe("topic=ftrack.update", onUpdate);
console.log("Listening for status changes. Ctrl-C to stop.");

// Replies: a returned value is sent back to the publisher.
session.eventHub.subscribe("topic=my-company.ping", () => ({ pong: true }));

const reply = await session.eventHub.publishAndWaitForReply(
  new Event("my-company.ping", {}),
  { timeout: 10 }
);
console.log("Reply:", reply.data);

process.on("SIGINT", () => {
  session.eventHub.unsubscribe(subscriberId);
  process.exit(0);
});
