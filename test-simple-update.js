// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { neon } = require('@neondatabase/serverless');

async function testSimpleUpdate() {
  console.log('🧪 Testing Simple Database Update...');
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    const clubId = '5c5d9238-dc96-4ad0-b6fe-6282b06573bc';
    const zelleUrl = 'https://enroll.zellepay.com/qr-codes?data=TEST_SIMPLE_UPDATE';
    const isPaymentEnabled = true;
    
    console.log('📋 Attempting database update...');
    
    const result = await sql`
      UPDATE booster_clubs 
      SET 
        is_payment_enabled = ${isPaymentEnabled},
        zelle_url = ${zelleUrl},
        last_payment_update_by = 'admin',
        last_payment_update_at = NOW()
      WHERE id = ${clubId}
      RETURNING 
        id, 
        name, 
        zelle_url, 
        is_payment_enabled
    `;
    
    console.log('✅ Database update successful:');
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Database update failed:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testSimpleUpdate();
