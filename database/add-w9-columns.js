require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

// Database connection configuration
let sql = null;

// Initialize the Neon connection
function getSql() {
  if (!sql) {
    if (!process.env.DATABASE_URL) {
      console.warn('⚠️ DATABASE_URL not found');
      return null;
    }
    sql = neon(process.env.DATABASE_URL);
    console.log('✅ Connected to Neon PostgreSQL database');
  }
  return sql;
}

async function addW9Columns() {
  const sql = getSql();
  if (!sql) {
    console.error('❌ Database connection not available');
    return;
  }
    
  try {
    console.log('🔄 Adding W9 file columns to form_1099 table...');
        
    // Add W9 file columns
    await sql`
            ALTER TABLE form_1099 
            ADD COLUMN IF NOT EXISTS w9_filename VARCHAR(255),
            ADD COLUMN IF NOT EXISTS w9_blob_url VARCHAR(500),
            ADD COLUMN IF NOT EXISTS w9_file_size INTEGER,
            ADD COLUMN IF NOT EXISTS w9_mime_type VARCHAR(100)
        `;
        
    console.log('✅ W9 file columns added successfully');
        
    // Show the updated table structure
    const columns = await sql`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'form_1099' 
            ORDER BY ordinal_position
        `;
        
    console.log('📋 Updated form_1099 table structure:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
        
  } catch (error) {
    console.error('❌ Error adding W9 columns:', error);
    throw error;
  }
}

// Run the migration
if (require.main === module) {
  addW9Columns()
    .then(() => {
      console.log('🎉 Migration completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { addW9Columns }; 