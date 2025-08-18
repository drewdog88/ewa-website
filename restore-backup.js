require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

async function restoreBackup() {
  console.log('🔄 Restoring backup data to development database...');
  
  try {
    const sql = neon(process.env.DATABASE_URL);
    console.log('✅ Connected to database');
    
    // Read the most recent backup file
    const backupPath = path.join(__dirname, 'backup', 'backups', 'db-backup-2025-08-17T05-24-11-382Z.sql');
    const backup = fs.readFileSync(backupPath, 'utf8');
    console.log('📋 Backup file loaded, length:', backup.length);
    
    // Split backup into individual statements
    const statements = backup.split(';').filter(stmt => stmt.trim().length > 0);
    console.log('📝 Found', statements.length, 'statements to execute');
    
    // Execute each statement individually
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement.length === 0) continue;
      
      try {
        await sql.unsafe(statement);
        successCount++;
        
        // Log progress every 10 statements
        if (successCount % 10 === 0) {
          console.log(`✅ Processed ${successCount} statements...`);
        }
      } catch (error) {
        errorCount++;
        console.log(`❌ Statement ${i + 1} failed:`, error.message);
        
        // Continue with next statement instead of stopping
      }
    }
    
    console.log('\n🎉 Backup restoration completed!');
    console.log(`✅ Successful statements: ${successCount}`);
    console.log(`❌ Failed statements: ${errorCount}`);
    
    // Check what tables we now have
    console.log('\n📋 Checking tables after restoration...');
    const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`;
    console.log('Tables found:', tables.length);
    tables.forEach(table => {
      console.log(`- ${table.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

restoreBackup();
