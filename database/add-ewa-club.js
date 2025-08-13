require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function addEWAClub() {
  console.log('🔄 Adding Eastlake Wolfpack Association to booster clubs');
  console.log('📝 This will add EWA as a booster club and update EWA admin officers');
    
  const sql = neon(process.env.DATABASE_URL);
    
  try {
    console.log('✅ Connected to database');
        
    // Step 1: Add Eastlake Wolfpack Association to booster_clubs
    console.log('\n📋 Step 1: Adding Eastlake Wolfpack Association to booster clubs...');
        
    const ewaClub = {
              name: 'Eastlake Wolfpack Association',
      description: 'The main Eastlake Wolfpack Association organization that coordinates all booster clubs and activities.',
      website_url: 'https://ewa-website.vercel.app',
      donation_url: 'https://ewa-website.vercel.app/payment.html'
    };
        
    const result = await sql`
            INSERT INTO booster_clubs (name, description, website_url, donation_url)
            VALUES (${ewaClub.name}, ${ewaClub.description}, ${ewaClub.website_url}, ${ewaClub.donation_url})
            ON CONFLICT (name) DO NOTHING
            RETURNING id
        `;
        
    if (result.length > 0) {
              console.log(`   ✅ Added Eastlake Wolfpack Association with ID: ${result[0].id}`);
    } else {
              console.log('   ℹ️ Eastlake Wolfpack Association already exists');
    }
        
    // Step 2: Get the EWA club ID
    const ewaClubData = await sql`
            SELECT id FROM booster_clubs WHERE name = ${ewaClub.name}
        `;
        
    if (ewaClubData.length === 0) {
      throw new Error('Failed to find EWA club after insertion');
    }
        
    const ewaClubId = ewaClubData[0].id;
    console.log(`   📍 EWA Club ID: ${ewaClubId}`);
        
    // Step 3: Update EWA admin officers to be associated with EWA club
    console.log('\n👥 Step 3: Updating EWA admin officers...');
        
    const ewaOfficers = ['Doug Sargent', 'Sara Goldie', 'Baxter Kent', 'Shirley Brill', 'Andrew Brill', 'Todd Johnson'];
        
    for (const officerName of ewaOfficers) {
      const updateResult = await sql`
                UPDATE officers 
                SET club_id = ${ewaClubId}
                WHERE name = ${officerName} 
                AND club = 'ewa'
            `;
              console.log(`   ✅ Updated ${officerName} to be associated with Eastlake Wolfpack Association`);
    }
        
    // Step 4: Update admin user to be associated with EWA club
    console.log('\n👤 Step 4: Updating admin user...');
        
    const adminUpdateResult = await sql`
            UPDATE users 
            SET club_id = ${ewaClubId}
            WHERE username = 'admin' 
            AND club = ''
        `;
            console.log('   ✅ Updated admin user to be associated with Eastlake Wolfpack Association');
        
    // Step 5: Verify the changes
    console.log('\n🔍 Step 5: Verifying changes...');
        
    const officersWithEWA = await sql`
            SELECT o.name, o.position, bc.name as club_name 
            FROM officers o 
            LEFT JOIN booster_clubs bc ON o.club_id = bc.id 
            WHERE bc.name = ${ewaClub.name}
            ORDER BY o.name
        `;
    console.log(`   ✅ Found ${officersWithEWA.length} officers associated with EWA:`);
    officersWithEWA.forEach(officer => {
      console.log(`      - ${officer.name} (${officer.position})`);
    });
        
    const adminWithEWA = await sql`
            SELECT u.username, u.role, bc.name as club_name 
            FROM users u 
            LEFT JOIN booster_clubs bc ON u.club_id = bc.id 
            WHERE u.username = 'admin' AND bc.name = ${ewaClub.name}
        `;
    console.log(`   ✅ Admin user associated with EWA: ${adminWithEWA.length > 0 ? 'YES' : 'NO'}`);
        
    // Step 6: Get updated booster clubs count
    const totalClubs = await sql`SELECT COUNT(*) as count FROM booster_clubs`;
    console.log(`\n📊 Total booster clubs: ${totalClubs[0].count}`);
        
    console.log('\n🎉 Eastlake Wolfpack Association successfully added!');
    console.log('📝 EWA admin officers and admin user are now properly associated with the EWA club.');
    console.log('🌐 Ready to add EWA to the main page for donations.');
        
    return true;
        
  } catch (error) {
    console.error('❌ Failed to add EWA club:', error);
    throw error;
  }
}

// Run the script if this file is executed directly
if (require.main === module) {
  addEWAClub()
    .then(() => {
      console.log('✅ EWA club addition completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ EWA club addition failed:', error);
      process.exit(1);
    });
}

module.exports = { addEWAClub }; 