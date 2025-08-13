require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const mammoth = require('mammoth');

async function fixAllZelleMismatches() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    console.log('✅ Connected to Neon PostgreSQL database');
    
    // First, extract all Zelle URLs from the DOCX file
    const result = await mammoth.extractRawText({path: 'QRCODES4BOOSTERS.docx'});
    const text = result.value;
    const lines = text.split('\n');
    
    const zelleUrls = lines.filter(line => line.includes('enroll.zellepay.com'));
    
    // Decode all URLs to get the club names
    const decodedUrls = [];
    zelleUrls.forEach((url, index) => {
      const cleanUrl = url.trim();
      const dataMatch = cleanUrl.match(/data=([^&\s]+)/);
      
      if (dataMatch) {
        try {
          const base64Data = dataMatch[1];
          const decodedData = JSON.parse(Buffer.from(base64Data, 'base64').toString());
          
          decodedUrls.push({
            url: cleanUrl,
            decodedName: decodedData.name || 'Unknown',
            decodedEmail: decodedData.token || 'No email'
          });
        } catch (error) {
          console.log(`❌ Error decoding URL ${index + 1}: ${error.message}`);
        }
      }
    });
    
    console.log('📋 CORRECT MAPPINGS FROM DOCX:');
    console.log('=' .repeat(80));
    decodedUrls.forEach((item, index) => {
      console.log(`${index + 1}. ${item.decodedName} -> ${item.decodedEmail}`);
    });
    
    // Get all clubs from database
    const dbClubs = await sql`
      SELECT id, name, zelle_url 
      FROM booster_clubs 
      WHERE is_active = true
      ORDER BY name
    `;
    
    console.log('\n🗄️  DATABASE CLUBS:');
    console.log('=' .repeat(50));
    dbClubs.forEach((club, index) => {
      console.log(`${index + 1}. ${club.name}`);
    });
    
    // Create mapping based on name matching
    const mappings = [];
    
    // Manual mapping based on the decoded data
    const correctMappings = [
      { dbName: 'EHS Band Boosters', docxName: 'EHS BAND BOOSTERS' },
      { dbName: 'EHS Cheer Booster Club', docxName: 'EHS CHEER BOOSTER CLUB' },
      { dbName: 'EHS Orchestra Boosters Club', docxName: 'EHS ORCHESTRA BOOSTER CLUB' },
      { dbName: 'EHS Track and Field Booster Club', docxName: 'EASTLAKE TRACK AND FIELD BOOSTER CLUB' },
      { dbName: 'EHS Wrestling Booster Club', docxName: 'EHS WRESTLING BOOSTER CLUB' },
              { dbName: 'Eastlake Wolfpack Association', docxName: 'The Eastlake Wolfpack Association' },
      { dbName: 'Eastlake Baseball Club', docxName: 'EASTLAKE BASEBALL CLUB' },
      { dbName: 'Eastlake Boys Basketball Booster Club', docxName: 'EASTLAKE GIRLS BASKETBALL BOOSTER CLUB' },
      { dbName: 'Eastlake Boys Soccer', docxName: 'EHS BOYS SOCCER' },
      { dbName: 'Eastlake Boys Swim & Dive Booster Club', docxName: 'EHS BOYS SWIM & DIVE BOOSTER CLUB' },
      { dbName: 'Eastlake Dance Team Boosters', docxName: 'EASTLAKE DANCE TEAM BOOSTERS' },
      { dbName: 'Eastlake Girls Soccer', docxName: 'EASTLAKE GIRLS SOCCER' },
      { dbName: 'Eastlake Volleyball Booster Club', docxName: 'EASTLAKE VOLLEYBALL BOOSTER CLUB' },
      { dbName: 'Eastlake Robotics Booster Club', docxName: 'EASTLAKE ROBOTICS BOOSTER CLUB' }
    ];
    
    console.log('\n🔧 APPLYING CORRECT MAPPINGS:');
    console.log('=' .repeat(60));
    
    let updateCount = 0;
    
    for (const mapping of correctMappings) {
      // Find the database club
      const dbClub = dbClubs.find(club => club.name === mapping.dbName);
      
      // Find the DOCX URL
      const docxUrl = decodedUrls.find(item => item.decodedName === mapping.docxName);
      
      if (dbClub && docxUrl) {
        console.log(`✅ Mapping: ${mapping.dbName} -> ${mapping.docxName}`);
        
        // Update the database
        const updateResult = await sql`
          UPDATE booster_clubs 
          SET 
            zelle_url = ${docxUrl.url},
            last_payment_update_by = 'system-fix-mismatches',
            last_payment_update_at = NOW()
          WHERE id = ${dbClub.id}
          RETURNING id, name, zelle_url
        `;
        
        if (updateResult.length > 0) {
          console.log(`   ✅ Updated: ${updateResult[0].name}`);
          updateCount++;
        } else {
          console.log(`   ❌ Failed to update: ${mapping.dbName}`);
        }
      } else {
        if (!dbClub) {
          console.log(`⚠️  Database club not found: ${mapping.dbName}`);
        }
        if (!docxUrl) {
          console.log(`⚠️  DOCX URL not found for: ${mapping.docxName}`);
        }
      }
    }
    
    console.log(`\n✅ Successfully updated ${updateCount} clubs`);
    
    // Show remaining clubs without Zelle URLs
    const remainingClubs = await sql`
      SELECT name 
      FROM booster_clubs 
      WHERE (zelle_url IS NULL OR zelle_url = '') AND is_active = true
      ORDER BY name
    `;
    
    if (remainingClubs.length > 0) {
      console.log('\n📝 CLUBS WITHOUT ZELLE URLS:');
      console.log('=' .repeat(40));
      remainingClubs.forEach(club => {
        console.log(`- ${club.name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixAllZelleMismatches();

