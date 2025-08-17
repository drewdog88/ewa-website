#!/usr/bin/env node

const { list } = require('@vercel/blob');

console.log('🔍 Checking Vercel Blob Environments...');

// All known blob tokens
const BLOB_TOKENS = {
  'Production/Preview': 'vercel_blob_rw_kRe9XoIvjggJ03oF_JLbmM2kbj59CKUV5yrdsU1aa7lDTKt',
  'Development': 'vercel_blob_rw_D3cmXYAFiy0Jv5Ch_Nfez7DLKTwQPUzZbMiPvu3j5zAQlLa',
  'Old (to be removed)': 'vercel_blob_rw_UWH6nTy2XcA4BS7u_OS0oZHtQ56g3BjXFIWAqNSlxDPJVHV'
};

async function checkBlobEnvironments() {
  for (const [environment, token] of Object.entries(BLOB_TOKENS)) {
    try {
      console.log(`\n📋 Checking ${environment} environment...`);
      console.log(`Token: ${token.substring(0, 20)}...`);
      
      const { blobs } = await list({ token });
      
      console.log(`📊 Found ${blobs.length} files`);
      
      // Count backup files
      const backupFiles = blobs.filter(b => b.pathname.includes('backup'));
      const properBackups = backupFiles.filter(b => b.pathname.startsWith('backups/'));
      const misplacedBackups = backupFiles.filter(b => !b.pathname.startsWith('backups/'));
      
      console.log(`   📦 Backup files: ${backupFiles.length}`);
      console.log(`   ✅ Proper structure: ${properBackups.length}`);
      console.log(`   ⚠️  Misplaced: ${misplacedBackups.length}`);
      
      if (backupFiles.length > 0) {
        console.log('\n   📁 Sample backup files:');
        backupFiles.slice(0, 5).forEach(blob => {
          const size = (blob.size / 1024).toFixed(2) + ' KB';
          console.log(`      ${blob.pathname} (${size})`);
        });
        if (backupFiles.length > 5) {
          console.log(`      ... and ${backupFiles.length - 5} more`);
        }
      }
      
    } catch (error) {
      console.log(`   ❌ Error accessing ${environment}: ${error.message}`);
    }
  }
  
  console.log('\n🎯 SUMMARY:');
  console.log('=' .repeat(50));
  console.log('This will help identify which blob environment contains your files');
  console.log('and which token we should be using for the migration.');
}

checkBlobEnvironments();
