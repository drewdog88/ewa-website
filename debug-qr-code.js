require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const QRCode = require('qrcode');

async function debugQRCode() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    console.log('✅ Connected to Neon PostgreSQL database');
    
    const clubId = '5c5d9238-dc96-4ad0-b6fe-6282b06573bc'; // EHS Band Boosters
    
    console.log('\n🔍 Debugging QR Code Generation for Band Boosters...');
    console.log('=' .repeat(60));
    
    // Get the club data
    const club = await sql`
      SELECT 
        id, 
        name, 
        zelle_url, 
        qr_code_settings,
        is_payment_enabled
      FROM booster_clubs 
      WHERE id = ${clubId} 
      AND is_active = true
    `;
    
    if (club.length === 0) {
      console.log('❌ Club not found');
      return;
    }
    
    const clubData = club[0];
    console.log(`Club Name: ${clubData.name}`);
    console.log(`Payment Enabled: ${clubData.is_payment_enabled}`);
    console.log(`Zelle URL: ${clubData.zelle_url}`);
    
    // Decode the URL to see what's in it
    if (clubData.zelle_url) {
      const dataMatch = clubData.zelle_url.match(/data=([^&\s]+)/);
      if (dataMatch) {
        try {
          const decodedData = JSON.parse(Buffer.from(dataMatch[1], 'base64').toString());
          console.log('\n🔍 Decoded URL data:');
          console.log(JSON.stringify(decodedData, null, 2));
        } catch (error) {
          console.log('❌ Error decoding URL data:', error.message);
        }
      }
    }
    
    // Generate QR code
    console.log('\n🔍 Generating QR code...');
    const qrCodeBuffer = await QRCode.toBuffer(clubData.zelle_url, {
      type: 'image/png',
      width: 640,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    });
    
    console.log(`✅ QR code generated successfully (${qrCodeBuffer.length} bytes)`);
    console.log(`URL used: ${clubData.zelle_url}`);
    
    // Save the QR code to a file for inspection
    const fs = require('fs');
    fs.writeFileSync('debug-qr-code.png', qrCodeBuffer);
    console.log('💾 QR code saved to debug-qr-code.png');
    
    // Also generate a QR code for a known Volleyball URL to compare
    const volleyballURL = 'https://enroll.zellepay.com/qr-codes?data=eyJuYW1lIjoiRUFTVExBS0UgVk9MTEVZQkFMTCBCT09TVEVSIENMVUIiLCJhY3Rpb24iOiJwYXltZW50IiwidG9rZW4iOiJlaHN2YmFsbEBob3RtYWlsLmNvbSJ9';
    console.log('\n🔍 Generating comparison QR code for Volleyball...');
    const volleyballQR = await QRCode.toBuffer(volleyballURL, {
      type: 'image/png',
      width: 640,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    });
    fs.writeFileSync('debug-volleyball-qr.png', volleyballQR);
    console.log('💾 Volleyball QR code saved to debug-volleyball-qr.png');
    
    console.log('\n📋 Comparison:');
    console.log(`Band Boosters URL: ${clubData.zelle_url}`);
    console.log(`Volleyball URL: ${volleyballURL}`);
    console.log('Check the generated PNG files to see if they look different');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugQRCode();

