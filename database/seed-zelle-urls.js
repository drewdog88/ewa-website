// Load environment variables from .env.local file
require('dotenv').config({ path: '.env.local' });

const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');
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

async function getBoosterClubs() {
  const sql = getSql();
  if (!sql) {
    throw new Error('Database connection not available');
  }
  try {
    const result = await sql`
      SELECT id, name, is_active, zelle_url
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

async function updateClubZelleUrl(clubId, zelleUrl) {
  const sql = getSql();
  if (!sql) {
    throw new Error('Database connection not available');
  }
  try {
    const result = await sql`
      UPDATE booster_clubs 
      SET 
        zelle_url = ${zelleUrl},
        last_payment_update_by = 'system',
        last_payment_update_at = CURRENT_TIMESTAMP
      WHERE id = ${clubId}
      RETURNING id, name, zelle_url
    `;
    
    if (result.length === 0) {
      throw new Error(`Club with ID ${clubId} not found`);
    }
    
    console.log(`✓ Updated club ${result[0].name} with Zelle URL`);
    return true;
  } catch (error) {
    console.error('❌ Error updating club Zelle URL:', error);
    throw error;
  }
}

async function seedZelleUrls() {
  console.log('🔄 Starting Zelle URL Seeding Process');
  
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
    
    // Step 3: Update clubs with Zelle URLs
    console.log('\nUpdating clubs with Zelle URLs...');
    
    const results = [];
    const maxClubs = Math.min(urls.length, clubs.length);
    
    for (let i = 0; i < maxClubs; i++) {
      const url = urls[i];
      const club = clubs[i];
      
      try {
        // Update club in database
        const updated = await updateClubZelleUrl(club.id, url);
        
        results.push({
          club: club.name,
          url: url,
          success: updated
        });
        
      } catch (error) {
        console.error(`❌ Failed to update club ${club.name}:`, error);
        results.push({
          club: club.name,
          url: url,
          error: error.message,
          success: false
        });
      }
    }
    
    // Step 4: Generate summary report
    console.log('\n📊 URL Seeding Summary Report');
    console.log('=' .repeat(50));
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`Total URLs found: ${urls.length}`);
    console.log(`Total clubs processed: ${results.length}`);
    console.log(`Successful updates: ${successful.length}`);
    console.log(`Failed updates: ${failed.length}`);
    
    if (successful.length > 0) {
      console.log('\n✅ Successfully updated Zelle URLs:');
      successful.forEach(result => {
        console.log(`  - ${result.club}`);
      });
    }
    
    if (failed.length > 0) {
      console.log('\n❌ Failed updates:');
      failed.forEach(result => {
        console.log(`  - ${result.club}: ${result.error}`);
      });
    }
    
    // Step 5: Save detailed report
    const reportPath = path.join('zelle-standardized', 'url-seeding-report.json');
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
    
    console.log('\n🎉 Zelle URL seeding completed!');
    
  } catch (error) {
    console.error('❌ Zelle URL seeding failed:', error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedZelleUrls()
    .then(() => {
      console.log('URL seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('URL seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedZelleUrls, extractZelleUrlsFromDocx };

