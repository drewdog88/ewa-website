const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function addTrackingTables() {
    try {
        console.log('🔄 Adding tracking tables to database...');

        // 1. Page Views Table
        console.log('📊 Creating page_views table...');
        await sql`
            CREATE TABLE IF NOT EXISTS page_views (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                page_url VARCHAR(255) NOT NULL,
                visitor_ip VARCHAR(45),
                user_agent TEXT,
                referrer VARCHAR(255),
                session_id VARCHAR(100),
                viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_admin BOOLEAN DEFAULT FALSE
            )
        `;

        // Create indexes for page_views
        await sql`CREATE INDEX IF NOT EXISTS idx_page_views_url ON page_views(page_url)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_page_views_date ON page_views(viewed_at)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_page_views_session ON page_views(session_id)`;

        // 2. Link Clicks Table
        console.log('🔗 Creating link_clicks table...');
        await sql`
            CREATE TABLE IF NOT EXISTS link_clicks (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                link_url VARCHAR(255) NOT NULL,
                link_text VARCHAR(255),
                page_source VARCHAR(255),
                visitor_ip VARCHAR(45),
                session_id VARCHAR(100),
                clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_admin BOOLEAN DEFAULT FALSE
            )
        `;

        // Create indexes for link_clicks
        await sql`CREATE INDEX IF NOT EXISTS idx_link_clicks_url ON link_clicks(link_url)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_link_clicks_date ON link_clicks(clicked_at)`;

        // 3. Admin Activity Log
        console.log('📋 Creating admin_activity table...');
        await sql`
            CREATE TABLE IF NOT EXISTS admin_activity (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                admin_user VARCHAR(100),
                action_type VARCHAR(50),
                action_details JSONB,
                ip_address VARCHAR(45),
                performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // Create indexes for admin_activity
        await sql`CREATE INDEX IF NOT EXISTS idx_admin_activity_user ON admin_activity(admin_user)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_admin_activity_type ON admin_activity(action_type)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_admin_activity_date ON admin_activity(performed_at)`;

        console.log('✅ All tracking tables created successfully!');
        
        // Insert some sample data for testing
        console.log('📝 Inserting sample data...');
        
        // Sample page views
        await sql`
            INSERT INTO page_views (page_url, visitor_ip, session_id, is_admin) VALUES
            ('/index.html', '192.168.1.1', 'session1', false),
            ('/team.html', '192.168.1.2', 'session2', false),
            ('/admin/dashboard.html', '192.168.1.3', 'session3', true)
            ON CONFLICT DO NOTHING
        `;

        // Sample link clicks
        await sql`
            INSERT INTO link_clicks (link_url, link_text, page_source, session_id, is_admin) VALUES
            ('/team.html', 'EWA Team', '/index.html', 'session1', false),
            ('/news.html', 'News', '/index.html', 'session2', false),
            ('/admin/officers', 'Officers Management', '/admin/dashboard.html', 'session3', true)
            ON CONFLICT DO NOTHING
        `;

        // Sample admin activity
        await sql`
            INSERT INTO admin_activity (admin_user, action_type, action_details, ip_address) VALUES
            ('admin@ewa.org', 'login', '{"success": true}', '192.168.1.3'),
            ('admin@ewa.org', 'update_officer', '{"officer_id": "123", "club": "Band Boosters"}', '192.168.1.3'),
            ('admin@ewa.org', 'create_backup', '{"backup_id": "backup_2024_01_15"}', '192.168.1.3')
            ON CONFLICT DO NOTHING
        `;

        console.log('✅ Sample data inserted successfully!');
        
        // Verify tables were created
        const tables = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('page_views', 'link_clicks', 'admin_activity')
            ORDER BY table_name
        `;
        
        console.log('📋 Created tables:', tables.map(t => t.table_name));
        
        // Show sample counts
        const pageViewsCount = await sql`SELECT COUNT(*) as count FROM page_views`;
        const linkClicksCount = await sql`SELECT COUNT(*) as count FROM link_clicks`;
        const adminActivityCount = await sql`SELECT COUNT(*) as count FROM admin_activity`;
        
        console.log('📊 Sample data counts:');
        console.log(`  - Page Views: ${pageViewsCount[0].count}`);
        console.log(`  - Link Clicks: ${linkClicksCount[0].count}`);
        console.log(`  - Admin Activity: ${adminActivityCount[0].count}`);

    } catch (error) {
        console.error('❌ Error creating tracking tables:', error);
        throw error;
    }
}

// Run the migration
if (require.main === module) {
    addTrackingTables()
        .then(() => {
            console.log('🎉 Migration completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Migration failed:', error);
            process.exit(1);
        });
}

module.exports = { addTrackingTables };
