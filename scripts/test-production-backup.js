#!/usr/bin/env node

const https = require('https');

console.log('🧪 Testing Production Backup API...');

const PRODUCTION_URL = 'https://www.eastlakewolfpack.org';

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testProductionBackup() {
  console.log('🔍 Testing backup API endpoints...\n');
  
  try {
    // Test 1: Health check
    console.log('1️⃣ Testing health endpoint...');
    const healthResult = await makeRequest(`${PRODUCTION_URL}/api/health`);
    console.log(`   Status: ${healthResult.status}`);
    if (healthResult.status === 200) {
      console.log('   ✅ Health check passed');
      console.log(`   📊 Environment: ${healthResult.data.environment}`);
      console.log(`   📊 Database: ${healthResult.data.services?.database?.status}`);
      console.log(`   📊 Blob: ${healthResult.data.services?.blob?.status}`);
    } else {
      console.log('   ❌ Health check failed');
    }
    console.log('');

    // Test 2: Backup test endpoint
    console.log('2️⃣ Testing backup test endpoint...');
    const testResult = await makeRequest(`${PRODUCTION_URL}/api/backup/test`);
    console.log(`   Status: ${testResult.status}`);
    if (testResult.status === 200) {
      console.log('   ✅ Backup test passed');
      if (testResult.data?.data?.tests) {
        Object.entries(testResult.data.data.tests).forEach(([test, result]) => {
          console.log(`   📊 ${test}: ${result.status} - ${result.message}`);
        });
      }
    } else {
      console.log('   ❌ Backup test failed');
      console.log(`   📄 Response: ${JSON.stringify(testResult.data, null, 2)}`);
    }
    console.log('');

    // Test 3: Backup status endpoint
    console.log('3️⃣ Testing backup status endpoint...');
    const statusResult = await makeRequest(`${PRODUCTION_URL}/api/backup/status`);
    console.log(`   Status: ${statusResult.status}`);
    if (statusResult.status === 200) {
      console.log('   ✅ Backup status retrieved');
      const status = statusResult.data?.data?.status;
      if (status) {
        console.log(`   📊 Last backup: ${status.lastBackup ? new Date(status.lastBackup).toLocaleString() : 'Never'}`);
        console.log(`   📊 Backup count: ${status.backupCount}`);
        console.log(`   📊 Total size: ${(status.totalBackupSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   📊 Next scheduled: ${new Date(status.nextScheduledBackup).toLocaleString()}`);
      }
    } else {
      console.log('   ❌ Backup status failed');
      console.log(`   📄 Response: ${JSON.stringify(statusResult.data, null, 2)}`);
    }
    console.log('');

    // Test 4: Backup list endpoint
    console.log('4️⃣ Testing backup list endpoint...');
    const listResult = await makeRequest(`${PRODUCTION_URL}/api/backup/list`);
    console.log(`   Status: ${listResult.status}`);
    if (listResult.status === 200) {
      console.log('   ✅ Backup list retrieved');
      const data = listResult.data?.data;
      if (data) {
        console.log(`   📦 Database backups: ${data.database?.blob?.length || 0}`);
        console.log(`   📦 Full backups: ${data.full?.blob?.length || 0}`);
        
        // Show sample backups
        if (data.database?.blob?.length > 0) {
          console.log('   📁 Sample database backups:');
          data.database.blob.slice(0, 3).forEach(backup => {
            console.log(`      ${backup.pathname} (${(backup.size / 1024).toFixed(2)} KB)`);
          });
        }
        
        if (data.full?.blob?.length > 0) {
          console.log('   📁 Sample full backups:');
          data.full.blob.slice(0, 3).forEach(backup => {
            console.log(`      ${backup.pathname} (${(backup.size / 1024 / 1024).toFixed(2)} MB)`);
          });
        }
      }
    } else {
      console.log('   ❌ Backup list failed');
      console.log(`   📄 Response: ${JSON.stringify(listResult.data, null, 2)}`);
    }
    console.log('');

    console.log('🎯 TEST SUMMARY:');
    console.log('=' .repeat(50));
    console.log('All tests completed. Check the results above.');
    console.log('If any tests failed, check the production environment variables.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testProductionBackup();
