#!/usr/bin/env node

const { list } = require('@vercel/blob');

console.log('🔍 Testing Blob Token...');

// Test all known tokens
const TOKENS = {
  'Production/Preview': '***REMOVED***',
  'Development': '***REMOVED***',
  'Old (to be removed)': '***REMOVED***'
};

async function testTokens() {
  for (const [name, token] of Object.entries(TOKENS)) {
    try {
      console.log(`\n📋 Testing ${name} token...`);
      console.log(`Token: ${token.substring(0, 20)}...`);
      
      const { blobs } = await list({ token });
      
      console.log(`✅ SUCCESS: Found ${blobs.length} files`);
      
      // Check for backup files
      const backupFiles = blobs.filter(b => b.pathname.includes('backup'));
      console.log(`   📦 Backup files: ${backupFiles.length}`);
      
      if (backupFiles.length > 0) {
        console.log('   📁 Sample backup files:');
        backupFiles.slice(0, 3).forEach(blob => {
          const size = (blob.size / 1024).toFixed(2) + ' KB';
          console.log(`      ${blob.pathname} (${size})`);
        });
      }
      
    } catch (error) {
      console.log(`❌ FAILED: ${error.message}`);
    }
  }
  
  console.log('\n🎯 SUMMARY:');
  console.log('=' .repeat(50));
  console.log('This will help identify which token is working correctly.');
}

testTokens();
