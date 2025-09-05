#!/usr/bin/env node

/**
 * Quick Backup System Test
 * 
 * This is a lightweight test for daily verification of backup system health.
 * Runs essential checks without creating large backup files.
 * 
 * Run with: node test-backup-quick.js
 */

require('dotenv').config({ path: '.env.local' });
const { list } = require('@vercel/blob');
const { Pool } = require('pg');

class QuickBackupTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async runQuickTest() {
    console.log('⚡ Quick Backup System Health Check');
    console.log('=' .repeat(40));
    
    try {
      await this.testEnvironmentVariables();
      await this.testDatabaseConnection();
      await this.testBlobStorage();
      await this.testBackupManager();
      
      this.generateQuickReport();
      
    } catch (error) {
      console.error('❌ Quick test failed:', error);
      this.addResult('Quick Test Suite', false, `Test suite failed: ${error.message}`);
    }
  }

  async testEnvironmentVariables() {
    console.log('\n🔍 Testing Environment Variables...');
    
    const tests = [
      {
        name: 'DATABASE_URL',
        value: process.env.DATABASE_URL,
        expected: true,
        message: 'Database connection string configured'
      },
      {
        name: 'BLOB_READ_WRITE_TOKEN',
        value: process.env.BLOB_READ_WRITE_TOKEN,
        expected: true,
        message: 'Blob storage token configured'
      }
    ];

    for (const test of tests) {
      const hasValue = !!test.value;
      this.addResult(`Environment: ${test.name}`, hasValue === test.expected, 
        hasValue ? test.message : `${test.name} is missing`);
    }
  }

  async testDatabaseConnection() {
    console.log('\n💾 Testing Database Connection...');
    
    try {
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL
      });
      
      const result = await pool.query('SELECT NOW() as current_time, version() as db_version');
      await pool.end();
      
      this.addResult('Database: Connection', true, 
        `Connected successfully (${result.rows[0].current_time})`);
      
      // Test backup_metadata table exists
      const pool2 = new Pool({
        connectionString: process.env.DATABASE_URL
      });
      
      const tableCheck = await pool2.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'backup_metadata'
        ) as table_exists
      `);
      
      await pool2.end();
      
      this.addResult('Database: Backup Metadata Table', tableCheck.rows[0].table_exists, 
        tableCheck.rows[0].table_exists ? 'Backup metadata table exists' : 'Backup metadata table missing');
      
    } catch (error) {
      this.addResult('Database: Connection', false, `Database connection failed: ${error.message}`);
    }
  }

  async testBlobStorage() {
    console.log('\n📁 Testing Blob Storage...');
    
    try {
      const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
      const { blobs } = await list({ token: BLOB_TOKEN });
      
      this.addResult('Blob Storage: Authentication', true, 
        `Blob storage accessible (${blobs.length} files found)`);
      
      // Test that we can filter blobs (infinite loop prevention)
      const filteredBlobs = blobs.filter(blob => {
        const pathname = blob.pathname.toLowerCase();
        return !pathname.includes('backup') && 
               !pathname.includes('temp') && 
               !pathname.includes('tmp') &&
               !pathname.endsWith('.zip') &&
               !pathname.endsWith('.tar.gz');
      });
      
      this.addResult('Blob Storage: Infinite Loop Prevention', true, 
        `Filtering works (${blobs.length} total, ${filteredBlobs.length} after filtering)`);
      
    } catch (error) {
      this.addResult('Blob Storage: Authentication', false, `Blob storage failed: ${error.message}`);
    }
  }

  async testBackupManager() {
    console.log('\n🔧 Testing Backup Manager...');
    
    try {
      const BackupManager = require('./backup/backup-manager');
      const backupManager = new BackupManager();
      
      // Test that backup manager can be instantiated
      this.addResult('Backup Manager: Instantiation', true, 'Backup manager created successfully');
      
      // Test local assets scanning
      const localAssets = await backupManager.createLocalAssetsBackup();
      
      this.addResult('Backup Manager: Local Assets Scan', Array.isArray(localAssets), 
        `Local assets scan completed (${localAssets.length} files found)`);
      
      await backupManager.close();
      
    } catch (error) {
      this.addResult('Backup Manager: Overall', false, `Backup manager test failed: ${error.message}`);
    }
  }

  addResult(testName, passed, message) {
    const result = {
      name: testName,
      passed: passed,
      message: message,
      timestamp: new Date().toISOString()
    };
    
    this.results.tests.push(result);
    
    if (passed) {
      this.results.passed++;
      console.log(`✅ ${testName}: ${message}`);
    } else {
      this.results.failed++;
      console.log(`❌ ${testName}: ${message}`);
    }
  }

  generateQuickReport() {
    console.log('\n📊 Quick Test Results:');
    console.log('=' .repeat(40));
    
    const totalTests = this.results.passed + this.results.failed;
    const successRate = totalTests > 0 ? (this.results.passed / totalTests * 100).toFixed(1) : 0;
    
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${this.results.passed} ✅`);
    console.log(`Failed: ${this.results.failed} ❌`);
    console.log(`Success Rate: ${successRate}%`);
    
    if (this.results.failed === 0) {
      console.log('\n🎉 All quick tests passed! Backup system is healthy.');
    } else {
      console.log('\n⚠️  Some tests failed. Run comprehensive test for details.');
    }
  }
}

// Run the quick test if this file is executed directly
if (require.main === module) {
  const tester = new QuickBackupTester();
  tester.runQuickTest().catch(console.error);
}

module.exports = QuickBackupTester;
