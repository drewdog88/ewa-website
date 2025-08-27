require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

async function restoreDatabaseFromJson() {
  console.log('🔄 Restoring database from JSON files...');
  
  try {
    const sql = neon(process.env.DATABASE_URL);
    console.log('✅ Connected to neon-ewadev database');
    
    // Enable UUID extension
    await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
    
    // First, analyze all JSON files to get exact schema
    const tableSchemas = await analyzeJsonFiles();
    
    // Create tables with exact structure from JSON
    await createTablesFromSchema(sql, tableSchemas);
    
    // Load data from JSON files
    await loadData(sql);
    
    console.log('🎉 Database restored successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function analyzeJsonFiles() {
  console.log('🔍 Analyzing JSON files to determine exact schema...');
  
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
  
  const tableSchemas = {};
  
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
        // Get ALL columns from the first record
        const firstRecord = jsonData[0];
        const allColumns = Object.keys(firstRecord);
        
        console.log(`📋 ${tableName}: ${allColumns.length} columns - ${allColumns.join(', ')}`);
        
        tableSchemas[tableName] = {
          columns: allColumns,
          sampleRecord: firstRecord,
          recordCount: jsonData.length
        };
      }
    } catch (error) {
      console.log(`❌ Error analyzing ${jsonFile}: ${error.message}`);
    }
  }
  
  return tableSchemas;
}

async function createTablesFromSchema(sql, tableSchemas) {
  console.log('🔨 Creating tables with exact schema from JSON...');
  
  // Drop all existing tables first
  for (const tableName of Object.keys(tableSchemas)) {
    await sql`DROP TABLE IF EXISTS ${sql(tableName)} CASCADE`;
  }
  
  // Create each table with exact columns from JSON
  for (const [tableName, schema] of Object.entries(tableSchemas)) {
    console.log(`🏗️ Creating table ${tableName}...`);
    
    const columnDefinitions = [];
    
    for (const column of schema.columns) {
      const value = schema.sampleRecord[column];
      const columnType = inferColumnType(value, column);
      columnDefinitions.push(`${column} ${columnType}`);
    }
    
    const createTableSQL = `CREATE TABLE ${tableName} (${columnDefinitions.join(', ')})`;
    console.log(`📝 SQL: ${createTableSQL}`);
    
    await sql.query(createTableSQL);
    console.log(`✅ Table ${tableName} created with ${schema.columns.length} columns`);
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

async function loadData(sql) {
  console.log('📥 Loading data from JSON files...');
  
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
        
        console.log(`✅ ${tableName} loaded`);
      }
    } catch (error) {
      console.log(`❌ Error loading ${jsonFile}: ${error.message}`);
    }
  }
}

restoreDatabaseFromJson();
