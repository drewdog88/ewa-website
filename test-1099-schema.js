require('dotenv').config({ path: '.env.local' });
const { getSql, addForm1099 } = require('./database/neon-functions.js');

async function testSchema() {
    try {
        const sql = getSql();
        if (!sql) {
            console.error('Database connection not available');
            return;
        }

        console.log('Checking form_1099 table schema...');
        const columns = await sql`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'form_1099' 
            ORDER BY ordinal_position
        `;
        
        console.log('Table columns:');
        columns.forEach(col => {
            console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
        });

        console.log('\nTesting addForm1099 function...');
        const testForm = {
            recipientName: 'Test Vendor',
            recipientTin: '123-45-6789',
            amount: 100.00,
            description: 'Test service',
            submittedBy: 'admin',
            taxYear: 2024,
            status: 'pending',
            w9Filename: 'test.pdf',
            w9BlobUrl: 'https://test.com/test.pdf',
            w9FileSize: 1024,
            w9MimeType: 'application/pdf'
        };

        const result = await addForm1099(testForm);
        console.log('addForm1099 result:', result);

    } catch (error) {
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
    }
}

testSchema(); 