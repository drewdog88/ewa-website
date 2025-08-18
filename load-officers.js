require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

async function loadOfficers() {
  console.log('🔄 Loading officers data from Excel file...');
  
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
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet);
    console.log(`📝 Found ${data.length} rows in Excel file`);
    
    // Display the first few rows to understand the structure
    console.log('\n📋 Sample data structure:');
    if (data.length > 0) {
      console.log('Columns:', Object.keys(data[0]));
      console.log('First row:', data[0]);
    }
    
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
    
    // Insert officers data
    console.log('\n📝 Inserting officers data...');
    let insertedCount = 0;
    let errorCount = 0;
    
    for (const row of data) {
      try {
        // Map Excel columns to database fields
        // Adjust these field names based on the actual Excel structure
        const officer = {
          name: row['Name'] || row['name'] || row['Officer Name'] || '',
          position: row['Position'] || row['position'] || row['Role'] || '',
          email: row['Email'] || row['email'] || '',
          phone: row['Phone'] || row['phone'] || row['Phone Number'] || '',
          club: row['Club'] || row['club'] || row['Booster Club'] || '',
          club_name: row['Club Name'] || row['club_name'] || row['Club'] || row['club'] || ''
        };
        
        // Skip if no name or position
        if (!officer.name || !officer.position) {
          console.log(`⚠️ Skipping row with missing name/position:`, row);
          continue;
        }
        
        await sql`
          INSERT INTO officers (name, position, email, phone, club, club_name)
          VALUES (${officer.name}, ${officer.position}, ${officer.email}, ${officer.phone}, ${officer.club}, ${officer.club_name})
        `;
        
        insertedCount++;
        
        // Log progress every 10 insertions
        if (insertedCount % 10 === 0) {
          console.log(`✅ Inserted ${insertedCount} officers...`);
        }
        
      } catch (error) {
        errorCount++;
        console.log(`❌ Error inserting officer:`, error.message, 'Row:', row);
      }
    }
    
    console.log('\n🎉 Officers data loading completed!');
    console.log(`✅ Successfully inserted: ${insertedCount} officers`);
    console.log(`❌ Errors: ${errorCount}`);
    
    // Verify the data
    console.log('\n📋 Verifying data...');
    const officerCount = await sql`SELECT COUNT(*) as count FROM officers`;
    console.log(`Total officers in database: ${officerCount[0].count}`);
    
    // Show sample of inserted data
    const sampleOfficers = await sql`SELECT name, position, club_name FROM officers LIMIT 5`;
    console.log('\n📋 Sample officers:');
    sampleOfficers.forEach(officer => {
      console.log(`- ${officer.name} (${officer.position}) - ${officer.club_name}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

loadOfficers();
