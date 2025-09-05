require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

describe('Database Connection Tests', () => {
  let sql;

  beforeAll(async () => {
    sql = neon(process.env.DATABASE_URL);
  });

  test('should connect to database successfully', async () => {
    expect(sql).toBeDefined();
    
    // Test basic connection
    const result = await sql`SELECT 1 as test`;
    expect(result[0].test).toBe(1);
  });

  test('should have correct database permissions', async () => {
    // Check current user and database
    const currentUser = await sql`SELECT current_user, current_database()`;
    expect(currentUser[0].current_user).toBeDefined();
    expect(currentUser[0].current_database).toBeDefined();
  });

  test('should be able to query existing data safely', async () => {
    // Just test that we can query existing tables safely - READ ONLY
    const result = await sql`SELECT COUNT(*) as count FROM booster_clubs`;
    expect(parseInt(result[0].count)).toBeGreaterThan(0);
  });

  test('should have booster_clubs table', async () => {
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'booster_clubs'
      )
    `;
    expect(tableExists[0].exists).toBe(true);
  });

  test('should have required booster_clubs columns', async () => {
    const columns = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'booster_clubs'
      ORDER BY ordinal_position
    `;
    
    const columnNames = columns.map(c => c.column_name);
    expect(columnNames).toContain('id');
    expect(columnNames).toContain('name');
    expect(columnNames).toContain('description');
    expect(columnNames).toContain('is_active');
  });

  test('should have proper database permissions', async () => {
    // Just verify we can read from information_schema (safe operation)
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    expect(tables.length).toBeGreaterThan(0);
  });
});
