require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

async function fixBoosterClubsTable() {
  console.log('🔧 Fixing booster_clubs table with ALL columns...');
  
  try {
    const sql = neon(process.env.DATABASE_URL);
    console.log('✅ Connected to dev database');
    
    // Drop the existing table
    console.log('\n🗑️ Dropping existing booster_clubs table...');
    await sql.unsafe(`DROP TABLE IF EXISTS booster_clubs CASCADE`);
    console.log('   ✅ Dropped existing table');
    
    // Create the table with ALL columns from production
    console.log('\n🏗️ Creating booster_clubs table with complete schema...');
    await sql.unsafe(`
      CREATE TABLE booster_clubs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR NOT NULL,
        description TEXT,
        website_url VARCHAR,
        donation_url VARCHAR,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        zelle_qr_code_path VARCHAR,
        stripe_donation_link VARCHAR,
        stripe_membership_link VARCHAR,
        stripe_fees_link VARCHAR,
        payment_instructions TEXT,
        is_payment_enabled BOOLEAN DEFAULT false,
        last_payment_update_by VARCHAR,
        last_payment_update_at TIMESTAMP WITH TIME ZONE,
        zelle_url TEXT,
        qr_code_settings JSONB DEFAULT '{"color": {"dark": "#000000", "light": "#FFFFFF"}, "width": 640, "margin": 2, "errorCorrectionLevel": "M"}'::jsonb,
        stripe_url VARCHAR,
        sort_order INTEGER DEFAULT 999
      )
    `);
    console.log('   ✅ Created table with complete schema');
    
    // Restore data from production JSON
    console.log('\n📥 Restoring data from production JSON...');
    const jsonPath = path.join(__dirname, 'NeonDBBackup', 'booster_clubs.json');
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    console.log(`   📋 Found ${data.length} records to restore`);
    
    for (const record of data) {
      const columns = Object.keys(record);
      const values = Object.values(record);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
      
      const insertQuery = `
        INSERT INTO booster_clubs (${columns.map(col => `"${col}"`).join(', ')})
        VALUES (${placeholders})
      `;
      
      try {
        await sql.unsafe(insertQuery, values);
      } catch (error) {
        console.log(`      ⚠️ Failed to insert record: ${error.message}`);
      }
    }
    
    console.log('   ✅ Data restoration completed');
    
    // Verify the restore
    console.log('\n📋 Verifying restore...');
    const count = await sql`SELECT COUNT(*) as count FROM booster_clubs`;
    console.log(`   📊 Total records: ${count[0].count}`);
    
    // Check schema again
    const columns = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'booster_clubs'
      ORDER BY ordinal_position
    `;
    
    console.log('\n📋 Final table schema:');
    console.log('=' .repeat(80));
    columns.forEach((col, index) => {
      console.log(`${index + 1}. ${col.column_name} (${col.data_type})`);
    });
    
    // Check a sample record with all columns
    console.log('\n📋 Sample record with all columns:');
    console.log('=' .repeat(80));
    const sampleRecord = await sql`SELECT * FROM booster_clubs LIMIT 1`;
    if (sampleRecord.length > 0) {
      Object.keys(sampleRecord[0]).forEach(key => {
        const value = sampleRecord[0][key];
        console.log(`${key}: ${value !== null ? value : 'NULL'}`);
      });
    }
    
    console.log('\n🎉 Booster clubs table fixed!');
    console.log('\n🔗 You can now:');
    console.log('   - Visit: https://ewa-website-dev.vercel.app');
    console.log('   - All payment features should work correctly');
    console.log('   - Sort order should be preserved');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixBoosterClubsTable();
