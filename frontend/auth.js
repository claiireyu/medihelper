/**
 * Authentication Handler for HTML-based Frontend
 * Handles Google OAuth login/logout and user state management
 */

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.authContainer = document.getElementById('auth-container');
        this.greetingElement = document.querySelector('[data-greeting]');
        this.isInitializing = false;
        this.init();
    }

    async init() {
        // Prevent multiple simultaneous initializations
        if (this.isInitializing) {
            return;
        }
        
        this.isInitializing = true;
        
        try {
            // Check if user is already authenticated
            await this.checkAuthStatus();
            this.renderAuthUI();
        } catch (error) {
            console.error('Auth initialization error:', error);
        } finally {
            this.isInitializing = false;
        }
    }

    async checkAuthStatus() {
        try {
            console.log('🔐 Checking authentication status...');
            const response = await fetch('/api/auth/user', {
                credentials: 'include'
            });
            
            console.log(`🔐 Auth response status: ${response.status}`);
            
            if (response.ok) {
                const userData = await response.json();
                console.log('🔐 Auth response data:', userData);
                
                if (userData.success && userData.user) {
                    console.log('✅ User authenticated:', userData.user.name);
                    this.currentUser = userData.user;
                    
                    // Load user's saved language preference
                    this.loadUserLanguagePreference();
                    
                    this.updateGreeting();
                    this.renderAuthUI();
                    return true;
                } else {
                    console.log('ℹ️ User not authenticated (no user data)');
                    this.currentUser = null;
                    this.renderAuthUI();
                    return false;
                }
            } else {
                console.log(`ℹ️ Auth response not OK: ${response.status}`);
                this.currentUser = null;
                this.renderAuthUI();
                return false;
            }
        } catch (error) {
            console.error('❌ Error checking auth status:', error);
            this.currentUser = null;
            this.renderAuthUI();
            return false;
        }
    }

    updateGreeting() {
        if (this.greetingElement && this.currentUser) {
            if (window.i18n) {
                this.greetingElement.textContent = window.i18n.t('dashboard.greetingWithName', { name: this.currentUser.name });
            } else {
                this.greetingElement.textContent = `Hi ${this.currentUser.name}`;
            }
        }
    }

    renderAuthUI() {
        if (!this.authContainer) return;

        if (this.currentUser) {
            // User is logged in - show logout button
            const logoutText = window.i18n ? window.i18n.t('auth.logout') : 'Logout';
            this.authContainer.innerHTML = `
                <div class="flex items-center space-x-4">
                    <span class="text-sm text-gray-700">${this.currentUser.name}</span>
                    <button 
                        onclick="authManager.logout()"
                        class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        ${logoutText}
                    </button>
                </div>
            `;
        } else {
            // User is not logged in - show login button
            const signInText = window.i18n ? window.i18n.t('header.signIn') : 'Sign in with Google';
            this.authContainer.innerHTML = `
                <button 
                    onclick="authManager.login()"
                    class="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 hover:border-gray-400 px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-3 shadow-sm hover:shadow-md"
                >
                    <svg class="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span>${signInText}</span>
                </button>
            `;
        }
    }

    login() {
        // Redirect to Google OAuth
        window.location.href = '/auth/google';
    }

    async logout() {
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
            
            if (response.ok) {
                this.currentUser = null;
                this.renderAuthUI();
                this.updateGreeting();
                
                // Redirect to home page
                window.location.href = '/';
            }
        } catch (error) {
            console.error('Error during logout:', error);
        }
    }

    // Check if user is authenticated (for protected pages)
    isAuthenticated() {
        return this.currentUser !== null;
    }

    // Redirect to login if not authenticated
    requireAuth() {
        if (!this.isAuthenticated()) {
            this.login();
            return false;
        }
        return true;
    }
    
    // Load and apply user's saved language preference
    loadUserLanguagePreference() {
        if (window.i18n) {
            const languageLoaded = window.i18n.reloadSavedLanguage();
        } else {
            console.log('⚠️ i18n system not available for language preference loading');
        }
    }
}

// Initialize authentication when DOM is loaded
let authManager;
document.addEventListener('DOMContentLoaded', () => {
    // Prevent multiple initializations
    if (!authManager) {
        authManager = new AuthManager();
        // Make authManager globally available
        window.authManager = authManager;
        console.log('✅ AuthManager initialized and made globally available');
    }
});

// Handle OAuth callback redirects
window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('auth') === 'success') {
        // OAuth was successful, refresh the page to show authenticated state
        setTimeout(() => {
            window.location.href = '/';
        }, 1000);
    }
    
    // Also check if we're coming back from OAuth and ensure language preference is loaded
    if (window.authManager && window.authManager.currentUser && window.i18n) {
        window.authManager.loadUserLanguagePreference();
    }
});
