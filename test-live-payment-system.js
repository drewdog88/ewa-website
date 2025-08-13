const https = require('https');

async function testLivePaymentSystem() {
  console.log('🔍 TESTING LIVE PAYMENT SYSTEM');
  console.log('================================\n');

  // Test 1: Check payment page content
  console.log('1. Testing payment page content...');
  try {
    const pageResponse = await fetch('https://ewa-website.vercel.app/payment.html?id=5c5d9238-dc96-4ad0-b6fe-6282b06573bc&club=EHS%20Band%20Boosters');
    console.log('   Page Status:', pageResponse.status);
    const pageContent = await pageResponse.text();
    console.log('   Has Zelle® Payments section:', pageContent.includes('Zelle® Payments'));
    console.log('   Has Check Payments section:', pageContent.includes('Check Payments'));
    console.log('   Has zelleQRContainer:', pageContent.includes('zelleQRContainer'));
    console.log('   Has renderZelleQR function:', pageContent.includes('renderZelleQR'));
  } catch (error) {
    console.log('   ❌ Error loading page:', error.message);
  }

  // Test 2: Check Band Boosters QR code
  console.log('\n2. Testing Band Boosters QR code...');
  try {
    const qrResponse = await fetch('https://ewa-website.vercel.app/api/qr-code?clubId=5c5d9238-dc96-4ad0-b6fe-6282b06573bc&v=' + Math.random());
    console.log('   QR Status:', qrResponse.status);
    console.log('   Content-Type:', qrResponse.headers.get('content-type'));
    if (qrResponse.status === 200) {
      const buffer = await qrResponse.arrayBuffer();
      console.log('   ✅ QR code generated successfully!');
      console.log('   Size:', buffer.byteLength, 'bytes');
      console.log('   This should show EHS BAND BOOSTERS (not Volleyball)');
    } else {
      console.log('   ❌ QR code generation failed');
    }
  } catch (error) {
    console.log('   ❌ Error generating QR code:', error.message);
  }

  // Test 3: Check DECA QR code
  console.log('\n3. Testing DECA QR code...');
  try {
    const decaResponse = await fetch('https://ewa-website.vercel.app/api/qr-code?clubId=40733b78-7d7c-44b8-a713-f5fbfb2ffefb&v=' + Math.random());
    console.log('   QR Status:', decaResponse.status);
    if (decaResponse.status === 200) {
      const buffer = await decaResponse.arrayBuffer();
      console.log('   ✅ QR code generated successfully!');
      console.log('   Size:', buffer.byteLength, 'bytes');
      console.log('   This should show EHS DECA BOOSTER CLUB (not Wrestling)');
    } else {
      console.log('   ❌ QR code generation failed');
    }
  } catch (error) {
    console.log('   ❌ Error generating QR code:', error.message);
  }

  // Test 4: Check club data API
  console.log('\n4. Testing club data API...');
  try {
    const clubResponse = await fetch('https://ewa-website.vercel.app/api/club/5c5d9238-dc96-4ad0-b6fe-6282b06573bc');
    console.log('   API Status:', clubResponse.status);
    if (clubResponse.status === 200) {
      const clubData = await clubResponse.json();
      console.log('   Club Name:', clubData.name);
      console.log('   Has Zelle URL:', !!clubData.zelle_url);
      console.log('   Payment Enabled:', clubData.is_payment_enabled);
    } else {
      console.log('   ❌ Club data API failed');
    }
  } catch (error) {
    console.log('   ❌ Error loading club data:', error.message);
  }

  // Test 5: Check non-existent club
  console.log('\n5. Testing non-existent club...');
  try {
    const invalidResponse = await fetch('https://ewa-website.vercel.app/api/qr-code?clubId=99999999-9999-9999-9999-999999999999&v=' + Math.random());
    console.log('   QR Status:', invalidResponse.status);
    if (invalidResponse.status === 404) {
      console.log('   ✅ Correctly returns 404 for non-existent club');
    } else {
      console.log('   ❌ Expected 404, got:', invalidResponse.status);
    }
  } catch (error) {
    console.log('   ❌ Error testing invalid club:', error.message);
  }

  console.log('\n🎯 SUMMARY:');
  console.log('The QR codes should now show the correct content for each club.');
  console.log('If you scan the Band Boosters QR code, it should show "EHS BAND BOOSTERS"');
  console.log('If you scan the DECA QR code, it should show "EHS DECA BOOSTER CLUB"');
}

testLivePaymentSystem();

