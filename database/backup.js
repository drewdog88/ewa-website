const { query, getRows } = require('./connection');
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

            // Backup officers
            backup.tables.officers = await getRows('SELECT * FROM officers ORDER BY created_at') || [];

            // Backup users
            backup.tables.users = await getRows('SELECT * FROM users ORDER BY created_at') || [];

            // Backup volunteers
            backup.tables.volunteers = await getRows('SELECT * FROM volunteers ORDER BY created_at') || [];

            // Backup insurance forms
            backup.tables.insurance_forms = await getRows('SELECT * FROM insurance_forms ORDER BY created_at') || [];

            // Backup 1099 forms
            backup.tables.form_1099 = await getRows('SELECT * FROM form_1099 ORDER BY created_at') || [];

            // Backup documents
            backup.tables.documents = await getRows('SELECT * FROM documents ORDER BY created_at') || [];

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

            // Begin transaction
            await query('BEGIN');

            try {
                // Clear existing data (except users to preserve admin access)
                await query('DELETE FROM documents');
                await query('DELETE FROM form_1099');
                await query('DELETE FROM insurance_forms');
                await query('DELETE FROM volunteers');
                await query('DELETE FROM officers');

                // Restore officers
                if (backup.tables.officers) {
                    for (const officer of backup.tables.officers) {
                        await query(
                            'INSERT INTO officers (id, name, position, email, phone, club, club_name, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
                            [officer.id, officer.name, officer.position, officer.email, officer.phone, officer.club, officer.club_name, officer.created_at, officer.updated_at]
                        );
                    }
                    console.log(`✅ Restored ${backup.tables.officers.length} officers`);
                }

                // Restore volunteers
                if (backup.tables.volunteers) {
                    for (const volunteer of backup.tables.volunteers) {
                        await query(
                            'INSERT INTO volunteers (id, name, email, phone, club, club_name, interests, availability, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
                            [volunteer.id, volunteer.name, volunteer.email, volunteer.phone, volunteer.club, volunteer.club_name, volunteer.interests, volunteer.availability, volunteer.created_at, volunteer.updated_at]
                        );
                    }
                    console.log(`✅ Restored ${backup.tables.volunteers.length} volunteers`);
                }

                // Restore insurance forms
                if (backup.tables.insurance_forms) {
                    for (const form of backup.tables.insurance_forms) {
                        await query(
                            'INSERT INTO insurance_forms (id, event_name, event_date, event_description, participant_count, submitted_by, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
                            [form.id, form.event_name, form.event_date, form.event_description, form.participant_count, form.submitted_by, form.status, form.created_at, form.updated_at]
                        );
                    }
                    console.log(`✅ Restored ${backup.tables.insurance_forms.length} insurance forms`);
                }

                // Restore 1099 forms
                if (backup.tables.form_1099) {
                    for (const form of backup.tables.form_1099) {
                        await query(
                            'INSERT INTO form_1099 (id, recipient_name, recipient_tin, amount, description, submitted_by, tax_year, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
                            [form.id, form.recipient_name, form.recipient_tin, form.amount, form.description, form.submitted_by, form.tax_year, form.status, form.created_at, form.updated_at]
                        );
                    }
                    console.log(`✅ Restored ${backup.tables.form_1099.length} 1099 forms`);
                }

                // Restore documents
                if (backup.tables.documents) {
                    for (const doc of backup.tables.documents) {
                        await query(
                            'INSERT INTO documents (id, filename, original_name, blob_url, file_size, mime_type, booster_club, uploaded_by, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
                            [doc.id, doc.filename, doc.original_name, doc.blob_url, doc.file_size, doc.mime_type, doc.booster_club, doc.uploaded_by, doc.created_at]
                        );
                    }
                    console.log(`✅ Restored ${backup.tables.documents.length} documents`);
                }

                // Commit transaction
                await query('COMMIT');
                console.log('✅ Database restore completed successfully');

            } catch (error) {
                // Rollback on error
                await query('ROLLBACK');
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