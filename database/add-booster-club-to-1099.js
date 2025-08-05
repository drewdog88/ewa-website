require('dotenv').config({ path: '.env.local' });
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

async function addBoosterClubTo1099() {
    const sql = getSql();
    if (!sql) {
        console.error('❌ Database connection not available');
        return;
    }
    
    try {
        console.log('🔄 Adding booster_club column to form_1099 table...');
        
        // Add booster_club column to form_1099 table
        await sql`
            ALTER TABLE form_1099 
            ADD COLUMN IF NOT EXISTS booster_club VARCHAR(100)
        `;
        
        // Add index for better performance
        await sql`
            CREATE INDEX IF NOT EXISTS idx_1099_booster_club ON form_1099(booster_club)
        `;
        
        // Add index for tax_year for filtering
        await sql`
            CREATE INDEX IF NOT EXISTS idx_1099_tax_year ON form_1099(tax_year)
        `;
        
        console.log('✅ Successfully added booster_club column to form_1099 table');
        console.log('✅ Added indexes for booster_club and tax_year');
        
        // Show the updated table structure
        const columns = await sql`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'form_1099' 
            ORDER BY ordinal_position
        `;
        
        console.log('📋 Updated form_1099 table structure:');
        columns.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
        });
        
    } catch (error) {
        console.error('❌ Error adding booster_club column:', error);
        throw error;
    }
}

// Run the migration
if (require.main === module) {
    addBoosterClubTo1099()
        .then(() => {
            console.log('🎉 Migration completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Migration failed:', error);
            process.exit(1);
        });
}

module.exports = { addBoosterClubTo1099 }; 