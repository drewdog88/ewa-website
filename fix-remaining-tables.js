require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

async function fixRemainingTables() {
  console.log('🔧 Fixing remaining tables...');
  
  try {
    const sql = neon(process.env.DATABASE_URL);
    console.log('✅ Connected to neon-ewadev database');
    
    // Fix volunteers table - check the JSON structure
    console.log('📁 Checking volunteers table...');
    const volunteersPath = path.join(__dirname, 'NeonDBBackup', 'volunteers.json');
    if (fs.existsSync(volunteersPath)) {
      const volunteersData = JSON.parse(fs.readFileSync(volunteersPath, 'utf8'));
      console.log('Volunteers data structure:', Object.keys(volunteersData[0] || {}));
      
      // Try to load volunteers with proper error handling
      for (const record of volunteersData) {
        try {
          const columns = Object.keys(record);
          const values = Object.values(record);
          const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
          
          const insertSQL = `INSERT INTO volunteers (${columns.join(', ')}) VALUES (${placeholders})`;
          await sql.query(insertSQL, values);
        } catch (error) {
          console.log(`❌ Error inserting volunteer record: ${error.message}`);
          console.log('Record:', record);
        }
      }
    }
    
    // Fix backup_metadata table
    console.log('📁 Checking backup_metadata table...');
    const backupMetadataPath = path.join(__dirname, 'NeonDBBackup', 'backup_metadata.json');
    if (fs.existsSync(backupMetadataPath)) {
      const backupMetadataData = JSON.parse(fs.readFileSync(backupMetadataPath, 'utf8'));
      console.log('Backup metadata structure:', Object.keys(backupMetadataData[0] || {}));
      
      for (const record of backupMetadataData) {
        try {
          const columns = Object.keys(record);
          const values = Object.values(record);
          const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
          
          const insertSQL = `INSERT INTO backup_metadata (${columns.join(', ')}) VALUES (${placeholders})`;
          await sql.query(insertSQL, values);
        } catch (error) {
          console.log(`❌ Error inserting backup_metadata record: ${error.message}`);
        }
      }
    }
    
    // Fix payment_audit_log table
    console.log('📁 Checking payment_audit_log table...');
    const paymentAuditPath = path.join(__dirname, 'NeonDBBackup', 'payment_audit_log.json');
    if (fs.existsSync(paymentAuditPath)) {
      const paymentAuditData = JSON.parse(fs.readFileSync(paymentAuditPath, 'utf8'));
      console.log('Payment audit log structure:', Object.keys(paymentAuditData[0] || {}));
      
      for (const record of paymentAuditData) {
        try {
          const columns = Object.keys(record);
          const values = Object.values(record);
          const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
          
          const insertSQL = `INSERT INTO payment_audit_log (${columns.join(', ')}) VALUES (${placeholders})`;
          await sql.query(insertSQL, values);
        } catch (error) {
          console.log(`❌ Error inserting payment_audit_log record: ${error.message}`);
        }
      }
    }
    
    console.log('🎉 Fixed remaining tables!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixRemainingTables();
