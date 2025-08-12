const mammoth = require('mammoth');
const fs = require('fs');

async function verifyAllZelleURLs() {
  try {
    const result = await mammoth.extractRawText({path: 'QRCODES4BOOSTERS.docx'});
    const text = result.value;
    const lines = text.split('\n');
    
    console.log('🔍 Extracting and decoding all Zelle URLs from DOCX file...');
    console.log('=' .repeat(80));
    
    // Find all Zelle URLs
    const zelleUrls = lines.filter(line => line.includes('enroll.zellepay.com'));
    
    console.log(`Found ${zelleUrls.length} Zelle URLs in the document\n`);
    
    // Parse and decode each URL
    const decodedUrls = [];
    
    zelleUrls.forEach((url, index) => {
      const cleanUrl = url.trim();
      
      // Extract the data parameter
      const dataMatch = cleanUrl.match(/data=([^&\s]+)/);
      
      if (dataMatch) {
        try {
          const base64Data = dataMatch[1];
          const decodedData = JSON.parse(Buffer.from(base64Data, 'base64').toString());
          
          decodedUrls.push({
            index: index + 1,
            url: cleanUrl,
            decodedData: decodedData,
            name: decodedData.name || 'Unknown',
            email: decodedData.token || 'No email'
          });
          
        } catch (error) {
          console.log(`❌ Error decoding URL ${index + 1}: ${error.message}`);
          decodedUrls.push({
            index: index + 1,
            url: cleanUrl,
            decodedData: null,
            name: 'DECODE ERROR',
            email: 'DECODE ERROR'
          });
        }
      } else {
        console.log(`❌ No data parameter found in URL ${index + 1}`);
      }
    });
    
    // Display results in a table format
    console.log('📋 DECODED ZELLE URLS TABLE:');
    console.log('=' .repeat(120));
    console.log('| #  | Club Name                    | Email                                    | Base64 Data (first 20 chars) |');
    console.log('|----|------------------------------|------------------------------------------|------------------------------|');
    
    decodedUrls.forEach(item => {
      const name = item.name.padEnd(30);
      const email = item.email.padEnd(40);
      const base64Preview = item.url.match(/data=([^&\s]+)/) ? 
        item.url.match(/data=([^&\s]+)/)[1].substring(0, 20) + '...' : 
        'NO DATA';
      
      console.log(`| ${item.index.toString().padStart(2)} | ${name} | ${email} | ${base64Preview.padEnd(30)} |`);
    });
    
    console.log('=' .repeat(120));
    
    // Now let's also check what's currently in the database
    console.log('\n🗄️  CURRENT DATABASE STATE:');
    console.log('=' .repeat(80));
    
    require('dotenv').config({ path: '.env.local' });
    const { neon } = require('@neondatabase/serverless');
    
    const sql = neon(process.env.DATABASE_URL);
    const dbClubs = await sql`
      SELECT id, name, zelle_url 
      FROM booster_clubs 
      WHERE zelle_url IS NOT NULL AND zelle_url != ''
      ORDER BY name
    `;
    
    console.log('| Club Name                    | Database Zelle URL Decoded                |');
    console.log('|------------------------------|------------------------------------------|');
    
    for (const club of dbClubs) {
      let decodedName = 'NO DATA';
      let decodedEmail = 'NO DATA';
      
      if (club.zelle_url) {
        const dataMatch = club.zelle_url.match(/data=([^&\s]+)/);
        if (dataMatch) {
          try {
            const decodedData = JSON.parse(Buffer.from(dataMatch[1], 'base64').toString());
            decodedName = decodedData.name || 'Unknown';
            decodedEmail = decodedData.token || 'No email';
          } catch (error) {
            decodedName = 'DECODE ERROR';
            decodedEmail = 'DECODE ERROR';
          }
        }
      }
      
      const clubName = club.name.padEnd(30);
      const decodedInfo = `${decodedName} (${decodedEmail})`.padEnd(40);
      
      console.log(`| ${clubName} | ${decodedInfo} |`);
    }
    
    console.log('=' .repeat(80));
    
    // Find mismatches
    console.log('\n🔍 POTENTIAL MISMATCHES:');
    console.log('=' .repeat(50));
    
    let mismatchFound = false;
    
    for (const club of dbClubs) {
      if (club.zelle_url) {
        const dataMatch = club.zelle_url.match(/data=([^&\s]+)/);
        if (dataMatch) {
          try {
            const decodedData = JSON.parse(Buffer.from(dataMatch[1], 'base64').toString());
            const decodedName = decodedData.name || 'Unknown';
            
            // Check if the decoded name matches the club name (case insensitive)
            if (!club.name.toLowerCase().includes(decodedName.toLowerCase()) && 
                !decodedName.toLowerCase().includes(club.name.toLowerCase())) {
              console.log(`⚠️  MISMATCH: Database club "${club.name}" has Zelle URL for "${decodedName}"`);
              mismatchFound = true;
            }
          } catch (error) {
            console.log(`❌ DECODE ERROR for club "${club.name}": ${error.message}`);
            mismatchFound = true;
          }
        }
      }
    }
    
    if (!mismatchFound) {
      console.log('✅ No obvious mismatches found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

verifyAllZelleURLs();

