require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function checkClubsWithoutZelle() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    console.log('✅ Connected to Neon PostgreSQL database');
    
    const result = await sql`
      SELECT id, name 
      FROM booster_clubs 
      WHERE (zelle_url IS NULL OR zelle_url = '') AND is_active = true
      ORDER BY name
      LIMIT 5
    `;
    
    console.log('\n📋 Clubs without Zelle URLs (for testing the message):');
    console.log('=' .repeat(60));
    
    if (result.length > 0) {
      result.forEach((club, index) => {
        console.log(`${index + 1}. ID: ${club.id}`);
        console.log(`   Name: ${club.name}`);
        console.log(`   Test URL: http://localhost:3000/payment.html?id=${club.id}&club=${encodeURIComponent(club.name)}`);
        console.log('');
      });
    } else {
      console.log('All clubs have Zelle URLs configured!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkClubsWithoutZelle();

