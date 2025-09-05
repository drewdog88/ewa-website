#!/usr/bin/env node

/**
 * Backup System Test Script
 * Tests the backup system functionality to ensure all fixes are working
 */

require('dotenv').config({ path: '.env.local' });

const { Pool } = require('pg');
const { list } = require('@vercel/blob');

async function testBackupSystem() {
  console.log('🧪 Testing EWA Backup System');
  console.log('================================');
  
  const results = {
    environment: {},
    blobStorage: {},
    database: {},
    cronEndpoint: {},
    overall: 'unknown'
  };

  // Test 1: Environment Variables
  console.log('\n1️⃣ Testing Environment Variables...');
  const requiredEnvVars = ['DATABASE_URL', 'BLOB_READ_WRITE_TOKEN'];
  
  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    results.environment[envVar] = {
      configured: !!value,
      length: value ? value.length : 0,
      preview: value ? value.substring(0, 20) + '...' : 'NOT SET'
    };
    
    if (value) {
      console.log(`✅ ${envVar}: Configured (${value.length} chars)`);
    } else {
      console.log(`❌ ${envVar}: NOT CONFIGURED`);
    }
  }

  // Test 2: Blob Storage
  console.log('\n2️⃣ Testing Blob Storage...');
  const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
  
  if (BLOB_TOKEN) {
    try {
      const { blobs } = await list({ token: BLOB_TOKEN });
      results.blobStorage = {
        status: 'healthy',
        fileCount: blobs.length,
        totalSize: blobs.reduce((sum, blob) => sum + (blob.size || 0), 0),
        backupFiles: blobs.filter(blob => blob.pathname.includes('backup')).length
      };
      
      console.log(`✅ Blob Storage: Connected`);
      console.log(`   📁 Total files: ${blobs.length}`);
      console.log(`   📦 Total size: ${(results.blobStorage.totalSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   💾 Backup files: ${results.blobStorage.backupFiles}`);
      
    } catch (error) {
      results.blobStorage = {
        status: 'error',
        error: error.message
      };
      console.log(`❌ Blob Storage: ${error.message}`);
    }
  } else {
    results.blobStorage = {
      status: 'not_configured',
      error: 'BLOB_READ_WRITE_TOKEN not set'
    };
    console.log(`❌ Blob Storage: Token not configured`);
  }

  // Test 3: Database Connection
  console.log('\n3️⃣ Testing Database Connection...');
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (DATABASE_URL) {
    try {
      const dbPool = new Pool({
        connectionString: DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });
      
      const result = await dbPool.query('SELECT NOW() as current_time, version() as version');
      await dbPool.end();
      
      results.database = {
        status: 'healthy',
        currentTime: result.rows[0].current_time,
        version: result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1]
      };
      
      console.log(`✅ Database: Connected`);
      console.log(`   🕐 Current time: ${result.rows[0].current_time}`);
      console.log(`   🗄️ Version: ${results.database.version}`);
      
    } catch (error) {
      results.database = {
        status: 'error',
        error: error.message
      };
      console.log(`❌ Database: ${error.message}`);
    }
  } else {
    results.database = {
      status: 'not_configured',
      error: 'DATABASE_URL not set'
    };
    console.log(`❌ Database: URL not configured`);
  }

  // Test 4: CRON Endpoint (simulate)
  console.log('\n4️⃣ Testing CRON Endpoint Configuration...');
  try {
    // Test the CRON endpoint by making a request
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://www.eastlakewolfpack.org' 
      : 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/cron-backup`, {
      method: 'GET',
      headers: {
        'User-Agent': 'vercel-cron/1.0'
      }
    });
    
    const responseText = await response.text();
    
    results.cronEndpoint = {
      status: response.ok ? 'accessible' : 'error',
      statusCode: response.status,
      response: responseText.substring(0, 200) + (responseText.length > 200 ? '...' : '')
    };
    
    if (response.ok) {
      console.log(`✅ CRON Endpoint: Accessible (${response.status})`);
    } else {
      console.log(`⚠️ CRON Endpoint: Responded with ${response.status}`);
      console.log(`   Response: ${responseText.substring(0, 100)}...`);
    }
    
  } catch (error) {
    results.cronEndpoint = {
      status: 'error',
      error: error.message
    };
    console.log(`❌ CRON Endpoint: ${error.message}`);
  }

  // Overall Assessment
  console.log('\n📊 Overall Assessment');
  console.log('====================');
  
  const criticalIssues = [];
  const warnings = [];
  
  if (!results.environment.DATABASE_URL?.configured) {
    criticalIssues.push('DATABASE_URL not configured');
  }
  
  if (!results.environment.BLOB_READ_WRITE_TOKEN?.configured) {
    criticalIssues.push('BLOB_READ_WRITE_TOKEN not configured');
  }
  
  if (results.blobStorage.status === 'error') {
    criticalIssues.push('Blob storage connection failed');
  }
  
  if (results.database.status === 'error') {
    criticalIssues.push('Database connection failed');
  }
  
  if (results.cronEndpoint.status === 'error') {
    warnings.push('CRON endpoint not accessible');
  }
  
  if (criticalIssues.length === 0) {
    results.overall = 'healthy';
    console.log('✅ System Status: HEALTHY');
    console.log('   All critical components are working properly');
  } else {
    results.overall = 'unhealthy';
    console.log('❌ System Status: UNHEALTHY');
    console.log('   Critical issues found:');
    criticalIssues.forEach(issue => console.log(`   - ${issue}`));
  }
  
  if (warnings.length > 0) {
    console.log('⚠️ Warnings:');
    warnings.forEach(warning => console.log(`   - ${warning}`));
  }

  // Recommendations
  console.log('\n💡 Recommendations');
  console.log('==================');
  
  if (criticalIssues.length > 0) {
    console.log('🔧 Fix these issues first:');
    criticalIssues.forEach(issue => {
      if (issue.includes('DATABASE_URL')) {
        console.log('   - Set DATABASE_URL in your environment variables');
      } else if (issue.includes('BLOB_READ_WRITE_TOKEN')) {
        console.log('   - Set BLOB_READ_WRITE_TOKEN in your Vercel project settings');
      } else if (issue.includes('Blob storage')) {
        console.log('   - Check blob token permissions and network connectivity');
      } else if (issue.includes('Database')) {
        console.log('   - Verify database connection string and network access');
      }
    });
  }
  
  if (results.overall === 'healthy') {
    console.log('✅ System is ready for production use');
    console.log('📅 CRON job should run daily at 10:00 AM UTC (2:00 AM PST)');
    console.log('🔍 Monitor backup status at: /api/backup/health');
  }

  // Save results
  const fs = require('fs');
  const resultsFile = 'backup-system-test-results.json';
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  console.log(`\n📄 Detailed results saved to: ${resultsFile}`);
  
  return results;
}

// Run the test
if (require.main === module) {
  testBackupSystem()
    .then(results => {
      process.exit(results.overall === 'healthy' ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testBackupSystem };
