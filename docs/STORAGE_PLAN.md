# Storage Plan for EWA Payment System
## File Storage Strategy and Management

### Overview
This document outlines the storage strategy for the EWA payment system, including Zelle QR code images, file organization, and backup procedures.

### Current Storage Infrastructure

#### Existing Setup
- **Vercel Blob**: Primary file storage for uploads
- **Local Development**: File-based storage in `/public/` directory
- **CDN**: Vercel's edge network for global distribution
- **Backup**: Neon's Point-in-Time Recovery (PITR) for database

### Payment System Storage Requirements

#### Zelle QR Code Images
- **Format**: PNG (optimized for web)
- **Dimensions**: 640x640px (responsive variants: 320px, 480px, 640px)
- **Quality**: 90% compression
- **Metadata**: Stripped for security
- **Naming**: `{club-slug}-{timestamp}-{random}.png`

#### File Organization Structure
```
public/
├── zelle-standardized/           # Existing QR codes
│   ├── band.jpg
│   ├── baseball.jpg
│   ├── basketball-boys.jpg
│   ├── basketball-girls.jpg
│   ├── cheer.jpg
│   ├── choir.jpg
│   ├── cross-country.jpg
│   ├── drama.jpg
│   ├── fastpitch.jpg
│   ├── football.jpg
│   ├── lacrosse-boys.jpg
│   ├── lacrosse-girls.jpg
│   ├── orchestra.jpg
│   ├── soccer-boys.jpg
│   ├── soccer-girls.jpg
│   ├── swimming-boys.jpg
│   ├── swimming-girls.jpg
│   ├── tennis-boys.jpg
│   ├── tennis-girls.jpg
│   ├── track-field.jpg
│   ├── volleyball.jpg
│   └── wrestling.jpg
├── zelle-uploads/                # New upload directory
│   ├── {club-slug}-{timestamp}-{random}.png
│   └── variants/
│       ├── 320px/
│       ├── 480px/
│       └── 640px/
└── payment-assets/               # Other payment-related assets
    ├── stripe-buttons/
    └── payment-icons/
```

### Storage Implementation Strategy

#### 1. File Upload Pipeline

**Upload Process**
1. **Validation**: Check file type, size, and content
2. **Processing**: Resize, optimize, and strip metadata
3. **Naming**: Generate secure, deterministic filename
4. **Storage**: Save to Vercel Blob with proper metadata
5. **Database**: Update club record with file path
6. **CDN**: Automatic distribution via Vercel edge network

**Security Measures**
- **File Type Validation**: Only PNG, JPEG images allowed
- **Size Limits**: Maximum 1MB per file
- **Content Validation**: Magic byte verification
- **Metadata Stripping**: Remove EXIF and other metadata
- **Secure Naming**: Prevent path traversal attacks

#### 2. Image Processing Pipeline

**Sharp.js Configuration**
```javascript
const sharpConfig = {
  format: 'png',
  quality: 90,
  compressionLevel: 9,
  stripMetadata: true,
  resize: {
    width: 640,
    height: 640,
    fit: 'inside',
    withoutEnlargement: true
  }
};
```

**Responsive Image Generation**
- **320px**: Mobile devices
- **480px**: Tablets
- **640px**: Desktop and high-DPI displays

#### 3. File Access Control

**Public Access**
- QR code images are publicly accessible
- No authentication required for viewing
- Optimized for fast loading

**Admin Access**
- Upload functionality requires admin authentication
- File management through admin dashboard
- Audit logging for all file operations

### Vercel Blob Integration

#### Configuration
```javascript
// Environment variables
BLOB_READ_WRITE_TOKEN=<vercel-blob-token>
BLOB_STORE_ID=<store-id>

// Upload configuration
const uploadConfig = {
  maxFileSize: 1024 * 1024, // 1MB
  allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png'],
  storeId: process.env.BLOB_STORE_ID
};
```

#### Upload Process
```javascript
const { put } = require('@vercel/blob');

async function uploadQRCode(fileBuffer, filename) {
  const blob = await put(filename, fileBuffer, {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'image/png'
  });
  
  return blob.url;
}
```

