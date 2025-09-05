const { put } = require('@vercel/blob');
const fs = require('fs');
const path = require('path');

async function setupBlobAssets() {
  try {
    console.log('🚀 Setting up blob storage directory structure for assets...');
    
    // Get the correct blob token based on environment
    let BLOB_TOKEN;
    if (process.env.NODE_ENV === 'development') {
      BLOB_TOKEN = process.env.***REMOVED***_READ_WRITE_TOKEN;
    } else {
      BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
    }
    
    if (!BLOB_TOKEN) {
      console.error('❌ No blob token found. Please set the appropriate environment variable.');
      return;
    }
    
    console.log(`💡 Using ${process.env.NODE_ENV === 'development' ? 'development' : 'production'} blob storage`);
    
    // Read the logo file
    const logoPath = path.join(__dirname, 'assets', 'DBBACKUPLOGO.svg');
    if (!fs.existsSync(logoPath)) {
      console.error('❌ Logo file not found at:', logoPath);
      return;
    }
    
    const logoBuffer = fs.readFileSync(logoPath);
    console.log('📁 Logo file loaded, size:', (logoBuffer.length / 1024).toFixed(2), 'KB');
    
    // Upload logo to blob storage with proper directory structure
    console.log('📤 Uploading logo to blob storage...');
    const { url } = await put('assets/logos/DBBACKUPLOGO.svg', logoBuffer, {
      access: 'public',
      token: BLOB_TOKEN,
      addRandomSuffix: false
    });
    
    console.log('✅ Logo uploaded successfully!');
    console.log('🔗 Logo URL:', url);
    
    // Create a placeholder file for the assets directory structure
    console.log('📁 Creating assets directory structure...');
    const placeholderContent = Buffer.from('<!-- This file ensures the assets directory exists -->');
    
    await put('assets/.gitkeep', placeholderContent, {
      access: 'public',
      token: BLOB_TOKEN,
      addRandomSuffix: false
    });
    
    console.log('✅ Assets directory structure created!');
    
    // Display the new directory structure
    console.log('\n📂 New Blob Storage Structure:');
    console.log('assets/');
    console.log('├── .gitkeep');
    console.log('└── logos/');
    console.log('    └── DBBACKUPLOGO.svg');
    
    console.log('\n🎯 Next steps:');
    console.log('1. Update the HTML to use the new blob URL');
    console.log('2. Test the logo loading from blob storage');
    console.log('3. Consider moving other static assets to this structure');
    
  } catch (error) {
    console.error('❌ Error setting up blob assets:', error.message);
  }
}

setupBlobAssets();
