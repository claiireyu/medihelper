// Refill Calculation Service
// Provides deterministic calculations for medication refill scheduling
// Integrates with DeterministicScheduleParser for schedule-aware calculations
// Following the same pattern as DeterministicScheduleParser

export class RefillCalculationService {
  constructor(deterministicParser = null) {
    // Define reminder timing rules (in days before refill is due)
    this.reminderTiming = {
      early: 14,     // 14 days before (gentle reminder)
      primary: 7,    // 7 days before refill due
      urgent: 3,     // 3 days before refill due
      final: 1       // 1 day before refill due
    };

    // Low supply warning threshold (in days)
    this.lowSupplyThreshold = 7;
    
    // Optional: Reference to DeterministicScheduleParser for enhanced calculations
    this.scheduleParser = deterministicParser;
  }

  /**
   * Calculate when a refill is needed based on date filled and days supply
   * @param {Date|string} dateFilled - Date medication was filled
   * @param {number} daysSupply - Number of days the quantity will last
   * @returns {Date} Date when refill is needed
   */
  calculateRefillDate(dateFilled, daysSupply) {
    if (!dateFilled || !daysSupply || daysSupply <= 0) {
      throw new Error('Invalid date filled or days supply');
    }

    const fillDate = new Date(dateFilled);
    if (isNaN(fillDate.getTime())) {
      throw new Error('Invalid date filled format');
    }

    const refillDate = new Date(fillDate);
    refillDate.setDate(fillDate.getDate() + daysSupply);
    
    return refillDate;
  }

  /**
   * Enhanced refill calculation that considers medication schedule
   * @param {Date|string} dateFilled - Date medication was filled
   * @param {number} quantity - Quantity dispensed
   * @param {string} schedule - Medication schedule (e.g., "every other day", "twice daily")
   * @param {Object} options - Additional options
   * @returns {Object} Enhanced refill calculation result
   */
  calculateRefillDateWithSchedule(dateFilled, quantity, schedule, options = {}) {
    if (!this.scheduleParser) {
      // Fallback to basic calculation if no schedule parser available
      console.warn('No schedule parser available, using basic refill calculation');
      return {
        refillDate: this.calculateRefillDate(dateFilled, options.daysSupply || 30),
        calculationMethod: 'basic',
        consumptionRate: 1,
        actualDaysSupply: options.daysSupply || 30,
        scheduleUsed: false
      };
    }

    try {
      // Calculate consumption rate based on schedule
      const consumptionRate = this.calculateConsumptionRate(schedule, options.dateRange || 30);
      
      // Calculate actual days supply based on consumption pattern
      const actualDaysSupply = Math.ceil(quantity / consumptionRate);
      
      // Calculate refill date
      const refillDate = this.calculateRefillDate(dateFilled, actualDaysSupply);
      
      return {
        refillDate,
        calculationMethod: 'schedule_enhanced',
        consumptionRate,
        actualDaysSupply,
        scheduleUsed: true,
        originalDaysSupply: options.daysSupply,
        schedule: schedule
      };
    } catch (error) {
      console.warn('Schedule-enhanced calculation failed, falling back to basic:', error.message);
      
      // Fallback to basic calculation
      return {
        refillDate: this.calculateRefillDate(dateFilled, options.daysSupply || 30),
        calculationMethod: 'basic_fallback',
        consumptionRate: 1,
        actualDaysSupply: options.daysSupply || 30,
        scheduleUsed: false,
        error: error.message
      };
    }
  }

