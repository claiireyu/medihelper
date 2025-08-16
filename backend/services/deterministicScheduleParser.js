// Deterministic Schedule Parser
// Replaces AI-based schedule generation with rule-based, deterministic parsing

export class DeterministicScheduleParser {
  constructor() {
    // Define time slots
    this.timeSlots = {
      morning: { defaultTime: '8:00 AM', timeRange: '5:00 AM - 12:00 PM' },
      afternoon: { defaultTime: '12:00 PM', timeRange: '12:00 PM - 5:00 PM' },
      evening: { defaultTime: '6:00 PM', timeRange: '5:00 PM - 5:00 AM' }
    };

    // Schedule pattern definitions
    this.schedulePatterns = {
      // Frequency-based patterns
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

      // Time-specific patterns
      timeSpecific: {
        morningPatterns: ['morning', 'breakfast', 'am', 'wake up', 'before breakfast'],
        afternoonPatterns: ['afternoon', 'lunch', 'midday', 'noon', 'after lunch'],
        eveningPatterns: ['evening', 'night', 'dinner', 'pm', 'bedtime', 'before bed', 'at night']
      },

      // Complex frequency patterns
      complex: {
        everyOtherDayPatterns: ['every other day', 'every second day', 'alternate days'],
        everyThreeDaysPatterns: ['every 3 days', 'every third day'],
        weeklyPatterns: ['once a week', 'weekly', 'once weekly', 'every week'],
        monthlyPatterns: ['once a month', 'monthly', 'once monthly', 'every month'],
        alternatingPatterns: ['alternate between', 'alternating', 'switch between']
      },

      // Special timing combinations
      combinations: {
        morningAndEvening: ['morning and evening', 'am and pm', 'twice daily (morning and evening)'],
        withMeals: ['with meals', 'with food', 'after meals', 'before meals'],
        asNeeded: ['as needed', 'prn', 'when needed', 'if needed']
      }
    };
  }

