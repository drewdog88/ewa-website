const { neon } = require('@neondatabase/serverless');
const XLSX = require('xlsx');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function updateSortOrdersFixed() {
  console.log('🔄 UPDATING SORT_ORDER VALUES (FIXED VERSION)\n');
  console.log('=' .repeat(60));
  
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    // Step 1: Read the Excel file
    console.log('📋 Step 1: Reading reorder file...');
    const filePath = path.join(__dirname, '..', 'assets', 'Reorderboostermainpage.xlsx');
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`✅ Read ${data.length} rows from Excel file`);
    
    // Step 2: Create name mapping to handle differences
    console.log('📋 Step 2: Creating name mapping...');
    const nameMapping = {
      'Eastlake Wolfpack Association (EWA)': 'Eastlake Wolfpack Association'
    };
    
    // Step 3: Create the sort order mapping with corrected names
    console.log('📋 Step 3: Creating sort order mapping...');
    const sortOrderMap = {};
    
    data.forEach((row, index) => {
      let clubName = row['New Order'];
      const sortOrder = index + 1;
      
      // Apply name mapping if needed
      if (nameMapping[clubName]) {
        clubName = nameMapping[clubName];
      }
      
      sortOrderMap[clubName] = sortOrder;
      console.log(`   ${sortOrder}. ${clubName}`);
    });
    
    // Step 4: Update each club's sort_order
    console.log('\n📋 Step 4: Updating sort_order values in database...');
    let updatedCount = 0;
    
    for (const [clubName, sortOrder] of Object.entries(sortOrderMap)) {
      const result = await sql`
        UPDATE booster_clubs 
        SET sort_order = ${sortOrder}, updated_at = CURRENT_TIMESTAMP
        WHERE name = ${clubName}
      `;
      
      if (result.count > 0) {
        console.log(`   ✅ Updated: ${clubName} -> sort_order = ${sortOrder}`);
        updatedCount++;
      } else {
        console.log(`   ⚠️  Not found: ${clubName}`);
      }
    }
    
    // Step 5: Verify the updates
    console.log('\n📋 Step 5: Verifying updates...');
    const clubs = await sql`
      SELECT name, sort_order 
      FROM booster_clubs 
      ORDER BY sort_order
    `;
    
    console.log('\n📊 FINAL SORT ORDER:');
    console.log('─'.repeat(50));
    clubs.forEach((club, index) => {
      console.log(`${(index + 1).toString().padStart(2)}. ${club.name} (sort_order: ${club.sort_order})`);
    });
    
    console.log(`\n🎉 UPDATED ${updatedCount} CLUBS SUCCESSFULLY!`);
    console.log('Next step: Update getBoosterClubs() function to use sort_order');
    
  } catch (error) {
    console.error('❌ Error updating sort orders:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the function
updateSortOrdersFixed();
