---
name: ftrack-files
description: ftrack file operations - upload, download, components, locations, thumbnails
trigger: upload, download, component, file, asset version, location, storage
---

# ftrack File Operations Expert

Master file upload, download, component management, and custom storage locations in ftrack.

## Quick Start

Detect user's language:
- **Python**: `Component`, `Location`, `ftrack_api.structure`
- **JavaScript**: `session.upload()`, `FileComponent`, browser/Node.js

---

## Core Concepts

### Components
Files attached to asset versions. Types:
- `FileComponent` - Single file
- `SequenceComponent` - Image sequence
- `ContainerComponent` - Multiple files

### Locations
Storage backends:
- `ftrack.server` - ftrack cloud storage
- `ftrack.unmanaged` - External/unmanaged
- Custom locations (S3, disk, etc.)

### Asset Versions
Container for components representing a published version.

---

## Python File Operations

### Upload File
```python
import ftrack_api

session = ftrack_api.Session()

# Create asset version
asset = session.query('Asset where id is "{0}"'.format(asset_id)).one()
asset_version = session.create('AssetVersion', {
    'asset': asset,
    'comment': 'New version'
})

# Create component
component = asset_version.create_component(
    path='/path/to/file.ma',
    data={'name': 'main'},
    location=session.query('Location where name is "ftrack.server"').one()
)

session.commit()
print(f"Uploaded: {component['name']}")
```

### Download File
```python
# Get component
component = session.query(
    'Component where version.asset.name is "Character" '
    'and version.version is 5'
).first()

# Get location
location = session.query('Location where name is "ftrack.server"').one()

# Download
local_path = location.get_filesystem_path(component)
print(f"File available at: {local_path}")

# Or explicit download
import tempfile
download_path = os.path.join(tempfile.gettempdir(), component['name'])
location.get_component(component, download_path)
```

### Sequence Upload
```python
# Image sequence
sequence_path = '/path/to/sequence/render.%04d.exr'
padding = 4

component = asset_version.create_component(
    path=sequence_path,
    data={
        'name': 'render',
        'frame_padding': padding,
        'frame_start': 1001,
        'frame_end': 1100
    },
    location=location
)

session.commit()
```

### Thumbnail Upload
```python
# Upload thumbnail for asset version
asset_version.create_thumbnail('/path/to/thumbnail.jpg')
session.commit()

# Or use existing component as thumbnail
thumbnail_component = asset_version.create_component(
    path='/path/to/thumbnail.jpg',
    data={'name': 'thumbnail'}
)
asset_version['thumbnail'] = thumbnail_component
session.commit()
```

---

## JavaScript File Operations

### Browser Upload
```javascript
import ftrack from '@ftrack/api';

const session = new ftrack.Session(
  "https://company.ftrackapp.com",
  "user@example.com",
  "api-key"
);

await session.initializing;

// HTML: <input type="file" id="fileInput">
const fileInput = document.getElementById('fileInput');
const file = fileInput.files[0];

// Create asset version
const assetVersion = await session.create('AssetVersion', {
  asset_id: assetId,
  comment: 'Uploaded from web'
});

// Create component
const component = await session.create('FileComponent', {
  name: file.name,
  file_type: file.type,
  size: file.size,
  version_id: assetVersion.id
});

// Upload file
await session.upload(component.id, file);

console.log('Upload complete:', component.name);
```

### Progress Tracking
```javascript
// Upload with progress callback
async function uploadWithProgress(file, assetVersionId) {
  const component = await session.create('FileComponent', {
    name: file.name,
    file_type: file.type,
    size: file.size,
    version_id: assetVersionId
  });
  
  await session.upload(component.id, file, {
    onProgress: (progress) => {
      const percent = Math.round((progress.loaded / progress.total) * 100);
      console.log(`Upload progress: ${percent}%`);
      updateProgressBar(percent);
    }
  });
  
  return component;
}
```

### Download File
```javascript
// Get component URL
const component = await session.get('FileComponent', componentId);
const downloadUrl = await session.getDownloadUrl(component.id);

// Download in browser
window.open(downloadUrl, '_blank');

// Or fetch and process
const response = await fetch(downloadUrl);
const blob = await response.blob();
const url = URL.createObjectURL(blob);

// Create download link
const link = document.createElement('a');
link.href = url;
link.download = component.name;
link.click();

URL.revokeObjectURL(url);
```

