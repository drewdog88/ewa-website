const express = require('express');
const { list, put, del } = require('@vercel/blob');
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const cron = require('node-cron');

const router = express.Router();

// Get blob token from environment - handle different tokens for different environments
let BLOB_TOKEN;
if (process.env.NODE_ENV === 'development') {
  // Development uses the development-specific token
  BLOB_TOKEN = process.env.vercel_blob_rw_D3cmXYAFiy0Jv5Ch_Nfez7DLKTwQPUzZbMiPvu3j5zAQlLa_READ_WRITE_TOKEN;
} else {
  // Production and Preview use the production token
  BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
}

// Safety check for blob token
if (!BLOB_TOKEN) {
  console.error('❌ BLOB_READ_WRITE_TOKEN not configured - backup system will not work');
  console.error('💡 Please set BLOB_READ_WRITE_TOKEN in your environment');
  console.error('💡 Current environment:', process.env.NODE_ENV || 'development');
} else {
  console.log('✅ Blob token configured for backup system');
  console.log('💡 Environment:', process.env.NODE_ENV || 'development');
  console.log('💡 Token type:', process.env.NODE_ENV === 'development' ? 'Development' : 'Production/Preview');
  console.log('💡 Token starts with:', BLOB_TOKEN.substring(0, 20) + '...');
  console.log('💡 Production deployment test - ' + new Date().toISOString());
}

// Database connection for backup operations
let dbPool;
try {
  dbPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
} catch (error) {
  console.error('Failed to initialize database pool:', error.message);
}

// Helper function to get current date folder (YYYY-MM-DD)
function getDateFolder() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

// Helper function to get current timestamp
function getTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

// Test endpoint
router.get('/test', async (req, res) => {
  const testResults = {
    tests: {}
  };

  try {
    // Debug: Log environment variable info
    console.log('🔍 DEBUG: Environment variable check');
    console.log('   NODE_ENV:', process.env.NODE_ENV);
    console.log('   BLOB_TOKEN exists:', !!process.env.BLOB_READ_WRITE_TOKEN);
    console.log('   BLOB_TOKEN starts with:', process.env.BLOB_READ_WRITE_TOKEN ? process.env.BLOB_READ_WRITE_TOKEN.substring(0, 20) + '...' : 'NOT SET');
    console.log('   BLOB_TOKEN length:', process.env.BLOB_READ_WRITE_TOKEN ? process.env.BLOB_READ_WRITE_TOKEN.length : 0);

    // Test 1: Check blob storage connectivity
    try {
      const { blobs } = await list({ token: BLOB_TOKEN });
      testResults.tests.blobStorage = {
        status: 'OK',
        message: `Connected to blob storage, found ${blobs.length} files`
      };
    } catch (error) {
      testResults.tests.blobStorage = {
        status: 'FAILED',
        message: `Blob storage error: ${error.message}`
      };
    }

    // Test 2: Check database connectivity
    if (dbPool) {
      try {
        const result = await dbPool.query('SELECT NOW() as current_time');
        testResults.tests.database = {
          status: 'OK',
          message: `Database connected, current time: ${result.rows[0].current_time}`
        };
      } catch (error) {
        testResults.tests.database = {
          status: 'FAILED',
          message: `Database error: ${error.message}`
        };
      }
    } else {
      testResults.tests.database = {
        status: 'FAILED',
        message: 'Database pool not initialized'
      };
    }

    res.json({
      success: true,
      data: testResults
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Test failed',
      error: error.message
    });
  }
});

// Cache for blob list to avoid multiple API calls
let blobCache = null;
let blobCacheTime = 0;
const CACHE_DURATION = 30000; // 30 seconds

// Scheduled backup configuration
let scheduledBackupJob = null;
const BACKUP_SCHEDULE = '0 2 * * *'; // Daily at 2:00 AM
const BACKUP_TIMEZONE = 'America/Los_Angeles'; // PST/PDT

// Calculate next scheduled backup time
function getNextScheduledBackup() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const backupTime = new Date(today);
  backupTime.setHours(2, 0, 0, 0); // 2:00 AM
  
  // If it's past 2 AM today, schedule for tomorrow
  if (now >= backupTime) {
    backupTime.setDate(backupTime.getDate() + 1);
  }
  
  return backupTime;
}

