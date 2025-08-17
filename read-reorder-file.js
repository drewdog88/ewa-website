const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

function readReorderFile() {
  console.log('📋 READING REORDER FILE AND CREATING COMPARISON TABLE\n');
  console.log('=' .repeat(70));
  
  try {
    // Read the Excel file
    const filePath = path.join(__dirname, 'assets', 'Reorderboostermainpage.xlsx');
    const workbook = XLSX.readFile(filePath);
    
    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`✅ Successfully read file: ${filePath}`);
    console.log(`📊 Found ${data.length} rows of data\n`);
    
    // Display the comparison table
    console.log('🔄 COMPARISON TABLE: CURRENT ORDER vs DESIRED ORDER');
    console.log('─'.repeat(70));
    console.log('│ # │ Current Order (Alphabetical) │ Desired Order (Your Choice) │ Sort Order │');
    console.log('├───┼──────────────────────────────┼──────────────────────────────┼────────────┤');
    
    data.forEach((row, index) => {
      const currentOrder = row['Existing Order'] || 'N/A';
      const newOrder = row['New Order'] || 'N/A';
      const sortOrder = index + 1;
      
      // Pad strings to fit table columns
      const currentPadded = currentOrder.padEnd(30);
      const newPadded = newOrder.padEnd(30);
      const sortPadded = sortOrder.toString().padEnd(10);
      
      console.log(`│ ${(index + 1).toString().padStart(2)} │ ${currentPadded} │ ${newPadded} │ ${sortPadded} │`);
    });
    
    console.log('└───┴──────────────────────────────┴──────────────────────────────┴────────────┘');
    
    // Validation checks
    console.log('\n🔍 VALIDATION CHECKS');
    console.log('─'.repeat(20));
    
    // Check if all names match
    const currentNames = data.map(row => row['Existing Order']).filter(Boolean);
    const newNames = data.map(row => row['New Order']).filter(Boolean);
    
    console.log(`📊 Total rows: ${data.length}`);
    console.log(`📊 Current names: ${currentNames.length}`);
    console.log(`📊 New names: ${newNames.length}`);
    
    // Check for missing data
    const missingCurrent = data.filter(row => !row['Existing Order']).length;
    const missingNew = data.filter(row => !row['New Order']).length;
    
    if (missingCurrent > 0) {
      console.log(`⚠️  Missing "Existing Order" data: ${missingCurrent} rows`);
    }
    if (missingNew > 0) {
      console.log(`⚠️  Missing "New Order" data: ${missingNew} rows`);
    }
    
    // Check for exact name matches
    const exactMatches = currentNames.filter(name => newNames.includes(name)).length;
    console.log(`✅ Exact name matches: ${exactMatches}/${currentNames.length}`);
    
    if (exactMatches === currentNames.length) {
      console.log('🎉 All names match perfectly! Safe to proceed with reordering.');
    } else {
      console.log('⚠️  Some names may not match exactly. Please review before proceeding.');
    }
    
    // Show the data structure for debugging
    console.log('\n📋 RAW DATA STRUCTURE (First 3 rows):');
    console.log('─'.repeat(40));
    data.slice(0, 3).forEach((row, index) => {
      console.log(`Row ${index + 1}:`, JSON.stringify(row, null, 2));
    });
    
    return data;
    
  } catch (error) {
    console.error('❌ Error reading Excel file:', error.message);
    console.error('Stack trace:', error.stack);
    return null;
  }
}

// Run the function
const reorderData = readReorderFile();

if (reorderData) {
  console.log('\n📋 NEXT STEPS');
  console.log('─'.repeat(15));
  console.log('1. Review the comparison table above');
  console.log('2. Confirm all names match exactly');
  console.log('3. Create MainPageReorder branch');
  console.log('4. Implement sort_order field in database');
  console.log('5. Update getBoosterClubs() function');
  console.log('6. Test the new order');
}
