require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function fixStripeUrls() {
  console.log('🔧 Fixing Stripe URLs to be consistent with other URL fields\n');

  try {
    const sql = neon(process.env.DATABASE_URL);

    // First, let's see what the current structure looks like
    console.log('📊 Current stripe_urls data:');
    const currentData = await sql`
      SELECT id, name, stripe_urls 
      FROM booster_clubs 
      WHERE stripe_urls IS NOT NULL 
      AND stripe_urls != '{}'
      AND stripe_urls != 'null'
    `;
    
    console.log(JSON.stringify(currentData, null, 2));

    // Add a new column for the simple string URL
    console.log('\n🔧 Adding new stripe_url column...');
    await sql`
      ALTER TABLE booster_clubs 
      ADD COLUMN stripe_url TEXT
    `;

    // Convert existing JSON data to simple string (take the first URL if multiple)
    console.log('\n🔄 Converting existing JSON data to simple strings...');
    const updateResult = await sql`
      UPDATE booster_clubs 
      SET stripe_url = CASE 
        WHEN stripe_urls IS NOT NULL 
        AND stripe_urls != '{}' 
        AND stripe_urls != 'null'
        THEN (
          SELECT value::text 
          FROM jsonb_each_text(stripe_urls::jsonb) 
          LIMIT 1
        )
        ELSE NULL
      END
      WHERE stripe_urls IS NOT NULL 
      AND stripe_urls != '{}'
      AND stripe_urls != 'null'
    `;

    console.log('✅ Updated', updateResult.count, 'records');

    // Drop the old JSON column
    console.log('\n🗑️ Dropping old stripe_urls JSON column...');
    await sql`
      ALTER TABLE booster_clubs 
      DROP COLUMN stripe_urls
    `;

    // Rename the new column to the original name
    console.log('\n🔄 Renaming stripe_url to stripe_urls...');
    await sql`
      ALTER TABLE booster_clubs 
      RENAME COLUMN stripe_url TO stripe_urls
    `;

    // Verify the changes
    console.log('\n✅ Verification - new stripe_urls data:');
    const newData = await sql`
      SELECT id, name, stripe_urls 
      FROM booster_clubs 
      WHERE stripe_urls IS NOT NULL 
      AND stripe_urls != ''
    `;
    
    console.log(JSON.stringify(newData, null, 2));

    console.log('\n🎉 Migration completed successfully!');
    console.log('📝 stripe_urls is now a simple TEXT field like other URL fields');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

fixStripeUrls().catch(console.error);
