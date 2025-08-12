require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function addPaymentFields() {
  const client = await pool.connect();
  
  try {
    console.log('Starting payment fields migration...');
    
    // Begin transaction
    await client.query('BEGIN');
    
    // 1. Add payment fields to booster_clubs table
    console.log('Adding payment fields to booster_clubs table...');
    
    const addPaymentFieldsQuery = `
      ALTER TABLE booster_clubs 
      ADD COLUMN IF NOT EXISTS zelle_qr_code_path VARCHAR(500),
      ADD COLUMN IF NOT EXISTS stripe_donation_link VARCHAR(500),
      ADD COLUMN IF NOT EXISTS stripe_membership_link VARCHAR(500),
      ADD COLUMN IF NOT EXISTS stripe_fees_link VARCHAR(500),
      ADD COLUMN IF NOT EXISTS payment_instructions TEXT,
      ADD COLUMN IF NOT EXISTS is_payment_enabled BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS last_payment_update_by VARCHAR(100),
      ADD COLUMN IF NOT EXISTS last_payment_update_at TIMESTAMP WITH TIME ZONE;
    `;
    
    await client.query(addPaymentFieldsQuery);
    console.log('✓ Payment fields added to booster_clubs table');
    
    // 2. Create payment_audit_log table
    console.log('Creating payment_audit_log table...');
    
    const createAuditTableQuery = `
      CREATE TABLE IF NOT EXISTS payment_audit_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        club_id UUID REFERENCES booster_clubs(id) ON DELETE CASCADE,
        action VARCHAR(50) NOT NULL CHECK (action IN ('create', 'update', 'delete')),
        field_name VARCHAR(100),
        old_value TEXT,
        new_value TEXT,
        changed_by VARCHAR(100),
        changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        ip_address INET,
        user_agent TEXT
      );
    `;
    
    await client.query(createAuditTableQuery);
    console.log('✓ payment_audit_log table created');
    
    // 3. Create indexes for performance
    console.log('Creating indexes...');
    
    const createIndexesQuery = `
      -- Index for payment_audit_log queries
      CREATE INDEX IF NOT EXISTS idx_payment_audit_club_created 
      ON payment_audit_log(club_id, changed_at);
      
      CREATE INDEX IF NOT EXISTS idx_payment_audit_created 
      ON payment_audit_log(changed_at);
      
      -- Index for booster_clubs payment queries
      CREATE INDEX IF NOT EXISTS idx_booster_clubs_payment_enabled 
      ON booster_clubs(is_payment_enabled);
    `;
    
    await client.query(createIndexesQuery);
    console.log('✓ Indexes created');
    
    // 4. Create trigger function for automatic audit logging
    console.log('Creating audit trigger function...');
    
    const createTriggerFunctionQuery = `
      CREATE OR REPLACE FUNCTION log_payment_changes()
      RETURNS TRIGGER AS $$
      DECLARE
        old_record JSONB;
        new_record JSONB;
        changed_fields TEXT[];
        field_name TEXT;
      BEGIN
        -- Only log changes to payment-related fields
        IF TG_OP = 'UPDATE' THEN
          old_record := to_jsonb(OLD);
          new_record := to_jsonb(NEW);
          
          -- Check which payment fields changed
          changed_fields := ARRAY[]::TEXT[];
          
          IF OLD.zelle_qr_code_path IS DISTINCT FROM NEW.zelle_qr_code_path THEN
            changed_fields := array_append(changed_fields, 'zelle_qr_code_path');
          END IF;
          
          IF OLD.stripe_donation_link IS DISTINCT FROM NEW.stripe_donation_link THEN
            changed_fields := array_append(changed_fields, 'stripe_donation_link');
          END IF;
          
          IF OLD.stripe_membership_link IS DISTINCT FROM NEW.stripe_membership_link THEN
            changed_fields := array_append(changed_fields, 'stripe_membership_link');
          END IF;
          
          IF OLD.stripe_fees_link IS DISTINCT FROM NEW.stripe_fees_link THEN
            changed_fields := array_append(changed_fields, 'stripe_fees_link');
          END IF;
          
          IF OLD.payment_instructions IS DISTINCT FROM NEW.payment_instructions THEN
            changed_fields := array_append(changed_fields, 'payment_instructions');
          END IF;
          
          IF OLD.is_payment_enabled IS DISTINCT FROM NEW.is_payment_enabled THEN
            changed_fields := array_append(changed_fields, 'is_payment_enabled');
          END IF;
          
          -- Log each changed field
          FOREACH field_name IN ARRAY changed_fields
          LOOP
            INSERT INTO payment_audit_log (
              club_id, 
              action, 
              field_name, 
              old_value, 
              new_value, 
              changed_by, 
              ip_address, 
              user_agent
            ) VALUES (
              NEW.id,
              'update',
              field_name,
              old_record->>field_name,
              new_record->>field_name,
              NEW.last_payment_update_by,
              inet_client_addr(),
              current_setting('application_name', true)
            );
          END LOOP;
          
        ELSIF TG_OP = 'INSERT' THEN
          -- Log initial payment configuration
          INSERT INTO payment_audit_log (
            club_id, 
            action, 
            field_name, 
            old_value, 
            new_value, 
            changed_by, 
            ip_address, 
            user_agent
          ) VALUES (
            NEW.id,
            'create',
            'payment_configuration',
            NULL,
            'Initial payment configuration created',
            NEW.last_payment_update_by,
            inet_client_addr(),
            current_setting('application_name', true)
          );
        END IF;
        
        RETURN COALESCE(NEW, OLD);
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    await client.query(createTriggerFunctionQuery);
    console.log('✓ Audit trigger function created');
    
    // 5. Create trigger on booster_clubs table
    console.log('Creating audit trigger...');
    
    const createTriggerQuery = `
      DROP TRIGGER IF EXISTS trigger_payment_audit ON booster_clubs;
      
      CREATE TRIGGER trigger_payment_audit
        AFTER INSERT OR UPDATE ON booster_clubs
        FOR EACH ROW
        EXECUTE FUNCTION log_payment_changes();
    `;
    
    await client.query(createTriggerQuery);
    console.log('✓ Audit trigger created');
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('✅ Payment fields migration completed successfully!');
    
    // 6. Verify the migration
    console.log('\nVerifying migration...');
    
    const verifyQuery = `
      SELECT 
        column_name, 
        data_type, 
        is_nullable, 
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'booster_clubs' 
      AND column_name IN (
        'zelle_qr_code_path', 
        'stripe_donation_link', 
        'stripe_membership_link', 
        'stripe_fees_link', 
        'payment_instructions', 
        'is_payment_enabled', 
        'last_payment_update_by', 
        'last_payment_update_at'
      )
      ORDER BY column_name;
    `;
    
    const columns = await client.query(verifyQuery);
    console.log('\nPayment fields in booster_clubs table:');
    columns.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Check audit table
    const auditTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'payment_audit_log'
      );
    `;
    
    const auditTableExists = await client.query(auditTableQuery);
    console.log(`\npayment_audit_log table exists: ${auditTableExists.rows[0].exists}`);
    
    // Check trigger
    const triggerQuery = `
      SELECT trigger_name 
      FROM information_schema.triggers 
      WHERE event_object_table = 'booster_clubs' 
      AND trigger_name = 'trigger_payment_audit';
    `;
    
    const trigger = await client.query(triggerQuery);
    console.log(`Audit trigger exists: ${trigger.rows.length > 0}`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  addPaymentFields()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { addPaymentFields };
