require('dotenv').config({ path: '.env.local' });
const { neon, neonConfig } = require('@neondatabase/serverless');

async function testNeonConnection() {
  console.log('🔍 Testing Neon Connection and Table Creation...');
  console.log('===============================================');

  try {
    // Enable connection pooling
    neonConfig.fetchConnectionCache = true;
    
    const sql = neon(process.env.DATABASE_URL);
    console.log('✅ Connected to dev database');
    console.log(`📋 DATABASE_URL: ${process.env.DATABASE_URL.substring(0, 50)}...`);

    // Check current database info
    console.log('\n📋 Database Information:');
    const dbInfo = await sql`SELECT current_database(), current_user, version()`;
    console.log(`   Database: ${dbInfo[0].current_database}`);
    console.log(`   User: ${dbInfo[0].current_user}`);
    console.log(`   Version: ${dbInfo[0].version.substring(0, 50)}...`);

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

    // Try creating a table with explicit transaction
    console.log('\n🔧 Testing table creation with explicit transaction...');
    try {
      // Start transaction
      await sql.unsafe('BEGIN');
      console.log('   ✅ Started transaction');

      // Create table
      await sql.unsafe(`
        CREATE TABLE neon_test_table (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('   ✅ Created table in transaction');

      // Check if table exists within transaction
      const tableExists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'neon_test_table'
        )
      `;
      console.log(`   📋 Table exists in transaction: ${tableExists[0].exists}`);

      // Commit transaction
      await sql.unsafe('COMMIT');
      console.log('   ✅ Committed transaction');

      // Check if table exists after commit
      const tableExistsAfter = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'neon_test_table'
        )
      `;
      console.log(`   📋 Table exists after commit: ${tableExistsAfter[0].exists}`);

      if (tableExistsAfter[0].exists) {
        // Test inserting data
        await sql`INSERT INTO neon_test_table (name) VALUES ('Test Name')`;
        console.log('   ✅ Inserted test data');

        const result = await sql`SELECT * FROM neon_test_table WHERE name = 'Test Name'`;
        console.log(`   📋 Query result: ${JSON.stringify(result[0])}`);

        // Clean up
        await sql.unsafe('DROP TABLE neon_test_table');
        console.log('   🧹 Cleaned up test table');
      }

    } catch (error) {
      console.log(`   ❌ Transaction failed: ${error.message}`);
      try {
        await sql.unsafe('ROLLBACK');
        console.log('   🔄 Rolled back transaction');
      } catch (rollbackError) {
        console.log(`   ❌ Rollback failed: ${rollbackError.message}`);
      }
    }

    // Try using the transaction method
    console.log('\n🔧 Testing table creation with sql.transaction()...');
    try {
      const result = await sql.transaction(async (tx) => {
        // Create table
        await tx.unsafe(`
          CREATE TABLE neon_transaction_test (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Insert data
        await tx`INSERT INTO neon_transaction_test (name) VALUES ('Transaction Test')`;

        // Query data
        const data = await tx`SELECT * FROM neon_transaction_test WHERE name = 'Transaction Test'`;

        return data[0];
      });

      console.log(`   ✅ Transaction completed: ${JSON.stringify(result)}`);

      // Check if table exists outside transaction
      const tableExists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'neon_transaction_test'
        )
      `;
      console.log(`   📋 Table exists after transaction: ${tableExists[0].exists}`);

      if (tableExists[0].exists) {
        // Clean up
        await sql.unsafe('DROP TABLE neon_transaction_test');
        console.log('   🧹 Cleaned up transaction test table');
      }

    } catch (error) {
      console.log(`   ❌ sql.transaction() failed: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testNeonConnection();
