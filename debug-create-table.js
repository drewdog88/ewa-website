require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function debugCreateTable() {
  console.log('🔍 Debugging CREATE TABLE statement...');

  try {
    const sql = neon(process.env.DATABASE_URL);
    console.log('✅ Connected to dev database');

    // Drop the table first
    console.log('\n🗑️ Dropping booster_clubs table...');
    await sql.unsafe(`DROP TABLE IF EXISTS booster_clubs CASCADE`);
    console.log('   ✅ Dropped table');

    // Try to create the table with a simpler approach
    console.log('\n🏗️ Creating booster_clubs table with minimal schema...');
    
    const createTableSQL = `
      CREATE TABLE booster_clubs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR NOT NULL,
        description TEXT,
        website_url VARCHAR,
        donation_url VARCHAR,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        is_payment_enabled BOOLEAN DEFAULT false,
        sort_order INTEGER DEFAULT 999
      )
    `;

    console.log('SQL to execute:');
    console.log(createTableSQL);

    await sql.unsafe(createTableSQL);
    console.log('   ✅ Created table');

    // Check what columns were actually created
    console.log('\n📋 Checking actual columns created...');
    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'booster_clubs'
      ORDER BY ordinal_position
    `;

    console.log('\n📋 Actual columns in table:');
    columns.forEach((col, index) => {
      console.log(`${index + 1}. ${col.column_name} (${col.data_type}) - Nullable: ${col.is_nullable} - Default: ${col.column_default}`);
    });

    // Try to add one column manually
    console.log('\n🔧 Trying to add is_payment_enabled column manually...');
    try {
      await sql.unsafe(`ALTER TABLE booster_clubs ADD COLUMN test_column VARCHAR`);
      console.log('   ✅ Added test column');
      
      // Check if it was added
      const testColumns = await sql`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'booster_clubs' AND column_name = 'test_column'
      `;
      
      if (testColumns.length > 0) {
        console.log('   ✅ Test column confirmed');
      } else {
        console.log('   ❌ Test column not found');
      }
    } catch (error) {
      console.log(`   ❌ Failed to add test column: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugCreateTable();
