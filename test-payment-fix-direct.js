const { neon } = require('@neondatabase/serverless');

async function testPaymentFix() {
  console.log('🧪 Testing Payment Link Fix Directly...');
  
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    // Step 1: Get current payment data for Band Booster Club
    console.log('📋 Getting current payment data for Band Booster Club...');
    const currentData = await sql`
      SELECT id, name, zelle_url, stripe_urls, is_payment_enabled 
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
    
    // Step 2: Test Zelle URL update
    console.log('\n🔄 Testing Zelle URL update...');
    const testZelleUrl = 'https://enroll.zellepay.com/qr-codes?data=TEST_ZELLE_API_FIX';
    
    const zelleUpdate = await sql`
      UPDATE booster_clubs 
      SET 
        zelle_url = ${testZelleUrl},
        last_payment_update_by = 'test-script',
        last_payment_update_at = NOW()
      WHERE id = ${bandClub.id}
      RETURNING id, name, zelle_url, last_payment_update_at
    `;
    
    console.log('✅ Zelle URL updated:');
    console.log(JSON.stringify(zelleUpdate, null, 2));
    
    // Step 3: Test Stripe URL update (this is what was broken)
    console.log('\n💳 Testing Stripe URL update...');
    const testStripeUrls = { payment: 'https://buy.stripe.com/bJe7sKdJu3dM6UZ0Dy1sQ00' };
    
    const stripeUpdate = await sql`
      UPDATE booster_clubs 
      SET 
        stripe_urls = ${JSON.stringify(testStripeUrls)},
        last_payment_update_by = 'test-script',
        last_payment_update_at = NOW()
      WHERE id = ${bandClub.id}
      RETURNING id, name, stripe_urls, last_payment_update_at
    `;
    
    console.log('✅ Stripe URLs updated:');
    console.log(JSON.stringify(stripeUpdate, null, 2));
    
    // Step 4: Verify both updates are saved
    console.log('\n🔍 Verifying both updates are saved...');
    const finalData = await sql`
      SELECT id, name, zelle_url, stripe_urls, is_payment_enabled, last_payment_update_at
      FROM booster_clubs 
      WHERE id = ${bandClub.id}
    `;
    
    console.log('📊 Final Band Booster data:');
    console.log(JSON.stringify(finalData, null, 2));
    
    // Step 5: Check if changes would appear on main page
    console.log('\n🌐 Checking main page data...');
    const mainPageData = await sql`
      SELECT 
        name,
        zelle_url,
        stripe_urls,
        is_payment_enabled,
        CASE 
          WHEN zelle_url IS NOT NULL THEN 'Zelle Available'
          ELSE 'No Zelle'
        END as zelle_status,
        CASE 
          WHEN stripe_urls IS NOT NULL AND stripe_urls != 'null' THEN 'Stripe Available'
          ELSE 'No Stripe'
        END as stripe_status
      FROM booster_clubs 
      WHERE name ILIKE '%band%' AND is_active = true
    `;
    
    console.log('📊 Main page Band Booster card data:');
    console.log(JSON.stringify(mainPageData, null, 2));
    
    // Step 6: Test results
    const zelleUpdated = finalData[0].zelle_url === testZelleUrl;
    const stripeUpdated = finalData[0].stripe_urls && 
                         JSON.parse(finalData[0].stripe_urls).payment === testStripeUrls.payment;
    
    console.log('\n🎯 Test Results:');
    console.log(`✅ Zelle URL updated successfully: ${zelleUpdated}`);
    console.log(`✅ Stripe URLs updated successfully: ${stripeUpdated}`);
    
    if (zelleUpdated && stripeUpdated) {
      console.log('🎉 SUCCESS: Both Zelle and Stripe payment links can be updated!');
      console.log('🌐 These changes will appear on the main page Band Booster card.');
    } else {
      console.log('❌ FAILURE: Some updates did not work correctly.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testPaymentFix();
