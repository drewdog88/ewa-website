require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function checkDatabaseTables() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    
    // Get all tables
    const tablesResult = await sql`
      SELECT table_name, table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    
    console.log('📊 Database Tables Found:');
    console.log('========================');
    
    for (const table of tablesResult) {
      console.log(`- ${table.table_name} (${table.table_type})`);
    }
    
    console.log(`\nTotal tables: ${tablesResult.length}`);
    
    // Check for any views or other objects
    const viewsResult = await sql`
      SELECT table_name, table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type != 'BASE TABLE'
      ORDER BY table_name
    `;
    
    if (viewsResult.length > 0) {
      console.log('\n📋 Other Database Objects:');
      console.log('==========================');
      viewsResult.forEach(view => {
        console.log(`- ${view.table_name} (${view.table_type})`);
      });
    }
    
  } catch (error) {
    console.error('Error checking database tables:', error);
  }
}

checkDatabaseTables();
