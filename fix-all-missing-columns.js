require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function fixAllMissingColumns() {
  console.log('🔧 Fixing ALL missing columns and tables...');
  
  try {
    const sql = neon(process.env.DATABASE_URL);
    console.log('✅ Connected to dev database');
    
    // Create missing tables first
    console.log('\n🏗️ Creating missing tables...');
    
    // Create backup_metadata table
    try {
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
    } catch (error) {
      console.log(`   ⚠️ backup_metadata table: ${error.message}`);
    }
    
    // Create backup_status table
    try {
      await sql.unsafe(`
        CREATE TABLE backup_status (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          backup_id UUID,
          status VARCHAR NOT NULL,
          message TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('   ✅ Created backup_status table');
    } catch (error) {
      console.log(`   ⚠️ backup_status table: ${error.message}`);
    }
    
    // Create payment_audit_log table
    try {
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
    } catch (error) {
      console.log(`   ⚠️ payment_audit_log table: ${error.message}`);
    }
    
    // Now add missing columns to existing tables
    console.log('\n🔧 Adding missing columns to existing tables...');
    
    // Add missing columns to users table
    console.log('\n📋 Adding columns to users table...');
    const userColumns = [
      'club_id UUID',
      'secret_question VARCHAR',
      'secret_answer VARCHAR'
    ];
    
    for (const columnDef of userColumns) {
      const columnName = columnDef.split(' ')[0];
      try {
        await sql.unsafe(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ${columnDef}`);
        console.log(`   ✅ Added ${columnName} to users`);
      } catch (error) {
        console.log(`   ⚠️ ${columnName} in users: ${error.message}`);
      }
    }
    
    // Add missing columns to booster_clubs table
    console.log('\n📋 Adding columns to booster_clubs table...');
    const boosterColumns = [
      'zelle_qr_code_path VARCHAR',
      'stripe_donation_link VARCHAR',
      'stripe_membership_link VARCHAR',
      'stripe_fees_link VARCHAR',
      'payment_instructions TEXT',
      'is_payment_enabled BOOLEAN DEFAULT false',
      'last_payment_update_by VARCHAR',
      'last_payment_update_at TIMESTAMP WITH TIME ZONE',
      'zelle_url TEXT',
      'qr_code_settings JSONB DEFAULT \'{"color": {"dark": "#000000", "light": "#FFFFFF"}, "width": 640, "margin": 2, "errorCorrectionLevel": "M"}\'::jsonb',
      'stripe_url VARCHAR',
      'sort_order INTEGER DEFAULT 999'
    ];
    
    for (const columnDef of boosterColumns) {
      const columnName = columnDef.split(' ')[0];
      try {
        await sql.unsafe(`ALTER TABLE booster_clubs ADD COLUMN IF NOT EXISTS ${columnDef}`);
        console.log(`   ✅ Added ${columnName} to booster_clubs`);
      } catch (error) {
        console.log(`   ⚠️ ${columnName} in booster_clubs: ${error.message}`);
      }
    }
    
    // Add missing columns to officers table
    console.log('\n📋 Adding columns to officers table...');
    const officerColumns = [
      'club_id UUID'
    ];
    
    for (const columnDef of officerColumns) {
      const columnName = columnDef.split(' ')[0];
      try {
        await sql.unsafe(`ALTER TABLE officers ADD COLUMN IF NOT EXISTS ${columnDef}`);
        console.log(`   ✅ Added ${columnName} to officers`);
      } catch (error) {
        console.log(`   ⚠️ ${columnName} in officers: ${error.message}`);
      }
    }
    
    // Add missing columns to volunteers table
    console.log('\n📋 Adding columns to volunteers table...');
    const volunteerColumns = [
      'status VARCHAR',
      'notes TEXT',
      'assigned_club_id UUID'
    ];
    
    for (const columnDef of volunteerColumns) {
      const columnName = columnDef.split(' ')[0];
      try {
        await sql.unsafe(`ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS ${columnDef}`);
        console.log(`   ✅ Added ${columnName} to volunteers`);
      } catch (error) {
        console.log(`   ⚠️ ${columnName} in volunteers: ${error.message}`);
      }
    }
    
    // Add missing columns to form_1099 table
    console.log('\n📋 Adding columns to form_1099 table...');
    const form1099Columns = [
      'w9_filename VARCHAR',
      'w9_blob_url VARCHAR',
      'w9_file_size BIGINT',
      'w9_mime_type VARCHAR',
      'booster_club VARCHAR',
      'club_id UUID'
    ];
    
    for (const columnDef of form1099Columns) {
      const columnName = columnDef.split(' ')[0];
      try {
        await sql.unsafe(`ALTER TABLE form_1099 ADD COLUMN IF NOT EXISTS ${columnDef}`);
        console.log(`   ✅ Added ${columnName} to form_1099`);
      } catch (error) {
        console.log(`   ⚠️ ${columnName} in form_1099: ${error.message}`);
      }
    }
    
    // Add missing columns to insurance_forms table
    console.log('\n📋 Adding columns to insurance_forms table...');
    const insuranceColumns = [
      'club_id UUID'
    ];
    
    for (const columnDef of insuranceColumns) {
      const columnName = columnDef.split(' ')[0];
      try {
        await sql.unsafe(`ALTER TABLE insurance_forms ADD COLUMN IF NOT EXISTS ${columnDef}`);
        console.log(`   ✅ Added ${columnName} to insurance_forms`);
      } catch (error) {
        console.log(`   ⚠️ ${columnName} in insurance_forms: ${error.message}`);
      }
    }
    
    // Verify the changes
    console.log('\n📋 Verifying all changes...');
    
    // Test a query with the new columns
    try {
      const testQuery = await sql`
        SELECT name, is_payment_enabled, sort_order, zelle_url
        FROM booster_clubs
        LIMIT 1
      `;
      console.log('   ✅ Query with new booster_clubs columns works!');
      console.log(`   Sample data: ${JSON.stringify(testQuery[0])}`);
    } catch (error) {
      console.log(`   ❌ Query failed: ${error.message}`);
    }
    
    // Check all tables exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    console.log('\n📋 All tables in database:');
    tables.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });
    
    console.log('\n🎉 All missing columns and tables should now be fixed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixAllMissingColumns();
