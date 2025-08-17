#!/usr/bin/env node

const { list, put, del } = require('@vercel/blob');
const https = require('https');

console.log('🔍 Debugging Blob Migration...');

// Production blob token
const PRODUCTION_BLOB_TOKEN = 'vercel_blob_rw_kRe9XoIvjggJ03oF_JLbmM2kbj59CKUV5yrdsU1aa7lDTKt';

// Helper function to download blob content
async function downloadBlob(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to download: ${res.statusCode}`));
        return;
      }
      
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function debugMigration() {
  try {
    console.log('📋 Current state of production blob storage...');
    const { blobs } = await list({ token: PRODUCTION_BLOB_TOKEN });
    
    console.log(`📊 Found ${blobs.length} total files\n`);
    
    // Check for backup files
    const backupFiles = blobs.filter(b => b.pathname.includes('backup'));
    const properBackups = backupFiles.filter(b => b.pathname.startsWith('backups/'));
    const misplacedBackups = backupFiles.filter(b => !b.pathname.startsWith('backups/'));
    
    console.log('📦 BACKUP FILES ANALYSIS:');
    console.log('=' .repeat(50));
    console.log(`Total backup files: ${backupFiles.length}`);
    console.log(`Proper structure: ${properBackups.length}`);
    console.log(`Misplaced: ${misplacedBackups.length}\n`);
    
    if (misplacedBackups.length > 0) {
      console.log('⚠️  MISPLACED BACKUPS (still need migration):');
      console.log('-'.repeat(50));
      misplacedBackups.forEach(blob => {
        const date = new Date(blob.uploadedAt).toLocaleString();
        const size = (blob.size / 1024).toFixed(2) + ' KB';
        console.log(`📁 ${blob.pathname}`);
        console.log(`   📅 ${date} | 📏 ${size}`);
        console.log('');
      });
    }
    
    if (properBackups.length > 0) {
      console.log('✅ PROPER BACKUPS (already migrated):');
      console.log('-'.repeat(50));
      properBackups.forEach(blob => {
        const date = new Date(blob.uploadedAt).toLocaleString();
        const size = (blob.size / 1024).toFixed(2) + ' KB';
        console.log(`📁 ${blob.pathname}`);
        console.log(`   📅 ${date} | 📏 ${size}`);
        console.log('');
      });
    }
    
    // Check for the specific large file you mentioned
    const largeFile = blobs.find(b => b.pathname.includes('blob-backup-2025-08-17T06-33-48-373Z'));
    if (largeFile) {
      console.log('🎯 FOUND THE LARGE FILE:');
      console.log(`📁 ${largeFile.pathname}`);
      console.log(`📏 Size: ${(largeFile.size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`📅 Date: ${new Date(largeFile.uploadedAt).toLocaleString()}`);
    } else {
      console.log('❌ LARGE FILE NOT FOUND');
      console.log('The file blob-backup-2025-08-17T06-33-48-373Z is not in the production blob');
    }
    
    // Test a simple operation to verify the token works
    console.log('\n🧪 Testing blob operations...');
    try {
      const testContent = Buffer.from('test migration debug');
      const testPath = 'debug-test-migration.txt';
      
      console.log('   ⬆️  Uploading test file...');
      await put(testPath, testContent, {
        access: 'public',
        addRandomSuffix: false,
        token: PRODUCTION_BLOB_TOKEN
      });
      
      console.log('   ✅ Test upload successful');
      
      console.log('   🗑️  Deleting test file...');
      await del(testPath, { token: PRODUCTION_BLOB_TOKEN });
      
      console.log('   ✅ Test delete successful');
      console.log('   ✅ Blob token is working correctly');
      
    } catch (error) {
      console.error('   ❌ Blob operations failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    process.exit(1);
  }
}

debugMigration();