  /**
   * Calculate consumption rate based on medication schedule
   * @param {string} schedule - Medication schedule text
   * @param {number} dateRange - Number of days to analyze (default: 30)
   * @returns {number} Average daily consumption rate
   */
  calculateConsumptionRate(schedule, dateRange = 30) {
    if (!this.scheduleParser || !schedule) {
      return 1; // Default to daily consumption
    }

    try {
      let totalDoses = 0;
      const today = new Date();
      
      // Handle special schedule patterns that can't be determined by day-by-day analysis
      const scheduleText = schedule.toLowerCase();
      if (scheduleText.includes('twice daily') || scheduleText.includes('2 times daily') || scheduleText.includes('bid')) {
        return 2; // 2 doses per day
      }
      if (scheduleText.includes('three times daily') || scheduleText.includes('3 times daily') || scheduleText.includes('tid')) {
        return 3; // 3 doses per day
      }
      if (scheduleText.includes('four times daily') || scheduleText.includes('4 times daily') || scheduleText.includes('qid')) {
        return 4; // 4 doses per day
      }
      
      // Calculate how many doses would be taken in the date range for other patterns
      for (let i = 0; i < dateRange; i++) {
        const testDate = new Date(today);
        testDate.setDate(today.getDate() + i);
        
        // Use the existing schedule parser logic to determine if medication should be taken
        if (this.scheduleParser.shouldTakeOnDate(schedule, i, testDate, today)) {
          totalDoses++;
        }
      }
      
      const consumptionRate = totalDoses / dateRange;
      console.log(`📊 Calculated consumption rate for "${schedule}": ${consumptionRate} doses per day over ${dateRange} days`);
      
      return consumptionRate;
    } catch (error) {
      console.warn('Failed to calculate consumption rate from schedule:', error.message);
      return 1; // Fallback to daily consumption
    }
  }

