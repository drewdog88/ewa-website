const { neon } = require('@neondatabase/serverless');

// Database connection configuration
let sql = null;

// Initialize the Neon connection
function getSql() {
    if (!sql) {
        if (!process.env.DATABASE_URL) {
            console.warn('⚠️ DATABASE_URL not found');
            return null;
        }
        sql = neon(process.env.DATABASE_URL);
        console.log('✅ Connected to Neon PostgreSQL database');
    }
    return sql;
}

async function test1099API() {
    const sql = getSql();
    if (!sql) {
        console.error('❌ Database connection not available');
        return;
    }
    
    try {
        console.log('🔍 Testing 1099 API functionality...');
        
        // 1. Check if the form_1099 table exists and has the right columns
        console.log('\n1. Checking table structure...');
        const columns = await sql`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'form_1099' 
            ORDER BY ordinal_position
        `;
        
        console.log('📋 form_1099 table structure:');
        columns.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
        });
        
        // 2. Check if there are any records
        console.log('\n2. Checking existing records...');
        const records = await sql`SELECT * FROM form_1099 ORDER BY created_at DESC`;
        console.log(`📊 Found ${records.length} 1099 records:`);
        records.forEach((record, index) => {
            console.log(`  ${index + 1}. ${record.recipient_name} - $${record.amount} (${record.tax_year})`);
        });
        
        // 3. Test the getForm1099 function
        console.log('\n3. Testing getForm1099 function...');
        const { getForm1099 } = require('./database/neon-functions.js');
        const submissions = await getForm1099();
        console.log(`📊 getForm1099 returned ${submissions.length} submissions`);
        
        if (submissions.length > 0) {
            console.log('📋 First submission details:');
            const first = submissions[0];
            console.log(`  - ID: ${first.id}`);
            console.log(`  - Recipient: ${first.recipient_name}`);
            console.log(`  - TIN: ${first.recipient_tin}`);
            console.log(`  - Amount: $${first.amount}`);
            console.log(`  - Tax Year: ${first.tax_year}`);
            console.log(`  - Status: ${first.status}`);
            console.log(`  - W9 Filename: ${first.w9_filename || 'null'}`);
            console.log(`  - W9 Blob URL: ${first.w9_blob_url || 'null'}`);
        }
        
    } catch (error) {
        console.error('❌ Error testing 1099 API:', error);
        throw error;
    }
}

// Run the test
if (require.main === module) {
    test1099API()
        .then(() => {
            console.log('\n🎉 Test completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 Test failed:', error);
            process.exit(1);
        });
}

module.exports = { test1099API }; 