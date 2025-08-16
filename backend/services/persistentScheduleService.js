// Persistent Schedule Service
// Handles creation and management of immutable schedules with improved consistency

import { scheduleCache } from '../cache/scheduleCache.js';
import { DeterministicScheduleParser } from './deterministicScheduleParser.js';

export class PersistentScheduleService {
  constructor(db, geminiModel = null) {
    this.db = db;
    // geminiModel parameter removed - now using deterministic parser only
    this.pendingRequests = new Map(); // Track pending requests to prevent duplicates
    this.deterministicParser = new DeterministicScheduleParser();
  }

  // Get or create a persistent schedule - SIMPLIFIED APPROACH
  async getOrCreatePersistentSchedule(userId, date) {
    const scheduleKey = `${userId}_${date}`;
    // Use local date for consistency with frontend
    const todayDate = new Date();
    const year = todayDate.getFullYear();
    const month = String(todayDate.getMonth() + 1).padStart(2, '0');
    const day = String(todayDate.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;
    
    console.log(`🎯 SIMPLIFIED CACHING: Processing ${date} (today: ${today})`);
    
    // RULE 1: Historical dates use cached data when available
    if (date < today) {
      console.log(`📅 HISTORICAL DATE ${date} - USING CACHED DATA`);
      
      if (scheduleCache.hasPersistentSchedule(scheduleKey)) {
        console.log(`✅ Serving cached historical schedule for ${date}`);
        return scheduleCache.getPersistentSchedule(scheduleKey);
      }
      
      console.log(`⚠️ No cached data for historical date ${date}, generating historical schedule with deterministic parser`);
      
      // Get medications that existed on this historical date
      const historicalMedications = await this.getMedicationsForDate(userId, date);
      
      if (!historicalMedications || historicalMedications.length === 0) {
        console.log(`📋 No medications existed on ${date}, creating empty historical schedule`);
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
        
        scheduleCache.setPersistentSchedule(scheduleKey, emptySchedule);
        return emptySchedule;
      }
      
      // Generate historical schedule using deterministic parser
      console.log(`🔧 Generating historical schedule for ${date} with ${historicalMedications.length} medications`);
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
      
      scheduleCache.setPersistentSchedule(scheduleKey, historicalSchedule);
      return historicalSchedule;
    }
    
    // RULE 2: Current/future dates use template approach with deterministic parser
    console.log(`📅 CURRENT/FUTURE DATE ${date} - TEMPLATE APPROACH`);
    
    if (scheduleCache.hasTemplateSchedule(userId)) {
      console.log(`📋 Template exists - deriving schedule with deterministic parser`);
      const templateSchedule = scheduleCache.getTemplateSchedule(userId);
      const derivedSchedule = this.deriveScheduleFromTemplate(templateSchedule, date);
      scheduleCache.setPersistentSchedule(scheduleKey, derivedSchedule);
      return derivedSchedule;
    } else {
      console.log(`🔧 NO TEMPLATE - Creating with deterministic parser`);
      
      const templateKey = `template_${userId}`;
      if (this.pendingRequests.has(templateKey)) {
        console.log(`⏳ Template creation in progress, waiting...`);
        return this.pendingRequests.get(templateKey);
      }
      
      const templatePromise = this.createTemplateWithDeterministicParser(userId, today);
      this.pendingRequests.set(templateKey, templatePromise);
      
      try {
        const templateSchedule = await templatePromise;
        const derivedSchedule = this.deriveScheduleFromTemplate(templateSchedule, date);
        scheduleCache.setPersistentSchedule(scheduleKey, derivedSchedule);
        return derivedSchedule;
      } finally {
        this.pendingRequests.delete(templateKey);
      }
    }
  }

  // Create template with deterministic parser
  async createTemplateWithDeterministicParser(userId, date) {
    console.log(`🔧 Creating template with deterministic parser for ${date}`);
    
    // Get current medications
    const medications = await this.getCurrentMedications(userId);
    
    if (!medications || medications.length === 0) {
      console.log(`⚠️ No medications found for user ${userId}, creating empty template`);
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
      scheduleCache.setTemplateSchedule(userId, emptyTemplate);
      return emptyTemplate;
    }
    
    // Generate schedule with deterministic parser
    const schedule = this.deterministicParser.parseSchedule(medications, date);
    
    // Apply time-specific overrides
    const modifiedSchedule = this.deterministicParser.applyTimeSpecificOverrides(schedule, medications);
    
    // Create template schedule
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
    
    // Cache the template
    scheduleCache.setTemplateSchedule(userId, templateSchedule);
    console.log(`✅ Template created and cached for user ${userId}`);
    
    return templateSchedule;
  }



  // Get persistent schedule info
  getPersistentScheduleInfo(userId, date) {
    const scheduleKey = `${userId}_${date}`;
    const persistentSchedule = scheduleCache.getPersistentSchedule(scheduleKey);
    
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

  // Force refresh a persistent schedule
  async forceRefreshPersistentSchedule(userId, date) {
    const scheduleKey = `${userId}_${date}`;
    
    // Remove existing persistent schedule
    if (scheduleCache.removePersistentSchedule(scheduleKey)) {
      console.log(`Removed existing persistent schedule for ${date} from user ${userId}`);
    }
    
    // Clear cache for this date
    const cacheKey = `${userId}_${date}`;
    scheduleCache.setCachedSchedule(cacheKey, null);
    
    // Create new persistent schedule
    const newPersistentSchedule = await this.getOrCreatePersistentSchedule(userId, date);
    
    return {
      scheduleCreatedAt: newPersistentSchedule.createdAt,
      totalMedications: newPersistentSchedule.medicationsSnapshot.length
    };
  }

  // Get cache statistics
  getCacheStats() {
    return scheduleCache.getCacheStats();
  }



  // Derive a daily schedule from a template schedule
  deriveScheduleFromTemplate(templateSchedule, targetDate) {
    console.log(`📋 Deriving schedule for ${targetDate} from template`);
    
    // Parse the target date
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
      cacheVersion: scheduleCache.getUserCacheVersion(templateSchedule.userId || 0)
    };

    // Process each time slot
    ['morning', 'afternoon', 'evening'].forEach(timeSlot => {
      templateSchedule[timeSlot].forEach(med => {
        // Find the medication in the snapshot to get creation date
        const medicationSnapshot = templateSchedule.medicationsSnapshot.find(
          snap => snap.id === med.id
        );
        
        if (!medicationSnapshot) {
          derivedSchedule[timeSlot].push(med);
          return;
        }

        // Calculate days since medication started
        const createdDate = new Date(medicationSnapshot.created_at);
        const createdYear = createdDate.getFullYear();
        const createdMonth = createdDate.getMonth();
        const createdDay = createdDate.getDate();
        
        const createdDateOnly = new Date(createdYear, createdMonth, createdDay);
        const targetDateOnly = new Date(year, month, day);
        const daysSinceStart = Math.floor((targetDateOnly - createdDateOnly) / (1000 * 60 * 60 * 24));
        
        // Skip if medication hasn't started yet
        if (daysSinceStart < 0) {
          return;
        }

        // Check if medication should be taken on this date
        const schedule = medicationSnapshot.schedule.toLowerCase();
        let shouldTake = true;



        // Check frequency patterns
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
          // Calculate the correct dosage for this date
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

    // Apply time-specific overrides to the derived schedule
    console.log(`🕐 Applying time-specific overrides to derived schedule for ${targetDate}`);
    const finalSchedule = this.deterministicParser.applyTimeSpecificOverrides(derivedSchedule, templateSchedule.medicationsSnapshot);
    return finalSchedule;
  }

  // Get medications that existed on a specific date (for historical schedules)
  async getMedicationsForDate(userId, date) {
    console.log(`📋 Getting medications for user ${userId} as they existed on ${date}`);
    
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
    console.log(`📋 Retrieved ${medResult.rows.length} medications for user ${userId} on ${date}`);
    
    return medResult.rows;
  }

  // Get current medications for a user - using same consolidation logic as API
  async getCurrentMedications(userId) {
    // Get all medications for this user
    const allMedicationsQuery = `
      SELECT *, COALESCE(refill_of_id, id) as original_id 
      FROM medications 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `;
    const allResult = await this.db.query(allMedicationsQuery, [userId]);
    
    // Group medications by their name first, then by original ID (medication family)
    // This handles cases where the same medication has multiple separate refill chains
    const medicationsByName = new Map();
    allResult.rows.forEach(med => {
      const medName = med.name.toLowerCase();
      if (!medicationsByName.has(medName)) {
        medicationsByName.set(medName, []);
      }
      medicationsByName.get(medName).push(med);
    });
    
    // For each medication name, find the most recent entry across all refill chains
    const consolidatedMedications = [];
    for (const [medName, medications] of medicationsByName) {
      // Sort all medications of this name by creation date (most recent first)
      medications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      const mostRecent = medications[0];
      consolidatedMedications.push(mostRecent);
    }
    
    // Sort by creation date (most recent first)
    consolidatedMedications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    console.log(`📋 Retrieved ${consolidatedMedications.length} consolidated medications for user ${userId}`);
    
    // Log consolidated medications for debugging
    consolidatedMedications.forEach(med => {
      if (med.refill_of_id) {
        console.log(`🔄 Refill: ${med.name} (ID: ${med.id}) is refill of ID: ${med.refill_of_id}`);
      } else {
        console.log(`📦 Original: ${med.name} (ID: ${med.id})`);
      }
    });
    
    return consolidatedMedications;
  }

  async getMedicationsForDate(userId, targetDate) {
    // Get medications that were active on a specific date
    // This considers when refills were created and shows the appropriate schedule for that date
    
    // First, get all medications for this user
    const allMedicationsQuery = `
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
        refill_of_id,
        COALESCE(refill_of_id, id) as original_id
      FROM medications 
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;
    
    const allMedicationsResult = await this.db.query(allMedicationsQuery, [userId]);
    console.log(`📅 Found ${allMedicationsResult.rows.length} total medications for user ${userId}`);
    
    // Group medications by their medication name to handle complex refill chains
    // This ensures all medications with the same name are grouped together
    const medicationGroups = new Map();
    
    for (const med of allMedicationsResult.rows) {
      const medName = med.name.toLowerCase().trim();
      if (!medicationGroups.has(medName)) {
        medicationGroups.set(medName, []);
      }
      medicationGroups.get(medName).push(med);
    }
    
    // For each medication group, find the version that was active on the target date
    const dateAwareMedications = [];
    const targetDateTime = new Date(targetDate);
    
    for (const [medName, medications] of medicationGroups) {
      // Sort medications by creation date (newest first)
      medications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      // Find the medication version that was active on the target date
      let activeMedication = null;
      
              // Find medications that are eligible for the target date
        const eligibleMedications = medications.filter(med => {
          const medDate = new Date(med.created_at);
          // Use local date comparison to avoid timezone issues
          const year = medDate.getFullYear();
          const month = String(medDate.getMonth() + 1).padStart(2, '0');
          const day = String(medDate.getDate()).padStart(2, '0');
          const medDateOnly = `${year}-${month}-${day}`;
          
          // A medication is eligible if:
          // 1. It was created on or before the target date, OR
          // 2. It's a recurring medication that should be taken on the target date
          const isEligible = medDateOnly <= targetDate;
          console.log(`🔍 Medication ${med.name} created on ${medDateOnly}, target date: ${targetDate}, eligible: ${isEligible}`);
          return isEligible;
        });
      
      if (eligibleMedications.length > 0) {
        // Always use the most recent medication (highest ID / latest created_at)
        // This ensures we get the latest refill and avoid duplicates
        activeMedication = eligibleMedications[0]; // Already sorted by newest first
        const isRefill = activeMedication.refill_of_id ? 'refill' : 'original';
        console.log(`📦 Using ${isRefill}: ${activeMedication.name} (ID: ${activeMedication.id}) - Schedule: ${activeMedication.schedule} for ${targetDate}`);
      }
      
      if (activeMedication) {
        dateAwareMedications.push(activeMedication);
      }
    }
    
    console.log(`📅 Retrieved ${dateAwareMedications.length} active medications for date ${targetDate} for user ${userId}`);
    return dateAwareMedications;
  }

  // Check if medications have changed since template was created
  haveMedicationsChanged(currentMedications, templateMedications) {
    // Compare medication counts
    if (currentMedications.length !== templateMedications.length) {
      console.log(`Medication count changed: ${templateMedications.length} -> ${currentMedications.length}`);
      return true;
    }

    // Create maps for efficient comparison by ID
    const currentMedMap = new Map(currentMedications.map(med => [med.id, med]));
    const templateMedMap = new Map(templateMedications.map(med => [med.id, med]));

    // Check for added or removed medications
    for (const [id, current] of currentMedMap) {
      const template = templateMedMap.get(id);
      if (!template) {
        console.log(`Medication added: ${current.name} (ID: ${id})`);
        return true;
      }
      
      // Normalize strings for comparison (trim whitespace, lowercase)
      const normalizeString = (str) => str ? str.trim().toLowerCase() : '';
      
      const currentName = normalizeString(current.name);
      const templateName = normalizeString(template.name);
      const currentDosage = normalizeString(current.dosage);
      const templateDosage = normalizeString(template.dosage);
      const currentSchedule = normalizeString(current.schedule);
      const templateSchedule = normalizeString(template.schedule);
      
      // Compare essential fields with normalized strings
      // Only consider it a change if the medication ID, name, or schedule actually changed
      // Ignore minor differences in dosage formatting or whitespace
      if (currentName !== templateName ||
          currentSchedule !== templateSchedule) {
        console.log(`Medication modified: ${template.name} -> ${current.name} (ID: ${id})`);
        console.log(`  Name: "${template.name}" vs "${current.name}" (${templateName} vs ${currentName})`);
        console.log(`  Dosage: "${template.dosage}" vs "${current.dosage}" (${templateDosage} vs ${templateDosage})`);
        console.log(`  Schedule: "${template.schedule}" vs "${current.schedule}" (${templateSchedule} vs ${currentSchedule})`);
        console.log(`  Created: "${template.created_at}" vs "${current.created_at}"`);
        return true;
      }
    }

    // Check for removed medications
    for (const [id, template] of templateMedMap) {
      if (!currentMedMap.has(id)) {
        console.log(`Medication removed: ${template.name} (ID: ${id})`);
        return true;
      }
    }

    console.log(`No medication changes detected`);
    return false;
  }

  // Create a new persistent schedule (extracted from getOrCreatePersistentSchedule)
  async createNewPersistentSchedule(userId, date, medications) {
    console.log(`🔄 Creating new persistent schedule for ${date} from user ${userId} (will make API call)`);
    
    console.log('=== MEDICATIONS BEING PROCESSED FOR SCHEDULE ===');
    console.log('Date:', date);
    console.log('User ID:', userId);
    console.log('Raw medication data:', JSON.stringify(medications, null, 2));
    console.log('=== END MEDICATION DATA ===');

    if (medications.length === 0) {
      const emptySchedule = {
        morning: [],
        afternoon: [],
        evening: [],
        createdAt: new Date().toISOString(),
        medicationsSnapshot: [],
        cacheVersion: scheduleCache.getUserCacheVersion(userId)
      };
      return emptySchedule;
    }

    // Use deterministic schedule generation
    console.log('🔧 Using deterministic schedule generation');
    const schedule = this.deterministicParser.parseSchedule(medications, date);
    
    // Apply time-specific overrides for medications with use_specific_time = true
    const finalSchedule = this.deterministicParser.applyTimeSpecificOverrides(schedule, medications);
    
    // Add metadata to the schedule
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
      cacheVersion: scheduleCache.getUserCacheVersion(userId)
    };
    
    return persistentSchedule;
  }

  // Apply time-specific overrides for medications with use_specific_time = true
  // DEPRECATED: This method is now handled by the deterministic parser
  applyTimeSpecificOverrides(schedule, medications) {
    console.log('⚠️ DEPRECATED: applyTimeSpecificOverrides called - using deterministic parser instead');
    return this.deterministicParser.applyTimeSpecificOverrides(schedule, medications);
  }

  // Helper method to format time for display
  // DEPRECATED: This method is now handled by the deterministic parser
  formatTimeForDisplay(timeString) {
    console.log('⚠️ DEPRECATED: formatTimeForDisplay called - using deterministic parser instead');
    return this.deterministicParser.formatTimeForDisplay(timeString);
  }

  // Create a schedule request (helper method for deduplication)
  async createScheduleRequest(userId, date, scheduleKey, datePeriod = null) {
    // Use date-aware medication retrieval to get the medications that were active on this specific date
    const dateAwareMedications = await this.getMedicationsForDate(userId, date);
    const persistentSchedule = await this.createNewPersistentSchedule(userId, date, dateAwareMedications);
    
    // Store the persistent schedule
    scheduleCache.setPersistentSchedule(scheduleKey, persistentSchedule);
    
    // If this is a new schedule for a period, also cache it as a period schedule
    if (datePeriod) {
      const periodKey = scheduleCache.getPeriodKey(userId, datePeriod.startDate, date);
      scheduleCache.setPeriodSchedule(periodKey, persistentSchedule);
      console.log(`💾 Cached period schedule: ${periodKey}`);
    }
    
    return persistentSchedule;
  }

  // Update template with medication changes (no API call needed)
  updateTemplateWithMedicationChanges(templateSchedule, currentMedications) {
    console.log(`📝 Updating template with medication changes (no API call)`);
    
    // Create a map of current medications by ID for quick lookup
    const currentMedMap = new Map(currentMedications.map(med => [med.id, med]));
    const templateMedMap = new Map(templateSchedule.medicationsSnapshot.map(med => [med.id, med]));
    
    // Find added and removed medications
    const addedMedications = currentMedications.filter(med => !templateMedMap.has(med.id));
    const removedMedicationIds = Array.from(templateMedMap.keys()).filter(id => !currentMedMap.has(id));
    
    console.log(`📝 Added medications:`, addedMedications.map(m => m.name));
    console.log(`📝 Removed medications:`, removedMedicationIds);
    
    // Create updated template
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
      cacheVersion: scheduleCache.getUserCacheVersion(templateSchedule.userId)
    };
    
    // Remove deleted medications from all time slots
    ['morning', 'afternoon', 'evening'].forEach(timeSlot => {
      updatedTemplate[timeSlot] = updatedTemplate[timeSlot].filter(med => 
        !removedMedicationIds.includes(med.id)
      );
    });
    
    // Add new medications using deterministic parser logic
    if (addedMedications.length > 0) {
      const addedSchedule = this.deterministicParser.parseSchedule(addedMedications, templateSchedule.date);
      
      // Merge the new medications into the template
      updatedTemplate.morning.push(...addedSchedule.morning);
      updatedTemplate.afternoon.push(...addedSchedule.afternoon);
      updatedTemplate.evening.push(...addedSchedule.evening);
      
      console.log(`🔧 Added ${addedMedications.length} new medications using deterministic parser`);
    }
    
    return updatedTemplate;
  }

  // Fallback function for medication schedule parsing 
  // DEPRECATED: This method is now handled by the deterministic parser
  parseMedicationScheduleFallback(medications, targetDate) {
    console.log('⚠️ DEPRECATED: parseMedicationScheduleFallback called - using deterministic parser instead');
    return this.deterministicParser.parseSchedule(medications, targetDate);
  }

  // Original fallback function for medication schedule parsing (LEGACY)
  parseMedicationScheduleFallbackLegacy(medications, targetDate) {
    // Fix timezone issue by creating date using local components
    const dateParts = targetDate.split('-')
    const year = parseInt(dateParts[0])
    const month = parseInt(dateParts[1]) - 1 // Month is 0-indexed
    const day = parseInt(dateParts[2])
    const targetDateTime = new Date(year, month, day)
    const morning = [];
    const afternoon = [];
    const evening = [];

    medications.forEach(med => {
      console.log(`Processing medication: ${med.name} - Schedule: "${med.schedule}"`);
      
      // Parse created_at properly - handle both string and Date objects
      let createdDate;
      if (typeof med.created_at === 'string') {
        // If it's a string, parse it as UTC and convert to local
        createdDate = new Date(med.created_at + 'Z'); // Add Z to treat as UTC
      } else {
        createdDate = new Date(med.created_at);
      }
      
      // Compare dates more accurately by using date components
      const createdYear = createdDate.getFullYear();
      const createdMonth = createdDate.getMonth();
      const createdDay = createdDate.getDate();
      
      const targetYear = targetDateTime.getFullYear();
      const targetMonth = targetDateTime.getMonth();
      const targetDay = targetDateTime.getDate();
      
      // Calculate days since start more accurately
      const createdDateOnly = new Date(createdYear, createdMonth, createdDay);
      const targetDateOnly = new Date(targetYear, targetMonth, targetDay);
      const daysSinceStart = Math.floor((targetDateOnly - createdDateOnly) / (1000 * 60 * 60 * 24));
      
      // Skip if medication hasn't started yet (allow same day)
      if (daysSinceStart < 0) {
        return;
      }

      const schedule = med.schedule.toLowerCase();
      let shouldTake = false;

      // Duration handling is now done by the LLM in generateScheduleWithLLM

      // Check frequency patterns
      if (schedule.includes('every other day')) {
        shouldTake = daysSinceStart % 2 === 0;
      } else if (schedule.includes('every 3 days')) {
        shouldTake = daysSinceStart % 3 === 0;
      } else if (schedule.includes('once a week')) {
        shouldTake = targetDateTime.getDay() === createdDate.getDay();
      } else if (schedule.includes('once a month')) {
        shouldTake = targetDateTime.getDate() === createdDate.getDate();
      } else if (schedule.includes('alternate between')) {
        // Handle alternating patterns like "alternate between 1 tablet and 2 tablets a day"
        shouldTake = true;
        console.log(`Alternating pattern detected for ${med.name}: ${schedule}`);
      } else if (schedule.includes('daily') || schedule.includes('every day') || 
                 schedule.includes('once daily') || schedule.includes('once a day') ||
                 schedule.includes('1 time a day') || schedule.includes('one time a day')) {
        shouldTake = true;
      } else if (schedule.includes('twice daily') || schedule.includes('twice a day') ||
                 schedule.includes('2 times a day') || schedule.includes('two times a day')) {
        shouldTake = true;
      } else if (schedule.includes('three times daily') || schedule.includes('three times a day') ||
                 schedule.includes('3 times a day')) {
        shouldTake = true;
      } else {
        // Default: include if it has time-related words
        shouldTake = schedule.includes('morning') || schedule.includes('afternoon') || 
                     schedule.includes('evening') || schedule.includes('night');
      }

      if (!shouldTake) {
        return;
      }

      // Determine time of day and dosage
      const medData = {
        id: med.id,
        name: med.name,
        originalSchedule: med.schedule
      };

      if (schedule.includes('three times daily') || schedule.includes('three times a day')) {
        // Distribute across morning, afternoon, and evening
        morning.push({
          ...medData,
          dosage: med.dosage,
          time: '8:00 AM'
        });
        afternoon.push({
          ...medData,
          dosage: med.dosage,
          time: '12:00 PM'
        });
        evening.push({
          ...medData,
          dosage: med.dosage,
          time: '6:00 PM'
        });
      } else if (schedule.includes('morning') && schedule.includes('evening')) {
        // Split morning and evening doses
        morning.push({
          ...medData,
          dosage: this.deterministicParser.getDosageForTime(med, 'morning', daysSinceStart),
          time: '8:00 AM'
        });
        evening.push({
          ...medData,
          dosage: this.deterministicParser.getDosageForTime(med, 'evening', daysSinceStart),
          time: '6:00 PM'
        });
      } else if (schedule.includes('twice daily') || schedule.includes('twice a day') ||
                 schedule.includes('2 times a day') || schedule.includes('two times a day')) {
        // Split into morning and evening
        morning.push({
          ...medData,
          dosage: med.dosage,
          time: '8:00 AM'
        });
        evening.push({
          ...medData,
          dosage: med.dosage,
          time: '6:00 PM'
        });
      } else if (schedule.includes('1 time a day') || schedule.includes('one time a day') ||
                 schedule.includes('once daily') || schedule.includes('once a day')) {
        // Place once daily medications in morning slot
        morning.push({
          ...medData,
          dosage: med.dosage,
          time: '8:00 AM'
        });
      } else if (schedule.includes('morning') || schedule.includes('breakfast')) {
        morning.push({
          ...medData,
          dosage: med.dosage,
          time: '8:00 AM'
        });
      } else if (schedule.includes('evening') || schedule.includes('night') || schedule.includes('dinner')) {
        evening.push({
          ...medData,
          dosage: med.dosage,
          time: '6:00 PM'
        });
      } else if (schedule.includes('alternate between')) {
        // Place alternating medications in afternoon slot
        afternoon.push({
          ...medData,
          dosage: this.deterministicParser.getDosageForTime(med, 'afternoon', daysSinceStart),
          time: '12:00 PM'
        });
      } else {
        afternoon.push({
          ...medData,
          dosage: med.dosage,
          time: '12:00 PM'
        });
      }
    });

    console.log('=== FINAL SCHEDULE CREATED ===');
    console.log('Morning:', morning.length, 'medications');
    console.log('Afternoon:', afternoon.length, 'medications');
    console.log('Evening:', evening.length, 'medications');
    console.log('=== END SCHEDULE CREATION ===');
    
    return { morning, afternoon, evening };
  }

  // Helper function to get dosage for specific time
  // DEPRECATED: This method is now handled by the deterministic parser
  getDosageForTime(med, timeOfDay, daysSinceStart = 0) {
    console.log('⚠️ DEPRECATED: getDosageForTime called - using deterministic parser instead');
    return this.deterministicParser.getDosageForTime(med, timeOfDay, daysSinceStart);
  }

  // NEW: Detect medication periods based on medication creation dates
  async detectMedicationPeriods(userId) {
    console.log(`🔍 Detecting medication periods for user ${userId}`);
    
    // Get all medications for this user with creation dates
    const allMedicationsQuery = `
      SELECT 
        id,
        name,
        created_at,
        COALESCE(refill_of_id, id) as original_id
      FROM medications 
      WHERE user_id = $1
      ORDER BY created_at ASC
    `;
    
    const result = await this.db.query(allMedicationsQuery, [userId]);
    const medications = result.rows;
    
    if (medications.length === 0) {
      return [];
    }
    
    // Group medications by creation date (day level)
    const medicationGroups = new Map();
    medications.forEach(med => {
      const dateKey = med.created_at.split('T')[0];
      if (!medicationGroups.has(dateKey)) {
        medicationGroups.set(dateKey, []);
      }
      medicationGroups.get(dateKey).push(med);
    });
    
    // Create periods based on medication changes
    const periods = [];
    const sortedDates = Array.from(medicationGroups.keys()).sort();
    
    for (let i = 0; i < sortedDates.length; i++) {
      const startDate = sortedDates[i];
      const endDate = i === sortedDates.length - 1 ? 'future' : sortedDates[i + 1];
      
      // Count unique medications up to this date
      const medicationsUpToDate = medications.filter(med => 
        med.created_at.split('T')[0] <= startDate
      );
      
      // Get unique original medications (handle refills)
      const uniqueMedications = new Set();
      medicationsUpToDate.forEach(med => uniqueMedications.add(med.original_id));
      
      const period = {
        startDate: startDate,
        endDate: endDate,
        medicationCount: uniqueMedications.size,
        medicationIds: Array.from(uniqueMedications)
      };
      
      periods.push(period);
      console.log(`📅 Period ${i + 1}: ${startDate} to ${endDate} (${uniqueMedications.size} medications)`);
    }
    
    return periods;
  }

  // NEW: Find the period for a specific date
  findPeriodForDate(periods, date) {
    for (const period of periods) {
      if (date >= period.startDate && (period.endDate === 'future' || date <= period.endDate)) {
        return period;
      }
    }
    return null;
  }

  // LEGACY FALLBACK - REDIRECTS TO CURRENT LOGIC
  async getOrCreatePersistentScheduleFallback(userId, date) {
    console.log(`⚠️ LEGACY FALLBACK CALLED - REDIRECTING TO CURRENT LOGIC`);
    return this.getOrCreatePersistentSchedule(userId, date);
  }
} 