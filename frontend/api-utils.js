// API utilities for HTML-based frontend
// This file provides the API object and helper functions needed by the HTML pages

const API_BASE = 'http://localhost:8000/api';

// Make API_BASE globally available
window.API_BASE = API_BASE;

// Helper function to get user ID
function getUserId() {
    // Try to get from auth manager first
    if (window.authManager && window.authManager.isAuthenticated()) {
        return window.authManager.getUserId();
    }
    
    // Fallback to localStorage or default
    return localStorage.getItem('userId') || '1';
}

// Helper function to get user's current timezone
function getUserTimezone() {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (error) {
        console.warn('Could not detect timezone, falling back to America/Los_Angeles:', error);
        return 'America/Los_Angeles';
    }
}

// Helper function to make authenticated API requests
async function makeAuthenticatedRequest(url, options = {}) {
    // Set default headers
    const defaultHeaders = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (options.body instanceof FormData) {
        delete defaultHeaders['Content-Type']; // Let browser set it for FormData
    }
    
    try {
        // Make the request with credentials to include session cookies
        const response = await fetch(url, {
            credentials: 'include',
            headers: defaultHeaders,
            ...options
        });
        
        // If we get a 401, redirect to login
        if (response.status === 401) {
            console.log('🔐 401 Authentication required, redirecting to login');
            if (window.authManager) {
                window.authManager.login();
            } else {
                window.location.href = '/';
            }
            throw new Error('Authentication required');
        }
        
        // Log other status codes for debugging
        if (response.status >= 400) {
            console.log(`⚠️ API response status: ${response.status} for ${url}`);
        }
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return response;
        } else {
            // Response is not JSON (probably HTML error page)
            console.error(`❌ API returned non-JSON response for ${url}:`, contentType);
            const text = await response.text();
            console.error('❌ Response preview:', text.substring(0, 200));
            throw new Error(`API returned ${response.status} ${response.statusText} - expected JSON but got ${contentType || 'unknown content type'}`);
        }
        
        return response;
    } catch (error) {
        if (error.message === 'Authentication required') {
            throw error;
        }
        console.error('Network error:', error);
        throw error;
    }
}

// Helper to make timezone-aware API calls
function makeTimezoneAwareAPICall(apiFunction, ...args) {
    const userTimezone = getUserTimezone();
    console.log(`🌍 Using timezone: ${userTimezone}`);
    
    // For getMedicationSchedule, insert timezone as the third parameter
    if (apiFunction === window.API.getMedicationSchedule) {
        const [date, showTakenDoses] = args;
        return apiFunction(date, showTakenDoses, userTimezone);
    }
    
    // For other functions, append timezone to the end
    return apiFunction(...args, userTimezone);
}

// Global API object
window.API = {
    // Dashboard
    getDashboardStats: async () => {
        return makeAuthenticatedRequest(`${API_BASE}/dashboard/stats`);
    },
    
    getNextDose: async () => {
        return makeAuthenticatedRequest(`${API_BASE}/next-dose`);
    },
    
    // Medications
    getMedications: async () => {
        return makeAuthenticatedRequest(`${API_BASE}/medications`);
    },
    
    updateMedication: async (medicationId, medicationData) => {
        return makeAuthenticatedRequest(`${API_BASE}/medications/${medicationId}`, {
            method: 'PUT',
            body: JSON.stringify(medicationData)
        });
    },
    
    deleteMedication: async (medicationId) => {
        return makeAuthenticatedRequest(`${API_BASE}/medications/${medicationId}`, {
            method: 'DELETE'
        });
    },
    
    getMedicationRefills: async (medicationId) => {
        return makeAuthenticatedRequest(`${API_BASE}/medications/${medicationId}/refills`);
    },
    
    checkMedicationEligibility: async (medicationId) => {
        return makeAuthenticatedRequest(`${API_BASE}/medication-eligibility?medicationId=${medicationId}`);
    },
    
    getMedicationSchedule: async (date, showTakenDoses = false, timezone = null) => {
        const params = new URLSearchParams({
            date: date,
            showTaken: showTakenDoses
        });
        
        if (timezone) {
            params.append('timezone', timezone);
        }
        
        return makeAuthenticatedRequest(`${API_BASE}/medications/schedule?${params}`);
    },
    
    // Dose tracking
    logDose: async (medicationId, doseType, photoPath = null, notes = null) => {
        const body = {
            medicationId: medicationId,
            doseType: doseType
        };
        
        if (photoPath) body.photoPath = photoPath;
        if (notes) body.notes = notes;
        
        return makeAuthenticatedRequest(`${API_BASE}/dose-logs`, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    },
    
    getDoseHistory: async (days = 7, timezone = null) => {
        const params = new URLSearchParams({
            days: days
        });
        
        if (timezone) {
            params.append('timezone', timezone);
        }
        
        return makeAuthenticatedRequest(`${API_BASE}/dose-log/history?${params}`);
    },
    
    // Refills
    getRefills: async () => {
        return makeAuthenticatedRequest(`${API_BASE}/refills`);
    },
    
    // Health logs
    logHealthData: async (healthData) => {
        return makeAuthenticatedRequest(`${API_BASE}/health-logs`, {
            method: 'POST',
            body: JSON.stringify(healthData)
        });
    }
};

// Make makeTimezoneAwareAPICall globally available
window.makeTimezoneAwareAPICall = makeTimezoneAwareAPICall;
