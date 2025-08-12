require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function checkActiveStatus() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const clubs = await sql`SELECT name, website_url, is_active FROM booster_clubs WHERE website_url IS NOT NULL AND website_url != '' ORDER BY name`;
    
    console.log('Club Name | Website URL | Is Active');
    console.log('---------|-------------|----------');
    clubs.forEach(club => {
      console.log(`${club.name} | ${club.website_url} | ${club.is_active}`);
    });
    
    console.log(`\nTotal clubs with URLs: ${clubs.length}`);
    
    // Check how many are active
    const activeClubs = clubs.filter(club => club.is_active);
    console.log(`Active clubs: ${activeClubs.length}`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkActiveStatus();
