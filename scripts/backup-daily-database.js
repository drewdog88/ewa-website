#!/usr/bin/env node

/**
 * Daily Database Backup Script
 * 
 * This script performs a daily database backup using the existing backup manager.
 * It's designed to run in GitHub Actions with proper error handling and logging.
 * 
 * Features:
 * - Database backup with transaction isolation
 * - Upload to Vercel Blob storage
 * - Comprehensive error handling and logging
 * - Backup metadata tracking
 * - Cleanup of old backups
 */

const path = require('path');
const fs = require('fs').promises;
const ServerlessBackupManager = require('../backup/backup-manager-serverless');

// Ensure we're using the correct environment file
require('dotenv').config({ path: '.env.local' });

class DailyBackupRunner {
  constructor() {
    this.backupManager = new ServerlessBackupManager();
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
      const logFile = path.join(this.logDir, `daily-backup-${new Date().toISOString().split('T')[0]}.log`);
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

  async performDatabaseBackup() {
    try {
      await this.log('🔄 Starting daily database backup...');
      
      // Create database backup
      const backupResult = await this.backupManager.createDatabaseBackup();
      
      await this.log(`✅ Database backup created successfully`);
      await this.log(`📊 Backup details: ${backupResult.file}, ${(backupResult.size / 1024).toFixed(2)} KB`);
      
      return backupResult;
    } catch (error) {
      await this.log(`❌ Database backup failed: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  // Note: Database backup cleanup is intentionally disabled for safety
  // Database backups should only be cleaned up manually after careful review

  async generateBackupReport(backupResult, cleanupResult) {
    const duration = Date.now() - this.startTime;
    const report = {
      timestamp: new Date().toISOString(),
      type: 'daily-database-backup',
      duration: duration,
      success: true,
      backup: {
        file: backupResult.file,
        size: backupResult.size,
        timestamp: backupResult.timestamp
      },
      cleanup: cleanupResult || { deletedCount: 0, totalSizeFreed: 0 },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        blobTokenConfigured: !!process.env.BLOB_READ_WRITE_TOKEN,
        databaseUrlConfigured: !!process.env.DATABASE_URL
      }
    };

    try {
      const reportFile = path.join(this.logDir, `daily-backup-report-${new Date().toISOString().split('T')[0]}.json`);
      await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
      await this.log(`📄 Backup report saved: ${reportFile}`);
    } catch (error) {
      await this.log(`❌ Failed to save backup report: ${error.message}`, 'ERROR');
    }

    return report;
  }

  async run() {
    try {
      await this.log('🚀 Daily Database Backup Started');
      await this.log(`📅 Date: ${new Date().toISOString()}`);
      await this.log(`🏃 Runner: GitHub Actions`);
      
      // Ensure log directory exists
      await this.ensureLogDirectory();
      
      // Validate environment
      await this.validateEnvironment();
      
      // Perform database backup
      const backupResult = await this.performDatabaseBackup();
      
      // Note: Database backups are never automatically cleaned up for safety
      const cleanupResult = { deletedCount: 0, freedSpace: 0, message: 'No cleanup performed - database backups preserved for safety' };
      
      // Generate report
      const report = await this.generateBackupReport(backupResult, cleanupResult);
      
      await this.log('✅ Daily database backup completed successfully');
      await this.log(`📊 Total duration: ${report.duration}ms`);
      
      return report;
      
    } catch (error) {
      await this.log(`❌ Daily backup failed: ${error.message}`, 'ERROR');
      await this.log(`❌ Error stack: ${error.stack}`, 'ERROR');
      
      // Log additional context for debugging
      await this.log('🔍 Failure context:', 'ERROR');
      await this.log(`  Environment: ${process.env.NODE_ENV}`, 'ERROR');
      await this.log(`  Blob token available: ${!!process.env.BLOB_READ_WRITE_TOKEN}`, 'ERROR');
      await this.log(`  Database URL available: ${!!process.env.DATABASE_URL}`, 'ERROR');
      
      // Generate error report
      const errorReport = {
        timestamp: new Date().toISOString(),
        type: 'daily-database-backup',
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
        const errorReportFile = path.join(this.logDir, `daily-backup-error-${new Date().toISOString().split('T')[0]}.json`);
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
  const runner = new DailyBackupRunner();
  runner.run()
    .then((report) => {
      console.log('🎉 Daily backup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Daily backup failed:', error.message);
      process.exit(1);
    });
}

module.exports = DailyBackupRunner;
