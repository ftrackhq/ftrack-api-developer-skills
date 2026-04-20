---
name: ftrack-files
description: ftrack file operations - upload, download, components, locations, thumbnails
---

TRIGGER when: code uses `create_component()`, `session.upload()`, `Location`, `FileComponent`, or `AssetVersion` with files; user asks about uploading files to ftrack, downloading components, managing locations, S3 storage, or thumbnails.
SKIP: general file operations without ftrack, OS file handling, non-ftrack storage systems.

# ftrack File Operations Expert

**Strategy**: Quick reference first → Fetch online docs if needed → Load local examples as fallback

## Language Detection
- **Python**: `create_component()`, `Location`, `ftrack_api.structure`
- **JavaScript**: `session.upload()`, browser `File` API, Node.js `fs`

---

## Quick Reference (Use First - 70% of Queries)

### Core Principles
✓ **Upload components to locations**: `AssetVersion.create_component()`
✓ **Download from locations**: `Location.get_component()`
✓ **Use appropriate location**: `ftrack.server` for cloud, custom for S3/disk
✗ Avoid uploading without specifying location
✗ Never assume default location structure

### Core Concepts
- **Components**: Files attached to asset versions (FileComponent, SequenceComponent)
- **Locations**: Storage backends (ftrack.server, ftrack.unmanaged, custom S3/disk)
- **Asset Versions**: Container for components

### Python Quick Patterns

**Upload File**
```python
import ftrack_api
session = ftrack_api.Session()

# Get location
location = session.query('Location where name is "ftrack.server"').one()

# Create component
component = asset_version.create_component(
    path='/path/to/file.ma',
    data={'name': 'main'},
    location=location
)
session.commit()
```

**Download File**
```python
# Query component
component = session.query('Component where id is "{}"'.format(comp_id)).one()

# Get location and download
location = session.query('Location where name is "ftrack.server"').one()
local_path = location.get_component(component, '/download/path/')
```

**Upload Image Sequence**
```python
component = asset_version.create_component(
    path='/path/to/render.%04d.exr',
    data={
        'name': 'render',
        'frame_padding': 4,
        'frame_start': 1001,
        'frame_end': 1100
    },
    location=location
)
```

**Upload Thumbnail**
```python
asset_version.create_thumbnail('/path/to/thumb.jpg')
session.commit()
```

**List Components**
```python
components = session.query(
    'Component where version.id is "{}"'.format(version_id)
).all()
```

### JavaScript Quick Patterns

**Browser Upload**
```javascript
// HTML: <input type="file" id="fileInput">
const file = document.getElementById('fileInput').files[0];

// Create component
const component = await session.create('FileComponent', {
  name: file.name,
  file_type: file.type,
  size: file.size,
  version_id: assetVersionId
});

// Upload
await session.upload(component.id, file);
```

**Upload with Progress**
```javascript
await session.upload(component.id, file, {
  onProgress: (progress) => {
    const percent = Math.round((progress.loaded / progress.total) * 100);
    console.log(`Progress: ${percent}%`);
  }
});
```

**Download File (Browser)**
```javascript
const downloadUrl = await session.getDownloadUrl(componentId);
window.open(downloadUrl, '_blank');
```

**Node.js Upload**
```javascript
import fs from 'fs';
import { Blob } from 'buffer';

const buffer = fs.readFileSync('/path/to/file.ma');
const blob = new Blob([buffer]);

const component = await session.create('FileComponent', {
  name: 'file.ma',
  size: buffer.length,
  version_id: assetVersionId
});

await session.upload(component.id, blob);
```

**Get Thumbnail**
```javascript
const thumbnailUrl = await session.getThumbnailUrl(
  assetVersion.thumbnail_id,
  { size: 300 }
);
imageElement.src = thumbnailUrl;
```

**→ This quick reference handles most file operations. For custom locations or advanced patterns, continue below.**

---

