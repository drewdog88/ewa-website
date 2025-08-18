require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

async function buildCompleteSchema() {
  console.log('🔧 Building complete database schema from JSON files...');

  try {
    const sql = neon(process.env.DATABASE_URL);
    console.log('✅ Connected to dev database');

    const jsonDir = path.join(__dirname, 'NeonDBBackup');
    const jsonFiles = fs.readdirSync(jsonDir).filter(file => file.endsWith('.json'));

    console.log(`📋 Found ${jsonFiles.length} JSON files to analyze`);

    // Analyze each JSON file to understand the schema
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
        } else {
          console.log(`⚠️ ${tableName}: Empty JSON file`);
        }
      } catch (error) {
        console.log(`❌ Error reading ${jsonFile}: ${error.message}`);
      }
    }

    // Now create tables based on the analyzed schemas
    console.log('\n🏗️ Creating tables with complete schemas...');

    for (const [tableName, schema] of Object.entries(tableSchemas)) {
      console.log(`\n📋 Creating table: ${tableName}`);
      
      // Generate CREATE TABLE statement based on the schema
      const createTableSQL = generateCreateTableSQL(tableName, schema);
      
      try {
        await sql.unsafe(createTableSQL);
        console.log(`   ✅ Created ${tableName} table`);
      } catch (error) {
        console.log(`   ❌ Failed to create ${tableName}: ${error.message}`);
      }
    }

    // Now restore data from JSON files
    console.log('\n📥 Restoring data from JSON files...');

    for (const [tableName, schema] of Object.entries(tableSchemas)) {
      const jsonPath = path.join(jsonDir, `${tableName}.json`);
      
      try {
        const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        
        if (data.length > 0) {
          console.log(`   📋 Restoring ${data.length} records to ${tableName}...`);
          
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
        console.log(`   ❌ Error processing ${tableName}.json: ${error.message}`);
      }
    }

    // Verify the rebuild
    console.log('\n📋 Verifying database rebuild...');

    for (const tableName of Object.keys(tableSchemas)) {
      try {
        const count = await sql.unsafe(`SELECT COUNT(*) as count FROM "${tableName}"`);
        console.log(`   📊 ${tableName}: ${count[0].count} records`);
      } catch (error) {
        console.log(`   ❌ Error counting ${tableName}: ${error.message}`);
      }
    }

    console.log('\n🎉 Complete database rebuild finished!');
    console.log('\n🔗 You can now:');
    console.log('   - Visit: https://ewa-website-dev.vercel.app');
    console.log('   - Login to admin: https://ewa-website-dev.vercel.app/admin/login.html');
    console.log('   - Use admin credentials: admin/***REMOVED***');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
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
  createSQL += '\n)';
  
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

buildCompleteSchema();
