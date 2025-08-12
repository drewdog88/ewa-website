require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function checkBandBoosters() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    console.log('✅ Connected to Neon PostgreSQL database');
    
    const result = await sql`
      SELECT id, name, zelle_url, is_payment_enabled 
      FROM booster_clubs 
      WHERE id = '5c5d9238-dc96-4ad0-b6fe-6282b06573bc'
    `;
    
    if (result.length > 0) {
      const club = result[0];
      console.log('\n📊 EHS Band Boosters Data:');
      console.log('=' .repeat(50));
      console.log(`ID: ${club.id}`);
      console.log(`Name: ${club.name}`);
      console.log(`Zelle URL: ${club.zelle_url || 'NOT SET'}`);
      console.log(`Payment Enabled: ${club.is_payment_enabled}`);
      
      if (club.zelle_url) {
        console.log('\n🔍 Zelle URL Analysis:');
        console.log('=' .repeat(30));
        console.log(`URL: ${club.zelle_url}`);
        
        // Check if this URL contains volleyball-related text
        if (club.zelle_url.toLowerCase().includes('volleyball')) {
          console.log('⚠️  WARNING: URL contains "volleyball" - this might be wrong!');
        }
        
        // Extract the data parameter from Zelle URL
        const match = club.zelle_url.match(/data=([^&]+)/);
        if (match) {
          console.log(`Data parameter: ${match[1]}`);
        }
      }
    } else {
      console.log('❌ Club not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkBandBoosters();

