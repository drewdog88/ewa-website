#!/usr/bin/env node

/**
 * Weekly Full System Backup Script
 * 
 * This script performs a comprehensive full system backup including:
 * - Database backup with transaction isolation
 * - Blob storage backup with infinite loop prevention
 * - Local assets backup
 * - Full system backup with metadata
 * - Upload to Vercel Blob storage
 * 
 * Features:
 * - Comprehensive error handling and logging
 * - Backup metadata tracking in database
 * - Timeout protection (30 minutes max)
 * - Infinite loop prevention for backup files
 * - Detailed reporting and validation
 */

const path = require('path');
const fs = require('fs').promises;
const BackupManager = require('../backup/backup-manager');

// Ensure we're using the correct environment file
require('dotenv').config({ path: '.env.local' });

class WeeklyFullBackupRunner {
  constructor() {
    this.backupManager = new BackupManager();
    this.logDir = path.join(__dirname, '..', 'backup-logs');
    this.startTime = Date.now();
  }

  async ensureLogDirectory() {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
    } catch (error) {
      console.error('❌ Failed to create log directory:', error);
    }
  }

  async log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}`;
    console.log(logMessage);
    
    // Also write to log file
    try {
      const logFile = path.join(this.logDir, `weekly-backup-${new Date().toISOString().split('T')[0]}.log`);
      await fs.appendFile(logFile, logMessage + '\n');
    } catch (error) {
      console.error('❌ Failed to write to log file:', error);
    }
  }

  async validateEnvironment() {
    const required = ['DATABASE_URL', 'BLOB_READ_WRITE_TOKEN'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing environment variables: ${missing.join(', ')}`);
    }
    
    await this.log('✅ Environment validation passed');
    await this.log(`🔍 Environment Debug:`);
    await this.log(`  NODE_ENV: ${process.env.NODE_ENV}`);
    await this.log(`  BLOB_TOKEN exists: ${!!process.env.BLOB_READ_WRITE_TOKEN}`);
    await this.log(`  BLOB_TOKEN length: ${process.env.BLOB_READ_WRITE_TOKEN ? process.env.BLOB_READ_WRITE_TOKEN.length : 0}`);
    await this.log(`  DATABASE_URL exists: ${!!process.env.DATABASE_URL}`);
    await this.log(`  DATABASE_URL starts with: ${process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + '...' : 'NOT SET'}`);
  }

  async runComprehensiveTest() {
    try {
      await this.log('🧪 Running comprehensive backup system test...');
      
      // Run the comprehensive test script
      const { exec } = require('child_process');
      const util = require('util');
      const execAsync = util.promisify(exec);
      
      const { stdout, stderr } = await execAsync('npm run test:backup:comprehensive', {
        cwd: path.join(__dirname, '..'),
        env: { ...process.env }
      });
      
      if (stderr && !stderr.includes('✅') && !stderr.includes('🎉')) {
        throw new Error(`Test failed: ${stderr}`);
      }
      
      await this.log('✅ Comprehensive backup system test passed');
      return true;
    } catch (error) {
      await this.log(`❌ Comprehensive test failed: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  async performFullBackup() {
    try {
      await this.log('🚀 Starting weekly full system backup...');
      
      // Set timeout for the entire backup process (25 minutes to allow for 30-minute GitHub Actions timeout)
      const backupTimeout = setTimeout(() => {
        throw new Error('Backup process timeout after 25 minutes');
      }, 25 * 60 * 1000);
      
      try {
        const backupResult = await this.backupManager.performFullBackup();
        clearTimeout(backupTimeout);
        
        await this.log(`✅ Full system backup completed successfully`);
        await this.log(`📊 Backup details: ${backupResult.file}, ${(backupResult.totalSize / 1024 / 1024).toFixed(2)} MB`);
        await this.log(`💾 Database: ${(backupResult.databaseSize / 1024).toFixed(2)} KB`);
        await this.log(`📁 Blob files: ${backupResult.blobCount} files (${(backupResult.blobSize / 1024 / 1024).toFixed(2)} MB)`);
        await this.log(`📂 Local assets: ${backupResult.localAssetsCount} files (${(backupResult.localAssetsSize / 1024 / 1024).toFixed(2)} MB)`);
        
        return backupResult;
      } catch (error) {
        clearTimeout(backupTimeout);
        throw error;
      }
    } catch (error) {
      await this.log(`❌ Full system backup failed: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  // Note: Database backup cleanup is intentionally disabled for safety
  // Database backups should only be cleaned up manually after careful review

  async generateBackupReport(backupResult, cleanupResult) {
    const duration = Date.now() - this.startTime;
    const report = {
      timestamp: new Date().toISOString(),
      type: 'weekly-full-backup',
      duration: duration,
      success: true,
      backup: {
        file: backupResult.file,
        size: backupResult.totalSize,
        timestamp: backupResult.timestamp,
        databaseSize: backupResult.databaseSize,
        blobSize: backupResult.blobSize,
        blobCount: backupResult.blobCount,
        localAssetsCount: backupResult.localAssetsCount,
        localAssetsSize: backupResult.localAssetsSize
      },
      cleanup: cleanupResult || { deletedCount: 0, freedSpace: 0 },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        blobTokenConfigured: !!process.env.BLOB_READ_WRITE_TOKEN,
        databaseUrlConfigured: !!process.env.DATABASE_URL
      }
    };

    try {
      const reportFile = path.join(this.logDir, `weekly-backup-report-${new Date().toISOString().split('T')[0]}.json`);
      await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
      await this.log(`📄 Backup report saved: ${reportFile}`);
    } catch (error) {
      await this.log(`❌ Failed to save backup report: ${error.message}`, 'ERROR');
    }

    return report;
  }

  async run() {
    try {
      await this.log('🚀 Weekly Full System Backup Started');
      await this.log(`📅 Date: ${new Date().toISOString()}`);
      await this.log(`🏃 Runner: GitHub Actions`);
      
      // Ensure log directory exists
      await this.ensureLogDirectory();
      
      // Validate environment
      await this.validateEnvironment();
      
      // Run comprehensive test first
      await this.runComprehensiveTest();
      
      // Perform full system backup
      const backupResult = await this.performFullBackup();
      
      // Note: Database backups are never automatically cleaned up for safety
      const cleanupResult = { deletedCount: 0, freedSpace: 0, message: 'No cleanup performed - database backups preserved for safety' };
      
      // Generate report
      const report = await this.generateBackupReport(backupResult, cleanupResult);
      
      await this.log('✅ Weekly full system backup completed successfully');
      await this.log(`📊 Total duration: ${report.duration}ms`);
      await this.log(`📈 Backup size: ${(report.backup.size / 1024 / 1024).toFixed(2)} MB`);
      await this.log(`🔒 Safety: Database backups preserved (no automatic cleanup)`);
      
      return report;
      
    } catch (error) {
      await this.log(`❌ Weekly full backup failed: ${error.message}`, 'ERROR');
      await this.log(`❌ Error stack: ${error.stack}`, 'ERROR');
      
      // Log additional context for debugging
      await this.log('🔍 Failure context:', 'ERROR');
      await this.log(`  Environment: ${process.env.NODE_ENV}`, 'ERROR');
      await this.log(`  Blob token available: ${!!process.env.BLOB_READ_WRITE_TOKEN}`, 'ERROR');
      await this.log(`  Database URL available: ${!!process.env.DATABASE_URL}`, 'ERROR');
      
      // Generate error report
      const errorReport = {
        timestamp: new Date().toISOString(),
        type: 'weekly-full-backup',
        duration: Date.now() - this.startTime,
        success: false,
        error: error.message,
        stack: error.stack,
        context: {
          environment: process.env.NODE_ENV,
          blobTokenConfigured: !!process.env.BLOB_READ_WRITE_TOKEN,
          databaseUrlConfigured: !!process.env.DATABASE_URL
        }
      };

      try {
        const errorReportFile = path.join(this.logDir, `weekly-backup-error-${new Date().toISOString().split('T')[0]}.json`);
        await fs.writeFile(errorReportFile, JSON.stringify(errorReport, null, 2));
        await this.log(`📄 Error report saved: ${errorReportFile}`);
      } catch (reportError) {
        await this.log(`❌ Failed to save error report: ${reportError.message}`, 'ERROR');
      }
      
      throw error;
    } finally {
      // Close database connection
      try {
        await this.backupManager.close();
        await this.log('🔌 Database connection closed');
      } catch (closeError) {
        await this.log(`❌ Error closing database connection: ${closeError.message}`, 'ERROR');
      }
    }
  }
}

// Run the backup if this script is executed directly
if (require.main === module) {
  const runner = new WeeklyFullBackupRunner();
  runner.run()
    .then((report) => {
      console.log('🎉 Weekly full backup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Weekly full backup failed:', error.message);
      process.exit(1);
    });
}

module.exports = WeeklyFullBackupRunner;
