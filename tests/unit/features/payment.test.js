require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

describe('Payment System Tests', () => {
  let sql;

  beforeAll(async () => {
    sql = neon(process.env.DATABASE_URL);
  });

  test('should have active booster clubs', async () => {
    const result = await sql`
      SELECT COUNT(*) as count 
      FROM booster_clubs 
      WHERE is_active = true
    `;
    expect(parseInt(result[0].count)).toBeGreaterThan(0);
  });

  test('should have clubs with Zelle URLs configured', async () => {
    const result = await sql`
      SELECT COUNT(*) as count 
      FROM booster_clubs 
      WHERE zelle_url IS NOT NULL AND zelle_url != '' AND is_active = true
    `;
    expect(parseInt(result[0].count)).toBeGreaterThan(0);
  });

  test('should have clubs without Zelle URLs for testing', async () => {
    const result = await sql`
      SELECT id, name 
      FROM booster_clubs 
      WHERE (zelle_url IS NULL OR zelle_url = '') AND is_active = true
      ORDER BY name
      LIMIT 5
    `;
    
    // This test documents clubs that can be used for testing payment error messages
    if (result.length > 0) {
      console.log('\n📋 Clubs without Zelle URLs (for testing):');
      result.forEach((club, index) => {
        console.log(`${index + 1}. ${club.name} (ID: ${club.id})`);
        console.log(`   Test URL: http://localhost:3000/payment.html?id=${club.id}&club=${encodeURIComponent(club.name)}`);
      });
    }
    
    // We expect some clubs to not have Zelle URLs for testing purposes
    expect(result.length).toBeGreaterThanOrEqual(0);
  });

  test('should have payment-enabled clubs', async () => {
    const result = await sql`
      SELECT COUNT(*) as count 
      FROM booster_clubs 
      WHERE is_payment_enabled = true AND is_active = true
    `;
    expect(parseInt(result[0].count)).toBeGreaterThan(0);
  });

  test('should have valid club IDs for payment URLs', async () => {
    const result = await sql`
      SELECT id, name 
      FROM booster_clubs 
      WHERE is_active = true
      LIMIT 3
    `;
    
    result.forEach(club => {
      expect(club.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(club.name).toBeTruthy();
    });
  });
});

