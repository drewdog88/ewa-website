#!/usr/bin/env node

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Migration script to transition from Redis to Neon PostgreSQL using proper Neon syntax
const { neon } = require('@neondatabase/serverless');

async function migrateToNeon() {
    console.log('🚀 Starting migration to Neon PostgreSQL...');
    
    try {
        const sql = neon(process.env.DATABASE_URL);
        console.log('✅ Connected to Neon PostgreSQL database');
        
        // Step 1: Create database schema using proper Neon syntax
        console.log('📋 Creating database schema...');
        
        // Create officers table
        await sql`CREATE TABLE IF NOT EXISTS officers (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            position VARCHAR(255) NOT NULL,
            email VARCHAR(255),
            phone VARCHAR(50),
            club VARCHAR(100) NOT NULL,
            club_name VARCHAR(255) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )`;
        
        // Create users table
        await sql`CREATE TABLE IF NOT EXISTS users (
            username VARCHAR(100) PRIMARY KEY,
            password VARCHAR(255) NOT NULL,
            role VARCHAR(50) NOT NULL DEFAULT 'user',
            club VARCHAR(100),
            club_name VARCHAR(255),
            is_locked BOOLEAN DEFAULT FALSE,
            is_first_login BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP WITH TIME ZONE,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )`;
        
        // Create volunteers table
        await sql`CREATE TABLE IF NOT EXISTS volunteers (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255),
            phone VARCHAR(50),
            club VARCHAR(100) NOT NULL,
            club_name VARCHAR(255) NOT NULL,
            interests TEXT[],
            availability TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )`;
        
        // Create insurance forms table
        await sql`CREATE TABLE IF NOT EXISTS insurance_forms (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            event_name VARCHAR(255) NOT NULL,
            event_date DATE NOT NULL,
            event_description TEXT,
            participant_count INTEGER,
            submitted_by VARCHAR(100) REFERENCES users(username),
            status VARCHAR(50) DEFAULT 'pending',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )`;
        
        // Create 1099 forms table
        await sql`CREATE TABLE IF NOT EXISTS form_1099 (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            recipient_name VARCHAR(255) NOT NULL,
            recipient_tin VARCHAR(20),
            amount DECIMAL(10,2) NOT NULL,
            description TEXT,
            submitted_by VARCHAR(100) REFERENCES users(username),
            tax_year INTEGER NOT NULL,
            status VARCHAR(50) DEFAULT 'pending',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )`;
        
        // Create documents table
        await sql`CREATE TABLE IF NOT EXISTS documents (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            filename VARCHAR(255) NOT NULL,
            original_name VARCHAR(255) NOT NULL,
            blob_url VARCHAR(500) NOT NULL,
            file_size INTEGER,
            mime_type VARCHAR(100),
            booster_club VARCHAR(100) NOT NULL,
            uploaded_by VARCHAR(100) REFERENCES users(username),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )`;
        
        // Create indexes
        await sql`CREATE INDEX IF NOT EXISTS idx_officers_club ON officers(club)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_volunteers_club ON volunteers(club)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_insurance_submitted_by ON insurance_forms(submitted_by)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_1099_submitted_by ON form_1099(submitted_by)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_documents_booster_club ON documents(booster_club)`;
        
        console.log('✅ Database schema created successfully');
        
        // Step 2: Insert default users
        console.log('👥 Creating default users...');
        
        await sql`INSERT INTO users (username, password, role, club, club_name, is_first_login) 
                  VALUES ('admin', 'ewa2025', 'admin', '', '', false)
                  ON CONFLICT (username) DO NOTHING`;
        
        await sql`INSERT INTO users (username, password, role, club, club_name, is_first_login) 
                  VALUES ('orchestra_booster', 'ewa_orchestra_2025', 'booster', 'orchestra', 'Eastlake Orchestra Booster Club', false)
                  ON CONFLICT (username) DO NOTHING`;
        
        console.log('✅ Default users created');
        
        // Step 3: Migrate data from JSON files
        console.log('📦 Migrating data from JSON files...');
        
        const fs = require('fs');
        const path = require('path');
        
        // Check if officers table is empty
        const existingOfficers = await sql`SELECT COUNT(*) as count FROM officers`;
        
        if (existingOfficers[0].count === '0') {
            // Migrate officers from JSON
            const officersPath = path.join(__dirname, '..', 'data', 'officers.json');
            if (fs.existsSync(officersPath)) {
                const officersData = fs.readFileSync(officersPath, 'utf8');
                const officers = JSON.parse(officersData);
                
                for (const officer of officers) {
                    await sql`
                        INSERT INTO officers (name, position, email, phone, club, club_name)
                        VALUES (${officer.name}, ${officer.position}, ${officer.email}, ${officer.phone}, ${officer.club}, ${officer.clubName})
                    `;
                }
                console.log(`✅ Migrated ${officers.length} officers to database`);
            }
        }
        
        console.log('✅ Data migration completed');
        
        // Step 4: Create initial backup
        console.log('💾 Creating initial backup...');
        
        // Get all data for backup
        const backup = {
            timestamp: new Date().toISOString(),
            version: '1.0',
            tables: {}
        };
        
        backup.tables.officers = await sql`SELECT * FROM officers ORDER BY created_at`;
        backup.tables.users = await sql`SELECT * FROM users ORDER BY created_at`;
        backup.tables.volunteers = await sql`SELECT * FROM volunteers ORDER BY created_at`;
        backup.tables.insurance_forms = await sql`SELECT * FROM insurance_forms ORDER BY created_at`;
        backup.tables.form_1099 = await sql`SELECT * FROM form_1099 ORDER BY created_at`;
        backup.tables.documents = await sql`SELECT * FROM documents ORDER BY created_at`;
        
        // Create backups directory if it doesn't exist
        const backupDir = path.join(__dirname, '..', 'backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        
        // Write backup to file
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(backupDir, `ewa-backup-${timestamp}.json`);
        fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
        
        console.log(`✅ Backup created: ${backupPath}`);
        console.log(`📊 Backup contains:`);
        console.log(`   - Officers: ${backup.tables.officers.length}`);
        console.log(`   - Users: ${backup.tables.users.length}`);
        console.log(`   - Volunteers: ${backup.tables.volunteers.length}`);
        console.log(`   - Insurance Forms: ${backup.tables.insurance_forms.length}`);
        console.log(`   - 1099 Forms: ${backup.tables.form_1099.length}`);
        console.log(`   - Documents: ${backup.tables.documents.length}`);
        
        console.log('✅ Migration completed successfully!');
        console.log('');
        console.log('📊 Migration Summary:');
        console.log('   - Database schema created');
        console.log('   - Default users created');
        console.log('   - Data migrated from JSON files');
        console.log('   - Initial backup created');
        console.log('');
        console.log('🔧 Next Steps:');
        console.log('   1. Update your server.js to use the new Neon functions');
        console.log('   2. Test the application functionality');
        console.log('   3. Verify data integrity');
        console.log('   4. Remove Redis dependencies if no longer needed');
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

// Run migration if called directly
if (require.main === module) {
    migrateToNeon();
}

module.exports = { migrateToNeon }; 