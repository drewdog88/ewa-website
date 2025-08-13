// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { neon } = require('@neondatabase/serverless');

async function updateEWAClubName() {
    console.log('🔄 Updating EWA Eastlake Wolfpack Association to Eastlake Wolfpack Association...');
    const sql = neon(process.env.DATABASE_URL);
    
    try {
        // Update the club name
        console.log('📝 Updating club name in database...');
        
        const updateResult = await sql`
            UPDATE booster_clubs 
            SET 
                name = 'Eastlake Wolfpack Association',
                updated_at = NOW()
            WHERE name = 'EWA Eastlake Wolfpack Association'
        `;
        
        if (updateResult.count > 0) {
            console.log(`✅ Successfully updated club name`);
        } else {
            console.log(`⚠️  No club found with name: EWA Eastlake Wolfpack Association`);
        }
        
        // Verify the change
        console.log(`\n🔍 Verifying the change...`);
        const verification = await sql`
            SELECT 
                id,
                name,
                is_active,
                is_payment_enabled,
                zelle_url IS NOT NULL as has_zelle,
                stripe_url IS NOT NULL as has_stripe
            FROM booster_clubs
            WHERE name LIKE '%Wolfpack%'
            ORDER BY name
        `;
        
        console.log(`✅ Verification complete:`);
        verification.forEach(club => {
            console.log(`    - ${club.name} (ID: ${club.id})`);
            console.log(`      Active: ${club.is_active}, Payment: ${club.is_payment_enabled}`);
            console.log(`      Zelle: ${club.has_zelle}, Stripe: ${club.has_stripe}`);
        });
        
        // Check for any remaining EWA references
        const remainingEWA = await sql`
            SELECT name FROM booster_clubs 
            WHERE name LIKE '%EWA%' 
            ORDER BY name
        `;
        
        if (remainingEWA.length > 0) {
            console.log(`\n⚠️  Remaining clubs with "EWA" in name:`);
            remainingEWA.forEach(club => {
                console.log(`    - ${club.name}`);
            });
        } else {
            console.log(`\n✅ All EWA references have been updated!`);
        }
        
    } catch (error) {
        console.error('❌ Update failed:', error);
        console.error('Error details:', error.message);
    }
}

updateEWAClubName();
