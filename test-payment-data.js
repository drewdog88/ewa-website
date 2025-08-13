const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function testPaymentData() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    
    console.log('🔍 Checking payment data for Band Booster Club...');
    
    // Check Band Booster Club data
    const bandClub = await sql`
      SELECT id, name, zelle_url, stripe_urls, is_payment_enabled 
      FROM booster_clubs 
      WHERE name LIKE '%Band%' 
      LIMIT 1
    `;
    
    console.log('Band Club Data:', JSON.stringify(bandClub, null, 2));
    
    // Check all clubs with payment data
    const allClubs = await sql`
      SELECT id, name, zelle_url, stripe_urls, is_payment_enabled 
      FROM booster_clubs 
      WHERE is_active = true
      ORDER BY name
    `;
    
    console.log('\n📊 All Active Clubs Payment Data:');
    allClubs.forEach(club => {
      console.log(`${club.name}:`);
      console.log(`  - Zelle URL: ${club.zelle_url || 'Not set'}`);
      console.log(`  - Stripe URLs: ${JSON.stringify(club.stripe_urls) || 'Not set'}`);
      console.log(`  - Payment Enabled: ${club.is_payment_enabled}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testPaymentData();
