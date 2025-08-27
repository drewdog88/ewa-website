const fs = require('fs');
const path = require('path');

function showJsonSchema() {
  console.log('📋 Showing schema for each table from JSON files...\n');
  
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
        
        console.log(`📊 ${tableName.toUpperCase()} SCHEMA:`);
        console.log('=' .repeat(60));
        
        allColumns.forEach((col, index) => {
          const value = firstRecord[col];
          const dataType = inferColumnType(value, col);
          const sampleValue = value === null ? 'NULL' : 
                             typeof value === 'string' && value.length > 50 ? 
                             `"${value.substring(0, 50)}..."` : 
                             JSON.stringify(value);
          
          console.log(`${(index + 1).toString().padStart(2)}. ${col.padEnd(25)} ${dataType.padEnd(20)} Sample: ${sampleValue}`);
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

function inferColumnType(value, columnName) {
  if (value === null) {
    return 'TEXT';
  }
  
  if (typeof value === 'string') {
    // Check for UUID pattern
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
      return 'UUID';
    }
    
    // Check for timestamp pattern
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(value)) {
      return 'TIMESTAMP WITH TIME ZONE';
    }
    
    // Check for date pattern
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return 'DATE';
    }
    
    // Check for boolean string
    if (value === 'true' || value === 'false') {
      return 'BOOLEAN';
    }
    
    // Check for numeric string
    if (!isNaN(value) && value !== '') {
      return 'NUMERIC';
    }
    
    // Long text fields
    if (columnName.includes('description') || columnName.includes('content') || columnName.includes('instructions')) {
      return 'TEXT';
    }
    
    // Default to VARCHAR for short strings
    return 'VARCHAR(500)';
  }
  
  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return 'INTEGER';
    }
    return 'NUMERIC';
  }
  
  if (typeof value === 'boolean') {
    return 'BOOLEAN';
  }
  
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return 'TEXT[]';
    }
    return 'JSONB';
  }
  
  return 'TEXT';
}

showJsonSchema();
