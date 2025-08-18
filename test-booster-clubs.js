require('dotenv').config({ path: '.env.local' });
const { getBoosterClubs } = require('./database/neon-functions');

async function testBoosterClubs() {
  console.log('🧪 Testing getBoosterClubs function...');
  
  try {
    const clubs = await getBoosterClubs();
    console.log(`✅ Function returned ${clubs.length} clubs`);
    
    if (clubs.length > 0) {
      console.log('\n📋 First 3 clubs:');
      clubs.slice(0, 3).forEach((club, index) => {
        console.log(`${index + 1}. ${club.name}`);
        console.log(`   Website: ${club.website_url || 'NULL'}`);
        console.log(`   Active: ${club.is_active}`);
      });
    } else {
      console.log('❌ No clubs returned');
    }
    
  } catch (error) {
    console.error('❌ Error calling getBoosterClubs:', error.message);
  }
}

testBoosterClubs();
