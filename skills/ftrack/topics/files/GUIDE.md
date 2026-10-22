# ftrack files

**Model:** a `Component` is file metadata (name, type, size). Where the data actually is, is a `ComponentLocation` linking it to a `Location`. Published files hang off `AssetVersion` (`Asset` -> versions -> components). The `Asset`'s parent is the task's **parent** (shot, asset build, folder, project); the task itself goes on the version.

## Publish (Python)

```python
task = session.get("Task", task_id)
asset_type = session.query('AssetType where name is "Geometry"').one()
asset = session.query(
    'Asset where name is "hero" and parent.id is "{0}"'.format(task["parent"]["id"])
).first() or session.create("Asset", {"name": "hero", "type": asset_type, "parent": task["parent"]})
version = session.create("AssetVersion", {"asset": asset, "task": task})
session.commit()

version.create_component("/renders/hero.mov", data={"name": "main"}, location="auto")
version.create_component("/renders/hero.%04d.exr [1001-1100]", data={"name": "frames"}, location="auto")
session.commit()

version.encode_media("/renders/hero.mov")          # web-playable review media (server job)
version.create_thumbnail("/renders/hero_thumb.jpg")
```

- `location="auto"` picks the highest-priority configured location; pass a `Location` entity to choose (`session.query('Location where name is "my.location"').one()`), or `None` to only track it in `ftrack.origin` for this session.
- Sequences use clique notation: `/path/file.%04d.ext [1-5, 7, 10-20]` -> a `SequenceComponent` with one child per frame.
- `session.create_component(path, data=None, location="auto")` creates an unattached component.

## Built-in locations

| Name | Use |
|---|---|
| `ftrack.server` | ftrack cloud storage; needed for thumbnails, review and browser downloads (`ftrack_api.symbol.SERVER_LOCATION_ID`) |
| `ftrack.unmanaged` | Track files at their current path without copying |
| `ftrack.origin` | Temporary source location used while adding components |
| `ftrack.connect`, `ftrack.review` | Used by ftrack Connect and legacy review |

Custom locations need a name (not starting with `ftrack.`), an **accessor** (how to read/write: `DiskAccessor(prefix=...)` or your own `ftrack_api.accessor.base.Accessor` subclass), a **structure** (where files go: `StandardStructure()`, `IdStructure()`, or your own) and a **priority** (lower wins). Configure them for every session from a plugin on `topic=ftrack.api.session.configure-location`. See [references/locations.md](references/locations.md).

## Reading files

```python
component = session.query('select name from Component where version_id is "{0}"'.format(version_id)).first()
location = session.pick_location(component)                 # best available location
path = location.get_filesystem_path(component)              # disk-backed locations
server = session.get("Location", ftrack_api.symbol.SERVER_LOCATION_ID)
url = server.get_url(component)                              # download URL (ftrack.server)
availability = session.get_component_availability(component) # {location_id: 0-100}
```

## JavaScript

Only the `ftrack.server` location is available. In browsers `session.createComponent(file, { data: { version_id } })` uploads and attaches a file; in Node.js it stalls (no `XMLHttpRequest`), so use the `uploadFileNode()` helper in [examples/javascript/upload.js](examples/javascript/upload.js); `getComponentUrl` / `thumbnailUrl` build download and thumbnail URLs (they contain the API key). Encode for review with a raw operation:

```javascript
await session.call([{ action: "encode_media", component_id: componentId, version_id: versionId, keep_original: true }]);
```

Set a thumbnail with `session.update("AssetVersion", [versionId], { thumbnail_id: componentId })` (the component must be in `ftrack.server`). See the `javascript` topic.

## Rules

1. Put the `Asset` on the task's parent, link the task on the version, and reuse an existing `Asset` for new versions.
2. Thumbnails must be `FileComponent`s in `ftrack.server` with a valid image type.
3. `encode_media` is asynchronous: it returns a `Job`; outputs appear as components when it finishes.
4. Commit after creating versions and before adding components that reference them.
5. Don't hand-build server upload URLs; use `create_component`/`createComponent` (raw protocol in the reference if you must).

## Reference files

Files are under `${CLAUDE_SKILL_DIR}/topics/files`. Read only what the question needs.

| File | Read when |
|---|---|
| [references/locations.md](references/locations.md) | Creating/configuring locations, accessor/structure/transformer interfaces, custom cloud (S3) storage, per-project roots, location events |
| [references/review-and-media.md](references/review-and-media.md) | encode_media jobs, `ftr_meta` review metadata, thumbnails and URLs, raw upload protocol |
| [examples/python/publish.py](examples/python/publish.py) | Runnable publish: asset, version, file and sequence components, thumbnail, encode |
| [examples/python/custom_location.py](examples/python/custom_location.py) | Location plugin: disk location with project-based structure (based on ftrack-recipes) |
| [examples/javascript/upload.js](examples/javascript/upload.js) | Node.js: upload to a version, encode for review, set thumbnail |

More: https://github.com/ftrackhq/ftrack-recipes (plugins/per-project-location, events/customise-structure, actions/multi-site-location). Docs: https://developer.ftrack.com/publishing-files/publish, https://developer.ftrack.com/api-clients/python/locations/tutorial.
