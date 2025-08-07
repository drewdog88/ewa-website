# 🔒 EWA Website Backup System

## Overview

The EWA Website backup system provides comprehensive backup and restore capabilities for both the Neon PostgreSQL database and Vercel Blob storage. The system includes automated nightly backups, manual backup operations, and a complete web interface for management.

## Features

### ✅ **Automated Backups**
- **Nightly backups** at 2:00 AM automatically
- **Database backup**: Complete SQL dump with schema and data
- **Blob backup**: All Vercel Blob files compressed into ZIP archives
- **Automatic cleanup**: Removes backups older than 30 days

### ✅ **Manual Operations**
- **On-demand backups**: Perform backups anytime via API or web interface
- **Backup status monitoring**: Real-time status of backup operations
- **Backup history**: Complete history of all backups with metadata
- **Download capabilities**: Download backup files for external storage

### ✅ **Restore Capabilities**
- **Database restore**: Restore database from any backup point
- **Selective restore**: Choose specific backup timestamps
- **Safety confirmations**: Multiple confirmation dialogs for destructive operations

### ✅ **Web Interface**
- **Admin dashboard**: Complete backup management interface
- **Real-time status**: Live monitoring of backup operations
- **Progress tracking**: Visual progress indicators for long operations
- **Alert system**: Success/error notifications for all operations

## System Architecture

### Backup Components

1. **BackupManager Class** (`backup/backup-manager.js`)
   - Core backup logic and orchestration
   - Database and blob backup operations
   - Scheduled backup management
   - Cleanup and maintenance

2. **API Endpoints** (`server.js`)
   - `/api/backup/status` - Get backup status
   - `/api/backup/perform` - Perform manual backup
   - `/api/backup/cleanup` - Clean up old backups
   - `/api/backup/restore` - Restore from backup
   - `/api/backup/list` - List available backups
   - `/api/backup/download/:filename` - Download backup files

3. **Web Interface** (`admin/backup-management.html`)
   - Complete backup management dashboard
   - Real-time status monitoring
   - Manual operation controls
   - Backup history and download

### File Structure

```
backup/
├── backup-manager.js          # Core backup logic
└── backups/                   # Backup storage directory
    ├── backup-status.json     # Current backup status
    ├── backup-manifest-*.json # Backup metadata
    ├── db-backup-*.sql        # Database backups
    └── blob-backup-*.zip      # Blob storage backups
```

## Setup and Configuration

### Prerequisites

1. **Dependencies** (already installed):
   ```bash
   npm install archiver node-cron
   ```

2. **Environment Variables** (already configured):
   ```bash
   DATABASE_URL=postgres://...
   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
   ```

### Initialization

The backup system automatically initializes when the server starts:

```javascript
// Automatic initialization in server.js
let backupManager;
try {
    const BackupManager = require('./backup/backup-manager');
    backupManager = new BackupManager();
    console.log('💾 Backup system initialized');
} catch (error) {
    console.error('⚠️ Backup system initialization failed:', error.message);
}
```

## Usage

### Web Interface

1. **Access Backup Management**:
   - Navigate to: `http://localhost:3000/admin/backup-management.html`
   - Requires admin authentication

2. **View Backup Status**:
   - Real-time status cards showing:
     - Last backup time
     - Backup status (success/failed)
     - Next scheduled backup
     - Total backups count
     - Total storage used
     - Storage usage percentage

3. **Perform Manual Backup**:
   - Click "🔄 Perform Backup" button
   - Confirm the operation
   - Monitor progress bar
   - View success/error notifications

4. **Clean Up Old Backups**:
   - Click "🧹 Cleanup Old Backups" button
   - Confirms deletion of backups older than 30 days
   - Shows freed space and deleted file count

5. **Restore from Backup**:
   - Click "⚠️ Restore from Backup" button
   - Select backup from dropdown
   - Confirm restoration (multiple confirmations)
   - Monitor restore progress

### API Usage

#### Get Backup Status
```bash
curl http://localhost:3000/api/backup/status
```

#### Perform Manual Backup
```bash
curl -X POST http://localhost:3000/api/backup/perform \
  -H "Content-Type: application/json"
```

#### Clean Up Old Backups
```bash
curl -X POST http://localhost:3000/api/backup/cleanup \
  -H "Content-Type: application/json"
```

#### List Available Backups
```bash
curl http://localhost:3000/api/backup/list
```

#### Download Backup File
```bash
curl http://localhost:3000/api/backup/download/filename.sql \
  --output backup-file.sql
```

#### Restore from Backup
```bash
curl -X POST http://localhost:3000/api/backup/restore \
  -H "Content-Type: application/json" \
  -d '{"backupTimestamp": "2025-08-07T01:48:52.803Z"}'
```

## Backup Details

### Database Backup

**File Format**: SQL dump
**Content**:
- Complete table schemas with constraints
- All data with proper INSERT statements
- Timestamps and metadata
- Database connection information

**Example**:
```sql
-- EWA Website Database Backup
-- Created: 2025-08-07T01:48:52.803Z
-- Database: neondb

-- Table: form_1099
DROP TABLE IF EXISTS "form_1099" CASCADE;
CREATE TABLE "form_1099" (
  "id" uuid NOT NULL,
  "recipient_name" character varying NOT NULL,
  "recipient_tin" character varying,
  "amount" numeric NOT NULL,
  -- ... more columns
);

-- Data for form_1099
INSERT INTO "form_1099" ("id", "recipient_name", "recipient_tin", "amount") VALUES ('0bf49073-024b-4b7e-90df-832cd83ea5e6', 'Joseph Smith', '555-55-5555', 1000.00);
```

