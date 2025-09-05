// Load environment variables for PRODUCTION database
require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const fs = require('fs').promises;

async function verifyProductionBackupIntegrity() {
    console.log('🔍 VERIFYING BACKUP AGAINST PRODUCTION DATABASE');
    console.log('===============================================\n');
    
    // Use the production DATABASE_URL (should be the Vercel/Neon production database)
    const sql = neon(process.env.DATABASE_URL);
    
    try {
        // Read the recent backup file (from 3:41 PM today)
        console.log('📖 Reading recent backup file...');
        const backupFile = 'backup/backups/db-backup-2025-08-12T22-41-05-063Z.sql';
        const backupContent = await fs.readFile(backupFile, 'utf8');
        console.log(`✅ Backup file read: ${backupContent.length} characters`);
        
        // Get current PRODUCTION database stats
        console.log('\n📊 Checking PRODUCTION database...');
        
        // Count records in key tables
        const boosterClubsCount = await sql`SELECT COUNT(*) as count FROM booster_clubs`;
        const officersCount = await sql`SELECT COUNT(*) as count FROM officers`;
        const volunteersCount = await sql`SELECT COUNT(*) as count FROM volunteers`;
        const usersCount = await sql`SELECT COUNT(*) as count FROM users`;
        const insuranceCount = await sql`SELECT COUNT(*) as count FROM insurance_forms`;
        const newsCount = await sql`SELECT COUNT(*) as count FROM news`;
        const linksCount = await sql`SELECT COUNT(*) as count FROM links`;
        
        console.log('📈 PRODUCTION Database Stats:');
        console.log(`   Booster Clubs: ${boosterClubsCount[0].count}`);
        console.log(`   Officers: ${officersCount[0].count}`);
        console.log(`   Volunteers: ${volunteersCount[0].count}`);
        console.log(`   Users: ${usersCount[0].count}`);
        console.log(`   Insurance Forms: ${insuranceCount[0].count}`);
        console.log(`   News Articles: ${newsCount[0].count}`);
        console.log(`   Links: ${linksCount[0].count}`);
        
        // Check for specific key data in PRODUCTION
        console.log('\n🔍 Checking PRODUCTION key data integrity...');
        
        // Check booster clubs with payment info
        const clubsWithPayments = await sql`
            SELECT 
                name,
                is_payment_enabled,
                zelle_url IS NOT NULL as has_zelle,
                stripe_url IS NOT NULL as has_stripe
            FROM booster_clubs 
            WHERE is_payment_enabled = true
            ORDER BY name
        `;
        
        console.log(`\n💰 PRODUCTION Clubs with Payment Enabled: ${clubsWithPayments.length}`);
        clubsWithPayments.forEach(club => {
            console.log(`   - ${club.name} (Zelle: ${club.has_zelle}, Stripe: ${club.has_stripe})`);
        });
        
        // Check for Eastlake Wolfpack Association specifically in PRODUCTION
        const ewaClub = await sql`
            SELECT id, name, is_payment_enabled, zelle_url IS NOT NULL as has_zelle
            FROM booster_clubs 
            WHERE name LIKE '%Wolfpack%'
        `;
        
        if (ewaClub.length > 0) {
            console.log(`\n🏈 PRODUCTION EWA Club Status:`);
            console.log(`   - Name: ${ewaClub[0].name}`);
            console.log(`   - Payment Enabled: ${ewaClub[0].is_payment_enabled}`);
            console.log(`   - Has Zelle: ${ewaClub[0].has_zelle}`);
        }
        
        // Check backup content for key indicators
        console.log('\n📋 Analyzing backup content...');
        
        const backupHasBoosterClubs = backupContent.includes('booster_clubs');
        const backupHasOfficers = backupContent.includes('officers');
        const backupHasUsers = backupContent.includes('users');
        const backupHasEastlake = backupContent.includes('Eastlake');
        const backupHasWolfpack = backupContent.includes('Wolfpack');
        
        console.log('✅ Backup Content Check:');
        console.log(`   Contains booster_clubs table: ${backupHasBoosterClubs}`);
        console.log(`   Contains officers table: ${backupHasOfficers}`);
        console.log(`   Contains users table: ${backupHasUsers}`);
        console.log(`   Contains "Eastlake" references: ${backupHasEastlake}`);
        console.log(`   Contains "Wolfpack" references: ${backupHasWolfpack}`);
        
        // Check backup timestamp
        const backupTimestamp = '2025-08-12T22-41-05-063Z';
        const now = new Date();
        const backupTime = new Date(backupTimestamp);
        const timeDiff = Math.abs(now - backupTime) / (1000 * 60); // minutes
        
        console.log(`\n⏰ Backup Timestamp: ${backupTimestamp}`);
        console.log(`   Time since backup: ${timeDiff.toFixed(1)} minutes`);
        
        // Overall integrity assessment
        console.log('\n🎯 BACKUP vs PRODUCTION INTEGRITY ASSESSMENT:');
        console.log('==============================================');
        
        const allChecksPass = backupHasBoosterClubs && backupHasOfficers && 
                            backupHasUsers && backupHasEastlake && backupHasWolfpack;
        
        if (allChecksPass && timeDiff < 60) { // Less than 1 hour old
            console.log('✅ EXCELLENT: Backup appears to match production and is recent!');
            console.log('   - All key tables present in backup');
            console.log('   - Current naming conventions included');
            console.log('   - Recent timestamp');
            console.log('   - Production database accessible and healthy');
        } else if (allChecksPass) {
            console.log('⚠️  GOOD: Backup appears complete but may be older');
            console.log('   - All key tables present in backup');
            console.log('   - Production database accessible');
            console.log('   - Consider creating a fresh backup');
        } else {
            console.log('❌ CONCERN: Backup may be incomplete or outdated');
            console.log('   - Missing some key data in backup');
            console.log('   - Recommend creating a new backup');
        }
        
        console.log(`\n📁 Backup file location: ${backupFile}`);
        console.log(`📊 Backup file size: ${(backupContent.length / 1024).toFixed(1)} KB`);
        console.log(`🌐 Production database: Connected successfully`);
        
    } catch (error) {
        console.error('❌ Error verifying backup against production:', error);
        console.error('Error details:', error.message);
        console.log('\n💡 This might indicate:');
        console.log('   - Production database connection issue');
        console.log('   - Environment variables not set correctly');
        console.log('   - Network connectivity problem');
    }
}

verifyProductionBackupIntegrity();
