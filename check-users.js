require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkUsers() {
  try {
    console.log('🔍 Checking users table structure...');
    
    // First check the table structure
    const structureResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Users table columns:');
    structureResult.rows.forEach(col => {
      console.log(`- ${col.column_name} (${col.data_type})`);
    });
    
    // Now try to get users with the correct column names
    const result = await pool.query('SELECT * FROM users LIMIT 5');
    
    console.log(`\n📋 Users found: ${result.rows.length}`);
    
    if (result.rows.length > 0) {
      result.rows.forEach((user, index) => {
        console.log(`${index + 1}. ${JSON.stringify(user, null, 2)}`);
      });
    } else {
      console.log('❌ No users found in database');
    }
    
  } catch (error) {
    console.error('❌ Error checking users:', error.message);
  } finally {
    await pool.end();
  }
}

checkUsers();
