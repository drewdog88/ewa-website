// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { neon } = require('@neondatabase/serverless');

async function runStripeMigration() {
    console.log('🔄 Running Stripe URL Schema Migration...');
    const sql = neon(process.env.DATABASE_URL);
    
    try {
        // Step 1: Add the new simple stripe_url column
        console.log('📝 Step 1: Adding stripe_url column...');
        await sql`
            ALTER TABLE booster_clubs 
            ADD COLUMN IF NOT EXISTS stripe_url VARCHAR(500)
        `;
        console.log('✅ Added stripe_url column');
        
        // Step 2: Migrate existing data from JSONB to simple string
        console.log('📝 Step 2: Migrating existing data...');
        const migrationResult = await sql`
            UPDATE booster_clubs 
            SET stripe_url = (
                CASE 
                    WHEN stripe_urls IS NOT NULL AND stripe_urls::text != 'null' 
                    THEN (stripe_urls::jsonb->>'payment')::VARCHAR(500)
                    ELSE NULL
                END
            )
            WHERE stripe_urls IS NOT NULL
        `;
        console.log(`✅ Migrated ${migrationResult.count} records`);
        
        // Step 3: Drop the old complex JSONB column
        console.log('📝 Step 3: Dropping old stripe_urls column...');
        await sql`
            ALTER TABLE booster_clubs 
            DROP COLUMN IF EXISTS stripe_urls
        `;
        console.log('✅ Dropped stripe_urls column');
        
        // Step 4: Add an index for better performance
        console.log('📝 Step 4: Adding index...');
        await sql`
            CREATE INDEX IF NOT EXISTS idx_booster_clubs_stripe_url 
            ON booster_clubs(stripe_url)
        `;
        console.log('✅ Added index');
        
        // Verify the migration
        console.log('📝 Step 5: Verifying migration...');
        const verification = await sql`
            SELECT 
                id, 
                name, 
                zelle_url, 
                stripe_url, 
                is_payment_enabled 
            FROM booster_clubs 
            WHERE stripe_url IS NOT NULL 
            LIMIT 5
        `;
        
        console.log('✅ Migration completed successfully!');
        console.log('📊 Verification results:');
        console.log(JSON.stringify(verification, null, 2));
        
        // Check Band Boosters specifically
        const bandBoosters = await sql`
            SELECT 
                id, 
                name, 
                zelle_url, 
                stripe_url, 
                is_payment_enabled 
            FROM booster_clubs 
            WHERE name ILIKE '%band%' AND is_active = true
        `;
        
        console.log('\n🎵 Band Boosters data after migration:');
        console.log(JSON.stringify(bandBoosters, null, 2));
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        console.error('Error details:', error.message);
    }
}

runStripeMigration();