### Node.js Upload
```javascript
import fs from 'fs';
import { Blob } from 'buffer';

// Read file
const buffer = fs.readFileSync('/path/to/file.ma');
const blob = new Blob([buffer]);

// Create component
const component = await session.create('FileComponent', {
  name: 'file.ma',
  size: buffer.length,
  version_id: assetVersionId
});

// Upload
await session.upload(component.id, blob);
```

### Thumbnail Operations
```javascript
// Get thumbnail URL
const assetVersion = await session.get('AssetVersion', versionId);
if (assetVersion.thumbnail_id) {
  const thumbnailUrl = await session.getThumbnailUrl(
    assetVersion.thumbnail_id,
    { size: 300 }  // Request specific size
  );
  
  // Display in img tag
  imageElement.src = thumbnailUrl;
}

// Upload thumbnail
const thumbnailFile = document.getElementById('thumbInput').files[0];
const thumbComponent = await session.create('FileComponent', {
  name: thumbnailFile.name,
  size: thumbnailFile.size,
  version_id: assetVersionId
});

await session.upload(thumbComponent.id, thumbnailFile);

// Set as thumbnail
await session.update('AssetVersion', assetVersionId, {
  thumbnail_id: thumbComponent.id
});
```

---

## Custom Locations (Python)

### S3 Location
```python
import boto3
import ftrack_api
import ftrack_api.accessor.disk
import ftrack_api.structure.standard

class S3Accessor(ftrack_api.accessor.base.Accessor):
    """S3 storage accessor."""
    
    def __init__(self, bucket_name, **kwargs):
        super().__init__(**kwargs)
        self.s3 = boto3.client('s3')
        self.bucket = bucket_name
    
    def get_container(self, resource_identifier):
        """Get container (bucket) for resource."""
        return self.bucket
    
    def get_url(self, resource_identifier):
        """Generate presigned URL."""
        return self.s3.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': self.bucket,
                'Key': resource_identifier
            },
            ExpiresIn=3600
        )
    
    def is_file(self, resource_identifier):
        """Check if resource exists."""
        try:
            self.s3.head_object(Bucket=self.bucket, Key=resource_identifier)
            return True
        except:
            return False
    
    def is_container(self, resource_identifier):
        """Check if container exists."""
        return True  # Bucket level
    
    def is_sequence(self, resource_identifier):
        """Check if resource is sequence."""
        return False
    
    def exists(self, resource_identifier):
        """Check if resource exists."""
        return self.is_file(resource_identifier)
    
    def open(self, resource_identifier, mode='rb'):
        """Open resource for reading."""
        obj = self.s3.get_object(Bucket=self.bucket, Key=resource_identifier)
        return obj['Body']
    
    def write(self, resource_identifier, data):
        """Write data to resource."""
        self.s3.put_object(
            Bucket=self.bucket,
            Key=resource_identifier,
            Body=data
        )
    
    def remove(self, resource_identifier):
        """Remove resource."""
        self.s3.delete_object(Bucket=self.bucket, Key=resource_identifier)


class S3Location(ftrack_api.entity.location.Location):
    """S3-backed location."""
    
    def __init__(self, session, bucket_name, **kwargs):
        super().__init__(session, **kwargs)
        self.accessor = S3Accessor(bucket_name)
        self.structure = ftrack_api.structure.standard.StandardStructure()
        self.priority = 100


def register_s3_location(session, name='custom.s3'):
    """Register S3 location."""
    bucket_name = 'my-ftrack-bucket'
    
    # Create or get location
    try:
        location = session.query(
            'Location where name is "{0}"'.format(name)
        ).one()
    except ftrack_api.exception.NoResultFoundError:
        location = session.create('Location', {
            'name': name
        })
        session.commit()
    
    # Configure with S3 accessor
    location.accessor = S3Accessor(bucket_name)
    location.structure = ftrack_api.structure.standard.StandardStructure()
    location.priority = 100
    
    return location


# Usage
session = ftrack_api.Session()
s3_location = register_s3_location(session)

# Upload to S3
component = asset_version.create_component(
    path='/path/to/file.ma',
    data={'name': 'main'},
    location=s3_location
)
session.commit()
```

