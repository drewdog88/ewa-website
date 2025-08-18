require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function testTransaction() {
  console.log('🔍 Testing database transaction behavior...');

  try {
    const sql = neon(process.env.DATABASE_URL);
    console.log('✅ Connected to dev database');

    // Test if we can see the current state
    console.log('\n📋 Current booster_clubs columns:');
    const currentColumns = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'booster_clubs'
      ORDER BY ordinal_position
    `;

    currentColumns.forEach((col, index) => {
      console.log(`${index + 1}. ${col.column_name} (${col.data_type})`);
    });

    // Try a simple INSERT to see if it persists
    console.log('\n🔧 Testing INSERT operation...');
    try {
      const insertResult = await sql`
        INSERT INTO booster_clubs (name, description, is_active)
        VALUES ('Test Club', 'Test Description', true)
        RETURNING id, name
      `;
      console.log(`   ✅ Inserted test record: ${JSON.stringify(insertResult[0])}`);

      // Check if it's still there
      const checkResult = await sql`
        SELECT id, name FROM booster_clubs WHERE name = 'Test Club'
      `;
      console.log(`   📋 Found ${checkResult.length} test records`);

      // Clean up
      await sql`DELETE FROM booster_clubs WHERE name = 'Test Club'`;
      console.log('   🧹 Cleaned up test record');

    } catch (error) {
      console.log(`   ❌ Insert failed: ${error.message}`);
    }

    // Try to add a column with explicit transaction
    console.log('\n🔧 Testing ALTER TABLE with explicit transaction...');
    try {
      // Start a transaction
      await sql.unsafe('BEGIN');
      
      // Add a column
      await sql.unsafe('ALTER TABLE booster_clubs ADD COLUMN transaction_test VARCHAR');
      console.log('   ✅ Added column in transaction');
      
      // Check if it was added
      const checkColumn = await sql`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'booster_clubs' AND column_name = 'transaction_test'
      `;
      
      if (checkColumn.length > 0) {
        console.log('   ✅ Column confirmed in transaction');
      } else {
        console.log('   ❌ Column not found in transaction');
      }
      
      // Commit the transaction
      await sql.unsafe('COMMIT');
      console.log('   ✅ Committed transaction');
      
      // Check again after commit
      const checkAfterCommit = await sql`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'booster_clubs' AND column_name = 'transaction_test'
      `;
      
      if (checkAfterCommit.length > 0) {
        console.log('   ✅ Column confirmed after commit');
      } else {
        console.log('   ❌ Column not found after commit');
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

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testTransaction();
