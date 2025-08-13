require('dotenv').config({ path: '.env.local' });
const https = require('https');

async function testAdminUpdate() {
  console.log('🔍 Testing Admin Panel Update Functionality\n');

  // Test 1: Check if we can get payment status
  console.log('1. Testing Payment Status API...');
  try {
    const statusResponse = await makeRequest('https://www.eastlakewolfpack.org/api/admin/payment-status');
    console.log('✅ Payment Status Response:', JSON.stringify(statusResponse, null, 2));
  } catch (error) {
    console.log('❌ Payment Status Error:', error.message);
  }

  // Test 2: Check if we can get Band Booster data
  console.log('\n2. Testing Band Booster Data Retrieval...');
  try {
    const bandResponse = await makeRequest('https://www.eastlakewolfpack.org/api/booster-clubs?id=5c5d9238-dc96-4ad0-b6fe-6282b06573bc');
    console.log('✅ Band Booster Data:', JSON.stringify(bandResponse, null, 2));
  } catch (error) {
    console.log('❌ Band Booster Error:', error.message);
  }

  // Test 3: Test the actual update API
  console.log('\n3. Testing Payment Settings Update...');
  try {
    const updateData = {
      zelle_url: 'https://enroll.zellepay.com/qr-codes?data=eyJuYW1lIjoiRUhTIEJBTkQgQk9PU1RFUlMiLCJhY3Rpb24iOiJwYXltZW50IiwidG9rZW4iOiJlaHNiYW5kYm9vc3RlcnN0cmVhc3VyZXJAb3V0bG9vay5jb20ifQ==',
      stripe_urls: {"donate": "https://buy.stripe.com/bJe7sKdJu3dM6UZ0Dy1sQ00"},
      payment_instructions: 'Test instructions',
      is_payment_enabled: true
    };

    const updateResponse = await makeRequest('https://www.eastlakewolfpack.org/api/admin/payment-settings/club/5c5d9238-dc96-4ad0-b6fe-6282b06573bc', 'PUT', updateData);
    console.log('✅ Update Response:', JSON.stringify(updateResponse, null, 2));
  } catch (error) {
    console.log('❌ Update Error:', error.message);
  }
}

function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Test-Script/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          if (res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}: ${response.error || response.message || body}`));
          } else {
            resolve(response);
          }
        } catch (e) {
          reject(new Error(`Invalid JSON response: ${body}`));
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

testAdminUpdate().catch(console.error);
