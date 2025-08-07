require('dotenv').config({ path: '.env.local' });
const { getSql } = require('./database/connection');

async function testFixedQuery() {
    try {
        console.log('🔍 Testing the fixed query...');
        
        const sql = getSql();
        if (!sql) {
            console.error('❌ Database connection not available');
            return;
        }
        
        // Test the exact query from the fixed getOfficers function
        const officers = await sql`
            SELECT o.id, o.name, o.position, o.email, o.phone, o.club_id, o.created_at, o.updated_at, bc.name as clubName 
            FROM officers o 
            LEFT JOIN booster_clubs bc ON o.club_id = bc.id 
            ORDER BY o.created_at
        `;
        
        console.log(`📊 Fixed query returned ${officers.length} officers:`);
        officers.forEach((officer, index) => {
            console.log(`${index + 1}. ${officer.name} - Club ID: ${officer.club_id} - Club Name: ${officer.clubName || 'NULL'}`);
        });
        
        // Check if any officers have clubName
        const officersWithClub = officers.filter(o => o.clubName);
        console.log(`\n📋 Officers with clubName: ${officersWithClub.length}`);
        
        if (officersWithClub.length > 0) {
            officersWithClub.forEach(officer => {
                console.log(`- ${officer.name}: ${officer.clubName}`);
            });
        }
        
        // Test with a different alias name to avoid any conflicts
        console.log('\n📋 Testing with different alias:');
        const officersWithDifferentAlias = await sql`
            SELECT o.id, o.name, o.position, o.email, o.phone, o.club_id, o.created_at, o.updated_at, bc.name as booster_club_name 
            FROM officers o 
            LEFT JOIN booster_clubs bc ON o.club_id = bc.id 
            ORDER BY o.created_at
        `;
        
        console.log(`Different alias query returned ${officersWithDifferentAlias.length} officers:`);
        officersWithDifferentAlias.forEach((officer, index) => {
            console.log(`${index + 1}. ${officer.name} - Club ID: ${officer.club_id} - Booster Club Name: ${officer.booster_club_name || 'NULL'}`);
        });
        
    } catch (error) {
        console.error('❌ Error testing fixed query:', error.message);
    } finally {
        process.exit(0);
    }
}

testFixedQuery();
