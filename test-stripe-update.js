const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function testStripeUpdate() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    
    console.log('🔍 Testing Stripe URL update for Band Booster Club...');
    
    // Get the Band Booster Club ID
    const bandClub = await sql`
      SELECT id, name, stripe_urls 
      FROM booster_clubs 
      WHERE name LIKE '%Band%' 
      LIMIT 1
    `;
    
    if (bandClub.length === 0) {
      console.log('❌ Band Booster Club not found');
      return;
    }
    
    const clubId = bandClub[0].id;
    const clubName = bandClub[0].name;
    const currentStripeUrls = bandClub[0].stripe_urls;
    
    console.log(`📋 Club: ${clubName} (ID: ${clubId})`);
    console.log(`📊 Current Stripe URLs: ${JSON.stringify(currentStripeUrls)}`);
    
    // Test the Stripe URL update
    const newStripeUrls = {
      payment: 'https://buy.stripe.com/bJe7sKdJu3dM6UZ0Dy1sQ00'
    };
    
    console.log(`🔄 Updating with new Stripe URLs: ${JSON.stringify(newStripeUrls)}`);
    
    // Update the club's Stripe URLs
    const result = await sql`
      UPDATE booster_clubs 
      SET 
        stripe_urls = ${JSON.stringify(newStripeUrls)},
        last_payment_update_by = 'admin',
        last_payment_update_at = NOW()
      WHERE id = ${clubId}
      RETURNING id, name, stripe_urls
    `;
    
    if (result.length > 0) {
      console.log('✅ Stripe URLs updated successfully!');
      console.log(`📊 Updated Stripe URLs: ${JSON.stringify(result[0].stripe_urls)}`);
      
      // Verify the update
      const verifyResult = await sql`
        SELECT id, name, stripe_urls 
        FROM booster_clubs 
        WHERE id = ${clubId}
      `;
      
      console.log(`🔍 Verification - Stripe URLs: ${JSON.stringify(verifyResult[0].stripe_urls)}`);
      
    } else {
      console.log('❌ Failed to update Stripe URLs');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testStripeUpdate();
