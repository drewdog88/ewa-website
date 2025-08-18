require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function debugRebuildIssue() {
  console.log('🔍 Debugging Rebuild Issue...');
  console.log('============================');

  try {
    const sql = neon(process.env.DATABASE_URL);
    console.log('✅ Connected to dev database\n');

    // Check current tables
    console.log('📋 Current tables in database:');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    
    console.log(`   Found ${tables.length} tables:`);
    tables.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });
    console.log('');

    // Test if we can create a simple table
    console.log('🔧 Testing table creation...');
    try {
      await sql.unsafe(`
        CREATE TABLE test_table (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('   ✅ Successfully created test_table');
      
      // Check if it exists
      const testTables = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name = 'test_table'
      `;
      console.log(`   📋 test_table exists: ${testTables.length > 0}`);
      
      // Clean up
      await sql.unsafe('DROP TABLE test_table');
      console.log('   🧹 Cleaned up test_table');
      
    } catch (error) {
      console.log(`   ❌ Failed to create test table: ${error.message}`);
    }

    // Test creating booster_clubs table manually
    console.log('\n🔧 Testing booster_clubs table creation...');
    try {
      const createBoosterClubsSQL = `
        CREATE TABLE booster_clubs (
          id UUID,
          name VARCHAR(255),
          description TEXT,
          website_url VARCHAR(255),
          donation_url VARCHAR(255),
          is_active BOOLEAN,
          created_at DATE,
          updated_at DATE,
          zelle_qr_code_path VARCHAR(255),
          stripe_donation_link TEXT,
          stripe_membership_link TEXT,
          stripe_fees_link TEXT,
          payment_instructions TEXT,
          is_payment_enabled BOOLEAN,
          last_payment_update_by VARCHAR(255),
          last_payment_update_at DATE,
          zelle_url VARCHAR(255),
          qr_code_settings JSONB,
          stripe_url VARCHAR(255),
          sort_order INTEGER
        )
      `;
      
      await sql.unsafe(createBoosterClubsSQL);
      console.log('   ✅ Successfully created booster_clubs table');
      
      // Check columns
      const columns = await sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'booster_clubs' 
        ORDER BY ordinal_position
      `;
      console.log(`   📋 booster_clubs has ${columns.length} columns:`);
      columns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type}`);
      });
      
      // Clean up
      await sql.unsafe('DROP TABLE booster_clubs');
      console.log('   🧹 Cleaned up booster_clubs');
      
    } catch (error) {
      console.log(`   ❌ Failed to create booster_clubs table: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ Error during debug:', error.message);
  }
}

debugRebuildIssue();
