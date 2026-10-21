# ftrack webhooks

Source: https://developer.ftrack.com/extending-ftrack/webhooks. Example handlers: https://github.com/ftrackhq/ftrack-recipes/tree/main/python/webhook and https://github.com/ftrackhq/cloud-run-webhook-handler.

Webhooks let ftrack POST entity events to your HTTPS endpoint, so you don't need a process connected to the event hub.

## Limits

- ftrack 24.6+, cloud-hosted workspaces only.
- Create and update operations only (no delete yet). Some background-job operations don't fire events.
- At most 10 enabled webhooks. URLs must start with `https://`.
- Sent by an automatically created service user: it reaches all open projects; grant it access to each private project that should trigger webhooks.

## Payload

```json
{
  "id": "a3760d18-...",
  "fez_id": "ftrack_entity_event_v1",
  "metadata": {"date": "2024-02-08T15:47:28.943659+00:00", "resource_id": "...", "server_url": "https://my-workspace.ftrackapp.com/", "configuration_hash": "..."},
  "entity": {
    "id": ["3567adcf-..."],
    "entity_type": "Task",
    "operation": "update",
    "new": {"id": "...", "name": "Task name", "status_id": "...", "parent_id": "...", "project_id": "...", "...": "..."},
    "old": {"...": "..."}
  }
}
```

Unlike event hub `ftrack.update` events, webhooks use API names (`Task`, `status_id`). `new`/`old` hold the entity's direct attributes, not related entities or computed values.

## Creating one

Python:

```python
automation = session.create("Automation", {"name": "Task created"})
session.create("Trigger", {
    "automation_id": automation["id"],
    "filter": 'entity.entity_type = "Task" and entity.operation = "create"',
})
session.create("WebhookAction", {
    "automation_id": automation["id"],
    "webhook_url": "https://my-endpoint.example.com/ftrack",
})
session.commit()
```

JavaScript (one transaction):

```javascript
import { operation } from "@ftrack/api";

const automationId = crypto.randomUUID();
await session.call([
  operation.create("Automation", { id: automationId, name: "Task created" }),
  operation.create("Trigger", {
    automation_id: automationId,
    filter: 'entity.entity_type = "Task" and entity.operation = "create"',
  }),
  operation.create("WebhookAction", {
    automation_id: automationId,
    webhook_url: "https://my-endpoint.example.com/ftrack",
  }),
]);
```

`WebhookAction` also has an optional `headers` text attribute (not covered by the docs - check its format in your workspace API reference before relying on it). Webhooks can also be created in the web UI under system settings.

## Trigger filters

Evaluated against the payload; support `and`, `or`, `=`, `!=` and parentheses:

```text
entity.entity_type = "AssetVersion" and entity.operation = "update"
  and entity.new.status_id != entity.old.status_id
  and entity.new.status_id = "<pending-approval-status-id>"
```

## Endpoint tips

- Serverless functions (AWS Lambda, Google Cloud Run) or Zapier/Make work well.
- Respond quickly; do heavy work asynchronously.
- Treat the endpoint as public: validate the payload (e.g. check `metadata.server_url` is your workspace) and keep the URL unguessable.
- Your handler calls back into ftrack with its own API key if it needs to update data.
