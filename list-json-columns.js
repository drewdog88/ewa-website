const fs = require('fs');
const path = require('path');

function listJsonColumns() {
  console.log('📋 Listing all columns from JSON files...\n');
  
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
      console.log(`⚠️ ${jsonFile} - not found`);
      continue;
    }
    
    try {
      const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      const tableName = jsonFile.replace('.json', '');
      
      if (jsonData.length > 0) {
        const firstRecord = jsonData[0];
        const allColumns = Object.keys(firstRecord);
        
        console.log(`📊 ${tableName.toUpperCase()} (${allColumns.length} columns, ${jsonData.length} records):`);
        allColumns.forEach((col, index) => {
          console.log(`   ${index + 1}. ${col}`);
        });
        console.log('');
      } else {
        console.log(`📊 ${tableName.toUpperCase()}: No data`);
        console.log('');
      }
    } catch (error) {
      console.log(`❌ Error reading ${jsonFile}: ${error.message}`);
      console.log('');
    }
  }
}

listJsonColumns();
