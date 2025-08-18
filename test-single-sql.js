require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function testSingleSQL() {
  console.log('🔍 Testing single SQL statement approach...');

  try {
    const sql = neon(process.env.DATABASE_URL);
    console.log('✅ Connected to dev database');

    // Create a single SQL statement that drops and recreates the table
    console.log('\n🏗️ Creating table with single SQL statement...');
    
    const singleSQL = `
      DROP TABLE IF EXISTS booster_clubs_new CASCADE;
      
      CREATE TABLE booster_clubs_new (
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
      );
      
      INSERT INTO booster_clubs_new (name, description, is_active, is_payment_enabled, sort_order, zelle_url)
      VALUES ('Test Club', 'Test Description', true, true, 1, 'https://test.com');
    `;

    console.log('Executing single SQL statement...');
    await sql.unsafe(singleSQL);
    console.log('   ✅ Single SQL statement executed');

    // Check if the table was created
    console.log('\n📋 Checking if table was created...');
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'booster_clubs_new'
      )
    `;
    console.log(`   📋 Table exists: ${tableExists[0].exists}`);

    if (tableExists[0].exists) {
      // Check columns
      const columns = await sql`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'booster_clubs_new'
        ORDER BY ordinal_position
      `;
      console.log(`   📋 Columns: ${columns.map(c => c.column_name).join(', ')}`);

      // Check data
      const data = await sql`
        SELECT name, is_payment_enabled, sort_order, zelle_url
        FROM booster_clubs_new
        WHERE name = 'Test Club'
      `;
      console.log(`   📋 Data: ${JSON.stringify(data[0])}`);
    }

    // Clean up
    console.log('\n🧹 Cleaning up...');
    await sql.unsafe('DROP TABLE IF EXISTS booster_clubs_new');
    console.log('   ✅ Cleaned up');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testSingleSQL();
