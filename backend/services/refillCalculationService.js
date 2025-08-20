// Refill Calculation Service
// Provides deterministic calculations for medication refill scheduling
// Integrates with DeterministicScheduleParser for schedule-aware calculations

export class RefillCalculationService {
  constructor(deterministicParser = null) {
    this.reminderTiming = {
      early: 14,     // 14 days before (gentle reminder)
      primary: 7,    // 7 days before refill due
      urgent: 3,     // 3 days before refill due
      final: 1       // 1 day before refill due
    };

    this.lowSupplyThreshold = 7;
    this.scheduleParser = deterministicParser;
  }

  /**
   * Set or update the schedule parser instance
   * @param {DeterministicScheduleParser} parser - The schedule parser instance
   */
  setScheduleParser(parser) {
    if (parser && typeof parser.shouldTakeOnDate === 'function') {
      this.scheduleParser = parser;
    } else {
      console.warn('⚠️ Invalid schedule parser provided, must have shouldTakeOnDate method');
      this.scheduleParser = null;
    }
  }

  /**
   * Get the current schedule parser instance
   * @returns {DeterministicScheduleParser|null} The current schedule parser or null
   */
  getScheduleParser() {
    return this.scheduleParser;
  }

  /**
   * Check if schedule parser is available and functional
   * @returns {boolean} True if schedule parser is available and functional
   */
  isScheduleParserAvailable() {
    return !!(this.scheduleParser && typeof this.scheduleParser.shouldTakeOnDate === 'function');
  }

  /**
   * Create a standardized error object for consistent error handling
   * @param {string} message - Error message
   * @param {string} code - Error code for categorization
   * @param {Object} details - Additional error details
   * @returns {Object} Standardized error object
   */
  createError(message, code = 'CALCULATION_ERROR', details = {}) {
    return {
      error: true,
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
      service: 'RefillCalculationService'
    };
  }

  /**
   * Validate medication data for refill calculations
   * @param {Object} medication - Medication object
   * @returns {Object} Validation result with isValid flag and errors array
   */
  validateMedicationData(medication) {
    const errors = [];
    
    if (!medication) {
      errors.push('Medication object is required');
      return { isValid: false, errors };
    }

    if (!medication.date_filled) {
      errors.push('Date filled is required');
    }

    if (!medication.days_supply || medication.days_supply <= 0) {
      errors.push('Days supply must be a positive number');
    }

    if (medication.quantity !== undefined && (medication.quantity <= 0 || !Number.isInteger(medication.quantity))) {
      errors.push('Quantity must be a positive integer');
    }

    if (medication.refills_remaining !== undefined && (medication.refills_remaining < 0 || !Number.isInteger(medication.refills_remaining))) {
      errors.push('Refills remaining must be a non-negative integer');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    };
  }

  /**
   * Calculate when a refill is needed based on date filled and days supply
   * @param {Date|string} dateFilled - Date medication was filled
   * @param {number} daysSupply - Number of days the quantity will last
   * @returns {Date} Date when refill is needed
   * @throws {Error} When parameters are invalid
   */
  calculateRefillDate(dateFilled, daysSupply) {
    if (!dateFilled) {
      throw new Error('Date filled is required');
    }
    
    if (!daysSupply || typeof daysSupply !== 'number' || daysSupply <= 0) {
      throw new Error('Days supply must be a positive number');
    }

    const fillDate = new Date(dateFilled);
    if (isNaN(fillDate.getTime())) {
      throw new Error(`Invalid date filled format: ${dateFilled}. Expected valid date string or Date object.`);
    }

    if (fillDate > new Date()) {
      throw new Error(`Date filled (${fillDate.toISOString()}) cannot be in the future`);
    }

    const refillDate = new Date(fillDate);
    refillDate.setDate(refillDate.getDate() + daysSupply);
    
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
    if (!dateFilled || !quantity || quantity <= 0) {
      throw new Error('Invalid parameters: dateFilled and quantity are required and must be positive');
    }

    if (!this.scheduleParser) {
      console.warn('No schedule parser available, using basic refill calculation');
      return {
        refillDate: this.calculateRefillDate(dateFilled, options.daysSupply || 30),
        calculationMethod: 'basic',
        consumptionRate: 1,
        actualDaysSupply: options.daysSupply || 30,
        scheduleUsed: false,
        reason: 'No schedule parser available'
      };
    }

    try {
      const consumptionRate = this.calculateConsumptionRate(schedule, options.dateRange || 30);
      const actualDaysSupply = Math.ceil(quantity / consumptionRate);
      const refillDate = this.calculateRefillDate(dateFilled, actualDaysSupply);
      
      return {
        refillDate,
        calculationMethod: 'schedule_enhanced',
        consumptionRate,
        actualDaysSupply,
        scheduleUsed: true,
        originalDaysSupply: options.daysSupply,
        schedule: schedule,
        calculationDetails: {
          quantity,
          consumptionRate,
          dateRange: options.dateRange || 30
        }
      };
    } catch (error) {
      console.warn('Schedule-enhanced calculation failed, falling back to basic:', error.message);
      
      return {
        refillDate: this.calculateRefillDate(dateFilled, options.daysSupply || 30),
        calculationMethod: 'basic_fallback',
        consumptionRate: 1,
        actualDaysSupply: options.daysSupply || 30,
        scheduleUsed: false,
        error: error.message,
        reason: 'Schedule calculation failed, using basic method'
      };
    }
  }

