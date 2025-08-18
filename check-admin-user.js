require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function checkAdminUser() {
  console.log('🔍 Checking admin user details...');
  
  try {
    const sql = neon(process.env.DATABASE_URL);
    console.log('✅ Connected to dev database');
    
    // Check all users
    const users = await sql`SELECT * FROM users ORDER BY created_at`;
    console.log(`📋 Total users: ${users.length}`);
    
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.username} (${user.role})`);
      console.log(`   Password: ${user.password}`);
      console.log(`   Club: ${user.club || 'NULL'}`);
      console.log(`   Club Name: ${user.club_name || 'NULL'}`);
      console.log(`   Is Locked: ${user.is_locked}`);
      console.log(`   Is First Login: ${user.is_first_login}`);
      console.log(`   Created: ${user.created_at}`);
      console.log(`   Last Login: ${user.last_login || 'NULL'}`);
      console.log(`   Club ID: ${user.club_id || 'NULL'}`);
      console.log(`   Secret Question: ${user.secret_question || 'NULL'}`);
      console.log(`   Secret Answer: ${user.secret_answer || 'NULL'}`);
    });
    
    // Check for admin users specifically
    const adminUsers = await sql`SELECT * FROM users WHERE role = 'admin'`;
    console.log(`\n👑 Admin users found: ${adminUsers.length}`);
    
    if (adminUsers.length === 0) {
      console.log('❌ No admin users found!');
    } else {
      adminUsers.forEach((admin, index) => {
        console.log(`\n👑 Admin ${index + 1}:`);
        console.log(`   Username: ${admin.username}`);
        console.log(`   Password: ${admin.password}`);
        console.log(`   Role: ${admin.role}`);
      });
    }
    
    // Check what the production JSON shows
    console.log('\n📋 Production JSON admin user:');
    console.log('   Username: admin');
    console.log('   Password: ***REMOVED***');
    console.log('   Role: admin');
    
    console.log('\n🔍 Analysis:');
    if (adminUsers.length > 0) {
      const admin = adminUsers[0];
      if (admin.username === 'admin' && admin.password === '***REMOVED***') {
        console.log('✅ Admin user matches production JSON');
      } else {
        console.log('❌ Admin user does NOT match production JSON');
        console.log(`   Expected: admin/***REMOVED***`);
        console.log(`   Found: ${admin.username}/${admin.password}`);
      }
    } else {
      console.log('❌ No admin user found in database');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAdminUser();
