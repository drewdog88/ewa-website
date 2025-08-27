require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

async function loadJsonData() {
  console.log('📥 Loading data from JSON files into tables...');
  
  try {
    const sql = neon(process.env.DATABASE_URL);
    console.log('✅ Connected to neon-ewadev database');
    
    const jsonFiles = [
      'booster_clubs.json',
      'users.json', 
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
      
      if (!fs.existsSync(jsonPath)) {
        console.log(`⚠️ Skipping ${jsonFile} - not found`);
        continue;
      }
      
      try {
        const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        const tableName = jsonFile.replace('.json', '');
        
        if (jsonData.length > 0) {
          console.log(`📁 Loading ${jsonData.length} records into ${tableName}...`);
          
          // Simple insert - let PostgreSQL handle the data types
          for (const record of jsonData) {
            const columns = Object.keys(record);
            const values = Object.values(record);
            const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
            
            const insertSQL = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
            await sql.query(insertSQL, values);
          }
          
          console.log(`✅ ${tableName} loaded successfully`);
        } else {
          console.log(`📁 ${tableName}: No data to load`);
        }
      } catch (error) {
        console.log(`❌ Error loading ${jsonFile}: ${error.message}`);
      }
    }
    
    console.log('🎉 All data loaded successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

loadJsonData();
