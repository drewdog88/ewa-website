const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

// Dashboard Metrics Functions
async function getDashboardMetrics() {
    try {
        // Get total booster clubs
        const clubsResult = await sql`
            SELECT COUNT(*) as total_clubs 
            FROM booster_clubs 
            WHERE is_active = true
        `;
        
        // Get site visitors this month (excluding admin)
        const visitorsResult = await sql`
            SELECT COUNT(DISTINCT session_id) as visitors_this_month 
            FROM page_views 
            WHERE viewed_at >= DATE_TRUNC('month', CURRENT_DATE)
            AND is_admin = false
        `;
        
        // Get top 5 most clicked links this month
        const topLinksResult = await sql`
            SELECT link_url, link_text, COUNT(*) as click_count
            FROM link_clicks 
            WHERE clicked_at >= DATE_TRUNC('month', CURRENT_DATE)
            AND is_admin = false
            GROUP BY link_url, link_text
            ORDER BY click_count DESC
            LIMIT 5
        `;
        
        // Get backup status
        const backupResult = await sql`
            SELECT 
                CASE 
                    WHEN MAX(performed_at) >= CURRENT_DATE - INTERVAL '1 day' 
                    THEN 'green' 
                    ELSE 'red' 
                END as backup_status,
                DATE(MAX(performed_at)) as last_backup_date
            FROM admin_activity 
            WHERE action_type = 'create_backup'
        `;
        
        return {
            totalClubs: clubsResult[0]?.total_clubs || 0,
            visitorsThisMonth: visitorsResult[0]?.visitors_this_month || 0,
            topLinks: topLinksResult,
            backupStatus: backupResult[0]?.backup_status || 'red',
            lastBackupDate: backupResult[0]?.last_backup_date || null
        };
    } catch (error) {
        console.error('Error getting dashboard metrics:', error);
        throw error;
    }
}

// Search Functions
async function searchEverything(query) {
    try {
        const searchTerm = `%${query}%`;
        
        // Search officers
        const officers = await sql`
            SELECT 
                'officers' as category,
                CONCAT(name, ' - ', club_name) as title,
                CONCAT('Officer: ', name, ' (', club_name, ')') as description,
                'officers' as section
            FROM officers 
            WHERE name ILIKE ${searchTerm} 
            OR club_name ILIKE ${searchTerm}
            OR position ILIKE ${searchTerm}
            LIMIT 5
        `;
        
        // Search booster clubs
        const clubs = await sql`
            SELECT 
                'clubs' as category,
                name as title,
                CONCAT('Booster Club: ', name) as description,
                'content' as section
            FROM booster_clubs 
            WHERE name ILIKE ${searchTerm} 
            OR description ILIKE ${searchTerm}
            LIMIT 5
        `;
        
        // Search volunteers (if table exists)
        let volunteers = [];
        try {
            volunteers = await sql`
                SELECT 
                    'volunteers' as category,
                    CONCAT(name, ' - ', club) as title,
                    CONCAT('Volunteer: ', name, ' (', club, ')') as description,
                    'volunteers' as section
                FROM volunteers 
                WHERE name ILIKE ${searchTerm} 
                OR club ILIKE ${searchTerm}
                LIMIT 5
            `;
        } catch (error) {
            // Volunteers table doesn't exist, return empty array
            console.log('Volunteers table not found, skipping volunteer search');
        }
        
        // Search admin activity
        const activity = await sql`
            SELECT 
                'activity' as category,
                CONCAT(action_type, ' - ', admin_user) as title,
                CONCAT('Admin Action: ', action_type, ' by ', admin_user) as description,
                'audit' as section
            FROM admin_activity 
            WHERE action_type ILIKE ${searchTerm} 
            OR admin_user ILIKE ${searchTerm}
            ORDER BY performed_at DESC
            LIMIT 5
        `;
        
        return {
            officers: officers,
            clubs: clubs,
            volunteers: volunteers,
            activity: activity
        };
    } catch (error) {
        console.error('Error searching:', error);
        throw error;
    }
}

// Activity Tracking Functions
async function logPageView(pageUrl, visitorIp, userAgent, referrer, sessionId, isAdmin = false) {
    try {
        await sql`
            INSERT INTO page_views (page_url, visitor_ip, user_agent, referrer, session_id, is_admin)
            VALUES (${pageUrl}, ${visitorIp}, ${userAgent}, ${referrer}, ${sessionId}, ${isAdmin})
        `;
    } catch (error) {
        console.error('Error logging page view:', error);
        // Don't throw - we don't want page view logging to break the site
    }
}

async function logLinkClick(linkUrl, linkText, pageSource, visitorIp, sessionId, isAdmin = false) {
    try {
        await sql`
            INSERT INTO link_clicks (link_url, link_text, page_source, visitor_ip, session_id, is_admin)
            VALUES (${linkUrl}, ${linkText}, ${pageSource}, ${visitorIp}, ${sessionId}, ${isAdmin})
        `;
    } catch (error) {
        console.error('Error logging link click:', error);
        // Don't throw - we don't want click logging to break the site
    }
}

async function logAdminActivity(adminUser, actionType, actionDetails, ipAddress) {
    try {
        await sql`
            INSERT INTO admin_activity (admin_user, action_type, action_details, ip_address)
            VALUES (${adminUser}, ${actionType}, ${JSON.stringify(actionDetails)}, ${ipAddress})
        `;
    } catch (error) {
        console.error('Error logging admin activity:', error);
        // Don't throw - we don't want activity logging to break admin functions
    }
}

// Recent Activity Functions
async function getRecentActivity(limit = 10) {
    try {
        const activity = await sql`
            SELECT 
                admin_user,
                action_type,
                action_details,
                performed_at,
                ip_address
            FROM admin_activity 
            ORDER BY performed_at DESC 
            LIMIT ${limit}
        `;
        
        return activity.map(item => ({
            ...item,
            action_details: typeof item.action_details === 'string' 
                ? JSON.parse(item.action_details) 
                : item.action_details
        }));
    } catch (error) {
        console.error('Error getting recent activity:', error);
        return [];
    }
}

// Analytics Functions
async function getAnalyticsData(days = 30) {
    try {
        // Page views over time
        const pageViews = await sql`
            SELECT 
                DATE(viewed_at) as date,
                COUNT(*) as views,
                COUNT(DISTINCT session_id) as unique_visitors
            FROM page_views 
            WHERE viewed_at >= CURRENT_DATE - INTERVAL '${days} days'
            AND is_admin = false
            GROUP BY DATE(viewed_at)
            ORDER BY date DESC
        `;
        
        // Top pages
        const topPages = await sql`
            SELECT 
                page_url,
                COUNT(*) as views
            FROM page_views 
            WHERE viewed_at >= CURRENT_DATE - INTERVAL '${days} days'
            AND is_admin = false
            GROUP BY page_url
            ORDER BY views DESC
            LIMIT 10
        `;
        
        // Top links
        const topLinks = await sql`
            SELECT 
                link_url,
                link_text,
                COUNT(*) as clicks
            FROM link_clicks 
            WHERE clicked_at >= CURRENT_DATE - INTERVAL '${days} days'
            AND is_admin = false
            GROUP BY link_url, link_text
            ORDER BY clicks DESC
            LIMIT 10
        `;
        
        return {
            pageViews,
            topPages,
            topLinks
        };
    } catch (error) {
        console.error('Error getting analytics data:', error);
        throw error;
    }
}

module.exports = {
    getDashboardMetrics,
    searchEverything,
    logPageView,
    logLinkClick,
    logAdminActivity,
    getRecentActivity,
    getAnalyticsData
};
