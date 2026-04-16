/**
 * ftrack JavaScript API - File Operations Examples
 *
 * Demonstrates file upload, download, and component management
 * for both browser and Node.js environments.
 */

import ftrack from '@ftrack/api';
import fs from 'fs';
import path from 'path';

// ============================================================================
// File Upload - Browser
// ============================================================================

/**
 * Upload file from browser file input
 */
async function uploadFileBrowser(session, file, assetVersionId) {
  try {
    // Create file component
    const component = await session.create('FileComponent', {
      name: file.name,
      file_type: file.type || 'application/octet-stream',
      size: file.size,
      version_id: assetVersionId
    });

    console.log(`✓ Created component: ${component.id}`);

    // Upload file data
    await session.upload(component.id, file);

    console.log(`✓ Uploaded file: ${file.name}`);

    return component;

  } catch (error) {
    console.error('✗ Upload failed:', error.message);
    throw error;
  }
}

/**
 * Upload with progress tracking (browser)
 */
async function uploadWithProgress(session, file, assetVersionId, onProgress) {
  const component = await session.create('FileComponent', {
    name: file.name,
    file_type: file.type,
    size: file.size,
    version_id: assetVersionId
  });

  // Upload with progress callback
  await session.upload(component.id, file, {
    onProgress: (progress) => {
      const percent = (progress.loaded / progress.total) * 100;
      console.log(`Upload progress: ${percent.toFixed(1)}%`);

      if (onProgress) {
        onProgress(percent, progress);
      }
    }
  });

  console.log(`✓ Upload complete: ${file.name}`);

  return component;
}

// ============================================================================
// File Upload - Node.js
// ============================================================================

/**
 * Upload file from filesystem (Node.js)
 */
async function uploadFileNode(session, filePath, assetVersionId) {
  try {
    // Read file stats
    const stats = fs.statSync(filePath);
    const fileName = path.basename(filePath);

    // Create component
    const component = await session.create('FileComponent', {
      name: fileName,
      file_type: getMimeType(fileName),
      size: stats.size,
      version_id: assetVersionId
    });

    // Read file and upload
    const fileBuffer = fs.readFileSync(filePath);
    const blob = new Blob([fileBuffer]);

    await session.upload(component.id, blob);

    console.log(`✓ Uploaded: ${fileName} (${stats.size} bytes)`);

    return component;

  } catch (error) {
    console.error('✗ Upload failed:', error.message);
    throw error;
  }
}

/**
 * Upload multiple files
 */
async function uploadMultipleFiles(session, filePaths, assetVersionId) {
  const results = [];

  for (const filePath of filePaths) {
    try {
      const component = await uploadFileNode(session, filePath, assetVersionId);
      results.push({ success: true, filePath, component });
    } catch (error) {
      results.push({ success: false, filePath, error: error.message });
    }
  }

  const successful = results.filter(r => r.success).length;
  console.log(`✓ Uploaded ${successful}/${filePaths.length} files`);

  return results;
}

// ============================================================================
// File Download
// ============================================================================

/**
 * Get component download URL
 */
async function getDownloadUrl(session, componentId) {
  try {
    const response = await session.query(
      `select id, name, component_locations.location.name, ` +
      `component_locations.resource_identifier ` +
      `from FileComponent where id is "${componentId}"`
    );

    const component = response.data[0];

    if (!component) {
      throw new Error(`Component not found: ${componentId}`);
    }

    // Build download URL (depends on location)
    const location = component.component_locations[0];
    const url = `${session.serverUrl}/component/${componentId}/${component.name}`;

    return url;

  } catch (error) {
    console.error('✗ Failed to get download URL:', error.message);
    throw error;
  }
}

/**
 * Download file (Node.js)
 */
