const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function addSortOrderField() {
  console.log('🗄️ ADDING SORT_ORDER FIELD TO BOOSTER_CLUBS TABLE\n');
  console.log('=' .repeat(60));
  
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    // Step 1: Add sort_order column
    console.log('📋 Step 1: Adding sort_order column...');
    await sql`
      ALTER TABLE booster_clubs 
      ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 999
    `;
    console.log('✅ sort_order column added');
    
    // Step 2: Create index for better performance
    console.log('📋 Step 2: Creating index for sort_order...');
    await sql`
      CREATE INDEX IF NOT EXISTS idx_booster_clubs_sort_order 
      ON booster_clubs(sort_order)
    `;
    console.log('✅ sort_order index created');
    
    // Step 3: Verify the column was added
    console.log('📋 Step 3: Verifying column addition...');
    const columnCheck = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'booster_clubs' 
      AND column_name = 'sort_order'
    `;
    
    if (columnCheck.length > 0) {
      console.log('✅ sort_order column verified in database');
      console.log(`   Data type: ${columnCheck[0].data_type}`);
      console.log(`   Nullable: ${columnCheck[0].is_nullable}`);
      console.log(`   Default: ${columnCheck[0].column_default}`);
    } else {
      console.log('❌ sort_order column not found');
      return;
    }
    
    // Step 4: Show current club count
    const clubCount = await sql`SELECT COUNT(*) as count FROM booster_clubs`;
    console.log(`📊 Total booster clubs: ${clubCount[0].count}`);
    
    console.log('\n🎉 SORT_ORDER FIELD ADDED SUCCESSFULLY!');
    console.log('Next step: Run update-sort-orders.js to set the sort values');
    
  } catch (error) {
    console.error('❌ Error adding sort_order field:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the function
addSortOrderField();
