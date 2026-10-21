// Upload a file to an ftrack AssetVersion from Node.js 20+, encode it for review
// and use it as the version thumbnail. Creates data in ftrack.
// Usage: node upload.js <versionId> <file>
// Reads FTRACK_SERVER, FTRACK_API_USER, FTRACK_API_KEY.

import { openAsBlob } from "node:fs";
import { basename } from "node:path";
import { Session } from "@ftrack/api";

const [versionId, path] = process.argv.slice(2);
const { FTRACK_SERVER, FTRACK_API_USER, FTRACK_API_KEY } = process.env;
const session = new Session(FTRACK_SERVER.replace(/\/+$/, ""), FTRACK_API_USER, FTRACK_API_KEY);
await session.initializing;

const file = new File([await openAsBlob(path)], basename(path));
const [{ data: component }] = await session.createComponent(file, {
  data: { name: "main", version_id: versionId },
  onProgress: (percent) => process.stdout.write(`\r${Math.round(percent)}%`),
});
console.log(`\nComponent ${component.id} in ftrack.server`);

// Server-side encode to web-playable media (asynchronous job).
const [encode] = await session.call([
  { action: "encode_media", component_id: component.id, version_id: versionId, keep_original: true },
]);
console.log("Encode job:", encode.job_id);

if (/\.(jpe?g|png)$/i.test(path)) {
  await session.update("AssetVersion", [versionId], { thumbnail_id: component.id });
  console.log("Thumbnail:", session.thumbnailUrl(component.id, { size: 300 }).split("?")[0]);
}
console.log("Download:", session.getComponentUrl(component.id).split("?")[0], "(full URL contains the API key)");
