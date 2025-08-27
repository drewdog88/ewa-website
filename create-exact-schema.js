require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function createExactSchema() {
  console.log('🔄 Creating tables with exact schema...');
  
  try {
    const sql = neon(process.env.DATABASE_URL);
    console.log('✅ Connected to neon-ewadev database');
    
    // Enable UUID extension
    await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
    
    // Drop existing tables
    await sql`DROP TABLE IF EXISTS payment_audit_log CASCADE`;
    await sql`DROP TABLE IF EXISTS backup_status CASCADE`;
    await sql`DROP TABLE IF EXISTS backup_metadata CASCADE`;
    await sql`DROP TABLE IF EXISTS links CASCADE`;
    await sql`DROP TABLE IF EXISTS news CASCADE`;
    await sql`DROP TABLE IF EXISTS insurance_forms CASCADE`;
    await sql`DROP TABLE IF EXISTS form_1099 CASCADE`;
    await sql`DROP TABLE IF EXISTS volunteers CASCADE`;
    await sql`DROP TABLE IF EXISTS officers CASCADE`;
    await sql`DROP TABLE IF EXISTS users CASCADE`;
    await sql`DROP TABLE IF EXISTS booster_clubs CASCADE`;
    
    // Create booster_clubs table with exact schema
    await sql`
      CREATE TABLE booster_clubs (
        id uuid,
        is_active boolean,
        created_at timestamp with time zone,
        updated_at timestamp with time zone,
        is_payment_enabled boolean,
        last_payment_update_at timestamp with time zone,
        qr_code_settings jsonb,
        sort_order integer,
        zelle_qr_code_path character varying,
        stripe_donation_link character varying,
        stripe_membership_link character varying,
        stripe_fees_link character varying,
        payment_instructions text,
        name character varying,
        description text,
        website_url character varying,
        donation_url character varying,
        zelle_url text,
        last_payment_update_by character varying,
        stripe_url character varying
      )
    `;
    
    // Create users table
    await sql`
      CREATE TABLE users (
        username character varying PRIMARY KEY,
        password character varying NOT NULL,
        role character varying NOT NULL,
        club character varying,
        club_name character varying,
        is_locked boolean DEFAULT false,
        is_first_login boolean,
        created_at timestamp with time zone,
        last_login timestamp with time zone,
        updated_at timestamp with time zone,
        club_id uuid,
        secret_question character varying,
        secret_answer character varying
      )
    `;
    
    // Create officers table
    await sql`
      CREATE TABLE officers (
        id uuid,
        name character varying NOT NULL,
        position character varying NOT NULL,
        email character varying,
        phone character varying,
        club character varying NOT NULL,
        club_name character varying NOT NULL,
        created_at timestamp with time zone,
        updated_at timestamp with time zone,
        club_id uuid
      )
    `;
    
    // Create volunteers table
    await sql`
      CREATE TABLE volunteers (
        id uuid,
        name character varying NOT NULL,
        email character varying,
        phone character varying,
        club character varying NOT NULL,
        club_name character varying NOT NULL,
        interests text[],
        availability text,
        status character varying,
        created_at timestamp with time zone,
        updated_at timestamp with time zone,
        notes text,
        assigned_club_id uuid
      )
    `;
    
    // Create form_1099 table
    await sql`
      CREATE TABLE form_1099 (
        id uuid,
        recipient_name character varying NOT NULL,
        recipient_tin character varying,
        amount numeric,
        description text,
        submitted_by character varying,
        tax_year integer NOT NULL,
        status character varying DEFAULT 'pending',
        created_at timestamp with time zone,
        updated_at timestamp with time zone,
        w9_filename character varying,
        w9_blob_url character varying,
        w9_file_size integer,
        w9_mime_type character varying,
        booster_club character varying,
        club_id uuid
      )
    `;
    
    // Create insurance_forms table
    await sql`
      CREATE TABLE insurance_forms (
        id uuid,
        event_name character varying NOT NULL,
        event_date date NOT NULL,
        event_description text,
        participant_count integer,
        submitted_by character varying,
        status character varying DEFAULT 'pending',
        created_at timestamp with time zone,
        updated_at timestamp with time zone,
        club_id uuid
      )
    `;
    
    // Create news table
    await sql`
      CREATE TABLE news (
        id uuid,
        title character varying NOT NULL,
        content text NOT NULL,
        slug character varying UNIQUE,
        status character varying DEFAULT 'draft',
        published_at timestamp with time zone,
        created_by character varying,
        created_at timestamp with time zone,
        updated_at timestamp with time zone
      )
    `;
    
    // Create links table
    await sql`
      CREATE TABLE links (
        id uuid,
        title character varying NOT NULL,
        url character varying NOT NULL,
        category character varying DEFAULT 'other',
        order_index integer DEFAULT 0,
        is_visible boolean DEFAULT true,
        click_count integer DEFAULT 0,
        created_by character varying,
        created_at timestamp with time zone,
        updated_at timestamp with time zone
      )
    `;
    
    // Create backup_metadata table
    await sql`
      CREATE TABLE backup_metadata (
        id uuid,
        timestamp timestamp with time zone,
        backup_type character varying,
        file_url character varying,
        file_size bigint,
        duration_ms integer,
        status character varying,
        error_message text,
        blob_count integer,
        created_at timestamp with time zone
      )
    `;
    
    // Create backup_status table
    await sql`
      CREATE TABLE backup_status (
        id uuid,
        last_backup timestamp with time zone,
        last_backup_status character varying,
        next_scheduled_backup timestamp with time zone,
        backup_count integer,
        total_backup_size bigint,
        updated_at timestamp with time zone
      )
    `;
    
    // Create payment_audit_log table
    await sql`
      CREATE TABLE payment_audit_log (
        id uuid,
        club_id uuid NOT NULL,
        action character varying NOT NULL,
        field_name character varying,
        old_value text,
        new_value text,
        changed_by character varying,
        changed_at timestamp with time zone,
        ip_address character varying,
        user_agent text
      )
    `;
    
    console.log('✅ All tables created with exact schema');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createExactSchema();
