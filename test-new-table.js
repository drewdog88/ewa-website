require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function testNewTable() {
  console.log('🔍 Testing creation of new table with all columns...');

  try {
    const sql = neon(process.env.DATABASE_URL);
    console.log('✅ Connected to dev database');

    // Create a new table with all the columns we need
    console.log('\n🏗️ Creating new booster_clubs_complete table...');
    
    const createTableSQL = `
      CREATE TABLE booster_clubs_complete (
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
    `;

    await sql.unsafe(createTableSQL);
    console.log('   ✅ Created booster_clubs_complete table');

    // Check what columns were actually created
    console.log('\n📋 Checking columns in new table...');
    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'booster_clubs_complete'
      ORDER BY ordinal_position
    `;

    console.log('\n📋 Columns in booster_clubs_complete:');
    columns.forEach((col, index) => {
      console.log(`${index + 1}. ${col.column_name} (${col.data_type}) - Nullable: ${col.is_nullable} - Default: ${col.column_default}`);
    });

    // Try to insert a test record
    console.log('\n🔧 Testing INSERT into new table...');
    try {
      const insertResult = await sql`
        INSERT INTO booster_clubs_complete (
          name, description, is_active, is_payment_enabled, sort_order, zelle_url
        )
        VALUES (
          'Test Complete Club', 
          'Test Description', 
          true, 
          true, 
          1, 
          'https://test.com'
        )
        RETURNING id, name, is_payment_enabled, zelle_url
      `;
      console.log(`   ✅ Inserted test record: ${JSON.stringify(insertResult[0])}`);

      // Test a query with the new columns
      const testQuery = await sql`
        SELECT name, is_payment_enabled, sort_order, zelle_url
        FROM booster_clubs_complete
        WHERE name = 'Test Complete Club'
      `;
      console.log(`   ✅ Query works: ${JSON.stringify(testQuery[0])}`);

    } catch (error) {
      console.log(`   ❌ Insert failed: ${error.message}`);
    }

    // Clean up
    console.log('\n🧹 Cleaning up test table...');
    await sql.unsafe('DROP TABLE IF EXISTS booster_clubs_complete');
    console.log('   ✅ Dropped test table');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testNewTable();