### Database Storage Strategy

#### File Path Storage
- **Relative Paths**: Store only relative paths in database
- **CDN URLs**: Generate full URLs from relative paths
- **Versioning**: Include timestamp for cache busting

#### Database Schema
```sql
-- Payment fields in booster_clubs table
zelle_qr_code_path VARCHAR(500), -- Relative path to QR code
last_payment_update_at TIMESTAMP WITH TIME ZONE,
last_payment_update_by VARCHAR(100)
```

### Backup and Recovery

#### File Backup Strategy
- **Vercel Blob**: Automatic replication and redundancy
- **Database**: Neon PITR for file path records
- **Local Development**: Git-tracked files in `/public/`

#### Recovery Procedures
1. **File Loss**: Restore from Vercel Blob backup
2. **Database Loss**: Restore from Neon PITR
3. **Path Mismatch**: Reconcile database paths with actual files

### Performance Optimization

#### Caching Strategy
- **CDN Caching**: Vercel edge caching for static assets
- **Browser Caching**: Cache-Control headers for images
- **Database Caching**: Query optimization with proper indexes

#### Image Optimization
- **Compression**: WebP format with PNG fallback
- **Lazy Loading**: Load images on demand
- **Responsive Images**: Serve appropriate size for device

### Security Considerations

#### File Upload Security
- **Content Validation**: Verify file content matches declared type
- **Size Limits**: Prevent large file uploads
- **Path Traversal**: Prevent directory traversal attacks
- **Malware Scanning**: Consider virus scanning for uploads

#### Access Control
- **Public Read**: QR codes publicly accessible
- **Admin Write**: Only admins can upload/update
- **Audit Logging**: Track all file operations

### Monitoring and Maintenance

#### File Health Monitoring
- **Broken Links**: Monitor for 404 errors on QR codes
- **File Size**: Track file size growth
- **Access Patterns**: Monitor file access frequency

#### Maintenance Tasks
- **Cleanup**: Remove unused files
- **Optimization**: Re-optimize images periodically
- **Backup Verification**: Test backup and recovery procedures

### Implementation Plan

#### Phase 1: Infrastructure Setup
1. Configure Vercel Blob storage
2. Set up image processing pipeline
3. Create file organization structure
4. Implement security measures

#### Phase 2: Upload Functionality
1. Create admin upload interface
2. Implement file validation
3. Add image processing
4. Integrate with database

#### Phase 3: Public Access
1. Update payment page to use new storage
2. Implement responsive image serving
3. Add caching headers
4. Test performance

#### Phase 4: Monitoring and Maintenance
1. Set up monitoring alerts
2. Create maintenance procedures
3. Document backup/recovery processes
4. Train administrators

### Cost Considerations

#### Vercel Blob Pricing
- **Storage**: $0.10 per GB per month
- **Bandwidth**: $0.10 per GB
- **Operations**: $0.50 per million operations

#### Estimated Costs
- **Storage**: ~$1-5/month for QR codes
- **Bandwidth**: ~$5-20/month depending on usage
- **Total**: ~$10-30/month for payment system storage

### Success Metrics

#### Performance Metrics
- **Upload Speed**: < 5 seconds for 1MB file
- **Load Time**: < 2 seconds for QR code display
- **Availability**: 99.9% uptime

#### Quality Metrics
- **Image Quality**: Maintain visual quality after optimization
- **File Size**: < 100KB per QR code
- **Compatibility**: Work across all major browsers

#### Security Metrics
- **Zero Security Incidents**: No file upload vulnerabilities
- **Audit Coverage**: 100% of file operations logged
- **Access Control**: No unauthorized file access

### Conclusion

This storage plan provides a robust, secure, and scalable foundation for the EWA payment system's file storage needs. The combination of Vercel Blob for cloud storage, Sharp.js for image processing, and proper security measures ensures reliable and secure file management.

The plan prioritizes security, performance, and maintainability while keeping costs reasonable. Regular monitoring and maintenance will ensure the storage system continues to meet the needs of the payment system as it grows.

