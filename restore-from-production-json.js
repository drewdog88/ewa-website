require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

async function restoreFromProductionJson() {
  console.log('🔧 Restoring dev database from production JSON files...');
  
  try {
    const sql = neon(process.env.DATABASE_URL);
    console.log('✅ Connected to dev database');
    
    // First, drop all existing tables
    console.log('\n🗑️ Dropping existing tables...');
    const tablesToDrop = [
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
    
    for (const tableName of tablesToDrop) {
      try {
        await sql.unsafe(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);
        console.log(`   ✅ Dropped ${tableName}`);
      } catch (error) {
        console.log(`   ⚠️ Could not drop ${tableName}: ${error.message}`);
      }
    }
    
    // Create tables with correct schemas
    console.log('\n🏗️ Creating tables with correct schemas...');
    
    // Create users table
    await sql.unsafe(`
      CREATE TABLE users (
        username VARCHAR PRIMARY KEY,
        password VARCHAR NOT NULL,
        role VARCHAR NOT NULL,
        club VARCHAR,
        club_name VARCHAR,
        is_locked BOOLEAN DEFAULT false,
        is_first_login BOOLEAN,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP WITH TIME ZONE,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        club_id UUID,
        secret_question VARCHAR,
        secret_answer VARCHAR
      )
    `);
    console.log('   ✅ Created users table');
    
    // Create booster_clubs table with all payment columns
    await sql.unsafe(`
      CREATE TABLE booster_clubs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR NOT NULL,
        description TEXT,
        website_url VARCHAR,
        donation_url VARCHAR,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        zelle_qr_code_path VARCHAR,
        stripe_donation_link VARCHAR,
        stripe_membership_link VARCHAR,
        stripe_fees_link VARCHAR,
        payment_instructions TEXT,
        is_payment_enabled BOOLEAN DEFAULT false,
        last_payment_update_by VARCHAR,
        last_payment_update_at TIMESTAMP WITH TIME ZONE,
        zelle_url TEXT,
        qr_code_settings JSONB DEFAULT '{"color": {"dark": "#000000", "light": "#FFFFFF"}, "width": 640, "margin": 2, "errorCorrectionLevel": "M"}'::jsonb,
        stripe_url VARCHAR,
        sort_order INTEGER DEFAULT 999
      )
    `);
    console.log('   ✅ Created booster_clubs table');
    
    // Create other tables
    await sql.unsafe(`
      CREATE TABLE officers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR NOT NULL,
        position VARCHAR NOT NULL,
        club_id UUID NOT NULL,
        email VARCHAR,
        phone VARCHAR,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('   ✅ Created officers table');
    
    await sql.unsafe(`
      CREATE TABLE volunteers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR NOT NULL,
        email VARCHAR NOT NULL,
        phone VARCHAR,
        club_id UUID,
        interests TEXT,
        availability TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('   ✅ Created volunteers table');
    
    await sql.unsafe(`
      CREATE TABLE form_1099 (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        club_id UUID NOT NULL,
        vendor_name VARCHAR NOT NULL,
        vendor_tin VARCHAR,
        vendor_address TEXT,
        amount_paid DECIMAL(10,2),
        payment_date DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('   ✅ Created form_1099 table');
    
    await sql.unsafe(`
      CREATE TABLE insurance_forms (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        club_id UUID NOT NULL,
        form_data JSONB,
        submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('   ✅ Created insurance_forms table');
    
    await sql.unsafe(`
      CREATE TABLE news (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR NOT NULL,
        content TEXT,
        published_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('   ✅ Created news table');
    
    await sql.unsafe(`
      CREATE TABLE links (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR NOT NULL,
        url VARCHAR NOT NULL,
        description TEXT,
        category VARCHAR,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('   ✅ Created links table');
    
    await sql.unsafe(`
      CREATE TABLE backup_metadata (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        backup_name VARCHAR NOT NULL,
        backup_size BIGINT,
        backup_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('   ✅ Created backup_metadata table');
    
    await sql.unsafe(`
      CREATE TABLE backup_status (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        backup_id UUID REFERENCES backup_metadata(id),
        status VARCHAR NOT NULL,
        message TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('   ✅ Created backup_status table');
    
    await sql.unsafe(`
      CREATE TABLE payment_audit_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        club_id UUID NOT NULL,
        action VARCHAR NOT NULL,
        details JSONB,
        performed_by VARCHAR,
        performed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('   ✅ Created payment_audit_log table');
    
    // Now restore data from JSON files
    console.log('\n📥 Restoring data from production JSON files...');
    
    const jsonFiles = [
      'users.json',
      'booster_clubs.json',
      'officers.json',
      'volunteers.json',
      'form_1099.json',
      'insurance_forms.json',
      'news.json',
      'links.json',
      'backup_metadata.json',
      'backup_status.json',
      'payment_audit_log.json'
    ];
    
    for (const jsonFile of jsonFiles) {
      const jsonPath = path.join(__dirname, 'NeonDBBackup', jsonFile);
      if (fs.existsSync(jsonPath)) {
        try {
          const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
          const tableName = jsonFile.replace('.json', '');
          
          if (data.length > 0) {
            console.log(`   📋 Restoring ${data.length} records to ${tableName}...`);
            
            // Insert data based on table structure
            for (const record of data) {
              const columns = Object.keys(record);
              const values = Object.values(record);
              const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
              
              const insertQuery = `
                INSERT INTO "${tableName}" (${columns.map(col => `"${col}"`).join(', ')})
                VALUES (${placeholders})
              `;
              
              try {
                await sql.unsafe(insertQuery, values);
              } catch (error) {
                console.log(`      ⚠️ Failed to insert record in ${tableName}: ${error.message}`);
              }
            }
            
            console.log(`   ✅ Restored ${data.length} records to ${tableName}`);
          }
        } catch (error) {
          console.log(`   ❌ Error processing ${jsonFile}: ${error.message}`);
        }
      } else {
        console.log(`   ⚠️ JSON file not found: ${jsonFile}`);
      }
    }
    
    // Verify the restore
    console.log('\n📋 Verifying restore...');
    
    const userCount = await sql`SELECT COUNT(*) as count FROM users`;
    const clubCount = await sql`SELECT COUNT(*) as count FROM booster_clubs`;
    const adminCount = await sql`SELECT COUNT(*) as count FROM users WHERE role = 'admin'`;
    
    console.log(`   👤 Users: ${userCount[0].count}`);
    console.log(`   🏢 Booster clubs: ${clubCount[0].count}`);
    console.log(`   👑 Admin users: ${adminCount[0].count}`);
    
    console.log('\n🎉 Restore completed!');
    console.log('\n🔗 You can now:');
    console.log('   - Visit: https://ewa-website-dev.vercel.app');
    console.log('   - Login to admin: https://ewa-website-dev.vercel.app/admin/login.html');
    console.log('   - Use admin credentials from production JSON');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

restoreFromProductionJson();
