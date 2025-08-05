require('dotenv').config({ path: '.env.local' });
const { getSql } = require('./neon-functions.js');

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

    } catch (error) {
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
    }
}

addW9Columns(); 