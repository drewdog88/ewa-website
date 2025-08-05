require('dotenv').config({ path: '.env.local' });
const { getSql } = require('./neon-functions');
const fs = require('fs');
const path = require('path');

// Backup utilities for Neon PostgreSQL database
class DatabaseBackup {
    constructor() {
        this.backupDir = path.join(__dirname, '..', 'backups');
        this.ensureBackupDirectory();
    }

    ensureBackupDirectory() {
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }
    }

    // Create a full database backup
    async createBackup(backupName = null) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const finalBackupName = backupName || `ewa-backup-${timestamp}`;
            const backupPath = path.join(this.backupDir, `${finalBackupName}.json`);

            console.log('🔄 Creating database backup...');

            // Backup all tables
            const backup = {
                timestamp: new Date().toISOString(),
                version: '1.0',
                tables: {}
            };

            const sql = getSql();
            if (!sql) {
                throw new Error('Database connection not available');
            }

            // Backup officers
            backup.tables.officers = await sql`SELECT * FROM officers ORDER BY created_at` || [];

            // Backup users
            backup.tables.users = await sql`SELECT * FROM users ORDER BY created_at` || [];

            // Backup volunteers
            backup.tables.volunteers = await sql`SELECT * FROM volunteers ORDER BY created_at` || [];

            // Backup insurance forms
            backup.tables.insurance_forms = await sql`SELECT * FROM insurance_forms ORDER BY created_at` || [];

            // Backup 1099 forms
            backup.tables.form_1099 = await sql`SELECT * FROM form_1099 ORDER BY created_at` || [];

            // Backup documents
            backup.tables.documents = await sql`SELECT * FROM documents ORDER BY created_at` || [];

            // Write backup to file
            fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
            
            console.log(`✅ Backup created: ${backupPath}`);
            console.log(`📊 Backup contains:`);
            console.log(`   - Officers: ${backup.tables.officers.length}`);
            console.log(`   - Users: ${backup.tables.users.length}`);
            console.log(`   - Volunteers: ${backup.tables.volunteers.length}`);
            console.log(`   - Insurance Forms: ${backup.tables.insurance_forms.length}`);
            console.log(`   - 1099 Forms: ${backup.tables.form_1099.length}`);
            console.log(`   - Documents: ${backup.tables.documents.length}`);

            return backupPath;
        } catch (error) {
            console.error('❌ Error creating backup:', error);
            throw error;
        }
    }

    // Restore database from backup
    async restoreBackup(backupPath) {
        try {
            console.log(`🔄 Restoring database from backup: ${backupPath}`);

            if (!fs.existsSync(backupPath)) {
                throw new Error(`Backup file not found: ${backupPath}`);
            }

            const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
            
            // Validate backup format
            if (!backup.tables || !backup.timestamp) {
                throw new Error('Invalid backup format');
            }

            console.log(`📅 Backup timestamp: ${backup.timestamp}`);

            const sql = getSql();
            if (!sql) {
                throw new Error('Database connection not available');
            }

            // Begin transaction
            await sql`BEGIN`;

            try {
                // Clear existing data (except users to preserve admin access)
                await sql`DELETE FROM documents`;
                await sql`DELETE FROM form_1099`;
                await sql`DELETE FROM insurance_forms`;
                await sql`DELETE FROM volunteers`;
                await sql`DELETE FROM officers`;

                // Restore officers
                if (backup.tables.officers) {
                    for (const officer of backup.tables.officers) {
                        await sql`
                            INSERT INTO officers (id, name, position, email, phone, club, club_name, created_at, updated_at) 
                            VALUES (${officer.id}, ${officer.name}, ${officer.position}, ${officer.email}, ${officer.phone}, ${officer.club}, ${officer.club_name}, ${officer.created_at}, ${officer.updated_at})
                        `;
                    }
                    console.log(`✅ Restored ${backup.tables.officers.length} officers`);
                }

                // Restore volunteers
                if (backup.tables.volunteers) {
                    for (const volunteer of backup.tables.volunteers) {
                        await sql`
                            INSERT INTO volunteers (id, name, email, phone, club, club_name, interests, availability, created_at, updated_at) 
                            VALUES (${volunteer.id}, ${volunteer.name}, ${volunteer.email}, ${volunteer.phone}, ${volunteer.club}, ${volunteer.club_name}, ${volunteer.interests}, ${volunteer.availability}, ${volunteer.created_at}, ${volunteer.updated_at})
                        `;
                    }
                    console.log(`✅ Restored ${backup.tables.volunteers.length} volunteers`);
                }

                // Restore insurance forms
                if (backup.tables.insurance_forms) {
                    for (const form of backup.tables.insurance_forms) {
                        await sql`
                            INSERT INTO insurance_forms (id, event_name, event_date, event_description, participant_count, submitted_by, status, created_at, updated_at) 
                            VALUES (${form.id}, ${form.event_name}, ${form.event_date}, ${form.event_description}, ${form.participant_count}, ${form.submitted_by}, ${form.status}, ${form.created_at}, ${form.updated_at})
                        `;
                    }
                    console.log(`✅ Restored ${backup.tables.insurance_forms.length} insurance forms`);
                }

                // Restore 1099 forms
                if (backup.tables.form_1099) {
                    for (const form of backup.tables.form_1099) {
                        await sql`
                            INSERT INTO form_1099 (id, recipient_name, recipient_tin, amount, description, submitted_by, tax_year, status, created_at, updated_at) 
                            VALUES (${form.id}, ${form.recipient_name}, ${form.recipient_tin}, ${form.amount}, ${form.description}, ${form.submitted_by}, ${form.tax_year}, ${form.status}, ${form.created_at}, ${form.updated_at})
                        `;
                    }
                    console.log(`✅ Restored ${backup.tables.form_1099.length} 1099 forms`);
                }

                // Restore documents
                if (backup.tables.documents) {
                    for (const doc of backup.tables.documents) {
                        await sql`
                            INSERT INTO documents (id, filename, original_name, blob_url, file_size, mime_type, booster_club, uploaded_by, created_at) 
                            VALUES (${doc.id}, ${doc.filename}, ${doc.original_name}, ${doc.blob_url}, ${doc.file_size}, ${doc.mime_type}, ${doc.booster_club}, ${doc.uploaded_by}, ${doc.created_at})
                        `;
                    }
                    console.log(`✅ Restored ${backup.tables.documents.length} documents`);
                }

                // Commit transaction
                await sql`COMMIT`;
                console.log('✅ Database restore completed successfully');

            } catch (error) {
                // Rollback on error
                await sql`ROLLBACK`;
                throw error;
            }

        } catch (error) {
            console.error('❌ Error restoring backup:', error);
            throw error;
        }
    }

    // List available backups
    listBackups() {
        try {
            const files = fs.readdirSync(this.backupDir);
            const backups = files
                .filter(file => file.endsWith('.json'))
                .map(file => {
                    const filePath = path.join(this.backupDir, file);
                    const stats = fs.statSync(filePath);
                    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    return {
                        filename: file,
                        path: filePath,
                        size: stats.size,
                        timestamp: content.timestamp,
                        recordCount: Object.values(content.tables).reduce((sum, table) => sum + table.length, 0)
                    };
                })
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            return backups;
        } catch (error) {
            console.error('❌ Error listing backups:', error);
            return [];
        }
    }

    // Delete a backup file
    deleteBackup(backupPath) {
        try {
            if (fs.existsSync(backupPath)) {
                fs.unlinkSync(backupPath);
                console.log(`✅ Deleted backup: ${backupPath}`);
                return true;
            } else {
                console.log(`⚠️ Backup not found: ${backupPath}`);
                return false;
            }
        } catch (error) {
            console.error('❌ Error deleting backup:', error);
            return false;
        }
    }
}

