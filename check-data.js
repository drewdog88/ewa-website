require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function checkData() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    console.log('✅ Connected to database');
    
    // Check booster_clubs table
    console.log('\n📋 Booster Clubs:');
    const clubs = await sql`SELECT id, name, is_active FROM booster_clubs ORDER BY name`;
    console.log(`Found ${clubs.length} booster clubs:`);
    clubs.forEach(club => {
      console.log(`- ${club.name} (${club.is_active ? 'active' : 'inactive'})`);
    });
    
    // Check admin_activity table
    console.log('\n📋 Admin Activity:');
    const activity = await sql`SELECT COUNT(*) as count FROM admin_activity`;
    console.log(`Found ${activity[0].count} admin activity records`);
    
    // Check link_clicks table
    console.log('\n📋 Link Clicks:');
    const clicks = await sql`SELECT COUNT(*) as count FROM link_clicks`;
    console.log(`Found ${clicks[0].count} link click records`);
    
    // Check page_views table
    console.log('\n📋 Page Views:');
    const views = await sql`SELECT COUNT(*) as count FROM page_views`;
    console.log(`Found ${views[0].count} page view records`);
    
    // Check if we have any other tables
    console.log('\n📋 All Tables:');
    const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`;
    console.log('Tables found:', tables.length);
    tables.forEach(table => {
      console.log(`- ${table.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkData();