## Online Resources (Fetch for Detailed Info)

### When to Fetch
- User asks for "all location types" or "complete component API"
- Needs custom S3 location setup
- Questions about advanced file handling patterns
- Storage accessor or resource transformer details
- Official component schema

### Python Locations Documentation
**URL**: `https://developer.ftrack.com/api-clients/python/locations.html`
**Fetch Prompt**:
```
Extract ftrack Python location and component patterns. Include:
- Location types and configuration
- Component creation and management
- Custom location setup (S3, disk)
- Storage accessor patterns
- Resource transformers for file paths
- Availability tracking
- Performance optimization
Format as markdown with code examples.
```

### JavaScript File Upload Documentation
**URL**: `https://developer.ftrack.com/api-clients/javascript/uploading.html`
**Fetch Prompt**:
```
Extract ftrack JavaScript file upload patterns. Include:
- Browser file upload with File API
- Node.js file operations
- Progress tracking implementation
- Error handling patterns
- Thumbnail operations
- Component querying
Format as markdown with async/await examples.
```

### Component Schema Reference
**URL**: `https://developer.ftrack.com/ftrack/api/components.html`
**Fetch Prompt**:
```
Extract ftrack component types and schema. Include:
- FileComponent vs SequenceComponent vs ContainerComponent
- Component attributes and metadata
- Relationship to AssetVersions and Locations
- Component querying patterns
Format as markdown.
```

### WebFetch Decision Tree

**IMPORTANT**: Actively check user query for trigger phrases, then use WebFetch.

