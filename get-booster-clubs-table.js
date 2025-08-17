const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function getBoosterClubsTable() {
  console.log('📋 Retrieving all booster club full names from database...\n');
  
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    // Query all booster clubs with their full names
    const clubs = await sql`
      SELECT 
        id,
        name as full_name,
        description,
        is_active,
        created_at
      FROM booster_clubs 
      ORDER BY name ASC
    `;
    
    if (clubs.length === 0) {
      console.log('❌ No booster clubs found in the database');
      return;
    }
    
    console.log(`✅ Found ${clubs.length} booster clubs:\n`);
    
    // Create a formatted table
    console.log('┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐');
    console.log('│                                    BOOSTER CLUBS TABLE                                              │');
    console.log('├─────────────────────────────────────────────────────────────────────────────────────────────────────┤');
    console.log('│ #  │ Full Name                                                    │ Status  │ Created Date            │');
    console.log('├────┼──────────────────────────────────────────────────────────────┼─────────┼────────────────────────┤');
    
    clubs.forEach((club, index) => {
      const number = (index + 1).toString().padStart(2);
      const fullName = club.full_name.padEnd(50);
      const status = club.is_active ? 'Active  ' : 'Inactive';
      const createdDate = new Date(club.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).padEnd(20);
      
      console.log(`│ ${number} │ ${fullName} │ ${status} │ ${createdDate} │`);
    });
    
    console.log('└────┴──────────────────────────────────────────────────────────────┴─────────┴────────────────────────┘');
    
    // Summary statistics
    const activeClubs = clubs.filter(club => club.is_active).length;
    const inactiveClubs = clubs.filter(club => !club.is_active).length;
    
    console.log(`\n📊 Summary:`);
    console.log(`   • Total Clubs: ${clubs.length}`);
    console.log(`   • Active Clubs: ${activeClubs}`);
    console.log(`   • Inactive Clubs: ${inactiveClubs}`);
    
    // Show first few descriptions as examples
    console.log(`\n📝 Sample Descriptions:`);
    clubs.slice(0, 3).forEach((club, index) => {
      console.log(`   ${index + 1}. ${club.full_name}:`);
      console.log(`      ${club.description}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error retrieving booster clubs:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the function
getBoosterClubsTable();
