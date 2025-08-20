/**
 * Internationalization Service
 * Handles language switching and text translation for the application
 */

// Translation data - English
const en = {
  // Common UI elements
  common: {
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    confirm: 'Confirm',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    close: 'Close',
    yes: 'Yes',
    no: 'No',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    info: 'Information',
    note: 'Note',
    days: 'days',
    units: 'units',
    notSpecified: 'Not specified'
  },

  // Navigation
  navigation: {
    home: 'Home',
    schedule: 'Schedule',
    verify: 'Verify',
    add: 'Add',
    history: 'History',
    manage: 'Manage',
    refill: 'Refill Dashboard'
  },

  // Refill Dashboard
  refillDashboard: {
    title: 'Refill Dashboard',
    addMedication: '+ Add Medication',
    manageAll: 'Manage All',
    greeting: 'Hi there',
    description: 'Monitor your medication refills and manage reminders',
    summaryCards: {
      totalMedications: 'Total Medications',
      lowSupply: 'Low Supply',
      overdue: 'Overdue',
      dueSoon: 'Due Soon'
    },
    tabs: {
      medications: 'Medications & Refills',
      reminders: 'Upcoming Reminders',
      calculations: 'Calculation Details'
    },
    medicationsTab: {
      title: 'Medications with Refill Data',
      description: 'View detailed refill status for each medication',
      noMedications: 'No medications with refill data',
      noMedicationsDescription: 'Add medications with pharmacy labels to see refill information',
      addMedication: 'Add Medication'
    },
    remindersTab: {
      title: 'Upcoming Refill Reminders',
      description: 'Manage your refill reminders and notifications',
      noReminders: 'No upcoming reminders',
      noRemindersDescription: 'Reminders will appear here when you have medications due for refills'
    },
    calculationsTab: {
      title: 'Refill Calculation Details',
      description: 'Compare pharmacy estimates with schedule-aware calculations',
      noCalculations: 'No calculation comparisons available',
      noCalculationsDescription: 'Medications with schedules and quantities will show calculation comparisons'
    },
    medicationCard: {
      daysUntilRefill: 'Days Until Refill',
      supplyRemaining: 'Supply Remaining',
      refillDate: 'Refill Date',
      refillsLeft: 'Refills Left',
      schedule: 'Schedule',
      message: 'Message',
      viewDetails: 'View Details',
      manageReminders: 'Manage Reminders',
      calculation: 'Calculation'
    },
    reminderCard: {
      date: 'Date',
      message: 'Message',
      noMessage: 'No message',
      dismiss: 'Dismiss'
    },
    calculationCard: {
      scheduleInformation: 'Schedule Information',
      quantity: 'Quantity',
      pharmacyDaysSupply: 'Pharmacy Days Supply',
      enhancedCalculation: 'Enhanced Calculation',
      method: 'Method',
      consumptionRate: 'Consumption Rate',
      actualDaysSupply: 'Actual Days Supply',
      viewDetails: 'View Details',
      clickToSeeCalculation: 'Click "View Details" to see calculation'
    },
    loading: 'Loading refill data...',
    error: {
      title: 'Error loading dashboard data',
      tryAgain: 'Try Again'
    },
    modals: {
      refillStatus: {
        title: 'Refill Status',
        daysUntilRefill: 'Days Until Refill',
        daysOfSupplyRemaining: 'Days of Supply Remaining',
        refillDate: 'Refill Date',
        refillsRemaining: 'Refills Remaining',
        calculationComparison: 'Calculation Comparison',
        recommendation: 'Recommendation',
        difference: 'Difference',
        supplyGood: 'supply is good',
        daysRemaining: 'days remaining'
      },
      refillCalculation: {
        title: 'Refill Calculation Details',
        pharmacyEstimate: 'Pharmacy Estimate (Basic)',
        enhancedCalculation: 'Enhanced Calculation',
        analysis: 'Analysis',
        refillDate: 'Refill Date',
        daysUntil: 'Days Until',
        daysSupply: 'Days Supply',
        assumption: 'Assumption',
        consumptionRate: 'Consumption Rate',
        scheduleUsed: 'Schedule Used',
        difference: 'Difference',
        recommendation: 'Recommendation',
        dailyConsumption: 'Daily consumption',
        method: 'Method',
        dosesPerDay: 'doses/day'
      },
      refillReminders: {
        title: 'Refill Reminders',
        noRemindersFound: 'No refill reminders found for this medication.',
        generateReminders: 'Generate Reminders',
        reminderType: 'Reminder Type',
        status: 'Status',
        dismiss: 'Dismiss',
        noMessage: 'No message',
        refillDue: 'refill due',
        dueInDays: 'due in {days} days',
        dueTomorrow: 'due tomorrow',
        urgent: 'URGENT:',
        finalReminder: 'FINAL REMINDER:'
      }
    },
    status: {
      good: 'GOOD',
      low: 'LOW',
      overdue: 'OVERDUE',
      dueSoon: 'DUE SOON'
    },
    urgency: {
      low: 'LOW',
      medium: 'MEDIUM',
      high: 'HIGH',
      none: 'NONE'
    },
    reminderType: {
      refillDue: 'REFILL DUE',
      refill_due: 'REFILL DUE',
      refillExpiring: 'REFILL EXPIRING',
      lowSupply: 'LOW SUPPLY'
    },
    reminderStatus: {
      pending: 'PENDING',
      sent: 'SENT',
      dismissed: 'DISMISSED'
    },
    
    // Status labels for modals
    pending: 'pending',
    taken: 'taken',
    sent: 'sent',
    dismissed: 'dismissed',
    
    // Status label translations for display
    statusLabels: {
      pending: 'pending',
      taken: 'taken',
      sent: 'sent',
      dismissed: 'dismissed'
    },
    
    // Reminder type labels for display
    reminderTypeLabels: {
      refillDue: 'refill due',
      refill_due: 'refill due',
      urgent: 'URGENT',
      finalReminder: 'FINAL REMINDER'
    },
    
    // Backend message translations
    supplyGoodMessage: '{medication} supply is good ({days} days remaining)',
    pharmacyEstimateAccurate: 'Pharmacy estimate is accurate for this schedule',
    dailyConsumption: 'Daily consumption',
    schedulePrefix: 'Schedule: ',
    
    // Refill reminder specific translations
    refillForMedicationDueInDays: 'Refill for {medication} is due in {days} days',
    refillForMedicationDueTomorrow: 'Refill for {medication} is due tomorrow',
    urgentRefillDueInDays: 'URGENT: Refill for {medication} is due in {days} days',
    finalReminderDueTomorrow: 'FINAL REMINDER: Refill for {medication} is due tomorrow',
    
    // Status and urgency values for display
    statusValues: {
      good: 'GOOD',
      low: 'LOW',
      overdue: 'OVERDUE',
      dueSoon: 'DUE SOON'
    },
    urgencyValues: {
      low: 'LOW',
      medium: 'MEDIUM',
      high: 'HIGH',
      none: 'NONE'
    },
    
    // Dynamic message patterns
    messagePatterns: {
      supplyGood: '{medication} supply is good ({days} days remaining)',
      urgentRefill: 'URGENT: Refill for {medication} is due in {days} days',
      finalReminder: 'FINAL REMINDER: Refill for {medication} is due tomorrow',
      refillDue: 'refill due',
      refillDueInDays: 'due in {days} days'
    },
    
    // Dynamic message translations
    dynamicMessages: {
      supplyGood: '{medication} supply is good ({days} days remaining)',
      urgentRefill: 'URGENT: Refill for {medication} is due in {days} days',
      finalReminder: 'FINAL REMINDER: Refill for {medication} is due tomorrow',
      refillDue: 'refill due',
      refillDueInDays: 'due in {days} days'
    },
    
    // Success messages
    refillCreatedSuccess: 'Refill created successfully! Refill reminders have been updated.',
    
    // Medication instruction translations
    medicationInstructions: {
      takeTablet: 'Take {quantity} tablet{plural} by mouth {frequency}',
      takeCapsule: 'Take {quantity} capsule{plural} by mouth {frequency}',
      takeLiquid: 'Take {quantity} {unit} of liquid {frequency}',
      takeInjection: 'Take {quantity} injection{plural} {frequency}',
      takeInhaler: 'Use inhaler {quantity} time{plural} {frequency}',
      takeDrops: 'Take {quantity} drop{plural} {frequency}',
      takePatch: 'Apply {quantity} patch{plural} {frequency}',
      takeCream: 'Apply {quantity} {unit} of cream {frequency}',
      takeSuppository: 'Insert {quantity} suppository{plural} {frequency}'
    },
    
    // Frequency translations
    frequency: {
      daily: 'every day',
      twiceDaily: 'twice daily',
      threeTimesDaily: 'three times daily',
      every4Hours: 'every 4 hours',
      every6Hours: 'every 6 hours',
      every8Hours: 'every 8 hours',
      every12Hours: 'every 12 hours',
      weekly: 'weekly',
      monthly: 'monthly',
      asNeeded: 'as needed',
      beforeMeals: 'before meals',
      afterMeals: 'after meals',
      withFood: 'with food',
      onEmptyStomach: 'on empty stomach'
    }
  },

  // Header and main content
  header: {
    title: 'MediHelper',
    signIn: 'Sign in with Google',
    signOut: 'Sign Out',
    welcome: 'Welcome back to your medication management'
  },

  // Dashboard
  dashboard: {
    greeting: 'Hi there',
    greetingWithName: 'Hi {name}',
    nextDose: 'Next Dose',
    allDone: 'All Done!',
    noUpcomingDoses: 'No upcoming doses today',
    tomorrow: 'Tomorrow',
    todaysSchedule: 'Today\'s Schedule',
    viewAll: 'View All',
    noMedicationsToday: 'No medications scheduled for today',
    allDoneForToday: 'All done for today!',
    completedAllMedications: 'You\'ve completed all your medications',
    unableToLoadSchedule: 'Unable to load schedule'
  },

  // Schedule
  schedule: {
    description: 'Here\'s your medication schedule for today',
    today: 'Today',
    yourSchedule: 'Your medication schedule',
    showTaken: 'Show Taken',
    hideTaken: 'Hide Taken',
    doseTrackingTitle: 'How Dose Tracking Works',
    doseTrackingText: 'Use the "Verify" tab to document doses with photo verification. Once taken, medications are hidden by default - click "Show Taken" to view completed doses.',
    notificationsTitle: 'Simple Notifications',
    notificationsText: 'Notifications enabled! You\'ll receive medication reminders.',
    noMedicationsScheduled: 'No medications scheduled',
    quickVerify: 'Quick Verify',
    viewHistory: 'View History',
    refillRemindersTitle: 'Refill Reminders',
    medicationsNeedAttention: 'Medications that need attention',
    noRefillReminders: 'No refill reminders today',
    checkOtherDates: 'Check other dates for upcoming refill reminders',
    quickActions: 'Quick Actions',
    pending: 'Pending',
    dosage: 'Dosage',
    time: 'Time',
    schedule: 'Schedule',
    useVerificationPage: 'Use verification page to log dose',
    hidingCompletedDoses: 'Hiding completed doses (auto-updating)',
    lastUpdated: 'Last updated',
    allGood: 'All good!',
    noRefillsNeeded: 'No refills needed right now',
    daysUntilRefill: 'Days Until Refill',
    supplyRemaining: 'Supply Remaining',
    refillsLeft: 'Refills Left',
    days: 'days',
    manage: 'Manage',
    notificationsBlocked: 'Notifications blocked. Please enable in browser settings.',
    showingAllDoses: 'Showing all doses (auto-updating)',
    completedDosesHidden: 'Completed doses are hidden by default. Click "Show Taken" to see them.',
    // Notification translations
    notifications: {
      medicationReminder: 'Medication Reminder',
      timeToTake: 'Time to take {medication}!',
      reminderSystemRestarted: 'Reminder system restarted! You\'ll receive medication reminders.',
      notificationsEnabled: 'Notifications enabled! You\'ll now receive medication reminders.',
      permissionDenied: 'Notification permission denied. Please enable in browser settings.',
      errorEnabling: 'Error enabling notifications. Please try again.',
      reminderSystemStarted: 'Reminder system started! You\'ll receive medication reminders.',
      medicationReminderPrefix: 'Medication reminder:'
    },
    // Medication instruction patterns
    medicationInstructions: {
      takeTablet: 'Take {count} tablet{plural} by mouth {frequency}',
      takeCapsule: 'Take {count} capsule{plural} {frequency}',
      takeLiquid: 'Take {count} {unit} {frequency}',
      takeInjection: 'Take {count} injection{plural} {frequency}',
      takeInhaler: 'Use inhaler {count} time{plural} {frequency}',
      takeDrops: 'Take {count} drop{plural} {frequency}',
      takePatch: 'Apply {count} patch{plural} {frequency}',
      takeCream: 'Apply {count} {unit} of cream {frequency}',
      takeSuppository: 'Insert {count} suppository{plural} {frequency}',
      // Common frequency patterns
      frequency: {
        daily: 'every day',
        twiceDaily: 'twice daily',
        threeTimesDaily: 'three times daily',
        every4Hours: 'every 4 hours',
        every6Hours: 'every 6 hours',
        every8Hours: 'every 8 hours',
        every12Hours: 'every 12 hours',
        weekly: 'weekly',
        monthly: 'monthly',
        asNeeded: 'as needed',
        beforeMeals: 'before meals',
        afterMeals: 'after meals',
        withFood: 'with food',
        onEmptyStomach: 'on empty stomach'
      }
    },
    // Refill reminder translations
    refillReminders: {
      title: 'Refill Reminders',
      description: 'Medications to pay attention to',
      noRemindersToday: 'No refill reminders today',
      checkOtherDates: 'Check other dates for upcoming refill reminders',
      allGood: 'All good!',
      noRefillsNeeded: 'No refills needed right now',
      reminderDate: 'Reminder Date:',
      manage: 'Manage',
      unableToLoad: 'Unable to load refill reminders'
    },
    
    // Reminder type translations
    reminderTypes: {
      refill_due: 'REFILL DUE',
      low_supply: 'LOW SUPPLY',
      refill_expiring: 'REFILL EXPIRING'
    },
    
    // Reminder status translations
    reminderStatus: {
      pending: 'pending',
      sent: 'sent',
      dismissed: 'dismissed'
    }
  },

      // Action cards
  actions: {
    addMedication: 'Add Medication',
    scanOrUpload: 'Scan or upload medication',
    manageMedications: 'Manage Medications',
    editSchedulesRefills: 'Edit schedules & refills',
    refillDashboard: 'Refill Dashboard',
    monitorRefillsReminders: 'Monitor refills & reminders',
    verifyMedication: 'Verify Medication',
    trackAndVerify: 'Track and verify doses',
    // Verify page specific
    selectMedicationToVerify: 'Select Medication to Verify',
    takePhotoOfPill: 'Take Photo of Pill',
    takePhotoOfPillDesc: 'Take a photo of the pill to verify you\'re taking the correct medication',
    takePhotoOfPillBtn: 'Take Photo',
    retake: 'Retake',
    orUploadFromGallery: 'Or upload from gallery',
    verificationStatus: 'Verification Status',
    photoCaptured: 'Photo captured',
    pillVerification: 'Pill verification',
    doseRecorded: 'Dose recorded',
    verifyMedicationTaken: 'Verify Medication Taken',
    quickActions: 'Quick Actions',
    viewSchedule: 'View Schedule',
    viewHistory: 'View History',
    verifyAddMedication: 'Add Medication',
    medicationTaken: 'Medication Taken!',
    medicationRecordedSuccessfully: 'Your medication has been recorded successfully.',
    continue: 'Continue',
    verifyingMedication: 'Verifying medication...',
    backToSelection: 'Back to selection',
    clickToCaptureOrUpload: 'Click to capture or upload',
    
    // AI Verification specific translations
    aiVerificationResults: 'AI Verification Results',
    verificationDetails: 'Verification Details',
    confidence: 'Confidence',
    reason: 'Reason',
    description: 'Description',
    doseRecordedWithWarning: 'Dose Recorded with Warning',
    doseRecorded: 'Dose Recorded',
    doseRecordedSuccessfully: 'Your medication dose has been recorded successfully.',
    aiVerificationUnavailable: 'AI verification was temporarily unavailable, so we used a fallback method.',
    noPillVisible: 'No pill visible',
    pillDetected: 'Pill detected',
    medicationLoggedWithPhoto: 'Your medication has been logged with photo evidence.',
    pleaseDoubleCheck: 'Please double-check that you\'re taking the correct medication.',
    verificationIssue: 'Verification issue',
    doseRecordedButIssue: 'Your dose has been recorded, but there was a verification issue.',
    but: 'but',
    thereWasVerificationIssue: 'there was a verification issue',
    
    // AI Response pattern translations
    theImageShows: 'The image shows',
    smallRoundWhitePill: 'small, round, white pill',
    thisIsConsistentWith: 'This is consistent with',
    common: 'common',
    pills: 'pills',
    howeverWithoutMarkings: 'However, without markings',
    furtherInformation: 'further information',
    confidenceIs: 'confidence is',
    theImageShowsAHand: 'The image shows a hand',
    holding: 'holding',
    // Verification details
    cannotVerifyAtThisTime: 'Cannot verify {medication} at this time',
    time: 'Time:',
    shouldBeTakenAt: 'Should be taken at {time} (±2 hours)',
    frequency: 'Frequency:',
    canTakeDose: 'Can take dose {taken} of {total} today',
    recentDose: 'Recent Dose:',
    noPreviousDosesToday: 'No previous doses today',
    chooseDifferentMedication: 'Choose Different Medication',
    verifyAnyway: 'Verify Anyway (Override)',
    // Dynamic message patterns
    canBeTakenAt: 'Can be taken at {time} (±2 hours)',
    shouldBeTakenAt: 'Should be taken at {time} (±2 hours)',
    canTakeDose: 'Can take dose {taken} of {total} today',
    alreadyTaken: 'Already taken {taken} of {total} doses today',
    lastDoseWas: 'Last dose was {minutes} minutes ago',
    // Loading and error states
    noMedicationsFound: 'No medications found',
    errorLoadingMedications: 'Error Loading Medications',
    addYourFirstMedication: 'Add your first medication to get started',
    tryAgain: 'Try Again',
    // Authentication
    authenticationRequired: 'Authentication Required',
    needToSignIn: 'You need to sign in to verify medications',
    goToHomePage: 'Go to Home Page'
  },

  // Stats
  stats: {
    adherenceRate: 'Adherence Rate',
    activeMedications: 'Active Medications',
    daysStreak: 'Days Streak'
  },

  // Medication items
  medication: {
    taken: 'Taken',
    pending: 'Pending',
    verified: 'Verified via camera',
    timeSlots: {
      morning: 'Morning',
      afternoon: 'Afternoon',
      evening: 'Evening'
    }
  },

  // Language switcher
  language: {
    english: 'English',
    chinese: '中文',
    switchLanguage: 'Switch Language'
  },

  // Auth
  auth: {
    login: 'Login',
    logout: 'Logout',
    signIn: 'Sign In',
    signOut: 'Sign Out',
    notAuthenticated: 'Not authenticated',
    redirectingToLogin: 'Redirecting to login'
  },

  // Time
  time: {
    am: 'AM',
    pm: 'PM',
    today: 'Today',
    tomorrow: 'Tomorrow',
    yesterday: 'Yesterday',
    thisWeek: 'This week',
    nextWeek: 'Next week',
    // Weekday names
    weekdays: {
      sunday: 'Sunday',
      monday: 'Monday',
      tuesday: 'Tuesday',
      wednesday: 'Wednesday',
      thursday: 'Thursday',
      friday: 'Friday',
      saturday: 'Saturday'
    },
    // Month names
    months: {
      january: 'January',
      february: 'February',
      march: 'March',
      april: 'April',
      may: 'May',
      june: 'June',
      july: 'July',
      august: 'August',
      september: 'September',
      october: 'October',
      november: 'November',
      december: 'December'
    },
    // Time ranges
    timeRanges: {
      morning: '8:00 AM - 12:00 PM',
      afternoon: '12:00 PM - 5:00 PM',
      evening: '5:00 PM - 12:00 AM'
    }
  },

  // Add Medication Page
  addMedication: {
    newMedication: 'New Medication',
    refillMedication: 'Refill Medication',
    selectMedicationToRefill: 'Select Medication to Refill',
    uploadPhoto: 'Upload Photo',
    previewEdit: 'Preview / Edit',
    cameraActive: 'Camera active - align bottle in frame',
    takePhotoOfBottle: 'Take a photo of your medication bottle',
    takePhoto: 'Take Photo',
    retake: 'Retake',
    orUploadFromGallery: 'Or upload from gallery',
    dragAndDrop: 'Drag & drop',
    orClickToBrowse: 'or click to browse files',
    chooseFile: 'Choose File',
    next: 'Next',
    medicationPhoto: 'Medication Photo',
    medicationInformation: 'Medication Information',
    medicationName: 'Medication Name',
    dosage: 'Dosage',
    schedule: 'Schedule',
    specificTime: 'Specific Time (optional)',
    refillInformation: 'Refill Information (Optional)',
    dateFilled: 'Date Filled',
    quantity: 'Quantity',
    daysSupply: 'Days Supply',
    refillsRemaining: 'Refills Remaining',
    pharmacyName: 'Pharmacy Name',
    rxNumber: 'RX Number',
    refillExpiryDate: 'Refill Expiry Date',
    saveMedication: 'Save Medication',
    saveRefill: 'Save Refill',
    back: 'Back',
    processingMedication: 'Processing medication...',
    errorAddingMedication: 'Error adding medication',
    error: 'Error',
    pleaseUploadPhotoFirst: 'Please upload a photo first'
  },

  // History Page
  history: {
    medicationHistory: 'Medication History',
    last7Days: 'Last 7 days',
    last30Days: 'Last 30 days',
    last3Months: 'Last 3 months',
    refreshData: 'Refresh data',
    hiThere: 'Hi there',
    viewHistoryAndTrends: 'View your medication history and trends',
    takenToday: 'Taken Today',
    pending: 'Pending',
    totalMedications: 'Total Medications',
    recentActivity: 'Recent Activity',
    allMedications: 'All Medications',
    recentDoseHistory: 'Recent Dose History',
    medicationIntakePast7Days: 'Your medication intake over the past 7 days',
    allMedicationsHeader: 'All Medications',
    completeListOfMedications: 'Complete list of your medications',
    loadingHistory: 'Loading history...',
    noRecentHistory: 'No recent medication history',
    medicationIntakeWillAppearHere: 'Your medication intake will appear here',
    noMedicationsFound: 'No medications found',
    addYourFirstMedication: 'Add your first medication to get started',
    addMedication: 'Add Medication',
    today: 'Today',
    yesterday: 'Yesterday',

    specificTime: 'Specific time',
    added: 'Added'
  },

  // Manage Medications Page
  manageMedications: {
    manageMedications: 'Manage Medications',
    addNew: '+ Add New',
    hiThere: 'Hi there',
    manageYourMedicationsAndRefills: 'Manage your medications and refills',
    loadingMedications: 'Loading medications...',
    editMedication: 'Edit Medication',
    medicationName: 'Medication Name',
    dosage: 'Dosage',
    schedule: 'Schedule',
    specificTime: 'Time',
    specificTimeOptional: 'Specific Time (optional)',
    saveChanges: 'Save Changes',
    cancel: 'Cancel',
    refillHistory: 'Refill History',
    close: 'Close',
    deleteMedication: 'Delete Medication',
    actionCannotBeUndone: 'This action cannot be undone',
    deleteConfirmation: 'Are you sure you want to delete',
    deleteConfirmationDetails: 'This will also remove all associated dose logs and history.',
    yesDelete: 'Yes, Delete',
    refill: 'Refill',
    aiExtracted: '🤖 AI Extracted',
    manualEntry: '📝 Manual Entry',
    notSpecified: 'Not specified',
    added: 'Added',
    refillInformation: 'Refill Information',
    dateFilled: 'Date Filled',
    quantity: 'Quantity',
    daysSupply: 'Days Supply',
    refillsLeft: 'Refills Left',
    pharmacy: 'Pharmacy',
    expires: 'Expires',
    viewRefillStatus: 'View Refill Status',
    calculationDetails: 'Calculation Details',
    manageReminders: 'Manage Reminders',
    edit: 'Edit',
    delete: 'Delete',
    addRefillData: 'Add Refill Data',
    refillOverdue: 'Refill Overdue',
    refillDueSoon: 'Refill Due Soon',
    lowSupply: 'Low Supply',
    createRefill: 'Create Refill',
    
    // Modal translations
    refillStatus: {
      title: 'Refill Status',
      daysUntilRefill: 'Days Until Refill',
      daysOfSupplyRemaining: 'Days of Supply Remaining',
      refillDate: 'Refill Date',
      refillsRemaining: 'Refills Remaining',
      calculationComparison: 'Calculation Comparison',
      recommendation: 'Recommendation',
      difference: 'Difference',
      supplyGood: 'supply is good',
      daysRemaining: 'days remaining'
    },
    refillCalculation: {
      title: 'Refill Calculation Details',
      pharmacyEstimate: 'Pharmacy Estimate (Basic)',
      enhancedCalculation: 'Enhanced Calculation',
      analysis: 'Analysis',
      refillDate: 'Refill Date',
      daysUntil: 'Days Until',
      daysSupply: 'Days Supply',
      assumption: 'Assumption',
      dailyConsumption: 'Daily consumption',
      consumptionRate: 'Consumption Rate',
      scheduleUsed: 'Schedule Used',
      difference: 'Difference',
      recommendation: 'Recommendation',
      dailyConsumption: 'Daily consumption',
      method: 'Method',
      dosesPerDay: 'doses/day'
    },
    refillReminders: {
      title: 'Refill Reminders',
      noRemindersFound: 'No refill reminders found for this medication.',
      generateReminders: 'Generate Reminders',
      reminderType: 'Reminder Type',
      status: 'Status',
      dismiss: 'Dismiss',
      refillDue: 'refill due',
      dueInDays: 'due in {days} days',
      dueTomorrow: 'due tomorrow',
      urgent: 'URGENT:',
      finalReminder: 'FINAL REMINDER:'
    },
    
    // Refill History
    refillHistory: 'Refill History',
    created: 'Created',
    original: 'Original',
    
    // Create Refill
    createRefillTitle: 'Create Refill',
    supplyRemaining: 'Supply Remaining',
    refillsLeft: 'Refills Left',
    nextRefillDate: 'Next Refill Date',
    createRefillNow: 'Create Refill Now',
    cancel: 'Cancel',
    whatHappensWhenCreateRefill: 'What happens when you create a refill:',
    newMedicationEntryCreated: 'A new medication entry will be created as a refill',
    refillRemindersUpdated: 'Your refill reminders will be updated',
    trackBothOriginalAndRefill: 'You can track both original and refill medications',
    noMessage: 'No message',
    noRefillRemindersFound: 'No refill reminders found for this medication.',
    generateReminders: 'Generate Reminders',
    noRefillsFound: 'No refills found',
    
    // Additional keys that are referenced in HTML
    daysUntilRefill: 'Days Until Refill',
    daysOfSupplyRemaining: 'Days of Supply Remaining',
    refillDate: 'Refill Date',
    refillsRemaining: 'Refills Remaining',
    calculationComparison: 'Calculation Comparison',
    recommendation: 'Recommendation',
    difference: 'Difference',
    supplyGood: 'supply is good',
    daysRemaining: 'days remaining',
    pharmacyEstimate: 'Pharmacy Estimate (Basic)',
    enhancedCalculation: 'Enhanced Calculation',
    analysis: 'Analysis',
    daysUntil: 'Days Until',
    daysSupply: 'Days Supply',
    assumption: 'Assumption',
    dailyConsumption: 'Daily consumption',
    consumptionRate: 'Consumption Rate',
    scheduleUsed: 'Schedule Used',
    method: 'Method',
    dosesPerDay: 'doses/day',
    good: 'GOOD',
    low: 'LOW',
    overdue: 'OVERDUE',
    dueSoon: 'DUE SOON',
    medium: 'MEDIUM',
    high: 'HIGH',
    none: 'NONE',
    days: 'days',
    percent: '%',
    pharmacyEstimateAccurate: 'Pharmacy estimate is accurate for this schedule',
    refillForMedicationDueInDays: 'Refill for {medication} is due in {days} days',
    refillForMedicationDueTomorrow: 'Refill for {medication} is due tomorrow',
    urgentRefillDueInDays: 'URGENT: Refill for {medication} is due in {days} days',
    finalReminderDueTomorrow: 'FINAL REMINDER: Refill for {medication} is due tomorrow',
    supplyGoodMessage: '{medication} supply is good ({days} days remaining)',
    confidenceHigh: 'High',
    confidenceMedium: 'Medium',
    confidenceLow: 'Low',
    
    // Backend message translations
    supplyGoodMessage: '{medication} supply is good ({days} days remaining)',
    pharmacyEstimateAccurate: 'Pharmacy estimate is accurate for this schedule',
    dailyConsumption: 'Daily consumption',
    schedulePrefix: 'Schedule: ',
    
    // Status values
    low: 'Low',
    overdue: 'Overdue',
    dueSoon: 'Due Soon',
    medium: 'Medium',
    high: 'High',
    
    // Refill reminder specific translations
    refillDue: 'refill due',
    urgent: 'URGENT',
    
    // Status labels
    pending: 'pending',
    taken: 'taken',
    sent: 'sent',
    dismissed: 'dismissed',
    
    // AI Confidence
    aiConfidence: 'AI Confidence',
    
    // Additional missing keys
    dismiss: 'Dismiss',
    refillCalculationDetails: 'Refill Calculation Details',
    refillStatus: 'Refill Status',
    
    // Refill dashboard specific keys
    refillCalculationDetailsTitle: 'Refill Calculation Details',
    refillStatusTitle: 'Refill Status'
  },

  // Messages
  messages: {
    doseLoggedSuccessfully: 'Dose logged successfully',
    medicationAdded: 'Medication added successfully',
    medicationUpdated: 'Medication updated successfully',
    medicationDeleted: 'Medication deleted successfully',
    photoRequired: 'Photo is required',
    noMedicationDetected: 'No medication detected in the image',
    pleaseTakePhoto: 'Please take a photo showing the pill/medication',
    doseLimitReached: 'Dose limit reached',
    alreadyTakenToday: 'has already been taken',
    timesToday: 'time(s) today',
    max: 'max',
    recentDoseDetected: 'Recent dose detected',
    wasTakenMinutesAgo: 'was taken',
    minutesAgo: 'minutes ago',
    pleaseWaitMinutes: 'Please wait at least 30 minutes between doses'
  }
};

