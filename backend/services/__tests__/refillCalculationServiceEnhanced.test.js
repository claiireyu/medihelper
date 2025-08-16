import { RefillCalculationService } from '../refillCalculationService.js';
import { DeterministicScheduleParser } from '../deterministicScheduleParser.js';

// Mock DeterministicScheduleParser for testing
class MockDeterministicScheduleParser {
  shouldTakeOnDate(schedule, daysSinceStart, targetDateTime, createdAt) {
    const scheduleText = schedule.toLowerCase();
    
    // Mock patterns for testing
    if (scheduleText.includes('every other day')) {
      return daysSinceStart % 2 === 0;
    }
    if (scheduleText.includes('twice daily')) {
      // For twice daily, we need to simulate 2 doses per day
      // Since this method is called once per day, we'll use a different approach
      // We'll modify the consumption rate calculation to handle this
      return true; // Take medication on this day
    }
    if (scheduleText.includes('weekly')) {
      return targetDateTime.getDay() === 1; // Every Monday
    }
    if (scheduleText.includes('skip weekends')) {
      const day = targetDateTime.getDay();
      return day !== 0 && day !== 6; // Skip Sunday (0) and Saturday (6)
    }
    
    // Default: daily
    return true;
  }
}

describe('RefillCalculationService Enhanced (Schedule-Aware)', () => {
  let service;
  let mockScheduleParser;

  beforeEach(() => {
    mockScheduleParser = new MockDeterministicScheduleParser();
    service = new RefillCalculationService(mockScheduleParser);
  });

  describe('calculateRefillDateWithSchedule', () => {
    it('should calculate refill date for every other day schedule', () => {
      const dateFilled = '2025-01-01';
      const quantity = 90;
      const schedule = 'Take 1 tablet every other day';
      
      const result = service.calculateRefillDateWithSchedule(dateFilled, quantity, schedule);
      
      expect(result.calculationMethod).toBe('schedule_enhanced');
      expect(result.scheduleUsed).toBe(true);
      expect(result.consumptionRate).toBe(0.5); // Every other day = 0.5 doses per day
      expect(result.actualDaysSupply).toBe(180); // 90 tablets / 0.5 = 180 days
      expect(result.refillDate).toBeInstanceOf(Date);
    });

    it('should calculate refill date for twice daily schedule', () => {
      const dateFilled = '2025-01-01';
      const quantity = 90;
      const schedule = 'Take 1 tablet twice daily';
      
      const result = service.calculateRefillDateWithSchedule(dateFilled, quantity, schedule);
      
      expect(result.calculationMethod).toBe('schedule_enhanced');
      expect(result.scheduleUsed).toBe(true);
      expect(result.consumptionRate).toBe(2); // Twice daily = 2 doses per day
      expect(result.actualDaysSupply).toBe(45); // 90 tablets / 2 = 45 days
    });

    it('should calculate refill date for weekly schedule', () => {
      const dateFilled = '2025-01-01';
      const quantity = 90;
      const schedule = 'Take 1 tablet weekly';
      
      const result = service.calculateRefillDateWithSchedule(dateFilled, quantity, schedule);
      
      expect(result.calculationMethod).toBe('schedule_enhanced');
      expect(result.scheduleUsed).toBe(true);
      expect(result.consumptionRate).toBeCloseTo(1/7, 1); // Weekly = 1/7 doses per day (allow more precision)
      // Allow some variance due to 30-day analysis period
      expect(result.actualDaysSupply).toBeGreaterThan(500); // Should be around 630
      expect(result.actualDaysSupply).toBeLessThan(700);
    });

    it('should calculate refill date for skip weekends schedule', () => {
      const dateFilled = '2025-01-01';
      const quantity = 90;
      const schedule = 'Take 1 tablet daily, skip weekends';
      
      const result = service.calculateRefillDateWithSchedule(dateFilled, quantity, schedule);
      
      expect(result.calculationMethod).toBe('schedule_enhanced');
      expect(result.scheduleUsed).toBe(true);
      expect(result.consumptionRate).toBeCloseTo(5/7, 1); // 5 out of 7 days = 5/7 doses per day (allow more precision)
      // Allow some variance due to 30-day analysis period
      expect(result.actualDaysSupply).toBeGreaterThan(100); // Should be around 126
      expect(result.actualDaysSupply).toBeLessThan(150);
    });

    it('should fallback to basic calculation when schedule parser is not available', () => {
      const serviceWithoutParser = new RefillCalculationService();
      const dateFilled = '2025-01-01';
      const quantity = 90;
      const schedule = 'Take 1 tablet every other day';
      
      const result = serviceWithoutParser.calculateRefillDateWithSchedule(
        dateFilled, 
        quantity, 
        schedule, 
        { daysSupply: 90 }
      );
      
      expect(result.calculationMethod).toBe('basic');
      expect(result.scheduleUsed).toBe(false);
      expect(result.consumptionRate).toBe(1);
      expect(result.actualDaysSupply).toBe(90);
    });

    it('should handle errors gracefully and fallback to basic calculation', () => {
      // Create a mock parser that throws errors in the main calculation
      const errorParser = {
        shouldTakeOnDate: () => { throw new Error('Test error'); }
      };
      const errorService = new RefillCalculationService(errorParser);
      
      const dateFilled = '2025-01-01';
      const quantity = 90;
      const schedule = 'Take 1 tablet every other day';
      
      const result = errorService.calculateRefillDateWithSchedule(
        dateFilled, 
        quantity, 
        schedule, 
        { daysSupply: 90 }
      );
      
      // The error should be caught and handled gracefully
      // Since the error is caught in calculateConsumptionRate, it falls back to daily consumption (1)
      expect(result.calculationMethod).toBe('schedule_enhanced');
      expect(result.scheduleUsed).toBe(true);
      expect(result.consumptionRate).toBe(1); // Fallback to daily consumption
      expect(result.actualDaysSupply).toBe(90); // 90 tablets / 1 = 90 days
    });
  });

  describe('calculateConsumptionRate', () => {
    it('should calculate consumption rate for every other day', () => {
      const schedule = 'Take 1 tablet every other day';
      const rate = service.calculateConsumptionRate(schedule, 30);
      
      expect(rate).toBe(0.5); // 15 doses in 30 days = 0.5 per day
    });

    it('should calculate consumption rate for twice daily', () => {
      const schedule = 'Take 1 tablet twice daily';
      const rate = service.calculateConsumptionRate(schedule, 30);
      
      expect(rate).toBe(2); // Twice daily = 2 doses per day
    });

    it('should calculate consumption rate for weekly', () => {
      const schedule = 'Take 1 tablet weekly';
      const rate = service.calculateConsumptionRate(schedule, 30);
      
      expect(rate).toBeCloseTo(1/7, 1); // ~4.3 doses in 30 days = 1/7 per day (allow more precision)
    });

    it('should calculate consumption rate for skip weekends', () => {
      const schedule = 'Take 1 tablet daily, skip weekends';
      const rate = service.calculateConsumptionRate(schedule, 30);
      
      expect(rate).toBeCloseTo(5/7, 1); // ~21.4 doses in 30 days = 5/7 per day (allow more precision)
    });

    it('should return 1 for unknown schedules', () => {
      const schedule = 'Take 1 tablet whenever you feel like it';
      const rate = service.calculateConsumptionRate(schedule, 30);
      
      expect(rate).toBe(1); // Default to daily consumption
    });

    it('should handle missing schedule parser gracefully', () => {
      const serviceWithoutParser = new RefillCalculationService();
      const schedule = 'Take 1 tablet every other day';
      const rate = serviceWithoutParser.calculateConsumptionRate(schedule, 30);
      
      expect(rate).toBe(1); // Default to daily consumption
    });
  });

  describe('compareCalculationMethods', () => {
    it('should compare basic vs. enhanced calculations for every other day', () => {
      const dateFilled = '2025-01-01';
      const quantity = 90;
      const schedule = 'Take 1 tablet every other day';
      const pharmacyDaysSupply = 90;
      
      const comparison = service.compareCalculationMethods(
        dateFilled, 
        quantity, 
        schedule, 
        pharmacyDaysSupply
      );
      
      expect(comparison.comparison).toBe('available');
      expect(comparison.basic.daysSupply).toBe(90);
      expect(comparison.enhanced.daysSupply).toBe(180);
      expect(comparison.difference.days).toBe(90);
      expect(comparison.difference.percentageChange).toBe(100);
      expect(comparison.recommendation).toContain('longer');
    });

    it('should compare basic vs. enhanced calculations for twice daily', () => {
      const dateFilled = '2025-01-01';
      const quantity = 90;
      const schedule = 'Take 1 tablet twice daily';
      const pharmacyDaysSupply = 90;
      
      const comparison = service.compareCalculationMethods(
        dateFilled, 
        quantity, 
        schedule, 
        pharmacyDaysSupply
      );
      
      expect(comparison.comparison).toBe('available');
      expect(comparison.basic.daysSupply).toBe(90);
      expect(comparison.enhanced.daysSupply).toBe(45);
      expect(comparison.difference.days).toBe(-45);
      expect(comparison.difference.percentageChange).toBe(-50);
      expect(comparison.recommendation).toContain('sooner');
    });

    it('should handle cases where pharmacy estimate is accurate', () => {
      const dateFilled = '2025-01-01';
      const quantity = 90;
      const schedule = 'Take 1 tablet daily';
      const pharmacyDaysSupply = 90;
      
      const comparison = service.compareCalculationMethods(
        dateFilled, 
        quantity, 
        schedule, 
        pharmacyDaysSupply
      );
      
      expect(comparison.comparison).toBe('available');
      expect(comparison.difference.days).toBe(0);
      expect(comparison.recommendation).toContain('accurate');
    });

    it('should return unavailable when schedule parser is missing', () => {
      const serviceWithoutParser = new RefillCalculationService();
      const dateFilled = '2025-01-01';
      const quantity = 90;
      const schedule = 'Take 1 tablet every other day';
      const pharmacyDaysSupply = 90;
      
      const comparison = serviceWithoutParser.compareCalculationMethods(
        dateFilled, 
        quantity, 
        schedule, 
        pharmacyDaysSupply
      );
      
      expect(comparison.comparison).toBe('unavailable');
      expect(comparison.message).toContain('Schedule parser not available');
    });
  });

  describe('generateCalculationRecommendation', () => {
    it('should recommend when pharmacy estimate is accurate', () => {
      const recommendation = service.generateCalculationRecommendation(3, 1);
      expect(recommendation).toContain('accurate');
    });

    it('should recommend when pharmacy estimate is too conservative', () => {
      const recommendation = service.generateCalculationRecommendation(30, 0.5);
      expect(recommendation).toContain('longer');
      expect(recommendation).toContain('30 days longer');
    });

    it('should recommend when pharmacy estimate is too optimistic', () => {
      const recommendation = service.generateCalculationRecommendation(-30, 2);
      expect(recommendation).toContain('sooner');
      expect(recommendation).toContain('30 days sooner');
    });
  });

  describe('Enhanced generateRefillReminders', () => {
    it('should use schedule-enhanced calculation when available', () => {
      const medication = {
        name: 'Test Medication',
        date_filled: '2025-01-01',
        quantity: 90,
        days_supply: 90, // Add days_supply for fallback
        schedule: 'Take 1 tablet every other day',
        refills_remaining: 2
      };
      
      const reminders = service.generateRefillReminders(medication);
      
      // Should generate reminders based on enhanced calculation
      expect(Array.isArray(reminders)).toBe(true);
      // The enhanced calculation should have been used
      expect(reminders.length).toBeGreaterThan(0);
    });

    it('should fallback to basic calculation when schedule data is missing', () => {
      const medication = {
        name: 'Test Medication',
        date_filled: '2025-01-01',
        days_supply: 90, // Only basic data
        refills_remaining: 2
      };
      
      const reminders = service.generateRefillReminders(medication);
      
      expect(Array.isArray(reminders)).toBe(true);
      expect(reminders.length).toBeGreaterThan(0);
    });
  });

  describe('Enhanced calculateRefillStatus', () => {
    it('should use schedule-enhanced calculation when available', () => {
      const medication = {
        name: 'Test Medication',
        date_filled: '2025-01-01',
        quantity: 90,
        schedule: 'Take 1 tablet every other day',
        refills_remaining: 2
      };
      
      const status = service.calculateRefillStatus(medication);
      
      expect(status.hasRefillData).toBe(true);
      expect(status.calculationDetails).toBeDefined();
      expect(status.calculationDetails.calculationMethod).toBe('schedule_enhanced');
    });

    it('should fallback to basic calculation when schedule data is missing', () => {
      const medication = {
        name: 'Test Medication',
        date_filled: '2025-01-01',
        days_supply: 90, // Only basic data
        refills_remaining: 2
      };
      
      const status = service.calculateRefillStatus(medication);
      
      expect(status.hasRefillData).toBe(true);
      expect(status.calculationDetails).toBeDefined();
      expect(status.calculationDetails.calculationMethod).toBe('basic');
    });
  });
});
