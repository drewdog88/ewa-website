require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function createMissingTables() {
  console.log('🔄 Creating missing tables...');
  
  try {
    const sql = neon(process.env.DATABASE_URL);
    console.log('✅ Connected to database');
    
    // Create users table
    console.log('\n📋 Creating users table...');
    await sql`
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
      )
    `;
    console.log('✅ Users table created');
    
    // Create volunteers table
    console.log('\n📋 Creating volunteers table...');
    await sql`
      CREATE TABLE IF NOT EXISTS volunteers (
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
      )
    `;
    console.log('✅ Volunteers table created');
    
    // Create insurance_forms table
    console.log('\n📋 Creating insurance_forms table...');
    await sql`
      CREATE TABLE IF NOT EXISTS insurance_forms (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_name VARCHAR(255) NOT NULL,
        event_date DATE NOT NULL,
        event_description TEXT,
        participant_count INTEGER,
        submitted_by VARCHAR(100) REFERENCES users(username),
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Insurance forms table created');
    
    // Create form_1099 table
    console.log('\n📋 Creating form_1099 table...');
    await sql`
      CREATE TABLE IF NOT EXISTS form_1099 (
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
      )
    `;
    console.log('✅ Form 1099 table created');
    
    // Create news table
    console.log('\n📋 Creating news table...');
    await sql`
      CREATE TABLE IF NOT EXISTS news (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        slug VARCHAR(255) UNIQUE,
        status VARCHAR(50) DEFAULT 'draft',
        published_at TIMESTAMP WITH TIME ZONE,
        created_by VARCHAR(100) REFERENCES users(username),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ News table created');
    
    // Create links table
    console.log('\n📋 Creating links table...');
    await sql`
      CREATE TABLE IF NOT EXISTS links (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        url VARCHAR(500) NOT NULL,
        category VARCHAR(100) DEFAULT 'other',
        order_index INTEGER DEFAULT 0,
        is_visible BOOLEAN DEFAULT TRUE,
        click_count INTEGER DEFAULT 0,
        created_by VARCHAR(100) REFERENCES users(username),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Links table created');
    
    // Create documents table
    console.log('\n📋 Creating documents table...');
    await sql`
      CREATE TABLE IF NOT EXISTS documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        filename VARCHAR(255) NOT NULL,
        original_filename VARCHAR(255) NOT NULL,
        file_size BIGINT NOT NULL,
        mime_type VARCHAR(100),
        blob_url TEXT,
        booster_club VARCHAR(100),
        uploaded_by VARCHAR(100) REFERENCES users(username),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Documents table created');
    
    // Add some sample data to volunteers table
    console.log('\n📝 Adding sample volunteer data...');
    await sql`
      INSERT INTO volunteers (name, email, phone, club, club_name, interests, availability)
      VALUES 
        ('John Smith', 'john.smith@email.com', '425-555-0101', 'Band', 'EHS Band Boosters', ARRAY['fundraising', 'events'], 'Weekends'),
        ('Jane Doe', 'jane.doe@email.com', '425-555-0102', 'Basketball', 'Eastlake Girls Basketball Booster Club', ARRAY['concessions', 'transportation'], 'Weekdays after 5pm'),
        ('Mike Johnson', 'mike.johnson@email.com', '425-555-0103', 'Soccer', 'Eastlake Girls Soccer', ARRAY['coaching', 'equipment'], 'Flexible')
      ON CONFLICT DO NOTHING
    `;
    console.log('✅ Sample volunteer data added');
    
    console.log('\n🎉 All missing tables created successfully!');
    
    // Verify tables
    console.log('\n📋 Verifying tables...');
    const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`;
    console.log('Tables found:', tables.length);
    tables.forEach(table => {
      console.log(`- ${table.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createMissingTables();