  /**
   * Calculate consumption rate based on medication schedule
   * @param {string} schedule - Medication schedule text
   * @param {number} dateRange - Number of days to analyze (default: 30)
   * @returns {number} Average consumption rate (doses per day)
   */
  calculateConsumptionRate(schedule, dateRange = 30) {
    if (!this.scheduleParser) {
      console.warn('No schedule parser available, using default consumption rate');
      return 1;
    }

    if (!schedule) {
      console.warn('No schedule provided, using default consumption rate');
      return 1;
    }

    try {
      const scheduleText = schedule.toLowerCase();
      
      if (scheduleText.includes('twice daily') || scheduleText.includes('2 times daily') || 
          scheduleText.includes('bid') || scheduleText.includes('two times daily')) {
        return 2;
      }
      
      if (scheduleText.includes('three times daily') || scheduleText.includes('3 times daily') || 
          scheduleText.includes('tid') || scheduleText.includes('three times daily')) {
        return 3;
      }
      
      if (scheduleText.includes('four times daily') || scheduleText.includes('4 times daily') || 
          scheduleText.includes('qid') || scheduleText.includes('four times daily')) {
        return 4;
      }
      
      const today = new Date();
      let totalDoses = 0;
      
      for (let i = 0; i < dateRange; i++) {
        const testDate = new Date(today);
        testDate.setDate(today.getDate() + i);
        
        if (this.scheduleParser.shouldTakeOnDate(schedule, i, testDate, today)) {
          totalDoses++;
        }
      }
      
      return totalDoses / dateRange;
    } catch (error) {
      console.warn('Failed to calculate consumption rate from schedule:', error.message);
      return 1;
    }
  }

