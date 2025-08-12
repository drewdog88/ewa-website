require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function clearInsuranceTestData() {
  try {
    console.log('🗑️ Clearing all insurance form test data...');
    
    const result = await sql`DELETE FROM insurance_forms`;
    
    console.log(`✅ Cleared ${result.length} insurance form records`);
    
  } catch (error) {
    console.error('❌ Error clearing insurance test data:', error);
  }
}

clearInsuranceTestData().then(() => {
  console.log('🏁 Clear operation completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Clear operation failed:', error);
  process.exit(1);
});
