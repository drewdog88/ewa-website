require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createDevAdmin() {
  try {
    console.log('🔧 Creating development admin user...');
    
    // Create a simple password hash (in production, use proper bcrypt)
    const password = 'admin123'; // Simple password for dev
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    
    const result = await pool.query(`
      INSERT INTO users (username, password, role, club, club_name, is_locked, is_first_login, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING username, role, created_at
    `, [
      'admin',
      hashedPassword,
      'admin',
      'ewa',
      'EWA Admin',
      false,
      false
    ]);
    
    console.log('✅ Development admin user created successfully!');
    console.log(`📋 Username: admin`);
    console.log(`🔑 Password: admin123`);
    console.log(`👤 Role: ${result.rows[0].role}`);
    console.log(`📅 Created: ${result.rows[0].created_at}`);
    
    console.log('\n🔗 You can now log in at:');
    console.log('   - Dev site: https://ewa-website-dev.vercel.app/admin/login.html');
    console.log('   - Local: http://localhost:3000/admin/login.html');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  } finally {
    await pool.end();
  }
}

createDevAdmin();
