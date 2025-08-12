require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function checkDatabaseUrls() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const clubs = await sql`SELECT name, website_url FROM booster_clubs WHERE website_url IS NOT NULL AND website_url != '' ORDER BY name`;
    
    console.log('Booster Club Website URLs in Database:');
    console.log('=====================================');
    clubs.forEach(club => {
      console.log(`${club.name}: ${club.website_url}`);
    });
    
    console.log(`\nTotal clubs with URLs: ${clubs.length}`);
    
    // Also check all clubs
    const allClubs = await sql`SELECT name, website_url FROM booster_clubs ORDER BY name`;
    console.log(`\nTotal clubs in database: ${allClubs.length}`);
    
    console.log('\nClubs without URLs:');
    allClubs.filter(club => !club.website_url || club.website_url === '').forEach(club => {
      console.log(`- ${club.name}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkDatabaseUrls();
