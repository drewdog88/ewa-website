// User Session Management
// This file handles the dynamic user button that appears when logged in

class UserSessionManager {
    constructor() {
        this.currentUser = null;
        this.isLoggedIn = false;
        this.init();
    }

    async init() {
        // Check if user is logged in from sessionStorage
        const storedUser = sessionStorage.getItem('currentUser');
        if (storedUser) {
            try {
                this.currentUser = JSON.parse(storedUser);
                this.isLoggedIn = true;
                this.updateUI();
            } catch (error) {
                console.error('Error parsing stored user:', error);
                this.clearSession();
            }
        }

        // Set up periodic session check
        setInterval(() => this.checkSession(), 5 * 60 * 1000); // Check every 5 minutes
    }

    async checkSession() {
        if (!this.currentUser) return;

        try {
            const response = await fetch(`/api/session?token=${this.currentUser.username}`);
            const data = await response.json();

            if (!data.success || !data.isLoggedIn) {
                this.clearSession();
                window.location.reload();
            }
        } catch (error) {
            console.error('Error checking session:', error);
        }
    }

    updateUI() {
        // Check if we're in the admin dashboard
        const isAdminDashboard = window.location.pathname.includes('/admin/dashboard.html');
        
        if (isAdminDashboard) {
            // Handle admin dashboard header
            this.updateAdminDashboardUI();
        } else {
            // Handle regular pages
            this.updateRegularPageUI();
        }
    }

    updateAdminDashboardUI() {
        const userButtonContainer = document.getElementById('userButtonContainer');
        if (!userButtonContainer) return;

        // Clear existing content
        userButtonContainer.innerHTML = '';

        if (this.isLoggedIn && this.currentUser) {
            // Create user button with dropdown
            const userButton = this.createUserButton();
            userButtonContainer.appendChild(userButton);
        } else {
            // Show login link
            const loginLink = document.createElement('a');
            loginLink.href = 'login.html';
            loginLink.className = 'admin-link';
            loginLink.textContent = 'Login';
            userButtonContainer.appendChild(loginLink);
        }
    }

    updateRegularPageUI() {
        const headerRight = document.querySelector('.header-right');
        if (!headerRight) return;

        // Remove existing admin link
        const existingAdminLink = headerRight.querySelector('.admin-link');
        if (existingAdminLink) {
            existingAdminLink.remove();
        }

        // Remove existing user button if it exists
        const existingUserButton = headerRight.querySelector('.user-button');
        if (existingUserButton) {
            existingUserButton.remove();
        }

        if (this.isLoggedIn && this.currentUser) {
            // Create user button with dropdown
            const userButton = this.createUserButton();
            headerRight.appendChild(userButton);
        } else {
            // Show regular admin link
            const adminLink = document.createElement('a');
            adminLink.href = 'admin/login.html';
            adminLink.className = 'admin-link';
            adminLink.textContent = 'Admin';
            headerRight.appendChild(adminLink);
        }
    }

    createUserButton() {
        const userButton = document.createElement('div');
        userButton.className = 'user-button';
        userButton.innerHTML = `
            <button class="user-button-main" onclick="userSession.toggleDropdown()">
                <span class="user-name">${this.currentUser.username}</span>
                <span class="dropdown-arrow">▼</span>
            </button>
            <div class="user-dropdown" id="userDropdown">
                <div class="dropdown-item" onclick="userSession.showChangePassword()">
                    <span class="dropdown-icon">🔒</span>
                    Security Settings
                </div>
                <div class="dropdown-separator"></div>
                <div class="dropdown-item" onclick="userSession.logout()">
                    <span class="dropdown-icon">🚪</span>
                    Logout
                </div>
            </div>
        `;

        // Add styles
        this.addUserButtonStyles();

        return userButton;
    }

