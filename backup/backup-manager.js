const { Pool } = require('pg');
const { list } = require('@vercel/blob');
const fs = require('fs').promises;
const path = require('path');
const cron = require('node-cron');
const archiver = require('archiver');
const { createWriteStream } = require('fs');
require('dotenv').config({ path: '.env.local' });

class BackupManager {
  constructor() {
    this.backupDir = path.join(__dirname, 'backups');
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
    this.initializeBackupDirectory();
  }

  async initializeBackupDirectory() {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
      await this.loadBackupStatus();
    } catch (error) {
      console.error('Error initializing backup directory:', error);
    }
  }

  async loadBackupStatus() {
    try {
      const statusFile = path.join(this.backupDir, 'backup-status.json');
      const data = await fs.readFile(statusFile, 'utf8');
      this.backupStatus = JSON.parse(data);
    } catch (error) {
      // Status file doesn't exist yet, use defaults
      console.log('No existing backup status found, starting fresh');
    }
  }

  async saveBackupStatus() {
    try {
      const statusFile = path.join(this.backupDir, 'backup-status.json');
      await fs.writeFile(statusFile, JSON.stringify(this.backupStatus, null, 2));
    } catch (error) {
      console.error('Error saving backup status:', error);
    }
  }

  async createDatabaseBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(this.backupDir, `db-backup-${timestamp}.sql`);
        
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

      let backupContent = '-- EWA Website Database Backup\n';
      backupContent += `-- Created: ${new Date().toISOString()}\n`;
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

      await fs.writeFile(backupFile, backupContent);
            
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

  async createBlobBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(this.backupDir, `blob-backup-${timestamp}.zip`);
        
    try {
      console.log('📁 Creating blob storage backup...');
            
      // List all blobs
      const { blobs } = await list();
            
      if (blobs.length === 0) {
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
          console.log(`✅ Blob backup created: ${backupFile} (${(stats.size / 1024 / 1024).toFixed(2)} MB, ${blobs.length} files)`);
          resolve({
            type: 'blob',
            file: backupFile,
            size: stats.size,
            timestamp: timestamp,
            blobCount: blobs.length
          });
        });

        archive.on('error', reject);
        archive.pipe(output);

        // Add each blob to the archive
        blobs.forEach(blob => {
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

  async performFullBackup() {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
        
    try {
      console.log('🚀 Starting full system backup...');
            
      // Create both backups
      const dbBackup = await this.createDatabaseBackup();
      const blobBackup = await this.createBlobBackup();
            
      // Create backup manifest
      const manifest = {
        timestamp: timestamp,
        duration: Date.now() - startTime,
        database: dbBackup,
        blob: blobBackup,
        totalSize: dbBackup.size + blobBackup.size
      };

      const manifestFile = path.join(this.backupDir, `backup-manifest-${dbBackup.timestamp}.json`);
      await fs.writeFile(manifestFile, JSON.stringify(manifest, null, 2));

      // Update backup status
      this.backupStatus.lastBackup = timestamp;
      this.backupStatus.lastBackupStatus = 'success';
      this.backupStatus.backupCount++;
      this.backupStatus.totalBackupSize += manifest.totalSize;
      await this.saveBackupStatus();

      console.log(`✅ Full backup completed in ${manifest.duration}ms`);
      console.log(`📊 Total size: ${(manifest.totalSize / 1024 / 1024).toFixed(2)} MB`);
            
      return manifest;
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
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(2, 0, 0, 0); // 2 AM
    return tomorrow.toISOString();
  }

  startScheduledBackups() {
    // Schedule nightly backup at 2 AM
    cron.schedule('0 2 * * *', async () => {
      console.log('⏰ Scheduled backup starting...');
      try {
        await this.performFullBackup();
        await this.cleanupOldBackups();
      } catch (error) {
        console.error('❌ Scheduled backup failed:', error);
      }
    });

    console.log('📅 Scheduled backups enabled - nightly at 2 AM');
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
}

module.exports = BackupManager;
