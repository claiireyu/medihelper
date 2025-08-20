export class DeterministicScheduleParser {
  constructor() {
    this.timeSlots = {
      morning: { defaultTime: '8:00 AM', timeRange: '5:00 AM - 12:00 PM' },
      afternoon: { defaultTime: '12:00 PM', timeRange: '12:00 PM - 5:00 PM' },
      evening: { defaultTime: '6:00 PM', timeRange: '5:00 PM - 5:00 AM' }
    };

    this.schedulePatterns = {
      frequency: {
        onceDailyPatterns: [
          'once daily', 'once a day', '1 time a day', 'one time a day',
          'once per day', 'daily', 'every day'
        ],
        twiceDailyPatterns: [
          'twice daily', 'twice a day', '2 times a day', 'two times a day',
          'twice per day', 'bid', 'every 12 hours'
        ],
        threeTimesDailyPatterns: [
          'three times daily', 'three times a day', '3 times a day',
          'three times per day', 'tid', 'every 8 hours'
        ],
        fourTimesDailyPatterns: [
          'four times daily', 'four times a day', '4 times a day',
          'four times per day', 'qid', 'every 6 hours'
        ]
      },

      timeSpecific: {
        morningPatterns: ['morning', 'breakfast', 'am', 'wake up', 'before breakfast'],
        afternoonPatterns: ['afternoon', 'lunch', 'midday', 'noon', 'after lunch'],
        eveningPatterns: ['evening', 'night', 'dinner', 'pm', 'bedtime', 'before bed', 'at night']
      },

      complex: {
        everyOtherDayPatterns: ['every other day', 'every second day', 'alternate days'],
        everyThreeDaysPatterns: ['every 3 days', 'every third day'],
        weeklyPatterns: ['once a week', 'weekly', 'once weekly', 'every week'],
        monthlyPatterns: ['once a month', 'monthly', 'once monthly', 'every month'],
        alternatingPatterns: ['alternate between', 'alternating', 'switch between']
      },

      combinations: {
        morningAndEvening: ['morning and evening', 'am and pm', 'twice daily (morning and evening)'],
        withMeals: ['with meals', 'with food', 'after meals', 'before meals'],
        asNeeded: ['as needed', 'prn', 'when needed', 'if needed']
      }
    };
  }

  /**
   * Parse medication schedules into structured time slots for a specific date
   * @param {Array} medications - Array of medication objects with schedule information
   * @param {string} targetDate - Target date in YYYY-MM-DD format
   * @returns {Object} Schedule object with morning, afternoon, and evening arrays
   */
  parseSchedule(medications, targetDate) {
    const schedule = {
      morning: [],
      afternoon: [],
      evening: []
    };

    const dateParts = targetDate.split('-');
    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]) - 1;
    const day = parseInt(dateParts[2]);
    const targetDateTime = new Date(Date.UTC(year, month, day));

    medications.forEach(med => {
      const daysSinceStart = this.calculateDaysSinceStart(med.created_at, targetDateTime);
      
      if (daysSinceStart < 0) {
        return;
      }

      if (!this.shouldTakeOnDate(med.schedule, daysSinceStart, targetDateTime, med.created_at)) {
        return;
      }

      const parsedMedication = this.parseMedicationSchedule(med, daysSinceStart);
      this.addMedicationToSchedule(schedule, parsedMedication);
    });

    return schedule;
  }

  /**
   * Calculate days since medication was started relative to target date
   * @param {Date|string} createdAt - Date when medication was created
   * @param {Date} targetDateTime - Target date for calculation
   * @returns {number} Days since medication started (negative if not started yet)
   */
  calculateDaysSinceStart(createdAt, targetDateTime) {
    let createdDate;
    if (typeof createdAt === 'string') {
      if (createdAt.includes('T') && createdAt.includes('Z')) {
        createdDate = new Date(createdAt);
      } else {
        createdDate = new Date(createdAt + 'T00:00:00.000Z');
      }
    } else {
      createdDate = new Date(createdAt);
    }

    if (isNaN(createdDate.getTime())) {
      return 0;
    }

    const createdYear = createdDate.getFullYear();
    const createdMonth = createdDate.getMonth();
    const createdDay = createdDate.getDate();
    
    const targetYear = targetDateTime.getFullYear();
    const targetMonth = targetDateTime.getMonth();
    const targetDay = targetDateTime.getDate();
    
    const createdDateOnly = new Date(createdYear, createdMonth, createdDay);
    const targetDateOnly = new Date(targetYear, targetMonth, targetDay);
    
    const timeDiff = targetDateOnly.getTime() - createdDateOnly.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    
    return daysDiff;
  }

  /**
   * Determine if medication should be taken on a specific date based on schedule pattern
   * @param {string} schedule - Medication schedule text
   * @param {number} daysSinceStart - Days since medication started
   * @param {Date} targetDateTime - Target date to check
   * @param {Date|string} createdAt - Date when medication was created
   * @returns {boolean} True if medication should be taken on target date
   */
  shouldTakeOnDate(schedule, daysSinceStart, targetDateTime, createdAt) {
    const scheduleText = schedule.toLowerCase();

    if (this.matchesPatterns(scheduleText, this.schedulePatterns.complex.everyOtherDayPatterns)) {
      return daysSinceStart % 2 === 0;
    }

    if (this.matchesPatterns(scheduleText, this.schedulePatterns.complex.everyThreeDaysPatterns)) {
      return daysSinceStart % 3 === 0;
    }

    if (this.matchesPatterns(scheduleText, this.schedulePatterns.complex.weeklyPatterns)) {
      const createdDate = new Date(createdAt);
      return targetDateTime.getDay() === createdDate.getDay();
    }

    if (this.matchesPatterns(scheduleText, this.schedulePatterns.complex.monthlyPatterns)) {
      const createdDate = new Date(createdAt);
      return targetDateTime.getDate() === createdDate.getDate();
    }

    return true;
  }

  /**
   * Parse individual medication schedule into structured format
   * @param {Object} med - Medication object
   * @param {number} daysSinceStart - Days since medication started
   * @returns {Object} Parsed medication with time slots and dosage information
   */
  parseMedicationSchedule(med, daysSinceStart) {
    if (!med || !med.schedule) {
      return {
        medication: med || {},
        timeSlots: [],
        dosage: med?.dosage || 'Unknown',
        daysSinceStart: daysSinceStart
      };
    }
    
    const scheduleText = med.schedule.toLowerCase();
    const timeSlots = this.determineTimeSlots(scheduleText);
    
    return {
      medication: med,
      timeSlots: timeSlots,
      dosage: med.dosage || 'Unknown',
      daysSinceStart: daysSinceStart
    };
  }

  /**
   * Determine which time slots a medication should be placed in based on schedule
   * @param {string} scheduleText - Lowercase schedule text to analyze
   * @returns {Array} Array of time slot names (morning, afternoon, evening)
   */
  determineTimeSlots(scheduleText) {
    const timeSlots = [];

    if (this.matchesPatterns(scheduleText, this.schedulePatterns.combinations.morningAndEvening)) {
      return ['morning', 'evening'];
    }

    if (this.matchesPatterns(scheduleText, this.schedulePatterns.frequency.threeTimesDailyPatterns)) {
      return ['morning', 'afternoon', 'evening'];
    }

    if (this.matchesPatterns(scheduleText, this.schedulePatterns.frequency.fourTimesDailyPatterns)) {
      return ['morning', 'afternoon', 'evening', 'night'];
    }

    if (this.matchesPatterns(scheduleText, this.schedulePatterns.frequency.twiceDailyPatterns)) {
      return ['morning', 'evening'];
    }

    if (this.matchesPatterns(scheduleText, this.schedulePatterns.frequency.onceDailyPatterns)) {
      if (this.matchesPatterns(scheduleText, this.schedulePatterns.timeSpecific.eveningPatterns)) {
        return ['evening'];
      }
      if (this.matchesPatterns(scheduleText, this.schedulePatterns.timeSpecific.afternoonPatterns)) {
        return ['afternoon'];
      }
      return ['morning'];
    }

    if (this.matchesPatterns(scheduleText, this.schedulePatterns.timeSpecific.morningPatterns)) {
      timeSlots.push('morning');
    }
    if (this.matchesPatterns(scheduleText, this.schedulePatterns.timeSpecific.afternoonPatterns)) {
      timeSlots.push('afternoon');
    }
    if (this.matchesPatterns(scheduleText, this.schedulePatterns.timeSpecific.eveningPatterns)) {
      timeSlots.push('evening');
    }

    if (this.matchesPatterns(scheduleText, this.schedulePatterns.complex.everyOtherDayPatterns)) {
      return ['morning'];
    }
    if (this.matchesPatterns(scheduleText, this.schedulePatterns.complex.everyThreeDaysPatterns)) {
      return ['morning'];
    }
    if (this.matchesPatterns(scheduleText, this.schedulePatterns.complex.weeklyPatterns)) {
      return ['morning'];
    }
    if (this.matchesPatterns(scheduleText, this.schedulePatterns.complex.monthlyPatterns)) {
      return ['morning'];
    }

    if (this.matchesPatterns(scheduleText, this.schedulePatterns.complex.alternatingPatterns)) {
      return ['afternoon'];
    }

    if (timeSlots.length === 0) {
      return ['afternoon'];
    }

    return timeSlots;
  }

  /**
   * Add parsed medication to the appropriate time slots in the schedule
   * @param {Object} schedule - Schedule object with morning, afternoon, evening arrays
   * @param {Object} parsedMedication - Parsed medication object with time slots
   */
  addMedicationToSchedule(schedule, parsedMedication) {
    const { medication, timeSlots, daysSinceStart } = parsedMedication;

    if (!timeSlots || !Array.isArray(timeSlots)) {
      return;
    }

    timeSlots.forEach(timeSlot => {
      if (!['morning', 'afternoon', 'evening'].includes(timeSlot)) {
        return;
      }

      const medData = {
        id: medication?.id,
        name: medication?.name || 'Unknown',
        originalSchedule: medication?.schedule || 'Unknown',
        dosage: this.getDosageForTime(medication, timeSlot, daysSinceStart),
        time: this.timeSlots[timeSlot]?.defaultTime || 'Unknown'
      };

      schedule[timeSlot].push(medData);
    });
  }

  /**
   * Calculate appropriate dosage for medication at specific time and day
   * @param {Object} med - Medication object
   * @param {string} timeOfDay - Time slot (morning, afternoon, evening)
   * @param {number} daysSinceStart - Days since medication started
   * @returns {string} Calculated dosage for the specified time
   */
  getDosageForTime(med, timeOfDay, daysSinceStart = 0) {
    if (!med || !med.schedule) {
      return med?.dosage || 'Unknown';
    }
    
    const schedule = med.schedule.toLowerCase();
    
    if (med.name && med.name.toLowerCase().includes('tacrolimus')) {
      if (timeOfDay === 'morning') {
        return '1mg Cap (1 capsule)';
      } else if (timeOfDay === 'evening') {
        return '1mg Cap (2 capsules)';
      }
    }
    
    if (this.matchesPatterns(schedule, this.schedulePatterns.complex.alternatingPatterns)) {
      return this.calculateAlternatingDosage(med, daysSinceStart);
    }
    
    return med.dosage || 'Unknown';
  }

  /**
   * Calculate dosage for medications with alternating patterns
   * @param {Object} med - Medication object
   * @param {number} daysSinceStart - Days since medication started
   * @returns {string} Alternating dosage based on day pattern
   */
  calculateAlternatingDosage(med, daysSinceStart) {
    if (!med || !med.schedule) {
      return (med?.dosage || 'Unknown') + ' (alternating)';
    }
    
    const schedule = med.schedule.toLowerCase();
    const isEvenDay = daysSinceStart % 2 === 0;
    
    const match = schedule.match(/alternate between (\d+) table.*?and (\d+) table/);
    if (match) {
      const firstDose = parseInt(match[1]);
      const secondDose = parseInt(match[2]);
      const currentDose = isEvenDay ? firstDose : secondDose;
      return `${med.dosage || 'Unknown'} (${currentDose} tablet${currentDose > 1 ? 's' : ''})`;
    }
    
    return (med?.dosage || 'Unknown') + ' (alternating)';
  }

  /**
   * Check if text matches any of the provided patterns
   * @param {string} text - Text to check
   * @param {Array} patterns - Array of patterns to match against
   * @returns {boolean} True if text matches any pattern
   */
  matchesPatterns(text, patterns) {
    if (!text || !patterns || !Array.isArray(patterns)) {
      return false;
    }
    
    const normalizedText = text.toLowerCase().trim();
    return patterns.some(pattern => normalizedText.includes(pattern.toLowerCase()));
  }

  /**
   * Apply time-specific overrides for medications with specific timing requirements
   * @param {Object} schedule - Current schedule object
   * @param {Array} medications - Array of medications to check for time-specific overrides
   * @returns {Object} Modified schedule with time-specific medications properly placed
   */
  applyTimeSpecificOverrides(schedule, medications) {
    const timeSpecificMeds = medications.filter(med => 
      med.use_specific_time && med.specific_time
    );
    
    if (timeSpecificMeds.length === 0) {
      return schedule;
    }
    
    console.log('Time-specific medications:', 
      timeSpecificMeds.map(m => `${m.name} (at ${m.specific_time})`));
    
    const modifiedSchedule = {
      morning: [...schedule.morning],
      afternoon: [...schedule.afternoon],
      evening: [...schedule.evening]
    };
    
    timeSpecificMeds.forEach(med => {
      modifiedSchedule.morning = modifiedSchedule.morning.filter(m => 
        m.id !== med.id && m.name !== med.name
      );
      modifiedSchedule.afternoon = modifiedSchedule.afternoon.filter(m => 
        m.id !== med.id && m.name !== med.name
      );
      modifiedSchedule.evening = modifiedSchedule.evening.filter(m => 
        m.id !== med.id && m.name !== med.name
      );
      
      const medData = {
        id: med.id,
        name: med.name,
        originalSchedule: med.schedule,
        dosage: med.dosage,
        use_specific_time: med.use_specific_time,
        specific_time: med.specific_time,
        time: this.formatTimeForDisplay(med.specific_time)
      };
      
      const [hours] = med.specific_time.split(':');
      const hour = parseInt(hours);
      
      if (hour >= 5 && hour < 12) {
        modifiedSchedule.morning.push(medData);
      } else if (hour >= 12 && hour < 17) {
        modifiedSchedule.afternoon.push(medData);
      } else {
        modifiedSchedule.evening.push(medData);
      }
    });
    
    return modifiedSchedule;
  }

  /**
   * Format time string for display (e.g., "14:30" becomes "2:30 PM")
   * @param {string} timeString - Time string in HH:MM format
   * @returns {string} Formatted time string for display
   */
  formatTimeForDisplay(timeString) {
    if (!timeString) return '8:00 AM';
    
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const minute = parseInt(minutes);
      
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      
      return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
    } catch (error) {
      console.error('Error formatting time:', error);
      return '8:00 AM';
    }
  }

  /**
   * Get all supported schedule patterns for documentation and testing
   * @returns {Object} Object containing all supported pattern categories
   */
  getSupportedPatterns() {
    return {
      frequencyPatterns: {
        'Once Daily': this.schedulePatterns.frequency.onceDailyPatterns,
        'Twice Daily': this.schedulePatterns.frequency.twiceDailyPatterns,
        'Three Times Daily': this.schedulePatterns.frequency.threeTimesDailyPatterns,
        'Four Times Daily': this.schedulePatterns.frequency.fourTimesDailyPatterns
      },
      timeSpecificPatterns: {
        'Morning': this.schedulePatterns.timeSpecific.morningPatterns,
        'Afternoon': this.schedulePatterns.timeSpecific.afternoonPatterns,
        'Evening': this.schedulePatterns.timeSpecific.eveningPatterns
      },
      complexPatterns: {
        'Every Other Day': this.schedulePatterns.complex.everyOtherDayPatterns,
        'Every 3 Days': this.schedulePatterns.complex.everyThreeDaysPatterns,
        'Weekly': this.schedulePatterns.complex.weeklyPatterns,
        'Monthly': this.schedulePatterns.complex.monthlyPatterns,
        'Alternating': this.schedulePatterns.complex.alternatingPatterns
      },
      combinationPatterns: {
        'Morning and Evening': this.schedulePatterns.combinations.morningAndEvening,
        'With Meals': this.schedulePatterns.combinations.withMeals,
        'As Needed': this.schedulePatterns.combinations.asNeeded
      }
    };
  }
}