require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function debugTable() {
  console.log('🔍 Debugging booster_clubs table...');
  
  try {
    const sql = neon(process.env.DATABASE_URL);
    console.log('✅ Connected to database');
    
    // Check all tables with similar names
    console.log('\n📋 All tables with "booster" in the name:');
    const allTables = await sql`
      SELECT table_name, table_schema 
      FROM information_schema.tables 
      WHERE table_name LIKE '%booster%'
      ORDER BY table_name
    `;
    
    allTables.forEach(table => {
      console.log(`   - ${table.table_schema}.${table.table_name}`);
    });
    
    // Check the specific booster_clubs table
    console.log('\n📋 booster_clubs table details:');
    const tableInfo = await sql`
      SELECT table_name, table_schema, table_type
      FROM information_schema.tables 
      WHERE table_name = 'booster_clubs'
    `;
    
    if (tableInfo.length > 0) {
      console.log(`   Schema: ${tableInfo[0].table_schema}`);
      console.log(`   Type: ${tableInfo[0].table_type}`);
    } else {
      console.log('   ❌ Table not found!');
    }
    
    // Check columns with more detail
    console.log('\n📋 Detailed column information:');
    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default, ordinal_position
      FROM information_schema.columns 
      WHERE table_name = 'booster_clubs' 
      ORDER BY ordinal_position
    `;
    
    console.log('Columns in booster_clubs table:');
    columns.forEach(col => {
      console.log(`   ${col.ordinal_position}. ${col.column_name} (${col.data_type}) - Nullable: ${col.is_nullable} - Default: ${col.column_default || 'NULL'}`);
    });
    
    // Try to manually add a column and see what happens
    console.log('\n🧪 Testing manual column addition...');
    try {
      await sql.unsafe('ALTER TABLE booster_clubs ADD COLUMN test_column VARCHAR(10)');
      console.log('✅ Successfully added test column');
      
      // Check if it was added
      const testColumn = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'booster_clubs' AND column_name = 'test_column'
      `;
      
      if (testColumn.length > 0) {
        console.log('✅ Test column is visible in schema');
      } else {
        console.log('❌ Test column not visible in schema');
      }
      
      // Remove the test column
      await sql.unsafe('ALTER TABLE booster_clubs DROP COLUMN test_column');
      console.log('✅ Removed test column');
      
    } catch (error) {
      console.log('❌ Failed to add test column:', error.message);
    }
    
    // Check if we're in a transaction
    console.log('\n🔍 Checking transaction status...');
    try {
      const txStatus = await sql`SELECT txid_current()`;
      console.log(`   Current transaction ID: ${txStatus[0].txid_current}`);
    } catch (error) {
      console.log('   Could not check transaction status:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugTable();
