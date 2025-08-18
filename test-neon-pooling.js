require('dotenv').config({ path: '.env.local' });
const { neon, neonConfig } = require('@neondatabase/serverless');

async function testNeonPooling() {
  console.log('🔍 Testing Neon connection pooling...');

  try {
    // Configure Neon to use connection pooling
    neonConfig.fetchConnectionCache = true;
    
    const sql = neon(process.env.DATABASE_URL);
    console.log('✅ Connected to database with pooling');

    // Test basic operations
    console.log('\n📋 Testing basic operations...');
    const testQuery = await sql`SELECT 1 as test`;
    console.log(`   ✅ Basic query: ${JSON.stringify(testQuery[0])}`);

    // Try to create a table with a simple approach
    console.log('\n🏗️ Testing table creation with pooling...');
    
    // Drop any existing test table
    await sql.unsafe('DROP TABLE IF EXISTS pooling_test');
    
    // Create a simple table
    await sql.unsafe(`
      CREATE TABLE pooling_test (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('   ✅ Created pooling_test table');

    // Insert data
    await sql`INSERT INTO pooling_test (name) VALUES ('Test Name')`;
    console.log('   ✅ Inserted data');

    // Query data
    const result = await sql`SELECT * FROM pooling_test WHERE name = 'Test Name'`;
    console.log(`   ✅ Queried data: ${JSON.stringify(result[0])}`);

    // Check if table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'pooling_test'
      )
    `;
    console.log(`   📋 Table exists: ${tableExists[0].exists}`);

    // Clean up
    await sql.unsafe('DROP TABLE pooling_test');
    console.log('   ✅ Cleaned up');

    // Now try to alter the existing booster_clubs table
    console.log('\n🔧 Testing ALTER TABLE with pooling...');
    
    // Add a test column
    await sql.unsafe('ALTER TABLE booster_clubs ADD COLUMN pooling_test_column VARCHAR');
    console.log('   ✅ Added test column');

    // Check if it was added
    const columnExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'booster_clubs' AND column_name = 'pooling_test_column'
      )
    `;
    console.log(`   📋 Column exists: ${columnExists[0].exists}`);

    if (columnExists[0].exists) {
      // Remove the test column
      await sql.unsafe('ALTER TABLE booster_clubs DROP COLUMN pooling_test_column');
      console.log('   ✅ Removed test column');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testNeonPooling();