module.exports = DatabaseBackup;

// Command-line interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0];
    
    const backup = new DatabaseBackup();
    
    async function runCommand() {
        try {
            switch (command) {
                case 'create':
                case 'backup':
                    console.log('🔄 Creating database backup...');
                    const backupPath = await backup.createBackup();
                    console.log(`✅ Backup completed: ${backupPath}`);
                    break;
                    
                case 'list':
                    console.log('📋 Available backups:');
                    const backups = backup.listBackups();
                    if (backups.length === 0) {
                        console.log('   No backups found');
                    } else {
                        backups.forEach(b => {
                            console.log(`   - ${b.filename} (${b.recordCount} records, ${b.size} bytes, ${new Date(b.timestamp).toLocaleString()})`);
                        });
                    }
                    break;
                    
                case 'restore':
                    const backupFile = args[1];
                    if (!backupFile) {
                        console.error('❌ Please specify a backup file to restore from');
                        console.log('Usage: node database/backup.js restore <backup-file.json>');
                        process.exit(1);
                    }
                    
                    const backupPathToRestore = path.join(backup.backupDir, backupFile);
                    console.log(`🔄 Restoring from backup: ${backupFile}`);
                    console.log('⚠️  WARNING: This will overwrite current data!');
                    console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...');
                    
                    // Wait 5 seconds to give user time to cancel
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    
                    await backup.restoreBackup(backupPathToRestore);
                    console.log('✅ Restore completed successfully');
                    break;
                    
                case 'delete':
                    const fileToDelete = args[1];
                    if (!fileToDelete) {
                        console.error('❌ Please specify a backup file to delete');
                        console.log('Usage: node database/backup.js delete <backup-file.json>');
                        process.exit(1);
                    }
                    
                    const deletePath = path.join(backup.backupDir, fileToDelete);
                    const deleted = backup.deleteBackup(deletePath);
                    if (deleted) {
                        console.log('✅ Backup deleted successfully');
                    } else {
                        console.log('❌ Failed to delete backup');
                    }
                    break;
                    
                default:
                    console.log('📚 EWA Database Backup Tool');
                    console.log('');
                    console.log('Usage:');
                    console.log('  node database/backup.js create          - Create a new backup');
                    console.log('  node database/backup.js list            - List available backups');
                    console.log('  node database/backup.js restore <file>  - Restore from backup file');
                    console.log('  node database/backup.js delete <file>   - Delete a backup file');
                    console.log('');
                    console.log('Examples:');
                    console.log('  node database/backup.js create');
                    console.log('  node database/backup.js list');
                    console.log('  node database/backup.js restore ewa-backup-2025-08-05T20-24-39-517Z.json');
                    console.log('  node database/backup.js delete old-backup.json');
                    break;
            }
        } catch (error) {
            console.error('❌ Error:', error.message);
            process.exit(1);
        }
    }
    
    runCommand();
} 