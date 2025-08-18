require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

async function checkAllTables() {
  console.log('🔍 Checking all tables in dev database vs production JSON...');
  
  try {
    const sql = neon(process.env.DATABASE_URL);
    console.log('✅ Connected to dev database');
    
    // Define the tables to check
    const tablesToCheck = [
      'users',
      'booster_clubs', 
      'officers',
      'volunteers',
      'form_1099',
      'insurance_forms',
      'news',
      'links',
      'backup_metadata',
      'backup_status',
      'payment_audit_log'
    ];
    
    console.log('\n📊 Table Comparison Summary:');
    console.log('=' .repeat(80));
    
    for (const tableName of tablesToCheck) {
      console.log(`\n🔍 Checking ${tableName}...`);
      
      try {
        // Check if table exists in dev database
        const tableExists = await sql`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = ${tableName}
          )
        `;
        
        if (!tableExists[0].exists) {
          console.log(`   ❌ Table ${tableName} does NOT exist in dev database`);
          continue;
        }
        
        // Get row count in dev database - use different approach for each table
        let devRowCount = 0;
        
        if (tableName === 'users') {
          const result = await sql`SELECT COUNT(*) as count FROM users`;
          devRowCount = parseInt(result[0].count);
        } else if (tableName === 'booster_clubs') {
          const result = await sql`SELECT COUNT(*) as count FROM booster_clubs`;
          devRowCount = parseInt(result[0].count);
        } else if (tableName === 'officers') {
          const result = await sql`SELECT COUNT(*) as count FROM officers`;
          devRowCount = parseInt(result[0].count);
        } else if (tableName === 'volunteers') {
          const result = await sql`SELECT COUNT(*) as count FROM volunteers`;
          devRowCount = parseInt(result[0].count);
        } else if (tableName === 'form_1099') {
          const result = await sql`SELECT COUNT(*) as count FROM form_1099`;
          devRowCount = parseInt(result[0].count);
        } else if (tableName === 'insurance_forms') {
          const result = await sql`SELECT COUNT(*) as count FROM insurance_forms`;
          devRowCount = parseInt(result[0].count);
        } else if (tableName === 'news') {
          const result = await sql`SELECT COUNT(*) as count FROM news`;
          devRowCount = parseInt(result[0].count);
        } else if (tableName === 'links') {
          const result = await sql`SELECT COUNT(*) as count FROM links`;
          devRowCount = parseInt(result[0].count);
        }
        
        // Check if JSON file exists
        const jsonPath = path.join(__dirname, 'NeonDBBackup', `${tableName}.json`);
        let productionRowCount = 0;
        let productionData = [];
        
        if (fs.existsSync(jsonPath)) {
          productionData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
          productionRowCount = productionData.length;
        } else {
          console.log(`   ⚠️ No JSON file found for ${tableName}`);
        }
        
        console.log(`   📋 Dev database: ${devRowCount} rows`);
        console.log(`   📋 Production JSON: ${productionRowCount} rows`);
        console.log(`   📊 Difference: ${productionRowCount - devRowCount} rows`);
        
        // Check for specific issues with users table
        if (tableName === 'users') {
          console.log(`   🔍 Checking users table structure...`);
          const userColumns = await sql`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'users'
            ORDER BY ordinal_position
          `;
          
          console.log(`   📋 Users table columns:`);
          userColumns.forEach(col => {
            console.log(`      - ${col.column_name} (${col.data_type})`);
          });
          
          // Check for admin users
          const adminUsers = await sql`
            SELECT username, email, role, created_at
            FROM users
            WHERE role = 'admin'
            ORDER BY created_at DESC
          `;
          
          console.log(`   👤 Admin users found: ${adminUsers.length}`);
          adminUsers.forEach(user => {
            console.log(`      - ${user.username} (${user.email}) - ${user.role}`);
          });
        }
        
        // Check for specific issues with booster_clubs table
        if (tableName === 'booster_clubs') {
          console.log(`   🔍 Checking booster_clubs table structure...`);
          const clubColumns = await sql`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'booster_clubs'
            ORDER BY ordinal_position
          `;
          
          console.log(`   📋 Booster clubs table columns:`);
          clubColumns.forEach(col => {
            console.log(`      - ${col.column_name} (${col.data_type})`);
          });
          
          // Check for clubs with payment info
          const clubsWithPayment = await sql`
            SELECT name, website_url, is_active
            FROM booster_clubs
            WHERE website_url IS NOT NULL AND website_url != ''
            ORDER BY name
            LIMIT 3
          `;
          
          console.log(`   💳 Clubs with website URLs: ${clubsWithPayment.length} (showing first 3)`);
          clubsWithPayment.forEach(club => {
            console.log(`      - ${club.name}: ${club.website_url}`);
          });
        }
        
      } catch (error) {
        console.log(`   ❌ Error checking ${tableName}: ${error.message}`);
      }
    }
    
    // Summary of critical issues
    console.log('\n' + '=' .repeat(80));
    console.log('🚨 CRITICAL ISSUES SUMMARY:');
    console.log('=' .repeat(80));
    
    // Check if users table has admin users
    try {
      const adminCount = await sql`SELECT COUNT(*) as count FROM users WHERE role = 'admin'`;
      if (adminCount[0].count === 0) {
        console.log('❌ NO ADMIN USERS - Cannot log in to admin panel');
      } else {
        console.log(`✅ Admin users found: ${adminCount[0].count}`);
      }
    } catch (error) {
      console.log('❌ Cannot check admin users: ' + error.message);
    }
    
    // Check if booster_clubs has data
    try {
      const clubCount = await sql`SELECT COUNT(*) as count FROM booster_clubs`;
      if (clubCount[0].count === 0) {
        console.log('❌ NO BOOSTER CLUBS - Main page will show no clubs');
      } else {
        console.log(`✅ Booster clubs found: ${clubCount[0].count}`);
      }
    } catch (error) {
      console.log('❌ Cannot check booster clubs: ' + error.message);
    }
    
    // Check for missing payment columns
    try {
      const paymentColumns = await sql`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'booster_clubs' 
        AND column_name IN ('zelle_url', 'stripe_url', 'is_payment_enabled', 'payment_instructions')
      `;
      
      if (paymentColumns.length < 4) {
        console.log('❌ MISSING PAYMENT COLUMNS - Payment features will not work');
        console.log(`   Found: ${paymentColumns.map(c => c.column_name).join(', ')}`);
      } else {
        console.log('✅ Payment columns present');
      }
    } catch (error) {
      console.log('❌ Cannot check payment columns: ' + error.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAllTables();
