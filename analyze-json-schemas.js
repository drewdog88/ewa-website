require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

function analyzeJsonSchemas() {
  console.log('🔍 Analyzing JSON files to understand complete schema structure...');

  const jsonDir = path.join(__dirname, 'NeonDBBackup');
  const jsonFiles = fs.readdirSync(jsonDir).filter(file => file.endsWith('.json'));

  console.log(`📋 Found ${jsonFiles.length} JSON files to analyze\n`);

  const tableSchemas = {};

  for (const jsonFile of jsonFiles) {
    const tableName = jsonFile.replace('.json', '');
    const jsonPath = path.join(jsonDir, jsonFile);
    
    try {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      
      if (data.length > 0) {
        // Analyze the first record to understand the schema
        const firstRecord = data[0];
        const columns = Object.keys(firstRecord);
        
        tableSchemas[tableName] = {
          columns: columns,
          sampleRecord: firstRecord,
          recordCount: data.length
        };
        
        console.log(`📋 ${tableName}: ${columns.length} columns, ${data.length} records`);
        
        // Show each column with its data type
        columns.forEach((column, index) => {
          const value = firstRecord[column];
          const dataType = inferDataType(value, column);
          console.log(`   ${index + 1}. ${column}: ${dataType} (sample: ${JSON.stringify(value).substring(0, 50)}${JSON.stringify(value).length > 50 ? '...' : ''})`);
        });
        console.log('');
      } else {
        console.log(`⚠️ ${tableName}: Empty JSON file\n`);
      }
    } catch (error) {
      console.log(`❌ Error reading ${jsonFile}: ${error.message}\n`);
    }
  }

  // Generate the complete CREATE TABLE statements
  console.log('🏗️ Complete CREATE TABLE statements:\n');
  
  for (const [tableName, schema] of Object.entries(tableSchemas)) {
    console.log(`-- Table: ${tableName}`);
    const createTableSQL = generateCreateTableSQL(tableName, schema);
    console.log(createTableSQL);
    console.log('');
  }

  return tableSchemas;
}

function generateCreateTableSQL(tableName, schema) {
  const columns = schema.columns;
  const sampleRecord = schema.sampleRecord;
  
  let createSQL = `CREATE TABLE "${tableName}" (\n`;
  
  const columnDefinitions = columns.map(column => {
    const value = sampleRecord[column];
    const dataType = inferDataType(value, column);
    return `  "${column}" ${dataType}`;
  });
  
  createSQL += columnDefinitions.join(',\n');
  createSQL += '\n);';
  
  return createSQL;
}

function inferDataType(value, columnName) {
  if (value === null || value === undefined) {
    return 'TEXT';
  }
  
  if (typeof value === 'boolean') {
    return 'BOOLEAN';
  }
  
  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return 'INTEGER';
    } else {
      return 'DECIMAL(10,2)';
    }
  }
  
  if (typeof value === 'string') {
    // Check for UUID pattern
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
      return 'UUID';
    }
    
    // Check for date/time patterns
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      if (value.includes('T') || value.includes('Z')) {
        return 'TIMESTAMP WITH TIME ZONE';
      } else {
        return 'DATE';
      }
    }
    
    // Check for JSON
    if (value.startsWith('{') || value.startsWith('[')) {
      try {
        JSON.parse(value);
        return 'JSONB';
      } catch (e) {
        // Not valid JSON
      }
    }
    
    // Default to VARCHAR for short strings, TEXT for longer ones
    if (value.length <= 255) {
      return 'VARCHAR(255)';
    } else {
      return 'TEXT';
    }
  }
  
  if (typeof value === 'object') {
    return 'JSONB';
  }
  
  return 'TEXT';
}

analyzeJsonSchemas();
