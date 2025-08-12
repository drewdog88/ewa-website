// Load environment variables from .env.local file
require('dotenv').config({ path: '.env.local' });

const { neon } = require('@neondatabase/serverless');

async function checkClubIds() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    console.log('✅ Connected to Neon PostgreSQL database');
    
    const result = await sql`
      SELECT id, name, zelle_url 
      FROM booster_clubs 
      WHERE is_active = true 
      ORDER BY name 
      LIMIT 10
    `;
    
    console.log('\n📊 Club IDs in database:');
    console.log('=' .repeat(80));
    
    result.forEach((club, index) => {
      console.log(`${index + 1}. ID: ${club.id}`);
      console.log(`   Name: ${club.name}`);
      console.log(`   Has Zelle URL: ${club.zelle_url ? 'Yes' : 'No'}`);
      console.log('');
    });
    
    if (result.length > 0) {
      console.log('🎯 For testing, use these IDs:');
      console.log(`   First club: ${result[0].id}`);
      console.log(`   Second club: ${result[1].id}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkClubIds();

