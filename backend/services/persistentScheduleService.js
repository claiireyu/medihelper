// Persistent Schedule Service
// Handles creation and management of immutable schedules with deterministic parsing

import { scheduleCache } from '../cache/scheduleCache.js';
import { DeterministicScheduleParser } from './deterministicScheduleParser.js';

export class PersistentScheduleService {
  constructor(db) {
    this.db = db;
    this.pendingRequests = new Map();
    this.deterministicParser = new DeterministicScheduleParser();
  }

  /**
   * Get or create a persistent schedule for a specific user and date
   * @param {number} userId - User ID to get schedule for
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Object} Persistent schedule object with time slots and metadata
   */
  async getOrCreatePersistentSchedule(userId, date) {
    const scheduleKey = `${userId}_${date}`;
    const todayDate = new Date();
    const year = todayDate.getFullYear();
    const month = String(todayDate.getMonth() + 1).padStart(2, '0');
    const day = String(todayDate.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;
    
    if (date < today) {
      if (scheduleCache.hasSchedule(scheduleKey)) {
        return scheduleCache.getSchedule(scheduleKey);
      }
      
      const historicalMedications = await this.getMedicationsForDate(userId, date);
      
      if (!historicalMedications || historicalMedications.length === 0) {
        const emptySchedule = {
          morning: [],
          afternoon: [],
          evening: [],
          date: date,
          userId: userId,
          isHistorical: true,
          isEmpty: true,
          createdAt: new Date().toISOString(),
          medicationsSnapshot: []
        };
        
        scheduleCache.setSchedule(scheduleKey, emptySchedule);
        return emptySchedule;
      }
      
      const schedule = this.deterministicParser.parseSchedule(historicalMedications, date);
      const finalSchedule = this.deterministicParser.applyTimeSpecificOverrides(schedule, historicalMedications);
      
      const historicalSchedule = {
        ...finalSchedule,
        date: date,
        userId: userId,
        isHistorical: true,
        createdAt: new Date().toISOString(),
        medicationsSnapshot: historicalMedications
      };
      
      scheduleCache.setSchedule(scheduleKey, historicalSchedule);
      return historicalSchedule;
    }
    
    if (scheduleCache.hasTemplate(userId)) {
      const templateSchedule = scheduleCache.getTemplate(userId);
      const derivedSchedule = this.deriveScheduleFromTemplate(templateSchedule, date);
      scheduleCache.setSchedule(scheduleKey, derivedSchedule);
      return derivedSchedule;
    } else {
      const templateKey = `template_${userId}`;
      if (this.pendingRequests.has(templateKey)) {
        return this.pendingRequests.get(templateKey);
      }
      
      const templatePromise = this.createTemplateWithDeterministicParser(userId, today);
      this.pendingRequests.set(templateKey, templatePromise);
      
      try {
        const templateSchedule = await templatePromise;
        const derivedSchedule = this.deriveScheduleFromTemplate(templateSchedule, date);
        scheduleCache.setSchedule(scheduleKey, derivedSchedule);
        return derivedSchedule;
      } finally {
        this.pendingRequests.delete(templateKey);
      }
    }
  }

  /**
   * Create a template schedule using deterministic parser for current medications
   * @param {number} userId - User ID to create template for
   * @param {string} date - Date to use as template reference
   * @returns {Object} Template schedule object with time slots and medication snapshot
   */
  async createTemplateWithDeterministicParser(userId, date) {
    const medications = await this.getCurrentMedications(userId);
    
    if (!medications || medications.length === 0) {
      const emptyTemplate = {
        morning: [],
        afternoon: [],
        evening: [],
        date: date,
        userId: userId,
        medicationsSnapshot: [],
        isTemplate: true,
        isEmpty: true
      };
      scheduleCache.setTemplate(userId, emptyTemplate);
      return emptyTemplate;
    }
    
    const schedule = this.deterministicParser.parseSchedule(medications, date);
    
    const modifiedSchedule = this.deterministicParser.applyTimeSpecificOverrides(schedule, medications);
    
    const templateSchedule = {
      ...modifiedSchedule,
      date: date,
      userId: userId,
      medicationsSnapshot: medications.map(med => ({
        id: med.id,
        name: med.name,
        dosage: med.dosage,
        schedule: med.schedule,
        specific_time: med.specific_time,
        use_specific_time: med.use_specific_time,
        created_at: med.created_at
      })),
      isTemplate: true,
      createdAt: new Date().toISOString()
    };
    
    scheduleCache.setTemplate(userId, templateSchedule);
    
    return templateSchedule;
  }

  /**
   * Get information about an existing persistent schedule
   * @param {number} userId - User ID to check
   * @param {string} date - Date to check for schedule
   * @returns {Object} Schedule information including existence status and metadata
   */
  getPersistentScheduleInfo(userId, date) {
    const scheduleKey = `${userId}_${date}`;
    const persistentSchedule = scheduleCache.getSchedule(scheduleKey);
    
    if (!persistentSchedule) {
      return {
        exists: false,
        message: 'No persistent schedule exists for this date'
      };
    }

    return {
      exists: true,
      scheduleCreatedAt: persistentSchedule.createdAt,
      medicationsSnapshot: persistentSchedule.medicationsSnapshot,
      totalMedications: persistentSchedule.medicationsSnapshot.length
    };
  }

  /**
   * Force refresh a persistent schedule by removing and recreating it
   * @param {number} userId - User ID to refresh schedule for
   * @param {string} date - Date to refresh schedule for
   * @returns {Object} Information about the newly created schedule
   */
  async forceRefreshPersistentSchedule(userId, date) {
    const scheduleKey = `${userId}_${date}`;
    
    if (scheduleCache.removeSchedule(scheduleKey)) {
    }
    
    const newPersistentSchedule = await this.getOrCreatePersistentSchedule(userId, date);
    
    return {
      scheduleCreatedAt: newPersistentSchedule.createdAt,
      totalMedications: newPersistentSchedule.medicationsSnapshot.length
    };
  }

  /**
   * Get cache statistics for monitoring and debugging
   * @returns {Object} Cache statistics including counts and user versions
   */
  getCacheStats() {
    return scheduleCache.getStats();
  }

  /**
   * Derive a daily schedule from a template schedule for a specific date
   * @param {Object} templateSchedule - Template schedule to derive from
   * @param {string} targetDate - Target date for the derived schedule
   * @returns {Object} Derived schedule with medications filtered for the target date
   */
  deriveScheduleFromTemplate(templateSchedule, targetDate) {
    const dateParts = targetDate.split('-');
    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]) - 1;
    const day = parseInt(dateParts[2]);
    const targetDateTime = new Date(year, month, day);
    
