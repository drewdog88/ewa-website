require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function debugSchemaIssue() {
  console.log('🔍 Debugging schema creation issue...');
  
  try {
    const sql = neon(process.env.DATABASE_URL);
    console.log('✅ Connected to dev database');
    
    // Check if tables exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    console.log('\n📋 Existing tables:');
    tables.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });
    
    // Check booster_clubs schema specifically
    console.log('\n🔍 Checking booster_clubs schema...');
    const boosterColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'booster_clubs'
      ORDER BY ordinal_position
    `;
    
    console.log('\n📋 booster_clubs columns:');
    boosterColumns.forEach((col, index) => {
      console.log(`${index + 1}. ${col.column_name} (${col.data_type}) - Nullable: ${col.is_nullable}`);
    });
    
    // Try to manually add missing columns to booster_clubs
    console.log('\n🔧 Manually adding missing columns to booster_clubs...');
    
    const missingColumns = [
      'zelle_qr_code_path VARCHAR',
      'stripe_donation_link VARCHAR',
      'stripe_membership_link VARCHAR',
      'stripe_fees_link VARCHAR',
      'payment_instructions TEXT',
      'is_payment_enabled BOOLEAN DEFAULT false',
      'last_payment_update_by VARCHAR',
      'last_payment_update_at TIMESTAMP WITH TIME ZONE',
      'zelle_url TEXT',
      'qr_code_settings JSONB DEFAULT \'{"color": {"dark": "#000000", "light": "#FFFFFF"}, "width": 640, "margin": 2, "errorCorrectionLevel": "M"}\'::jsonb',
      'stripe_url VARCHAR',
      'sort_order INTEGER DEFAULT 999'
    ];
    
    for (const columnDef of missingColumns) {
      const columnName = columnDef.split(' ')[0];
      
      // Check if column already exists
      const columnExists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_name = 'booster_clubs' AND column_name = ${columnName}
        )
      `;
      
      if (!columnExists[0].exists) {
        try {
          await sql.unsafe(`ALTER TABLE booster_clubs ADD COLUMN ${columnDef}`);
          console.log(`   ✅ Added ${columnName}`);
        } catch (error) {
          console.log(`   ❌ Failed to add ${columnName}: ${error.message}`);
        }
      } else {
        console.log(`   ⚠️ ${columnName} already exists`);
      }
    }
    
    // Check final schema
    console.log('\n📋 Final booster_clubs schema:');
    const finalColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'booster_clubs'
      ORDER BY ordinal_position
    `;
    
    finalColumns.forEach((col, index) => {
      console.log(`${index + 1}. ${col.column_name} (${col.data_type}) - Nullable: ${col.is_nullable}`);
    });
    
    // Check if we can query the new columns
    console.log('\n🔍 Testing query with new columns...');
    try {
      const testQuery = await sql`
        SELECT name, is_payment_enabled, sort_order, zelle_url
        FROM booster_clubs
        LIMIT 1
      `;
      console.log('   ✅ Query with new columns works!');
      console.log(`   Sample data: ${JSON.stringify(testQuery[0])}`);
    } catch (error) {
      console.log(`   ❌ Query failed: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugSchemaIssue();