**Trigger detection** (check user's exact query):
```python
trigger_phrases = [
    "show all location types",
    "complete component API",
    "custom location patterns",
    "S3 location setup",
    "storage accessor",
    "resource transformer",
    "all component types",
    "official file docs"
]
```

**Action when trigger detected:**
1. **Detect language**: Python (`ftrack_api`) or JavaScript (`@ftrack/api`)
2. **Detect topic**: Locations, uploads, downloads, or components
3. **Use WebFetch** with appropriate URL above
4. **If fetch succeeds**: Return formatted docs to user
5. **If fetch fails**: Gracefully fallback to local example (see "Local Examples" section)

**WebFetch Example:**
```markdown
# User asks: "Show me how to setup custom S3 location in Python"
# Trigger detected: "custom location"
# Language detected: "Python"

Use WebFetch tool:
WebFetch(
  url="https://developer.ftrack.com/api-clients/python/locations.html",
  prompt="Extract custom S3 location setup patterns for ftrack Python API. Include location class definition, storage accessor, S3 configuration, and registration. Format as markdown with complete code example."
)

If successful: Present docs
If fails: Load ./examples/python/custom_location_s3.py
```

---

## Local Examples (Fallback - Load Only When Needed)

### When to Load Local
1. WebFetch fails or times out
2. User explicitly requests "show me the example file" or "local examples"
3. Need complete runnable custom location implementation
4. Advanced S3/disk location patterns not in quick reference

### Available Local Files

**Python S3 Location Example**
- **File**: `.././examples/python/custom_location_s3.py`
- **Contains**: Complete custom S3 location implementation with storage accessor, resource transformers
- **Load when**: User needs full custom S3 location setup, advanced patterns
- **Size**: ~300 lines

**Python Resource Transformers Example**
- **File**: `.././examples/python/resource_transformers.py`
- **Contains**: Custom path transformers, file organization patterns
- **Load when**: User needs custom file path generation
- **Size**: ~200 lines

**JavaScript File Operations Example**
- **File**: `.././examples/javascript/file-operations.js`
- **Contains**: Browser upload, Node.js operations, progress tracking, error handling
- **Load when**: User needs production JavaScript file handling patterns
- **Size**: ~400 lines

### How to Load
```markdown
Read(file_path="C:\\Users\\loren\\Documents\\devel\\solution delivery\\ftrack\\skills\\skills\\ftrack-api-developer\\examples\\python\\custom_location_s3.py")

Then extract relevant sections for the user's specific question.
```

---

## Decision Tree

```
User asks about ftrack file operations
  │
  ├─ Basic upload/download (how do I...)?
  │   └→ Use Quick Reference above ✓
  │
  ├─ Thumbnail operations?
  │   └→ Use Quick Reference above ✓
  │
  ├─ Image sequence upload?
  │   └→ Use Quick Reference above ✓
  │
  ├─ Custom S3 or disk location?
  │   ├→ WebFetch locations documentation
  │   └→ If fails: Load custom_location_s3.py
  │
  ├─ Storage accessor or resource transformer?
  │   ├→ WebFetch locations documentation
  │   └→ If fails: Load local examples
  │
  ├─ Complete component API reference?
  │   ├→ WebFetch component schema docs
  │   └→ If fails: Use quick reference + guidance
  │
  └─ Production-ready example code?
      └→ Load specific example file directly
```

---

## Response Strategy

### For Simple Questions
1. Answer using Quick Reference patterns
2. Show appropriate code (Python or JavaScript)
3. Keep concise (1-2 examples max)
4. Cite: "From file operations quick reference"

### For Detailed Questions
1. Start with Quick Reference context
2. If trigger detected: WebFetch relevant documentation
3. Provide specific configuration examples
4. Cite: "From [URL]"
5. If fetch fails: Load local example + cite filename

### For Advanced Questions (Custom Locations)
1. Assess complexity (S3, custom transformers, etc.)
2. WebFetch locations documentation first
3. If insufficient or fails: Load local example files
4. Provide production-ready code with explanation
5. Cite all sources used

### Progressive Disclosure
- Start minimal (quick reference - upload/download pattern)
- Offer more: "Need custom S3 location setup? I can fetch detailed docs"
- Load comprehensive examples only if requested or if WebFetch fails

---

## Custom Location Snippet (Quick Reference Extension)

**Python Custom S3 Location (Minimal)**
```python
import ftrack_api.structure.standard
import ftrack_api.accessor.disk

class S3Location(ftrack_api.entity.location.Location):
    """Custom S3-backed location."""
    
    def __init__(self, session, **kwargs):
        super(S3Location, self).__init__(session, **kwargs)
        
        # Use S3 accessor (simplified - see full example for boto3 integration)
        self.accessor = CustomS3Accessor(bucket='your-bucket')
        
        # Standard structure
        self.structure = ftrack_api.structure.standard.StandardStructure()

# Register location
def configure_location(session):
    location = session.query('Location where name is "my-s3-location"').one()
    location.__class__ = S3Location
```

**For complete S3 setup**: Request WebFetch or load `custom_location_s3.py`

---

## Common Patterns

### Error Handling
```python
# Python
try:
    component = asset_version.create_component(path, location=location)
    session.commit()
except Exception as e:
    print(f"Upload failed: {e}")
    session.rollback()
```

```javascript
// JavaScript
try {
  await session.upload(component.id, file);
} catch (error) {
  console.error('Upload failed:', error);
  throw error;
}
```

### Query Components by Type
```python
# Python
file_components = session.query(
    'FileComponent where version.id is "{}"'.format(version_id)
).all()

sequence_components = session.query(
    'SequenceComponent where version.id is "{}"'.format(version_id)
).all()
```

### Check Component Availability
```python
# Python
location = session.query('Location where name is "ftrack.server"').one()
is_available = location.get_component_availability(component)
print(f"Available: {is_available}")
```

---

## Token Efficiency

**Quick Reference**: ~500 tokens (handles 70%+ of queries)
**With WebFetch**: ~1,300 tokens (handles complex scenarios)
**With Local Files**: ~2,100 tokens (complete implementations)

**Target**: Use quick reference first, only fetch/load when user needs detailed patterns or custom locations.
