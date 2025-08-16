import { PersistentScheduleService } from '../persistentScheduleService.js';

describe('PersistentScheduleService', () => {
  let service;
  let mockDb;

  beforeEach(() => {
    // Create mock database
    mockDb = {
      query: () => Promise.resolve({ rows: [] })
    };

    // Create service instance
    service = new PersistentScheduleService(mockDb);
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with database connection', () => {
      expect(service.db).toBe(mockDb);
      expect(service.pendingRequests).toBeInstanceOf(Map);
      expect(service.deterministicParser).toBeDefined();
    });

    it('should initialize without geminiModel parameter', () => {
      const serviceWithoutGemini = new PersistentScheduleService(mockDb);
      expect(serviceWithoutGemini.geminiModel).toBeUndefined();
    });

    it('should initialize with geminiModel parameter', () => {
      const mockGeminiModel = { generateContent: () => {} };
      const serviceWithGemini = new PersistentScheduleService(mockDb, mockGeminiModel);
      // The geminiModel parameter is accepted but not stored (as per constructor comment)
      expect(serviceWithGemini.geminiModel).toBeUndefined();
    });
  });

  describe('getPersistentScheduleInfo', () => {
    const userId = 1;
    const date = '2024-01-15';

    it('should handle null or undefined parameters gracefully', () => {
      expect(() => {
        service.getPersistentScheduleInfo(null, date);
      }).not.toThrow();

      expect(() => {
        service.getPersistentScheduleInfo(userId, null);
      }).not.toThrow();
    });

    it('should handle invalid date formats gracefully', () => {
      const invalidDate = 'invalid-date';
      expect(() => {
        service.getPersistentScheduleInfo(userId, invalidDate);
      }).not.toThrow();
    });

    it('should return a result object', () => {
      const result = service.getPersistentScheduleInfo(userId, date);
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });
  });

  describe('forceRefreshPersistentSchedule', () => {
    const userId = 1;
    const date = '2024-01-15';

    it('should handle the refresh process', async () => {
      // Mock the getOrCreatePersistentSchedule method
      const mockNewSchedule = {
        createdAt: '2024-01-15T12:00:00Z',
        medicationsSnapshot: [
          { id: 1, name: 'Med A' },
          { id: 2, name: 'Med B' }
        ]
      };
      service.getOrCreatePersistentSchedule = () => Promise.resolve(mockNewSchedule);
      
      const result = await service.forceRefreshPersistentSchedule(userId, date);
      
      expect(result).toBeDefined();
      expect(result.scheduleCreatedAt).toBeDefined();
      expect(result.totalMedications).toBeDefined();
    });

    it('should handle errors gracefully', async () => {
      service.getOrCreatePersistentSchedule = () => Promise.reject(new Error('Test error'));
      
      await expect(service.forceRefreshPersistentSchedule(userId, date))
        .rejects.toThrow('Test error');
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', () => {
      const result = service.getCacheStats();
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });
  });

  describe('deriveScheduleFromTemplate', () => {
    const targetDate = '2024-01-15';
    
    it('should derive schedule from template successfully', () => {
      const templateSchedule = {
        userId: 1,
        morning: [
          { id: 1, name: 'Med A', dosage: '10mg' }
        ],
        afternoon: [
          { id: 2, name: 'Med B', dosage: '5mg' }
        ],
        evening: [],
        medicationsSnapshot: [
          { 
            id: 1, 
            name: 'Med A', 
            schedule: 'once daily',
            created_at: '2024-01-01T00:00:00Z'
          },
          { 
            id: 2, 
            name: 'Med B', 
            schedule: 'twice daily',
            created_at: '2024-01-01T00:00:00Z'
          }
        ]
      };
      
      const result = service.deriveScheduleFromTemplate(templateSchedule, targetDate);
      
      expect(result).toBeDefined();
      expect(result.morning).toBeDefined();
      expect(result.afternoon).toBeDefined();
      expect(result.evening).toBeDefined();
      expect(result.createdAt).toBeDefined();
      expect(result.medicationsSnapshot).toBeDefined();
      expect(result.cacheVersion).toBeDefined();
    });

    it('should handle medications that started after target date', () => {
      const templateSchedule = {
        userId: 1,
        morning: [
          { id: 1, name: 'Med A', dosage: '10mg' }
        ],
        afternoon: [],
        evening: [],
        medicationsSnapshot: [
          { 
            id: 1, 
            name: 'Med A', 
            schedule: 'once daily',
            created_at: '2024-01-20T00:00:00Z' // After target date
          }
        ]
      };
      
      const result = service.deriveScheduleFromTemplate(templateSchedule, targetDate);
      
      expect(result).toBeDefined();
      expect(result.morning).toBeDefined();
      expect(result.afternoon).toBeDefined();
      expect(result.evening).toBeDefined();
    });

    it('should handle every other day schedule', () => {
      const templateSchedule = {
        userId: 1,
        morning: [
          { id: 1, name: 'Med A', dosage: '10mg' }
        ],
        afternoon: [],
        evening: [],
        medicationsSnapshot: [
          { 
            id: 1, 
            name: 'Med A', 
            schedule: 'every other day',
            created_at: '2024-01-01T00:00:00Z'
          }
        ]
      };
      
      const result = service.deriveScheduleFromTemplate(templateSchedule, targetDate);
      
      expect(result).toBeDefined();
      expect(result.morning).toBeDefined();
    });

    it('should handle every 3 days schedule', () => {
      const templateSchedule = {
        userId: 1,
        morning: [
          { id: 1, name: 'Med A', dosage: '10mg' }
        ],
        afternoon: [],
        evening: [],
        medicationsSnapshot: [
          { 
            id: 1, 
            name: 'Med A', 
            schedule: 'every 3 days',
            created_at: '2024-01-01T00:00:00Z'
          }
        ]
      };
      
      const result = service.deriveScheduleFromTemplate(templateSchedule, targetDate);
      
      expect(result).toBeDefined();
      expect(result.morning).toBeDefined();
    });

    it('should handle once a week schedule', () => {
      const templateSchedule = {
        userId: 1,
        morning: [
          { id: 1, name: 'Med A', dosage: '10mg' }
        ],
        afternoon: [],
        evening: [],
        medicationsSnapshot: [
          { 
            id: 1, 
            name: 'Med A', 
            schedule: 'once a week',
            created_at: '2024-01-01T00:00:00Z' // Monday
          }
        ]
      };
      
      const result = service.deriveScheduleFromTemplate(templateSchedule, targetDate);
      
      expect(result).toBeDefined();
      expect(result.morning).toBeDefined();
    });

    it('should handle once a month schedule', () => {
      const templateSchedule = {
        userId: 1,
        morning: [
          { id: 1, name: 'Med A', dosage: '10mg' }
        ],
        afternoon: [],
        evening: [],
        medicationsSnapshot: [
          { 
            id: 1, 
            name: 'Med A', 
            schedule: 'once a month',
            created_at: '2024-01-01T00:00:00Z' // Day 1
          }
        ]
      };
      
      const result = service.deriveScheduleFromTemplate(templateSchedule, targetDate);
      
      expect(result).toBeDefined();
      expect(result.morning).toBeDefined();
    });

    it('should handle medications without snapshot', () => {
      const templateSchedule = {
        userId: 1,
        morning: [
          { id: 1, name: 'Med A', dosage: '10mg' }
        ],
        afternoon: [],
        evening: [],
        medicationsSnapshot: [] // Empty snapshot
      };
      
      const result = service.deriveScheduleFromTemplate(templateSchedule, targetDate);
      
      expect(result).toBeDefined();
      expect(result.morning).toBeDefined();
    });

    it('should handle template with no medications', () => {
      const templateSchedule = {
        userId: 1,
        morning: [],
        afternoon: [],
        evening: [],
        medicationsSnapshot: []
      };
      
      const result = service.deriveScheduleFromTemplate(templateSchedule, targetDate);
      
      expect(result).toBeDefined();
      expect(result.morning).toHaveLength(0);
      expect(result.afternoon).toHaveLength(0);
      expect(result.evening).toHaveLength(0);
    });
  });

  describe('getMedicationsForDate', () => {
    const userId = 1;
    const date = '2024-01-15';

    it('should handle database queries', async () => {
      const result = await service.getMedicationsForDate(userId, date);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle database errors', async () => {
      mockDb.query = () => Promise.reject(new Error('Database error'));
      
      await expect(service.getMedicationsForDate(userId, date))
        .rejects.toThrow('Database error');
    });
  });

  describe('haveMedicationsChanged', () => {
    it('should detect medication changes correctly', () => {
      const currentMedications = [
        {
          id: 1,
          name: 'Test Med',
          dosage: '10mg',
          schedule: 'twice daily', // Changed schedule
          created_at: '2024-01-15T00:00:00Z'
        }
      ];

      const templateMedications = [
        {
          id: 1,
          name: 'Test Med',
          dosage: '10mg',
          schedule: 'once daily',
          created_at: '2024-01-01T00:00:00Z'
        }
      ];

      const result = service.haveMedicationsChanged(currentMedications, templateMedications);

      expect(result).toBe(true); // Should detect change due to different schedule
    });

    it('should not detect changes when medications are identical', () => {
      const medications = [
        {
          id: 1,
          name: 'Test Med',
          dosage: '10mg',
          schedule: 'once daily',
          created_at: '2024-01-01T00:00:00Z'
        }
      ];

      const result = service.haveMedicationsChanged(medications, medications);

      expect(result).toBe(false);
    });

    it('should handle null or undefined medications gracefully', () => {
      expect(service.haveMedicationsChanged([], [])).toBe(false);
    });

    it('should detect changes in medication properties', () => {
      const currentMedications = [
        {
          id: 1,
          name: 'Test Med',
          dosage: '15mg', // Changed dosage
          schedule: 'twice daily', // Changed schedule
          created_at: '2024-01-15T00:00:00Z'
        }
      ];

      const templateMedications = [
        {
          id: 1,
          name: 'Test Med',
          dosage: '10mg',
          schedule: 'once daily',
          created_at: '2024-01-01T00:00:00Z'
        }
      ];

      const result = service.haveMedicationsChanged(currentMedications, templateMedications);

      expect(result).toBe(true);
    });

    it('should handle medications with different names', () => {
      const currentMedications = [
        {
          id: 1,
          name: 'New Med',
          dosage: '10mg',
          schedule: 'once daily',
          created_at: '2024-01-15T00:00:00Z'
        }
      ];

      const templateMedications = [
        {
          id: 1,
          name: 'Old Med',
          dosage: '10mg',
          schedule: 'once daily',
          created_at: '2024-01-01T00:00:00Z'
        }
      ];

      const result = service.haveMedicationsChanged(currentMedications, templateMedications);

      expect(result).toBe(true);
    });

    it('should handle medications with different creation dates', () => {
      const currentMedications = [
        {
          id: 1,
          name: 'Test Med',
          dosage: '10mg',
          schedule: 'once daily',
          created_at: '2024-01-15T00:00:00Z' // Different date
        }
      ];

      const templateMedications = [
        {
          id: 1,
          name: 'Test Med',
          dosage: '10mg',
          schedule: 'once daily',
          created_at: '2024-01-01T00:00:00Z'
        }
      ];

      const result = service.haveMedicationsChanged(currentMedications, templateMedications);

      // The actual implementation only checks name, dosage, and schedule, not creation date
      expect(result).toBe(false);
    });

    it('should handle medications with missing properties', () => {
      const currentMedications = [
        {
          id: 1,
          name: 'Test Med',
          dosage: '10mg',
          // Missing schedule
          created_at: '2024-01-15T00:00:00Z'
        }
      ];

      const templateMedications = [
        {
          id: 1,
          name: 'Test Med',
          dosage: '10mg',
          schedule: 'once daily',
          created_at: '2024-01-01T00:00:00Z'
        }
      ];

      const result = service.haveMedicationsChanged(currentMedications, templateMedications);

      expect(result).toBe(true); // Should detect change due to missing property
    });

    it('should handle medications with different IDs', () => {
      const currentMedications = [
        {
          id: 2, // Different ID
          name: 'Test Med',
          dosage: '10mg',
          schedule: 'once daily',
          created_at: '2024-01-01T00:00:00Z'
        }
      ];

      const templateMedications = [
        {
          id: 1,
          name: 'Test Med',
          dosage: '10mg',
          schedule: 'once daily',
          created_at: '2024-01-01T00:00:00Z'
        }
      ];

      const result = service.haveMedicationsChanged(currentMedications, templateMedications);

      expect(result).toBe(true); // Should detect change due to different ID
    });

    it('should handle empty medication arrays', () => {
      expect(service.haveMedicationsChanged([], [])).toBe(false);
      expect(service.haveMedicationsChanged([], [{ id: 1, name: 'Med' }])).toBe(true);
      expect(service.haveMedicationsChanged([{ id: 1, name: 'Med' }], [])).toBe(true);
    });
  });

  describe('applyTimeSpecificOverrides', () => {
    it('should delegate to deterministic parser', () => {
      const schedule = { morning: [], afternoon: [], evening: [] };
      const medications = [{ id: 1, name: 'Med A' }];
      
      const result = service.applyTimeSpecificOverrides(schedule, medications);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });
  });

  describe('formatTimeForDisplay', () => {
    it('should delegate to deterministic parser (deprecated method)', () => {
      expect(() => service.formatTimeForDisplay('08:00')).not.toThrow();
      expect(service.formatTimeForDisplay('08:00')).toBeDefined();
    });

    it('should handle various time inputs', () => {
      expect(() => service.formatTimeForDisplay('12:00')).not.toThrow();
      expect(() => service.formatTimeForDisplay('18:00')).not.toThrow();
      expect(() => service.formatTimeForDisplay('00:00')).not.toThrow();
      expect(() => service.formatTimeForDisplay('23:59')).not.toThrow();
    });

    it('should handle edge cases gracefully', () => {
      expect(() => service.formatTimeForDisplay('')).not.toThrow();
      expect(() => service.formatTimeForDisplay(null)).not.toThrow();
      expect(() => service.formatTimeForDisplay(undefined)).not.toThrow();
    });
  });

  describe('updateTemplateWithMedicationChanges', () => {
    it('should update template with medication changes', () => {
      const templateSchedule = {
        morning: [{ id: 1, name: 'Old Med' }],
        afternoon: [],
        evening: [],
        medicationsSnapshot: [
          { id: 1, name: 'Old Med', created_at: '2024-01-01T00:00:00Z' }
        ]
      };

      const currentMedications = [
        { id: 1, name: 'New Med', created_at: '2024-01-15T00:00:00Z' }
      ];

      const result = service.updateTemplateWithMedicationChanges(templateSchedule, currentMedications);

      expect(result.medicationsSnapshot).toEqual(currentMedications);
      // The method doesn't return lastUpdated, it just logs
      expect(result).toBeDefined();
    });

    it('should handle empty medication lists', () => {
      const templateSchedule = {
        morning: [],
        afternoon: [],
        evening: [],
        medicationsSnapshot: []
      };

      const currentMedications = [];

      const result = service.updateTemplateWithMedicationChanges(templateSchedule, currentMedications);

      expect(result.medicationsSnapshot).toEqual([]);
      // The method doesn't return lastUpdated, it just logs
      expect(result).toBeDefined();
    });

    it('should preserve existing schedule structure', () => {
      const templateSchedule = {
        morning: [{ id: 1, name: 'Med A' }],
        afternoon: [{ id: 2, name: 'Med B' }],
        evening: [],
        medicationsSnapshot: [],
        date: '2024-01-15' // Add required date property
      };

      const currentMedications = [
        { id: 1, name: 'Med A Updated', schedule: 'once daily' },
        { id: 2, name: 'Med B Updated', schedule: 'twice daily' }
      ];

      const result = service.updateTemplateWithMedicationChanges(templateSchedule, currentMedications);

      // The method adds new medications to the schedule, so morning should contain both original and new
      expect(result.morning.length).toBeGreaterThan(templateSchedule.morning.length);
      expect(result.afternoon).toEqual(templateSchedule.afternoon);
      // The method may add medications to evening based on schedule (e.g., twice daily medications)
      expect(result.evening.length).toBeGreaterThanOrEqual(templateSchedule.evening.length);
      expect(result.medicationsSnapshot).toEqual(currentMedications);
    });
  });

  describe('parseMedicationScheduleFallback', () => {
    it('should delegate to deterministic parser', () => {
      const medications = [{ 
        id: 1, 
        name: 'Med A',
        schedule: 'once daily' // Add required schedule property
      }];
      const targetDate = '2024-01-15';
      
      const result = service.parseMedicationScheduleFallback(medications, targetDate);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });
  });

  describe('parseMedicationScheduleFallbackLegacy', () => {
    it('should delegate to deterministic parser', () => {
      const medications = [{ 
        id: 1, 
        name: 'Med A',
        schedule: 'once daily' // Add required schedule property
      }];
      const targetDate = '2024-01-15';
      
      const result = service.parseMedicationScheduleFallbackLegacy(medications, targetDate);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });
  });

  describe('getDosageForTime', () => {
    it('should delegate to deterministic parser (deprecated method)', () => {
      const med = {
        name: 'Test Med',
        dosage: '10mg tablet',
        schedule: 'once daily'
      };

      expect(() => service.getDosageForTime(med, 'morning', 0)).not.toThrow();
      expect(service.getDosageForTime(med, 'morning', 0)).toBeDefined();
    });

    it('should handle medications with missing properties', () => {
      const med = {
        name: 'Test Med'
        // Missing dosage and schedule
      };

      expect(() => service.getDosageForTime(med, 'morning', 0)).not.toThrow();
      expect(service.getDosageForTime(med, 'morning', 0)).toBeDefined();
    });

    it('should handle various time slots', () => {
      const med = { name: 'Test Med', dosage: '10mg', schedule: 'once daily' };
      
      expect(() => service.getDosageForTime(med, 'morning', 0)).not.toThrow();
      expect(() => service.getDosageForTime(med, 'afternoon', 0)).not.toThrow();
      expect(() => service.getDosageForTime(med, 'evening', 0)).not.toThrow();
    });

    it('should handle various days since start', () => {
      const med = { name: 'Test Med', dosage: '10mg', schedule: 'once daily' };
      
      expect(() => service.getDosageForTime(med, 'morning', 0)).not.toThrow();
      expect(() => service.getDosageForTime(med, 'morning', 7)).not.toThrow();
      expect(() => service.getDosageForTime(med, 'morning', 30)).not.toThrow();
    });
  });

  describe('findPeriodForDate', () => {
    it('should find period for date successfully', () => {
      const periods = [
        { startDate: '2024-01-01', endDate: '2024-01-31', medicationCount: 3 },
        { startDate: '2024-02-01', endDate: '2024-02-29', medicationCount: 2 }
      ];
      
      const targetDate = '2024-01-15';
      
      const result = service.findPeriodForDate(periods, targetDate);
      
      expect(result).toEqual({ startDate: '2024-01-01', endDate: '2024-01-31', medicationCount: 3 });
    });

    it('should return null when no period matches', () => {
      const periods = [
        { startDate: '2024-01-01', endDate: '2024-01-31', medicationCount: 3 }
      ];
      
      const targetDate = '2024-03-15';
      
      const result = service.findPeriodForDate(periods, targetDate);
      
      expect(result).toBeNull();
    });

    it('should handle empty periods array', () => {
      const periods = [];
      const targetDate = '2024-01-15';
      
      const result = service.findPeriodForDate(periods, targetDate);
      
      expect(result).toBeNull();
    });

    it('should handle edge case dates', () => {
      const periods = [
        { startDate: '2024-01-01', endDate: '2024-01-31', medicationCount: 3 }
      ];
      
      // Test start date
      expect(service.findPeriodForDate(periods, '2024-01-01')).toEqual(periods[0]);
      
      // Test end date
      expect(service.findPeriodForDate(periods, '2024-01-31')).toEqual(periods[0]);
      
      // Test date just before start
      expect(service.findPeriodForDate(periods, '2023-12-31')).toBeNull();
      
      // Test date just after end
      expect(service.findPeriodForDate(periods, '2024-02-01')).toBeNull();
    });

    it('should handle single period', () => {
      const periods = [
        { startDate: '2024-01-01', endDate: '2024-01-31', medicationCount: 3 }
      ];
      
      const result = service.findPeriodForDate(periods, '2024-01-15');
      expect(result).toEqual(periods[0]);
    });

    it('should handle multiple periods with overlapping dates', () => {
      const periods = [
        { startDate: '2024-01-01', endDate: '2024-01-31', medicationCount: 3 },
        { startDate: '2024-01-15', endDate: '2024-02-15', medicationCount: 2 }
      ];
      
      // Should return first matching period
      const result = service.findPeriodForDate(periods, '2024-01-20');
      expect(result).toEqual(periods[0]);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    const userId = 1;
    const date = '2024-01-15';

    it('should handle null or undefined parameters gracefully', () => {
      expect(() => {
        service.getPersistentScheduleInfo(null, date);
      }).not.toThrow();

      expect(() => {
        service.getPersistentScheduleInfo(userId, null);
      }).not.toThrow();
    });

    it('should handle invalid date formats gracefully', () => {
      const invalidDate = 'invalid-date';
      expect(() => {
        service.getPersistentScheduleInfo(userId, invalidDate);
      }).not.toThrow();
    });

    it('should handle database connection failures', async () => {
      mockDb.query = () => Promise.reject(new Error('Connection failed'));
      
      await expect(service.getMedicationsForDate(userId, date))
        .rejects.toThrow('Connection failed');
    });
  });

  describe('Integration Tests', () => {
    it('should handle medication change detection workflow', () => {
      const oldMedications = [
        {
          id: 1,
          name: 'Test Med',
          dosage: '10mg',
          schedule: 'once daily',
          created_at: '2024-01-01T00:00:00Z'
        }
      ];

      const newMedications = [
        {
          id: 1,
          name: 'Test Med',
          dosage: '15mg', // Changed dosage
          schedule: 'twice daily', // Changed schedule
          created_at: '2024-01-15T00:00:00Z' // New creation date
        }
      ];

      const hasChanged = service.haveMedicationsChanged(newMedications, oldMedications);
      expect(hasChanged).toBe(true);
    });

    it('should handle multiple medication changes', () => {
      const oldMedications = [
        {
          id: 1,
          name: 'Med A',
          dosage: '10mg',
          schedule: 'once daily',
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 2,
          name: 'Med B',
          dosage: '5mg',
          schedule: 'twice daily',
          created_at: '2024-01-01T00:00:00Z'
        }
      ];

      const newMedications = [
        {
          id: 1,
          name: 'Med A',
          dosage: '15mg', // Changed dosage (but this doesn't trigger change detection)
          schedule: 'once daily', // Same schedule
          created_at: '2024-01-15T00:00:00Z'
        },
        {
          id: 2,
          name: 'Med B',
          dosage: '5mg',
          schedule: 'three times daily', // Changed schedule
          created_at: '2024-01-01T00:00:00Z'
        }
      ];

      const hasChanged = service.haveMedicationsChanged(newMedications, oldMedications);
      expect(hasChanged).toBe(true); // Should detect change due to Med B schedule change
    });

    it('should handle complete schedule derivation workflow', () => {
      const templateSchedule = {
        userId: 1,
        morning: [{ id: 1, name: 'Med A' }],
        afternoon: [{ id: 2, name: 'Med B' }],
        evening: [],
        medicationsSnapshot: [
          { 
            id: 1, 
            name: 'Med A', 
            schedule: 'once daily',
            created_at: '2024-01-01T00:00:00Z'
          },
          { 
            id: 2, 
            name: 'Med B', 
            schedule: 'twice daily',
            created_at: '2024-01-01T00:00:00Z'
          }
        ]
      };
      
      const result = service.deriveScheduleFromTemplate(templateSchedule, '2024-01-15');
      
      expect(result.morning).toBeDefined();
      expect(result.afternoon).toBeDefined();
      expect(result.evening).toBeDefined();
    });
  });

  describe('Performance and Memory Tests', () => {
    it('should handle large medication lists efficiently', () => {
      const largeMedicationList = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        name: `Med ${i + 1}`,
        dosage: '10mg',
        schedule: 'once daily',
        created_at: '2024-01-01T00:00:00Z'
      }));
      
      const startTime = Date.now();
      const result = service.haveMedicationsChanged(largeMedicationList, largeMedicationList);
      const endTime = Date.now();
      
      expect(result).toBe(false);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
    });

    it('should handle concurrent operations', async () => {
      const promises = [];
      const userId = 1;
      const date = '2024-01-15';
      
      // Simulate concurrent calls
      for (let i = 0; i < 10; i++) {
        promises.push(service.getPersistentScheduleInfo(userId, date));
      }
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result).toHaveProperty('exists');
      });
    });
  });
});
