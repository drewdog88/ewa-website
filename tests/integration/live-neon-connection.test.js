const { neon } = require('@neondatabase/serverless');
const { resolveNeonDatabaseUrl, describeLiveNeon } = require('../helpers/neon-live-db-guard');

describeLiveNeon('Database Connection Tests (live Neon)', () => {
  let sql;

  beforeAll(async () => {
    sql = neon(resolveNeonDatabaseUrl());
  });

  test('should connect to database successfully', async () => {
    expect(sql).toBeDefined();

    const result = await sql`SELECT 1 as test`;
    expect(result[0].test).toBe(1);
  });

  test('should have correct database permissions', async () => {
    const currentUser = await sql`SELECT current_user, current_database()`;
    expect(currentUser[0].current_user).toBeDefined();
    expect(currentUser[0].current_database).toBeDefined();
  });

  test('should be able to query existing data safely', async () => {
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
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    expect(tables.length).toBeGreaterThan(0);
  });
});
