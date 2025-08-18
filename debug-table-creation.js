require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function debugTableCreation() {
  console.log('🔍 Debugging table creation...');
  
  try {
    const sql = neon(process.env.DATABASE_URL);
    console.log('✅ Connected to dev database');
    
    // Check if the table exists and what columns it has
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'booster_clubs'
      )
    `;
    
    console.log(`Table exists: ${tableExists[0].exists}`);
    
    if (tableExists[0].exists) {
      const columns = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'booster_clubs'
        ORDER BY ordinal_position
      `;
      
      console.log('\n📋 Current columns:');
      columns.forEach((col, index) => {
        console.log(`${index + 1}. ${col.column_name} (${col.data_type}) - Nullable: ${col.is_nullable}`);
      });
      
      // Try to add missing columns one by one
      console.log('\n🔧 Adding missing columns...');
      
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
      console.log('\n📋 Final schema after adding columns:');
      const finalColumns = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'booster_clubs'
        ORDER BY ordinal_position
      `;
      
      finalColumns.forEach((col, index) => {
        console.log(`${index + 1}. ${col.column_name} (${col.data_type}) - Nullable: ${col.is_nullable}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugTableCreation();
