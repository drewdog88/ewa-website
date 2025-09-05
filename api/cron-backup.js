// Vercel Cron Job for Daily Backups
// This file will be automatically triggered by Vercel's cron system
// Schedule: Daily at 10:00 AM UTC (2:00 AM PST)
// User Agent: vercel-cron/1.0

const { Pool } = require('pg');
const { list, put, del } = require('@vercel/blob');
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');

// Environment variables
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const DATABASE_URL = process.env.DATABASE_URL;

// Database connection pool
const dbPool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

/**
 * Create a comprehensive database backup
 */
async function createBackup() {
  console.log('🔄 Starting automated database backup...');
  
  try {
    // Get current timestamp for backup naming
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `db-backup-${timestamp}.sql`;
    const zipFileName = `db-backup-${timestamp}.zip`;
    
    console.log(`📁 Creating backup: ${backupFileName}`);
    
    // Create backup directory if it doesn't exist
    const backupDir = path.join(__dirname, '..', 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const backupPath = path.join(backupDir, backupFileName);
    const zipPath = path.join(backupDir, zipFileName);
    
    // Create SQL dump using pg_dump equivalent
    const tables = [
      'users',
      'booster_clubs', 
      'officers',
      'volunteers',
      'form_1099',
      'insurance_forms',
      'documents',
      'links',
      'news',
      'payment_audit_log'
    ];
    
    let sqlDump = '';
    
    // Add header
    sqlDump += `-- EWA Website Database Backup\n`;
    sqlDump += `-- Generated: ${new Date().toISOString()}\n`;
    sqlDump += `-- Tables: ${tables.join(', ')}\n\n`;
    
    // Backup each table
    for (const table of tables) {
      console.log(`📊 Backing up table: ${table}`);
      
      try {
        // Get table structure
        const structureResult = await dbPool.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = $1 
          ORDER BY ordinal_position
        `, [table]);
        
        sqlDump += `-- Table structure for ${table}\n`;
        sqlDump += `DROP TABLE IF EXISTS "${table}" CASCADE;\n`;
        
        // Recreate table structure (simplified)
        sqlDump += `CREATE TABLE "${table}" (\n`;
        const columns = structureResult.rows.map(col => {
          let def = `"${col.column_name}" ${col.data_type}`;
          if (col.is_nullable === 'NO') def += ' NOT NULL';
          if (col.column_default) def += ` DEFAULT ${col.column_default}`;
          return def;
        });
        sqlDump += columns.join(',\n  ') + '\n);\n\n';
        
        // Get table data
        const dataResult = await dbPool.query(`SELECT * FROM "${table}"`);
        
        if (dataResult.rows.length > 0) {
          sqlDump += `-- Data for ${table}\n`;
          sqlDump += `INSERT INTO "${table}" VALUES\n`;
          
          const values = dataResult.rows.map(row => {
            const rowValues = Object.values(row).map(val => {
              if (val === null) return 'NULL';
              if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
              if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
              return val;
            });
            return `(${rowValues.join(', ')})`;
          });
          
          sqlDump += values.join(',\n') + ';\n\n';
        }
        
        console.log(`✅ Table ${table}: ${dataResult.rows.length} rows backed up`);
        
      } catch (tableError) {
        console.error(`❌ Error backing up table ${table}:`, tableError.message);
        sqlDump += `-- ERROR: Could not backup table ${table}\n`;
        sqlDump += `-- ${tableError.message}\n\n`;
      }
    }
    
    // Write SQL dump to file
    fs.writeFileSync(backupPath, sqlDump);
    console.log(`💾 SQL backup written to: ${backupPath}`);
    
    // Create zip archive
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    output.on('close', () => {
      console.log(`📦 Archive created: ${zipPath} (${archive.pointer()} bytes)`);
    });
    
    archive.pipe(output);
    archive.file(backupPath, { name: backupFileName });
    await archive.finalize();
    
    // Upload to Vercel Blob Storage
    if (BLOB_TOKEN) {
      console.log('☁️ Uploading backup to Vercel Blob Storage...');
      
      const zipBuffer = fs.readFileSync(zipPath);
      const blob = await put(zipFileName, zipBuffer, {
        access: 'public',
        token: BLOB_TOKEN
      });
      
      console.log(`✅ Backup uploaded to: ${blob.url}`);
      
      // Clean up local files
      fs.unlinkSync(backupPath);
      fs.unlinkSync(zipPath);
      
      return {
        success: true,
        fileName: zipFileName,
        blobUrl: blob.url,
        size: archive.pointer(),
        timestamp: timestamp
      };
    } else {
      console.log('⚠️ BLOB_TOKEN not available, keeping local backup');
      return {
        success: true,
        fileName: zipFileName,
        localPath: zipPath,
        size: archive.pointer(),
        timestamp: timestamp
      };
    }
    
  } catch (error) {
    console.error('❌ Backup creation failed:', error);
    throw error;
  }
}

/**
 * Clean up old backups (keep last 7 days)
 */
async function cleanupOldBackups() {
  console.log('🧹 Cleaning up old backups...');
  
  try {
    if (!BLOB_TOKEN) {
      console.log('⚠️ BLOB_TOKEN not available, skipping cleanup');
      return;
    }
    
    // List all backup files
    const { blobs } = await list({ token: BLOB_TOKEN });
    
    const backupFiles = blobs.filter(blob => 
      blob.pathname.startsWith('db-backup-') && 
      blob.pathname.endsWith('.zip')
    );
    
    console.log(`📋 Found ${backupFiles.length} backup files`);
    
    // Keep backups from last 7 days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);
    
    const filesToDelete = backupFiles.filter(blob => {
      const fileDate = new Date(blob.uploadedAt);
      return fileDate < cutoffDate;
    });
    
    if (filesToDelete.length === 0) {
      console.log('✅ No old backups to clean up');
      return;
    }
    
    console.log(`🗑️ Deleting ${filesToDelete.length} old backup files...`);
    
    for (const file of filesToDelete) {
      try {
        await del(file.url, { token: BLOB_TOKEN });
        console.log(`✅ Deleted: ${file.pathname}`);
      } catch (deleteError) {
        console.error(`❌ Failed to delete ${file.pathname}:`, deleteError.message);
      }
    }
    
    console.log(`✅ Cleanup completed: ${filesToDelete.length} files deleted`);
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    // Don't throw - cleanup failure shouldn't fail the entire backup
  }
}

// Environment validation function
function validateEnvironment() {
  const required = ['DATABASE_URL', 'BLOB_READ_WRITE_TOKEN'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
  
  console.log('✅ Environment validation passed');
  console.log('🔍 Environment Debug:');
  console.log('  NODE_ENV:', process.env.NODE_ENV);
  console.log('  BLOB_TOKEN exists:', !!BLOB_TOKEN);
  console.log('  BLOB_TOKEN length:', BLOB_TOKEN ? BLOB_TOKEN.length : 0);
  console.log('  DATABASE_URL exists:', !!DATABASE_URL);
  console.log('  DATABASE_URL starts with:', DATABASE_URL ? DATABASE_URL.substring(0, 20) + '...' : 'NOT SET');
}

// Vercel Function Handler
module.exports = async (req, res) => {
  console.log('🚀 Vercel Cron Job triggered for backup');
  console.log('User Agent:', req.headers['user-agent']);
  console.log('Request Method:', req.method);
  console.log('Request URL:', req.url);
  console.log('Timestamp:', new Date().toISOString());
  
  // Validate environment first
  try {
    validateEnvironment();
  } catch (error) {
    console.error('❌ Environment validation failed:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Environment validation failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
  
  // Verify this is a Vercel cron request (more flexible)
  const userAgent = req.headers['user-agent'];
  if (!userAgent || !userAgent.includes('vercel-cron')) {
    console.log('⚠️ Request not from Vercel cron, ignoring');
    console.log('  Expected: vercel-cron user agent');
    console.log('  Received:', userAgent);
    return res.status(403).json({
      success: false,
      message: 'Access denied - only Vercel cron jobs allowed',
      receivedUserAgent: userAgent,
      timestamp: new Date().toISOString()
    });
  }
  
  try {
    console.log('🔄 Starting backup process...');
    
    // Perform backup
    const backupResult = await createBackup();
    
    if (!backupResult.success) {
      throw new Error(`Backup creation failed: ${backupResult.error || 'Unknown error'}`);
    }
    
    console.log('✅ Backup created successfully');
    console.log(`📊 Backup details: ${backupResult.fileName}, ${(backupResult.size / 1024 / 1024).toFixed(2)} MB`);
    
    // Clean up old backups
    console.log('🧹 Starting cleanup process...');
    await cleanupOldBackups();
    console.log('✅ Cleanup completed');
    
    console.log('✅ Cron backup completed successfully');
    
    res.status(200).json({
      success: true,
      message: 'Backup completed successfully',
      data: backupResult,
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        blobTokenConfigured: !!BLOB_TOKEN,
        databaseUrlConfigured: !!DATABASE_URL
      }
    });
    
  } catch (error) {
    console.error('❌ Cron backup failed:', error);
    console.error('❌ Error stack:', error.stack);
    
    // Log additional context for debugging
    console.error('🔍 Failure context:');
    console.error('  Environment:', process.env.NODE_ENV);
    console.error('  Blob token available:', !!BLOB_TOKEN);
    console.error('  Database URL available:', !!DATABASE_URL);
    console.error('  User agent:', req.headers['user-agent']);
    
    res.status(500).json({
      success: false,
      message: 'Backup failed',
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context: {
        environment: process.env.NODE_ENV,
        blobTokenConfigured: !!BLOB_TOKEN,
        databaseUrlConfigured: !!DATABASE_URL,
        userAgent: req.headers['user-agent']
      }
    });
  } finally {
    // Close database connection
    if (dbPool) {
      try {
        await dbPool.end();
        console.log('🔌 Database connection closed');
      } catch (closeError) {
        console.error('❌ Error closing database connection:', closeError.message);
      }
    }
  }
};
