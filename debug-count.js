require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function debugCount() {
  console.log('🔍 Debugging count result format...');
  
  try {
    const sql = neon(process.env.DATABASE_URL);
    console.log('✅ Connected to database');
    
    // Test count query
    const result = await sql.unsafe(`SELECT COUNT(*) as count FROM "users"`);
    console.log('Raw result:', JSON.stringify(result, null, 2));
    console.log('Result type:', typeof result);
    console.log('Result length:', result.length);
    
    if (result.length > 0) {
      console.log('First row:', JSON.stringify(result[0], null, 2));
      console.log('Count value:', result[0].count);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugCount();
