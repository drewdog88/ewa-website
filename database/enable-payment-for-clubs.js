// Load environment variables from .env.local file
require('dotenv').config({ path: '.env.local' });

const { neon } = require('@neondatabase/serverless');

async function enablePaymentForClubs() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    console.log('✅ Connected to Neon PostgreSQL database');
    
    // First, let's see which clubs have Zelle URLs but payment is not enabled
    const clubsToCheck = await sql`
      SELECT id, name, zelle_url, is_payment_enabled 
      FROM booster_clubs 
      WHERE zelle_url IS NOT NULL AND zelle_url != ''
      ORDER BY name
    `;
    
    console.log('\n📊 Clubs with Zelle URLs:');
    console.log('=' .repeat(80));
    
    clubsToCheck.forEach((club, index) => {
      console.log(`${index + 1}. ${club.name}`);
      console.log(`   ID: ${club.id}`);
      console.log(`   Has Zelle URL: ${club.zelle_url ? 'Yes' : 'No'}`);
      console.log(`   Payment Enabled: ${club.is_payment_enabled ? 'Yes' : 'No'}`);
      console.log('');
    });
    
    // Enable payment for clubs that have Zelle URLs but payment is not enabled
    const result = await sql`
      UPDATE booster_clubs 
      SET 
        is_payment_enabled = true,
        last_payment_update_by = 'system',
        last_payment_update_at = NOW()
      WHERE zelle_url IS NOT NULL 
        AND zelle_url != '' 
        AND (is_payment_enabled IS NULL OR is_payment_enabled = false)
      RETURNING id, name, is_payment_enabled
    `;
    
    console.log(`\n✅ Updated ${result.length} clubs to enable payment:`);
    result.forEach(club => {
      console.log(`   - ${club.name} (${club.id})`);
    });
    
    // Verify the changes
    const verifyResult = await sql`
      SELECT id, name, zelle_url, is_payment_enabled 
      FROM booster_clubs 
      WHERE zelle_url IS NOT NULL AND zelle_url != ''
      ORDER BY name
    `;
    
    console.log('\n📊 Verification - All clubs with Zelle URLs:');
    console.log('=' .repeat(80));
    
    verifyResult.forEach((club, index) => {
      console.log(`${index + 1}. ${club.name}`);
      console.log(`   Payment Enabled: ${club.is_payment_enabled ? 'Yes' : 'No'}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

enablePaymentForClubs();

