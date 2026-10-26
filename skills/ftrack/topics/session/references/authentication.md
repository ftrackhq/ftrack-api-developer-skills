# Authentication

Sources: https://developer.ftrack.com/api/authentication and https://developer.ftrack.com/api/endpoint.

Every client authenticates with three values: **server URL**, **API user** (username) and **API key**.

## Personal API keys

Each user has a personal key with the same permissions as that user in the web interface. Found under **My Account > Security**. Suitable for a user's own tools; scripts then act as that user.

## Global API keys

Created under **System settings > Security > API keys**. Use them for services, event listeners and automation so permissions aren't tied to a person.

- A global key must have **at least one role**. Create API roles under **System settings > Security > Roles** (Role type: API) with only the permissions the script needs - e.g. a read-only key for reporting, a separate key with write access for automation.
- By default a global key can only access **open projects** (private access off). To reach a private project, add it to the key's **Projects** attribute.

## Raw HTTP

The API is a single endpoint, `POST https://<workspace>/api`, with a JSON list of operations. Authenticate the first request with headers; the session cookie carries authentication afterwards.

```bash
curl https://mycompany.ftrackapp.com/api \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "ftrack-user: john" \
  -H "ftrack-api-key: $FTRACK_API_KEY" \
  --data '[]'
```

Invalid credentials return an HTTP error status with details in the body and in an `FTRACK_ERROR` header. Operation errors come back as `{"exception": "ExceptionName", "content": "details"}`. All operations in one request share a transaction.

Optional header `ftrack-strict-api: true` enables strict mode for that request.

## Handling keys

- Load keys from environment variables (`FTRACK_SERVER`, `FTRACK_API_USER`, `FTRACK_API_KEY`) or a secret manager; never commit them.
- Never send an API key to a browser. Dashboard widgets get the current user's credentials from ftrack at runtime.
- Rotate any key that leaked: reset a personal key from the account security page, or replace a global key in system settings.
