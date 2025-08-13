// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { neon } = require('@neondatabase/serverless');

async function testPaymentVerification() {
  console.log('🧪 Testing Payment Link Verification...');
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    // Get current payment data for Band Booster Club
    console.log('📋 Getting current payment data for Band Booster Club...');
                    const currentData = await sql`
                  SELECT id, name, zelle_url, stripe_url, is_payment_enabled, last_payment_update_at
                  FROM booster_clubs
                  WHERE name ILIKE '%band%' AND is_active = true
                `;
    
    console.log('📊 Current Band Booster data:');
    console.log(JSON.stringify(currentData, null, 2));
    
    if (currentData.length === 0) {
      console.log('❌ No Band Booster Club found');
      return;
    }
    
    const bandClub = currentData[0];
    console.log(`✅ Found Band Booster Club: ${bandClub.name} (ID: ${bandClub.id})`);
    
    // Check if the URLs match what we expect
    const expectedZelleUrl = 'https://enroll.zellepay.com/qr-codes?data=eyJuYW1lIjoiRUhTIEJBTkQgQk9PU1RFUlMiLCJhY3Rpb24iOiJwYXltZW50IiwidG9rZW4iOiJlaHNiYW5kYm9vc3RlcnN0cmVhc3VyZXJAb3V0bG9vay5jb20ifQ==';
    const expectedStripeUrl = 'https://buy.stripe.com/bJe7sKdJu3dM6UZ0Dy1sQ00';
    
    console.log('\n🔍 Verifying URLs:');
    console.log(`Expected Zelle URL: ${expectedZelleUrl}`);
    console.log(`Actual Zelle URL: ${bandClub.zelle_url}`);
    console.log(`Zelle URL matches: ${bandClub.zelle_url === expectedZelleUrl}`);
    
                    console.log(`\nExpected Stripe URL: ${expectedStripeUrl}`);
                console.log(`Actual Stripe URL: ${bandClub.stripe_url}`);
                console.log(`Stripe URL matches: ${bandClub.stripe_url === expectedStripeUrl}`);
    
    console.log(`\nPayment enabled: ${bandClub.is_payment_enabled}`);
    console.log(`Last update: ${bandClub.last_payment_update_at}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testPaymentVerification();
