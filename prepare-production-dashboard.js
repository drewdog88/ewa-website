require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function prepareProductionDashboard() {
    console.log('🚀 Preparing production database for new admin dashboard...');
    
    try {
        const sql = neon(process.env.DATABASE_URL);
        console.log('✅ Connected to database');
        
        // Check current environment
        const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;
        console.log(`📍 Environment: ${isProduction ? 'Production' : 'Development'}`);
        
        // 1. Create tracking tables if they don't exist
        console.log('\n📋 Creating tracking tables...');
        
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
        console.log('✅ page_views table ready');
        
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
        console.log('✅ link_clicks table ready');
        
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
        console.log('✅ admin_activity table ready');
        
        // 2. Create indexes for better performance
        console.log('\n🔍 Creating indexes...');
        
        await sql`
            CREATE INDEX IF NOT EXISTS idx_page_views_viewed_at ON page_views(viewed_at)
        `;
        await sql`
            CREATE INDEX IF NOT EXISTS idx_page_views_is_admin ON page_views(is_admin)
        `;
        await sql`
            CREATE INDEX IF NOT EXISTS idx_link_clicks_clicked_at ON link_clicks(clicked_at)
        `;
        await sql`
            CREATE INDEX IF NOT EXISTS idx_admin_activity_performed_at ON admin_activity(performed_at)
        `;
        await sql`
            CREATE INDEX IF NOT EXISTS idx_admin_activity_admin_user ON admin_activity(admin_user)
        `;
        console.log('✅ Indexes created');
        
        // 3. Insert sample tracking data for testing
        console.log('\n📝 Inserting sample tracking data...');
        
        // Sample page views
        await sql`
            INSERT INTO page_views (page_url, visitor_ip, user_agent, is_admin)
            VALUES 
                ('/admin/dashboard', '192.168.1.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', true),
                ('/admin/dashboard', '192.168.1.2', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', true),
                ('/', '203.0.113.1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1)', false),
                ('/team', '203.0.113.2', 'Mozilla/5.0 (Android 11; Mobile)', false)
            ON CONFLICT DO NOTHING
        `;
        
        // Sample link clicks
        await sql`
            INSERT INTO link_clicks (link_url, link_text, page_source, visitor_ip, is_admin)
            VALUES 
                ('/api/qr-code?clubId=1', 'Band QR Code', '/admin/dashboard', '192.168.1.1', true),
                ('https://stripe.com/pay', 'Stripe Payment', '/admin/dashboard', '192.168.1.2', true),
                ('/team', 'Team Page', '/', '203.0.113.1', false),
                ('/volunteers', 'Volunteer Signup', '/', '203.0.113.2', false)
            ON CONFLICT DO NOTHING
        `;
        
        // Sample admin activity
        await sql`
            INSERT INTO admin_activity (admin_user, action_type, action_details, ip_address)
            VALUES 
                ('admin', 'login', '{"method": "password"}', '192.168.1.1'),
                ('admin', 'update_officer', '{"officer_id": "123", "field": "email"}', '192.168.1.1'),
                ('admin', 'view_dashboard', '{"section": "overview"}', '192.168.1.2'),
                ('admin', 'export_data', '{"type": "officers", "format": "csv"}', '192.168.1.1')
            ON CONFLICT DO NOTHING
        `;
        
        console.log('✅ Sample data inserted');
        
        // 4. Verify data counts
        console.log('\n📊 Verifying data...');
        
        const pageViewsCount = await sql`SELECT COUNT(*) as count FROM page_views`;
        const linkClicksCount = await sql`SELECT COUNT(*) as count FROM link_clicks`;
        const adminActivityCount = await sql`SELECT COUNT(*) as count FROM admin_activity`;
        const officersCount = await sql`SELECT COUNT(*) as count FROM officers`;
        const boosterClubsCount = await sql`SELECT COUNT(*) as count FROM booster_clubs`;
        
        console.log(`📈 Page views: ${pageViewsCount[0].count}`);
        console.log(`🔗 Link clicks: ${linkClicksCount[0].count}`);
        console.log(`👤 Admin activities: ${adminActivityCount[0].count}`);
        console.log(`👔 Officers: ${officersCount[0].count}`);
        console.log(`🏢 Booster clubs: ${boosterClubsCount[0].count}`);
        
        // 5. Test admin dashboard functions
        console.log('\n🧪 Testing admin dashboard functions...');
        
        // Test metrics query
        const metrics = await sql`
            SELECT 
                (SELECT COUNT(*) FROM booster_clubs) as total_clubs,
                (SELECT COUNT(*) FROM page_views WHERE viewed_at >= NOW() - INTERVAL '30 days') as monthly_visitors,
                (SELECT COUNT(*) FROM link_clicks WHERE clicked_at >= NOW() - INTERVAL '7 days') as recent_clicks
        `;
        
        console.log('📊 Sample metrics:');
        console.log(`- Total clubs: ${metrics[0].total_clubs}`);
        console.log(`- Monthly visitors: ${metrics[0].monthly_visitors}`);
        console.log(`- Recent clicks: ${metrics[0].recent_clicks}`);
        
        // Test search query
        const searchResults = await sql`
            SELECT 
                'officers' as category,
                CONCAT(name, ' - ', club_name) as title,
                CONCAT('Officer: ', name, ' (', club_name, ')') as description,
                'officers' as section
            FROM officers 
            WHERE name ILIKE '%president%' 
            OR club_name ILIKE '%band%'
            OR position ILIKE '%president%'
            LIMIT 5
        `;
        
        console.log(`🔍 Search test results: ${searchResults.length} items found`);
        
        // 6. Verify all required tables exist
        console.log('\n📋 Verifying all required tables...');
        
        const requiredTables = [
            'officers', 'booster_clubs', 'users', 'volunteers', 
            'insurance_forms', 'form_1099', 'news', 'links', 
            'documents', 'page_views', 'link_clicks', 'admin_activity'
        ];
        
        const existingTables = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = ANY(${requiredTables})
        `;
        
        const existingTableNames = existingTables.map(t => t.table_name);
        const missingTables = requiredTables.filter(table => !existingTableNames.includes(table));
        
        if (missingTables.length > 0) {
            console.log(`⚠️ Missing tables: ${missingTables.join(', ')}`);
        } else {
            console.log('✅ All required tables present');
        }
        
        console.log('\n🎉 Production database preparation completed successfully!');
        console.log('\n📝 Next steps:');
        console.log('1. Deploy the new dashboard files to production');
        console.log('2. Test the dashboard at /admin/newdash.html');
        console.log('3. Verify all functionality works in production');
        console.log('4. Begin gradual user transition');
        
    } catch (error) {
        console.error('❌ Error preparing production database:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

// Run the preparation
prepareProductionDashboard();
