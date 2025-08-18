require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function addMissingColumns() {
  console.log('🔧 Adding missing columns to booster_clubs table...');
  
  try {
    const sql = neon(process.env.DATABASE_URL);
    console.log('✅ Connected to database');
    
    // Check current table structure
    console.log('\n📋 Current table structure:');
    const currentColumns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'booster_clubs' 
      ORDER BY ordinal_position
    `;
    
    currentColumns.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });
    
    // Add missing columns one by one
    const missingColumns = [
      {
        name: 'zelle_qr_code_path',
        type: 'character varying'
      },
      {
        name: 'stripe_donation_link',
        type: 'character varying'
      },
      {
        name: 'stripe_membership_link',
        type: 'character varying'
      },
      {
        name: 'stripe_fees_link',
        type: 'character varying'
      },
      {
        name: 'payment_instructions',
        type: 'text'
      },
      {
        name: 'is_payment_enabled',
        type: 'boolean DEFAULT false'
      },
      {
        name: 'last_payment_update_by',
        type: 'character varying'
      },
      {
        name: 'last_payment_update_at',
        type: 'timestamp with time zone'
      },
      {
        name: 'zelle_url',
        type: 'text'
      },
      {
        name: 'qr_code_settings',
        type: 'jsonb DEFAULT \'{"color": {"dark": "#000000", "light": "#FFFFFF"}, "width": 640, "margin": 2, "errorCorrectionLevel": "M"}\'::jsonb'
      },
      {
        name: 'stripe_url',
        type: 'character varying'
      },
      {
        name: 'sort_order',
        type: 'integer DEFAULT 999'
      }
    ];
    
    console.log('\n🔧 Adding missing columns...');
    for (const column of missingColumns) {
      try {
        // Check if column already exists
        const exists = await sql`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'booster_clubs' AND column_name = ${column.name}
        `;
        
        if (exists.length === 0) {
          await sql.unsafe(`ALTER TABLE booster_clubs ADD COLUMN "${column.name}" ${column.type}`);
          console.log(`✅ Added column: ${column.name}`);
        } else {
          console.log(`⚠️ Column already exists: ${column.name}`);
        }
      } catch (error) {
        console.log(`❌ Failed to add column ${column.name}:`, error.message);
      }
    }
    
    // Verify final table structure
    console.log('\n📋 Final table structure:');
    const finalColumns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'booster_clubs' 
      ORDER BY ordinal_position
    `;
    
    finalColumns.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });
    
    // Check club count
    const clubCount = await sql`SELECT COUNT(*) as count FROM booster_clubs`;
    console.log(`\n📊 Total clubs: ${clubCount[0].count}`);
    
    // Test query with all columns
    console.log('\n🧪 Testing query with all columns...');
    const testClubs = await sql`
      SELECT name, website_url, is_payment_enabled, sort_order 
      FROM booster_clubs 
      ORDER BY sort_order, name 
      LIMIT 3
    `;
    
    console.log('\n📋 Sample clubs:');
    testClubs.forEach((club, index) => {
      console.log(`${index + 1}. ${club.name}`);
      console.log(`   Website: ${club.website_url || 'NULL'}`);
      console.log(`   Payment Enabled: ${club.is_payment_enabled}`);
      console.log(`   Sort Order: ${club.sort_order}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

addMissingColumns();
