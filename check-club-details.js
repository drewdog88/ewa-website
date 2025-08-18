require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkClubDetails() {
  try {
    console.log('🔍 Checking booster club details in dev database...');
    
    // First check what columns exist
    const columnsResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'booster_clubs' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Available columns in booster_clubs table:');
    columnsResult.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });
    
    // Get detailed info for a few clubs (using only existing columns)
    const result = await pool.query(`
      SELECT id, name, description, website_url, is_active, 
             created_at, updated_at
      FROM booster_clubs 
      ORDER BY name 
      LIMIT 5
    `);
    
    console.log(`\n📋 Detailed club information (showing first 5):`);
    console.log('=' .repeat(80));
    
    result.rows.forEach((club, index) => {
      console.log(`\n${index + 1}. ${club.name}`);
      console.log(`   ID: ${club.id}`);
      console.log(`   Active: ${club.is_active}`);
      console.log(`   Website URL: ${club.website_url || 'NULL'}`);
      console.log(`   Description: ${club.description || 'NULL'}`);
      console.log(`   Created: ${club.created_at}`);
      console.log(`   Updated: ${club.updated_at}`);
    });
    
    // Check total counts
    const totalClubs = await pool.query('SELECT COUNT(*) as total FROM booster_clubs');
    const clubsWithUrls = await pool.query('SELECT COUNT(*) as with_urls FROM booster_clubs WHERE website_url IS NOT NULL AND website_url != \'\'');
    const activeClubs = await pool.query('SELECT COUNT(*) as active FROM booster_clubs WHERE is_active = true');
    
    console.log('\n' + '=' .repeat(80));
    console.log('📊 Summary:');
    console.log(`   Total clubs: ${totalClubs.rows[0].total}`);
    console.log(`   Active clubs: ${activeClubs.rows[0].active}`);
    console.log(`   Clubs with website URLs: ${clubsWithUrls.rows[0].with_urls}`);
    
  } catch (error) {
    console.error('❌ Error checking club details:', error.message);
  } finally {
    await pool.end();
  }
}

checkClubDetails();
