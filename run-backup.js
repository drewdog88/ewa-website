require('dotenv').config({ path: '.env.local' });
const BackupManager = require('./backup/backup-manager');

async function runBackup() {
  try {
    console.log('🚀 Starting EWA Website Backup...');
    console.log('================================');
    
    const backupManager = new BackupManager();
    
    // Perform full backup
    const result = await backupManager.performFullBackup();
    
    console.log('\n✅ Backup Summary:');
    console.log('==================');
    console.log(`📅 Timestamp: ${result.timestamp}`);
    console.log(`⏱️  Duration: ${result.duration}ms`);
    console.log(`💾 Database: ${(result.database.size / 1024).toFixed(2)} KB`);
    console.log(`📁 Blob Storage: ${(result.blob.size / 1024 / 1024).toFixed(2)} MB (${result.blob.blobCount} files)`);
    console.log(`📊 Total Size: ${(result.totalSize / 1024 / 1024).toFixed(2)} MB`);
    
    // Get backup status
    const status = await backupManager.getBackupStatus();
    console.log(`\n📈 Backup Statistics:`);
    console.log(`   Total Backups: ${status.status.backupCount}`);
    console.log(`   Last Backup: ${status.status.lastBackup || 'Never'}`);
    console.log(`   Status: ${status.status.lastBackupStatus || 'Unknown'}`);
    
    console.log('\n🎉 Backup completed successfully!');
    
  } catch (error) {
    console.error('❌ Backup failed:', error);
    process.exit(1);
  }
}

runBackup();
