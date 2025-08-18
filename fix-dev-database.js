require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

async function fixDevDatabase() {
  console.log('🔧 Fixing dev database with complete backup data...');
  
  try {
    const sql = neon(process.env.DATABASE_URL);
    console.log('✅ Connected to database');
    
    // Read the most recent backup file
    const backupPath = path.join(__dirname, 'backup', 'backups', 'db-backup-2025-08-17T05-24-11-382Z.sql');
    const backup = fs.readFileSync(backupPath, 'utf8');
    console.log('📋 Backup file loaded, length:', backup.length);
    
    // First, drop all existing tables to start fresh
    console.log('🗑️ Dropping existing tables...');
    const dropTables = [
      'DROP TABLE IF EXISTS backup_metadata CASCADE',
      'DROP TABLE IF EXISTS backup_status CASCADE', 
      'DROP TABLE IF EXISTS booster_clubs CASCADE',
      'DROP TABLE IF EXISTS documents CASCADE',
      'DROP TABLE IF EXISTS form_1099 CASCADE',
      'DROP TABLE IF EXISTS insurance_forms CASCADE',
      'DROP TABLE IF EXISTS link_clicks CASCADE',
      'DROP TABLE IF EXISTS links CASCADE',
      'DROP TABLE IF EXISTS news CASCADE',
      'DROP TABLE IF EXISTS officers CASCADE',
      'DROP TABLE IF EXISTS page_views CASCADE',
      'DROP TABLE IF EXISTS users CASCADE',
      'DROP TABLE IF EXISTS volunteers CASCADE'
    ];
    
    for (const dropStatement of dropTables) {
      try {
        await sql.unsafe(dropStatement);
        console.log(`✅ Dropped table: ${dropStatement.split(' ')[4]}`);
      } catch (error) {
        console.log(`⚠️ Could not drop table: ${error.message}`);
      }
    }
    
    // Split backup into individual statements
    const statements = backup.split(';').filter(stmt => stmt.trim().length > 0);
    console.log('📝 Found', statements.length, 'statements to execute');
    
    // Execute each statement individually
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement.length === 0) continue;
      
      try {
        await sql.unsafe(statement);
        successCount++;
        
        // Log progress every 10 statements
        if (successCount % 10 === 0) {
          console.log(`✅ Processed ${successCount} statements...`);
        }
      } catch (error) {
        errorCount++;
        console.log(`❌ Statement ${i + 1} failed:`, error.message);
        
        // Continue with next statement instead of stopping
      }
    }
    
    console.log('\n🎉 Database restoration completed!');
    console.log(`✅ Successful statements: ${successCount}`);
    console.log(`❌ Failed statements: ${errorCount}`);
    
    // Verify the booster_clubs table structure
    console.log('\n📋 Verifying booster_clubs table structure...');
    const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'booster_clubs' 
      ORDER BY ordinal_position
    `;
    
    console.log('Columns in booster_clubs table:');
    columns.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });
    
    // Check club count
    const clubCount = await sql`SELECT COUNT(*) as count FROM booster_clubs`;
    console.log(`\n📊 Total clubs: ${clubCount[0].count}`);
    
    // Check a few sample clubs
    const sampleClubs = await sql`
      SELECT name, website_url, is_payment_enabled, sort_order 
      FROM booster_clubs 
      ORDER BY sort_order, name 
      LIMIT 3
    `;
    
    console.log('\n📋 Sample clubs:');
    sampleClubs.forEach((club, index) => {
      console.log(`${index + 1}. ${club.name}`);
      console.log(`   Website: ${club.website_url || 'NULL'}`);
      console.log(`   Payment Enabled: ${club.is_payment_enabled}`);
      console.log(`   Sort Order: ${club.sort_order}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixDevDatabase();
