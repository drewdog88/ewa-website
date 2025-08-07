require('dotenv').config({ path: '.env.local' });
const { getSql } = require('./database/connection');

async function debugGetOfficers() {
    try {
        console.log('🔍 Debugging getOfficers function...');
        
        const sql = getSql();
        if (!sql) {
            console.error('❌ Database connection not available');
            return;
        }
        
        // Test 1: Direct query with exact same SQL as getOfficers
        console.log('\n📋 Test 1: Direct query (same as getOfficers)');
        const directQuery = await sql`
            SELECT o.*, bc.name as clubName 
            FROM officers o 
            LEFT JOIN booster_clubs bc ON o.club_id = bc.id 
            ORDER BY o.created_at
        `;
        
        console.log(`Direct query returned ${directQuery.length} officers:`);
        directQuery.forEach((officer, index) => {
            console.log(`${index + 1}. ${officer.name} - Club ID: ${officer.club_id} - Club Name: ${officer.clubName || 'NULL'}`);
        });
        
        // Test 2: Check if there are any NULL club_ids
        console.log('\n📋 Test 2: Check for NULL club_ids');
        const nullClubIds = await sql`SELECT COUNT(*) as count FROM officers WHERE club_id IS NULL`;
        console.log(`Officers with NULL club_id: ${nullClubIds[0].count}`);
        
        // Test 3: Check if there are any club_ids that don't exist in booster_clubs
        console.log('\n📋 Test 3: Check for orphaned club_ids');
        const orphaned = await sql`
            SELECT o.club_id, COUNT(*) as count 
            FROM officers o 
            LEFT JOIN booster_clubs bc ON o.club_id = bc.id 
            WHERE bc.id IS NULL AND o.club_id IS NOT NULL 
            GROUP BY o.club_id
        `;
        console.log(`Orphaned club_ids: ${orphaned.length}`);
        orphaned.forEach(orphan => {
            console.log(`- ${orphan.club_id}: ${orphan.count} officers`);
        });
        
        // Test 4: Check the exact data types
        console.log('\n📋 Test 4: Check data types');
        const sampleOfficer = await sql`SELECT club_id FROM officers LIMIT 1`;
        const sampleClub = await sql`SELECT id FROM booster_clubs LIMIT 1`;
        
        console.log(`Sample officer club_id type: ${typeof sampleOfficer[0].club_id}`);
        console.log(`Sample club id type: ${typeof sampleClub[0].id}`);
        console.log(`Sample officer club_id: ${sampleOfficer[0].club_id}`);
        console.log(`Sample club id: ${sampleClub[0].id}`);
        console.log(`Are they equal? ${sampleOfficer[0].club_id === sampleClub[0].id}`);
        
        // Test 5: Try with explicit type casting
        console.log('\n📋 Test 5: Try with explicit type casting');
        const castQuery = await sql`
            SELECT o.*, bc.name as clubName 
            FROM officers o 
            LEFT JOIN booster_clubs bc ON o.club_id::text = bc.id::text 
            ORDER BY o.created_at
        `;
        
        console.log(`Cast query returned ${castQuery.length} officers:`);
        castQuery.forEach((officer, index) => {
            console.log(`${index + 1}. ${officer.name} - Club ID: ${officer.club_id} - Club Name: ${officer.clubName || 'NULL'}`);
        });
        
    } catch (error) {
        console.error('❌ Error debugging getOfficers:', error.message);
    } finally {
        process.exit(0);
    }
}

debugGetOfficers();
