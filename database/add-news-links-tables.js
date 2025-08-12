// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { neon } = require('@neondatabase/serverless');

// Database connection configuration
let sql = null;

// Initialize the Neon connection
function getSql() {
  if (!sql) {
    if (!process.env.DATABASE_URL) {
      console.warn('⚠️ DATABASE_URL not found');
      return null;
    }
    sql = neon(process.env.DATABASE_URL);
    console.log('✅ Connected to Neon PostgreSQL database');
  }
  return sql;
}

async function addNewsAndLinksTables() {
  const sql = getSql();
  if (!sql) {
    console.error('❌ Database connection not available');
    return;
  }
    
  try {
    // Create news table
    await sql`
      CREATE TABLE IF NOT EXISTS news (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    console.log('✅ Created news table');
    
    // Create links table
    await sql`
      CREATE TABLE IF NOT EXISTS links (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    console.log('✅ Created links table');
    
    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_news_status ON news(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_news_published_at ON news(published_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_news_slug ON news(slug)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_links_category ON links(category)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_links_order_index ON links(order_index)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_links_is_visible ON links(is_visible)`;
    console.log('✅ Created indexes for news and links tables');
    
    console.log('✅ News and links tables migration completed successfully');
  } catch (error) {
    console.error('❌ Error creating news and links tables:', error);
    throw error;
  }
}

// Run the migration if this file is executed directly
if (require.main === module) {
  addNewsAndLinksTables()
    .then(() => {
      console.log('✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { addNewsAndLinksTables };
