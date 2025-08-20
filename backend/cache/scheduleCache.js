/**
 * Simplified Schedule Cache Service
 * Optimized for deterministic schedule parsing - no AI complexity needed
 */

class ScheduleCache {
    constructor() {
        this.schedules = new Map();        // userId_date → schedule
        this.templates = new Map();        // userId → template
        this.userVersions = new Map();     // userId → version (for invalidation)
    }

    /**
     * Core schedule management
     */
    hasSchedule(scheduleKey) {
        return this.schedules.has(scheduleKey);
    }

    getSchedule(scheduleKey) {
        return this.schedules.get(scheduleKey);
    }

    setSchedule(scheduleKey, schedule, addVersion = false) {
        const key = String(scheduleKey);
        
        // Only add version tracking when explicitly requested
        if (addVersion && schedule && typeof scheduleKey === 'string' && scheduleKey.includes('_')) {
            const parts = scheduleKey.split('_');
            if (parts.length === 2) {
                const userId = parts[0];
                const currentVersion = this.getUserVersion(userId);
                schedule.cacheVersion = currentVersion;
            }
        }
        
        this.schedules.set(key, schedule);
    }

    removeSchedule(scheduleKey) {
        const key = String(scheduleKey);
        return this.schedules.delete(key);
    }

    /**
     * Template schedule management
     */
    hasTemplate(userId) {
        return this.templates.has(String(userId));
    }

    getTemplate(userId) {
        return this.templates.get(String(userId));
    }

    setTemplate(userId, template) {
        const key = String(userId);
        this.templates.set(key, template);
    }

    removeTemplate(userId) {
        const key = String(userId);
        return this.templates.delete(key);
    }

    /**
     * Version management for cache invalidation
     */
    getUserVersion(userId) {
        const key = String(userId);
        return this.userVersions.get(key) || 0;
    }

    incrementUserVersion(userId) {
        const key = String(userId);
        const currentVersion = this.userVersions.get(key) || 0;
        this.userVersions.set(key, currentVersion + 1);
    }

    isScheduleStale(userId, scheduleKey) {
        const schedule = this.schedules.get(scheduleKey);
        if (!schedule || schedule.cacheVersion === undefined) return false;
        
        const currentVersion = this.getUserVersion(userId);
        return currentVersion > schedule.cacheVersion;
    }

    /**
     * Cache invalidation
     */
    clearUser(userId) {
        const key = String(userId);
        
        // Clear all schedules for this user
        const keysToDelete = [];
        for (const scheduleKey of this.schedules.keys()) {
            if (scheduleKey.startsWith(`${key}_`)) {
                keysToDelete.push(scheduleKey);
            }
        }
        
        keysToDelete.forEach(scheduleKey => {
            this.schedules.delete(scheduleKey);
        });

        // Clear template
        this.templates.delete(key);
        
        // Increment version to mark all cached data as stale
        this.incrementUserVersion(key);
    }

    /**
     * Utility methods
     */
    getStats() {
        // Ensure all users have at least version 0 in stats
        const userVersionsStats = {};
        for (const [userId, version] of this.userVersions) {
            userVersionsStats[userId] = version;
        }
        
        return {
            schedules: this.schedules.size,
            templates: this.templates.size,
            userVersions: userVersionsStats,
            totalKeys: this.schedules.size + this.templates.size
        };
    }

    clear() {
        this.schedules.clear();
        this.templates.clear();
        this.userVersions.clear();
    }
}

// Export a singleton instance
export const scheduleCache = new ScheduleCache();
