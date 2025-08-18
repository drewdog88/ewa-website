require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function testSearch() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    console.log('✅ Connected to database');
    
    // Test simple search
    const searchTerm = '%band%';
    
    console.log('\n🔍 Testing officers search...');
    const officers = await sql`
        SELECT 
            'officers' as category,
            CONCAT(name, ' - ', club_name) as title,
            CONCAT('Officer: ', name, ' (', club_name, ')') as description,
            'officers' as section
        FROM officers 
        WHERE name ILIKE ${searchTerm} 
        OR club_name ILIKE ${searchTerm}
        OR position ILIKE ${searchTerm}
        LIMIT 5
    `;
    console.log('Officers found:', officers.length);
    officers.forEach(officer => console.log('-', officer.title));
    
    console.log('\n🔍 Testing booster clubs search...');
    const clubs = await sql`
        SELECT 
            'clubs' as category,
            name as title,
            CONCAT('Booster Club: ', name) as description,
            'content' as section
        FROM booster_clubs 
        WHERE name ILIKE ${searchTerm} 
        OR description ILIKE ${searchTerm}
        LIMIT 5
    `;
    console.log('Clubs found:', clubs.length);
    clubs.forEach(club => console.log('-', club.title));
    
    console.log('\n🔍 Testing admin activity search...');
    const activity = await sql`
        SELECT 
            'activity' as category,
            CONCAT(action_type, ' - ', admin_user) as title,
            CONCAT('Admin Action: ', action_type, ' by ', admin_user) as description,
            'audit' as section
        FROM admin_activity 
        WHERE action_type ILIKE ${searchTerm} 
        OR admin_user ILIKE ${searchTerm}
        ORDER BY performed_at DESC
        LIMIT 5
    `;
    console.log('Activity found:', activity.length);
    activity.forEach(act => console.log('-', act.title));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testSearch();
