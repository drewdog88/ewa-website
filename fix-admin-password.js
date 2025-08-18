require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function fixAdminPassword() {
  console.log('🔧 Fixing admin password...');
  
  try {
    const sql = neon(process.env.DATABASE_URL);
    console.log('✅ Connected to dev database');
    
    // Update the admin user's password to the correct plain text version
    const result = await sql`
      UPDATE users 
      SET password = 'ewa2025'
      WHERE username = 'admin' AND role = 'admin'
      RETURNING username, password, role
    `;
    
    if (result.length > 0) {
      console.log('✅ Admin password updated successfully!');
      console.log(`   Username: ${result[0].username}`);
      console.log(`   Password: ${result[0].password}`);
      console.log(`   Role: ${result[0].role}`);
    } else {
      console.log('❌ No admin user found to update');
    }
    
    // Verify the change
    const adminUser = await sql`SELECT username, password, role FROM users WHERE username = 'admin'`;
    if (adminUser.length > 0) {
      console.log('\n🔍 Verification:');
      console.log(`   Username: ${adminUser[0].username}`);
      console.log(`   Password: ${adminUser[0].password}`);
      console.log(`   Role: ${adminUser[0].role}`);
      
      if (adminUser[0].password === 'ewa2025') {
        console.log('✅ Password is now correct!');
        console.log('\n🔗 You can now login with:');
        console.log('   Username: admin');
        console.log('   Password: ewa2025');
        console.log('   URL: https://ewa-website-dev.vercel.app/admin/login.html');
      } else {
        console.log('❌ Password is still incorrect');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixAdminPassword();
