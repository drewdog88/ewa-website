// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { neon } = require('@neondatabase/serverless');
const fs = require('fs').promises;

async function exportBoosterClubsData() {
    console.log('📤 Exporting booster clubs data from local database...');
    const sql = neon(process.env.DATABASE_URL);
    
    try {
        // Get all booster clubs data
        const clubs = await sql`
            SELECT 
                id,
                name,
                zelle_url,
                stripe_url,
                is_payment_enabled,
                is_active,
                created_at,
                updated_at
            FROM booster_clubs
            ORDER BY name
        `;
        
        console.log(`✅ Found ${clubs.length} booster clubs`);
        
        // Save to file
        const exportData = {
            exportDate: new Date().toISOString(),
            totalClubs: clubs.length,
            clubs: clubs
        };
        
        await fs.writeFile(
            'data/booster-clubs-export.json', 
            JSON.stringify(exportData, null, 2)
        );
        
        console.log('✅ Data exported to data/booster-clubs-export.json');
        console.log('\n📊 Sample data:');
        console.log(JSON.stringify(clubs.slice(0, 3), null, 2));
        
        // Show clubs with Stripe URLs
        const clubsWithStripe = clubs.filter(club => club.stripe_url);
        console.log(`\n💳 Clubs with Stripe URLs: ${clubsWithStripe.length}`);
        clubsWithStripe.forEach(club => {
            console.log(`  - ${club.name}: ${club.stripe_url}`);
        });
        
        // Show clubs with Zelle URLs
        const clubsWithZelle = clubs.filter(club => club.zelle_url);
        console.log(`\n💰 Clubs with Zelle URLs: ${clubsWithZelle.length}`);
        clubsWithZelle.forEach(club => {
            console.log(`  - ${club.name}: ${club.zelle_url}`);
        });
        
    } catch (error) {
        console.error('❌ Export failed:', error);
        console.error('Error details:', error.message);
    }
}

exportBoosterClubsData();
