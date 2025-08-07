require('dotenv').config({ path: '.env.local' });
const { getSql } = require('./database/connection');

async function checkOfficersData() {
    try {
        console.log('🔍 Checking officers data...');
        
        const sql = getSql();
        if (!sql) {
            console.error('❌ Database connection not available');
            return;
        }
        
        // Get officers with club names
        const officers = await sql`
            SELECT o.*, bc.name as clubName 
            FROM officers o 
            LEFT JOIN booster_clubs bc ON o.club_id = bc.id 
            ORDER BY o.created_at
        `;
        
        console.log(`📊 Total officers in database: ${officers.length}`);
        
        console.log('\n📋 Officers data:');
        officers.forEach((officer, index) => {
            console.log(`${index + 1}. ${officer.name} - ${officer.position}`);
            console.log(`   Club ID: ${officer.club_id}`);
            console.log(`   Club Name: ${officer.clubName || 'NULL'}`);
            console.log(`   Email: ${officer.email}`);
            console.log(`   Phone: ${officer.phone || 'N/A'}`);
            console.log(`   Created: ${officer.created_at}`);
            console.log('');
        });
        
        // Check booster clubs
        const clubs = await sql`SELECT * FROM booster_clubs ORDER BY name`;
        console.log('\n🏢 Available booster clubs:');
        clubs.forEach(club => {
            console.log(`- ${club.id}: ${club.name}`);
        });
        
        // Check for EWA Wolfpack Association specifically
        const ewaClub = await sql`SELECT * FROM booster_clubs WHERE name LIKE '%EWA%' OR name LIKE '%Wolfpack%'`;
        console.log('\n🐺 EWA Wolfpack Association club:');
        if (ewaClub.length > 0) {
            ewaClub.forEach(club => {
                console.log(`- ${club.id}: ${club.name}`);
            });
        } else {
            console.log('No EWA Wolfpack Association club found');
        }
        
    } catch (error) {
        console.error('❌ Error checking officers data:', error.message);
    } finally {
        process.exit(0);
    }
}

checkOfficersData();
