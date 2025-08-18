require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function forceAddColumns() {
  console.log('🔧 Force adding columns with explicit transaction...');
  
  try {
    const sql = neon(process.env.DATABASE_URL);
    console.log('✅ Connected to dev database');
    
    // First, let's check what columns actually exist
    console.log('\n📋 Current booster_clubs columns:');
    const currentColumns = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'booster_clubs'
      ORDER BY ordinal_position
    `;
    
    currentColumns.forEach((col, index) => {
      console.log(`${index + 1}. ${col.column_name} (${col.data_type})`);
    });
    
    // Try to add columns one by one with explicit error handling
    console.log('\n🔧 Force adding columns to booster_clubs...');
    
    const columnsToAdd = [
      { name: 'zelle_qr_code_path', type: 'VARCHAR' },
      { name: 'stripe_donation_link', type: 'VARCHAR' },
      { name: 'stripe_membership_link', type: 'VARCHAR' },
      { name: 'stripe_fees_link', type: 'VARCHAR' },
      { name: 'payment_instructions', type: 'TEXT' },
      { name: 'is_payment_enabled', type: 'BOOLEAN DEFAULT false' },
      { name: 'last_payment_update_by', type: 'VARCHAR' },
      { name: 'last_payment_update_at', type: 'TIMESTAMP WITH TIME ZONE' },
      { name: 'zelle_url', type: 'TEXT' },
      { name: 'qr_code_settings', type: 'JSONB DEFAULT \'{"color": {"dark": "#000000", "light": "#FFFFFF"}, "width": 640, "margin": 2, "errorCorrectionLevel": "M"}\'::jsonb' },
      { name: 'stripe_url', type: 'VARCHAR' },
      { name: 'sort_order', type: 'INTEGER DEFAULT 999' }
    ];
    
    for (const column of columnsToAdd) {
      try {
        // Check if column exists
        const exists = await sql`
          SELECT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_name = 'booster_clubs' AND column_name = ${column.name}
          )
        `;
        
        if (!exists[0].exists) {
          // Try to add the column
          await sql.unsafe(`ALTER TABLE booster_clubs ADD COLUMN "${column.name}" ${column.type}`);
          console.log(`   ✅ Added ${column.name}`);
          
          // Verify it was added
          const verify = await sql`
            SELECT EXISTS (
              SELECT FROM information_schema.columns
              WHERE table_name = 'booster_clubs' AND column_name = ${column.name}
            )
          `;
          
          if (verify[0].exists) {
            console.log(`   ✅ Verified ${column.name} exists`);
          } else {
            console.log(`   ❌ ${column.name} was not actually added`);
          }
        } else {
          console.log(`   ⚠️ ${column.name} already exists`);
        }
      } catch (error) {
        console.log(`   ❌ Failed to add ${column.name}: ${error.message}`);
      }
    }
    
    // Check final schema
    console.log('\n📋 Final booster_clubs schema:');
    const finalColumns = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'booster_clubs'
      ORDER BY ordinal_position
    `;
    
    finalColumns.forEach((col, index) => {
      console.log(`${index + 1}. ${col.column_name} (${col.data_type})`);
    });
    
    // Try a test query
    console.log('\n🔍 Testing query...');
    try {
      const testQuery = await sql`
        SELECT name, is_payment_enabled, sort_order
        FROM booster_clubs
        LIMIT 1
      `;
      console.log('   ✅ Query works!');
      console.log(`   Sample: ${JSON.stringify(testQuery[0])}`);
    } catch (error) {
      console.log(`   ❌ Query failed: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

forceAddColumns();