  /**
   * Calculate days until refill is needed
   * @param {Date|string} dateFilled - Date medication was filled
   * @param {number} daysSupply - Number of days the quantity will last
   * @returns {number} Days until refill needed (negative if overdue)
   */
  daysUntilRefill(dateFilled, daysSupply) {
    const refillDate = this.calculateRefillDate(dateFilled, daysSupply);
    const today = new Date();
    
    // Reset time to start of day for accurate day calculation
    today.setHours(0, 0, 0, 0);
    refillDate.setHours(0, 0, 0, 0);
    
    const diffTime = refillDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Calculate days of medication supply remaining
   * @param {Date|string} dateFilled - Date medication was filled
   * @param {number} daysSupply - Number of days the quantity will last
   * @returns {number} Days of supply remaining
   */
  daysOfSupplyRemaining(dateFilled, daysSupply) {
    const daysUntil = this.daysUntilRefill(dateFilled, daysSupply);
    return Math.max(0, daysUntil);
  }

  /**
   * Check if medication supply is running low
   * @param {Date|string} dateFilled - Date medication was filled
   * @param {number} daysSupply - Number of days the quantity will last
   * @returns {boolean} True if supply is running low
   */
  isSupplyLow(dateFilled, daysSupply) {
    const daysRemaining = this.daysOfSupplyRemaining(dateFilled, daysSupply);
    return daysRemaining <= this.lowSupplyThreshold;
  }

  /**
   * Calculate optimal refill date (when to request refill)
   * @param {Date|string} dateFilled - Date medication was filled
   * @param {number} daysSupply - Number of days the quantity will last
   * @param {number} leadTime - Days of lead time needed for refill processing
   * @returns {Date} Optimal date to request refill
   */
  calculateOptimalRefillDate(dateFilled, daysSupply, leadTime = 3) {
    const refillDate = this.calculateRefillDate(dateFilled, daysSupply);
    const optimalDate = new Date(refillDate);
    optimalDate.setDate(refillDate.getDate() - leadTime);
    return optimalDate;
  }

  /**
   * Generate refill reminder dates based on medication data
   * @param {Object} medication - Medication object with refill data
   * @returns {Array} Array of reminder objects with dates and types
   */
  generateRefillReminders(medication) {
    const { date_filled, days_supply, refills_remaining, refill_expiry_date, quantity, schedule } = medication;
    
    if (!date_filled) {
      return [];
    }

    let refillDate;
    let calculationDetails = {};
    let effectiveDaysSupply = days_supply;
    
    // Use schedule-enhanced calculation if available
    if (this.scheduleParser && schedule && quantity) {
      try {
        const enhancedResult = this.calculateRefillDateWithSchedule(
          date_filled, 
          quantity, 
          schedule, 
          { daysSupply: days_supply }
        );
        refillDate = enhancedResult.refillDate;
        calculationDetails = enhancedResult;
        
        // Set effective days supply for the enhanced calculation so other methods can use it
        if (enhancedResult.actualDaysSupply) {
          effectiveDaysSupply = enhancedResult.actualDaysSupply;
        }
        
        console.log(`📊 Using schedule-enhanced refill calculation for ${medication.name}:`, calculationDetails);
      } catch (error) {
        console.warn('Schedule-enhanced calculation failed, falling back to basic:', error.message);
        refillDate = this.calculateRefillDate(date_filled, effectiveDaysSupply);
        calculationDetails = { calculationMethod: 'basic_fallback' };
      }
    } else if (effectiveDaysSupply) {
      // Fallback to basic calculation
      refillDate = this.calculateRefillDate(date_filled, effectiveDaysSupply);
      calculationDetails = { calculationMethod: 'basic' };
    } else {
      // No refill data available
      return [];
    }

    const reminders = [];
    const today = new Date();

    // Only create reminders if refill is in the future
    if (refillDate > today) {
      // Early reminder (14 days before)
      const earlyDate = new Date(refillDate);
      earlyDate.setDate(refillDate.getDate() - this.reminderTiming.early);
      
      if (earlyDate > today) {
        reminders.push({
          reminder_date: earlyDate.toISOString().split('T')[0],
          reminder_type: 'early_refill_due',
          message: `Early reminder: Refill for ${medication.name} is due in ${this.reminderTiming.early} days`
        });
      }

      // Primary reminder (7 days before)
      const primaryDate = new Date(refillDate);
      primaryDate.setDate(refillDate.getDate() - this.reminderTiming.primary);
      
      if (primaryDate > today) {
        reminders.push({
          reminder_date: primaryDate.toISOString().split('T')[0],
          reminder_type: 'refill_due',
          message: `Refill for ${medication.name} is due in ${this.reminderTiming.primary} days`
        });
      }

      // Urgent reminder (3 days before)
      const urgentDate = new Date(refillDate);
      urgentDate.setDate(refillDate.getDate() - this.reminderTiming.urgent);
      
      if (urgentDate > today) {
        reminders.push({
          reminder_date: urgentDate.toISOString().split('T')[0],
          reminder_type: 'refill_due',
          message: `URGENT: Refill for ${medication.name} is due in ${this.reminderTiming.urgent} days`
        });
      }

      // Final reminder (1 day before)
      const finalDate = new Date(refillDate);
      finalDate.setDate(refillDate.getDate() - this.reminderTiming.final);
      
      if (finalDate > today) {
        reminders.push({
          reminder_date: finalDate.toISOString().split('T')[0],
          reminder_type: 'refill_due',
          message: `FINAL REMINDER: Refill for ${medication.name} is due tomorrow`
        });
      }
    }

    // Low supply warning if applicable
    if (this.isSupplyLow(date_filled, days_supply)) {
      const lowSupplyDate = today.toISOString().split('T')[0];
      console.log(`🔍 Low supply reminder date calculation:`, {
        today: today,
        todayISO: today.toISOString(),
        splitResult: today.toISOString().split('T'),
        finalDate: lowSupplyDate
      });
      
      reminders.push({
        reminder_date: lowSupplyDate,
        reminder_type: 'low_supply',
        message: `WARNING: ${medication.name} supply is running low (${this.daysOfSupplyRemaining(date_filled, days_supply)} days remaining)`
      });
    }

    // Refill expiry warning if applicable
    if (refill_expiry_date) {
      const expiryDate = new Date(refill_expiry_date);
      const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
        reminders.push({
          reminder_date: today.toISOString().split('T')[0],
          reminder_type: 'refill_expiring',
          message: `WARNING: Refills for ${medication.name} expire in ${daysUntilExpiry} days`
        });
      }
    }

    return reminders;
  }

