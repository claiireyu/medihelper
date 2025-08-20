const { scheduleCache } = await import('../scheduleCache.js');

describe('ScheduleCache', () => {
  beforeEach(() => {
    scheduleCache.clear();
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with empty caches', () => {
      expect(scheduleCache.schedules).toBeInstanceOf(Map);
      expect(scheduleCache.templates).toBeInstanceOf(Map);
      expect(scheduleCache.userVersions).toBeInstanceOf(Map);
    });

    it('should initialize with empty maps', () => {
      expect(scheduleCache.schedules.size).toBe(0);
      expect(scheduleCache.templates.size).toBe(0);
      expect(scheduleCache.userVersions.size).toBe(0);
    });
  });

  describe('Schedule Management', () => {
    it('should set and get schedules', () => {
      const key = 'user1_2024-01-15';
      const schedule = { morning: ['med1'], afternoon: ['med2'], evening: [] };
      
      scheduleCache.setSchedule(key, schedule);
      const retrieved = scheduleCache.getSchedule(key);
      
      expect(retrieved).toEqual(schedule);
    });

    it('should return undefined for non-existent keys', () => {
      const result = scheduleCache.getSchedule('nonexistent');
      expect(result).toBeUndefined();
    });

    it('should check if schedule exists', () => {
      const key = 'user1_2024-01-15';
      expect(scheduleCache.hasSchedule(key)).toBe(false);
      
      scheduleCache.setSchedule(key, { data: 'value' });
      expect(scheduleCache.hasSchedule(key)).toBe(true);
    });

    it('should remove schedules', () => {
      const key = 'user1_2024-01-15';
      scheduleCache.setSchedule(key, { data: 'value' });
      
      expect(scheduleCache.hasSchedule(key)).toBe(true);
      
      const result = scheduleCache.removeSchedule(key);
      expect(result).toBe(true);
      expect(scheduleCache.hasSchedule(key)).toBe(false);
    });

    it('should return false when removing non-existent schedule', () => {
      const result = scheduleCache.removeSchedule('nonexistent');
      expect(result).toBe(false);
    });

    it('should clear all schedules', () => {
      scheduleCache.setSchedule('key1', { data: 'value1' });
      scheduleCache.setSchedule('key2', { data: 'value2' });
      
      expect(scheduleCache.schedules.size).toBe(2);
      
      scheduleCache.clear();
      expect(scheduleCache.schedules.size).toBe(0);
    });
  });

  describe('Template Management', () => {
    it('should set and get templates', () => {
      const userId = 'user1';
      const template = { morning: [], afternoon: [], evening: [], isTemplate: true };
      
      scheduleCache.setTemplate(userId, template);
      const retrieved = scheduleCache.getTemplate(userId);
      
      expect(retrieved).toEqual(template);
    });

    it('should check if template exists', () => {
      const userId = 'user1';
      
      expect(scheduleCache.hasTemplate(userId)).toBe(false);
      
      scheduleCache.setTemplate(userId, { data: 'value' });
      expect(scheduleCache.hasTemplate(userId)).toBe(true);
    });

    it('should remove templates', () => {
      const userId = 'user1';
      scheduleCache.setTemplate(userId, { data: 'value' });
      
      expect(scheduleCache.hasTemplate(userId)).toBe(true);
      
      const result = scheduleCache.removeTemplate(userId);
      expect(result).toBe(true);
      expect(scheduleCache.hasTemplate(userId)).toBe(false);
    });

    it('should return false when removing non-existent template', () => {
      const result = scheduleCache.removeTemplate('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('Version Management', () => {
    it('should get user version', () => {
      const userId = 'user1';
      const version = scheduleCache.getUserVersion(userId);
      expect(version).toBe(0);
    });

    it('should increment user version', () => {
      const userId = 'user1';
      const initialVersion = scheduleCache.getUserVersion(userId);
      
      scheduleCache.incrementUserVersion(userId);
      expect(scheduleCache.getUserVersion(userId)).toBe(initialVersion + 1);
    });

    it('should check if schedule is stale', () => {
      const userId = 'user1';
      const scheduleKey = `${userId}_2024-01-15`;
      const testSchedule = {
        morning: ['med1'],
        cacheVersion: 0
      };
      
      scheduleCache.setSchedule(scheduleKey, testSchedule, true);
      
      // Schedule should not be stale initially
      expect(scheduleCache.isScheduleStale(userId, scheduleKey)).toBe(false);
      
      // Increment user version
      scheduleCache.incrementUserVersion(userId);
      
      // Schedule should now be stale
      expect(scheduleCache.isScheduleStale(userId, scheduleKey)).toBe(true);
    });

    it('should consider non-existent schedules as not stale', () => {
      const userId = 'user1';
      const scheduleKey = `${userId}_nonexistent`;
      expect(scheduleCache.isScheduleStale(userId, scheduleKey)).toBe(false);
    });
  });

  describe('Cache Invalidation', () => {
    it('should clear all user data', () => {
      const userId = 'user1';
      const scheduleKey = `${userId}_2024-01-15`;
      
      // Set up test data
      scheduleCache.setSchedule(scheduleKey, { morning: [], afternoon: [], evening: [] });
      scheduleCache.setTemplate(userId, { morning: [], afternoon: [], evening: [], isTemplate: true });
      
      expect(scheduleCache.hasSchedule(scheduleKey)).toBe(true);
      expect(scheduleCache.hasTemplate(userId)).toBe(true);
      
      // Clear user data
      scheduleCache.clearUser(userId);
      
      expect(scheduleCache.hasSchedule(scheduleKey)).toBe(false);
      expect(scheduleCache.hasTemplate(userId)).toBe(false);
    });

    it('should increment user version on clear', () => {
      const userId = 'user1';
      const initialVersion = scheduleCache.getUserVersion(userId);
      
      scheduleCache.clearUser(userId);
      
      expect(scheduleCache.getUserVersion(userId)).toBe(initialVersion + 1);
    });
  });

  describe('Utility Methods', () => {
    it('should get cache statistics', () => {
      const userId = 'user1';
      const date1 = '2024-01-15';
      const date2 = '2024-01-16';
      
      scheduleCache.setSchedule(`${userId}_${date1}`, { morning: [], afternoon: [], evening: [] });
      scheduleCache.setSchedule(`${userId}_${date2}`, { morning: [], afternoon: [], evening: [] });
      scheduleCache.setTemplate(userId, { morning: [], afternoon: [], evening: [], isTemplate: true });
      
      const stats = scheduleCache.getStats();
      
      expect(stats.schedules).toBe(2);
      expect(stats.templates).toBe(1);
      // User versions will only include users that have been accessed
      expect(stats.userVersions).toEqual({});
      expect(stats.totalKeys).toBe(3);
    });

    it('should clear all caches', () => {
      scheduleCache.setSchedule('key1', { data: 'value1' });
      scheduleCache.setTemplate('user1', { data: 'value3' });
      
      expect(scheduleCache.schedules.size).toBe(1);
      expect(scheduleCache.templates.size).toBe(1);
      
      scheduleCache.clear();
      
      expect(scheduleCache.schedules.size).toBe(0);
      expect(scheduleCache.templates.size).toBe(0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null and undefined inputs gracefully', () => {
      // Test with null userId
      expect(() => scheduleCache.getUserVersion(null)).not.toThrow();
      expect(scheduleCache.getUserVersion(null)).toBe(0);
      
      // Test with undefined userId
      expect(() => scheduleCache.getUserVersion(undefined)).not.toThrow();
      expect(scheduleCache.getUserVersion(undefined)).toBe(0);
    });

    it('should handle empty and invalid keys', () => {
      // Test with empty string key
      expect(() => scheduleCache.setSchedule('', {})).not.toThrow();
      expect(scheduleCache.getSchedule('')).toEqual({});
      
      // Test with invalid key types
      expect(() => scheduleCache.setSchedule(null, {})).not.toThrow();
      expect(() => scheduleCache.setSchedule(undefined, {})).not.toThrow();
    });

    it('should handle concurrent operations', () => {
      const scheduleKey = 'user1_2024-01-15';
      
      // Simulate concurrent operations without version tracking
      scheduleCache.setSchedule(scheduleKey, { morning: [] }, false);
      scheduleCache.setSchedule(scheduleKey, { afternoon: [] }, false);
      scheduleCache.setSchedule(scheduleKey, { evening: [] }, false);
      
      // Should have the last value set
      const finalValue = scheduleCache.getSchedule(scheduleKey);
      expect(finalValue).toEqual({ evening: [] });
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete workflow from creation to invalidation', () => {
      const userId = 'user1';
      const date = '2024-01-15';
      const scheduleKey = `${userId}_${date}`;
      
      // 1. Create template
      const template = {
        morning: ['morning_med'],
        afternoon: ['afternoon_med'],
        evening: ['evening_med'],
        isTemplate: true,
        userId: userId
      };
      scheduleCache.setTemplate(userId, template);
      
      // 2. Create schedule
      const schedule = {
        morning: ['morning_med'],
        afternoon: ['afternoon_med'],
        evening: ['evening_med'],
        date: date
      };
      scheduleCache.setSchedule(scheduleKey, schedule);
      
      // 3. Verify data exists
      expect(scheduleCache.hasTemplate(userId)).toBe(true);
      expect(scheduleCache.hasSchedule(scheduleKey)).toBe(true);
      
      // 4. Invalidate user data
      scheduleCache.clearUser(userId);
      
      // 5. Verify data is cleared
      expect(scheduleCache.hasTemplate(userId)).toBe(false);
      expect(scheduleCache.hasSchedule(scheduleKey)).toBe(false);
    });
  });

  describe('Performance and Memory Tests', () => {
    it('should handle large numbers of schedules efficiently', () => {
      const userId = 'user1';
      const numSchedules = 100;
      
      // Create many schedules
      for (let i = 0; i < numSchedules; i++) {
        const date = `2024-01-${String(i + 1).padStart(2, '0')}`;
        const scheduleKey = `${userId}_${date}`;
        scheduleCache.setSchedule(scheduleKey, { morning: [], afternoon: [], evening: [] });
      }
      
      expect(scheduleCache.schedules.size).toBe(numSchedules);
      
      // Verify we can retrieve them
      for (let i = 0; i < numSchedules; i++) {
        const date = `2024-01-${String(i + 1).padStart(2, '0')}`;
        const scheduleKey = `${userId}_${date}`;
        expect(scheduleCache.hasSchedule(scheduleKey)).toBe(true);
      }
    });

    it('should handle multiple users efficiently', () => {
      const numUsers = 10;
      const numDays = 5;
      
      // Create schedules for multiple users
      for (let user = 1; user <= numUsers; user++) {
        const userId = `user${user}`;
        for (let day = 1; day <= numDays; day++) {
          const date = `2024-01-${String(day).padStart(2, '0')}`;
          const scheduleKey = `${userId}_${date}`;
          scheduleCache.setSchedule(scheduleKey, { morning: [], afternoon: [], evening: [] });
        }
      }
      
      expect(scheduleCache.schedules.size).toBe(numUsers * numDays);
      
      // Verify we can clear specific users
      scheduleCache.clearUser('user1');
      expect(scheduleCache.schedules.size).toBe((numUsers - 1) * numDays);
    });
  });
});
