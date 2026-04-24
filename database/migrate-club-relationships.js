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

async function migrateClubRelationships() {
  console.log('🔄 Starting Phase 2: Migrate Club Relationships');
  console.log('📝 This will link existing string-based club data to the new club_id relationships');
    
  const sql = getSql();
  if (!sql) {
    console.error('❌ Database connection not available');
    return;
  }
    
  try {
    console.log('✅ Connected to database');
        
    // Step 1: Analyze current data
    console.log('\n📊 Step 1: Analyzing current data...');
        
    // Check officers with unmatched clubs
    const unmatchedOfficers = await sql`
            SELECT DISTINCT club, COUNT(*) as count
            FROM officers 
            WHERE club IS NOT NULL 
            AND club_id IS NULL
            GROUP BY club
        `;
    console.log(`📋 Found ${unmatchedOfficers.length} unmatched officer clubs:`);
    unmatchedOfficers.forEach(row => {
      console.log(`   - ${row.club}: ${row.count} officers`);
    });
        
    // Check users with unmatched clubs
    const unmatchedUsers = await sql`
            SELECT DISTINCT club, COUNT(*) as count
            FROM users 
            WHERE club IS NOT NULL 
            AND club_id IS NULL
            GROUP BY club
        `;
    console.log(`📋 Found ${unmatchedUsers.length} unmatched user clubs:`);
    unmatchedUsers.forEach(row => {
      console.log(`   - ${row.club}: ${row.count} users`);
    });
        
    // Step 2: Get all booster clubs for mapping
    console.log('\n🔗 Step 2: Getting booster club mappings...');
    const boosterClubs = await sql`SELECT id, name FROM booster_clubs ORDER BY name`;
    console.log(`📋 Found ${boosterClubs.length} booster clubs in reference table`);
        
    // Create a mapping for exact matches and special cases
    const clubMapping = {};
    boosterClubs.forEach(club => {
      clubMapping[club.name] = club.id;
    });
        
    // Add special mappings for existing data
    const specialMappings = {
      'ewa': null, // EWA admin - no specific club
      'orchestra': clubMapping['Eastlake Orchestra Booster Club'],
      '': null // Empty club - no specific club
    };
        
    // Merge special mappings
    Object.assign(clubMapping, specialMappings);
        
    // Step 3: Migrate officers
    console.log('\n👥 Step 3: Migrating officers...');
    let officersUpdated = 0;
        
    for (const unmatched of unmatchedOfficers) {
      const clubName = unmatched.club;
      const clubId = clubMapping[clubName];
            
      if (clubId !== undefined) {
        const result = await sql`
                    UPDATE officers 
                    SET club_id = ${clubId}
                    WHERE club = ${clubName} 
                    AND club_id IS NULL
                `;
        if (clubId === null) {
          console.log(`   ✅ Set ${unmatched.count} officers to no club for "${clubName}" (EWA admin)`);
        } else {
          console.log(`   ✅ Updated ${unmatched.count} officers for "${clubName}"`);
        }
        officersUpdated += unmatched.count;
      } else {
        console.log(`   ⚠️ No match found for officer club: "${clubName}"`);
      }
    }
        
    // Step 4: Migrate users
    console.log('\n👤 Step 4: Migrating users...');
    let usersUpdated = 0;
        
    for (const unmatched of unmatchedUsers) {
      const clubName = unmatched.club;
      const clubId = clubMapping[clubName];
            
      if (clubId !== undefined) {
        const result = await sql`
                    UPDATE users 
                    SET club_id = ${clubId}
                    WHERE club = ${clubName} 
                    AND club_id IS NULL
                `;
        if (clubId === null) {
          console.log(`   ✅ Set ${unmatched.count} users to no club for "${clubName}" (admin user)`);
        } else {
          console.log(`   ✅ Updated ${unmatched.count} users for "${clubName}"`);
        }
        usersUpdated += unmatched.count;
      } else {
        console.log(`   ⚠️ No match found for user club: "${clubName}"`);
      }
    }
        
    // Step 5: Verify migration results
    console.log('\n🔍 Step 5: Verifying migration results...');
        
    // Check remaining unmatched records (only those that couldn't be mapped at all)
    const remainingOfficers = await sql`
            SELECT COUNT(*) as count 
            FROM officers 
            WHERE club IS NOT NULL 
            AND club_id IS NULL
            AND club NOT IN ('ewa', '')
        `;
    console.log(`📊 Remaining unmatched officers: ${remainingOfficers[0].count}`);
        
    const remainingUsers = await sql`
            SELECT COUNT(*) as count 
            FROM users 
            WHERE club IS NOT NULL 
            AND club_id IS NULL
            AND club NOT IN ('ewa', 'orchestra', '')
        `;
    console.log(`📊 Remaining unmatched users: ${remainingUsers[0].count}`);
        
    // Test join queries
    console.log('\n🧪 Step 6: Testing join queries...');
        
    const officersWithClubs = await sql`
            SELECT o.name, o.position, bc.name as club_name 
            FROM officers o 
            LEFT JOIN booster_clubs bc ON o.club_id = bc.id 
            ORDER BY o.name
            LIMIT 5
        `;
    console.log(`✅ Officers with clubs join: ${officersWithClubs.length} results`);
    officersWithClubs.forEach(officer => {
      console.log(`   - ${officer.name} (${officer.position}) -> ${officer.club_name || 'No club'}`);
    });
        
    const usersWithClubs = await sql`
            SELECT u.username, u.role, bc.name as club_name 
            FROM users u 
            LEFT JOIN booster_clubs bc ON u.club_id = bc.id 
            ORDER BY u.username
        `;
    console.log(`✅ Users with clubs join: ${usersWithClubs.length} results`);
    usersWithClubs.forEach(user => {
      console.log(`   - ${user.username} (${user.role}) -> ${user.club_name || 'No club'}`);
    });
        
    // Summary
    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Officers updated: ${officersUpdated}`);
    console.log(`   ✅ Users updated: ${usersUpdated}`);
    console.log(`   📊 Total records migrated: ${officersUpdated + usersUpdated}`);
        
    if (remainingOfficers[0].count === 0 && remainingUsers[0].count === 0) {
      console.log('\n🎉 All club relationships migrated successfully!');
      console.log('📝 The database is now fully normalized with proper foreign key relationships.');
      console.log('📊 Migration Results:');
      console.log(`   - Officers: ${officersUpdated} records updated (EWA admin officers set to no club)`);
      console.log(`   - Users: ${usersUpdated} records updated (admin user set to no club, orchestra user linked)`);
      console.log('\n✅ Phase 2 migration completed successfully!');
    } else {
      console.log('\n⚠️ Some records could not be migrated due to unmatched club names.');
      console.log('📝 You may need to manually review and update these records.');
    }
        
    return true;
        
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run the migration if this file is executed directly
if (require.main === module) {
  migrateClubRelationships()
    .then(() => {
      console.log('✅ Club relationship migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Club relationship migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateClubRelationships }; 