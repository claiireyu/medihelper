// Authentication Guard for HTML pages
// This file provides authentication protection and redirects for protected pages

class AuthGuard {
    constructor() {
        this.protectedPages = [
            'manage-medications.html',
            'add-medication.html',
            'schedule.html',
            'history.html',
            'refill-dashboard.html',
            'verify.html'
        ];
        
        this.isInitialized = false;
        this.init();
    }
    
    init() {
        // Check if current page requires authentication
        const currentPage = window.location.pathname.split('/').pop();
        if (this.protectedPages.includes(currentPage)) {
            this.protectPage();
        }
        
        // Listen for language changes to update any hardcoded text
        window.addEventListener('languageChanged', () => {
            this.updateTextContent();
        });
    }
    
    async protectPage() {
        // Prevent multiple simultaneous auth checks
        if (this.isInitialized) {
            return;
        }
        
        this.isInitialized = true;
        
        try {
            // Wait for auth manager to be available with better timeout handling
            await this.waitForAuthManager();
            
            // Check if user is authenticated
            if (!window.authManager.isAuthenticated()) {
                console.log('User not authenticated, redirecting to login');
                this.redirectToLogin();
                return;
            }
            
            console.log('User authenticated, page access granted');
        } catch (error) {
            console.error('Auth guard error:', error);
            // If there's an error, redirect to login to be safe
            this.redirectToLogin();
        }
    }
    
    async waitForAuthManager() {
        let attempts = 0;
        const maxAttempts = 20; // Increased timeout
        
        while (!window.authManager && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window.authManager) {
            throw new Error('Auth manager not available after timeout');
        }
        
        // Additional wait to ensure auth manager is fully initialized
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    redirectToLogin() {
        // Store the current page to redirect back after login
        const currentUrl = window.location.href;
        localStorage.setItem('redirectAfterLogin', currentUrl);
        
        // Redirect to login
        window.location.href = '/';
    }
    
    updateTextContent() {
        // Update any hardcoded text in the auth guard
        if (window.i18n) {
            console.log('Updating auth guard text content for language:', window.i18n.getCurrentLanguage());
        }
    }
}

// Initialize auth guard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AuthGuard();
});

// Function to check if user can access a specific feature
function requireAuth() {
    if (!window.authManager || !window.authManager.isAuthenticated()) {
        if (window.authManager) {
            window.authManager.login();
        } else {
            window.location.href = '/';
        }
        return false;
    }
    return true;
}

// Make requireAuth globally available
window.requireAuth = requireAuth;
