# Blob Storage Asset Management

## Overview
This document describes the blob storage directory structure for managing static assets like logos, images, and documents.

## Directory Structure
```
assets/
├── .gitkeep                    # Ensures directory exists
├── logos/                      # Logo files
│   └── DBBACKUPLOGO.svg       # Backup management logo
├── images/                     # Image files (future)
├── documents/                  # Document files (future)
└── icons/                      # Icon files (future)
```

## Base URL
- **Production**: `https://kre9xoivjggj03of.public.blob.vercel-storage.com`
- **Development**: `https://[dev-blob-store].public.blob.vercel-storage.com`

## Usage

### In HTML
```html
<!-- Direct URL -->
<img src="https://kre9xoivjggj03of.public.blob.vercel-storage.com/assets/logos/DBBACKUPLOGO.svg" alt="Logo">

<!-- Using configuration (if available) -->
<img src="[blobAssets.logos.backupManagement]" alt="Logo">
```

### In JavaScript
```javascript
// Using the configuration file
const { getAssetUrl } = require('./config/blob-assets.js');
const logoUrl = getAssetUrl('logos', 'backupManagement');
```

## Benefits
1. **Centralized Management**: All assets in one place
2. **CDN Benefits**: Faster loading globally
3. **Version Control**: Can update assets without code deployment
4. **Scalability**: Easy to add new asset types
5. **Consistency**: Same structure as backup system

## Adding New Assets

### 1. Upload to Blob Storage
```javascript
const { put } = require('@vercel/blob');
const fs = require('fs');

const fileBuffer = fs.readFileSync('path/to/asset.png');
const { url } = await put('assets/images/new-asset.png', fileBuffer, {
  access: 'public',
  token: BLOB_TOKEN,
  addRandomSuffix: false
});
```

### 2. Update Configuration
Add the new asset to `config/blob-assets.js`:
```javascript
const blobAssets = {
  logos: {
    backupManagement: `${BLOB_BASE_URL}/assets/logos/DBBACKUPLOGO.svg`,
    newLogo: `${BLOB_BASE_URL}/assets/logos/new-logo.svg`, // Add here
  },
  // ...
};
```

### 3. Use in Application
```html
<img src="[blobAssets.logos.newLogo]" alt="New Logo">
```

## Best Practices
1. **Naming**: Use descriptive, lowercase names with hyphens
2. **Organization**: Group assets by type (logos, images, etc.)
3. **Optimization**: Compress images before uploading
4. **Backup**: Keep local copies of important assets
5. **Documentation**: Update this file when adding new asset types

## Migration from Local Assets
When moving assets from local storage to blob storage:

1. Upload asset to blob storage
2. Update configuration file
3. Update HTML/JavaScript references
4. Test thoroughly
5. Remove local asset file
6. Commit changes

## Security Considerations
- All assets are public (access: 'public')
- Use appropriate file types and sizes
- Consider implementing access controls for sensitive assets
- Monitor blob storage usage and costs