    addUserButtonStyles() {
        if (document.getElementById('user-button-styles')) return;

        const style = document.createElement('style');
        style.id = 'user-button-styles';
        style.textContent = `
            .user-button {
                position: relative;
                display: inline-block;
            }

            .user-button-main {
                background: #dc3545;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                display: flex;
                align-items: center;
                gap: 8px;
                transition: background-color 0.3s ease;
            }

            .user-button-main:hover {
                background: #c82333;
            }

            .user-name {
                font-weight: 500;
            }

            .dropdown-arrow {
                font-size: 10px;
                transition: transform 0.3s ease;
            }

            .user-dropdown {
                position: absolute;
                top: 100%;
                right: 0;
                background: white;
                border: 1px solid #ddd;
                border-radius: 4px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                min-width: 180px;
                z-index: 1000;
                display: none;
                margin-top: 4px;
                color: #333;
            }

            .user-dropdown.show {
                display: block;
            }

            .dropdown-item {
                padding: 10px 16px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
                transition: background-color 0.2s ease;
                border-bottom: 1px solid #f0f0f0;
                color: #333;
                font-size: 14px;
            }

            .dropdown-item:last-child {
                border-bottom: none;
            }

            .dropdown-item:hover {
                background: #f8f9fa;
            }

            .dropdown-icon {
                font-size: 14px;
                width: 16px;
                text-align: center;
            }

            .dropdown-separator {
                height: 1px;
                background: #e9ecef;
                margin: 4px 0;
            }

            .admin-link {
                background: #dc3545;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                text-decoration: none;
                display: inline-block;
                transition: background-color 0.3s ease;
            }

            .admin-link:hover {
                background: #c82333;
                text-decoration: none;
                color: white;
            }

            /* Admin dashboard specific styles */
            .admin-header .user-button {
                margin-left: 10px;
            }

            .admin-header .user-button-main {
                background: #dc3545;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                display: flex;
                align-items: center;
                gap: 8px;
                transition: background-color 0.3s ease;
            }

            .admin-header .user-button-main:hover {
                background: #c82333;
            }

            .admin-header .user-dropdown {
                position: absolute;
                top: 100%;
                right: 0;
                background: white;
                border: 1px solid #ddd;
                border-radius: 4px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                min-width: 180px;
                z-index: 1000;
                display: none;
                margin-top: 4px;
            }

            .admin-header .user-dropdown.show {
                display: block;
            }

            .admin-header .dropdown-item {
                color: #333;
                font-size: 14px;
            }
        `;
        document.head.appendChild(style);
    }

    toggleDropdown() {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) {
            dropdown.classList.toggle('show');
            
            // Close dropdown when clicking outside
            if (dropdown.classList.contains('show')) {
                setTimeout(() => {
                    document.addEventListener('click', this.closeDropdown.bind(this), { once: true });
                }, 0);
            }
        }
    }

    closeDropdown() {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) {
            dropdown.classList.remove('show');
        }
    }

    showChangePassword() {
        this.closeDropdown();
        // Navigate to admin dashboard profile section
        if (window.location.pathname.includes('/admin/dashboard.html')) {
            // If already on dashboard, programmatically trigger the profile section navigation
            const profileLink = document.querySelector('a[data-section="profile"]');
            if (profileLink) {
                // Remove active class from all links and sections
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
                
                // Add active class to profile link
                profileLink.classList.add('active');
                
                // Show profile section
                const profileSection = document.getElementById('profile');
                if (profileSection) {
                    profileSection.classList.add('active');
                    profileSection.scrollIntoView({ behavior: 'smooth' });
                }
            }
        } else {
            // If on other pages, navigate to dashboard profile section
            window.location.href = 'admin/dashboard.html#profile';
        }
    }

    async logout() {
        this.closeDropdown();
        
        // Set global flag to prevent data loading during logout
        if (typeof window !== 'undefined') {
            window.isLoggingOut = true;
        }
        
        try {
            const response = await fetch('/api/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                this.clearSession();
                window.location.reload();
            } else {
                console.error('Logout failed');
                this.clearSession();
                window.location.reload();
            }
        } catch (error) {
            console.error('Error during logout:', error);
            this.clearSession();
            window.location.reload();
        }
    }

    clearSession() {
        sessionStorage.clear();
        this.currentUser = null;
        this.isLoggedIn = false;
    }

    // Public method to update user data (called after login)
    setUser(userData) {
        this.currentUser = userData;
        this.isLoggedIn = true;
        sessionStorage.setItem('currentUser', JSON.stringify(userData));
        sessionStorage.setItem('loginTime', new Date().getTime().toString());
        this.updateUI();
    }
}

// Initialize the user session manager
const userSession = new UserSessionManager();

// Export for use in other scripts
window.userSession = userSession; 