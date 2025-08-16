import { scheduleCache } from '../scheduleCache.js';

describe('ScheduleCache', () => {
  let cache;

  beforeEach(() => {
    // Create a fresh instance for each test by clearing the singleton
    cache = scheduleCache;
    cache.clear();
  });

  afterEach(() => {
    // Clean up after each test
    cache.clear();
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with empty caches', () => {
      expect(cache.cache).toBeInstanceOf(Map);
      expect(cache.persistentSchedules).toBeInstanceOf(Map);
      expect(cache.templateSchedules).toBeInstanceOf(Map);
      expect(cache.medicationPeriods).toBeInstanceOf(Map);
      expect(cache.periodSchedules).toBeInstanceOf(Map);
      expect(cache.cacheVersions).toBeInstanceOf(Map);
    });

    it('should have correct default TTL', () => {
      expect(cache.CACHE_TTL).toBe(5 * 60 * 1000); // 5 minutes
    });

    it('should initialize with version 0', () => {
      expect(cache.globalVersion).toBe(0);
    });
  });

  describe('Regular Cache Management', () => {
    it('should set and get cached schedules', () => {
      const schedule = { medications: ['med1', 'med2'] };
      const key = 'user1_2024-01-15';
      
      cache.setCachedSchedule(key, schedule);
      const retrieved = cache.getCachedSchedule(key);
      
      expect(retrieved).toEqual(schedule);
    });

    it('should return null for non-existent keys', () => {
      const result = cache.getCachedSchedule('nonexistent');
      expect(result).toBeNull();
    });

    it('should handle cache TTL expiration', () => {
      const schedule = { medications: ['med1'] };
      const key = 'user1_2024-01-15';
      
      cache.setCachedSchedule(key, schedule);
      
      // Mock Date.now to simulate time passing
      const originalNow = Date.now;
      const mockTime = 1000000;
      Date.now = () => mockTime;
      
      // Set cache with timestamp in the past
      cache.cache.set(key, {
        data: schedule,
        timestamp: mockTime - cache.CACHE_TTL - 1000 // 1 second past TTL
      });
      
      const result = cache.getCachedSchedule(key);
      expect(result).toBeNull();
      
      // Restore original Date.now
      Date.now = originalNow;
    });

    it('should clear all cached schedules', () => {
      cache.setCachedSchedule('key1', { data: 'value1' });
      cache.setCachedSchedule('key2', { data: 'value2' });
      
      expect(cache.cache.size).toBe(2);
      
      cache.clearCache();
      expect(cache.cache.size).toBe(0);
    });

    it('should log cache clearing with size information', () => {
      // Test that the method doesn't throw an error
      expect(() => {
        cache.setCachedSchedule('key1', { data: 'value1' });
        cache.clearCache();
      }).not.toThrow();
    });
  });

  describe('Persistent Schedule Management', () => {
    it('should set and get persistent schedules', () => {
      const schedule = { medications: ['persistent_med'] };
      const key = 'user1_persistent';
      
      cache.setPersistentSchedule(key, schedule);
      const retrieved = cache.getPersistentSchedule(key);
      
      expect(retrieved).toEqual(schedule);
    });

    it('should check if persistent schedule exists', () => {
      const key = 'user1_persistent';
      
      expect(cache.hasPersistentSchedule(key)).toBe(false);
      
      cache.setPersistentSchedule(key, { data: 'value' });
      expect(cache.hasPersistentSchedule(key)).toBe(true);
    });

    it('should remove persistent schedules', () => {
      const key = 'user1_persistent';
      cache.setPersistentSchedule(key, { data: 'value' });
      
      expect(cache.hasPersistentSchedule(key)).toBe(true);
      
      const removed = cache.removePersistentSchedule(key);
      expect(removed).toBe(true);
      expect(cache.hasPersistentSchedule(key)).toBe(false);
    });

    it('should return false when removing non-existent persistent schedule', () => {
      const result = cache.removePersistentSchedule('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('Template Schedule Management', () => {
    it('should set and get template schedules', () => {
      const template = { pattern: 'once daily', timeSlots: ['morning'] };
      const userId = 'user1';
      
      cache.setTemplateSchedule(userId, template);
      const retrieved = cache.getTemplateSchedule(userId);
      
      expect(retrieved).toEqual(template);
    });

    it('should check if template schedule exists', () => {
      const userId = 'user1';
      
      expect(cache.hasTemplateSchedule(userId)).toBe(false);
      
      cache.setTemplateSchedule(userId, { data: 'value' });
      expect(cache.hasTemplateSchedule(userId)).toBe(true);
    });

    it('should remove template schedules', () => {
      const userId = 'user1';
      cache.setTemplateSchedule(userId, { data: 'value' });
      
      expect(cache.hasTemplateSchedule(userId)).toBe(true);
      
      const removed = cache.removeTemplateSchedule(userId);
      expect(removed).toBe(true);
      expect(cache.hasTemplateSchedule(userId)).toBe(false);
    });

    it('should return false when removing non-existent template schedule', () => {
      const result = cache.removeTemplateSchedule('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('Period-Based Caching', () => {
    it('should set and get medication periods', () => {
      const userId = 'user1';
      const periods = [
        { startDate: '2024-01-01', endDate: '2024-01-31', medicationCount: 3 },
        { startDate: '2024-02-01', endDate: '2024-02-29', medicationCount: 2 }
      ];
      
      cache.setMedicationPeriods(userId, periods);
      const retrieved = cache.getMedicationPeriods(userId);
      
      expect(retrieved).toEqual(periods);
    });

    it('should return empty array for non-existent user periods', () => {
      const result = cache.getMedicationPeriods('nonexistent');
      expect(result).toEqual([]);
    });

    it('should find period for specific date', () => {
      const userId = 'user1';
      const periods = [
        { startDate: '2024-01-01', endDate: '2024-01-31', medicationCount: 3 },
        { startDate: '2024-02-01', endDate: '2024-02-29', medicationCount: 2 }
      ];
      
      cache.setMedicationPeriods(userId, periods);
      
      const period1 = cache.getPeriodForDate(userId, '2024-01-15');
      expect(period1).toEqual(periods[0]);
      
      const period2 = cache.getPeriodForDate(userId, '2024-02-15');
      expect(period2).toEqual(periods[1]);
    });

    it('should return null for date outside all periods', () => {
      const userId = 'user1';
      const periods = [
        { startDate: '2024-01-01', endDate: '2024-01-31', medicationCount: 3 }
      ];
      
      cache.setMedicationPeriods(userId, periods);
      
      const period = cache.getPeriodForDate(userId, '2024-03-15');
      expect(period).toBeNull();
    });

    it('should generate correct period keys', () => {
      const userId = 'user1';
      const periodKey = cache.getPeriodKey(userId, '2024-01-01', '2024-01-15');
      expect(periodKey).toBe(`${userId}_2024-01-01_2024-01-15`);
    });

    it('should set and get period schedules', () => {
      const periodKey = 'user1_2024-01-01_2024-01-15';
      const schedule = { medications: ['morning_med'] };
      
      cache.setPeriodSchedule(periodKey, schedule);
      const retrieved = cache.getPeriodSchedule(periodKey);
      
      expect(retrieved).toEqual(schedule);
    });

    it('should return undefined for non-existent period schedules', () => {
      const result = cache.getPeriodSchedule('nonexistent');
      expect(result).toBeUndefined();
    });

    it('should check if period schedule exists', () => {
      const periodKey = 'user1_2024-01-01_2024-01-15';
      
      expect(cache.hasPeriodSchedule(periodKey)).toBe(false);
      
      cache.setPeriodSchedule(periodKey, { data: 'value' });
      expect(cache.hasPeriodSchedule(periodKey)).toBe(true);
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate all user schedules', () => {
      const userId = 'user1';
      const scheduleKey = `${userId}_2024-01-15`;
      const cacheKey = `${userId}_2024-01-15`;
      
      // Set up test data
      cache.setPersistentSchedule(scheduleKey, { morning: [], afternoon: [], evening: [] });
      cache.setCachedSchedule(cacheKey, { morning: [], afternoon: [], evening: [] });
      cache.setTemplateSchedule(userId, { morning: [], afternoon: [], evening: [], isTemplate: true });
      cache.setMedicationPeriods(userId, [{ startDate: '2024-01-01', endDate: '2024-01-31' }]);
      cache.setPeriodSchedule(`${userId}_2024-01-01_2024-01-15`, { morning: [], afternoon: [], evening: [] });
      
      expect(cache.hasPersistentSchedule(scheduleKey)).toBe(true);
      expect(cache.hasTemplateSchedule(userId)).toBe(true);
      expect(cache.getMedicationPeriods(userId).length).toBe(1);
      
      cache.invalidateUserSchedules(userId);
      
      expect(cache.hasPersistentSchedule(scheduleKey)).toBe(false);
      expect(cache.hasTemplateSchedule(userId)).toBe(false);
      expect(cache.getMedicationPeriods(userId).length).toBe(0);
      expect(cache.getCachedSchedule(cacheKey)).toBeNull();
    });

    it('should increment user cache version on invalidation', () => {
      const userId = 'user1';
      const initialVersion = cache.getUserCacheVersion(userId);
      
      cache.invalidateUserSchedules(userId);
      
      const newVersion = cache.getUserCacheVersion(userId);
      expect(newVersion).toBe(initialVersion + 1);
    });

    it('should force invalidate specific date', () => {
      const userId = 'user1';
      const date = '2024-01-15';
      const scheduleKey = `${userId}_${date}`;
      const cacheKey = `${userId}_${date}`;
      
      cache.setPersistentSchedule(scheduleKey, { morning: [], afternoon: [], evening: [] });
      cache.setCachedSchedule(cacheKey, { morning: [], afternoon: [], evening: [] });
      
      expect(cache.hasPersistentSchedule(scheduleKey)).toBe(true);
      expect(cache.getCachedSchedule(cacheKey)).not.toBeNull();
      
      cache.forceInvalidation(userId, date);
      
      expect(cache.hasPersistentSchedule(scheduleKey)).toBe(false);
      expect(cache.getCachedSchedule(cacheKey)).toBeNull();
    });

    it('should force invalidate all user schedules when no date specified', () => {
      const userId = 'user1';
      const scheduleKey = `${userId}_2024-01-15`;
      
      cache.setPersistentSchedule(scheduleKey, { morning: [], afternoon: [], evening: [] });
      cache.setTemplateSchedule(userId, { morning: [], afternoon: [], evening: [], isTemplate: true });
      
      expect(cache.hasPersistentSchedule(scheduleKey)).toBe(true);
      expect(cache.hasTemplateSchedule(userId)).toBe(true);
      
      cache.forceInvalidation(userId);
      
      expect(cache.hasPersistentSchedule(scheduleKey)).toBe(false);
      expect(cache.hasTemplateSchedule(userId)).toBe(false);
    });
  });

  describe('Cache Version Management', () => {
    it('should get user cache version', () => {
      const userId = 'user1';
      const version = cache.getUserCacheVersion(userId);
      expect(version).toBe(0);
    });

    it('should increment global version', () => {
      const initialVersion = cache.globalVersion;
      
      cache.incrementGlobalVersion();
      expect(cache.globalVersion).toBe(initialVersion + 1);
    });

    it('should check if schedule is stale', () => {
      const userId = 'user1';
      const scheduleKey = `${userId}_2024-01-15`;
      const testSchedule = {
        morning: [],
        afternoon: [],
        evening: [],
        cacheVersion: 1
      };
      
      cache.setPersistentSchedule(scheduleKey, testSchedule);
      
      // Schedule should not be stale initially
      expect(cache.isScheduleStale(userId, scheduleKey)).toBe(false);
      
      // Invalidate user schedules to increment version
      cache.invalidateUserSchedules(userId);
      
      // Schedule should now be stale
      expect(cache.isScheduleStale(userId, scheduleKey)).toBe(true);
    });

    it('should consider non-existent schedules as stale', () => {
      const userId = 'user1';
      const scheduleKey = `${userId}_nonexistent`;
      expect(cache.isScheduleStale(userId, scheduleKey)).toBe(true);
    });
  });

  describe('Utility Methods', () => {
    it('should get all user dates', () => {
      const userId = 'user1';
      const date1 = '2024-01-15';
      const date2 = '2024-01-16';
      
      cache.setPersistentSchedule(`${userId}_${date1}`, { morning: [], afternoon: [], evening: [] });
      cache.setPersistentSchedule(`${userId}_${date2}`, { morning: [], afternoon: [], evening: [] });
      cache.setPersistentSchedule(`${userId}_template`, { morning: [], afternoon: [], evening: [], isTemplate: true });
      cache.setCachedSchedule(`${userId}_${date1}`, { morning: [], afternoon: [], evening: [] });
      
      const dates = cache.getAllUserDates(userId);
      
      expect(dates).toContain(date1);
      expect(dates).toContain(date2);
      expect(dates).not.toContain('template');
    });

    it('should get comprehensive cache statistics', () => {
      const userId = 'user1';
      const date1 = '2024-01-15';
      const date2 = '2024-01-16';
      
      cache.setPersistentSchedule(`${userId}_${date1}`, { morning: [], afternoon: [], evening: [] });
      cache.setPersistentSchedule(`${userId}_${date2}`, { morning: [], afternoon: [], evening: [] });
      cache.setPersistentSchedule(`${userId}_template`, { morning: [], afternoon: [], evening: [], isTemplate: true });
      cache.setCachedSchedule(`${userId}_${date1}`, { morning: [], afternoon: [], evening: [] });
      
      const stats = cache.getCacheStats();
      
      expect(stats.totalCachedSchedules).toBe(1);
      expect(stats.totalPersistentSchedules).toBe(3); // 2 dates + 1 template
      expect(stats.totalTemplateSchedules).toBe(0); // Not set in this test
      expect(stats.totalPeriodSchedules).toBe(0);
      expect(stats.cacheVersions).toBeDefined();
      expect(stats.medicationPeriods).toBeDefined();
      expect(stats.cacheKeys).toContain(`${userId}_${date1}`);
      expect(stats.persistentScheduleKeys).toContain(`${userId}_${date1}`);
      expect(stats.persistentScheduleKeys).toContain(`${userId}_${date2}`);
      expect(stats.persistentScheduleKeys).toContain(`${userId}_template`);
    });

    it('should clear all caches', () => {
      cache.setCachedSchedule('key1', { data: 'value1' });
      cache.setPersistentSchedule('persistent1', { data: 'value2' });
      cache.setTemplateSchedule('user1', { data: 'value3' });
      cache.setPeriodSchedule('period1', { data: 'value4' });
      
      expect(cache.cache.size).toBeGreaterThan(0);
      expect(cache.persistentSchedules.size).toBeGreaterThan(0);
      
      cache.clear();
      
      expect(cache.cache.size).toBe(0);
      expect(cache.persistentSchedules.size).toBe(0);
      expect(cache.templateSchedules.size).toBe(0);
      expect(cache.periodSchedules.size).toBe(0);
      expect(cache.medicationPeriods.size).toBe(0);
      expect(cache.cacheVersions.size).toBe(0);
      expect(cache.globalVersion).toBe(0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null and undefined inputs gracefully', () => {
      // Test with null userId
      expect(() => cache.getUserCacheVersion(null)).not.toThrow();
      expect(cache.getUserCacheVersion(null)).toBe(0);
      
      // Test with undefined userId
      expect(() => cache.getUserCacheVersion(undefined)).not.toThrow();
      expect(cache.getUserCacheVersion(undefined)).toBe(0);
      
      // Test with null schedule
      expect(() => cache.setPersistentSchedule('key', null)).not.toThrow();
      expect(cache.getPersistentSchedule('key')).toBeNull();
    });

    it('should handle empty and invalid keys', () => {
      // Test with empty string key
      expect(() => cache.setPersistentSchedule('', {})).not.toThrow();
      expect(cache.getPersistentSchedule('')).toEqual({});
      
      // Test with invalid key types
      expect(() => cache.setPersistentSchedule(123, {})).not.toThrow();
      expect(cache.getPersistentSchedule(123)).toEqual({});
    });

    it('should handle concurrent operations', () => {
      const userId = 'user1';
      const scheduleKey = `${userId}_2024-01-15`;
      
      // Simulate concurrent operations
      cache.setPersistentSchedule(scheduleKey, { morning: [] });
      cache.setPersistentSchedule(scheduleKey, { afternoon: [] });
      cache.setPersistentSchedule(scheduleKey, { evening: [] });
      
      // Should have the last value set
      const result = cache.getPersistentSchedule(scheduleKey);
      expect(result).toEqual({ evening: [] });
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete workflow from creation to invalidation', () => {
      const userId = 'user1';
      const date = '2024-01-15';
      
      // 1. Create template schedule
      const template = {
        morning: [{ id: 1, name: 'Test Med' }],
        afternoon: [],
        evening: [],
        isTemplate: true,
        userId: userId
      };
      cache.setTemplateSchedule(userId, template);
      
      // 2. Create persistent schedule
      const persistentSchedule = {
        morning: [{ id: 1, name: 'Test Med' }],
        afternoon: [],
        evening: [],
        date: date,
        userId: userId,
        cacheVersion: cache.getUserCacheVersion(userId)
      };
      cache.setPersistentSchedule(`${userId}_${date}`, persistentSchedule);
      
      // 3. Verify both exist
      expect(cache.hasTemplateSchedule(userId)).toBe(true);
      expect(cache.hasPersistentSchedule(`${userId}_${date}`)).toBe(true);
      
      // 4. Invalidate all schedules
      cache.invalidateUserSchedules(userId);
      
      // 5. Verify both are removed
      expect(cache.hasTemplateSchedule(userId)).toBe(false);
      expect(cache.hasPersistentSchedule(`${userId}_${date}`)).toBe(false);
      
      // 6. Verify version incremented
      expect(cache.getUserCacheVersion(userId)).toBe(1);
    });

    it('should handle period-based caching workflow', () => {
      const userId = 'user1';
      const date = '2024-01-15';
      
      // 1. Set medication periods
      const periods = [
        { startDate: '2024-01-01', endDate: '2024-01-31', medicationCount: 2 }
      ];
      cache.setMedicationPeriods(userId, periods);
      
      // 2. Find period for specific date
      const period = cache.getPeriodForDate(userId, date);
      expect(period).toEqual(periods[0]);
      
      // 3. Create period schedule
      const periodKey = cache.getPeriodKey(userId, '2024-01-01', date);
      const periodSchedule = {
        morning: [{ id: 1, name: 'Test Med' }],
        afternoon: [],
        evening: []
      };
      cache.setPeriodSchedule(periodKey, periodSchedule);
      
      // 4. Verify period schedule exists
      expect(cache.hasPeriodSchedule(periodKey)).toBe(true);
      expect(cache.getPeriodSchedule(periodKey)).toEqual(periodSchedule);
      
      // 5. Invalidate user schedules
      cache.invalidateUserSchedules(userId);
      
      // 6. Verify period schedule is removed
      expect(cache.hasPeriodSchedule(periodKey)).toBe(false);
      expect(cache.getMedicationPeriods(userId).length).toBe(0);
    });
  });

  describe('Performance and Memory Tests', () => {
    it('should handle large numbers of schedules efficiently', () => {
      const userId = 'user1';
      const numSchedules = 1000;
      
      // Create many schedules
      for (let i = 0; i < numSchedules; i++) {
        const date = `2024-01-${String(i + 1).padStart(2, '0')}`;
        const scheduleKey = `${userId}_${date}`;
        cache.setPersistentSchedule(scheduleKey, { morning: [], afternoon: [], evening: [] });
      }
      
      expect(cache.persistentSchedules.size).toBe(numSchedules);
      
      // Verify we can still retrieve schedules
      const retrieved = cache.getPersistentSchedule(`${userId}_2024-01-01`);
      expect(retrieved).toBeDefined();
    });

    it('should handle multiple users efficiently', () => {
      const numUsers = 100;
      const numSchedulesPerUser = 10;
      
      // Create schedules for multiple users
      for (let user = 1; user <= numUsers; user++) {
        for (let day = 1; day <= numSchedulesPerUser; day++) {
          const date = `2024-01-${String(day).padStart(2, '0')}`;
          const scheduleKey = `${user}_${date}`;
          cache.setPersistentSchedule(scheduleKey, { morning: [], afternoon: [], evening: [] });
        }
      }
      
      expect(cache.persistentSchedules.size).toBe(numUsers * numSchedulesPerUser);
      
      // Verify we can retrieve schedules for specific users
      const user1Schedules = cache.getAllUserDates(1);
      expect(user1Schedules.length).toBe(numSchedulesPerUser);
    });
  });
});
