const { Pool } = require('pg');
const { list } = require('@vercel/blob');
const archiver = require('archiver');
const { createWriteStream } = require('fs');
const fs = require('fs').promises;
const path = require('path');

require('dotenv').config({ path: '.env.local' });

class BackupManager {
  constructor() {
    this.dbPool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    
    this.backupDir = path.join(__dirname, 'backups');
    this.backupStatus = {
      lastBackup: null,
      lastBackupStatus: 'unknown',
      backupCount: 0,
      totalBackupSize: 0
    };
    
    this.ensureBackupDir();
    this.loadBackupStatus();
  }

  async ensureBackupDir() {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
    } catch (error) {
      console.error('❌ Failed to create backup directory:', error);
    }
  }

  async loadBackupStatus() {
    try {
      const statusFile = path.join(this.backupDir, 'backup-status.json');
      const data = await fs.readFile(statusFile, 'utf8');
      this.backupStatus = JSON.parse(data);
    } catch (error) {
      // Status file doesn't exist or is invalid, use defaults
      await this.saveBackupStatus();
    }
  }

  async saveBackupStatus() {
    try {
      const statusFile = path.join(this.backupDir, 'backup-status.json');
      await fs.writeFile(statusFile, JSON.stringify(this.backupStatus, null, 2));
    } catch (error) {
      console.error('❌ Failed to save backup status:', error);
    }
  }

  async createDatabaseBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(this.backupDir, `db-backup-${timestamp}.sql`);
        
    try {
      console.log('📊 Creating database backup...');
      const dbBackup = await this.createDatabaseBackupContent();
      
      await fs.writeFile(backupFile, dbBackup.content);
            
      const stats = await fs.stat(backupFile);
      console.log(`✅ Database backup created: ${backupFile} (${(stats.size / 1024).toFixed(2)} KB)`);
            
      return {
        type: 'database',
        file: backupFile,
        size: stats.size,
        timestamp: timestamp
      };
    } catch (error) {
      console.error('❌ Database backup failed:', error);
      throw error;
    }
  }

  async createDatabaseBackupContent() {
    try {
      // Get all tables
      const tablesResult = await this.dbPool.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_type = 'BASE TABLE'
                ORDER BY table_name
            `);

      let backupContent = '-- EWA Website Database Backup\n';
      backupContent += `-- Created: ${new Date().toISOString()}\n`;
      backupContent += `-- Database: ${process.env.DATABASE_URL?.split('/').pop()?.split('?')[0]}\n\n`;

      const tables = [];
      // Backup each table
      for (const table of tablesResult.rows) {
        const tableName = table.table_name;
        tables.push(tableName);
                
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
          backupContent += `-- Data for ${tableName}\n`;
          for (const row of dataResult.rows) {
            const columns = Object.keys(row);
            const values = columns.map(col => {
              const val = row[col];
              if (val === null) return 'NULL';
              if (typeof val === 'string') return `'${val.replace(/'/g, '\'\'')}'`;
              return val;
            });
            backupContent += `INSERT INTO "${tableName}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${values.join(', ')});\n`;
          }
          backupContent += '\n';
        }
      }

      return {
        content: backupContent,
        size: Buffer.byteLength(backupContent, 'utf8'),
        tables: tables
      };
    } catch (error) {
      console.error('❌ Database backup content creation failed:', error);
      throw error;
    }
  }

  async createBlobBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(this.backupDir, `blob-backup-${timestamp}.zip`);
        
    try {
      console.log('📁 Creating blob storage backup...');
      const blobBackup = await this.createBlobBackupContent();
      
      if (blobBackup.blobs.length === 0) {
        console.log('ℹ️  No blobs found to backup');
        return {
          type: 'blob',
          file: backupFile,
          size: 0,
          timestamp: timestamp,
          blobCount: 0
        };
      }

      // Create zip archive
      const output = createWriteStream(backupFile);
      const archive = archiver('zip', { zlib: { level: 9 } });

      return new Promise((resolve, reject) => {
        output.on('close', async () => {
          const stats = await fs.stat(backupFile);
          console.log(`✅ Blob backup created: ${backupFile} (${(stats.size / 1024 / 1024).toFixed(2)} MB, ${blobBackup.blobs.length} files)`);
          resolve({
            type: 'blob',
            file: backupFile,
            size: stats.size,
            timestamp: timestamp,
            blobCount: blobBackup.blobs.length
          });
        });

        archive.on('error', reject);
        archive.pipe(output);

        // Add each blob to the archive
        blobBackup.blobs.forEach(blob => {
          const blobUrl = blob.url;
          const fileName = blob.pathname.split('/').pop() || 'unknown';
          archive.append(blobUrl, { name: fileName });
        });

        archive.finalize();
      });
    } catch (error) {
      console.error('❌ Blob backup failed:', error);
      throw error;
    }
  }

  async createBlobBackupContent() {
    try {
      // List all blobs
      const { blobs } = await list();
      
      let totalSize = 0;
      for (const blob of blobs) {
        totalSize += blob.size || 0;
      }
      
      return {
        blobs: blobs,
        totalSize: totalSize
      };
    } catch (error) {
      console.error('❌ Blob backup content creation failed:', error);
      throw error;
    }
  }

  async performFullBackup() {
    const startTime = Date.now();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(this.backupDir, `full-backup-${timestamp}.zip`);
        
    try {
      console.log('🚀 Starting full system backup...');
      
      // Create database backup content first
      console.log('💾 Creating database backup...');
      const dbBackup = await this.createDatabaseBackupContent();
      
      // Create blob backup content
      console.log('📁 Creating blob backup...');
      const blobBackup = await this.createBlobBackupContent();
            
      // Create a single ZIP archive containing both database and blob data
      const output = createWriteStream(backupFile);
      const archive = archiver('zip', { zlib: { level: 9 } });

      return new Promise(async (resolve, reject) => {
        output.on('close', async () => {
          try {
            const stats = await fs.stat(backupFile);
            
            // Create backup manifest
            const manifest = {
              timestamp: timestamp,
              duration: Date.now() - startTime,
              type: 'full',
              file: backupFile,
              size: stats.size,
              databaseSize: dbBackup.size,
              blobSize: blobBackup.totalSize,
              blobCount: blobBackup.blobs.length,
              totalSize: stats.size
            };

            const manifestFile = path.join(this.backupDir, `backup-manifest-${timestamp}.json`);
            await fs.writeFile(manifestFile, JSON.stringify(manifest, null, 2));

            // Upload the backup file to blob storage
            console.log('📤 Uploading backup to blob storage...');
            const { put } = require('@vercel/blob');
            
            // Get blob token (standardized)
            const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
            
            if (BLOB_TOKEN) {
              const dateFolder = new Date().toISOString().split('T')[0];
              const backupPath = `backups/full/${dateFolder}/full-backup-${timestamp}.zip`;
              
              // Read the backup file and upload it
              const backupBuffer = await fs.readFile(backupFile);
              await put(backupPath, backupBuffer, {
                access: 'public',
                addRandomSuffix: false,
                token: BLOB_TOKEN
              });
              
              console.log(`✅ Backup uploaded to blob storage: ${backupPath}`);
            } else {
              console.warn('⚠️  No blob token available - backup not uploaded to blob storage');
            }

            // Update backup status
            this.backupStatus.lastBackup = timestamp;
            this.backupStatus.lastBackupStatus = 'success';
            this.backupStatus.backupCount++;
            this.backupStatus.totalBackupSize += manifest.totalSize;
            await this.saveBackupStatus();

            console.log(`✅ Full backup completed in ${manifest.duration}ms`);
            console.log(`📊 Total size: ${(manifest.totalSize / 1024 / 1024).toFixed(2)} MB`);
            console.log(`💾 Database: ${(manifest.databaseSize / 1024).toFixed(2)} KB`);
            console.log(`📁 Blob files: ${manifest.blobCount} files (${(manifest.blobSize / 1024 / 1024).toFixed(2)} MB)`);
            
            resolve(manifest);
          } catch (error) {
            reject(error);
          }
        });

        archive.on('error', reject);
        archive.pipe(output);

        try {
          // Add database backup to archive
          archive.append(dbBackup.content, { name: 'database/database-backup.sql' });
          
          // Add blob files to archive with error handling
          let successfulBlobs = 0;
          let failedBlobs = 0;
          
          for (const blob of blobBackup.blobs) {
            try {
              console.log(`📥 Downloading blob: ${blob.pathname} (${(blob.size / 1024).toFixed(2)} KB)`);
              
              const response = await fetch(blob.url, { 
                timeout: 30000,  // 30 second timeout
                headers: {
                  'User-Agent': 'EWA-Backup-System/1.0'
                }
              });
              
              if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
              }
              
              const buffer = await response.arrayBuffer();
              archive.append(Buffer.from(buffer), { name: `blob/${blob.pathname}` });
              successfulBlobs++;
              console.log(`✅ Downloaded: ${blob.pathname}`);
              
            } catch (error) {
              console.error(`❌ Failed to download ${blob.pathname}:`, error.message);
              failedBlobs++;
              
              // Add error info to archive instead of failing completely
              const errorInfo = {
                pathname: blob.pathname,
                size: blob.size,
                url: blob.url,
                error: error.message,
                timestamp: new Date().toISOString()
              };
              
              archive.append(JSON.stringify(errorInfo, null, 2), { 
                name: `blob-errors/${blob.pathname}.error.json` 
              });
            }
          }
          
          console.log(`📊 Blob download summary: ${successfulBlobs} successful, ${failedBlobs} failed`);
          
          // Add metadata
          const metadata = {
            timestamp: timestamp,
            databaseSize: dbBackup.size,
            blobCount: blobBackup.blobs.length,
            blobSize: blobBackup.totalSize,
            successfulBlobs: successfulBlobs,
            failedBlobs: failedBlobs,
            tables: dbBackup.tables,
            backupVersion: '2.0',
            environment: process.env.NODE_ENV || 'development'
          };
          
          archive.append(JSON.stringify(metadata, null, 2), { name: 'backup-metadata.json' });
          
          // Finalize the archive
          await archive.finalize();
          
        } catch (error) {
          reject(error);
        }
      });
    } catch (error) {
      this.backupStatus.lastBackupStatus = 'failed';
      await this.saveBackupStatus();
      console.error('❌ Full backup failed:', error);
      throw error;
    }
  }

  async cleanupOldBackups() {
    try {
      console.log('🧹 Cleaning up old backups...');
            
      const files = await fs.readdir(this.backupDir);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
      let deletedCount = 0;
      let freedSpace = 0;

      for (const file of files) {
        if (file === 'backup-status.json') continue;
                
        const filePath = path.join(this.backupDir, file);
        const stats = await fs.stat(filePath);
                
        if (stats.mtime < thirtyDaysAgo) {
          await fs.unlink(filePath);
          deletedCount++;
          freedSpace += stats.size;
          console.log(`🗑️  Deleted old backup: ${file}`);
        }
      }

      console.log(`✅ Cleanup completed: ${deletedCount} files deleted, ${(freedSpace / 1024 / 1024).toFixed(2)} MB freed`);
      return { deletedCount, freedSpace };
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
      throw error;
    }
  }

  async getBackupStatus() {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files.filter(f => f.startsWith('backup-manifest-'));
            
      const backups = [];
      for (const file of backupFiles) {
        const filePath = path.join(this.backupDir, file);
        const stats = await fs.stat(filePath);
        const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
                
        backups.push({
          ...data,
          file: file,
          fileSize: stats.size,
          age: Date.now() - new Date(data.timestamp).getTime()
        });
      }

      // Sort by timestamp (newest first)
      backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      return {
        ...this.backupStatus,
        backups: backups
      };
    } catch (error) {
      console.error('❌ Failed to get backup status:', error);
      return this.backupStatus;
    }
  }

  async restoreFromBackup(backupTimestamp) {
    try {
      console.log(`🔄 Restoring from backup: ${backupTimestamp}`);
            
      const manifestFile = path.join(this.backupDir, `backup-manifest-${backupTimestamp}.json`);
      const manifest = JSON.parse(await fs.readFile(manifestFile, 'utf8'));
            
      // Restore database
      if (manifest.database) {
        console.log('📊 Restoring database...');
        const dbBackupFile = manifest.database.file;
        const dbContent = await fs.readFile(dbBackupFile, 'utf8');
                
        // Split into individual statements
        const statements = dbContent.split(';').filter(stmt => stmt.trim());
                
        for (const statement of statements) {
          if (statement.trim()) {
            await this.dbPool.query(statement);
          }
        }
        console.log('✅ Database restored');
      }
            
      // Note: Blob restoration would require re-uploading files
      // This is more complex and would need to be implemented separately
            
      console.log('✅ Restore completed');
      return manifest;
    } catch (error) {
      console.error('❌ Restore failed:', error);
      throw error;
    }
  }

  async close() {
    if (this.dbPool) {
      await this.dbPool.end();
    }
  }
}

module.exports = BackupManager;
