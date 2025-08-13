// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { neon } = require('@neondatabase/serverless');
const fs = require('fs').promises;

async function syncProductionPaymentData() {
    console.log('🔄 Syncing payment data to production database...');
    const sql = neon(process.env.DATABASE_URL);
    
    try {
        // Read the exported data
        const exportData = JSON.parse(
            await fs.readFile('data/booster-clubs-export.json', 'utf8')
        );
        
        console.log(`📊 Found ${exportData.totalClubs} clubs to sync`);
        
        let updatedCount = 0;
        let stripeUpdated = 0;
        let zelleUpdated = 0;
        
        // Update each club's payment data
        for (const club of exportData.clubs) {
            console.log(`\n🔄 Updating ${club.name}...`);
            
            const updateResult = await sql`
                UPDATE booster_clubs 
                SET 
                    zelle_url = ${club.zelle_url},
                    stripe_url = ${club.stripe_url},
                    is_payment_enabled = ${club.is_payment_enabled},
                    updated_at = NOW()
                WHERE id = ${club.id}
            `;
            
            if (updateResult.count > 0) {
                updatedCount++;
                if (club.stripe_url) stripeUpdated++;
                if (club.zelle_url) zelleUpdated++;
                
                console.log(`  ✅ Updated: ${club.name}`);
                if (club.stripe_url) console.log(`    💳 Stripe: ${club.stripe_url}`);
                if (club.zelle_url) console.log(`    💰 Zelle: ${club.zelle_url.substring(0, 50)}...`);
            } else {
                console.log(`  ⚠️  No changes for: ${club.name}`);
            }
        }
        
        console.log(`\n🎉 Sync completed successfully!`);
        console.log(`📊 Summary:`);
        console.log(`  - Total clubs updated: ${updatedCount}`);
        console.log(`  - Clubs with Stripe URLs: ${stripeUpdated}`);
        console.log(`  - Clubs with Zelle URLs: ${zelleUpdated}`);
        
        // Verify the sync
        console.log(`\n🔍 Verifying sync...`);
        const verification = await sql`
            SELECT 
                name,
                zelle_url IS NOT NULL as has_zelle,
                stripe_url IS NOT NULL as has_stripe,
                is_payment_enabled
            FROM booster_clubs
            ORDER BY name
        `;
        
        const withZelle = verification.filter(v => v.has_zelle).length;
        const withStripe = verification.filter(v => v.has_stripe).length;
        const paymentEnabled = verification.filter(v => v.is_payment_enabled).length;
        
        console.log(`✅ Verification complete:`);
        console.log(`  - Clubs with Zelle: ${withZelle}`);
        console.log(`  - Clubs with Stripe: ${withStripe}`);
        console.log(`  - Payment enabled: ${paymentEnabled}`);
        
    } catch (error) {
        console.error('❌ Sync failed:', error);
        console.error('Error details:', error.message);
    }
}

syncProductionPaymentData();
