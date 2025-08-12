require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function addClubIdToInsurance() {
  try {
    console.log('🔧 Adding club_id column to insurance_forms table...');
    
    // Add club_id column
    await sql`
      ALTER TABLE insurance_forms 
      ADD COLUMN IF NOT EXISTS club_id UUID REFERENCES booster_clubs(id)
    `;
    
    console.log('✅ club_id column added successfully');
    
    // Verify the column was added
    const columns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'insurance_forms' AND column_name = 'club_id'
    `;
    
    if (columns.length > 0) {
      console.log('✅ club_id column verified:', columns[0]);
    } else {
      console.log('❌ club_id column not found');
    }
    
  } catch (error) {
    console.error('❌ Error adding club_id column:', error);
  }
}

addClubIdToInsurance().then(() => {
  console.log('🏁 Migration completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
