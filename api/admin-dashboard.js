const express = require('express');
const router = express.Router();
const { 
    getDashboardMetrics, 
    searchEverything, 
    logAdminActivity, 
    getRecentActivity, 
    getAnalyticsData 
} = require('../database/admin-dashboard-functions');

// Middleware to check admin authentication
function requireAdminAuth(req, res, next) {
    // For now, we'll use a simple check - in production you'd want proper session management
    const isAdmin = req.headers['x-admin-auth'] === 'true' || req.query.admin === 'true';
    
    if (!isAdmin) {
        return res.status(401).json({ error: 'Admin authentication required' });
    }
    
    next();
}

// Dashboard Metrics
router.get('/metrics', requireAdminAuth, async (req, res) => {
    try {
        const metrics = await getDashboardMetrics();
        res.json(metrics);
    } catch (error) {
        console.error('Error getting dashboard metrics:', error);
        res.status(500).json({ error: 'Failed to get dashboard metrics' });
    }
});

// Global Search
router.get('/search', requireAdminAuth, async (req, res) => {
    try {
        const query = req.query.q;
        
        if (!query || query.length < 2) {
            return res.json({
                officers: [],
                clubs: [],
                volunteers: [],
                activity: []
            });
        }
        
        const results = await searchEverything(query);
        res.json(results);
    } catch (error) {
        console.error('Error searching:', error);
        res.status(500).json({ error: 'Search failed' });
    }
});

// Recent Activity
router.get('/activity', requireAdminAuth, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const activity = await getRecentActivity(limit);
        res.json(activity);
    } catch (error) {
        console.error('Error getting recent activity:', error);
        res.status(500).json({ error: 'Failed to get recent activity' });
    }
});

// Analytics Data
router.get('/analytics', requireAdminAuth, async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const analytics = await getAnalyticsData(days);
        res.json(analytics);
    } catch (error) {
        console.error('Error getting analytics:', error);
        res.status(500).json({ error: 'Failed to get analytics data' });
    }
});

// Log Admin Activity
router.post('/log-activity', requireAdminAuth, async (req, res) => {
    try {
        const { adminUser, actionType, actionDetails, ipAddress } = req.body;
        
        if (!adminUser || !actionType) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        await logAdminActivity(adminUser, actionType, actionDetails, ipAddress);
        res.json({ success: true });
    } catch (error) {
        console.error('Error logging admin activity:', error);
        res.status(500).json({ error: 'Failed to log activity' });
    }
});

// Health check for admin dashboard
router.get('/health', requireAdminAuth, async (req, res) => {
    try {
        // Test database connection by getting basic metrics
        const metrics = await getDashboardMetrics();
        
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            database: 'connected',
            metrics: {
                totalClubs: metrics.totalClubs,
                visitorsThisMonth: metrics.visitorsThisMonth,
                backupStatus: metrics.backupStatus
            }
        });
    } catch (error) {
        console.error('Admin dashboard health check failed:', error);
        res.status(500).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

module.exports = router;
