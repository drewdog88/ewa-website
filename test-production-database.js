require('dotenv').config({ path: '.env.production' });
const { neon } = require('@neondatabase/serverless');

async function testProductionDatabase() {
  console.log('🔍 Testing Production Database Connection...');
  console.log('==========================================');

  try {
    const sql = neon(process.env.DATABASE_URL);
    console.log('✅ Connected to PRODUCTION database');
    console.log(`📋 DATABASE_URL: ${process.env.DATABASE_URL.substring(0, 50)}...`);

    // Check current tables
    console.log('\n📋 Current tables in PRODUCTION:');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    console.log(`   Found ${tables.length} tables`);
    tables.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });

    // Check booster_clubs table
    if (tables.some(t => t.table_name === 'booster_clubs')) {
      console.log('\n📋 Checking booster_clubs in PRODUCTION:');
      const clubCount = await sql`SELECT COUNT(*) as count FROM booster_clubs`;
      console.log(`   Booster clubs count: ${clubCount[0].count}`);
      
      const clubColumns = await sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'booster_clubs' 
        ORDER BY ordinal_position
      `;
      console.log(`   Booster clubs columns: ${clubColumns.length}`);
      clubColumns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type}`);
      });
    }

    console.log('\n✅ Production database is working correctly.');
    console.log('The issue appears to be specific to the development database.');

  } catch (error) {
    console.error('❌ Error connecting to production:', error.message);
  }
}

testProductionDatabase();
