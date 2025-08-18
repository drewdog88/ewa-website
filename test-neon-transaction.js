require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function testNeonTransaction() {
  console.log('🔍 Testing Neon transaction support...');

  try {
    const sql = neon(process.env.DATABASE_URL);
    console.log('✅ Connected to dev database');

    // Test basic query first
    console.log('\n📋 Testing basic query...');
    const testQuery = await sql`SELECT 1 as test`;
    console.log(`   ✅ Basic query works: ${JSON.stringify(testQuery[0])}`);

    // Test if we can see existing tables
    console.log('\n📋 Checking existing tables...');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    console.log(`   📋 Found ${tables.length} tables:`);
    tables.forEach(table => {
      console.log(`      - ${table.table_name}`);
    });

    // Try to create a simple table using a transaction
    console.log('\n🔧 Testing table creation with transaction...');
    
    // Use the transaction method
    const result = await sql.transaction(async (tx) => {
      // Create a simple test table
      await tx.unsafe(`
        CREATE TABLE neon_test_table (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Insert a test record
      const insertResult = await tx`
        INSERT INTO neon_test_table (name) 
        VALUES ('Test Name') 
        RETURNING id, name
      `;
      
      // Query the record
      const queryResult = await tx`
        SELECT * FROM neon_test_table WHERE name = 'Test Name'
      `;
      
      return {
        insertResult: insertResult[0],
        queryResult: queryResult[0]
      };
    });
    
    console.log(`   ✅ Transaction completed: ${JSON.stringify(result)}`);

    // Check if the table exists outside the transaction
    console.log('\n📋 Checking if table exists after transaction...');
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'neon_test_table'
      )
    `;
    console.log(`   📋 Table exists: ${tableExists[0].exists}`);

    if (tableExists[0].exists) {
      const columns = await sql`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'neon_test_table'
        ORDER BY ordinal_position
      `;
      console.log(`   📋 Columns: ${columns.map(c => `${c.column_name} (${c.data_type})`).join(', ')}`);
    }

    // Clean up
    console.log('\n🧹 Cleaning up...');
    await sql.unsafe('DROP TABLE IF EXISTS neon_test_table');
    console.log('   ✅ Cleaned up');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testNeonTransaction();
