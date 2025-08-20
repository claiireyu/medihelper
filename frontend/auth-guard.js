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
        const currentPage = window.location.pathname.split('/').pop();
        if (this.protectedPages.includes(currentPage)) {
            this.protectPage();
        }
        
        window.addEventListener('languageChanged', () => {
            this.updateTextContent();
        });
    }
    
    async protectPage() {
        if (this.isInitialized) {
            return;
        }
        
        this.isInitialized = true;
        
        try {
            await this.waitForAuthManager();
            
            if (!window.authManager.isAuthenticated()) {
                this.redirectToLogin();
                return;
            }
            
        } catch (error) {
            console.error('Auth guard error:', error);
            this.redirectToLogin();
        }
    }
    
    async waitForAuthManager() {
        let attempts = 0;
        const maxAttempts = 20;
        
        while (!window.authManager && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window.authManager) {
            throw new Error('Auth manager not available after timeout');
        }
        
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    redirectToLogin() {
        const currentUrl = window.location.href;
        localStorage.setItem('redirectAfterLogin', currentUrl);
        
        window.location.href = '/';
    }
    
    updateTextContent() {
        if (window.i18n) {
            // Update text content when language changes
            // This can be implemented later if needed
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new AuthGuard();
});

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

window.requireAuth = requireAuth;
