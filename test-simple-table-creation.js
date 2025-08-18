require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function testSimpleTableCreation() {
  console.log('🔍 Testing Simple Table Creation...');
  console.log('==================================');

  try {
    const sql = neon(process.env.DATABASE_URL);
    console.log('✅ Connected to dev database');
    console.log(`📋 DATABASE_URL: ${process.env.DATABASE_URL.substring(0, 50)}...`);

    // Check current tables
    console.log('\n📋 Current tables:');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    console.log(`   Found ${tables.length} tables`);
    tables.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });

    // Try creating a very simple table
    console.log('\n🔧 Creating simple test table...');
    try {
      await sql.unsafe(`
        CREATE TABLE simple_test (
          id SERIAL PRIMARY KEY,
          name VARCHAR(50) NOT NULL
        )
      `);
      console.log('   ✅ Created simple_test table');

      // Check if it exists
      const tableExists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'simple_test'
        )
      `;
      console.log(`   📋 simple_test exists: ${tableExists[0].exists}`);

      if (tableExists[0].exists) {
        // Try inserting data
        await sql`INSERT INTO simple_test (name) VALUES ('Test Name')`;
        console.log('   ✅ Inserted test data');

        // Try querying data
        const result = await sql`SELECT * FROM simple_test WHERE name = 'Test Name'`;
        console.log(`   📋 Query result: ${JSON.stringify(result[0])}`);

        // Try creating booster_clubs table
        console.log('\n🔧 Creating booster_clubs table...');
        await sql.unsafe(`
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
        `);
        console.log('   ✅ Created booster_clubs table');

        // Check if booster_clubs exists
        const boosterExists = await sql`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'booster_clubs'
          )
        `;
        console.log(`   📋 booster_clubs exists: ${boosterExists[0].exists}`);

        if (boosterExists[0].exists) {
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
        }

        console.log('\n🎉 Success! Tables can be created and persist.');
        console.log('You can now run the complete rebuild script.');
        
        // Clean up
        await sql.unsafe('DROP TABLE IF EXISTS simple_test');
        await sql.unsafe('DROP TABLE IF EXISTS booster_clubs');
        console.log('   🧹 Cleaned up test tables');

      } else {
        console.log('   ❌ Table was not created successfully');
      }

    } catch (error) {
      console.log(`   ❌ Failed to create table: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testSimpleTableCreation();