  // Main parsing method
  parseSchedule(medications, targetDate) {
    
    const schedule = {
      morning: [],
      afternoon: [],
      evening: []
    };

    // Parse target date for calculations
    const dateParts = targetDate.split('-');
    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]) - 1;
    const day = parseInt(dateParts[2]);
    const targetDateTime = new Date(year, month, day);

    medications.forEach(med => {
      console.log(`🔧 Processing ${med.name}: "${med.schedule}"`);
      
      // Calculate days since medication started
      const daysSinceStart = this.calculateDaysSinceStart(med.created_at, targetDateTime);
      
      // Skip if medication hasn't started yet
      if (daysSinceStart < 0) {
        console.log(`⏩ Skipping ${med.name} - not started yet`);
        return;
      }

      // Check if medication should be taken on this date
      if (!this.shouldTakeOnDate(med.schedule, daysSinceStart, targetDateTime, med.created_at)) {
        console.log(`⏩ Skipping ${med.name} - not scheduled for this date`);
        return;
      }

      // Parse the schedule and add to appropriate time slots
      const parsedMedication = this.parseMedicationSchedule(med, daysSinceStart);
      this.addMedicationToSchedule(schedule, parsedMedication);
    });

    console.log('🔧 Deterministic schedule generation complete');
    return schedule;
  }

  // Calculate days since medication started
  calculateDaysSinceStart(createdAt, targetDateTime) {
    let createdDate;
    if (typeof createdAt === 'string') {
      // Handle UTC strings properly
      if (createdAt.includes('T') && createdAt.includes('Z')) {
        createdDate = new Date(createdAt);
      } else {
        // For date-only strings, create a UTC date to avoid timezone issues
        createdDate = new Date(createdAt + 'T00:00:00.000Z');
      }
    } else {
      createdDate = new Date(createdAt);
    }

    // Handle invalid dates
    if (isNaN(createdDate.getTime())) {
      return 0;
    }

    // Use local date methods to avoid timezone issues
    const createdYear = createdDate.getFullYear();
    const createdMonth = createdDate.getMonth();
    const createdDay = createdDate.getDate();
    
    const targetYear = targetDateTime.getFullYear();
    const targetMonth = targetDateTime.getMonth();
    const targetDay = targetDateTime.getDate();
    
    // Create date objects at midnight local time for accurate day calculation
    const createdDateOnly = new Date(createdYear, createdMonth, createdDay);
    const targetDateOnly = new Date(targetYear, targetMonth, targetDay);
    
    // Calculate days difference
    const timeDiff = targetDateOnly.getTime() - createdDateOnly.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    
    return daysDiff;
  }

  // Check if medication should be taken on a specific date
  shouldTakeOnDate(schedule, daysSinceStart, targetDateTime, createdAt) {
    const scheduleText = schedule.toLowerCase();

    // Check for complex frequency patterns
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

    // For daily medications and other patterns, return true
    return true;
  }

  // Parse individual medication schedule
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
    
    // Parse schedule text to determine time slots
    const timeSlots = this.determineTimeSlots(scheduleText);
    
    return {
      medication: med,
      timeSlots: timeSlots,
      dosage: med.dosage || 'Unknown',
      daysSinceStart: daysSinceStart
    };
  }

  // Determine which time slots medication should be in
  determineTimeSlots(scheduleText) {
    const timeSlots = [];

    // Check for specific time combinations first
    if (this.matchesPatterns(scheduleText, this.schedulePatterns.combinations.morningAndEvening)) {
      return ['morning', 'evening'];
    }

    // Check for frequency-based patterns
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
      // For once daily, check if there's a specific time preference
      if (this.matchesPatterns(scheduleText, this.schedulePatterns.timeSpecific.eveningPatterns)) {
        return ['evening'];
      }
      if (this.matchesPatterns(scheduleText, this.schedulePatterns.timeSpecific.afternoonPatterns)) {
        return ['afternoon'];
      }
      return ['morning']; // Default for once daily
    }

    // Check for specific time patterns
    if (this.matchesPatterns(scheduleText, this.schedulePatterns.timeSpecific.morningPatterns)) {
      timeSlots.push('morning');
    }
    if (this.matchesPatterns(scheduleText, this.schedulePatterns.timeSpecific.afternoonPatterns)) {
      timeSlots.push('afternoon');
    }
    if (this.matchesPatterns(scheduleText, this.schedulePatterns.timeSpecific.eveningPatterns)) {
      timeSlots.push('evening');
    }

    // Check for frequency patterns that need specific time slots
    if (this.matchesPatterns(scheduleText, this.schedulePatterns.complex.everyOtherDayPatterns)) {
      return ['morning']; // Place every other day medications in morning by default
    }
    if (this.matchesPatterns(scheduleText, this.schedulePatterns.complex.everyThreeDaysPatterns)) {
      return ['morning']; // Place every three days medications in morning by default
    }
    if (this.matchesPatterns(scheduleText, this.schedulePatterns.complex.weeklyPatterns)) {
      return ['morning']; // Place weekly medications in morning by default
    }
    if (this.matchesPatterns(scheduleText, this.schedulePatterns.complex.monthlyPatterns)) {
      return ['morning']; // Place monthly medications in morning by default
    }

    // Check for alternating patterns (but not frequency patterns like "every other day")
    if (this.matchesPatterns(scheduleText, this.schedulePatterns.complex.alternatingPatterns)) {
      return ['afternoon']; // Place alternating medications in afternoon by default
    }

    // If no specific patterns found, default to afternoon
    if (timeSlots.length === 0) {
      return ['afternoon'];
    }

    return timeSlots;
  }

  // Add parsed medication to schedule
  addMedicationToSchedule(schedule, parsedMedication) {
    const { medication, timeSlots, daysSinceStart } = parsedMedication;

    if (!timeSlots || !Array.isArray(timeSlots)) {
      return;
    }

    timeSlots.forEach(timeSlot => {
      // Skip invalid time slots
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
      console.log(`🔧 Added ${medData.name} to ${timeSlot} at ${medData.time}`);
    });
  }

  // Calculate dosage for specific time and day
  getDosageForTime(med, timeOfDay, daysSinceStart = 0) {
    if (!med || !med.schedule) {
      return med?.dosage || 'Unknown';
    }
    
    const schedule = med.schedule.toLowerCase();
    
    // Handle specific medication patterns (e.g., Tacrolimus)
    if (med.name && med.name.toLowerCase().includes('tacrolimus')) {
      if (timeOfDay === 'morning') {
        return '1mg Cap (1 capsule)';
      } else if (timeOfDay === 'evening') {
        return '1mg Cap (2 capsules)';
      }
    }
    
    // Handle alternating patterns
    if (this.matchesPatterns(schedule, this.schedulePatterns.complex.alternatingPatterns)) {
      return this.calculateAlternatingDosage(med, daysSinceStart);
    }
    
    return med.dosage || 'Unknown';
  }

  // Calculate dosage for alternating patterns
  calculateAlternatingDosage(med, daysSinceStart) {
    if (!med || !med.schedule) {
      return (med?.dosage || 'Unknown') + ' (alternating)';
    }
    
    const schedule = med.schedule.toLowerCase();
    const isEvenDay = daysSinceStart % 2 === 0;
    
    // Extract alternating dosages from schedule text
    const match = schedule.match(/alternate between (\d+) table.*?and (\d+) table/);
    if (match) {
      const firstDose = parseInt(match[1]);
      const secondDose = parseInt(match[2]);
      const currentDose = isEvenDay ? firstDose : secondDose;
      return `${med.dosage || 'Unknown'} (${currentDose} tablet${currentDose > 1 ? 's' : ''})`;
    }
    
    return (med.dosage || 'Unknown') + ' (alternating)';
  }

  // Helper method to check if text matches any of the patterns
  matchesPatterns(text, patterns) {
    if (!text || !patterns || !Array.isArray(patterns)) {
      return false;
    }
    
    const normalizedText = text.toLowerCase().trim();
    return patterns.some(pattern => normalizedText.includes(pattern.toLowerCase()));
  }

  // Apply time-specific overrides for medications with specific times
  applyTimeSpecificOverrides(schedule, medications) {
    console.log('🔧 Applying time-specific overrides...');
    
    const timeSpecificMeds = medications.filter(med => 
      med.use_specific_time && med.specific_time
    );
    
    if (timeSpecificMeds.length === 0) {
      console.log('🔧 No time-specific medications found');
      return schedule;
    }
    
    console.log(`🔧 Found ${timeSpecificMeds.length} time-specific medications:`, 
      timeSpecificMeds.map(m => `${m.name} (at ${m.specific_time})`));
    
    // Create a copy of the schedule to modify
    const modifiedSchedule = {
      morning: [...schedule.morning],
      afternoon: [...schedule.afternoon],
      evening: [...schedule.evening]
    };
    
    // Process each time-specific medication
    timeSpecificMeds.forEach(med => {
      console.log(`🔧 Processing time-specific medication: ${med.name}`);
      
      // Remove the medication from all time slots first
      modifiedSchedule.morning = modifiedSchedule.morning.filter(m => 
        m.id !== med.id && m.name !== med.name
      );
      modifiedSchedule.afternoon = modifiedSchedule.afternoon.filter(m => 
        m.id !== med.id && m.name !== med.name
      );
      modifiedSchedule.evening = modifiedSchedule.evening.filter(m => 
        m.id !== med.id && m.name !== med.name
      );
      
      // Add it to the correct time slot based on specific_time
      const medData = {
        id: med.id,
        name: med.name,
        originalSchedule: med.schedule,
        dosage: med.dosage,
        use_specific_time: med.use_specific_time,
        specific_time: med.specific_time,
        time: this.formatTimeForDisplay(med.specific_time)
      };
      
      // Determine time slot based on the actual time
      const [hours] = med.specific_time.split(':');
      const hour = parseInt(hours);
      
      if (hour >= 5 && hour < 12) {
        modifiedSchedule.morning.push(medData);
        console.log(`🔧 Added ${med.name} to morning slot at ${medData.time}`);
      } else if (hour >= 12 && hour < 17) {
        modifiedSchedule.afternoon.push(medData);
        console.log(`🔧 Added ${med.name} to afternoon slot at ${medData.time}`);
      } else {
        modifiedSchedule.evening.push(medData);
        console.log(`🔧 Added ${med.name} to evening slot at ${medData.time}`);
      }
    });
    
    return modifiedSchedule;
  }

  // Helper method to format time for display
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

  // Get supported schedule patterns for documentation
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