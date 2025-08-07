const { Pool } = require('pg');
const { put, del, list } = require('@vercel/blob');
const cron = require('node-cron');
const archiver = require('archiver');
const { Readable } = require('stream');

class ServerlessBackupManager {
    constructor() {
        this.dbPool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });
        this.backupStatus = {
            lastBackup: null,
            lastBackupStatus: null,
            nextScheduledBackup: null,
            backupCount: 0,
            totalBackupSize: 0
        };
        this.initializeBackupTables();
    }

    async initializeBackupTables() {
        try {
            // Create backup metadata table if it doesn't exist
            await this.dbPool.query(`
                CREATE TABLE IF NOT EXISTS backup_metadata (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    backup_type VARCHAR(20) NOT NULL,
                    file_url TEXT,
                    file_size BIGINT,
                    duration_ms INTEGER,
                    status VARCHAR(20) DEFAULT 'pending',
                    error_message TEXT,
                    blob_count INTEGER DEFAULT 0,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            `);

            // Create backup status table if it doesn't exist
            await this.dbPool.query(`
                CREATE TABLE IF NOT EXISTS backup_status (
                    id INTEGER PRIMARY KEY DEFAULT 1,
                    last_backup TIMESTAMP WITH TIME ZONE,
                    last_backup_status VARCHAR(20),
                    next_scheduled_backup TIMESTAMP WITH TIME ZONE,
                    backup_count INTEGER DEFAULT 0,
                    total_backup_size BIGINT DEFAULT 0,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            `);

            // Initialize status record if it doesn't exist
            await this.dbPool.query(`
                INSERT INTO backup_status (id, last_backup, last_backup_status, backup_count, total_backup_size)
                VALUES (1, NULL, NULL, 0, 0)
                ON CONFLICT (id) DO NOTHING
            `);

            await this.loadBackupStatus();
        } catch (error) {
            console.error('Error initializing backup tables:', error);
        }
    }

    async loadBackupStatus() {
        try {
            const result = await this.dbPool.query('SELECT * FROM backup_status WHERE id = 1');
            if (result.rows.length > 0) {
                const status = result.rows[0];
                this.backupStatus = {
                    lastBackup: status.last_backup,
                    lastBackupStatus: status.last_backup_status,
                    nextScheduledBackup: status.next_scheduled_backup,
                    backupCount: status.backup_count,
                    totalBackupSize: status.total_backup_size
                };
            }
        } catch (error) {
            console.error('Error loading backup status:', error);
        }
    }

    async saveBackupStatus() {
        try {
            await this.dbPool.query(`
                UPDATE backup_status 
                SET last_backup = $1, 
                    last_backup_status = $2, 
                    next_scheduled_backup = $3, 
                    backup_count = $4, 
                    total_backup_size = $5,
                    updated_at = NOW()
                WHERE id = 1
            `, [
                this.backupStatus.lastBackup,
                this.backupStatus.lastBackupStatus,
                this.backupStatus.nextScheduledBackup,
                this.backupStatus.backupCount,
                this.backupStatus.totalBackupSize
            ]);
        } catch (error) {
            console.error('Error saving backup status:', error);
        }
    }

    async createDatabaseBackup() {
        const timestamp = new Date().toISOString();
        const backupId = `db-backup-${timestamp.replace(/[:.]/g, '-')}`;
        
        try {
            console.log('📊 Creating database backup...');
            
            // Get all tables
            const tablesResult = await this.dbPool.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_type = 'BASE TABLE'
                ORDER BY table_name
            `);

            let backupContent = `-- EWA Website Database Backup\n`;
            backupContent += `-- Created: ${timestamp}\n`;
            backupContent += `-- Database: ${process.env.DATABASE_URL?.split('/').pop()?.split('?')[0]}\n\n`;

            // Backup each table
            for (const table of tablesResult.rows) {
                const tableName = table.table_name;
                
                // Get table schema
                const schemaResult = await this.dbPool.query(`
                    SELECT column_name, data_type, is_nullable, column_default
                    FROM information_schema.columns 
                    WHERE table_name = $1 
                    ORDER BY ordinal_position
                `, [tableName]);

                backupContent += `-- Table: ${tableName}\n`;
                backupContent += `DROP TABLE IF EXISTS "${tableName}" CASCADE;\n`;
                backupContent += `CREATE TABLE "${tableName}" (\n`;
                
                const columns = schemaResult.rows.map(col => {
                    let def = `"${col.column_name}" ${col.data_type}`;
                    if (col.is_nullable === 'NO') def += ' NOT NULL';
                    if (col.column_default) def += ` DEFAULT ${col.column_default}`;
                    return def;
                });
                
                backupContent += columns.join(',\n  ') + '\n);\n\n';

                // Get table data
                const dataResult = await this.dbPool.query(`SELECT * FROM "${tableName}"`);
                if (dataResult.rows.length > 0) {
                    backupContent += `-- Data for table: ${tableName}\n`;
                    for (const row of dataResult.rows) {
                        const values = Object.values(row).map(val => {
                            if (val === null) return 'NULL';
                            if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
                            if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
                            return val;
                        });
                        backupContent += `INSERT INTO "${tableName}" VALUES (${values.join(', ')});\n`;
                    }
                    backupContent += '\n';
                }
            }

            // Upload to blob storage
            const blob = await put(backupId, backupContent, {
                access: 'public',
                addRandomSuffix: false
            });

            return {
                type: 'database',
                file: blob.url,
                size: Buffer.byteLength(backupContent, 'utf8'),
                timestamp: timestamp
            };
        } catch (error) {
            console.error('Error creating database backup:', error);
            throw error;
        }
    }

    async createBlobBackup() {
        const timestamp = new Date().toISOString();
        const backupId = `blob-backup-${timestamp.replace(/[:.]/g, '-')}`;
        
        try {
            console.log('📁 Creating blob backup...');
            
            // List all blobs
            const { blobs } = await list();
            
            if (blobs.length === 0) {
                return {
                    type: 'blob',
                    file: null,
                    size: 0,
                    timestamp: timestamp,
                    blobCount: 0
                };
            }

            // Create a zip archive in memory
            const archive = archiver('zip', { zlib: { level: 9 } });
            const chunks = [];

            archive.on('data', (chunk) => chunks.push(chunk));
            archive.on('end', () => {});

            // Add each blob to the archive
            for (const blob of blobs) {
                try {
                    const response = await fetch(blob.url);
                    const buffer = await response.arrayBuffer();
                    archive.append(Buffer.from(buffer), { name: blob.pathname });
                } catch (error) {
                    console.warn(`Failed to add blob ${blob.pathname} to backup:`, error);
                }
            }

            archive.finalize();

            // Wait for archive to complete
            await new Promise((resolve, reject) => {
                archive.on('end', resolve);
                archive.on('error', reject);
            });

            const zipBuffer = Buffer.concat(chunks);

            // Upload to blob storage
            const blob = await put(backupId, zipBuffer, {
                access: 'public',
                addRandomSuffix: false
            });

            return {
                type: 'blob',
                file: blob.url,
                size: zipBuffer.length,
                timestamp: timestamp,
                blobCount: blobs.length
            };
        } catch (error) {
            console.error('Error creating blob backup:', error);
            throw error;
        }
    }

    async performFullBackup() {
        const startTime = Date.now();
        const timestamp = new Date().toISOString();
        
        try {
            console.log('🚀 Starting full backup...');
            
            // Create backup metadata record
            const backupResult = await this.dbPool.query(`
                INSERT INTO backup_metadata (timestamp, backup_type, status)
                VALUES ($1, 'full', 'pending')
                RETURNING id
            `, [timestamp]);
            
            const backupId = backupResult.rows[0].id;

            // Create database backup
            const dbBackup = await this.createDatabaseBackup();
            
            // Create blob backup
            const blobBackup = await this.createBlobBackup();
            
            const duration = Date.now() - startTime;
            const totalSize = dbBackup.size + blobBackup.size;

            // Update backup metadata
            await this.dbPool.query(`
                UPDATE backup_metadata 
                SET file_url = $1, file_size = $2, duration_ms = $3, status = 'success'
                WHERE id = $4
            `, [dbBackup.file, totalSize, duration, backupId]);

            // Update status
            this.backupStatus.lastBackup = timestamp;
            this.backupStatus.lastBackupStatus = 'success';
            this.backupStatus.backupCount += 1;
            this.backupStatus.totalBackupSize += totalSize;
            await this.saveBackupStatus();

            console.log('✅ Full backup completed successfully');
            
            return {
                success: true,
                timestamp: timestamp,
                duration: duration,
                database: dbBackup,
                blob: blobBackup,
                totalSize: totalSize
            };
        } catch (error) {
            console.error('❌ Full backup failed:', error);
            
            // Update backup metadata with error
            await this.dbPool.query(`
                UPDATE backup_metadata 
                SET status = 'failed', error_message = $1
                WHERE timestamp = $2
            `, [error.message, timestamp]);

            // Update status
            this.backupStatus.lastBackup = timestamp;
            this.backupStatus.lastBackupStatus = 'failed';
            await this.saveBackupStatus();

            throw error;
        }
    }

    async cleanupOldBackups() {
        try {
            console.log('🧹 Cleaning up old backups...');
            
            // Keep backups for 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            // Get old backups
            const oldBackups = await this.dbPool.query(`
                SELECT id, file_url FROM backup_metadata 
                WHERE timestamp < $1 AND status = 'success'
            `, [thirtyDaysAgo.toISOString()]);

            let deletedCount = 0;
            let totalSizeFreed = 0;

            for (const backup of oldBackups.rows) {
                try {
                    // Delete from blob storage
                    if (backup.file_url) {
                        const urlParts = backup.file_url.split('/');
                        const blobId = urlParts[urlParts.length - 1];
                        await del(blobId);
                    }

                    // Delete metadata
                    await this.dbPool.query('DELETE FROM backup_metadata WHERE id = $1', [backup.id]);
                    
                    deletedCount++;
                } catch (error) {
                    console.warn(`Failed to delete backup ${backup.id}:`, error);
                }
            }

            console.log(`✅ Cleanup completed: ${deletedCount} backups deleted`);
            return { deletedCount, totalSizeFreed };
        } catch (error) {
            console.error('Error during cleanup:', error);
            throw error;
        }
    }

    async getBackupStatus() {
        try {
            await this.loadBackupStatus();
            
            // Get recent backups
            const backupsResult = await this.dbPool.query(`
                SELECT * FROM backup_metadata 
                WHERE status = 'success'
                ORDER BY timestamp DESC 
                LIMIT 10
            `);

            const backups = backupsResult.rows.map(row => ({
                timestamp: row.timestamp,
                duration: row.duration_ms,
                database: {
                    type: 'database',
                    file: row.file_url,
                    size: row.file_size,
                    timestamp: row.timestamp
                },
                blob: {
                    type: 'blob',
                    file: row.file_url,
                    size: 0, // Will be calculated from blob backup
                    timestamp: row.timestamp,
                    blobCount: row.blob_count
                },
                totalSize: row.file_size,
                file: `backup-${row.timestamp.toISOString().replace(/[:.]/g, '-')}.json`,
                fileSize: 0,
                age: Date.now() - new Date(row.timestamp).getTime()
            }));

            return {
                status: this.backupStatus,
                backups: backups,
                nextScheduledBackup: this.getNextScheduledBackup()
            };
        } catch (error) {
            console.error('Error getting backup status:', error);
            throw error;
        }
    }

    getNextScheduledBackup() {
        if (!this.backupStatus.lastBackup) {
            // Schedule first backup for tonight at 9 PM
            const tonight = new Date();
            tonight.setHours(21, 0, 0, 0);
            return tonight.toISOString();
        }
        
        // Schedule next backup for tomorrow at 9 PM
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(21, 0, 0, 0);
        return tomorrow.toISOString();
    }

    startScheduledBackups() {
        // Schedule daily backup at 9 PM
        cron.schedule('0 21 * * *', async () => {
            try {
                console.log('🕘 Running scheduled backup...');
                await this.performFullBackup();
            } catch (error) {
                console.error('Scheduled backup failed:', error);
            }
        }, {
            timezone: 'America/Los_Angeles'
        });
        
        console.log('⏰ Scheduled backups enabled (daily at 9 PM PST)');
    }

    async restoreFromBackup(backupTimestamp) {
        try {
            console.log(`🔄 Restoring from backup: ${backupTimestamp}`);
            
            // Get backup metadata
            const backupResult = await this.dbPool.query(`
                SELECT * FROM backup_metadata 
                WHERE timestamp = $1 AND status = 'success'
            `, [backupTimestamp]);

            if (backupResult.rows.length === 0) {
                throw new Error('Backup not found or failed');
            }

            const backup = backupResult.rows[0];
            
            // Download and restore database backup
            if (backup.file_url) {
                const response = await fetch(backup.file_url);
                const backupContent = await response.text();
                
                // Execute the backup SQL
                const statements = backupContent.split(';').filter(stmt => stmt.trim());
                for (const statement of statements) {
                    if (statement.trim()) {
                        await this.dbPool.query(statement);
                    }
                }
            }

            console.log('✅ Restore completed successfully');
            return { success: true };
        } catch (error) {
            console.error('❌ Restore failed:', error);
            throw error;
        }
    }
}

module.exports = ServerlessBackupManager;
