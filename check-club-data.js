require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function checkClubData() {
    const sql = neon(process.env.DATABASE_URL);
    
    console.log('🔍 Checking existing club data...\n');
    
    // Check officer clubs
    const officerClubs = await sql`SELECT DISTINCT club FROM officers WHERE club IS NOT NULL`;
    console.log('👥 Officer clubs:');
    officerClubs.forEach(row => console.log(`   - "${row.club}"`));
    
    // Check user clubs
    const userClubs = await sql`SELECT DISTINCT club FROM users WHERE club IS NOT NULL`;
    console.log('\n👤 User clubs:');
    userClubs.forEach(row => console.log(`   - "${row.club}"`));
    
    // Check 1099 clubs
    const form1099Clubs = await sql`SELECT DISTINCT booster_club FROM form_1099 WHERE booster_club IS NOT NULL`;
    console.log('\n📋 1099 form clubs:');
    form1099Clubs.forEach(row => console.log(`   - "${row.booster_club}"`));
    
    // Check booster clubs
    const boosterClubs = await sql`SELECT name FROM booster_clubs ORDER BY name`;
    console.log('\n🏆 Booster clubs (reference):');
    boosterClubs.forEach(row => console.log(`   - "${row.name}"`));
    
    // Check remaining unmatched records
    console.log('\n❓ Remaining unmatched officers:');
    const remainingOfficers = await sql`SELECT club, club_id FROM officers WHERE club IS NOT NULL AND club_id IS NULL`;
    remainingOfficers.forEach(row => console.log(`   - "${row.club}" -> club_id: ${row.club_id}`));
    
    console.log('\n❓ Remaining unmatched users:');
    const remainingUsers = await sql`SELECT club, club_id FROM users WHERE club IS NOT NULL AND club_id IS NULL`;
    remainingUsers.forEach(row => console.log(`   - "${row.club}" -> club_id: ${row.club_id}`));
    
    process.exit(0);
}

checkClubData().catch(console.error); 