// Environment-aware API configuration
const API_BASE = process.env.NODE_ENV === 'production' 
  ? '/api'  // Use relative path in production
  : 'http://localhost:8000/api';

// Fallback for non-module environments (like direct HTML usage)
if (typeof window !== 'undefined') {
  window.API_BASE = API_BASE;
}

function getUserId() {
    if (window.authManager && window.authManager.isAuthenticated()) {
        return window.authManager.getUserId();
    }
    
    return localStorage.getItem('userId') || '1';
}

function getUserTimezone() {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (error) {
        console.warn('Could not detect timezone, falling back to America/Los_Angeles:', error);
        return 'America/Los_Angeles';
    }
}

async function makeAuthenticatedRequest(url, options = {}) {
    const defaultHeaders = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (options.body instanceof FormData) {
        delete defaultHeaders['Content-Type'];
    }
    
    try {
        const response = await fetch(url, {
            credentials: 'include',
            headers: defaultHeaders,
            ...options
        });
        
        if (response.status === 401) {
            if (window.authManager) {
                window.authManager.login();
            } else {
                window.location.href = '/';
            }
            throw new Error('Authentication required');
        }
        
        if (response.status >= 400) {
        }
        
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return response;
        } else {
            console.error(`API returned non-JSON response for ${url}:`, contentType);
            const text = await response.text();
            console.error('Response preview:', text.substring(0, 200));
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

function makeTimezoneAwareAPICall(apiFunction, ...args) {
    const userTimezone = getUserTimezone();
    
    if (apiFunction === window.API.getMedicationSchedule) {
        const [date, showTakenDoses] = args;
        return apiFunction(date, showTakenDoses, userTimezone);
    }

    return apiFunction(...args, userTimezone);
}

window.API = {
    getDashboardStats: async () => {
        return makeAuthenticatedRequest(`${API_BASE}/dashboard/stats`);
    },
    
    getNextDose: async () => {
        return makeAuthenticatedRequest(`${API_BASE}/next-dose`);
    },
    
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
    
    getRefills: async () => {
        return makeAuthenticatedRequest(`${API_BASE}/refills`);
    },
    
    logHealthData: async (healthData) => {
        return makeAuthenticatedRequest(`${API_BASE}/health-logs`, {
            method: 'POST',
            body: JSON.stringify(healthData)
        });
    }
};

window.makeTimezoneAwareAPICall = makeTimezoneAwareAPICall;
