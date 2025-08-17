#!/usr/bin/env node

const { list, del } = require('@vercel/blob');

console.log('🧹 Starting Old Production Vercel Blob Cleanup...');

// Production blob token (the old one we want to clean up)
const PRODUCTION_BLOB_TOKEN = 'vercel_blob_rw_kRe9XoIvjggJ03oF_JLbmM2kbj59CKUV5yrdsU1aa7lDTKt';

async function cleanupOldBlobStorage() {
  try {
    console.log('🔍 Listing all files in old production blob storage...');
    const { blobs } = await list({ token: PRODUCTION_BLOB_TOKEN });
    
    console.log(`📊 Found ${blobs.length} files to delete`);

    if (blobs.length === 0) {
      console.log('✅ No files found in old production blob storage');
      return;
    }

    // Create a cleanup manifest
    const cleanupManifest = {
      cleanupDate: new Date().toISOString(),
      totalFiles: blobs.length,
      deletedFiles: [],
      failedFiles: []
    };

    let successCount = 0;
    let errorCount = 0;

    for (const blob of blobs) {
      try {
        console.log(`🗑️  Deleting: ${blob.pathname}`);
        
        // Delete the file
        await del(blob.pathname, { token: PRODUCTION_BLOB_TOKEN });
        
        // Add to manifest
        cleanupManifest.deletedFiles.push({
          pathname: blob.pathname,
          size: blob.size,
          uploadedAt: blob.uploadedAt,
          deletedAt: new Date().toISOString()
        });
        
        successCount++;
        console.log(`✅ Deleted: ${blob.pathname}`);
        
      } catch (error) {
        errorCount++;
        console.error(`❌ Failed to delete ${blob.pathname}:`, error.message);
        
        // Add error to manifest
        cleanupManifest.failedFiles.push({
          pathname: blob.pathname,
          size: blob.size,
          uploadedAt: blob.uploadedAt,
          error: error.message
        });
      }
    }

    // Save cleanup manifest
    const fs = require('fs').promises;
    const path = require('path');
    const manifestPath = path.join(__dirname, '..', 'devbackup', 'cleanup-manifest.json');
    
    try {
      await fs.writeFile(manifestPath, JSON.stringify(cleanupManifest, null, 2));
    } catch (error) {
      console.log('⚠️  Could not save cleanup manifest:', error.message);
    }
    
    console.log('\n📋 Cleanup Summary:');
    console.log(`✅ Successfully deleted: ${successCount} files`);
    console.log(`❌ Failed deletions: ${errorCount} files`);
    
    if (cleanupManifest.failedFiles.length > 0) {
      console.log(`📄 Cleanup manifest saved to: ${manifestPath}`);
    }

    // Calculate total size cleaned up
    const totalSize = cleanupManifest.deletedFiles.reduce((sum, f) => sum + f.size, 0);
    console.log(`📊 Total space freed: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

    if (errorCount > 0) {
      console.log('\n⚠️  Some files failed to delete. Check the cleanup manifest for details.');
    }

    console.log('\n✅ Old production blob cleanup completed!');
    console.log('💡 The old blob storage has been cleaned up.');

  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    process.exit(1);
  }
}

// Run the cleanup
cleanupOldBlobStorage();
