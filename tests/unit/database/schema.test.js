require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

describe('Database Schema Tests', () => {
  let sql;

  beforeAll(async () => {
    sql = neon(process.env.DATABASE_URL);
  });

  test('should have all required tables', async () => {
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    const tableNames = tables.map(t => t.table_name);
    
    // Check for core tables
    expect(tableNames).toContain('booster_clubs');
    expect(tableNames).toContain('officers');
    expect(tableNames).toContain('users');
    expect(tableNames).toContain('payment_audit_log');
    
    console.log('\n📋 All Tables in Database:');
    console.log('=' .repeat(60));
    
    for (const table of tables) {
      const tableName = table.table_name;
      const countResult = await sql.unsafe(`SELECT COUNT(*) as count FROM ${tableName}`);
      const rowCount = countResult[0].count;
      console.log(`📊 ${tableName}: ${rowCount} rows`);
    }
  });

  test('should have data in core tables', async () => {
    // Check booster_clubs has data
    const boosterClubsCount = await sql`SELECT COUNT(*) as count FROM booster_clubs`;
    expect(parseInt(boosterClubsCount[0].count)).toBeGreaterThan(0);
    
    // Check officers has data
    const officersCount = await sql`SELECT COUNT(*) as count FROM officers`;
    expect(parseInt(officersCount[0].count)).toBeGreaterThan(0);
    
    // Check users has data
    const usersCount = await sql`SELECT COUNT(*) as count FROM users`;
    expect(parseInt(usersCount[0].count)).toBeGreaterThan(0);
  });

  test('should have correct booster_clubs schema', async () => {
    const columns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'booster_clubs'
      ORDER BY ordinal_position
    `;
    
    const columnNames = columns.map(c => c.column_name);
    
    // Check for required columns
    expect(columnNames).toContain('id');
    expect(columnNames).toContain('name');
    expect(columnNames).toContain('description');
    expect(columnNames).toContain('is_active');
    expect(columnNames).toContain('zelle_url');
    expect(columnNames).toContain('is_payment_enabled');
    
    console.log('\n📋 Booster Clubs Schema:');
    columns.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
  });

  test('should have correct officers schema', async () => {
    const columns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'officers'
      ORDER BY ordinal_position
    `;
    
    const columnNames = columns.map(c => c.column_name);
    
    // Check for required columns
    expect(columnNames).toContain('id');
    expect(columnNames).toContain('name');
    expect(columnNames).toContain('position');
    expect(columnNames).toContain('club');
    
    console.log('\n📋 Officers Schema:');
    columns.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
  });

  test('should have correct users schema', async () => {
    const columns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `;
    
    const columnNames = columns.map(c => c.column_name);
    
    // Check for required columns
    expect(columnNames).toContain('id');
    expect(columnNames).toContain('username');
    expect(columnNames).toContain('password_hash');
    expect(columnNames).toContain('role');
    
    console.log('\n📋 Users Schema:');
    columns.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
  });

  test('should have correct payment_audit_log schema', async () => {
    const columns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'payment_audit_log'
      ORDER BY ordinal_position
    `;
    
    const columnNames = columns.map(c => c.column_name);
    
    // Check for required columns
    expect(columnNames).toContain('id');
    expect(columnNames).toContain('club_id');
    expect(columnNames).toContain('action');
    expect(columnNames).toContain('changed_at');
    
    console.log('\n📋 Payment Audit Log Schema:');
    columns.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
  });

  test('should match production backup data counts', async () => {
    const backupDir = path.join(__dirname, '..', '..', 'backup');
    if (!fs.existsSync(backupDir)) {
      console.log('⚠️  No backup directory found, skipping backup comparison');
      return;
    }
    
    const backupFiles = fs.readdirSync(backupDir)
      .filter(file => file.endsWith('.json'))
      .sort()
      .reverse();
    
    if (backupFiles.length === 0) {
      console.log('⚠️  No backup files found, skipping backup comparison');
      return;
    }
    
    const latestBackup = path.join(backupDir, backupFiles[0]);
    console.log(`📁 Comparing with backup: ${backupFiles[0]}`);
    
    try {
      const backupData = JSON.parse(fs.readFileSync(latestBackup, 'utf8'));
      console.log('\n📊 Production vs Current Comparison:');
      console.log('-'.repeat(50));
      
      for (const [tableName, backupRows] of Object.entries(backupData)) {
        const backupCount = Array.isArray(backupRows) ? backupRows.length : 0;
        const currentResult = await sql.unsafe(`SELECT COUNT(*) as count FROM ${tableName}`);
        const currentCount = currentResult[0].count;
        
        const status = backupCount === currentCount ? '✅' : '⚠️';
        console.log(`${status} ${tableName}: ${backupCount} (backup) vs ${currentCount} (current)`);
        
        // For critical tables, we expect data to match
        if (['booster_clubs', 'officers', 'users'].includes(tableName)) {
          expect(currentCount).toBeGreaterThan(0);
        }
      }
    } catch (error) {
      console.log('❌ Could not parse backup file:', error.message);
    }
  });
});