### Disk Location
```python
import ftrack_api.accessor.disk
import ftrack_api.structure.standard

def register_disk_location(session, name='custom.disk', root='/mnt/storage'):
    """Register custom disk location."""
    
    # Create or get location
    try:
        location = session.query(
            'Location where name is "{0}"'.format(name)
        ).one()
    except ftrack_api.exception.NoResultFoundError:
        location = session.create('Location', {
            'name': name
        })
        session.commit()
    
    # Configure with disk accessor
    location.accessor = ftrack_api.accessor.disk.DiskAccessor(prefix=root)
    location.structure = ftrack_api.structure.standard.StandardStructure()
    location.priority = 50
    
    return location


# Usage
disk_location = register_disk_location(session)

# Files stored at: /mnt/storage/{project}/{asset}/v{version}/filename
```

---

## Resource Transformers (Python)

```python
class CustomStructure(ftrack_api.structure.base.Structure):
    """Custom file path structure."""
    
    def get_resource_identifier(self, entity, context=None):
        """Generate file path for component.
        
        Returns path like:
        {project}/{entity_type}/{entity_name}/v{version}/{component_name}
        """
        version = entity.get('version')
        asset = version.get('asset')
        project = asset.get('parent').get('project')
        
        parts = [
            project['name'],
            asset['type']['name'],
            asset['name'],
            f"v{version['version']:03d}",
            entity['name']
        ]
        
        return '/'.join(parts)


# Register custom structure
location.structure = CustomStructure()
```

---

## Component Queries

### Find Components
```python
# By asset name
components = session.query(
    'Component where version.asset.name is "Character"'
).all()

# Latest version
latest = session.query(
    'Component where version.asset.name is "Character" '
    'and version.version is latest'
).first()

# By version number
v5_components = session.query(
    'Component where version.asset.name is "Character" '
    'and version.version is 5'
).all()

# By component name
main_component = session.query(
    'Component where version.asset.name is "Character" '
    'and name is "main"'
).first()
```

### Component Metadata
```python
component = session.query('Component where id is "{0}"'.format(cid)).one()

print(f"Name: {component['name']}")
print(f"Size: {component['size']} bytes")
print(f"Type: {component['file_type']}")
print(f"Version: {component['version']['version']}")
print(f"Asset: {component['version']['asset']['name']}")
```

---

## Best Practices

1. **Use Locations**: Always specify target location
2. **Validate Before Upload**: Check file exists and size
3. **Error Handling**: Wrap uploads in try/except
4. **Progress Feedback**: Show upload progress to users
5. **Cleanup**: Remove temporary files after upload
6. **Thumbnails**: Always provide thumbnails for visual assets
7. **Naming**: Use consistent component naming (main, proxy, thumbnail)
8. **Transactions**: Commit asset version and components together

---

## Common Patterns

### Batch Upload
```python
def batch_upload(session, file_paths, asset_version):
    """Upload multiple files as components."""
    location = session.query('Location where name is "ftrack.server"').one()
    
    components = []
    for file_path in file_paths:
        if not os.path.exists(file_path):
            print(f"Skipping missing file: {file_path}")
            continue
        
        try:
            component = asset_version.create_component(
                path=file_path,
                data={'name': os.path.basename(file_path)},
                location=location
            )
            components.append(component)
        except Exception as e:
            print(f"Error uploading {file_path}: {e}")
    
    session.commit()
    return components
```

### Check File Availability
```python
def is_component_available(session, component, location_name='ftrack.server'):
    """Check if component is available in location."""
    location = session.query(
        'Location where name is "{0}"'.format(location_name)
    ).one()
    
    try:
        path = location.get_filesystem_path(component)
        return os.path.exists(path)
    except:
        return False
```

### Sync Locations
```python
def sync_component(session, component, source_location, target_location):
    """Copy component between locations."""
    if component not in target_location:
        # Get component data from source
        data = source_location.get_component(component)
        
        # Add to target
        target_location.add_component(component, data)
        
        print(f"Synced {component['name']} to {target_location['name']}")
```

---

## Official Resources

- **Components**: https://ftrack-python-api.readthedocs.io/en/stable/working_with_components.html
- **Locations**: https://ftrack-python-api.readthedocs.io/en/stable/locations/index.html
- **File Upload**: https://developer.ftrack.com/api-clients/javascript/upload.html
