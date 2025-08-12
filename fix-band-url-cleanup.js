require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function fixBandUrlCleanup() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    console.log('✅ Connected to Neon PostgreSQL database');
    
    // The correct Band Boosters URL (without the "Band" prefix)
    const correctBandURL = 'https://enroll.zellepay.com/qr-codes?data=eyJuYW1lIjoiRUhTIEJBTkQgQk9PU1RFUlMiLCJhY3Rpb24iOiJwYXltZW50IiwidG9rZW4iOiJlaHNiYW5kYm9vc3RlcnN0cmVhc3VyZXJAb3V0bG9vay5jb20ifQ==';
    
    console.log('\n🔧 Cleaning up Band Boosters URL...');
    console.log('=' .repeat(50));
    
    const result = await sql`
      UPDATE booster_clubs 
      SET 
        zelle_url = ${correctBandURL},
        last_payment_update_by = 'system-cleanup-url',
        last_payment_update_at = NOW()
      WHERE id = '5c5d9238-dc96-4ad0-b6fe-6282b06573bc'
      RETURNING id, name, zelle_url
    `;
    
    if (result.length > 0) {
      const club = result[0];
      console.log('✅ Successfully cleaned up Band Boosters URL!');
      console.log(`Club: ${club.name}`);
      console.log(`Clean URL: ${club.zelle_url}`);
      
      // Decode the new URL to verify it's correct
      const dataMatch = club.zelle_url.match(/data=([^&]+)/);
      if (dataMatch) {
        const decodedData = JSON.parse(Buffer.from(dataMatch[1], 'base64').toString());
        console.log('\n🔍 Decoded URL data:');
        console.log(JSON.stringify(decodedData, null, 2));
      }
    } else {
      console.log('❌ No rows updated');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixBandUrlCleanup();

