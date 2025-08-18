require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

async function compareProductionData() {
  console.log('🔍 Comparing production JSON with dev database...');
  
  try {
    const sql = neon(process.env.DATABASE_URL);
    console.log('✅ Connected to dev database');
    
    // Load production JSON data
    const productionPath = path.join(__dirname, 'NeonDBBackup', 'booster_clubs.json');
    const productionData = JSON.parse(fs.readFileSync(productionPath, 'utf8'));
    console.log(`📋 Production data: ${productionData.length} clubs`);
    
    // Get dev database data
    const devData = await sql`
      SELECT id, name, description, website_url, donation_url, is_active, 
             created_at, updated_at
      FROM booster_clubs 
      ORDER BY name
    `;
    console.log(`📋 Dev database: ${devData.length} clubs`);
    
    // Compare counts
    console.log('\n📊 Comparison Summary:');
    console.log(`   Production: ${productionData.length} clubs`);
    console.log(`   Dev Database: ${devData.length} clubs`);
    console.log(`   Difference: ${productionData.length - devData.length} clubs`);
    
    // Check for missing clubs in dev database
    const productionNames = productionData.map(club => club.name).sort();
    const devNames = devData.map(club => club.name).sort();
    
    const missingInDev = productionNames.filter(name => !devNames.includes(name));
    const extraInDev = devNames.filter(name => !productionNames.includes(name));
    
    if (missingInDev.length > 0) {
      console.log('\n❌ Clubs missing in dev database:');
      missingInDev.forEach(name => console.log(`   - ${name}`));
    }
    
    if (extraInDev.length > 0) {
      console.log('\n➕ Extra clubs in dev database:');
      extraInDev.forEach(name => console.log(`   - ${name}`));
    }
    
    if (missingInDev.length === 0 && extraInDev.length === 0) {
      console.log('\n✅ All club names match between production and dev!');
    }
    
    // Compare specific fields for matching clubs
    console.log('\n🔍 Comparing field differences for matching clubs:');
    let fieldDifferences = 0;
    
    for (const prodClub of productionData) {
      const devClub = devData.find(dev => dev.name === prodClub.name);
      if (devClub) {
        // Compare key fields
        const fieldsToCompare = ['description', 'website_url', 'donation_url', 'is_active'];
        for (const field of fieldsToCompare) {
          if (prodClub[field] !== devClub[field]) {
            console.log(`   ${prodClub.name} - ${field}:`);
            console.log(`     Production: ${prodClub[field]}`);
            console.log(`     Dev: ${devClub[field]}`);
            fieldDifferences++;
          }
        }
      }
    }
    
    if (fieldDifferences === 0) {
      console.log('   ✅ All compared fields match!');
    }
    
    // Check for missing columns in dev database
    console.log('\n📋 Checking for missing columns in dev database:');
    const devColumns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'booster_clubs' 
      ORDER BY ordinal_position
    `;
    
    const devColumnNames = devColumns.map(col => col.column_name);
    const productionColumns = Object.keys(productionData[0] || {});
    
    const missingColumns = productionColumns.filter(col => !devColumnNames.includes(col));
    const extraColumns = devColumnNames.filter(col => !productionColumns.includes(col));
    
    if (missingColumns.length > 0) {
      console.log('\n❌ Columns missing in dev database:');
      missingColumns.forEach(col => console.log(`   - ${col}`));
    }
    
    if (extraColumns.length > 0) {
      console.log('\n➕ Extra columns in dev database:');
      extraColumns.forEach(col => console.log(`   - ${col}`));
    }
    
    if (missingColumns.length === 0 && extraColumns.length === 0) {
      console.log('   ✅ All columns match!');
    }
    
    // Show sample data comparison
    console.log('\n📋 Sample data comparison (first 3 clubs):');
    for (let i = 0; i < Math.min(3, productionData.length); i++) {
      const prodClub = productionData[i];
      const devClub = devData.find(dev => dev.name === prodClub.name);
      
      console.log(`\n${i + 1}. ${prodClub.name}:`);
      console.log(`   Production website: ${prodClub.website_url}`);
      console.log(`   Dev website: ${devClub ? devClub.website_url : 'NOT FOUND'}`);
      console.log(`   Production description: ${prodClub.description?.substring(0, 50)}...`);
      console.log(`   Dev description: ${devClub ? devClub.description?.substring(0, 50) + '...' : 'NOT FOUND'}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

compareProductionData();
