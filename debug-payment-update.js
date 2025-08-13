require('dotenv').config({ path: '.env.local' });
const https = require('https');

async function debugPaymentUpdate() {
  console.log('🔍 Debugging Payment Update Issue\n');

  const updateData = {
    zelle_url: 'https://enroll.zellepay.com/qr-codes?data=eyJuYW1lIjoiRUhTIEJBTkQgQk9PU1RFUlMiLCJhY3Rpb24iOiJwYXltZW50IiwidG9rZW4iOiJlaHNiYW5kYm9vc3RlcnN0cmVhc3VyZXJAb3V0bG9vay5jb20ifQ==',
    stripe_urls: {"donate": "https://buy.stripe.com/bJe7sKdJu3dM6UZ0Dy1sQ00"},
    payment_instructions: 'Test instructions',
    is_payment_enabled: true
  };

  console.log('📤 Sending data:');
  console.log(JSON.stringify(updateData, null, 2));
  console.log('\n🔍 Data types:');
  console.log('is_payment_enabled:', typeof updateData.is_payment_enabled);
  console.log('zelle_url:', typeof updateData.zelle_url);
  console.log('stripe_urls:', typeof updateData.stripe_urls);
  console.log('payment_instructions:', typeof updateData.payment_instructions);

  try {
    const response = await makeRequest('https://www.eastlakewolfpack.org/api/admin/payment-settings/club/5c5d9238-dc96-4ad0-b6fe-6282b06573bc', 'PUT', updateData);
    console.log('\n✅ Success Response:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.log('\n❌ Error Response:', error.message);
    
    // Try with different data formats
    console.log('\n🔄 Trying with null stripe_urls...');
    try {
      const testData1 = { ...updateData, stripe_urls: null };
      const response1 = await makeRequest('https://www.eastlakewolfpack.org/api/admin/payment-settings/club/5c5d9238-dc96-4ad0-b6fe-6282b06573bc', 'PUT', testData1);
      console.log('✅ Success with null stripe_urls:', JSON.stringify(response1, null, 2));
    } catch (error1) {
      console.log('❌ Still failed with null stripe_urls:', error1.message);
    }

    console.log('\n🔄 Trying with empty object stripe_urls...');
    try {
      const testData2 = { ...updateData, stripe_urls: {} };
      const response2 = await makeRequest('https://www.eastlakewolfpack.org/api/admin/payment-settings/club/5c5d9238-dc96-4ad0-b6fe-6282b06573bc', 'PUT', testData2);
      console.log('✅ Success with empty stripe_urls:', JSON.stringify(response2, null, 2));
    } catch (error2) {
      console.log('❌ Still failed with empty stripe_urls:', error2.message);
    }
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
        'User-Agent': 'Debug-Script/1.0'
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

debugPaymentUpdate().catch(console.error);
