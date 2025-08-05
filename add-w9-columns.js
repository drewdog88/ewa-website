require('dotenv').config({ path: '.env.local' });
const { getSql } = require('./database/neon-functions.js');

async function addW9Columns() {
    try {
        const sql = getSql();
        if (!sql) {
            console.error('Database connection not available');
            return;
        }

        console.log('Adding W9 columns to form_1099 table...');

        // Add W9 columns if they don't exist
        await sql`ALTER TABLE form_1099 ADD COLUMN IF NOT EXISTS w9_filename VARCHAR(255)`;
        await sql`ALTER TABLE form_1099 ADD COLUMN IF NOT EXISTS w9_blob_url VARCHAR(500)`;
        await sql`ALTER TABLE form_1099 ADD COLUMN IF NOT EXISTS w9_file_size INTEGER`;
        await sql`ALTER TABLE form_1099 ADD COLUMN IF NOT EXISTS w9_mime_type VARCHAR(100)`;

        console.log('✅ W9 columns added successfully');

        // Verify the columns exist
        const columns = await sql`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'form_1099' 
            ORDER BY ordinal_position
        `;
        
        console.log('\nUpdated table columns:');
        columns.forEach(col => {
            console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
        });

    } catch (error) {
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
    }
}

addW9Columns(); 