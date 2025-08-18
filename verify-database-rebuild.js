require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function verifyDatabaseRebuild() {
  console.log('🔍 Verifying Database Rebuild...');
  console.log('================================');

  try {
    const sql = neon(process.env.DATABASE_URL);
    console.log('✅ Connected to dev database\n');

    // Test 1: Check if all tables exist
    console.log('📋 Test 1: Checking table existence...');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    
    console.log(`   Found ${tables.length} tables:`);
    tables.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });
    console.log('');

    // Test 2: Check booster_clubs table specifically
    console.log('📋 Test 2: Checking booster_clubs table...');
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
    console.log('');

    // Test 3: Check users table
    console.log('📋 Test 3: Checking users table...');
    const userCount = await sql`SELECT COUNT(*) as count FROM users`;
    console.log(`   Users count: ${userCount[0].count}`);
    
    const adminUser = await sql`SELECT username, password, role FROM users WHERE username = 'admin'`;
    if (adminUser.length > 0) {
      console.log(`   Admin user found: ${adminUser[0].username} (role: ${adminUser[0].role})`);
      console.log(`   Admin password: ${adminUser[0].password}`);
    } else {
      console.log('   ❌ Admin user not found');
    }
    console.log('');

    // Test 4: Test a sample query
    console.log('📋 Test 4: Testing sample queries...');
    const sampleClubs = await sql`
      SELECT name, is_active, is_payment_enabled, sort_order 
      FROM booster_clubs 
      WHERE is_active = true 
      ORDER BY sort_order, name 
      LIMIT 3
    `;
    console.log(`   Sample active clubs: ${sampleClubs.length}`);
    sampleClubs.forEach(club => {
      console.log(`   - ${club.name} (payment: ${club.is_payment_enabled}, sort: ${club.sort_order})`);
    });
    console.log('');

    console.log('🎉 Database verification complete!');
    console.log('\n🔗 You can now:');
    console.log('   - Visit: https://ewa-website-dev.vercel.app');
    console.log('   - Login to admin: https://ewa-website-dev.vercel.app/admin/login.html');
    console.log('   - Use admin credentials: admin/ewa2025');

  } catch (error) {
    console.error('❌ Error during verification:', error.message);
  }
}

verifyDatabaseRebuild();
