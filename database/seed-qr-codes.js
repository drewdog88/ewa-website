// Load environment variables from .env.local file
require('dotenv').config({ path: '.env.local' });

const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const mammoth = require('mammoth');

// Database connection configuration
let sql = null;

// Initialize the Neon connection
function getSql() {
  if (!sql) {
    if (!process.env.DATABASE_URL) {
      console.warn('⚠️ DATABASE_URL not found');
      return null;
    }
    sql = neon(process.env.DATABASE_URL);
    console.log('✅ Connected to Neon PostgreSQL database');
  }
  return sql;
}

// Configuration
const QR_CODES_DIR = 'zelle-standardized';
const DOCX_FILE_PATH = 'QRCODES4BOOSTERS.docx';

async function extractZelleUrlsFromDocx(filePath) {
  console.log(`Extracting Zelle URLs from ${filePath}...`);
  
  try {
    // Read the DOCX file
    const buffer = fs.readFileSync(filePath);
    
    // Extract text from DOCX
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value;
    
    console.log('✓ Document text extracted successfully');
    
    // Find Zelle URLs using regex
    const zelleUrlPattern = /https:\/\/enroll\.zellepay\.com\/qr-codes\?data=[a-zA-Z0-9_-]+/g;
    const urls = text.match(zelleUrlPattern) || [];
    
    console.log(`✓ Found ${urls.length} Zelle URLs in document`);
    
    // Log found URLs for verification
    urls.forEach((url, index) => {
      console.log(`  ${index + 1}. ${url}`);
    });
    
    return urls;
  } catch (error) {
    console.error('❌ Error extracting URLs from DOCX:', error);
    throw error;
  }
}

async function generateQRCode(url, filename) {
  try {
    const qrCodeBuffer = await QRCode.toBuffer(url, {
      type: 'image/png',
      width: 640,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    });
    
    // Ensure QR codes directory exists
    if (!fs.existsSync(QR_CODES_DIR)) {
      fs.mkdirSync(QR_CODES_DIR, { recursive: true });
    }
    
    // Save QR code to file
    const filePath = path.join(QR_CODES_DIR, filename);
    fs.writeFileSync(filePath, qrCodeBuffer);
    
    console.log(`✓ Generated QR code: ${filename}`);
    return filePath;
  } catch (error) {
    console.error(`❌ Error generating QR code for ${url}:`, error);
    throw error;
  }
}

async function getBoosterClubs() {
  const sql = getSql();
  if (!sql) {
    throw new Error('Database connection not available');
  }
  try {
    const result = await sql`
      SELECT id, name, is_active 
      FROM booster_clubs 
      WHERE is_active = true 
      ORDER BY name
    `;
    return result;
  } catch (error) {
    console.error('❌ Error fetching booster clubs:', error);
    throw error;
  }
}

async function updateClubQRCode(clubId, qrCodePath, url) {
  const sql = getSql();
  if (!sql) {
    throw new Error('Database connection not available');
  }
  try {
    const result = await sql`
      UPDATE booster_clubs 
      SET 
        zelle_qr_code_path = ${qrCodePath},
        last_payment_update_by = 'system',
        last_payment_update_at = CURRENT_TIMESTAMP
      WHERE id = ${clubId}
      RETURNING id, name, zelle_qr_code_path
    `;
    
    if (result.length === 0) {
      throw new Error(`Club with ID ${clubId} not found`);
    }
    
    console.log(`✓ Updated club ${result[0].name} with QR code: ${qrCodePath}`);
    return true;
  } catch (error) {
    console.error('❌ Error updating club QR code:', error);
    throw error;
  }
}

async function seedQRCodes() {
  console.log('🔄 Starting QR Code Seeding Process');
  
  try {
    // Check if DOCX file exists
    if (!fs.existsSync(DOCX_FILE_PATH)) {
      throw new Error(`DOCX file not found: ${DOCX_FILE_PATH}`);
    }
    
    // Step 1: Extract Zelle URLs from DOCX
    const urls = await extractZelleUrlsFromDocx(DOCX_FILE_PATH);
    
    if (urls.length === 0) {
      console.log('⚠️ No Zelle URLs found in document');
      return;
    }
    
    // Step 2: Get active booster clubs
    console.log('\nFetching active booster clubs...');
    const clubs = await getBoosterClubs();
    console.log(`✓ Found ${clubs.length} active booster clubs`);
    
    // Step 3: Generate QR codes and assign to clubs
    console.log('\nGenerating QR codes and assigning to clubs...');
    
    const results = [];
    const maxClubs = Math.min(urls.length, clubs.length);
    
    for (let i = 0; i < maxClubs; i++) {
      const url = urls[i];
      const club = clubs[i];
      
      // Generate filename based on club name
      const clubNameSlug = club.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const filename = `${clubNameSlug}-zelle.png`;
      
      try {
        // Generate QR code
        const qrCodePath = await generateQRCode(url, filename);
        
        // Update club in database
        const updated = await updateClubQRCode(club.id, qrCodePath, url);
        
        results.push({
          club: club.name,
          url: url,
          qrCodePath: qrCodePath,
          success: updated
        });
        
      } catch (error) {
        console.error(`❌ Failed to process club ${club.name}:`, error);
        results.push({
          club: club.name,
          url: url,
          error: error.message,
          success: false
        });
      }
    }
    
    // Step 4: Generate summary report
    console.log('\n📊 Seeding Summary Report');
    console.log('=' .repeat(50));
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`Total URLs found: ${urls.length}`);
    console.log(`Total clubs processed: ${results.length}`);
    console.log(`Successful assignments: ${successful.length}`);
    console.log(`Failed assignments: ${failed.length}`);
    
    if (successful.length > 0) {
      console.log('\n✅ Successfully assigned QR codes:');
      successful.forEach(result => {
        console.log(`  - ${result.club}: ${result.qrCodePath}`);
      });
    }
    
    if (failed.length > 0) {
      console.log('\n❌ Failed assignments:');
      failed.forEach(result => {
        console.log(`  - ${result.club}: ${result.error}`);
      });
    }
    
    // Step 5: Save detailed report
    const reportPath = path.join(QR_CODES_DIR, 'seeding-report.json');
    const report = {
      timestamp: new Date().toISOString(),
      totalUrls: urls.length,
      totalClubs: clubs.length,
      processedClubs: results.length,
      successful: successful.length,
      failed: failed.length,
      results: results
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    
    console.log('\n🎉 QR Code seeding completed!');
    
  } catch (error) {
    console.error('❌ QR Code seeding failed:', error);
    throw error;
  } finally {
    // No explicit pool.end() needed for neon, but good practice if you had a pool
    // For now, we'll just log a message if the connection was initialized.
    if (sql) {
      console.log('✅ Neon connection closed.');
    }
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedQRCodes()
    .then(() => {
      console.log('Seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedQRCodes, extractZelleUrlsFromDocx, generateQRCode };
