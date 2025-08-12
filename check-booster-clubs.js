require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function checkBoosterClubs() {
  try {
    const clubs = await sql`SELECT id, name FROM booster_clubs ORDER BY name`;
    console.log('Available booster clubs:');
    clubs.forEach(club => {
      console.log(`  - ${club.id}: ${club.name}`);
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

checkBoosterClubs().then(() => process.exit(0)).catch(console.error);