// Translation data - Chinese
const zh = {
  // Common UI elements
  common: {
    loading: '加载中...',
    save: '保存',
    cancel: '取消',
    edit: '编辑',
    delete: '删除',
    confirm: '确认',
    back: '返回',
    next: '下一步',
    previous: '上一步',
    close: '关闭',
    yes: '是',
    no: '否',
    error: '错误',
    success: '成功',
    warning: '警告',
    info: '信息',
    note: '注意',
    days: '天',
    units: '单位',
    notSpecified: '未指定'
  },

  // Navigation
  navigation: {
    home: '首页',
    schedule: '时间表',
    verify: '验证',
    add: '添加',
    history: '历史',
    manage: '管理',
    refill: '补充仪表板'
  },

  // Refill Dashboard
  refillDashboard: {
    title: '补充仪表板',
    addMedication: '+ 添加药物',
    manageAll: '管理全部',
    greeting: '您好',
    description: '监控您的药物补充并管理提醒',
    summaryCards: {
      totalMedications: '总药物数量',
      lowSupply: '供应不足',
      overdue: '逾期',
      dueSoon: '即将到期'
    },
    tabs: {
      medications: '药物和补充',
      reminders: '即将到来的提醒',
      calculations: '计算详情'
    },
    medicationsTab: {
      title: '有补充数据的药物',
      description: '查看每种药物的详细补充状态',
      noMedications: '没有补充数据的药物',
      noMedicationsDescription: '添加带有药房标签的药物以查看补充信息',
      addMedication: '添加药物'
    },
    remindersTab: {
      title: '即将到来的补充提醒',
      description: '管理您的补充提醒和通知',
      noReminders: '没有即将到来的提醒',
      noRemindersDescription: '当您有药物需要补充时，提醒将出现在这里'
    },
    calculationsTab: {
      title: '补充计算详情',
      description: '比较药房估算与基于时间表的计算',
      noCalculations: '没有可用的计算比较',
      noCalculationsDescription: '有时间表和数量的药物将显示计算比较'
    },
    medicationCard: {
      daysUntilRefill: '距离补充天数',
      supplyRemaining: '剩余供应',
      refillDate: '补充日期',
      refillsLeft: '剩余补充次数',
      schedule: '时间表',
      message: '消息',
      viewDetails: '查看详情',
      manageReminders: '管理提醒',
      calculation: '计算'
    },
    reminderCard: {
      date: '日期',
      message: '消息',
      noMessage: '无消息',
      dismiss: '忽略'
    },
    calculationCard: {
      scheduleInformation: '时间表信息',
      quantity: '数量',
      pharmacyDaysSupply: '药房供应天数',
      enhancedCalculation: '增强计算',
      method: '方法',
      consumptionRate: '消耗率',
      actualDaysSupply: '实际供应天数',
      viewDetails: '查看详情',
      clickToSeeCalculation: '点击"查看详情"查看计算'
    },
    loading: '加载补充数据...',
    error: {
      title: '加载仪表板数据时出错',
      tryAgain: '重试'
    },
    modals: {
      refillStatus: {
        title: '补充状态',
        daysUntilRefill: '距离补充天数',
        daysOfSupplyRemaining: '剩余供应天数',
        refillDate: '补充日期',
        refillsRemaining: '剩余补充次数',
        calculationComparison: '计算比较',
        recommendation: '建议',
        difference: '差异',
        supplyGood: '供应良好',
        daysRemaining: '天剩余'
      },
      refillCalculation: {
        title: '补充计算详情',
        pharmacyEstimate: '药房估算（基础）',
        enhancedCalculation: '增强计算',
        analysis: '分析',
        refillDate: '补充日期',
        daysUntil: '距离天数',
        daysSupply: '供应天数',
        assumption: '假设',
        dailyConsumption: '每日消耗',
        consumptionRate: '消耗率',
        scheduleUsed: '使用的时间表',
        difference: '差异',
        recommendation: '建议',
        dailyConsumption: '每日消耗',
        method: '方法',
        dosesPerDay: '剂/天'
      },
      refillReminders: {
        title: '补充提醒',
        noRemindersFound: '未找到此药物的补充提醒。',
        generateReminders: '生成提醒',
        reminderType: '提醒类型',
        status: '状态',
        dismiss: '忽略',
        noMessage: '无消息',
        refillDue: '补充到期',
        dueInDays: '距离补充天数',
        dueTomorrow: '明天',
        urgent: '紧急：',
        finalReminder: '最终提醒：'
      }
    },
    status: {
      good: '良好',
      low: '不足',
      overdue: '逾期',
      dueSoon: '即将到期'
    },
    urgency: {
      low: '低',
      medium: '中',
      high: '高',
      none: '无'
    },
    reminderType: {
      refillDue: '补充到期',
      refill_due: '补充到期',
      refillExpiring: '补充即将过期',
      lowSupply: '供应不足'
    },
    reminderStatus: {
      pending: '待处理',
      sent: '已发送',
      dismissed: '已忽略'
    },
    
    // Status labels for modals
    pending: '待处理',
    taken: '已服用',
    sent: '已发送',
    dismissed: '已忽略',
    
    // Status label translations for display
    statusLabels: {
      pending: '待处理',
      taken: '已服用',
      sent: '已发送',
      dismissed: '已忽略'
    },
    
    // Reminder type labels for display
    reminderTypeLabels: {
      refillDue: '补充到期',
      refill_due: '补充到期',
      urgent: '紧急',
      finalReminder: '最终提醒'
    },
    
    // Backend message translations
    supplyGoodMessage: '{medication} 供应良好（剩余 {days} 天）',
    pharmacyEstimateAccurate: '药房估算对此时间表准确',
    dailyConsumption: '每日消耗',
    schedulePrefix: '时间表：',
    
    // Refill reminder specific translations
    refillForMedicationDueInDays: '{medication} 补充将在 {days} 天后到期',
    refillForMedicationDueTomorrow: '{medication} 补充将在明天到期',
    urgentRefillDueInDays: '紧急：{medication} 补充将在 {days} 天后到期',
    finalReminderDueTomorrow: '最终提醒：{medication} 补充将在明天到期',
    
    // Status and urgency values for display
    statusValues: {
      good: '良好',
      low: '不足',
      overdue: '逾期',
      dueSoon: '即将到期'
    },
    urgencyValues: {
      low: '低',
      medium: '中',
      high: '高',
      none: '无'
    },
    
    // Dynamic message patterns
    messagePatterns: {
      supplyGood: '{medication} 供应良好（剩余 {days} 天）',
      urgentRefill: '紧急：{medication} 补充将在 {days} 天后到期',
      finalReminder: '最终提醒：{medication} 补充将在明天到期',
      refillDue: '补充到期',
      refillDueInDays: '补充将在 {days} 天后到期'
    },
    
    // Dynamic message translations
    dynamicMessages: {
      supplyGood: '{medication} 供应良好（剩余 {days} 天）',
      urgentRefill: '紧急：{medication} 补充将在 {days} 天后到期',
      finalReminder: '最终提醒：{medication} 补充将在明天到期',
      refillDue: '补充到期',
      refillDueInDays: '补充将在 {days} 天后到期'
    },
    
    // Medication instruction translations
    medicationInstructions: {
      takeTablet: '口服 {quantity} 片{plural} {frequency}',
      takeCapsule: '服用 {quantity} 粒胶囊{plural} {frequency}',
      takeLiquid: '服用 {quantity} {unit} 液体 {frequency}',
      takeInjection: '注射 {quantity} 次{plural} {frequency}',
      takeInhaler: '使用吸入器 {quantity} 次{plural} {frequency}',
      takeDrops: '滴 {quantity} 滴{plural} {frequency}',
      takePatch: '贴 {quantity} 片贴剂{plural} {frequency}',
      takeCream: '涂抹 {quantity} {unit} 乳膏 {frequency}',
      takeSuppository: '插入 {quantity} 粒栓剂{plural} {frequency}'
    },
    
    // Frequency translations
    frequency: {
      daily: '每天',
      twiceDaily: '每天两次',
      threeTimesDaily: '每天三次',
      every4Hours: '每4小时',
      every6Hours: '每6小时',
      every8Hours: '每8小时',
      every12Hours: '每12小时',
      weekly: '每周',
      monthly: '每月',
      asNeeded: '按需',
      beforeMeals: '饭前',
      afterMeals: '饭后',
      withFood: '随餐',
      onEmptyStomach: '空腹'
    }
  },

  // Header and main content
  header: {
    title: '药物助手',
    signIn: '使用谷歌登录',
    signOut: '退出登录',
    welcome: '欢迎回到您的药物管理'
  },

  // Dashboard
  dashboard: {
    greeting: '您好',
    greetingWithName: '您好 {name}',
    nextDose: '下次剂量',
    allDone: '全部完成！',
    noUpcomingDoses: '今天没有即将到来的剂量',
    tomorrow: '明天',
    todaysSchedule: '今日时间表',
    viewAll: '查看全部',
    noMedicationsToday: '今天没有安排药物',
    allDoneForToday: '今天全部完成！',
    completedAllMedications: '您已完成所有药物',
    unableToLoadSchedule: '无法加载时间表'
  },

  // Schedule
  schedule: {
    description: '这是您今天的药物时间表',
    today: '今天',
    yourSchedule: '您的药物时间表',
    showTaken: '显示已服用',
    hideTaken: '隐藏已服用',
    doseTrackingTitle: '剂量跟踪工作原理',
    doseTrackingText: '使用"验证"标签通过照片验证记录剂量。服用后，药物默认隐藏 - 点击"显示已服用"查看已完成的剂量。',
    notificationsTitle: '简单通知',
    notificationsText: '通知已启用！您将收到药物提醒。',
    noMedicationsScheduled: '没有安排药物',
    quickVerify: '快速验证',
    viewHistory: '查看历史',
    refillReminders: '补充提醒',
    medicationsNeedAttention: '需要关注的药物',
    noRefillReminders: '今天没有补充提醒',
    checkOtherDates: '检查其他日期的即将到来的补充提醒',
    quickActions: '快速操作',
    pending: '待服用',
    dosage: '剂量',
    time: '时间',
    schedule: '时间表',
    useVerificationPage: '使用验证页面记录剂量',
    hidingCompletedDoses: '隐藏已完成的剂量（自动更新）',
    lastUpdated: '最后更新',
    allGood: '一切正常！',
    noRefillsNeeded: '目前不需要补充',
    daysUntilRefill: '距离补充天数',
    supplyRemaining: '剩余供应',
    refillsLeft: '剩余补充次数',
    days: '天',
    manage: '管理',
    notificationsBlocked: '通知被阻止。请在浏览器设置中启用。',
    showingAllDoses: '显示所有剂量（自动更新）',
    completedDosesHidden: '已完成的剂量默认隐藏。点击"显示已服用"查看它们。',
    // Notification translations
    notifications: {
      medicationReminder: '用药提醒',
      timeToTake: '该服用 {medication} 了！',
      reminderSystemRestarted: '提醒系统已重启！您将收到用药提醒。',
      notificationsEnabled: '通知已启用！您现在将收到用药提醒。',
      permissionDenied: '通知权限被拒绝。请在浏览器设置中启用。',
      errorEnabling: '启用通知时出错。请重试。',
      reminderSystemStarted: '提醒系统已启动！您将收到用药提醒。',
      medicationReminderPrefix: '用药提醒：'
    },
    // Medication instruction patterns
    medicationInstructions: {
      takeTablet: '口服 {count} 片{plural} {frequency}',
      takeCapsule: '服用 {count} 粒胶囊{plural} {frequency}',
      takeLiquid: '服用 {count} {unit} {frequency}',
      takeInjection: '注射 {count} 次{plural} {frequency}',
      takeInhaler: '使用吸入器 {count} 次{plural} {frequency}',
      takeDrops: '滴 {count} 滴{plural} {frequency}',
      takePatch: '贴 {count} 片贴剂{plural} {frequency}',
      takeCream: '涂抹 {count} {unit} 乳膏 {frequency}',
      takeSuppository: '插入 {count} 粒栓剂{plural} {frequency}',
      // Common frequency patterns
      frequency: {
        daily: '每天',
        twiceDaily: '每天两次',
        threeTimesDaily: '每天三次',
        every4Hours: '每4小时',
        every6Hours: '每6小时',
        every8Hours: '每8小时',
        every12Hours: '每12小时',
        weekly: '每周',
        monthly: '每月',
        asNeeded: '按需',
        beforeMeals: '饭前',
        afterMeals: '饭后',
        withFood: '随餐',
        onEmptyStomach: '空腹'
      }
    },
    // Refill reminder translations
    refillReminders: {
      title: '补充提醒',
      description: '需要关注的药物',
      noRemindersToday: '今天没有补充提醒',
      checkOtherDates: '检查其他日期的即将到来的补充提醒',
      allGood: '一切正常！',
      noRefillsNeeded: '目前不需要补充',
      reminderDate: '提醒日期：',
      manage: '管理',
      unableToLoad: '无法加载补充提醒'
    },
    
    // Reminder type translations
    reminderTypes: {
      refill_due: '补充到期',
      low_supply: '供应不足',
      refill_expiring: '补充即将过期'
    },
    
    // Reminder status translations
    reminderStatus: {
      pending: '待处理',
      sent: '已发送',
      dismissed: '已忽略'
    }
  },

  // Action cards
  actions: {
    addMedication: '添加药物',
    scanOrUpload: '扫描或上传药物',
    manageMedications: '管理药物',
    editSchedulesRefills: '编辑时间表和补充',
    refillDashboard: '补充仪表板',
    monitorRefillsReminders: '监控补充和提醒',
    verifyMedication: '验证药物',
    trackAndVerify: '跟踪和验证剂量',
    // Verify page specific
    selectMedicationToVerify: '选择要验证的药物',
    takePhotoOfPill: '拍摄药丸照片',
    takePhotoOfPillDesc: '拍摄药丸照片以验证您正在服用正确的药物',
    takePhotoOfPillBtn: '拍照',
    retake: '重新拍摄',
    orUploadFromGallery: '或从相册上传',
    verificationStatus: '验证状态',
    photoCaptured: '照片已拍摄',
    pillVerification: '药丸验证',
    doseRecorded: '剂量已记录',
    verifyMedicationTaken: '验证药物已服用',
    quickActions: '快速操作',
    viewSchedule: '查看时间表',
    viewHistory: '查看历史',
    addMedication: '添加药物',
    medicationTaken: '药物已服用！',
    medicationRecordedSuccessfully: '您的药物已成功记录。',
    continue: '继续',
    verifyingMedication: '正在验证药物...',
    backToSelection: '返回选择',
    clickToCaptureOrUpload: '点击拍摄或上传',
    
    // AI Verification specific translations
    aiVerificationResults: 'AI 验证结果',
    verificationDetails: '验证详情',
    confidence: '置信度',
    reason: '原因',
    description: '描述',
    doseRecordedWithWarning: '剂量已记录（有警告）',
    doseRecorded: '剂量已记录',
    doseRecordedSuccessfully: '您的药物剂量已成功记录。',
    aiVerificationUnavailable: 'AI 验证暂时不可用，因此我们使用了备用方法。',
    noPillVisible: '未检测到药丸',
    pillDetected: '检测到药丸',
    medicationLoggedWithPhoto: '您的药物已通过照片证据记录。',
    but: '但是',
    thereWasVerificationIssue: '存在验证问题',
    pleaseDoubleCheck: '请仔细检查您是否正在服用正确的药物。',
    verificationIssue: '验证问题',
    doseRecordedButIssue: '您的剂量已记录，但存在验证问题。',
    
    // AI Response pattern translations
    theImageShows: '图像显示',
    smallRoundWhitePill: '小圆形白色药丸',
    thisIsConsistentWith: '这与',
    common: '常见的',
    pills: '药丸',
    howeverWithoutMarkings: '一致，但没有标记',
    furtherInformation: '进一步信息',
    confidenceIs: '置信度是',
    theImageShowsAHand: '图像显示一只手',
    holding: '拿着',
    
    // Verification details
    cannotVerifyAtThisTime: '此时无法验证{medication}',
    time: '时间:',
    shouldBeTakenAt: '应在 {time} (±2小时) 服用',
    frequency: '频率:',
    canTakeDose: '今天可以服用第 {taken}/{total} 剂',
    recentDose: '最近剂量:',
    noPreviousDosesToday: '今天没有之前的剂量',
    chooseDifferentMedication: '选择不同药物',
    verifyAnyway: '仍然验证（覆盖）',
    // Dynamic message patterns
    canBeTakenAt: '可在 {time} (±2小时) 服用',
    shouldBeTakenAt: '应在 {time} (±2小时) 服用',
    canTakeDose: '今天可以服用第 {taken}/{total} 剂',
    alreadyTaken: '今天已服用 {taken}/{total} 剂',
    lastDoseWas: '上次剂量是 {minutes} 分钟前',
    // Loading and error states
    noMedicationsFound: '未找到药物',
    errorLoadingMedications: '加载药物时出错',
    addYourFirstMedication: '添加您的第一种药物开始使用',
    tryAgain: '重试',
    // Authentication
    authenticationRequired: '需要身份验证',
    needToSignIn: '您需要登录才能验证药物',
    goToHomePage: '转到首页'
  },

  // Stats
  stats: {
    adherenceRate: '依从率',
    activeMedications: '活跃药物',
    daysStreak: '连续天数'
  },

  // Medication items
  medication: {
    taken: '已服用',
    pending: '待服用',
    verified: '已通过相机验证',
    timeSlots: {
      morning: '早晨',
      afternoon: '下午',
      evening: '晚上'
    }
  },

  // Language switcher
  language: {
    english: 'English',
    chinese: '中文',
    switchLanguage: '切换语言'
  },

  // Auth
  auth: {
    login: '登录',
    logout: '退出登录',
    signIn: '登录',
    signOut: '退出登录',
    notAuthenticated: '未认证',
    redirectingToLogin: '正在重定向到登录页面'
  },

  // Time
  time: {
    am: '上午',
    pm: '下午',
    today: '今天',
    tomorrow: '明天',
    yesterday: '昨天',
    thisWeek: '本周',
    nextWeek: '下周',
    // Weekday names
    weekdays: {
      sunday: '星期日',
      monday: '星期一',
      tuesday: '星期二',
      wednesday: '星期三',
      thursday: '星期四',
      friday: '星期五',
      saturday: '星期六'
    },
    // Month names
    months: {
      january: '一月',
      february: '二月',
      march: '三月',
      april: '四月',
      may: '五月',
      june: '六月',
      july: '七月',
      august: '八月',
      september: '九月',
      october: '十月',
      november: '十一月',
      december: '十二月'
    },
    // Time ranges
    timeRanges: {
      morning: '上午 8:00 - 下午 12:00',
      afternoon: '下午 12:00 - 下午 5:00',
      evening: '下午 5:00 - 上午 12:00'
    }
  },

  // Add Medication Page
  addMedication: {
    newMedication: '新药物',
    refillMedication: '补充药物',
    selectMedicationToRefill: '选择要补充的药物',
    uploadPhoto: '上传照片',
    previewEdit: '预览 / 编辑',
    cameraActive: '相机激活 - 将药瓶对准框架',
    takePhotoOfBottle: '拍摄您的药瓶照片',
    takePhoto: '拍照',
    retake: '重新拍摄',
    orUploadFromGallery: '或从相册上传',
    dragAndDrop: '拖放',
    orClickToBrowse: '或点击浏览文件',
    chooseFile: '选择文件',
    next: '下一步',
    medicationPhoto: '药物照片',
    medicationInformation: '药物信息',
    medicationName: '药物名称',
    dosage: '剂量',
    schedule: '服用时间表',
    specificTime: '具体时间（可选）',
    emptyState: '空状态',
    refillInformation: '补充信息（可选）',
    dateFilled: '配药日期',
    quantity: '数量',
    daysSupply: '供应天数',
    refillsRemaining: '剩余补充次数',
    pharmacyName: '药房名称',
    rxNumber: '处方号码',
    refillExpiryDate: '补充到期日期',
    saveMedication: '保存药物',
    saveRefill: '保存补充',
    back: '返回',
    processingMedication: '正在处理药物...',
    errorAddingMedication: '添加药物时出错',
    error: '错误',
    pleaseUploadPhotoFirst: '请先上传照片'
  },

  // History Page
  history: {
    medicationHistory: '药物历史',
    last7Days: '最近7天',
    last30Days: '最近30天',
    last3Months: '最近3个月',
    refreshData: '刷新数据',
    hiThere: '你好',
    viewHistoryAndTrends: '查看您的药物历史和趋势',
    takenToday: '今天已服用',
    pending: '待服用',
    totalMedications: '总药物数量',
    recentActivity: '最近活动',
    allMedications: '所有药物',
    recentDoseHistory: '最近剂量历史',
    medicationIntakePast7Days: '您过去7天的药物摄入情况',
    allMedicationsHeader: '所有药物',
    completeListOfMedications: '您的完整药物列表',
    loadingHistory: '正在加载历史...',
    noRecentHistory: '没有最近的药物历史',
    medicationIntakeWillAppearHere: '您的药物摄入将在这里显示',
    noMedicationsFound: '未找到药物',
    addYourFirstMedication: '添加您的第一个药物开始使用',
    addMedication: '添加药物',
    today: '今天',
    yesterday: '昨天',

    specificTime: '具体时间',
    added: '添加于'
  },

  // Manage Medications Page
  manageMedications: {
    manageMedications: '管理药物',
    addNew: '+ 添加新药物',
    hiThere: '你好',
    manageYourMedicationsAndRefills: '管理您的药物和补充',
    loadingMedications: '正在加载药物...',
    editMedication: '编辑药物',
    medicationName: '药物名称',
    dosage: '剂量',
    schedule: '服用时间表',
    specificTime: '具体时间',
    specificTimeOptional: '具体时间（可选）',
    saveChanges: '保存更改',
    cancel: '取消',
    refillHistory: '补充历史',
    close: '关闭',
    deleteMedication: '删除药物',
    actionCannotBeUndone: '此操作无法撤销',
    deleteConfirmation: '您确定要删除',
    deleteConfirmationDetails: '这也将删除所有相关的剂量记录和历史。',
    yesDelete: '是的，删除',
    refill: '补充',
    aiExtracted: '🤖 AI提取',
    manualEntry: '📝 手动输入',
    notSpecified: '未指定',
    added: '添加于',
    refillInformation: '补充信息',
    dateFilled: '配药日期',
    quantity: '数量',
    daysSupply: '供应天数',
    refillsLeft: '剩余补充',
    pharmacy: '药房',
    expires: '到期',
    viewRefillStatus: '查看补充状态',
    calculationDetails: '计算详情',
    manageReminders: '管理提醒',
    edit: '编辑',
    delete: '删除',
    addRefillData: '添加补充数据',
    refillOverdue: '补充逾期',
    refillDueSoon: '即将补充',
    lowSupply: '供应不足',
    createRefill: '创建补充',
    
    // Modal translations
    refillStatus: {
      title: '补充状态',
      daysUntilRefill: '距离补充天数',
      daysOfSupplyRemaining: '剩余供应天数',
      refillDate: '补充日期',
      refillsRemaining: '剩余补充次数',
      calculationComparison: '计算比较',
      recommendation: '建议',
      difference: '差异',
      supplyGood: '供应良好',
      daysRemaining: '天剩余'
    },
    refillCalculation: {
      title: '补充计算详情',
      pharmacyEstimate: '药房估算（基础）',
      enhancedCalculation: '增强计算',
      analysis: '分析',
      refillDate: '补充日期',
      daysUntil: '距离天数',
      daysSupply: '供应天数',
      assumption: '假设',
      dailyConsumption: '每日消耗',
      consumptionRate: '消耗率',
      scheduleUsed: '使用的时间表',
      difference: '差异',
      recommendation: '建议',
      dailyConsumption: '每日消耗',
      method: '方法',
      dosesPerDay: '剂/天'
    },
    refillReminders: {
      title: '补充提醒',
      noRemindersFound: '未找到此药物的补充提醒。',
      generateReminders: '生成提醒',
      reminderType: '提醒类型',
      status: '状态',
      dismiss: '忽略',
      refillDue: '补充到期',
      dueInDays: '距离补充天数',
      dueTomorrow: '明天',
      urgent: '紧急：',
      finalReminder: '最终提醒：'
    },
    
    // Refill History
    refillHistory: '补充历史',
    created: '创建于',
    original: '原始',
    
    // Create Refill
    createRefillTitle: '创建补充',
    supplyRemaining: '剩余供应',
    refillsLeft: '剩余补充',
    nextRefillDate: '下次补充日期',
    
    // Success messages
    refillCreatedSuccess: '补充创建成功！补充提醒已更新。',
    createRefillNow: '立即创建补充',
    cancel: '取消',
    whatHappensWhenCreateRefill: '创建补充时会发生什么：',
    newMedicationEntryCreated: '将创建新的补充药物条目',
    refillRemindersUpdated: '您的补充提醒将更新',
    trackBothOriginalAndRefill: '您可以跟踪原始和补充药物',
    noMessage: '无消息',
    noRefillRemindersFound: '未找到此药物的补充提醒。',
    generateReminders: '生成提醒',
    noRefillsFound: '未找到补充记录',
    
    // Additional keys that are referenced in HTML
    daysUntilRefill: '距离补充天数',
    daysOfSupplyRemaining: '剩余供应天数',
    refillDate: '补充日期',
    refillsRemaining: '剩余补充次数',
    calculationComparison: '计算比较',
    recommendation: '建议',
    difference: '差异',
    supplyGood: '供应良好',
    daysRemaining: '天剩余',
    pharmacyEstimate: '药房估算（基础）',
    enhancedCalculation: '增强计算',
    analysis: '分析',
    daysUntil: '距离天数',
    daysSupply: '供应天数',
    assumption: '假设',
    dailyConsumption: '每日消耗',
    consumptionRate: '消耗率',
    scheduleUsed: '使用的时间表',
    method: '方法',
    dosesPerDay: '剂/天',
    good: '良好',
    low: '不足',
    overdue: '逾期',
    dueSoon: '即将到期',
    medium: '中等',
    high: '高',
    none: '无',
    days: '天',
    percent: '%',
    pharmacyEstimateAccurate: '药房估算对此时间表准确',
    refillForMedicationDueInDays: '{medication} 补充将在 {days} 天后到期',
    refillForMedicationDueTomorrow: '{medication} 补充将在明天到期',
    urgentRefillDueInDays: '紧急：{medication} 补充将在 {days} 天后到期',
    finalReminderDueTomorrow: '最终提醒：{medication} 补充将在明天到期',
    supplyGoodMessage: '{medication} 供应良好（剩余 {days} 天）',
    confidenceHigh: '高',
    confidenceMedium: '中',
    confidenceLow: '低',
    
    // Backend message translations
    supplyGoodMessage: '{medication} 供应良好（剩余 {days} 天）',
    pharmacyEstimateAccurate: '药房估算对此时间表准确',
    dailyConsumption: '每日消耗',
    schedulePrefix: '时间表：',
    
    // Status values
    low: '低',
    overdue: '逾期',
    dueSoon: '即将到期',
    medium: '中等',
    high: '高',
    
    // Refill reminder specific translations
    refillDue: '补充到期',
    urgent: '紧急',
    
    // Status labels
    pending: '待处理',
    taken: '已服用',
    sent: '已发送',
    dismissed: '已忽略',
    
    // AI Confidence
    aiConfidence: 'AI 置信度',
    
    // Additional missing keys
    dismiss: '忽略',
    refillCalculationDetails: '补充计算详情',
    refillStatus: '补充状态',
    
    // Refill dashboard specific keys
    refillCalculationDetailsTitle: '补充计算详情',
    refillStatusTitle: '补充状态'
  },

  // Messages
  messages: {
    doseLoggedSuccessfully: '剂量记录成功',
    medicationAdded: '药物添加成功',
    medicationUpdated: '药物更新成功',
    medicationDeleted: '药物删除成功',
    photoRequired: '需要照片',
    noMedicationDetected: '图像中未检测到药物',
    pleaseTakePhoto: '请拍摄显示药丸/药物的照片',
    doseLimitReached: '已达到剂量限制',
    alreadyTakenToday: '今天已经服用',
    timesToday: '次',
    max: '最大',
    recentDoseDetected: '检测到最近的剂量',
    wasTakenMinutesAgo: '在',
    minutesAgo: '分钟前服用',
    pleaseWaitMinutes: '请在剂量之间至少等待30分钟'
  }
};

