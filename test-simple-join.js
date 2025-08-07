require('dotenv').config({ path: '.env.local' });
const { getSql } = require('./database/connection');

async function testSimpleJoin() {
    try {
        console.log('🔍 Testing simple JOIN...');
        
        const sql = getSql();
        if (!sql) {
            console.error('❌ Database connection not available');
            return;
        }
        
        // Test the exact same query that worked before
        console.log('\n📋 Testing the working query from earlier:');
        const workingQuery = await sql`
            SELECT o.id, o.name, o.club_id, bc.id as bc_id, bc.name as bc_name
            FROM officers o 
            LEFT JOIN booster_clubs bc ON o.club_id = bc.id 
            WHERE o.club_id = 'f2efccc3-4dbe-4eeb-b65e-ba7e7149c740'
        `;
        
        console.log('Working query result:');
        workingQuery.forEach((row, index) => {
            console.log(`${index + 1}. ${row.name} - Club ID: ${row.club_id} - BC ID: ${row.bc_id} - BC Name: ${row.bc_name}`);
        });
        
        // Now test the getOfficers query format
        console.log('\n📋 Testing getOfficers format:');
        const getOfficersFormat = await sql`
            SELECT o.*, bc.name as clubName 
            FROM officers o 
            LEFT JOIN booster_clubs bc ON o.club_id = bc.id 
            WHERE o.club_id = 'f2efccc3-4dbe-4eeb-b65e-ba7e7149c740'
        `;
        
        console.log('getOfficers format result:');
        getOfficersFormat.forEach((row, index) => {
            console.log(`${index + 1}. ${row.name} - Club ID: ${row.club_id} - Club Name: ${row.clubName || 'NULL'}`);
        });
        
        // Test with a different club_id to see if it's specific to this one
        console.log('\n📋 Testing with a different club_id:');
        const differentClub = await sql`
            SELECT o.*, bc.name as clubName 
            FROM officers o 
            LEFT JOIN booster_clubs bc ON o.club_id = bc.id 
            WHERE o.club_id = '5c5d9238-dc96-4ad0-b6fe-6282b06573bc'
        `;
        
        console.log('Different club result:');
        differentClub.forEach((row, index) => {
            console.log(`${index + 1}. ${row.name} - Club ID: ${row.club_id} - Club Name: ${row.clubName || 'NULL'}`);
        });
        
    } catch (error) {
        console.error('❌ Error testing simple JOIN:', error.message);
    } finally {
        process.exit(0);
    }
}

testSimpleJoin();
