// Upload a file to an ftrack AssetVersion from Node.js 20+, encode it for review
// and use it as the version thumbnail. Creates data in ftrack.
// Usage: node upload.js <versionId> <file>
// Reads FTRACK_SERVER, FTRACK_API_USER, FTRACK_API_KEY.

import { readFile } from "node:fs/promises";
import { basename, extname } from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { Session, operation, SERVER_LOCATION_ID } from "@ftrack/api";

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

const [versionId, path] = process.argv.slice(2);
const { FTRACK_SERVER, FTRACK_API_USER, FTRACK_API_KEY } = process.env;
const session = new Session(FTRACK_SERVER.replace(/\/+$/, ""), FTRACK_API_USER, FTRACK_API_KEY);
await session.initializing;

const componentId = await uploadFileNode(session, path, { name: "main", version_id: versionId });
console.log(`Component ${componentId} in ftrack.server`);

// Server-side encode to web-playable media (asynchronous job).
const [encode] = await session.call([
  { action: "encode_media", component_id: componentId, version_id: versionId, keep_original: true },
]);
console.log("Encode job:", encode.job_id);

if (/\.(jpe?g|png)$/i.test(path)) {
  await session.update("AssetVersion", [versionId], { thumbnail_id: componentId });
  console.log("Thumbnail:", session.thumbnailUrl(componentId, { size: 300 }).split("?")[0]);
}
console.log("Download:", session.getComponentUrl(componentId).split("?")[0], "(full URL contains the API key)");
