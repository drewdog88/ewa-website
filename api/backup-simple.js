const express = require('express');
const { list, put, del } = require('@vercel/blob');
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const cron = require('node-cron');

const router = express.Router();

// Authentication middleware for admin access
const requireAdmin = async (req, res, next) => {
  try {
    // Get the session token from the request headers or query params
    const sessionToken = req.headers['x-session-token'] || req.query.token;
        
    if (!sessionToken) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required. Please log in.',
        error: 'No session token provided'
      });
    }

    // Import the getUsers function
    const { getUsers } = require('../database/neon-functions');
    const users = await getUsers();
    const user = users[sessionToken];

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication failed. Please log in again.',
        error: 'Invalid session token'
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(403).json({ 
        success: false, 
        message: 'Account is locked. Please contact administrator.',
        error: 'Account locked'
      });
    }

    // Check if user has admin role
    if (user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin access required',
        error: 'Insufficient permissions'
      });
    }

    // Add user info to request for potential use
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Authentication system error',
      error: error.message
    });
  }
};

// Standardized blob token configuration
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

// Safety check for blob token
if (!BLOB_TOKEN) {
  console.error('❌ BLOB_READ_WRITE_TOKEN not configured - backup system will not work');
  console.error('💡 Please set BLOB_READ_WRITE_TOKEN in your environment');
  console.error('💡 Current environment:', process.env.NODE_ENV || 'development');
  console.error('💡 Available environment variables:', Object.keys(process.env).filter(key => key.includes('BLOB')));
} else {
  console.log('✅ Blob token configured for backup system');
  console.log('💡 Environment:', process.env.NODE_ENV || 'development');
  console.log('💡 Token starts with:', BLOB_TOKEN.substring(0, 20) + '...');
  console.log('💡 Token length:', BLOB_TOKEN.length);
  console.log('💡 Configuration validated at:', new Date().toISOString());
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
router.get('/test', requireAdmin, async (req, res) => {
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
router.get('/status', requireAdmin, async (req, res) => {
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
router.get('/list', requireAdmin, async (req, res) => {
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
router.post('/create', requireAdmin, async (req, res) => {
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
      // Create full backup using the working BackupManager
      try {
        console.log('🚀 Starting full backup via API...');
        
        const BackupManager = require('../backup/backup-manager');
        console.log('✅ BackupManager loaded successfully');
        
        const backupManager = new BackupManager();
        console.log('✅ BackupManager instance created');
        
        const result = await backupManager.performFullBackup();
        console.log('✅ BackupManager.performFullBackup() completed');
        console.log('📋 BackupManager result:', JSON.stringify(result, null, 2));
        
        console.log('✅ Full backup completed via API');
        console.log(`   📊 Database: ${(result.databaseSize / 1024).toFixed(2)} KB`);
        console.log(`   📁 Blob Files: ${result.blobCount || 0} files`);
        console.log(`   📦 Total Size: ${(result.totalSize / 1024 / 1024).toFixed(2)} MB`);

        res.json({
          success: true,
          message: 'Full backup created successfully',
          data: {
            backupId: `full-backup-${result.timestamp}`,
            timestamp: result.timestamp,
            size: result.totalSize,
            duration: result.duration,
            database: {
              size: result.databaseSize,
              file: 'database/database-backup.sql'
            },
            blob: {
              size: result.blobSize,
              fileCount: result.blobCount
            }
          }
        });
      } catch (error) {
        console.error('❌ Full backup failed via API:', error.message);
        console.error('❌ Full error stack:', error.stack);
        res.status(500).json({
          success: false,
          message: 'Failed to create full backup',
          error: error.message
        });
      }
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
router.post('/delete', requireAdmin, async (req, res) => {
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
router.post('/analyze', requireAdmin, async (req, res) => {
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
    // More robust SQL parsing - handle multi-line statements
    const lines = sqlContent.split('\n');
    let currentStatement = '';
    let insertStatements = [];
    let inInsertStatement = false;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip comments and empty lines
      if (trimmedLine.startsWith('--') || trimmedLine === '') {
        continue;
      }
      
      // Check if this line starts an INSERT statement
      if (trimmedLine.toUpperCase().startsWith('INSERT INTO')) {
        inInsertStatement = true;
        currentStatement = trimmedLine;
      } else if (inInsertStatement) {
        // Continue building the INSERT statement
        currentStatement += ' ' + trimmedLine;
      }
      
      // If line ends with semicolon and we're in an INSERT statement, complete it
      if (trimmedLine.endsWith(';') && inInsertStatement) {
        const statement = currentStatement.trim();
        insertStatements.push(statement);
        currentStatement = '';
        inInsertStatement = false;
      }
    }
    
    // Process INSERT statements and aggregate by table name
    const tableCounts = {};
    
    for (const statement of insertStatements) {
      // Extract table name - handle quoted identifiers and optional column list
      const tableMatch = statement.match(/INSERT INTO\s+["']?(\w+)["']?\s*(?:\([^)]*\))?\s*VALUES/i);
      if (tableMatch) {
        const tableName = tableMatch[1];
        
        let recordCount = 1; // Default fallback
        
        // More precise record counting - look for complete record tuples
        // This regex looks for patterns like (value1, value2, ...) that are complete records
        // It avoids matching nested parentheses within the data values
        const valuesMatch = statement.match(/VALUES\s*(.+);/i);
        if (valuesMatch) {
          const valuesSection = valuesMatch[1];
          
          // Split by commas that are outside of parentheses
          // This is a more sophisticated approach to count actual records
          recordCount = 0;
          let parenDepth = 0;
          let inString = false;
          let stringChar = '';
          
          for (let i = 0; i < valuesSection.length; i++) {
            const char = valuesSection[i];
            
            // Handle string literals
            if ((char === "'" || char === '"') && (i === 0 || valuesSection[i-1] !== '\\')) {
              if (!inString) {
                inString = true;
                stringChar = char;
              } else if (char === stringChar) {
                inString = false;
              }
            }
            
            // Only process parentheses when not inside a string
            if (!inString) {
              if (char === '(') {
                parenDepth++;
                // If this is the start of a new record tuple
                if (parenDepth === 1) {
                  recordCount++;
                }
              } else if (char === ')') {
                parenDepth--;
              }
            }
          }
          
          // Ensure we have at least 1 record if no parentheses found
          if (recordCount === 0) {
            recordCount = 1;
          }
        }
        
        // Aggregate records by table name
        if (tableCounts[tableName]) {
          tableCounts[tableName] += recordCount;
        } else {
          tableCounts[tableName] = recordCount;
        }
      }
    }
    
    // Convert aggregated counts to tableDetails array
    for (const [tableName, recordCount] of Object.entries(tableCounts)) {
      analysis.tableDetails.push({
        name: tableName,
        records: recordCount,
        description: `${recordCount} records`
      });
      
      analysis.totalRecords += recordCount;
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
router.post('/restore', requireAdmin, async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Database restore not implemented yet - requires non-production database for testing'
  });
});

// Start scheduled backups
router.post('/schedule/start', requireAdmin, async (req, res) => {
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
router.post('/schedule/stop', requireAdmin, async (req, res) => {
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
router.get('/schedule/status', requireAdmin, async (req, res) => {
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

// Health check endpoint for monitoring
router.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      components: {}
    };

    // Check blob storage
    if (BLOB_TOKEN) {
      try {
        const { blobs } = await list({ token: BLOB_TOKEN });
        health.components.blobStorage = {
          status: 'healthy',
          fileCount: blobs.length,
          totalSize: blobs.reduce((sum, blob) => sum + (blob.size || 0), 0)
        };
      } catch (error) {
        health.components.blobStorage = {
          status: 'unhealthy',
          error: error.message
        };
        health.status = 'degraded';
      }
    } else {
      health.components.blobStorage = {
        status: 'unavailable',
        error: 'BLOB_READ_WRITE_TOKEN not configured'
      };
      health.status = 'degraded';
    }

    // Check database
    if (dbPool) {
      try {
        const result = await dbPool.query('SELECT NOW() as current_time');
        health.components.database = {
          status: 'healthy',
          currentTime: result.rows[0].current_time
        };
      } catch (error) {
        health.components.database = {
          status: 'unhealthy',
          error: error.message
        };
        health.status = 'degraded';
      }
    } else {
      health.components.database = {
        status: 'unavailable',
        error: 'Database pool not initialized'
      };
      health.status = 'degraded';
    }

    // Check CRON job status
    health.components.cronJob = {
      status: 'configured',
      schedule: '0 10 * * * (Daily at 10:00 AM UTC)',
      endpoint: '/api/cron-backup',
      note: 'Vercel CRON job - status cannot be determined from this endpoint'
    };

    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);

  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
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