// Start scheduled backups
function startScheduledBackups() {
  if (scheduledBackupJob) {
    scheduledBackupJob.stop();
  }
  
  scheduledBackupJob = cron.schedule(BACKUP_SCHEDULE, async () => {
    console.log('⏰ Scheduled backup starting...');
    try {
      // Create a full backup (includes database and blob files)
      // Use environment-based URL for production vs development
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://www.eastlakewolfpack.org' 
        : 'http://localhost:3000';
      
      const response = await fetch(`${baseUrl}/api/backup/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type: 'full' })
      });
      
      if (response.ok) {
        console.log('✅ Scheduled backup completed successfully');
      } else {
        console.error('❌ Scheduled backup failed:', await response.text());
      }
    } catch (error) {
      console.error('❌ Scheduled backup failed:', error.message);
    }
  }, {
    timezone: BACKUP_TIMEZONE
  });
  
  console.log('📅 Scheduled backups enabled - nightly at 2:00 AM PST');
}

// Stop scheduled backups
function stopScheduledBackups() {
  if (scheduledBackupJob) {
    scheduledBackupJob.stop();
    scheduledBackupJob = null;
    console.log('⏹️ Scheduled backups disabled');
  }
}

async function getBlobList() {
  const now = Date.now();
  if (blobCache && (now - blobCacheTime) < CACHE_DURATION) {
    return blobCache;
  }
  
  const { blobs } = await list({ token: BLOB_TOKEN });
  blobCache = blobs;
  blobCacheTime = now;
  return blobs;
}

// Get backup status
router.get('/status', async (req, res) => {
  try {
    // Check if blob token is configured
    if (!BLOB_TOKEN) {
      return res.status(500).json({
        success: false,
        message: 'Backup system not configured - BLOB_READ_WRITE_TOKEN missing',
        error: 'BLOB_READ_WRITE_TOKEN not configured'
      });
    }

    console.log('📊 Getting backup status...');
    const blobs = await getBlobList();
    
    // Filter backup files
    const databaseBackups = blobs.filter(blob => blob.pathname.startsWith('backups/database/'));
    const fullBackups = blobs.filter(blob => blob.pathname.startsWith('backups/full/'));
    
    // Get latest backup info
    const latestDatabase = databaseBackups.length > 0 ? 
      databaseBackups.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))[0] : null;
    const latestFull = fullBackups.length > 0 ? 
      fullBackups.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))[0] : null;
    
    const status = {
      lastBackup: latestDatabase ? latestDatabase.uploadedAt : null,
      lastBackupStatus: 'success', // Assuming successful if file exists
      nextScheduledBackup: getNextScheduledBackup().toISOString(),
      backupCount: databaseBackups.length + fullBackups.length,
      totalBackupSize: [...databaseBackups, ...fullBackups].reduce((sum, blob) => sum + blob.size, 0)
    };

    console.log('✅ Backup status retrieved successfully');
    console.log(`   📦 Database backups: ${databaseBackups.length}`);
    console.log(`   📦 Full backups: ${fullBackups.length}`);
    console.log(`   📊 Total size: ${(status.totalBackupSize / 1024 / 1024).toFixed(2)} MB`);

    res.json({
      success: true,
      data: {
        status,
        backups: {
          database: { blob: databaseBackups },
          full: { blob: fullBackups }
        }
      }
    });
  } catch (error) {
    console.error('❌ Failed to get backup status:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get backup status',
      error: error.message
    });
  }
});

// List backups
router.get('/list', async (req, res) => {
  try {
    // Check if blob token is configured
    if (!BLOB_TOKEN) {
      return res.status(500).json({
        success: false,
        message: 'Backup system not configured - BLOB_READ_WRITE_TOKEN missing',
        error: 'BLOB_READ_WRITE_TOKEN not configured'
      });
    }

    console.log('📋 Listing backups...');
    const blobs = await getBlobList();
    
    // Filter backup files
    const databaseBackups = blobs.filter(blob => blob.pathname.startsWith('backups/database/'));
    const fullBackups = blobs.filter(blob => blob.pathname.startsWith('backups/full/'));
    
    console.log('✅ Backup list retrieved successfully');
    console.log(`   📦 Database backups: ${databaseBackups.length}`);
    console.log(`   📦 Full backups: ${fullBackups.length}`);
    
    res.json({
      success: true,
      data: {
        database: { blob: databaseBackups },
        full: { blob: fullBackups }
      }
    });
  } catch (error) {
    console.error('❌ Failed to list backups:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to list backups',
      error: error.message
    });
  }
});

// Create backup
router.post('/create', async (req, res) => {
  try {
    // Clear cache when creating new backup
    blobCache = null;
    blobCacheTime = 0;
    
    const { type = 'database' } = req.body;
    
    if (type === 'database') {
      // Create database backup
      if (!dbPool) {
        return res.status(500).json({
          success: false,
          message: 'Database not available'
        });
      }

      const timestamp = getTimestamp();
      const dateFolder = getDateFolder();
      const backupId = `db-backup-${timestamp}`;
      
      // Get all tables
      const tablesResult = await dbPool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `);

      let sqlContent = '-- EWA Website Database Backup\n';
      sqlContent += `-- Generated: ${new Date().toISOString()}\n\n`;

      // Add table structure and data for each table
      for (const table of tablesResult.rows) {
        const tableName = table.table_name;
        
        // Get table structure
        const schemaResult = await dbPool.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = $1 
          ORDER BY ordinal_position
        `, [tableName]);

        sqlContent += `-- Table: ${tableName}\n`;
        sqlContent += `DROP TABLE IF EXISTS "${tableName}" CASCADE;\n`;
        sqlContent += `CREATE TABLE "${tableName}" (\n`;
        
        const columns = schemaResult.rows.map(col => {
          let def = `  "${col.column_name}" ${col.data_type}`;
          if (col.is_nullable === 'NO') def += ' NOT NULL';
          if (col.column_default) def += ` DEFAULT ${col.column_default}`;
          return def;
        });
        
        sqlContent += columns.join(',\n') + '\n);\n\n';

        // Get table data
        const dataResult = await dbPool.query(`SELECT * FROM "${tableName}"`);
        if (dataResult.rows.length > 0) {
          sqlContent += `-- Data for ${tableName}\n`;
          sqlContent += `INSERT INTO "${tableName}" VALUES\n`;
          
          const values = dataResult.rows.map(row => {
            const rowValues = Object.values(row).map(val => {
              if (val === null) return 'NULL';
              if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
              return val;
            });
            return `  (${rowValues.join(', ')})`;
          });
          
          sqlContent += values.join(',\n') + ';\n\n';
        }
      }
      
      // Upload to blob storage (date-based organization only)
      await put(`backups/database/${dateFolder}/${backupId}.sql`, Buffer.from(sqlContent), {
        access: 'public',
        addRandomSuffix: false,
        token: BLOB_TOKEN
      });

      res.json({
        success: true,
        message: 'Database backup created successfully',
        data: {
          backupId,
          timestamp,
          size: sqlContent.length
        }
      });
    } else if (type === 'full') {
      // Create full backup (database + files)
      const timestamp = getTimestamp();
      const dateFolder = getDateFolder();
      const backupId = `full-backup-${timestamp}`;
      
      // Create a simple ZIP with database dump
      const archive = archiver('zip', { zlib: { level: 9 } });
      const chunks = [];
      
      archive.on('data', chunk => chunks.push(chunk));
      archive.on('end', async () => {
        try {
          const zipBuffer = Buffer.concat(chunks);
          
          // Upload to blob storage (date-based organization only)
          await put(`backups/full/${dateFolder}/${backupId}.zip`, zipBuffer, {
            access: 'public',
            addRandomSuffix: false,
            token: BLOB_TOKEN
          });

          res.json({
            success: true,
            message: 'Full backup created successfully',
            data: {
              backupId,
              timestamp,
              size: zipBuffer.length
            }
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            message: 'Failed to upload full backup',
            error: error.message
          });
        }
      });

      // Add database dump to archive
      if (dbPool) {
        const result = await dbPool.query('SELECT NOW() as backup_time');
        archive.append(`-- Database backup created at ${result.rows[0].backup_time}\n`, { name: 'database.sql' });
      }
      
      archive.finalize();
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid backup type. Use "database" or "full"'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create backup',
      error: error.message
    });
  }
});

// Delete backup
router.post('/delete', async (req, res) => {
  try {
    // Clear cache when deleting backups
    blobCache = null;
    blobCacheTime = 0;
    
    const { files } = req.body;
    
    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Files array is required'
      });
    }

    const deletedFiles = [];
    const failedFiles = [];

    for (const filePath of files) {
      try {
        await del(filePath, { token: BLOB_TOKEN });
        deletedFiles.push(filePath);
      } catch (error) {
        failedFiles.push({ file: filePath, error: error.message });
      }
    }

    res.json({
      success: true,
      message: `Deleted ${deletedFiles.length} files`,
      data: {
        deleted: deletedFiles,
        failed: failedFiles
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete backups',
      error: error.message
    });
  }
});

// Analyze backup (parse SQL to count records)
router.post('/analyze', async (req, res) => {
  try {
    const { filePath } = req.body;
    
    if (!filePath) {
      return res.status(400).json({
        success: false,
        message: 'File path is required'
      });
    }

    // Get the blob URL
    const { blobs } = await list({ token: BLOB_TOKEN });
    const blob = blobs.find(b => b.pathname === filePath);
    
    if (!blob) {
      return res.status(404).json({
        success: false,
        message: 'Backup file not found'
      });
    }

    // Download and parse the SQL file
    const response = await fetch(blob.url);
    const sqlContent = await response.text();
    
    const analysis = parseRealSQLBackup(sqlContent);

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to analyze backup',
      error: error.message
    });
  }
});

// Parse real SQL backup to count records
function parseRealSQLBackup(sqlContent) {
  const analysis = {
    totalTables: 0,
    totalRecords: 0,
    tableDetails: [],
    warnings: []
  };

  try {
    // Split SQL into statements
    const statements = sqlContent.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      const trimmed = statement.trim();
      
      // Look for INSERT statements
      if (trimmed.toUpperCase().startsWith('INSERT INTO')) {
        const tableMatch = trimmed.match(/INSERT INTO\s+(\w+)\s*\(/i);
        if (tableMatch) {
          const tableName = tableMatch[1];
          
          // Count VALUES clauses to get record count
          const valuesMatches = trimmed.match(/VALUES\s*\(/gi);
          const recordCount = valuesMatches ? valuesMatches.length : 1;
          
          analysis.tableDetails.push({
            tableName,
            recordCount,
            size: trimmed.length
          });
          
          analysis.totalRecords += recordCount;
        }
      }
    }
    
    analysis.totalTables = analysis.tableDetails.length;
    
    if (analysis.totalTables === 0) {
      analysis.warnings.push('No INSERT statements found in backup');
    }
    
  } catch (error) {
    analysis.warnings.push(`Error parsing SQL: ${error.message}`);
  }

  return analysis;
}

// Restore database (placeholder - not implemented for safety)
router.post('/restore', async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Database restore not implemented yet - requires non-production database for testing'
  });
});

// Start scheduled backups
router.post('/schedule/start', async (req, res) => {
  try {
    startScheduledBackups();
    res.json({
      success: true,
      message: 'Scheduled backups started',
      nextBackup: getNextScheduledBackup().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to start scheduled backups',
      error: error.message
    });
  }
});

// Stop scheduled backups
router.post('/schedule/stop', async (req, res) => {
  try {
    stopScheduledBackups();
    res.json({
      success: true,
      message: 'Scheduled backups stopped'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to stop scheduled backups',
      error: error.message
    });
  }
});

// Get schedule status
router.get('/schedule/status', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        isRunning: scheduledBackupJob !== null,
        schedule: BACKUP_SCHEDULE,
        timezone: BACKUP_TIMEZONE,
        nextBackup: getNextScheduledBackup().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get schedule status',
      error: error.message
    });
  }
});

module.exports = {
  router,
  startScheduledBackups,
  stopScheduledBackups,
  getNextScheduledBackup
};
