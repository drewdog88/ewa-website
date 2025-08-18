require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

async function properRestore() {
  console.log('🔧 Performing proper database restore...');
  
  try {
    const sql = neon(process.env.DATABASE_URL);
    console.log('✅ Connected to database');
    
    // Read the backup file
    const backupPath = path.join(__dirname, 'backup', 'backups', 'db-backup-2025-08-17T05-24-11-382Z.sql');
    const backup = fs.readFileSync(backupPath, 'utf8');
    console.log('📋 Backup file loaded, length:', backup.length);
    
    // First, drop all existing tables
    console.log('🗑️ Dropping existing tables...');
    const dropTables = [
      'DROP TABLE IF EXISTS backup_metadata CASCADE',
      'DROP TABLE IF EXISTS backup_status CASCADE', 
      'DROP TABLE IF EXISTS booster_clubs CASCADE',
      'DROP TABLE IF EXISTS documents CASCADE',
      'DROP TABLE IF EXISTS form_1099 CASCADE',
      'DROP TABLE IF EXISTS insurance_forms CASCADE',
      'DROP TABLE IF EXISTS link_clicks CASCADE',
      'DROP TABLE IF EXISTS links CASCADE',
      'DROP TABLE IF EXISTS news CASCADE',
      'DROP TABLE IF EXISTS officers CASCADE',
      'DROP TABLE IF EXISTS page_views CASCADE',
      'DROP TABLE IF EXISTS users CASCADE',
      'DROP TABLE IF EXISTS volunteers CASCADE'
    ];
    
    for (const dropStatement of dropTables) {
      try {
        await sql.unsafe(dropStatement);
        console.log(`✅ Dropped table: ${dropStatement.split(' ')[4]}`);
      } catch (error) {
        console.log(`⚠️ Could not drop table: ${error.message}`);
      }
    }
    
    // Manually create the booster_clubs table with all columns
    console.log('🏗️ Creating booster_clubs table with complete schema...');
    const createBoosterClubsTable = `
      CREATE TABLE "booster_clubs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "description" text,
        "website_url" character varying,
        "donation_url" character varying,
        "is_active" boolean DEFAULT true,
        "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
        "zelle_qr_code_path" character varying,
        "stripe_donation_link" character varying,
        "stripe_membership_link" character varying,
        "stripe_fees_link" character varying,
        "payment_instructions" text,
        "is_payment_enabled" boolean DEFAULT false,
        "last_payment_update_by" character varying,
        "last_payment_update_at" timestamp with time zone,
        "zelle_url" text,
        "qr_code_settings" jsonb DEFAULT '{"color": {"dark": "#000000", "light": "#FFFFFF"}, "width": 640, "margin": 2, "errorCorrectionLevel": "M"}'::jsonb,
        "stripe_url" character varying,
        "sort_order" integer DEFAULT 999
      );
    `;
    
    try {
      await sql.unsafe(createBoosterClubsTable);
      console.log('✅ Created booster_clubs table with complete schema');
    } catch (error) {
      console.error('❌ Error creating booster_clubs table:', error.message);
      return;
    }
    
    // Verify the table structure
    console.log('\n📋 Verifying booster_clubs table structure...');
    const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'booster_clubs' 
      ORDER BY ordinal_position
    `;
    
    console.log('Columns in booster_clubs table:');
    columns.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });
    
    // Now extract and insert the booster_clubs data from the backup
    console.log('\n📥 Inserting booster_clubs data...');
    
    // Extract the INSERT statements for booster_clubs
    const insertMatches = backup.match(/INSERT INTO "booster_clubs"[^;]+;/g);
    if (insertMatches) {
      console.log(`Found ${insertMatches.length} INSERT statements for booster_clubs`);
      
      let successCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < insertMatches.length; i++) {
        const insertStatement = insertMatches[i];
        try {
          await sql.unsafe(insertStatement);
          successCount++;
          if (successCount % 5 === 0) {
            console.log(`✅ Inserted ${successCount} clubs...`);
          }
        } catch (error) {
          errorCount++;
          console.log(`❌ Failed to insert club ${i + 1}:`, error.message);
        }
      }
      
      console.log(`\n📊 Insert results: ${successCount} successful, ${errorCount} failed`);
    } else {
      console.log('❌ No INSERT statements found for booster_clubs');
    }
    
    // Verify the data
    console.log('\n📋 Verifying booster_clubs data...');
    const clubCount = await sql`SELECT COUNT(*) as count FROM booster_clubs`;
    console.log(`Total clubs: ${clubCount[0].count}`);
    
    const sampleClubs = await sql`
      SELECT name, website_url, is_payment_enabled, sort_order 
      FROM booster_clubs 
      ORDER BY sort_order, name 
      LIMIT 3
    `;
    
    console.log('\n📋 Sample clubs:');
    sampleClubs.forEach((club, index) => {
      console.log(`${index + 1}. ${club.name}`);
      console.log(`   Website: ${club.website_url || 'NULL'}`);
      console.log(`   Payment Enabled: ${club.is_payment_enabled}`);
      console.log(`   Sort Order: ${club.sort_order}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

properRestore();