  /**
   * Generate priority-based refill reminders with enhanced priority levels
   * @param {Object} medication - Medication object with refill data
   * @returns {Array} Array of reminder objects with priorities
   */
  generatePriorityReminders(medication) {
    const { date_filled, days_supply, refills_remaining, refill_expiry_date, quantity, schedule } = medication;
    
    if (!date_filled) {
      return [];
    }

    let refillDate;
    let calculationDetails = {};
    let effectiveDaysSupply = days_supply;
    
    // Use schedule-enhanced calculation if available
    if (this.scheduleParser && schedule && quantity) {
      try {
        const enhancedResult = this.calculateRefillDateWithSchedule(
          date_filled, 
          quantity, 
          schedule, 
          { daysSupply: days_supply }
        );
        refillDate = enhancedResult.refillDate;
        calculationDetails = enhancedResult;
        
        if (enhancedResult.actualDaysSupply) {
          effectiveDaysSupply = enhancedResult.actualDaysSupply;
        }
      } catch (error) {
        console.warn('Schedule-enhanced calculation failed, falling back to basic:', error.message);
        refillDate = this.calculateRefillDate(date_filled, effectiveDaysSupply);
        calculationDetails = { calculationMethod: 'basic_fallback' };
      }
    } else if (effectiveDaysSupply) {
      refillDate = this.calculateRefillDate(date_filled, effectiveDaysSupply);
      calculationDetails = { calculationMethod: 'basic' };
    } else {
      return [];
    }

    const reminders = [];
    const today = new Date();

    // Only create reminders if refill is in the future
    if (refillDate > today) {
      const daysRemaining = Math.ceil((refillDate - today) / (1000 * 60 * 60 * 24));

      // Early reminder (14 days before)
      if (daysRemaining >= this.reminderTiming.early) {
        reminders.push({
          reminder_date: new Date(today.getTime() + (daysRemaining - this.reminderTiming.early) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          reminder_type: 'refill_planning',
          priority: 'low',
          message: `Plan ahead: ${medication.name} will run out in ${daysRemaining} days. Consider getting a refill soon.`
        });
      }

      // Primary reminder (7 days before)
      if (daysRemaining >= this.reminderTiming.primary) {
        reminders.push({
          reminder_date: new Date(today.getTime() + (daysRemaining - this.reminderTiming.primary) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          reminder_type: 'refill_due',
          priority: 'medium',
          message: `Time to refill: ${medication.name} will run out in ${daysRemaining} days.`
        });
      }

      // Urgent reminder (3 days before)
      if (daysRemaining >= this.reminderTiming.urgent) {
        reminders.push({
          reminder_date: new Date(today.getTime() + (daysRemaining - this.reminderTiming.urgent) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          reminder_type: 'refill_urgent',
          priority: 'high',
          message: `URGENT: ${medication.name} will run out in ${daysRemaining} days. Get refill now!`
        });
      }

      // Final warning (1 day before)
      if (daysRemaining >= this.reminderTiming.final) {
        reminders.push({
          reminder_date: new Date(today.getTime() + (daysRemaining - this.reminderTiming.final) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          reminder_type: 'refill_critical',
          priority: 'critical',
          message: `CRITICAL: ${medication.name} runs out tomorrow! Get refill immediately!`
        });
      }
    }

    // Low supply warning if applicable
    if (this.isSupplyLow(date_filled, effectiveDaysSupply)) {
      const daysRemaining = this.daysOfSupplyRemaining(date_filled, effectiveDaysSupply);
      if (daysRemaining > 0) {
        reminders.push({
          reminder_date: today.toISOString().split('T')[0],
          reminder_type: 'low_supply',
          priority: 'high',
          message: `LOW SUPPLY: ${medication.name} has only ${daysRemaining} days left.`
        });
      }
    }

    // Expired warning
    const daysRemaining = this.daysUntilRefill(date_filled, effectiveDaysSupply);
    if (daysRemaining < 0) {
      reminders.push({
        reminder_date: today.toISOString().split('T')[0],
        reminder_type: 'medication_expired',
        priority: 'critical',
        message: `EXPIRED: ${medication.name} ran out ${Math.abs(daysRemaining)} days ago. Get refill immediately!`
      });
    }

    return reminders;
  }

  /**
   * Get refill status summary for all user medications
   * @param {Array} medications - Array of user medications
   * @returns {Object} Refill status summary
   */
  getRefillStatusSummary(medications) {
    const summary = {
      total: medications.length,
      needsRefill: 0,
      lowSupply: 0,
      expired: 0,
      healthy: 0,
      noData: 0,
      medications: []
    };

    medications.forEach(med => {
      const refillStatus = this.calculateRefillStatus(med);
      
      const status = {
        id: med.id,
        name: med.name,
        dosage: med.dosage,
        schedule: med.schedule,
        ...refillStatus
      };

      summary.medications.push(status);

      if (!refillStatus.hasRefillData) {
        summary.noData++;
      } else if (refillStatus.status === 'overdue') {
        summary.expired++;
      } else if (refillStatus.status === 'low') {
        summary.lowSupply++;
      } else if (refillStatus.daysUntilRefill <= 14) {
        summary.needsRefill++;
      } else {
        summary.healthy++;
      }
    });

    return summary;
  }

  /**
   * Get next refill due date across all medications
   * @param {Array} medications - Array of user medications
   * @returns {Object} Next refill information
   */
  getNextRefillDue(medications) {
    let nextRefill = null;
    let earliestDate = null;

    medications.forEach(med => {
      const refillStatus = this.calculateRefillStatus(med);
      
      if (refillStatus.hasRefillData && refillStatus.daysUntilRefill > 0) {
        if (!earliestDate || refillStatus.daysUntilRefill < earliestDate) {
          earliestDate = refillStatus.daysUntilRefill;
          nextRefill = {
            medication: med.name,
            daysRemaining: refillStatus.daysUntilRefill,
            refillDate: refillStatus.refillDate,
            priority: this.getPriority(refillStatus.daysUntilRefill)
          };
        }
      }
    });

    return nextRefill;
  }

  /**
   * Get priority level based on days remaining
   * @param {number} daysRemaining - Days until refill needed
   * @returns {string} Priority level
   */
  getPriority(daysRemaining) {
    if (daysRemaining <= 1) return 'critical';
    if (daysRemaining <= 3) return 'high';
    if (daysRemaining <= 7) return 'medium';
    if (daysRemaining <= 14) return 'low';
    return 'healthy';
  }

  /**
   * Calculate refill status summary for a medication
   * @param {Object} medication - Medication object with refill data
   * @returns {Object} Refill status summary
   */
  calculateRefillStatus(medication) {
    const { date_filled, days_supply, refills_remaining, refill_expiry_date, quantity, schedule } = medication;
    
    if (!date_filled) {
      return {
        hasRefillData: false,
        message: 'No refill data available'
      };
    }

    let daysUntil;
    let daysRemaining;
    let isLow;
    let refillDate;
    let calculationDetails = {};
    let effectiveDaysSupply = days_supply;

    // Use schedule-enhanced calculation if available
    if (this.scheduleParser && schedule && quantity) {
      try {
        const enhancedResult = this.calculateRefillDateWithSchedule(
          date_filled, 
          quantity, 
          schedule, 
          { daysSupply: days_supply }
        );
        refillDate = enhancedResult.refillDate;
        calculationDetails = enhancedResult;
        
        // Set effective days supply for the enhanced calculation so other methods can use it
        if (enhancedResult.actualDaysSupply) {
          effectiveDaysSupply = enhancedResult.actualDaysSupply;
        }
        
        // Calculate days until refill using the enhanced refill date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        refillDate.setHours(0, 0, 0, 0);
        const diffTime = refillDate - today;
        daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        daysRemaining = Math.max(0, daysUntil);
        isLow = daysRemaining <= this.lowSupplyThreshold;
        
        console.log(`📊 Using schedule-enhanced status calculation for ${medication.name}:`, calculationDetails);
      } catch (error) {
        console.warn('Schedule-enhanced calculation failed, falling back to basic:', error.message);
        daysUntil = this.daysUntilRefill(date_filled, effectiveDaysSupply);
        daysRemaining = this.daysOfSupplyRemaining(date_filled, effectiveDaysSupply);
        isLow = this.isSupplyLow(date_filled, effectiveDaysSupply);
        refillDate = this.calculateRefillDate(date_filled, effectiveDaysSupply);
        calculationDetails = { calculationMethod: 'basic_fallback' };
      }
    } else if (effectiveDaysSupply) {
      // Fallback to basic calculation
      daysUntil = this.daysUntilRefill(date_filled, effectiveDaysSupply);
      daysRemaining = this.daysOfSupplyRemaining(date_filled, effectiveDaysSupply);
      isLow = this.isSupplyLow(date_filled, effectiveDaysSupply);
      refillDate = this.calculateRefillDate(date_filled, effectiveDaysSupply);
      calculationDetails = { calculationMethod: 'basic' };
    } else {
      return {
        hasRefillData: false,
        message: 'No refill data available'
      };
    }

    let status = 'good';
    let urgency = 'none';

    if (daysUntil < 0) {
      status = 'overdue';
      urgency = 'critical';
    } else if (isLow) {
      status = 'low';
      urgency = daysUntil <= 3 ? 'high' : 'medium';
    } else if (daysUntil <= 7) {
      status = 'due_soon';
      urgency = 'medium';
    }

    return {
      hasRefillData: true,
      status,
      urgency,
      daysUntilRefill: daysUntil,
      daysOfSupplyRemaining: daysRemaining,
      refillDate: refillDate.toISOString().split('T')[0],
      isLowSupply: isLow,
      refillsRemaining: refills_remaining || 0,
      refillExpiryDate: refill_expiry_date,
      message: this.generateStatusMessage(status, daysUntil, medication.name, refills_remaining),
      calculationDetails // Include enhanced calculation information
    };
  }

  /**
   * Generate human-readable status message
   * @param {string} status - Refill status
   * @param {number} daysUntil - Days until refill needed
   * @param {string} medicationName - Name of medication
   * @param {number} refillsRemaining - Number of refills remaining
   * @returns {string} Human-readable status message
   */
  generateStatusMessage(status, daysUntil, medicationName, refillsRemaining) {
    switch (status) {
      case 'overdue':
        return `${medicationName} refill is overdue by ${Math.abs(daysUntil)} days`;
      case 'low':
        return `${medicationName} supply is running low (${daysUntil} days remaining)`;
      case 'due_soon':
        return `${medicationName} refill is due in ${daysUntil} days`;
      case 'good':
        return `${medicationName} supply is good (${daysUntil} days remaining)`;
      default:
        return `${medicationName} refill status unknown`;
    }
  }

  /**
   * Compare basic vs. schedule-enhanced refill calculations
   * @param {Date|string} dateFilled - Date medication was filled
   * @param {number} quantity - Quantity dispensed
   * @param {string} schedule - Medication schedule
   * @param {number} pharmacyDaysSupply - Days supply from pharmacy
   * @returns {Object} Comparison of calculation methods
   */
  compareCalculationMethods(dateFilled, quantity, schedule, pharmacyDaysSupply) {
    if (!this.scheduleParser || !schedule) {
      return {
        comparison: 'unavailable',
        message: 'Schedule parser not available or no schedule provided'
      };
    }

    try {
      // Basic calculation (pharmacy assumption)
      const basicRefillDate = this.calculateRefillDate(dateFilled, pharmacyDaysSupply);
      const basicDaysUntil = this.daysUntilRefill(dateFilled, pharmacyDaysSupply);
      
      // Enhanced calculation (schedule-aware)
      const enhancedResult = this.calculateRefillDateWithSchedule(
        dateFilled, 
        quantity, 
        schedule, 
        { daysSupply: pharmacyDaysSupply }
      );
      
      const difference = enhancedResult.actualDaysSupply - pharmacyDaysSupply;
      const accuracyImprovement = Math.abs(difference);
      
      return {
        comparison: 'available',
        basic: {
          refillDate: basicRefillDate.toISOString().split('T')[0],
          daysUntil: basicDaysUntil,
          daysSupply: pharmacyDaysSupply,
          assumption: 'Daily consumption'
        },
        enhanced: {
          refillDate: enhancedResult.refillDate.toISOString().split('T')[0],
          daysUntil: enhancedResult.daysUntilRefill,
          daysSupply: enhancedResult.actualDaysSupply,
          consumptionRate: enhancedResult.consumptionRate,
          assumption: `Schedule: "${schedule}"`
        },
        difference: {
          days: difference,
          accuracyImprovement,
          percentageChange: Math.round((difference / pharmacyDaysSupply) * 100)
        },
        recommendation: this.generateCalculationRecommendation(difference, enhancedResult.consumptionRate)
      };
    } catch (error) {
      return {
        comparison: 'error',
        message: 'Failed to compare calculation methods',
        error: error.message
      };
    }
  }

  /**
   * Generate recommendation based on calculation comparison
   * @param {number} difference - Difference in days between methods
   * @param {number} consumptionRate - Calculated consumption rate
   * @returns {string} Human-readable recommendation
   */
  generateCalculationRecommendation(difference, consumptionRate) {
    if (Math.abs(difference) < 7) {
      return 'Pharmacy estimate is accurate for this schedule';
    }
    
    if (difference > 0) {
      return `Pharmacy estimate is too conservative. Actual supply will last ${difference} days longer due to schedule pattern.`;
    } else {
      return `Pharmacy estimate is too optimistic. Actual supply will run out ${Math.abs(difference)} days sooner due to schedule pattern.`;
    }
  }

  /**
   * Validate refill data for a medication
   * @param {Object} refillData - Refill data to validate
   * @returns {Object} Validation result with isValid and errors
   */
  validateRefillData(refillData) {
    const errors = [];
    const { date_filled, quantity, days_supply, refills_remaining } = refillData;

    // Validate date_filled
    if (date_filled) {
      const fillDate = new Date(date_filled);
      if (isNaN(fillDate.getTime())) {
        errors.push('Invalid date filled format');
      } else if (fillDate > new Date()) {
        errors.push('Date filled cannot be in the future');
      }
    }

    // Validate quantity
    if (quantity !== undefined && quantity !== null) {
      if (!Number.isInteger(quantity) || quantity <= 0) {
        errors.push('Quantity must be a positive integer');
      }
    }

    // Validate days_supply
    if (days_supply !== undefined && days_supply !== null) {
      if (!Number.isInteger(days_supply) || days_supply <= 0 || days_supply > 365) {
        errors.push('Days supply must be between 1 and 365');
      }
    }

    // Validate refills_remaining
    if (refills_remaining !== undefined && refills_remaining !== null) {
      if (!Number.isInteger(refills_remaining) || refills_remaining < 0) {
        errors.push('Refills remaining must be a non-negative integer');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
