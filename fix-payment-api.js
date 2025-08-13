require('dotenv').config({ path: '.env.local' });
const { getSql } = require('./database/neon-functions.js');

async function checkBandBoosterStatus() {
  console.log('Checking Band Booster status in database...\n');
  
  try {
    const sql = getSql();
    
    // Check if Band Booster exists and its status
    const bandData = await sql`
      SELECT id, name, is_payment_enabled, zelle_url, stripe_urls, is_active
      FROM booster_clubs 
      WHERE name = 'EHS Band Boosters'
    `;
    
    console.log('Band Booster data:');
    console.log(JSON.stringify(bandData, null, 2));
    
    // Check if is_active column exists
    const columns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'booster_clubs' 
      AND column_name = 'is_active'
    `;
    
    console.log('\nIs_active column exists:', columns.length > 0);
    
    if (columns.length === 0) {
      console.log('❌ is_active column does not exist - this is causing the API to fail!');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkBandBoosterStatus();
