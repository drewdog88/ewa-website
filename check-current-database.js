require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function checkCurrentDatabase() {
  console.log('🔍 Checking which database we\'re connected to...');
  
  try {
    const sql = neon(process.env.DATABASE_URL);
    console.log('✅ Connected to database');
    
    // Check current database name
    const dbResult = await sql`SELECT current_database() as db_name`;
    console.log('📊 Current database:', dbResult[0].db_name);
    
    // Check current user
    const userResult = await sql`SELECT current_user as user_name`;
    console.log('👤 Current user:', userResult[0].user_name);
    
    // Check DATABASE_URL (without password)
    const dbUrl = process.env.DATABASE_URL;
    const urlParts = dbUrl.split('/');
    const dbName = urlParts[urlParts.length - 1].split('?')[0];
    console.log('🔗 Database from URL:', dbName);
    
    // List all tables
    const tablesResult = await sql`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    console.log('📋 Tables in database:');
    tablesResult.forEach(table => {
      console.log(`  - ${table.table_name} (${table.table_type})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkCurrentDatabase();