    const derivedSchedule = {
      morning: [],
      afternoon: [],
      evening: [],
      createdAt: new Date().toISOString(),
      medicationsSnapshot: templateSchedule.medicationsSnapshot,
      cacheVersion: scheduleCache.getUserVersion(templateSchedule.userId || 0)
    };

    ['morning', 'afternoon', 'evening'].forEach(timeSlot => {
      templateSchedule[timeSlot].forEach(med => {
        const medicationSnapshot = templateSchedule.medicationsSnapshot.find(
          snap => snap.id === med.id
        );
        
        if (!medicationSnapshot) {
          derivedSchedule[timeSlot].push(med);
          return;
        }

        const createdDate = new Date(medicationSnapshot.created_at);
        const createdYear = createdDate.getFullYear();
        const createdMonth = createdDate.getMonth();
        const createdDay = createdDate.getDate();
        
        const createdDateOnly = new Date(createdYear, createdMonth, createdDay);
        const targetDateOnly = new Date(year, month, day);
        const daysSinceStart = Math.floor((targetDateOnly - createdDateOnly) / (1000 * 60 * 60 * 24));
        
        if (daysSinceStart < 0) {
          return;
        }

        const schedule = medicationSnapshot.schedule.toLowerCase();
        let shouldTake = true;

        if (schedule.includes('every other day')) {
          shouldTake = daysSinceStart % 2 === 0;
        } else if (schedule.includes('every 3 days')) {
          shouldTake = daysSinceStart % 3 === 0;
        } else if (schedule.includes('once a week')) {
          shouldTake = targetDateTime.getDay() === createdDate.getDay();
        } else if (schedule.includes('once a month')) {
          shouldTake = targetDateTime.getDate() === createdDate.getDate();
        }

        if (shouldTake) {
          const adjustedMed = {
            ...med,
            dosage: this.deterministicParser.getDosageForTime(
              { ...medicationSnapshot, schedule: medicationSnapshot.schedule },
              timeSlot,
              daysSinceStart
            )
          };
          derivedSchedule[timeSlot].push(adjustedMed);
        }
      });
    });

