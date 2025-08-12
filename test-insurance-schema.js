require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function testInsuranceSchema() {
  try {
    console.log('🔍 Testing insurance forms table...');
    
    // Check if the table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'insurance_forms'
      );
    `;
    
    console.log('📋 Table exists:', tableCheck[0].exists);
    
    if (tableCheck[0].exists) {
      // Get table structure
      const structure = await sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'insurance_forms'
        ORDER BY ordinal_position;
      `;
      
      console.log('📊 Table structure:');
      structure.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
      
      // Try to insert a test record
      console.log('📝 Testing insert...');
      const insertResult = await sql`
        INSERT INTO insurance_forms (event_name, event_date, event_description, participant_count, submitted_by, status)
        VALUES ('Test Event', '2025-01-15', 'Test description', 50, 'admin', 'pending')
        RETURNING *
      `;
      
      console.log('✅ Insert successful:', insertResult[0]);
      
      // Clean up
      await sql`DELETE FROM insurance_forms WHERE event_name = 'Test Event'`;
      console.log('🧹 Test record cleaned up');
      
    } else {
      console.log('❌ Table does not exist - need to create it');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testInsuranceSchema().then(() => {
  console.log('🏁 Test completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
