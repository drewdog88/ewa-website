require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

async function completeDatabaseRebuild() {
  console.log('🔧 Complete Database Rebuild from JSON Files');
  console.log('============================================');

  try {
    const sql = neon(process.env.DATABASE_URL);
    console.log('✅ Connected to dev database');

    const jsonDir = path.join(__dirname, 'NeonDBBackup');
    const jsonFiles = fs.readdirSync(jsonDir).filter(file => file.endsWith('.json'));

    console.log(`📋 Found ${jsonFiles.length} JSON files to process\n`);

    // Step 1: Drop all existing tables
    console.log('🗑️ Step 1: Dropping all existing tables...');
    await dropAllTables(sql);
    console.log('✅ All existing tables dropped\n');

    // Step 2: Create all tables with complete schemas
    console.log('🏗️ Step 2: Creating all tables with complete schemas...');
    await createAllTables(sql, jsonDir, jsonFiles);
    console.log('✅ All tables created\n');

    // Step 3: Restore all data
    console.log('📥 Step 3: Restoring all data from JSON files...');
    await restoreAllData(sql, jsonDir, jsonFiles);
    console.log('✅ All data restored\n');

    // Step 4: Verify the rebuild
    console.log('📋 Step 4: Verifying database rebuild...');
    await verifyRebuild(sql, jsonDir, jsonFiles);
    console.log('✅ Verification complete\n');

    console.log('🎉 Complete database rebuild finished successfully!');
    console.log('\n🔗 You can now:');
    console.log('   - Visit: https://ewa-website-dev.vercel.app');
    console.log('   - Login to admin: https://ewa-website-dev.vercel.app/admin/login.html');
    console.log('   - Use admin credentials: admin/ewa2025');

  } catch (error) {
    console.error('❌ Error during rebuild:', error.message);
    console.error('Stack:', error.stack);
  }
}

async function dropAllTables(sql) {
  // Get all table names
  const tables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
  `;

  for (const table of tables) {
    try {
      await sql.unsafe(`DROP TABLE IF EXISTS "${table.table_name}" CASCADE`);
      console.log(`   🗑️ Dropped table: ${table.table_name}`);
    } catch (error) {
      console.log(`   ⚠️ Failed to drop ${table.table_name}: ${error.message}`);
    }
  }
}

async function createAllTables(sql, jsonDir, jsonFiles) {
  for (const jsonFile of jsonFiles) {
    const tableName = jsonFile.replace('.json', '');
    const jsonPath = path.join(jsonDir, jsonFile);
    
    try {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      
      if (data.length > 0) {
        const firstRecord = data[0];
        const columns = Object.keys(firstRecord);
        
        console.log(`   📋 Creating table: ${tableName} (${columns.length} columns)`);
        
        // Generate CREATE TABLE statement
        const createTableSQL = generateCreateTableSQL(tableName, columns, firstRecord);
        
        try {
          await sql.unsafe(createTableSQL);
          console.log(`   ✅ Created table: ${tableName}`);
        } catch (error) {
          console.log(`   ❌ Failed to create ${tableName}: ${error.message}`);
        }
      } else {
        console.log(`   ⚠️ Skipping empty table: ${tableName}`);
      }
    } catch (error) {
      console.log(`   ❌ Error processing ${jsonFile}: ${error.message}`);
    }
  }
}

async function restoreAllData(sql, jsonDir, jsonFiles) {
  for (const jsonFile of jsonFiles) {
    const tableName = jsonFile.replace('.json', '');
    const jsonPath = path.join(jsonDir, jsonFile);
    
    try {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      
      if (data.length > 0) {
        console.log(`   📋 Restoring ${data.length} records to ${tableName}...`);
        
        let successCount = 0;
        let errorCount = 0;
        
        for (const record of data) {
          try {
            const columns = Object.keys(record);
            const values = Object.values(record);
            const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

            const insertQuery = `
              INSERT INTO "${tableName}" (${columns.map(col => `"${col}"`).join(', ')})
              VALUES (${placeholders})
            `;
            
            await sql.unsafe(insertQuery, values);
            successCount++;
          } catch (error) {
            errorCount++;
            console.log(`      ⚠️ Failed to insert record in ${tableName}: ${error.message}`);
          }
        }
        
        console.log(`   ✅ Restored ${successCount} records to ${tableName} (${errorCount} errors)`);
      }
    } catch (error) {
      console.log(`   ❌ Error processing ${jsonFile}: ${error.message}`);
    }
  }
}

async function verifyRebuild(sql, jsonDir, jsonFiles) {
  for (const jsonFile of jsonFiles) {
    const tableName = jsonFile.replace('.json', '');
    const jsonPath = path.join(jsonDir, jsonFile);
    
    try {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      
      if (data.length > 0) {
        try {
          const count = await sql.unsafe(`SELECT COUNT(*) as count FROM "${tableName}"`);
          const expectedCount = data.length;
          const actualCount = parseInt(count[0].count);
          
          if (actualCount === expectedCount) {
            console.log(`   ✅ ${tableName}: ${actualCount}/${expectedCount} records`);
          } else {
            console.log(`   ⚠️ ${tableName}: ${actualCount}/${expectedCount} records (mismatch)`);
          }
        } catch (error) {
          console.log(`   ❌ Error counting ${tableName}: ${error.message}`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Error processing ${jsonFile}: ${error.message}`);
    }
  }
}

function generateCreateTableSQL(tableName, columns, sampleRecord) {
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

completeDatabaseRebuild();
