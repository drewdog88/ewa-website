const https = require('https');
const http = require('http');

async function testNewSortOrder() {
  console.log('🧪 TESTING NEW SORT ORDER\n');
  console.log('=' .repeat(50));
  
  try {
    // Test the API endpoint
    console.log('📋 Testing /api/booster-clubs endpoint...');
    const result = await new Promise((resolve, reject) => {
      const req = http.get('http://localhost:3000/api/booster-clubs', (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      });
      req.on('error', reject);
    });
    
    if (result.success) {
      console.log(`✅ API returned ${result.data.length} clubs`);
      
      // Display the first 10 clubs in the new order
      console.log('\n📊 NEW SORT ORDER (First 10 clubs):');
      console.log('─'.repeat(50));
      
      result.data.slice(0, 10).forEach((club, index) => {
        console.log(`${(index + 1).toString().padStart(2)}. ${club.name}`);
      });
      
      // Check if the order matches your desired order
      console.log('\n🔍 VERIFICATION:');
      console.log('─'.repeat(20));
      
      const expectedFirst = 'Eastlake Band Boosters';
      const actualFirst = result.data[0]?.name;
      
      if (actualFirst === expectedFirst) {
        console.log('✅ First club matches expected: Eastlake Band Boosters');
      } else {
        console.log(`❌ First club mismatch. Expected: ${expectedFirst}, Got: ${actualFirst}`);
      }
      
      // Check if Eastlake Girls Basketball is in position 4
      const girlsBasketball = result.data.find(club => club.name === 'Eastlake Girls Basketball Booster Club');
      const girlsBasketballIndex = result.data.indexOf(girlsBasketball);
      
      if (girlsBasketballIndex === 3) { // 0-based index, so 3 = position 4
        console.log('✅ Eastlake Girls Basketball Booster Club is in position 4');
      } else {
        console.log(`❌ Eastlake Girls Basketball Booster Club is in position ${girlsBasketballIndex + 1}, expected position 4`);
      }
      
      // Check if Eastlake Cheer is in position 5
      const cheer = result.data.find(club => club.name === 'Eastlake Cheer Booster Club');
      const cheerIndex = result.data.indexOf(cheer);
      
      if (cheerIndex === 4) { // 0-based index, so 4 = position 5
        console.log('✅ Eastlake Cheer Booster Club is in position 5');
      } else {
        console.log(`❌ Eastlake Cheer Booster Club is in position ${cheerIndex + 1}, expected position 5`);
      }
      
      console.log('\n🎉 SORT ORDER TEST COMPLETED!');
      console.log('You can now visit http://localhost:3000 to see the new order on the main page.');
      
    } else {
      console.log('❌ API returned error:', result.message);
    }
    
  } catch (error) {
    console.error('❌ Error testing sort order:', error.message);
  }
}

// Run the test
testNewSortOrder();
