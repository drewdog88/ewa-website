// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Mock request and response objects
const mockReq = {
  method: 'PUT',
  params: { clubId: '5c5d9238-dc96-4ad0-b6fe-6282b06573bc' },
  body: {
    zelle_url: 'https://enroll.zellepay.com/qr-codes?data=TEST_API_DEBUG',
    is_payment_enabled: true
  },
  headers: { 'Content-Type': 'application/json' }
};

const mockRes = {
  status: (code) => {
    console.log(`Response status: ${code}`);
    return mockRes;
  },
  json: (data) => {
    console.log('Response data:', JSON.stringify(data, null, 2));
    return mockRes;
  },
  setHeader: (name, value) => {
    console.log(`Set header: ${name} = ${value}`);
  },
  end: () => {
    console.log('Response ended');
  }
};

async function testApiHandler() {
  console.log('🧪 Testing API Handler Directly...');
  
  try {
    const paymentSettingsHandler = require('./api/admin/payment-settings');
    await paymentSettingsHandler(mockReq, mockRes);
  } catch (error) {
    console.error('❌ API Handler failed:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testApiHandler();
