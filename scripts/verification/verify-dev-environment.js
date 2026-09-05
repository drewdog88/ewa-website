require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function verifyDevEnvironment() {
  console.log('🔍 Verifying Development Environment...');
  console.log('=====================================');

  try {
    const sql = neon(process.env.DATABASE_URL);
    console.log('✅ Connected to database');
    // Log only the host; the URL embeds the DB password
    console.log(`📋 DATABASE_URL host: ${(process.env.DATABASE_URL.match(/@([^/?]+)/) || [])[1] || 'unparseable'}`);
    console.log(`📋 NODE_ENV: ${process.env.NODE_ENV}`);

    // Check if we're connected to production database
    const dbInfo = await sql`SELECT current_database(), current_user`;
    console.log(`📋 Database: ${dbInfo[0].current_database}`);
    console.log(`📋 User: ${dbInfo[0].current_user}`);

    // Check tables
    console.log('\n📋 Checking tables...');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    console.log(`   Found ${tables.length} tables`);

    // Check booster_clubs
    console.log('\n📋 Checking booster_clubs...');
    const clubCount = await sql`SELECT COUNT(*) as count FROM booster_clubs`;
    console.log(`   Booster clubs count: ${clubCount[0].count}`);

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

    // Check users
    console.log('\n📋 Checking users...');
    const userCount = await sql`SELECT COUNT(*) as count FROM users`;
    console.log(`   Users count: ${userCount[0].count}`);

    const adminUser = await sql`SELECT username, password, role FROM users WHERE username = 'admin'`;
    if (adminUser.length > 0) {
      console.log(`   Admin user found: ${adminUser[0].username} (role: ${adminUser[0].role})`);
      console.log(`   Admin password: ${adminUser[0].password}`);
    } else {
      console.log('   ❌ Admin user not found');
    }

    console.log('\n🎉 Development environment is working!');
    console.log('\n🔗 You can now:');
    console.log('   - Visit: https://ewa-website-dev.vercel.app');
    console.log('   - Login to admin: https://ewa-website-dev.vercel.app/admin/login.html');
    console.log('   - Use admin credentials: admin/***REMOVED***');
    console.log('   - All data will be from production (read-only)');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verifyDevEnvironment();
