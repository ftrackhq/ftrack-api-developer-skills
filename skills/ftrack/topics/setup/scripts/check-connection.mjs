// Check that @ftrack/api is installed and can reach the server.
// Reads FTRACK_SERVER, FTRACK_API_USER and FTRACK_API_KEY. Never prints the key.
// Run from the project directory: packages are resolved from the current directory.

import { createRequire } from "node:module";
import { join } from "node:path";

const projectRequire = createRequire(join(process.cwd(), "package.json"));

const required = ["FTRACK_SERVER", "FTRACK_API_USER", "FTRACK_API_KEY"];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) {
  console.log(`Missing environment variables: ${missing.join(", ")}`);
  process.exit(1); // nothing pending yet, safe to exit
}

let api;
try {
  api = projectRequire("@ftrack/api");
} catch {
  console.log("@ftrack/api is not installed here. Install with: npm install @ftrack/api");
  process.exit(1);
}

const { FTRACK_API_USER, FTRACK_API_KEY } = process.env;
// The JS client appends "/api" to the URL, so a trailing slash breaks every request.
const serverUrl = process.env.FTRACK_SERVER.replace(/\/+$/, "");
if (serverUrl !== process.env.FTRACK_SERVER) {
  console.log(`Note: FTRACK_SERVER has a trailing slash; pass "${serverUrl}" to new Session()`);
}
let connected = false;
try {
  const session = new api.Session(serverUrl, FTRACK_API_USER, FTRACK_API_KEY);
  await session.initializing;
  console.log(`Connected to ${serverUrl} (ftrack ${session.serverVersion}) as ${FTRACK_API_USER}`);
  connected = true;
} catch (error) {
  console.log(`Connection failed: ${error.name}: ${error.message}`);
}
process.exitCode = connected ? 0 : 1;

const major = Number(process.versions.node.split(".")[0]);
if (typeof WebSocket === "undefined") {
  try {
    projectRequire("ws");
  } catch {
    console.log(`Node.js ${major} has no global WebSocket: run "npm install ws" before using session.eventHub`);
  }
}
