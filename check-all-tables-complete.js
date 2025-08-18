require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

async function checkAllTablesComplete() {
  console.log('🔍 Comprehensive check of ALL tables vs production JSON...');
  
  try {
    const sql = neon(process.env.DATABASE_URL);
    console.log('✅ Connected to dev database');
    
    // Define all tables to check
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
    
    console.log('\n📊 COMPREHENSIVE TABLE ANALYSIS:');
    console.log('=' .repeat(100));
    
    let totalMissingColumns = 0;
    let totalMissingTables = 0;
    
    for (const tableName of tablesToCheck) {
      console.log(`\n🔍 Checking ${tableName}...`);
      console.log('-' .repeat(50));
      
      try {
        // Check if table exists
        const tableExists = await sql`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = ${tableName}
          )
        `;
        
        if (!tableExists[0].exists) {
          console.log(`   ❌ Table ${tableName} does NOT exist in dev database`);
          totalMissingTables++;
          continue;
        }
        
        // Get database columns
        const dbColumns = await sql`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = ${tableName}
          ORDER BY ordinal_position
        `;
        
        // Check if JSON file exists
        const jsonPath = path.join(__dirname, 'NeonDBBackup', `${tableName}.json`);
        let jsonColumns = [];
        let jsonData = [];
        
        if (fs.existsSync(jsonPath)) {
          jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
          if (jsonData.length > 0) {
            jsonColumns = Object.keys(jsonData[0]);
          }
        }
        
        // Compare columns
        const dbColumnNames = dbColumns.map(col => col.column_name);
        const missingInDb = jsonColumns.filter(col => !dbColumnNames.includes(col));
        const extraInDb = dbColumnNames.filter(col => !jsonColumns.includes(col));
        
        console.log(`   📋 Database columns: ${dbColumnNames.length}`);
        console.log(`   📋 JSON columns: ${jsonColumns.length}`);
        console.log(`   📊 Records in JSON: ${jsonData.length}`);
        
        if (missingInDb.length > 0) {
          console.log(`   ❌ MISSING ${missingInDb.length} columns in database:`);
          missingInDb.forEach(col => console.log(`      - ${col}`));
          totalMissingColumns += missingInDb.length;
        } else {
          console.log(`   ✅ All JSON columns present in database`);
        }
        
        if (extraInDb.length > 0) {
          console.log(`   ⚠️ Extra columns in database: ${extraInDb.join(', ')}`);
        }
        
        // Show detailed column comparison for tables with issues
        if (missingInDb.length > 0) {
          console.log(`\n   📋 Database schema for ${tableName}:`);
          dbColumns.forEach((col, index) => {
            console.log(`      ${index + 1}. ${col.column_name} (${col.data_type})`);
          });
          
          console.log(`\n   📋 JSON schema for ${tableName}:`);
          jsonColumns.forEach((col, index) => {
            console.log(`      ${index + 1}. ${col}`);
          });
        }
        
      } catch (error) {
        console.log(`   ❌ Error checking ${tableName}: ${error.message}`);
      }
    }
    
    // Summary
    console.log('\n' + '=' .repeat(100));
    console.log('🚨 COMPREHENSIVE ANALYSIS SUMMARY:');
    console.log('=' .repeat(100));
    console.log(`❌ Missing tables: ${totalMissingTables}`);
    console.log(`❌ Missing columns across all tables: ${totalMissingColumns}`);
    
    if (totalMissingColumns > 0 || totalMissingTables > 0) {
      console.log('\n🔧 RECOMMENDED ACTION:');
      console.log('   Run the complete restore script to fix ALL tables and columns');
      console.log('   This will ensure the dev database matches production exactly');
    } else {
      console.log('\n✅ All tables and columns match production!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAllTablesComplete();
