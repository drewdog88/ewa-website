#!/usr/bin/env node

const { list } = require('@vercel/blob');

console.log('🔍 Analyzing Production Vercel Blob Storage Structure...');

// Production blob token
const PRODUCTION_BLOB_TOKEN = '***REMOVED***';

async function analyzeBlobStructure() {
  try {
    console.log('📋 Listing all files in production blob storage...');
    const { blobs } = await list({ token: PRODUCTION_BLOB_TOKEN });
    
    console.log(`📊 Found ${blobs.length} total files in blob storage\n`);

    // Categorize files
    const categorized = {
      properBackups: [],
      misplacedBackups: [],
      otherFiles: [],
      analysis: {
        totalFiles: blobs.length,
        properBackups: 0,
        misplacedBackups: 0,
        otherFiles: 0,
        totalSize: 0
      }
    };

    for (const blob of blobs) {
      categorized.analysis.totalSize += blob.size;
      
      // Check if it's a proper backup (in correct directory structure)
      if (blob.pathname.startsWith('backups/database/') || blob.pathname.startsWith('backups/full/')) {
        categorized.properBackups.push(blob);
        categorized.analysis.properBackups++;
      }
      // Check if it's a misplaced backup (backup file but wrong location)
      else if (blob.pathname.includes('backup') || blob.pathname.includes('db-backup') || blob.pathname.includes('full-backup')) {
        categorized.misplacedBackups.push(blob);
        categorized.analysis.misplacedBackups++;
      }
      // Other files
      else {
        categorized.otherFiles.push(blob);
        categorized.analysis.otherFiles++;
      }
    }

    // Display analysis
    console.log('📈 BLOB STORAGE ANALYSIS:');
    console.log('=' .repeat(50));
    console.log(`Total Files: ${categorized.analysis.totalFiles}`);
    console.log(`Total Size: ${(categorized.analysis.totalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Proper Backups: ${categorized.analysis.properBackups}`);
    console.log(`Misplaced Backups: ${categorized.analysis.misplacedBackups}`);
    console.log(`Other Files: ${categorized.analysis.otherFiles}\n`);

    // Show proper backups
    if (categorized.properBackups.length > 0) {
      console.log('✅ PROPER BACKUPS (in correct structure):');
      console.log('-'.repeat(50));
      categorized.properBackups.forEach(blob => {
        const date = new Date(blob.uploadedAt).toLocaleString();
        const size = (blob.size / 1024).toFixed(2) + ' KB';
        console.log(`📁 ${blob.pathname}`);
        console.log(`   📅 ${date} | 📏 ${size}`);
        console.log('');
      });
    }

    // Show misplaced backups that need to be moved
    if (categorized.misplacedBackups.length > 0) {
      console.log('⚠️  MISPLACED BACKUPS (need to be moved to proper structure):');
      console.log('-'.repeat(50));
      categorized.misplacedBackups.forEach(blob => {
        const date = new Date(blob.uploadedAt).toLocaleString();
        const size = (blob.size / 1024).toFixed(2) + ' KB';
        
        // Determine what type of backup it is and suggest proper path
        let suggestedPath = '';
        const uploadDate = new Date(blob.uploadedAt);
        const dateFolder = uploadDate.toISOString().split('T')[0];
        
        if (blob.pathname.includes('db-backup') || blob.pathname.includes('database')) {
          suggestedPath = `backups/database/${dateFolder}/${blob.pathname}`;
        } else if (blob.pathname.includes('full-backup')) {
          suggestedPath = `backups/full/${dateFolder}/${blob.pathname}`;
        } else {
          suggestedPath = `backups/unknown/${dateFolder}/${blob.pathname}`;
        }
        
        console.log(`📁 ${blob.pathname}`);
        console.log(`   📅 ${date} | 📏 ${size}`);
        console.log(`   🔄 Should be moved to: ${suggestedPath}`);
        console.log('');
      });
    }

    // Show other files
    if (categorized.otherFiles.length > 0) {
      console.log('📄 OTHER FILES (not backups):');
      console.log('-'.repeat(50));
      categorized.otherFiles.forEach(blob => {
        const date = new Date(blob.uploadedAt).toLocaleString();
        const size = (blob.size / 1024).toFixed(2) + ' KB';
        console.log(`📁 ${blob.pathname}`);
        console.log(`   📅 ${date} | 📏 ${size}`);
        console.log('');
      });
    }

    // Summary and recommendations
    console.log('💡 RECOMMENDATIONS:');
    console.log('=' .repeat(50));
    
    if (categorized.analysis.misplacedBackups > 0) {
      console.log(`🔧 Need to move ${categorized.analysis.misplacedBackups} backup files to proper directory structure`);
      console.log('   - Create date-based folders (YYYY-MM-DD)');
      console.log('   - Move database backups to backups/database/YYYY-MM-DD/');
      console.log('   - Move full backups to backups/full/YYYY-MM-DD/');
      console.log('   - Preserve all backup data - do not delete');
    } else {
      console.log('✅ All backup files are in proper directory structure');
    }

    if (categorized.analysis.otherFiles > 0) {
      console.log(`📋 ${categorized.analysis.otherFiles} non-backup files found`);
      console.log('   - Review these files to determine if they should be kept');
      console.log('   - Consider organizing them into appropriate folders');
    }

    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Review the misplaced backups above');
    console.log('2. Create a migration script to move files to proper structure');
    console.log('3. Test the migration on a copy first');
    console.log('4. Execute the migration to organize all backup files');

  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    process.exit(1);
  }
}

// Run the analysis
analyzeBlobStructure();