class I18nService {
  constructor() {
    this.currentLanguage = 'en';
    this.translations = { en, zh };
    this.languageNames = {
      en: 'English',
      zh: '中文'
    };
    
    this.init();
  }

  init() {
    // Load saved language preference
    const savedLanguage = localStorage.getItem('userLanguage');
    
    if (savedLanguage && this.translations[savedLanguage]) {
      this.currentLanguage = savedLanguage;
    } else {
      // Try to detect browser language
      const browserLang = navigator.language || navigator.userLanguage;
      
      if (browserLang.startsWith('zh')) {
        this.currentLanguage = 'zh';
      } else {
        this.currentLanguage = 'en';
      }
    }
    
    // Apply language immediately
    this.applyLanguage();
    
    // Listen for language change events
    window.addEventListener('languageChanged', () => {
      this.applyLanguage();
    });
    
    // Ensure language preference is properly loaded after a short delay
    // This helps with cases where the system initializes before localStorage is fully ready
    setTimeout(() => {
      this.ensureLanguagePreferenceLoaded();
    }, 100);
  }

  /**
   * Get translation for a key
   * @param {string} key - Translation key (e.g., 'dashboard.greeting')
   * @param {Object} params - Parameters for interpolation
   * @returns {string} Translated text
   */
  t(key, params = {}) {
    const keys = key.split('.');
    let translation = this.translations[this.currentLanguage];
    
    for (const k of keys) {
      if (translation && translation[k]) {
        translation = translation[k];
      } else {
        // Fallback to English
        translation = this.translations.en;
        for (const fallbackKey of keys) {
          if (translation && translation[fallbackKey]) {
            translation = translation[fallbackKey];
          } else {
            return key; // Return key if translation not found
          }
        }
        break;
      }
    }
    
    if (typeof translation === 'string') {
      // Handle parameter interpolation
      return translation.replace(/\{(\w+)\}/g, (match, param) => {
        return params[param] !== undefined ? params[param] : match;
      });
    }
    
    return key;
  }

