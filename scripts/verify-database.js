#!/usr/bin/env node

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

console.log('🔍 Verifying Database Connection and Environment...');

async function verifyDatabase() {
    let pool;
    
    try {
        // Check environment variables
        const databaseUrl = process.env.DATABASE_URL;
        if (!databaseUrl) {
            console.log('❌ DATABASE_URL not found in environment');
            process.exit(1);
        }

        console.log('📊 Database URL found');
        
        // Check which database we're connecting to
        if (databaseUrl.includes('ep-jolly-silence-afmn89zf')) {
            console.log('🚨 WARNING: Connecting to PRODUCTION database');
            console.log('⚠️  Database: ep-jolly-silence-afmn89zf (Production)');
            console.log('⚠️  Be extremely careful with any operations');
        } else if (databaseUrl.includes('ep-floral-meadow-ad5lu8xi')) {
            console.log('✅ Connecting to DEVELOPMENT database');
            console.log('📊 Database: ep-floral-meadow-ad5lu8xi (Development)');
            console.log('✅ Safe for testing and development');
        } else {
            console.log('❓ Unknown database environment');
            console.log('📊 URL contains: ' + databaseUrl.split('@')[1]?.split('/')[0] || 'unknown');
        }

        // Test database connection
        console.log('\n🔌 Testing database connection...');
        pool = new Pool({
            connectionString: databaseUrl,
            ssl: { rejectUnauthorized: false }
        });

        const client = await pool.connect();
        
        // Get database information
        const dbInfo = await client.query('SELECT current_database(), current_user, inet_server_addr(), version();');
        const { current_database, current_user, inet_server_addr, version } = dbInfo.rows[0];
        
        console.log('✅ Database connection successful!');
        console.log(`📊 Database Name: ${current_database}`);
        console.log(`👤 User: ${current_user}`);
        console.log(`🌐 Server: ${inet_server_addr}`);
        console.log(`📋 PostgreSQL Version: ${version.split(' ')[0]} ${version.split(' ')[1]}`);

        // Test basic query
        console.log('\n🔍 Testing basic query...');
        const testQuery = await client.query('SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = \'public\';');
        console.log(`✅ Found ${testQuery.rows[0].table_count} tables in public schema`);

        // Check for key tables
        console.log('\n📋 Checking for key tables...');
        const tables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('booster_clubs', 'officers', 'volunteers', 'payments', 'audit_log')
            ORDER BY table_name;
        `);
        
        if (tables.rows.length > 0) {
            console.log('✅ Found key tables:');
            tables.rows.forEach(row => {
                console.log(`   - ${row.table_name}`);
            });
        } else {
            console.log('⚠️  No key tables found - this might be a fresh database');
        }

        client.release();
        console.log('\n✅ Database verification completed successfully!');

    } catch (error) {
        console.error('❌ Database verification failed:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.log('💡 Check if the database server is running and accessible');
        } else if (error.code === 'ENOTFOUND') {
            console.log('💡 Check if the database URL is correct');
        } else if (error.code === '28P01') {
            console.log('💡 Check if the database credentials are correct');
        }
        process.exit(1);
    } finally {
        if (pool) {
            await pool.end();
        }
    }
}

// Run verification
verifyDatabase();
