require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function testNewsUpdate() {
  try {
    console.log('🔍 Testing news update functionality...');
    
    // Check if the news article exists
    const newsId = '48b56081-1f4e-4bdc-92fb-4631dd03b586';
    console.log(`🔍 Checking if news article ${newsId} exists...`);
    
    const existingNews = await sql`SELECT * FROM news WHERE id = ${newsId}`;
    console.log('📰 Existing news:', existingNews);
    
    if (existingNews.length === 0) {
      console.log('❌ News article not found in database');
      return;
    }
    
    console.log('✅ News article found in database');
    
    // Try to update the news article
    console.log('🔄 Attempting to update news article...');
    const updateResult = await sql`
      UPDATE news 
      SET title = 'Updated Test Article',
          content = 'This article has been updated via direct database query',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${newsId}
      RETURNING *
    `;
    
    console.log('📝 Update result:', updateResult);
    
    if (updateResult.length > 0) {
      console.log('✅ News article updated successfully');
    } else {
      console.log('❌ News article update failed');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testNewsUpdate().then(() => {
  console.log('🏁 Test completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
