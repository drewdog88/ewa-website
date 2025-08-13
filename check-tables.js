require('dotenv').config({ path: '.env.local' });
const { getSql } = require('./database/neon-functions.js');

async function checkTables() {
  console.log('Checking database tables...\n');
  
  try {
    const sql = getSql();
    
    // Get all table names
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    console.log('Available tables:');
    tables.forEach(table => {
      console.log(`- ${table.table_name}`);
    });
    
    // Check if there's a specific table for Zelle URLs
    const zelleTables = tables.filter(t => t.table_name.toLowerCase().includes('zelle'));
    if (zelleTables.length > 0) {
      console.log('\nZelle-related tables found:');
      zelleTables.forEach(table => {
        console.log(`- ${table.table_name}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkTables();
