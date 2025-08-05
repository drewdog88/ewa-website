# Database Backup and Restore Guide

This guide covers how to backup and restore the EWA website database using Neon PostgreSQL.

## Overview

The EWA website uses Neon PostgreSQL for data storage with automatic backups and point-in-time recovery. This guide covers both automated and manual backup procedures.

## Neon Automatic Backups

### What's Included
- **Automatic daily backups** with 7-day retention
- **Point-in-time recovery** - restore to any moment in the last 7 days
- **Branch-based backups** - create data branches for testing
- **Cross-region replication** for disaster recovery

### Accessing Neon Backups
1. Log into your [Neon Console](https://console.neon.tech)
2. Select your EWA project
3. Go to **Backups** tab
4. View available backups and restore points

### Restoring from Neon Console
1. Navigate to **Backups** in Neon Console
2. Select the desired backup point
3. Click **Restore** to create a new branch
4. Update your `DATABASE_URL` to point to the restored branch
5. Test the restored data
6. Promote the branch to primary if satisfied

## Manual Backup and Restore

### Prerequisites
- Node.js installed
- Access to the EWA website codebase
- Database connection configured

### Creating Manual Backups

#### Using the Admin Panel
1. Log into the admin panel
2. Navigate to **Database Management**
3. Click **Create Backup**
4. Download the backup file

#### Using Command Line
```bash
# Navigate to project directory
cd ewa_website

# Create a backup
node -e "
const DatabaseBackup = require('./database/backup');
const backup = new DatabaseBackup();
backup.createBackup('manual-backup-' + new Date().toISOString().split('T')[0]);
"
```

#### Using the API
```bash
curl -X POST http://localhost:3000/api/admin/backup \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Restoring from Manual Backups

#### Using the Admin Panel
1. Log into the admin panel
2. Navigate to **Database Management**
3. Click **Restore Backup**
4. Upload the backup file
5. Confirm the restore operation

#### Using Command Line
```bash
# Navigate to project directory
cd ewa_website

# Restore from backup
node -e "
const DatabaseBackup = require('./database/backup');
const backup = new DatabaseBackup();
backup.restoreBackup('./backups/ewa-backup-2025-08-05.json');
"
```

#### Using the API
```bash
curl -X POST http://localhost:3000/api/admin/restore \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "backup=@./backups/ewa-backup-2025-08-05.json"
```

## Backup File Format

Manual backups are stored as JSON files with the following structure:

```json
{
  "timestamp": "2025-08-05T19:45:00.000Z",
  "version": "1.0",
  "tables": {
    "officers": [...],
    "users": [...],
    "volunteers": [...],
    "insurance_forms": [...],
    "form_1099": [...],
    "documents": [...]
  }
}
```

## Backup Locations

### Local Development
- **Backup files**: `./backups/` directory
- **Neon connection**: Uses `DATABASE_URL` from `.env.local`

### Production (Vercel)
- **Backup files**: Stored in Vercel's file system (temporary)
- **Neon connection**: Uses `DATABASE_URL` from Vercel environment variables
- **Recommended**: Download backups to local storage

## Best Practices

### Backup Frequency
- **Automatic**: Daily (handled by Neon)
- **Manual**: Before major changes or deployments
- **Critical data**: Before form submissions or admin changes

### Backup Storage
- **Local**: Keep copies in `./backups/` directory
- **Cloud**: Upload to secure cloud storage (Google Drive, Dropbox, etc.)
- **Version Control**: Don't commit backup files to Git (they're in `.gitignore`)

### Testing Restores
1. Always test restores in a development environment first
2. Verify data integrity after restore
3. Check that all relationships are preserved
4. Test application functionality

### Security
- **Access Control**: Only admin users can create/restore backups
- **Encryption**: Consider encrypting backup files for sensitive data
- **Audit Trail**: Log all backup and restore operations

## Emergency Procedures

### Complete Database Loss
1. **Check Neon Console** for automatic backups
2. **Restore from latest automatic backup**
3. **If automatic backup unavailable**, use manual backup
4. **Contact support** if no backups are available

### Data Corruption
1. **Identify the corruption** using database queries
2. **Restore from point before corruption**
3. **Re-apply any valid changes** made after corruption
4. **Verify data integrity**

### Partial Data Loss
1. **Export current data** to identify missing records
2. **Restore from backup** to get missing data
3. **Merge current and restored data** carefully
4. **Verify no duplicates** or conflicts

## Monitoring and Alerts

### Backup Health Checks
- Monitor backup file sizes (should be consistent)
- Check backup timestamps (should be recent)
- Verify backup file integrity (JSON should be valid)

### Automated Monitoring
```bash
# Check backup health
node -e "
const DatabaseBackup = require('./database/backup');
const backup = new DatabaseBackup();
const backups = backup.listBackups();
console.log('Latest backup:', backups[0]?.timestamp);
console.log('Backup count:', backups.length);
"
```

## Troubleshooting

### Common Issues

#### Backup Creation Fails
- **Check database connection**
- **Verify file permissions** for backup directory
- **Ensure sufficient disk space**

#### Restore Fails
- **Validate backup file format**
- **Check database permissions**
- **Ensure no active transactions**

#### Data Inconsistencies
- **Compare backup and current data**
- **Check for foreign key constraints**
- **Verify UUID consistency**

### Getting Help
- **Check logs** in admin panel
- **Review Neon Console** for database issues
- **Contact development team** for technical support

## Migration from Redis

If migrating from Redis to Neon:

1. **Export Redis data** using Redis commands
2. **Transform data** to match Neon schema
3. **Import to Neon** using the migration scripts
4. **Verify data integrity**
5. **Update application** to use Neon connection
6. **Test all functionality**
7. **Create initial backup** in new format

## Support

For backup and restore support:
- **Technical issues**: Check this documentation
- **Neon-specific**: Contact Neon support
- **Application issues**: Contact development team
- **Emergency**: Use Neon Console for immediate recovery 