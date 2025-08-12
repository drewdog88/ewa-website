// Load environment variables from .env.local file
require('dotenv').config({ path: '.env.local' });

const { neon } = require('@neondatabase/serverless');

// Database connection configuration
let sql = null;

// Initialize the Neon connection
function getSql() {
  if (!sql) {
    if (!process.env.DATABASE_URL) {
      console.warn('⚠️ DATABASE_URL not found');
      return null;
    }
    sql = neon(process.env.DATABASE_URL);
    console.log('✅ Connected to Neon PostgreSQL database');
  }
  return sql;
}

async function updatePaymentSchemaForDynamic() {
  const sql = getSql();
  if (!sql) {
    throw new Error('Database connection not available');
  }
  
  try {
    console.log('🔄 Starting payment schema update for dynamic QR codes...');
    
    // Begin transaction
    await sql`BEGIN`;
    
    // 1. Add zelle_url column to store the actual Zelle URL
    console.log('Adding zelle_url column to booster_clubs table...');
    await sql`
      ALTER TABLE booster_clubs 
      ADD COLUMN IF NOT EXISTS zelle_url TEXT
    `;
    console.log('✅ Added zelle_url column');
    
    // 2. Add stripe_urls column to store JSON of Stripe URLs
    console.log('Adding stripe_urls column for dynamic Stripe link management...');
    await sql`
      ALTER TABLE booster_clubs 
      ADD COLUMN IF NOT EXISTS stripe_urls JSONB DEFAULT '{}'::jsonb
    `;
    console.log('✅ Added stripe_urls column');
    
    // 3. Add qr_code_settings column for QR code customization
    console.log('Adding qr_code_settings column for QR code customization...');
    await sql`
      ALTER TABLE booster_clubs 
      ADD COLUMN IF NOT EXISTS qr_code_settings JSONB DEFAULT '{"width": 640, "margin": 2, "color": {"dark": "#000000", "light": "#FFFFFF"}, "errorCorrectionLevel": "M"}'::jsonb
    `;
    console.log('✅ Added qr_code_settings column');
    
    // 4. Update existing records to migrate from file paths to URLs
    console.log('Migrating existing QR code data...');
    
    // Get clubs that have zelle_qr_code_path but no zelle_url
    const clubsToMigrate = await sql`
      SELECT id, name, zelle_qr_code_path 
      FROM booster_clubs 
      WHERE zelle_qr_code_path IS NOT NULL 
      AND zelle_url IS NULL
    `;
    
    console.log(`Found ${clubsToMigrate.length} clubs to migrate`);
    
    // For now, we'll set a placeholder URL that can be updated via admin panel
    // In a real scenario, you'd extract the URL from the QR code image or have it stored separately
    for (const club of clubsToMigrate) {
      await sql`
        UPDATE booster_clubs 
        SET zelle_url = 'https://enroll.zellepay.com/qr-codes?data=PLACEHOLDER_' || ${club.id}
        WHERE id = ${club.id}
      `;
      console.log(`✓ Migrated club: ${club.name}`);
    }
    
    // 5. Create index for better performance
    console.log('Creating indexes for better performance...');
    await sql`
      CREATE INDEX IF NOT EXISTS idx_booster_clubs_zelle_url 
      ON booster_clubs(zelle_url) 
      WHERE zelle_url IS NOT NULL
    `;
    console.log('✅ Created zelle_url index');
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_booster_clubs_stripe_urls 
      ON booster_clubs USING GIN(stripe_urls) 
      WHERE stripe_urls IS NOT NULL
    `;
    console.log('✅ Created stripe_urls GIN index');
    
    // Commit transaction
    await sql`COMMIT`;
    
    console.log('🎉 Payment schema updated successfully for dynamic QR codes!');
    
    // Display summary
    const summary = await sql`
      SELECT 
        COUNT(*) as total_clubs,
        COUNT(zelle_url) as clubs_with_zelle_url,
        COUNT(stripe_urls) as clubs_with_stripe_urls,
        COUNT(is_payment_enabled) as clubs_with_payment_enabled
      FROM booster_clubs 
      WHERE is_active = true
    `;
    
    console.log('\n📊 Schema Update Summary:');
    console.log(`Total active clubs: ${summary[0].total_clubs}`);
    console.log(`Clubs with Zelle URLs: ${summary[0].clubs_with_zelle_url}`);
    console.log(`Clubs with Stripe URLs: ${summary[0].clubs_with_stripe_urls}`);
    console.log(`Clubs with payment enabled: ${summary[0].clubs_with_payment_enabled}`);
    
  } catch (error) {
    console.error('❌ Error updating payment schema:', error);
    await sql`ROLLBACK`;
    throw error;
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  updatePaymentSchemaForDynamic()
    .then(() => {
      console.log('Schema update completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Schema update failed:', error);
      process.exit(1);
    });
}

module.exports = { updatePaymentSchemaForDynamic };

