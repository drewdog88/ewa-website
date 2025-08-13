// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { neon } = require('@neondatabase/serverless');

async function checkWolfpackClub() {
    console.log('🔍 Checking Wolfpack club in database...');
    const sql = neon(process.env.DATABASE_URL);
    
    try {
        const result = await sql`
            SELECT id, name FROM booster_clubs 
            WHERE name LIKE '%Wolfpack%'
        `;
        
        console.log('📊 Wolfpack clubs found:');
        result.forEach(club => {
            console.log(`  - ID: ${club.id}`);
            console.log(`    Name: ${club.name}`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

checkWolfpackClub();
