#!/usr/bin/env node

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Migration script to transition from Redis to Neon PostgreSQL
const { initializeDatabase, migrateDataFromJson } = require('./neon-functions');
const DatabaseBackup = require('./backup');

async function migrateToNeon() {
  console.log('🚀 Starting migration to Neon PostgreSQL...');
    
  try {
    // Step 1: Initialize database schema
    console.log('📋 Initializing database schema...');
    await initializeDatabase();
        
    // Step 2: Migrate data from JSON files
    console.log('📦 Migrating data from JSON files...');
    await migrateDataFromJson();
        
    // Step 3: Create initial backup
    console.log('💾 Creating initial backup...');
    const backup = new DatabaseBackup();
    await backup.createBackup('initial-migration-backup');
        
    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('📊 Migration Summary:');
    console.log('   - Database schema created');
    console.log('   - Data migrated from JSON files');
    console.log('   - Initial backup created');
    console.log('');
    console.log('🔧 Next Steps:');
    console.log('   1. Update your DATABASE_URL environment variable');
    console.log('   2. Test the application functionality');
    console.log('   3. Verify data integrity');
    console.log('   4. Remove Redis dependencies if no longer needed');
        
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateToNeon();
}

module.exports = { migrateToNeon }; 