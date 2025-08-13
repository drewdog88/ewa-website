// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { neon } = require('@neondatabase/serverless');

async function updateBoosterClubNames() {
    console.log('🔄 Updating booster club names from EHS to Eastlake...');
    const sql = neon(process.env.DATABASE_URL);
    
    try {
        // Define the name changes
        const nameChanges = [
            {
                oldName: 'EHS Band Boosters',
                newName: 'Eastlake Band Boosters'
            },
            {
                oldName: 'EHS DECA Booster Club',
                newName: 'Eastlake DECA Booster Club'
            },
            {
                oldName: 'EHS Orchestra Boosters Club',
                newName: 'Eastlake Orchestra Boosters Club'
            },
            {
                oldName: 'EHS Track and Field Booster Club',
                newName: 'Eastlake Track and Field Booster Club'
            },
            {
                oldName: 'EHS Wrestling Booster Club',
                newName: 'Eastlake Wrestling Booster Club'
            }
        ];
        
        console.log(`📝 Found ${nameChanges.length} clubs to update`);
        
        let updatedCount = 0;
        
        // Update each club name
        for (const change of nameChanges) {
            console.log(`\n🔄 Updating: "${change.oldName}" → "${change.newName}"`);
            
            const updateResult = await sql`
                UPDATE booster_clubs 
                SET 
                    name = ${change.newName},
                    updated_at = NOW()
                WHERE name = ${change.oldName}
            `;
            
            if (updateResult.count > 0) {
                updatedCount++;
                console.log(`  ✅ Updated successfully`);
            } else {
                console.log(`  ⚠️  No club found with name: ${change.oldName}`);
            }
        }
        
        console.log(`\n🎉 Name updates completed!`);
        console.log(`📊 Summary:`);
        console.log(`  - Total updates attempted: ${nameChanges.length}`);
        console.log(`  - Successfully updated: ${updatedCount}`);
        
        // Verify the changes
        console.log(`\n🔍 Verifying changes...`);
        const verification = await sql`
            SELECT 
                id,
                name,
                is_active,
                is_payment_enabled,
                zelle_url IS NOT NULL as has_zelle,
                stripe_url IS NOT NULL as has_stripe
            FROM booster_clubs
            WHERE name LIKE '%Eastlake%'
            ORDER BY name
        `;
        
        console.log(`✅ Verification complete:`);
        console.log(`  - Clubs with "Eastlake" in name: ${verification.length}`);
        verification.forEach(club => {
            console.log(`    - ${club.name} (ID: ${club.id})`);
            console.log(`      Active: ${club.is_active}, Payment: ${club.is_payment_enabled}`);
            console.log(`      Zelle: ${club.has_zelle}, Stripe: ${club.has_stripe}`);
        });
        
        // Check for any remaining EHS clubs
        const remainingEHS = await sql`
            SELECT name FROM booster_clubs 
            WHERE name LIKE '%EHS%' 
            ORDER BY name
        `;
        
        if (remainingEHS.length > 0) {
            console.log(`\n⚠️  Remaining clubs with "EHS" in name:`);
            remainingEHS.forEach(club => {
                console.log(`    - ${club.name}`);
            });
        } else {
            console.log(`\n✅ All EHS references have been updated!`);
        }
        
    } catch (error) {
        console.error('❌ Update failed:', error);
        console.error('Error details:', error.message);
    }
}

updateBoosterClubNames();
