require('dotenv').config({ path: '.env.local' });
const { getSql } = require('./database/connection');

async function checkOfficersSchema() {
    try {
        console.log('🔍 Checking officers table structure and data...');
        
        const sql = getSql();
        if (!sql) {
            console.error('❌ Database connection not available');
            return;
        }
        
        // Check table structure
        console.log('\n📋 Officers table structure:');
        const structure = await sql`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'officers' 
            ORDER BY ordinal_position
        `;
        
        structure.forEach(col => {
            console.log(`- ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
        });
        
        // Check actual data
        console.log('\n📋 Officers table data:');
        const officers = await sql`SELECT * FROM officers ORDER BY created_at`;
        
        officers.forEach((officer, index) => {
            console.log(`${index + 1}. ${officer.name} - ${officer.position}`);
            console.log(`   club: ${officer.club}`);
            console.log(`   club_name: ${officer.club_name}`);
            console.log(`   club_id: ${officer.club_id || 'NULL'}`);
            console.log('');
        });
        
        // Check if there's a club_id column
        console.log('\n📋 Checking for club_id column:');
        const hasClubId = structure.some(col => col.column_name === 'club_id');
        console.log(`Has club_id column: ${hasClubId}`);
        
        if (!hasClubId) {
            console.log('❌ The officers table does not have a club_id column!');
            console.log('This explains why the JOIN is not working.');
        }
        
    } catch (error) {
        console.error('❌ Error checking officers schema:', error.message);
    } finally {
        process.exit(0);
    }
}

checkOfficersSchema();
