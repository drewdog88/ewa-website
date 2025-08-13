// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { neon } = require('@neondatabase/serverless');

async function checkAuditTable() {
  console.log('🔍 Checking if payment_audit_log table exists...');
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'payment_audit_log'
      )
    `;
    
    console.log('payment_audit_log table exists:', result[0].exists);
    
    if (result[0].exists) {
      // Check table structure
      const columns = await sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'payment_audit_log'
        ORDER BY ordinal_position
      `;
      
      console.log('Table columns:');
      columns.forEach(col => console.log(`  ${col.column_name}: ${col.data_type}`));
    }
    
  } catch (error) {
    console.error('❌ Error checking table:', error);
  }
}

checkAuditTable();
