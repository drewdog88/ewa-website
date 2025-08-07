require('dotenv').config({ path: '.env.local' });
const { getOfficers } = require('./database/neon-functions');

async function testGetOfficers() {
    try {
        console.log('🔍 Testing getOfficers function directly...');
        
        const officers = await getOfficers();
        
        console.log(`📊 getOfficers returned ${officers.length} officers:`);
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
        
    } catch (error) {
        console.error('❌ Error testing getOfficers:', error.message);
    } finally {
        process.exit(0);
    }
}

testGetOfficers();
