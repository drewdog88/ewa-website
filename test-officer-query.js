require('dotenv').config({ path: '.env.local' });
const { getSql } = require('./database/connection');

async function testOfficerQuery() {
  try {
    console.log('🔍 Testing officer query...');
        
    const sql = getSql();
    if (!sql) {
      console.error('❌ Database connection not available');
      return;
    }
        
    // Test the exact query from getOfficers function
    console.log('\n📋 Testing getOfficers query:');
    const officers = await sql`
            SELECT o.*, bc.name as clubName 
            FROM officers o 
            LEFT JOIN booster_clubs bc ON o.club_id = bc.id 
            ORDER BY o.created_at
        `;
        
    console.log(`Found ${officers.length} officers:`);
    officers.forEach((officer, index) => {
      console.log(`${index + 1}. ${officer.name} - Club ID: ${officer.club_id} - Club Name: ${officer.clubName || 'NULL'}`);
    });
        
    // Test individual queries to debug
    console.log('\n🔍 Testing individual queries:');
        
    // Check the specific club_id that officers have
    const officerClubIds = await sql`SELECT DISTINCT club_id FROM officers WHERE club_id IS NOT NULL`;
    console.log('Officer club_ids:', officerClubIds.map(r => r.club_id));
        
    // Check if the club exists
    const clubExists = await sql`SELECT * FROM booster_clubs WHERE id = ${officerClubIds[0].club_id}`;
    console.log('Club exists:', clubExists.length > 0 ? 'Yes' : 'No');
    if (clubExists.length > 0) {
      console.log('Club details:', clubExists[0]);
    }
        
    // Test the JOIN manually
    console.log('\n🔍 Testing manual JOIN:');
    const manualJoin = await sql`
            SELECT o.id, o.name, o.club_id, bc.id as bc_id, bc.name as bc_name
            FROM officers o 
            LEFT JOIN booster_clubs bc ON o.club_id = bc.id 
            WHERE o.club_id = ${officerClubIds[0].club_id}
        `;
    console.log('Manual JOIN result:', manualJoin);
        
  } catch (error) {
    console.error('❌ Error testing officer query:', error.message);
  } finally {
    process.exit(0);
  }
}

testOfficerQuery();
