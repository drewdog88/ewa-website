require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function checkBoosterClubsSchema() {
  console.log('🔍 Checking booster_clubs table schema...');
  
  try {
    const sql = neon(process.env.DATABASE_URL);
    console.log('✅ Connected to dev database');
    
    // Get the actual schema from the database
    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'booster_clubs'
      ORDER BY ordinal_position
    `;
    
    console.log('\n📋 Current booster_clubs table schema:');
    console.log('=' .repeat(80));
    columns.forEach((col, index) => {
      console.log(`${index + 1}. ${col.column_name} (${col.data_type}) - Nullable: ${col.is_nullable} - Default: ${col.column_default || 'NULL'}`);
    });
    
    // Check what columns are in the production JSON
    console.log('\n📋 Production JSON columns (from first record):');
    console.log('=' .repeat(80));
    const fs = require('fs');
    const path = require('path');
    const jsonPath = path.join(__dirname, 'NeonDBBackup', 'booster_clubs.json');
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    if (data.length > 0) {
      const firstRecord = data[0];
      Object.keys(firstRecord).forEach((key, index) => {
        console.log(`${index + 1}. ${key}`);
      });
    }
    
    // Compare and identify missing columns
    console.log('\n🔍 Missing columns analysis:');
    console.log('=' .repeat(80));
    
    const dbColumns = columns.map(col => col.column_name);
    const jsonColumns = data.length > 0 ? Object.keys(data[0]) : [];
    
    const missingInDb = jsonColumns.filter(col => !dbColumns.includes(col));
    const extraInDb = dbColumns.filter(col => !jsonColumns.includes(col));
    
    if (missingInDb.length > 0) {
      console.log('❌ Columns in JSON but missing in database:');
      missingInDb.forEach(col => console.log(`   - ${col}`));
    } else {
      console.log('✅ All JSON columns are present in database');
    }
    
    if (extraInDb.length > 0) {
      console.log('\n⚠️ Extra columns in database not in JSON:');
      extraInDb.forEach(col => console.log(`   - ${col}`));
    }
    
    // Check a sample record to see what data we have
    console.log('\n📋 Sample record from database:');
    console.log('=' .repeat(80));
    const sampleRecord = await sql`SELECT * FROM booster_clubs LIMIT 1`;
    if (sampleRecord.length > 0) {
      Object.keys(sampleRecord[0]).forEach(key => {
        console.log(`${key}: ${sampleRecord[0][key]}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkBoosterClubsSchema();