### Blob Backup

**File Format**: ZIP archive
**Content**:
- All Vercel Blob files
- Preserved directory structure
- File metadata and timestamps
- Compressed for storage efficiency

**Structure**:
```
blob-backup-2025-08-07T01-48-53-152Z.zip
├── w9-1754530611450-StevenSmith.pdf
├── w9-1754501558027-StevenSmith.pdf
├── w9-1754433616026-StevenSmith.pdf
└── ... (all blob files)
```

### Backup Manifest

**File Format**: JSON metadata
**Content**:
- Backup timestamp and duration
- Database backup details (file, size)
- Blob backup details (file, size, file count)
- Total backup size
- Performance metrics

**Example**:
```json
{
  "timestamp": "2025-08-07T01:48:52.803Z",
  "duration": 1465,
  "database": {
    "type": "database",
    "file": "db-backup-2025-08-07T01-48-52-803Z.sql",
    "size": 28185,
    "timestamp": "2025-08-07T01-48-52-803Z"
  },
  "blob": {
    "type": "blob",
    "file": "blob-backup-2025-08-07T01-48-53-152Z.zip",
    "size": 2359,
    "timestamp": "2025-08-07T01-48-53-152Z",
    "blobCount": 10
  },
  "totalSize": 30544
}
```

## Scheduling

### Automated Backups

**Schedule**: Nightly at 2:00 AM
**Cron Expression**: `0 2 * * *`
**Operations**:
1. Perform full backup (database + blob)
2. Clean up old backups (>30 days)
3. Update backup status
4. Log results

### Manual Scheduling

To change the backup schedule, modify the cron expression in `backup-manager.js`:

```javascript
// Current: Nightly at 2 AM
cron.schedule('0 2 * * *', async () => {
    // Backup operations
});

// Examples:
// Daily at 3 AM: '0 3 * * *'
// Every 6 hours: '0 */6 * * *'
// Weekdays only: '0 2 * * 1-5'
```

## Maintenance

### Storage Management

**Automatic Cleanup**:
- Removes backups older than 30 days
- Frees disk space automatically
- Maintains backup history

**Manual Cleanup**:
- Use web interface or API
- Immediate cleanup of old backups
- Reports freed space

### Monitoring

**Backup Status**:
- Last backup time and status
- Total backup count and size
- Storage usage percentage
- Next scheduled backup

**Error Handling**:
- Failed backup notifications
- Error logging and reporting
- Automatic retry mechanisms

### Performance

**Optimization**:
- Database backups use efficient SQL dumps
- Blob backups use compression
- Parallel processing where possible
- Progress tracking for long operations

**Resource Usage**:
- Minimal memory footprint
- Efficient file I/O operations
- Background processing for large backups

## Security

### Access Control

**Admin Only**: All backup operations require admin authentication
**API Protection**: Backup endpoints are protected by authentication
**File Security**: Backup files stored in protected directory

### Data Protection

**Encryption**: Backup files contain sensitive data (SSNs, etc.)
**Access Logging**: All backup operations are logged
**Audit Trail**: Complete history of backup and restore operations

## Troubleshooting

### Common Issues

1. **Backup Fails**:
   - Check database connection
   - Verify blob storage access
   - Review error logs
   - Ensure sufficient disk space

2. **Restore Fails**:
   - Verify backup file integrity
   - Check database permissions
   - Ensure backup compatibility
   - Review restore logs

3. **Scheduled Backups Not Running**:
   - Check server timezone
   - Verify cron job is active
   - Review server logs
   - Test manual backup

### Logs and Debugging

**Server Logs**: Check console output for backup operations
**Backup Status**: Use `/api/backup/status` to check current state
**File System**: Verify backup files exist in `backup/backups/`

### Recovery Procedures

1. **Database Corruption**:
   - Stop the application
   - Restore from latest backup
   - Verify data integrity
   - Restart application

2. **Blob Storage Issues**:
   - Check Vercel Blob status
   - Verify token permissions
   - Restore from backup if needed
   - Update blob references

3. **Complete System Failure**:
   - Restore database from backup
   - Restore blob files from backup
   - Verify all data integrity
   - Resume normal operations

## Best Practices

### Backup Strategy

1. **Regular Testing**: Test restore procedures monthly
2. **Offsite Storage**: Copy backups to external storage
3. **Monitoring**: Set up alerts for failed backups
4. **Documentation**: Keep backup procedures documented

### Performance Optimization

1. **Scheduling**: Run backups during low-traffic periods
2. **Compression**: Use efficient compression for blob backups
3. **Cleanup**: Regular cleanup of old backups
4. **Monitoring**: Track backup performance metrics

### Security Measures

1. **Access Control**: Limit backup access to admins only
2. **Encryption**: Consider encrypting backup files
3. **Audit Logging**: Log all backup operations
4. **Secure Storage**: Store backups in secure location

## API Reference

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/backup/status` | Get backup status and statistics |
| POST | `/api/backup/perform` | Perform manual backup |
| POST | `/api/backup/cleanup` | Clean up old backups |
| POST | `/api/backup/restore` | Restore from backup |
| GET | `/api/backup/list` | List available backups |
| GET | `/api/backup/download/:filename` | Download backup file |

### Response Formats

**Success Response**:
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* operation-specific data */ }
}
```

**Error Response**:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (development only)"
}
```

## Support

For backup system issues:
1. Check server logs for error messages
2. Verify environment variables are set correctly
3. Test manual backup operations
4. Review backup status via API
5. Contact system administrator if issues persist

---

**Last Updated**: August 7, 2025
**Version**: 1.0.0
**Maintainer**: EWA Development Team
