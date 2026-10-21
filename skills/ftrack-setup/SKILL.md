---
name: ftrack-setup
description: Install and configure ftrack development dependencies - ftrack-python-api, ftrack-action-handler, @ftrack/api (plus ws on older Node.js), @ftrack/ts-schema-generator, @ftrack/web-widget - set FTRACK_SERVER / FTRACK_API_USER / FTRACK_API_KEY, generate TypeScript types, and verify the connection.
when_to_use: "Asks: set up an ftrack project, install ftrack-python-api / ftrack-action-handler / @ftrack/api / ts-schema-generator / web-widget, configure credentials, test the connection. Errors: `No module named 'ftrack_api'`, `Cannot find module '@ftrack/api'`."
---

# ftrack setup

Installing packages changes the user's environment: say what you'll install and where, and use the project's existing tooling. Detect it first:

| Found | Use |
|---|---|
| `uv.lock` / `poetry.lock` / `Pipfile` | `uv add` / `poetry add` / `pipenv install` |
| `requirements*.txt` or nothing (Python) | a virtual environment + `pip install`, then pin in `requirements.txt` |
| `pnpm-lock.yaml` / `yarn.lock` / `bun.lock*` / `package-lock.json` | `pnpm add` / `yarn add` / `bun add` / `npm install` |

## Packages

| Need | Install | Notes |
|---|---|---|
| Python API | `ftrack-python-api` (import `ftrack_api`) | 3.x, Python 3.8+. Pins `arrow<1`, which can clash with code needing arrow 1.x - use a dedicated environment |
| Python actions | `ftrack-action-handler` | Adds `BaseAction` / `AdvancedBaseAction` (see ftrack-actions) |
| JavaScript/TypeScript API | `@ftrack/api` | ES module with types; Node.js 20+ or a browser |
| Event hub on Node.js < 22 | `ws` | Optional peer dependency used when there's no global `WebSocket`; not needed in browsers or Node.js 22+ |
| TypeScript workspace types | `@ftrack/ts-schema-generator` (dev) | CLI `ftrack-ts-schema-generator` (see ftrack-typescript) |
| Dashboard widgets | `@ftrack/web-widget` | Widget helpers for ftrack dashboards (see ftrack-dashboards) |

### Python

```bash
python -m venv .venv
# Windows: .venv\Scripts\activate    macOS/Linux: source .venv/bin/activate
python -m pip install ftrack-python-api                      # + ftrack-action-handler for actions
python -m pip freeze | grep -iE "^ftrack" >> requirements.txt   # or pin: ftrack-python-api>=3.1,<4
```

### JavaScript / TypeScript

```bash
npm install @ftrack/api
npm install ws                                   # only for event hub use on Node.js < 22
npm install --save-dev @ftrack/ts-schema-generator typescript   # TypeScript projects
npm install @ftrack/web-widget                   # dashboard widgets
```

Use `"type": "module"` (or `.mjs`) for `import { Session } from "@ftrack/api"` in Node.js.

TypeScript: add a script and generate the types once credentials are set:

```json
"scripts": { "generate-ts-schema": "ftrack-ts-schema-generator ./src/__generated__ schema.ts" }
```

## Credentials

Both clients' tools read the same variables (the Python API reads them automatically; JavaScript code passes them to `new Session(...)`):

```bash
FTRACK_SERVER=https://mycompany.ftrackapp.com
FTRACK_API_USER=jane@example.com
FTRACK_API_KEY=...        # My Account > Security, or a global key in System settings > Security > API keys
```

- Ask the user to set these themselves (shell profile, `.env` file, or secret store); never write a real key into source files, and never echo it back.
- If you create a `.env`, add it to `.gitignore` first.
- For services and listeners, recommend a global API key with a restricted role (see ftrack-session).
- Self-signed certificates (Python): point `REQUESTS_CA_BUNDLE` at the CA bundle. Proxies: `HTTPS_PROXY`.

## Verify

Run the bundled checks (they print the server version and user, never the key):

```bash
python "${CLAUDE_SKILL_DIR}/scripts/check_connection.py"
node "${CLAUDE_SKILL_DIR}/scripts/check-connection.mjs"      # run from the project so @ftrack/api resolves
```

The Node.js check must run where `@ftrack/api` is installed: copy it into the project or run it with the project as working directory and `NODE_PATH=node_modules`.

Typical failures:

| Symptom | Fix |
|---|---|
| `No module named 'ftrack_api'` | The venv isn't active, or the package went into another interpreter: use `python -m pip` |
| `ServerError` mentioning authentication / `ServerPermissionDeniedError` | Wrong user or key, or the key's role lacks access |
| Connection/SSL errors | Check `FTRACK_SERVER` (https, no extra path), proxy, `REQUESTS_CA_BUNDLE` |
| JavaScript: `Unexpected token '<' ... is not valid JSON` | `FTRACK_SERVER` has a trailing slash; strip it before `new Session()` (Python doesn't mind) |
| `EventHubConnectionError` on `wait()` | Create the session with `auto_connect_event_hub=True` |
| `Cannot find package 'ws'` when using the event hub in Node.js | `npm install ws` or use Node.js 22+ |
| `SyntaxError: Cannot use import statement outside a module` | Add `"type": "module"` or use `.mjs` |
| `ftrack-ts-schema-generator` crashes with `Property or signature expected` | A custom attribute key contains a space; see ftrack-typescript |
| Dependency conflict on `arrow` | Install ftrack-python-api in its own virtual environment |

Package sources: https://pypi.org/project/ftrack-python-api/, https://pypi.org/project/ftrack-action-handler/, https://www.npmjs.com/package/@ftrack/api, https://www.npmjs.com/package/@ftrack/ts-schema-generator, https://www.npmjs.com/package/@ftrack/web-widget.
