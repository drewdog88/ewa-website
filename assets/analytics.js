/**
 * EWA Website Analytics Tracking System
 * Tracks page views, link clicks, and user sessions
 */

class EWAAnalytics {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.isAdmin = this.detectAdminPage();
        this.pageUrl = window.location.pathname;
        this.startTime = Date.now();
        
        // Initialize tracking
        this.init();
    }

    /**
     * Generate a unique session ID for this user session
     */
    generateSessionId() {
        // Check if session ID already exists in sessionStorage
        let sessionId = sessionStorage.getItem('ewa_session_id');
        
        if (!sessionId) {
            // Generate new session ID
            sessionId = 'ewa_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('ewa_session_id', sessionId);
        }
        
        return sessionId;
    }

    /**
     * Detect if this is an admin page
     */
    detectAdminPage() {
        return window.location.pathname.startsWith('/admin/') || 
               window.location.pathname.includes('admin');
    }

    /**
     * Initialize analytics tracking
     */
    init() {
        try {
            // Track page view
            this.trackPageView();
            
            // Track link clicks
            this.trackLinkClicks();
            
            // Track page exit (when user leaves)
            this.trackPageExit();
            
            console.log('✅ EWA Analytics initialized for session:', this.sessionId);
        } catch (error) {
            console.error('❌ EWA Analytics initialization failed:', error);
        }
    }

    /**
     * Track page view
     */
    async trackPageView() {
        try {
            const pageData = {
                pageUrl: this.pageUrl,
                visitorIp: await this.getVisitorIP(),
                userAgent: navigator.userAgent,
                referrer: document.referrer || null,
                sessionId: this.sessionId,
                isAdmin: this.isAdmin,
                timestamp: new Date().toISOString()
            };

            const response = await fetch('/api/analytics/page-view', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(pageData)
            });

            if (response.ok) {
                console.log('📊 Page view tracked:', this.pageUrl);
            } else {
                console.warn('⚠️ Page view tracking failed:', response.status);
            }
        } catch (error) {
            console.error('❌ Page view tracking error:', error);
        }
    }

    /**
     * Track link clicks
     */
    trackLinkClicks() {
        // Add click listeners to all links
        document.addEventListener('click', (event) => {
            const link = event.target.closest('a');
            
            if (link && link.href) {
                this.trackLinkClick(link);
            }
        });
    }

    /**
     * Track individual link click
     */
    async trackLinkClick(link) {
        try {
            const linkData = {
                linkUrl: link.href,
                linkText: link.textContent?.trim() || link.title || 'Unknown Link',
                pageSource: this.pageUrl,
                visitorIp: await this.getVisitorIP(),
                sessionId: this.sessionId,
                isAdmin: this.isAdmin,
                timestamp: new Date().toISOString()
            };

            const response = await fetch('/api/analytics/link-click', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(linkData)
            });

            if (response.ok) {
                console.log('🔗 Link click tracked:', linkData.linkText, '->', linkData.linkUrl);
            } else {
                console.warn('⚠️ Link click tracking failed:', response.status);
            }
        } catch (error) {
            console.error('❌ Link click tracking error:', error);
        }
    }

    /**
     * Track page exit (time spent on page)
     */
    trackPageExit() {
        // Track when user leaves the page
        window.addEventListener('beforeunload', () => {
            const timeSpent = Date.now() - this.startTime;
            
            // Send exit data (this might not always work due to page unload)
            navigator.sendBeacon('/api/analytics/page-exit', JSON.stringify({
                sessionId: this.sessionId,
                pageUrl: this.pageUrl,
                timeSpent: timeSpent,
                isAdmin: this.isAdmin
            }));
        });
    }

    /**
     * Get visitor IP (simplified - in production you'd get this server-side)
     */
    async getVisitorIP() {
        try {
            // For now, return a placeholder - real IP would be detected server-side
            return 'client-side';
        } catch (error) {
            return 'unknown';
        }
    }

    /**
     * Manual tracking methods for specific events
     */
    trackEvent(eventName, eventData = {}) {
        console.log('📈 Custom event tracked:', eventName, eventData);
        // Could be extended to track custom events
    }
}

// Initialize analytics when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if not already initialized
    if (!window.ewaAnalytics) {
        window.ewaAnalytics = new EWAAnalytics();
    }
});

// Also initialize if DOM is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.ewaAnalytics) {
            window.ewaAnalytics = new EWAAnalytics();
        }
    });
} else {
    // DOM already loaded
    if (!window.ewaAnalytics) {
        window.ewaAnalytics = new EWAAnalytics();
    }
}