  /**
   * Switch to a different language
   * @param {string} language - Language code ('en' or 'zh')
   */
  switchLanguage(language) {
    if (!this.translations[language]) {
      console.warn(`Language ${language} not supported`);
      return;
    }
    
    this.currentLanguage = language;
    localStorage.setItem('userLanguage', language);
    
    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent('languageChanged', { 
      detail: { language } 
    }));
    
    // Apply language immediately
    this.applyLanguage();
    
  }

  /**
   * Get current language
   * @returns {string} Current language code
   */
  getCurrentLanguage() {
    return this.currentLanguage;
  }
  
  /**
   * Get language names in the current language
   * @returns {Object} Language names in current language
   */
  getLanguageNamesInCurrentLanguage() {
    if (this.currentLanguage === 'zh') {
      return {
        en: 'English',
        zh: '中文'
      };
    } else {
      return {
        en: 'English',
        zh: '中文'
      };
    }
  }

  /**
   * Get available languages
   * @returns {Array} Array of available language codes
   */
  getAvailableLanguages() {
    return Object.keys(this.translations);
  }

  /**
   * Apply current language to the page
   */
  applyLanguage() {
    // Update all elements with data-i18n attributes
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
      const key = element.getAttribute('data-i18n');
      if (key) {
        const translation = this.t(key);
        if (translation && translation !== key) {
          element.textContent = translation;
        }
      }
    });

    // Update elements with data-i18n-attr attribute
    const attrElements = document.querySelectorAll('[data-i18n-attr]');
    attrElements.forEach(element => {
      const [key, attr] = element.getAttribute('data-i18n-attr').split(':');
      const translation = this.t(key);
      element.setAttribute(attr, translation);
    });

    // Update page title if it has i18n
    const titleElement = document.querySelector('title[data-i18n]');
    if (titleElement) {
      const titleKey = titleElement.getAttribute('data-i18n');
      document.title = this.t(titleKey);
    }

    // Update meta description if it has i18n
    const metaDesc = document.querySelector('meta[name="description"][data-i18n]');
    if (metaDesc) {
      const descKey = metaDesc.getAttribute('data-i18n');
      metaDesc.setAttribute('content', this.t(descKey));
    }
    
    // Update all language switcher labels and options
    if (this.languageSwitchers) {
      this.languageSwitchers.forEach(switcher => {
        if (switcher._label) {
          switcher._label.textContent = this.t('language.switchLanguage');
        }
        
        if (switcher._select) {
          // Update all option text content to show in current language
          Array.from(switcher._select.options).forEach(option => {
            const langCode = option.value;
            option.textContent = this.languageNames[langCode];
          });
          
          // Make sure the select shows the current language
          switcher._select.value = this.currentLanguage;
        }
      });
    }
  }

  /**
   * Create a language switcher component
   * @param {string} containerId - ID of the container to insert the switcher
   * @returns {HTMLElement} Language switcher element
   */
  createLanguageSwitcher(containerId = null) {
    const switcher = document.createElement('div');
    switcher.className = 'language-switcher flex items-center space-x-2';
    
    const label = document.createElement('span');
    label.className = 'text-sm text-gray-600';
    label.textContent = this.t('language.switchLanguage');
    
    const select = document.createElement('select');
    select.className = 'text-sm border border-gray-300 rounded-md px-2 py-1 bg-white';
    select.addEventListener('change', (e) => {
      this.switchLanguage(e.target.value);
    });
    
    // Add language options
    Object.entries(this.languageNames).forEach(([code, name]) => {
      const option = document.createElement('option');
      option.value = code;
      option.textContent = name;
      option.selected = code === this.currentLanguage;
      select.appendChild(option);
    });
    
    // Set the select value to current language
    select.value = this.currentLanguage;
    
    switcher.appendChild(label);
    switcher.appendChild(select);
    
    // Insert into container if specified
    if (containerId) {
      const container = document.getElementById(containerId);
      if (container) {
        container.appendChild(switcher);
      }
    }
    
    // Store references for updating
    switcher._label = label;
    switcher._select = select;
    
    // Add this switcher to the list of switchers to update
    if (!this.languageSwitchers) {
      this.languageSwitchers = [];
    }
    this.languageSwitchers.push(switcher);
    
    return switcher;
  }

  /**
   * Update text content of an element
   * @param {string} selector - CSS selector for the element
   * @param {string} key - Translation key
   * @param {Object} params - Parameters for interpolation
   */
  updateElement(selector, key, params = {}) {
    const element = document.querySelector(selector);
    if (element) {
      element.textContent = this.t(key, params);
    }
  }

  /**
   * Update multiple elements at once
   * @param {Object} updates - Object with selector: key pairs
   * @param {Object} params - Parameters for interpolation
   */
  updateElements(updates, params = {}) {
    Object.entries(updates).forEach(([selector, key]) => {
      this.updateElement(selector, key, params);
    });
  }

  /**
   * Update the entire page with current language
   */
  updatePage() {
    this.applyLanguage();
  }

  /**
   * Check and log current language state
   */
  checkLanguageState() {
    const savedLanguage = localStorage.getItem('userLanguage');
    
    if (this.languageSwitchers) {
      this.languageSwitchers.forEach((switcher, index) => {
        if (switcher._select) {
        }
      });
    } else {
    }
  }
  
  /**
   * Reload saved language preference and apply it
   */
  reloadSavedLanguage() {
    const savedLanguage = localStorage.getItem('userLanguage');
    
    if (savedLanguage && this.translations[savedLanguage]) {
      this.currentLanguage = savedLanguage;
      this.applyLanguage();
      return true;
    } else {
      return false;
    }
  }
  
  /**
   * Ensure language preference is properly loaded and applied
   */
  ensureLanguagePreferenceLoaded() {
    const savedLanguage = localStorage.getItem('userLanguage');
    
    if (savedLanguage && this.translations[savedLanguage] && this.currentLanguage !== savedLanguage) {
      this.currentLanguage = savedLanguage;
      this.applyLanguage();
      return true;
    } else if (savedLanguage && this.translations[savedLanguage]) {
      return true;
    } else {
      return false;
    }
  }
}

// Create global instance
const i18n = new I18nService();

// Make it globally available
window.i18n = i18n;

// Export for module usage (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = i18n;
}
