require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

async function loadOfficersFixed() {
  console.log('🔄 Loading officers data from Excel file (fixed version)...');
  
  try {
    const sql = neon(process.env.DATABASE_URL);
    console.log('✅ Connected to database');
    
    // Read the Excel file
    const excelPath = path.join(__dirname, 'Wolfpack Booster Roster.xlsx');
    if (!fs.existsSync(excelPath)) {
      console.error('❌ Excel file not found:', excelPath);
      return;
    }
    
    console.log('📋 Reading Excel file...');
    const workbook = XLSX.readFile(excelPath);
    
    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON with header row
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    console.log(`📝 Found ${data.length} rows in Excel file`);
    
    // Find the header row (look for row with "Club or Team", "First Name", etc.)
    let headerRowIndex = -1;
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (row && row.length > 0) {
        const hasClub = row.some(cell => cell && String(cell).includes('Club'));
        const hasFirstName = row.some(cell => cell && String(cell).includes('First Name'));
        const hasLastName = row.some(cell => cell && String(cell).includes('Last Name'));
        
        if (hasClub && hasFirstName && hasLastName) {
          headerRowIndex = i;
          break;
        }
      }
    }
    
    if (headerRowIndex === -1) {
      console.error('❌ Could not find header row');
      return;
    }
    
    console.log(`📋 Found header row at index ${headerRowIndex}:`, data[headerRowIndex]);
    
    // Get the header row
    const headers = data[headerRowIndex];
    
    // Find column indices (convert to string for comparison)
    const clubIndex = headers.findIndex(h => h && String(h).includes('Club'));
    const firstNameIndex = headers.findIndex(h => h && String(h).includes('First Name'));
    const lastNameIndex = headers.findIndex(h => h && String(h).includes('Last Name'));
    const emailIndex = headers.findIndex(h => h && String(h).includes('E-Mail'));
    const phoneIndex = headers.findIndex(h => h && String(h).includes('Phone'));
    
    console.log('📋 Column indices:', {
      club: clubIndex,
      firstName: firstNameIndex,
      lastName: lastNameIndex,
      email: emailIndex,
      phone: phoneIndex
    });
    
    // Check if officers table exists, if not create it
    console.log('\n🔧 Ensuring officers table exists...');
    await sql`
      CREATE TABLE IF NOT EXISTS officers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        position VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        club VARCHAR(100) NOT NULL,
        club_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Officers table ready');
    
    // Clear existing officers data
    console.log('\n🧹 Clearing existing officers data...');
    await sql`DELETE FROM officers`;
    console.log('✅ Existing data cleared');
    
    // Process data rows (skip header row)
    console.log('\n📝 Processing data rows...');
    let insertedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    for (let i = headerRowIndex + 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;
      
      try {
        // Extract data from the row
        const club = row[clubIndex] || '';
        const firstName = row[firstNameIndex] || '';
        const lastName = row[lastNameIndex] || '';
        const email = row[emailIndex] || '';
        const phone = row[phoneIndex] || '';
        
        // Skip if no club or no name
        if (!club || (!firstName && !lastName)) {
          skippedCount++;
          continue;
        }
        
        // Extract position from club field (e.g., "Band - President" -> "President")
        let position = '';
        let clubName = club;
        
        if (club.includes(' - ')) {
          const parts = club.split(' - ');
          clubName = parts[0];
          position = parts[1];
        } else {
          position = 'Member'; // Default position if not specified
        }
        
        // Combine first and last name
        const fullName = `${firstName} ${lastName}`.trim();
        
        // Skip if no valid name
        if (!fullName || fullName === ' ') {
          skippedCount++;
          continue;
        }
        
        // Insert the officer
        await sql`
          INSERT INTO officers (name, position, email, phone, club, club_name)
          VALUES (${fullName}, ${position}, ${email}, ${phone}, ${clubName}, ${clubName})
        `;
        
        insertedCount++;
        
        // Log progress every 10 insertions
        if (insertedCount % 10 === 0) {
          console.log(`✅ Inserted ${insertedCount} officers...`);
        }
        
      } catch (error) {
        errorCount++;
        console.log(`❌ Error processing row ${i}:`, error.message);
      }
    }
    
    console.log('\n🎉 Officers data loading completed!');
    console.log(`✅ Successfully inserted: ${insertedCount} officers`);
    console.log(`⚠️ Skipped rows: ${skippedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    
    // Verify the data
    console.log('\n📋 Verifying data...');
    const officerCount = await sql`SELECT COUNT(*) as count FROM officers`;
    console.log(`Total officers in database: ${officerCount[0].count}`);
    
    // Show sample of inserted data
    const sampleOfficers = await sql`SELECT name, position, club_name FROM officers LIMIT 10`;
    console.log('\n📋 Sample officers:');
    sampleOfficers.forEach(officer => {
      console.log(`- ${officer.name} (${officer.position}) - ${officer.club_name}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

loadOfficersFixed();
