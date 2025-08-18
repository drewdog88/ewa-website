require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function checkConnection() {
  console.log('🔍 Checking database connection and permissions...');

  try {
    const sql = neon(process.env.DATABASE_URL);
    console.log('✅ Connected to database');

    // Check current user and database
    console.log('\n📋 Connection details:');
    const currentUser = await sql`SELECT current_user, current_database()`;
    console.log(`   👤 Current user: ${currentUser[0].current_user}`);
    console.log(`   🗄️ Current database: ${currentUser[0].current_database}`);

    // Check if we can create tables
    console.log('\n🔧 Testing table creation permissions...');
    try {
      await sql.unsafe('CREATE TABLE permission_test (id SERIAL PRIMARY KEY, name VARCHAR)');
      console.log('   ✅ Can create tables');
      
      // Check if we can insert data
      await sql`INSERT INTO permission_test (name) VALUES ('test')`;
      console.log('   ✅ Can insert data');
      
      // Check if we can query data
      const result = await sql`SELECT * FROM permission_test`;
      console.log(`   ✅ Can query data: ${JSON.stringify(result[0])}`);
      
      // Clean up
      await sql.unsafe('DROP TABLE permission_test');
      console.log('   ✅ Can drop tables');
      
    } catch (error) {
      console.log(`   ❌ Permission test failed: ${error.message}`);
    }

    // Check if we can see the existing booster_clubs table
    console.log('\n📋 Checking existing booster_clubs table...');
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'booster_clubs'
      )
    `;
    console.log(`   📋 booster_clubs table exists: ${tableExists[0].exists}`);

    if (tableExists[0].exists) {
      const columns = await sql`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'booster_clubs'
        ORDER BY ordinal_position
      `;
      console.log(`   📋 Current columns: ${columns.map(c => c.column_name).join(', ')}`);
    }

    // Check if we can alter the existing table
    console.log('\n🔧 Testing ALTER TABLE permissions...');
    try {
      await sql.unsafe('ALTER TABLE booster_clubs ADD COLUMN permission_test_column VARCHAR');
      console.log('   ✅ Can alter existing table');
      
      // Check if the column was added
      const newColumns = await sql`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'booster_clubs' AND column_name = 'permission_test_column'
      `;
      
      if (newColumns.length > 0) {
        console.log('   ✅ Column was actually added');
        // Remove the test column
        await sql.unsafe('ALTER TABLE booster_clubs DROP COLUMN permission_test_column');
        console.log('   ✅ Can drop columns');
      } else {
        console.log('   ❌ Column was not actually added');
      }
      
    } catch (error) {
      console.log(`   ❌ ALTER TABLE failed: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ Connection error:', error.message);
  }
}

checkConnection();
