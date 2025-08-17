#!/usr/bin/env node

const { list } = require('@vercel/blob');
const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const http = require('http');

console.log('🔄 Starting Production Vercel Blob Backup...');

// Production blob token (the old one we want to clean up)
const PRODUCTION_BLOB_TOKEN = 'vercel_blob_rw_kRe9XoIvjggJ03oF_JLbmM2kbj59CKUV5yrdsU1aa7lDTKt';

// Local backup directory
const BACKUP_DIR = path.join(__dirname, '..', 'devbackup');

async function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }

      const fileStream = require('fs').createWriteStream(filePath);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });

      fileStream.on('error', (err) => {
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function ensureDirectoryExists(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

async function backupProductionBlob() {
  try {
    console.log('📁 Creating backup directory...');
    await ensureDirectoryExists(BACKUP_DIR);

    console.log('🔍 Listing all files in production blob storage...');
    const { blobs } = await list({ token: PRODUCTION_BLOB_TOKEN });
    
    console.log(`📊 Found ${blobs.length} files to backup`);

    if (blobs.length === 0) {
      console.log('✅ No files found in production blob storage');
      return;
    }

    // Create a manifest file to track what we're backing up
    const manifest = {
      backupDate: new Date().toISOString(),
      totalFiles: blobs.length,
      files: []
    };

    let successCount = 0;
    let errorCount = 0;

    for (const blob of blobs) {
      try {
        console.log(`📥 Downloading: ${blob.pathname}`);
        
        // Create the local file path
        const localFilePath = path.join(BACKUP_DIR, blob.pathname);
        
        // Ensure the directory exists
        const localDir = path.dirname(localFilePath);
        await ensureDirectoryExists(localDir);
        
        // Download the file
        await downloadFile(blob.url, localFilePath);
        
        // Get file stats
        const stats = await fs.stat(localFilePath);
        
        // Add to manifest
        manifest.files.push({
          pathname: blob.pathname,
          url: blob.url,
          size: blob.size,
          uploadedAt: blob.uploadedAt,
          localSize: stats.size,
          localPath: localFilePath
        });
        
        successCount++;
        console.log(`✅ Downloaded: ${blob.pathname} (${(stats.size / 1024).toFixed(2)} KB)`);
        
      } catch (error) {
        errorCount++;
        console.error(`❌ Failed to download ${blob.pathname}:`, error.message);
        
        // Add error to manifest
        manifest.files.push({
          pathname: blob.pathname,
          url: blob.url,
          size: blob.size,
          uploadedAt: blob.uploadedAt,
          error: error.message
        });
      }
    }

    // Save manifest
    const manifestPath = path.join(BACKUP_DIR, 'backup-manifest.json');
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    
    console.log('\n📋 Backup Summary:');
    console.log(`✅ Successfully downloaded: ${successCount} files`);
    console.log(`❌ Failed downloads: ${errorCount} files`);
    console.log(`📁 Backup location: ${BACKUP_DIR}`);
    console.log(`📄 Manifest file: ${manifestPath}`);
    
    // Calculate total size
    const totalSize = manifest.files
      .filter(f => f.localSize)
      .reduce((sum, f) => sum + f.localSize, 0);
    
    console.log(`📊 Total backup size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

    if (errorCount > 0) {
      console.log('\n⚠️  Some files failed to download. Check the manifest for details.');
    }

    console.log('\n✅ Production blob backup completed!');
    console.log('💡 You can now safely clean up the production blob storage.');

  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    process.exit(1);
  }
}

// Run the backup
backupProductionBlob();
