// Load environment variables
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

async function addVolunteerStatusColumn() {
  const sql = getSql();
  if (!sql) {
    console.error('❌ Database connection not available');
    return;
  }
    
  try {
    // Add status column to volunteers table
    await sql`ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending'`;
    console.log('✅ Added status column to volunteers table');
    
    // Add notes column for admin notes
    await sql`ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS notes TEXT`;
    console.log('✅ Added notes column to volunteers table');
    
    // Add assigned_club_id column for club assignments
    await sql`ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS assigned_club_id UUID REFERENCES booster_clubs(id)`;
    console.log('✅ Added assigned_club_id column to volunteers table');
    
    // Create index on status for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_volunteers_status ON volunteers(status)`;
    console.log('✅ Created index on volunteers status column');
    
    console.log('✅ Volunteer table migration completed successfully');
  } catch (error) {
    console.error('❌ Error adding volunteer status column:', error);
    throw error;
  }
}

// Run the migration if this file is executed directly
if (require.main === module) {
  addVolunteerStatusColumn()
    .then(() => {
      console.log('✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { addVolunteerStatusColumn };