  /**
   * Calculate days until refill is needed
   * @param {Date|string} dateFilled - Date medication was filled
   * @param {number} daysSupply - Number of days the quantity will last
   * @returns {number} Days until refill needed (negative if overdue)
   * @throws {Error} When parameters are invalid
   */
  daysUntilRefill(dateFilled, daysSupply) {
    try {
      const refillDate = this.calculateRefillDate(dateFilled, daysSupply);
      const today = new Date();
      
      today.setHours(0, 0, 0, 0);
      refillDate.setHours(0, 0, 0, 0);
      
      const diffTime = refillDate - today;
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch (error) {
      throw new Error(`Failed to calculate days until refill: ${error.message}`);
    }
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
    const validation = this.validateMedicationData(medication);
    if (!validation.isValid) {
      console.warn('Invalid medication data for refill reminders:', validation.errors);
      return [];
    }

    const { date_filled, days_supply, refills_remaining, refill_expiry_date, quantity, schedule } = medication;
    
    let refillDate;
    let calculationDetails = {};
    let effectiveDaysSupply = days_supply;
    

    if (this.isScheduleParserAvailable() && schedule && quantity) {
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
        console.warn('Enhanced calculation failed, falling back to basic:', error.message);
        refillDate = this.calculateRefillDate(date_filled, days_supply);
        calculationDetails = {
          calculationMethod: 'basic_fallback',
          reason: 'Enhanced calculation failed',
          error: error.message
        };
      }
    } else {
      refillDate = this.calculateRefillDate(date_filled, days_supply);
      calculationDetails = {
        calculationMethod: 'basic',
        reason: this.isScheduleParserAvailable() ? 'No schedule or quantity data' : 'No schedule parser available'
      };
    }

    const reminders = [];
    const today = new Date();

    if (refillDate > today) {
      const earlyDate = new Date(refillDate);
      earlyDate.setDate(refillDate.getDate() - this.reminderTiming.early);
      
      if (earlyDate > today) {
        reminders.push({
          reminder_date: earlyDate.toISOString().split('T')[0],
          reminder_type: 'early_refill_due',
          message: `Early reminder: Refill for ${medication.name} is due in ${this.reminderTiming.early} days`
        });
      }

      const primaryDate = new Date(refillDate);
      primaryDate.setDate(refillDate.getDate() - this.reminderTiming.primary);
      
      if (primaryDate > today) {
        reminders.push({
          reminder_date: primaryDate.toISOString().split('T')[0],
          reminder_type: 'refill_due',
          message: `Refill for ${medication.name} is due in ${this.reminderTiming.primary} days`
        });
      }

      const urgentDate = new Date(refillDate);
      urgentDate.setDate(refillDate.getDate() - this.reminderTiming.urgent);
      
      if (urgentDate > today) {
        reminders.push({
          reminder_date: urgentDate.toISOString().split('T')[0],
          reminder_type: 'refill_due',
          message: `URGENT: Refill for ${medication.name} is due in ${this.reminderTiming.urgent} days`
        });
      }

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

    if (this.isSupplyLow(date_filled, days_supply)) {
      const lowSupplyDate = today.toISOString().split('T')[0];
      
      console.log('Low supply calculation:', {
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

    if (refillDate > today) {
      const daysRemaining = Math.ceil((refillDate - today) / (1000 * 60 * 60 * 24));

      if (daysRemaining >= this.reminderTiming.early) {
        reminders.push({
          reminder_date: new Date(today.getTime() + (daysRemaining - this.reminderTiming.early) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          reminder_type: 'refill_planning',
          priority: 'low',
          message: `Plan ahead: ${medication.name} will run out in ${daysRemaining} days. Consider getting a refill soon.`
        });
      }

      if (daysRemaining >= this.reminderTiming.primary) {
        reminders.push({
          reminder_date: new Date(today.getTime() + (daysRemaining - this.reminderTiming.primary) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          reminder_type: 'refill_due',
          priority: 'medium',
          message: `Time to refill: ${medication.name} will run out in ${daysRemaining} days.`
        });
      }

      if (daysRemaining >= this.reminderTiming.urgent) {
        reminders.push({
          reminder_date: new Date(today.getTime() + (daysRemaining - this.reminderTiming.urgent) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          reminder_type: 'refill_urgent',
          priority: 'high',
          message: `URGENT: ${medication.name} will run out in ${daysRemaining} days. Get refill now!`
        });
      }

      if (daysRemaining >= this.reminderTiming.final) {
        reminders.push({
          reminder_date: new Date(today.getTime() + (daysRemaining - this.reminderTiming.final) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          reminder_type: 'refill_critical',
          priority: 'critical',
          message: `CRITICAL: ${medication.name} runs out tomorrow! Get refill immediately!`
        });
      }
    }

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
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        refillDate.setHours(0, 0, 0, 0);
        const diffTime = refillDate - today;
        daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        daysRemaining = Math.max(0, daysUntil);
        isLow = daysRemaining <= this.lowSupplyThreshold;
        
      } catch (error) {
        console.warn('Schedule-enhanced calculation failed, falling back to basic:', error.message);
        daysUntil = this.daysUntilRefill(date_filled, effectiveDaysSupply);
        daysRemaining = this.daysOfSupplyRemaining(date_filled, effectiveDaysSupply);
        isLow = this.isSupplyLow(date_filled, effectiveDaysSupply);
        refillDate = this.calculateRefillDate(date_filled, effectiveDaysSupply);
        calculationDetails = { calculationMethod: 'basic_fallback' };
      }
    } else if (effectiveDaysSupply) {
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
      calculationDetails
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
      const basicRefillDate = this.calculateRefillDate(dateFilled, pharmacyDaysSupply);
      const basicDaysUntil = this.daysUntilRefill(dateFilled, pharmacyDaysSupply);
      
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

    if (date_filled) {
      const fillDate = new Date(date_filled);
      if (isNaN(fillDate.getTime())) {
        errors.push('Invalid date filled format');
      } else if (fillDate > new Date()) {
        errors.push('Date filled cannot be in the future');
      }
    }

    if (quantity !== undefined && quantity !== null) {
      if (!Number.isInteger(quantity) || quantity <= 0) {
        errors.push('Quantity must be a positive integer');
      }
    }

    if (days_supply !== undefined && days_supply !== null) {
      if (!Number.isInteger(days_supply) || days_supply <= 0 || days_supply > 365) {
        errors.push('Days supply must be between 1 and 365');
      }
    }

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
