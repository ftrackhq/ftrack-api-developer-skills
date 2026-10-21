# Review media, thumbnails and uploads

Sources: https://developer.ftrack.com/api-clients/examples/encode-media, /thumbnail, https://developer.ftrack.com/publishing-files/review, https://developer.ftrack.com/api/uploading-files.

## Encoding for web review

The server encodes video/images into web-playable components.

```python
import json

job = version.encode_media("/renders/hero.mov")          # attaches outputs to the version
job = session.encode_media("/renders/hero.mov")          # unattached
job = session.encode_media(component)                    # component must be in ftrack.server first
data = json.loads(job["data"])                            # source_component_id, keep_original, output[...]
for output in data["output"]:
    print(output["component_id"], output["format"])
```

`keep_original` (default `"auto"`) controls whether the source file is kept. The job runs asynchronously; re-query the `Job`'s `status` until it is `done` (or `failed`) before using the outputs. Download URL of an output: `session.get("Location", ftrack_api.symbol.SERVER_LOCATION_ID).get_url(component)`.

JavaScript (no helper): `session.call([{ action: "encode_media", component_id, version_id, keep_original: true }])`.

## Review without encoding

If you already have web-ready media, mark the component for review with `ftr_meta` metadata (JSON string) and/or the reserved component names:

| Media | Component name | `ftr_meta` value |
|---|---|---|
| Video | `ftrackreview-mp4` or `ftrackreview-webm` | `{"frameIn": 0, "frameOut": 150, "frameRate": 25, "width": 1280, "height": 720}` |
| Image | `ftrackreview-image` | `{"format": "image", "width": 1280, "height": 720}` |
| PDF | - | `{"format": "pdf"}` |

```python
component = version.create_component("/review/hero.mp4", data={"name": "ftrackreview-mp4"},
                                     location=session.get("Location", ftrack_api.symbol.SERVER_LOCATION_ID))
component["metadata"]["ftr_meta"] = json.dumps({"frameIn": 0, "frameOut": 150, "frameRate": 25,
                                                "width": 1280, "height": 720})
session.commit()
```

## Thumbnails

Any entity with `thumbnail_id` (Project, Task/Shot/..., AssetVersion, User) has `create_thumbnail(path, data=None)`, which uploads to `ftrack.server` and sets the thumbnail. Or set `entity["thumbnail_id"]` to an existing `FileComponent` in `ftrack.server` (e.g. reuse a version thumbnail on its shot).

```python
server = session.get("Location", ftrack_api.symbol.SERVER_LOCATION_ID)
server.get_thumbnail_url(component, size=300)
```

JavaScript: `session.thumbnailUrl(componentId, { size })`.

## Raw upload protocol (other languages)

1. Create a `FileComponent` (`name`, `file_type` like `.jpg`, `size`).
2. Call `get_upload_metadata` with `component_id`, `file_name`, `file_size`, optional `checksum` (base64 MD5) and `parts` for multipart. It returns a signed `url` and `headers`.
3. `PUT` the bytes to that URL with those headers (HTTP 200 = success).
4. Create a `ComponentLocation` with `component_id` and `location_id` `3a372bde-05bc-11e4-8908-20c9d081909b` (`ftrack.server`).

The Python and JavaScript clients do all of this inside `create_component` / `createComponent`.
