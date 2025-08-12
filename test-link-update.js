require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function testLinkUpdate() {
  try {
    console.log('🔍 Testing link update functionality...');
    
    // First, create a test link
    console.log('📝 Creating test link...');
    const createResult = await sql`
      INSERT INTO links (title, url, category, order_index, is_visible, created_by)
      VALUES ('Test Link for Update', 'https://test.com', 'test', 1, true, 'admin')
      RETURNING *
    `;
    
    console.log('✅ Created test link:', createResult[0]);
    const linkId = createResult[0].id;
    
    // Try to update the link
    console.log('🔄 Attempting to update link...');
    const updateResult = await sql`
      UPDATE links
      SET title = 'Updated Test Link',
          url = 'https://updated-test.com',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${linkId}
      RETURNING *
    `;
    
    console.log('📝 Update result:', updateResult);
    
    if (updateResult.length > 0) {
      console.log('✅ Link updated successfully');
    } else {
      console.log('❌ Link update failed');
    }
    
    // Clean up - delete the test link
    console.log('🧹 Cleaning up test link...');
    await sql`DELETE FROM links WHERE id = ${linkId}`;
    console.log('✅ Test link deleted');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testLinkUpdate().then(() => {
  console.log('🏁 Test completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