    const finalSchedule = this.deterministicParser.applyTimeSpecificOverrides(derivedSchedule, templateSchedule.medicationsSnapshot);
    return finalSchedule;
  }

  /**
   * Get medications that existed on a specific historical date
   * @param {number} userId - User ID to get medications for
   * @param {string} date - Historical date to check
   * @returns {Array} Array of medications that were active on the specified date
   */
  async getMedicationsForDate(userId, date) {
    const medQuery = `
      WITH latest_refills AS (
        SELECT 
          COALESCE(refill_of_id, id) as original_id,
          id,
          user_id,
          name,
          dosage,
          schedule,
          dose_type,
          specific_time,
          use_specific_time,
          photo_path,
          created_at,
          refill_of_id,
          ROW_NUMBER() OVER (
            PARTITION BY COALESCE(refill_of_id, id) 
            ORDER BY created_at DESC
          ) as rn
        FROM medications 
        WHERE user_id = $1 AND created_at <= $2
      )
      SELECT 
        id,
        user_id,
        name,
        dosage,
        schedule,
        dose_type,
        specific_time,
        use_specific_time,
        photo_path,
        created_at,
        refill_of_id
      FROM latest_refills 
      WHERE rn = 1
      ORDER BY created_at DESC
    `;
    
    const medResult = await this.db.query(medQuery, [userId, date + ' 23:59:59']);
    
    return medResult.rows;
  }

  /**
   * Get current medications for a user with consolidation logic for refills
   * @param {number} userId - User ID to get current medications for
   * @returns {Array} Array of consolidated current medications
   */
  async getCurrentMedications(userId) {
    const allMedicationsQuery = `
      SELECT *, COALESCE(refill_of_id, id) as original_id 
      FROM medications 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `;
    const allResult = await this.db.query(allMedicationsQuery, [userId]);
    
    const medicationsByName = new Map();
    allResult.rows.forEach(med => {
      const medName = med.name.toLowerCase();
      if (!medicationsByName.has(medName)) {
        medicationsByName.set(medName, []);
      }
      medicationsByName.get(medName).push(med);
    });
    
    const consolidatedMedications = [];
    for (const [medName, medications] of medicationsByName) {
      medications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      const mostRecent = medications[0];
      consolidatedMedications.push(mostRecent);
    }
    
    consolidatedMedications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    return consolidatedMedications;
  }

  /**
   * Check if medications have changed since template was created
   * @param {Array} currentMedications - Current medications for comparison
   * @param {Array} templateMedications - Template medications to compare against
   * @returns {boolean} True if medications have changed significantly
   */
  haveMedicationsChanged(currentMedications, templateMedications) {
    if (currentMedications.length !== templateMedications.length) {
      return true;
    }

    const currentMedMap = new Map(currentMedications.map(med => [med.id, med]));
    const templateMedMap = new Map(templateMedications.map(med => [med.id, med]));

    for (const [id, current] of currentMedMap) {
      const template = templateMedMap.get(id);
      if (!template) {
        return true;
      }
      
      const normalizeString = (str) => str ? str.trim().toLowerCase() : '';
      
      const currentName = normalizeString(current.name);
      const templateName = normalizeString(template.name);
      const currentDosage = normalizeString(current.dosage);
      const templateDosage = normalizeString(template.dosage);
      const currentSchedule = normalizeString(current.schedule);
      const templateSchedule = normalizeString(template.schedule);
      
      if (currentName !== templateName ||
          currentSchedule !== templateSchedule) {
        return true;
      }
    }

    for (const [id, template] of templateMedMap) {
      if (!currentMedMap.has(id)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Create a new persistent schedule for a specific user and date
   * @param {number} userId - User ID to create schedule for
   * @param {string} date - Date to create schedule for
   * @param {Array} medications - Medications to include in the schedule
   * @returns {Object} New persistent schedule object
   */
  async createNewPersistentSchedule(userId, date, medications) {
    if (medications.length === 0) {
      const emptySchedule = {
        morning: [],
        afternoon: [],
        evening: [],
        createdAt: new Date().toISOString(),
        medicationsSnapshot: [],
        cacheVersion: scheduleCache.getUserVersion(userId)
      };
      return emptySchedule;
    }

    const schedule = this.deterministicParser.parseSchedule(medications, date);
    
    const finalSchedule = this.deterministicParser.applyTimeSpecificOverrides(schedule, medications);
    
    const persistentSchedule = {
      ...finalSchedule,
      createdAt: new Date().toISOString(),
      userId: userId,
      medicationsSnapshot: medications.map(med => ({
        id: med.id,
        name: med.name,
        dosage: med.dosage,
        schedule: med.schedule,
        created_at: med.created_at
      })),
      cacheVersion: scheduleCache.getUserVersion(userId)
    };
    
    return persistentSchedule;
  }

  /**
   * Update template schedule with current medication changes
   * @param {Object} templateSchedule - Existing template schedule to update
   * @param {Array} currentMedications - Current medications to merge into template
   * @returns {Object} Updated template schedule with new medications
   */
  updateTemplateWithMedicationChanges(templateSchedule, currentMedications) {
    const currentMedMap = new Map(currentMedications.map(med => [med.id, med]));
    const templateMedMap = new Map(templateSchedule.medicationsSnapshot.map(med => [med.id, med]));
    
    const addedMedications = currentMedications.filter(med => !templateMedMap.has(med.id));
    const removedMedicationIds = Array.from(templateMedMap.keys()).filter(id => !currentMedMap.has(id));
    
    const updatedTemplate = {
      morning: [...templateSchedule.morning],
      afternoon: [...templateSchedule.afternoon],
      evening: [...templateSchedule.evening],
      createdAt: new Date().toISOString(),
      userId: templateSchedule.userId,
      medicationsSnapshot: currentMedications.map(med => ({
        id: med.id,
        name: med.name,
        dosage: med.dosage,
        schedule: med.schedule,
        created_at: med.created_at
      })),
      cacheVersion: scheduleCache.getUserVersion(templateSchedule.userId)
    };
    
    ['morning', 'afternoon', 'evening'].forEach(timeSlot => {
      updatedTemplate[timeSlot] = updatedTemplate[timeSlot].filter(med => 
        !removedMedicationIds.includes(med.id)
      );
    });
    
    if (addedMedications.length > 0) {
      const addedSchedule = this.deterministicParser.parseSchedule(addedMedications, templateSchedule.date);
      
      updatedTemplate.morning.push(...addedSchedule.morning);
      updatedTemplate.afternoon.push(...addedSchedule.afternoon);
      updatedTemplate.evening.push(...addedSchedule.evening);
    }
    
    return updatedTemplate;
  }
} 