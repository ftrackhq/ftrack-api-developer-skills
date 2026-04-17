# ftrack File Operations

Focused skill for file upload, download, and storage management in ftrack.

## What This Skill Covers

- File upload (single files, sequences)
- File download
- Component management
- Custom locations (S3, disk)
- Thumbnail operations
- Resource transformers
- Component queries

## When to Use

Invoke this skill when working with:
- Uploading files to ftrack
- Downloading components
- Managing asset versions
- Implementing custom storage backends
- Working with image sequences
- Generating/uploading thumbnails
- File path organization

## Quick Example

### Python
```python
# Upload file
component = asset_version.create_component(
    path='/path/to/file.ma',
    data={'name': 'main'},
    location=location
)
session.commit()
```

### JavaScript (Browser)
```javascript
// Upload file
const fileInput = document.getElementById('fileInput');
const file = fileInput.files[0];

const component = await session.create('FileComponent', {
  name: file.name,
  size: file.size,
  version_id: assetVersionId
});

await session.upload(component.id, file);
```

## Invocation

```bash
/ftrack-files
```

Or automatically via `/ftrack-api-developer` when file-related keywords detected.

## Token Usage

~500 tokens (vs 3,500 for full ftrack skill)

## Related Skills

- `/ftrack-query` - For finding components
- `/ftrack-session` - For managing uploads
