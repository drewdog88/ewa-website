const { neon } = require('@neondatabase/serverless');

// Database connection configuration
let sql = null;

// Initialize the Neon connection
function getSql() {
    if (!sql) {
        if (!process.env.DATABASE_URL) {
            console.warn('⚠️ DATABASE_URL not found, using in-memory storage');
            return null;
        }
        sql = neon(process.env.DATABASE_URL);
        console.log('✅ Connected to Neon PostgreSQL database');
    }
    return sql;
}

// Helper function to run queries using Neon template literals
async function query(text, params = []) {
    const sql = getSql();
    if (!sql) {
        throw new Error('Database connection not available');
    }
    
    const start = Date.now();
    try {
        // For Neon serverless, we need to use template literals
        // This is a simplified approach - in practice, we'll use specific functions
        const result = await sql.unsafe(text, params);
        const duration = Date.now() - start;
        console.log(`Executed query: ${text} - Duration: ${duration}ms`);
        return { rows: result };
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}

// Helper function to get a single row
async function getRow(text, params = []) {
    const result = await query(text, params);
    return result.rows[0] || null;
}

// Helper function to get multiple rows
async function getRows(text, params = []) {
    const result = await query(text, params);
    return result.rows;
}

// Initialize database tables
async function initializeDatabase() {
    try {
        const fs = require('fs');
        const path = require('path');
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        await query(schema);
        console.log('✅ Database schema initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing database schema:', error);
        throw error;
    }
}

// Migrate data from JSON files to database
async function migrateDataFromJson() {
    try {
        const fs = require('fs');
        const path = require('path');
        
        // Check if officers table is empty
        const officerCount = await getRow('SELECT COUNT(*) as count FROM officers');
        
        if (officerCount && officerCount.count === '0') {
            // Migrate officers from JSON
            const officersPath = path.join(__dirname, '..', 'data', 'officers.json');
            if (fs.existsSync(officersPath)) {
                const officersData = fs.readFileSync(officersPath, 'utf8');
                const officers = JSON.parse(officersData);
                
                for (const officer of officers) {
                    await query(
                        'INSERT INTO officers (name, position, email, phone, club, club_name) VALUES ($1, $2, $3, $4, $5, $6)',
                        [officer.name, officer.position, officer.email, officer.phone, officer.club, officer.clubName]
                    );
                }
                console.log(`✅ Migrated ${officers.length} officers to database`);
            }
        }
        
        console.log('✅ Data migration completed');
    } catch (error) {
        console.error('❌ Error migrating data:', error);
        throw error;
    }
}

module.exports = {
    getSql,
    query,
    getRow,
    getRows,
    initializeDatabase,
    migrateDataFromJson
}; 