async function downloadFile(session, componentId, outputPath) {
  try {
    const url = await getDownloadUrl(session, componentId);

    // Fetch file data
    const response = await fetch(url, {
      headers: {
        'ftrack-api-key': session.apiKey,
        'ftrack-user': session.apiUser
      }
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    // Write to file
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(outputPath, Buffer.from(buffer));

    console.log(`✓ Downloaded to: ${outputPath}`);

  } catch (error) {
    console.error('✗ Download failed:', error.message);
    throw error;
  }
}

/**
 * Download file (Browser)
 */
async function downloadFileBrowser(session, componentId, fileName) {
  const url = await getDownloadUrl(session, componentId);

  // Create download link and trigger
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  console.log(`✓ Download started: ${fileName}`);
}

// ============================================================================
// Asset Version Management
// ============================================================================

/**
 * Create asset version with file
 */
async function createAssetVersionWithFile(session, assetId, file, versionNumber = null) {
  try {
    // Get asset
    const asset = await session.get('Asset', assetId);

    // Determine version number
    if (!versionNumber) {
      const versions = await session.query(
        `select version from AssetVersion where asset_id is "${assetId}" ` +
        `order by version desc limit 1`
      );
      versionNumber = versions.data.length > 0 ? versions.data[0].version + 1 : 1;
    }

    // Create asset version
    const assetVersion = await session.create('AssetVersion', {
      asset_id: assetId,
      version: versionNumber,
      comment: 'Uploaded via API'
    });

    console.log(`✓ Created asset version ${versionNumber}`);

    // Upload file
    let component;
    if (typeof file === 'string') {
      // Node.js: file path
      component = await uploadFileNode(session, file, assetVersion.id);
    } else {
      // Browser: File object
      component = await uploadFileBrowser(session, file, assetVersion.id);
    }

    return { assetVersion, component };

  } catch (error) {
    console.error('✗ Failed to create asset version:', error.message);
    throw error;
  }
}

/**
 * Get latest asset version
 */
async function getLatestAssetVersion(session, assetId) {
  const response = await session.query(
    `select id, version, comment, date from AssetVersion ` +
    `where asset_id is "${assetId}" ` +
    `order by version desc limit 1`
  );

  return response.data[0] || null;
}

/**
 * List all components for asset version
 */
async function listComponents(session, assetVersionId) {
  const response = await session.query(
    `select id, name, file_type, size from FileComponent ` +
    `where version_id is "${assetVersionId}"`
  );

  console.log(`Found ${response.data.length} components:`);
  response.data.forEach(comp => {
    console.log(`  - ${comp.name} (${comp.file_type}, ${formatBytes(comp.size)})`);
  });

  return response.data;
}

// ============================================================================
// Thumbnail Management
// ============================================================================

/**
 * Upload thumbnail for asset version
 */
async function uploadThumbnail(session, assetVersionId, thumbnailFile) {
  try {
    // Create thumbnail component
    const component = await session.create('FileComponent', {
      name: 'thumbnail',
      file_type: 'image/jpeg',
      size: thumbnailFile.size || fs.statSync(thumbnailFile).size,
      version_id: assetVersionId
    });

    // Upload thumbnail
    if (typeof thumbnailFile === 'string') {
      const buffer = fs.readFileSync(thumbnailFile);
      const blob = new Blob([buffer], { type: 'image/jpeg' });
      await session.upload(component.id, blob);
    } else {
      await session.upload(component.id, thumbnailFile);
    }

    // Set as thumbnail
    await session.update('AssetVersion', assetVersionId, {
      thumbnail_id: component.id
    });

    console.log(`✓ Thumbnail uploaded and set`);

    return component;

  } catch (error) {
    console.error('✗ Thumbnail upload failed:', error.message);
    throw error;
  }
}

/**
 * Get thumbnail URL
 */
async function getThumbnailUrl(session, assetVersionId) {
  const response = await session.query(
    `select thumbnail_id from AssetVersion where id is "${assetVersionId}"`
  );

  const assetVersion = response.data[0];

  if (!assetVersion?.thumbnail_id) {
    return null;
  }

  return await getDownloadUrl(session, assetVersion.thumbnail_id);
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get MIME type from filename
 */
function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.pdf': 'application/pdf',
    '.zip': 'application/zip',
    '.json': 'application/json'
  };

  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Format bytes to human-readable size
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// ============================================================================
// Usage Examples
// ============================================================================

async function main() {
  const session = new ftrack.Session(
    process.env.FTRACK_SERVER,
    process.env.FTRACK_API_USER,
    process.env.FTRACK_API_KEY
  );

  await session.initializing;

  try {
    const assetVersionId = 'your-asset-version-id';

    // Example 1: Upload file (Node.js)
    console.log('\n=== Example 1: Upload File ===');
    const filePath = './test-file.jpg';
    // const component = await uploadFileNode(session, filePath, assetVersionId);

    // Example 2: List components
    console.log('\n=== Example 2: List Components ===');
    // await listComponents(session, assetVersionId);

    // Example 3: Download file
    console.log('\n=== Example 3: Download File ===');
    // await downloadFile(session, component.id, './downloaded-file.jpg');

    console.log('\n✓ All operations completed');

  } finally {
    session.close();
  }
}

// ============================================================================
// Export
// ============================================================================

export {
  uploadFileBrowser,
  uploadWithProgress,
  uploadFileNode,
  uploadMultipleFiles,
  getDownloadUrl,
  downloadFile,
  downloadFileBrowser,
  createAssetVersionWithFile,
  getLatestAssetVersion,
  listComponents,
  uploadThumbnail,
  getThumbnailUrl,
  getMimeType,
  formatBytes
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
