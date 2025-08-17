#!/usr/bin/env node

const { list, put, del } = require('@vercel/blob');
const https = require('https');

console.log('🔄 Migrating Production Vercel Blob Storage Structure...');

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

// Helper function to determine proper path
function getProperPath(blob) {
  const uploadDate = new Date(blob.uploadedAt);
  const dateFolder = uploadDate.toISOString().split('T')[0];
  
  if (blob.pathname.includes('db-backup') || blob.pathname.includes('database')) {
    return `backups/database/${dateFolder}/${blob.pathname}`;
  } else if (blob.pathname.includes('blob-backup')) {
    return `backups/full/${dateFolder}/${blob.pathname}`;
  } else {
    return `backups/unknown/${dateFolder}/${blob.pathname}`;
  }
}

async function migrateBlobStructure() {
  try {
    console.log('📋 Listing all files in production blob storage...');
    const { blobs } = await list({ token: PRODUCTION_BLOB_TOKEN });
    
    // Filter for misplaced backups
    const misplacedBackups = blobs.filter(blob => 
      (blob.pathname.includes('backup') || blob.pathname.includes('db-backup')) &&
      !blob.pathname.startsWith('backups/')
    );
    
    console.log(`🔧 Found ${misplacedBackups.length} misplaced backup files to migrate\n`);
    
    if (misplacedBackups.length === 0) {
      console.log('✅ No misplaced backups found. Structure is already correct!');
      return;
    }
    
    // Group by type for better reporting
    const databaseBackups = misplacedBackups.filter(b => b.pathname.includes('db-backup'));
    const fullBackups = misplacedBackups.filter(b => b.pathname.includes('blob-backup'));
    
    console.log('📊 MIGRATION PLAN:');
    console.log('=' .repeat(50));
    console.log(`Database Backups: ${databaseBackups.length}`);
    console.log(`Full Backups: ${fullBackups.length}`);
    console.log(`Total Size: ${(misplacedBackups.reduce((sum, b) => sum + b.size, 0) / 1024 / 1024).toFixed(2)} MB\n`);
    
    // Show migration plan
    console.log('📋 MIGRATION DETAILS:');
    console.log('-'.repeat(50));
    misplacedBackups.forEach(blob => {
      const properPath = getProperPath(blob);
      const size = (blob.size / 1024).toFixed(2) + ' KB';
      console.log(`📁 ${blob.pathname} (${size})`);
      console.log(`   ➡️  ${properPath}`);
      console.log('');
    });
    
    // Ask for confirmation
    console.log('⚠️  WARNING: This will move backup files to proper directory structure.');
    console.log('   - Files will be downloaded and re-uploaded to new locations');
    console.log('   - Original files will be deleted only after successful re-upload');
    console.log('   - This process may take several minutes for large files');
    console.log('');
    
    console.log('\n🚀 Starting migration...');
    let successCount = 0;
    let errorCount = 0;
    
    for (const blob of misplacedBackups) {
      try {
        console.log(`\n📦 Processing: ${blob.pathname}`);
        
        // Download the file
        console.log('   ⬇️  Downloading...');
        const content = await downloadBlob(blob.url);
        
        // Determine proper path
        const properPath = getProperPath(blob);
        
        // Upload to new location
        console.log(`   ⬆️  Uploading to: ${properPath}`);
        await put(properPath, content, {
          access: 'public',
          addRandomSuffix: false,
          token: PRODUCTION_BLOB_TOKEN
        });
        
        // Delete original file
        console.log('   🗑️  Deleting original...');
        await del(blob.pathname, { token: PRODUCTION_BLOB_TOKEN });
        
        console.log('   ✅ Successfully migrated');
        successCount++;
        
      } catch (error) {
        console.error(`   ❌ Failed to migrate ${blob.pathname}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n📈 MIGRATION COMPLETE:');
    console.log('=' .repeat(50));
    console.log(`✅ Successfully migrated: ${successCount}`);
    console.log(`❌ Failed migrations: ${errorCount}`);
    console.log(`📊 Total processed: ${misplacedBackups.length}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run the migration
migrateBlobStructure();
