require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function checkUsers() {
  try {
    const users = await sql`SELECT username FROM users`;
    console.log('Available users:', users.map(u => u.username));
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUsers().then(() => process.exit(0)).catch(console.error);
