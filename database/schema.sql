-- EWA Website Database Schema for Neon PostgreSQL
-- This schema supports officers, users, volunteers, insurance forms, and 1099 forms

-- Enable UUID extension for better ID management
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Officers table
CREATE TABLE IF NOT EXISTS officers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    club VARCHAR(100) NOT NULL,
    club_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Users table for admin authentication
CREATE TABLE IF NOT EXISTS users (
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
);

-- Volunteers table
CREATE TABLE IF NOT EXISTS volunteers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    club VARCHAR(100) NOT NULL,
    club_name VARCHAR(255) NOT NULL,
    interests TEXT[],
    availability TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insurance forms table
CREATE TABLE IF NOT EXISTS insurance_forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_name VARCHAR(255) NOT NULL,
    event_date DATE NOT NULL,
    event_description TEXT,
    participant_count INTEGER,
    submitted_by VARCHAR(100) REFERENCES users(username),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 1099 forms table
CREATE TABLE IF NOT EXISTS form_1099 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_name VARCHAR(255) NOT NULL,
    recipient_tin VARCHAR(20),
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    submitted_by VARCHAR(100) REFERENCES users(username),
    tax_year INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Documents table for file storage metadata
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    blob_url VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    booster_club VARCHAR(100) NOT NULL,
    uploaded_by VARCHAR(100) REFERENCES users(username),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_officers_club ON officers(club);
CREATE INDEX IF NOT EXISTS idx_volunteers_club ON volunteers(club);
CREATE INDEX IF NOT EXISTS idx_insurance_submitted_by ON insurance_forms(submitted_by);
CREATE INDEX IF NOT EXISTS idx_1099_submitted_by ON form_1099(submitted_by);
CREATE INDEX IF NOT EXISTS idx_documents_booster_club ON documents(booster_club);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to all tables
CREATE TRIGGER update_officers_updated_at BEFORE UPDATE ON officers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_volunteers_updated_at BEFORE UPDATE ON volunteers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_insurance_forms_updated_at BEFORE UPDATE ON insurance_forms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_form_1099_updated_at BEFORE UPDATE ON form_1099 FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user
INSERT INTO users (username, password, role, club, club_name, is_first_login) 
VALUES ('admin', 'ewa2025', 'admin', '', '', false)
ON CONFLICT (username) DO NOTHING;

-- Insert default orchestra booster user
INSERT INTO users (username, password, role, club, club_name, is_first_login) 
VALUES ('orchestra_booster', 'ewa_orchestra_2025', 'booster', 'orchestra', 'Eastlake Orchestra Booster Club', false)
ON CONFLICT (username) DO NOTHING; 