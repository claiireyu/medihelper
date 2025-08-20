import express from 'express'
import pg from 'pg'
import cors from 'cors'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import fs from 'fs'

import dotenv from 'dotenv';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { configurePassport } from './config/passport.js';
import { scheduleCache } from './cache/scheduleCache.js';
import { PersistentScheduleService } from './services/persistentScheduleService.js';
import { DeterministicScheduleParser } from './services/deterministicScheduleParser.js';
import { RefillCalculationService } from './services/refillCalculationService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors({
    origin: [
        'http://localhost:8080', 
        'http://127.0.0.1:8080', 
        'http://[::]:8080',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://[::]:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5174',
        'http://[::]:5174',
        'http://localhost:5175',
        'http://127.0.0.1:5175',
        'http://[::]:5175',
        'http://localhost:5175',
        'http://127.0.0.1:5175',
        'http://[::]:5175'
    ],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../frontend')));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const allowedExtensions = /\.(jpg|jpeg|png|gif|webp|bmp|tiff)$/i;
    const allowedMimeTypes = /^image\/(jpeg|jpg|png|gif|webp|bmp|tiff)$/i;
    
    const hasValidExtension = allowedExtensions.test(file.originalname);
    const hasValidMimeType = allowedMimeTypes.test(file.mimetype);
    
    if (hasValidExtension && hasValidMimeType) {
      cb(null, true);
    } else {
      console.log(`File rejected: ${file.originalname} (${file.mimetype})`);
      cb(new Error(`Only image files are allowed! Supported formats: JPG, JPEG, PNG, GIF, WebP, BMP, TIFF`), false);
    }
  }
});

const dbPool = new pg.Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

const db = new pg.Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
})

await db.connect();

const passport = configurePassport(db);

const deterministicParser = new DeterministicScheduleParser();
const refillCalculationService = new RefillCalculationService(deterministicParser);

const automatedRefillService = new RefillCalculationService();

const PgSession = connectPgSimple(session);

app.use(session({
  store: new PgSession({
    pool: dbPool,
    tableName: 'session',
    createTableIfMissing: false,
    pruneSessionInterval: 60 * 15,
    errorLog: console.error
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: 'lax'
  }
}));

app.use(passport.initialize());
app.use(passport.session());

const persistentScheduleService = new PersistentScheduleService(db, null);

async function extractMedicationFromImage(photoPath) {
  try {
    const imageBuffer = fs.readFileSync(photoPath);
    const base64Image = imageBuffer.toString('base64');
    
    const prompt = `Extract comprehensive medication and refill information from this pharmacy label image. 

Return JSON with these fields:
- medicationName: Name of the medication
- dosage: Dosage information (e.g., "10 MG TAB")
- schedule: Dosage schedule (e.g., "Take 1 tablet by mouth every day")
- rawText: Raw extracted text from the image

REFILL INFORMATION (if available):
- dateFilled: Date medication was filled (e.g., "7/7/25" or "2025-07-07")
- quantity: Quantity dispensed (e.g., 90)
- daysSupply: Days the quantity will last (e.g., 90)
- refillsRemaining: Number of refills remaining (e.g., 2)
- refillExpiryDate: Date refills expire (e.g., "4/14/26" or "2026-04-14")

PHARMACY INFORMATION (if available):
- pharmacyName: Pharmacy name (e.g., "CVS Pharmacy")
- rxNumber: Prescription number (e.g., "928356 01 SS")
- ndcCode: National Drug Code (e.g., "65862-0294-99")
- manufacturer: Drug manufacturer (e.g., "AUROBINDO PHARM")
- prescriber: Prescribing doctor (e.g., "Katherine Wei")
- insuranceProvider: Insurance provider (e.g., "MEDI-CALRX")
- retailPrice: Retail price (e.g., 416.99)
- amountDue: Amount patient owes (e.g., 0.00)

Parse dates in MM/DD/YY or MM/DD/YYYY format and convert to YYYY-MM-DD.
Parse numbers for quantity, days supply, refills remaining, and prices.
Return only the JSON object, no other text.`;

    const result = await geminiModel.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Image
        }
      }
    ]);
    
    const response = result.response.text();
    
    let cleanResponse = response.trim();
    if (cleanResponse.startsWith('```json')) {
      cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanResponse.startsWith('```')) {
      cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    console.log('Raw Gemini response:', response);
    console.log('Cleaned response:', cleanResponse);
    
    let extractedInfo = JSON.parse(cleanResponse);

    console.log('Parsed extracted info:', extractedInfo);

    if (Array.isArray(extractedInfo) && extractedInfo.length > 0) {
      extractedInfo = extractedInfo[0];
      console.log('Extracted first item from array:', extractedInfo);
    }

    const medicationName = extractedInfo.medicationName || extractedInfo.medication_name || 'Unknown Medication';
    const dosage = extractedInfo.dosage || 'Unknown Dosage';
    const schedule = extractedInfo.schedule || 'Unknown schedule';
    
    const refillInfo = {
      date_filled: parseDate(extractedInfo.dateFilled || extractedInfo.date_filled),
      quantity: parseNumber(extractedInfo.quantity),
      days_supply: parseNumber(extractedInfo.daysSupply || extractedInfo.days_supply),
      refills_remaining: parseNumber(extractedInfo.refillsRemaining || extractedInfo.refills_remaining),
      refill_expiry_date: parseDate(extractedInfo.refillExpiryDate || extractedInfo.refill_expiry_date)
    };

    const pharmacyInfo = {
      pharmacy_name: extractedInfo.pharmacyName || extractedInfo.pharmacy_name,
      rx_number: extractedInfo.rxNumber || extractedInfo.rx_number,
      ndc_code: extractedInfo.ndcCode || extractedInfo.ndc_code,
      manufacturer: extractedInfo.manufacturer,
      prescriber: extractedInfo.prescriber,
      insurance_provider: extractedInfo.insuranceProvider || extractedInfo.insurance_provider,
      retail_price: parsePrice(extractedInfo.retailPrice || extractedInfo.retail_price),
      amount_due: parsePrice(extractedInfo.amountDue || extractedInfo.amount_due)
    };
    
    console.log('Final processed values:', { 
      medicationName, 
      dosage, 
      schedule,
      refillInfo,
      pharmacyInfo
    });

    return {
      extractedText: extractedInfo.rawText || 'No text extracted',
      extractedInfo: {
        medicationName: medicationName,
        dosage: dosage,
        schedule: schedule,
        ...refillInfo,
        ...pharmacyInfo
      }
    };
    
  } catch (error) {
    console.error('Gemini extraction failed:', error);
    return {
      extractedText: 'Extraction failed',
      extractedInfo: {
        medicationName: 'Unknown Medication',
        dosage: 'Unknown Dosage',
        schedule: 'once daily'
      }
    };
  }
}

function parseDate(dateString) {
  if (!dateString) return null;
  
  try {
    if (dateString.includes('/')) {
      const parts = dateString.split('/');
      if (parts.length === 3) {
        let month = parseInt(parts[0]) - 1;
        let day = parseInt(parts[1]);
        let year = parseInt(parts[2]);
        
        if (year < 100) {
          year += 2000;
        }
        
        const date = new Date(year, month, day);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      }
    }
    
    if (dateString.includes('-')) {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
    
    return null;
  } catch (error) {
    console.warn('Failed to parse date:', dateString, error);
    return null;
  }
}

function parseNumber(value) {
  if (value === undefined || value === null || value === '') return null;
  
  const parsed = parseInt(value);
  return isNaN(parsed) ? null : parsed;
}

function parsePrice(value) {
  if (value === undefined || value === null || value === '') return null;
  
  const cleanValue = String(value).replace(/[$,]/g, '');
  const parsed = parseFloat(cleanValue);
  return isNaN(parsed) ? null : parsed;
}

async function verifyPillInImage(photoPath, req = null) {
  try {
    const imageBuffer = fs.readFileSync(photoPath);
    const base64Image = imageBuffer.toString('base64');
    
    const userLanguage = req?.headers?.['accept-language']?.includes('zh') ? 'zh' : 'en';
    
    const prompt = `
You are a medical assistant verifying medication intake. 

IMPORTANT: Respond in ${userLanguage === 'zh' ? 'Chinese (Simplified)' : 'English'} language.

Look at this image and determine if a pill, tablet, capsule, or medication is visible.

Return ONLY a JSON object with these fields:
- pillVisible: true/false (is a pill/medication visible in the image?)
- confidence: "high", "medium", or "low" (how confident are you?)
- description: brief description of what you see in ${userLanguage === 'zh' ? 'Chinese' : 'English'} (e.g., ${userLanguage === 'zh' ? '"白色药丸在手掌上", "空手", "表面上的药片"' : '"white pill on palm", "empty hand", "tablet on surface"'})

Focus on:
- Pills, tablets, capsules, or medication forms
- Medication bottles or containers
- Hands holding medication
- Surfaces with medication

Ignore:
- Text or labels
- Background objects
- Non-medication items

Return only the JSON object, no other text:
`;

    const result = await geminiModel.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Image
        }
      }
    ]);
    
    const response = result.response.text();
    
    let cleanResponse = response.trim();
    if (cleanResponse.startsWith('```json')) {
      cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanResponse.startsWith('```')) {
      cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    const verification = JSON.parse(cleanResponse);
    
    return {
      pillVisible: verification.pillVisible || false,
      confidence: verification.confidence || 'low',
      description: verification.description || 'Unable to determine'
    };
    
  } catch (error) {
    console.error('Pill verification failed:', error);
    return {
      pillVisible: false,
      confidence: 'low',
      description: 'Verification failed: ' + error.message
    };
  }
}

function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({
    success: false,
    message: 'Authentication required',
    redirectTo: '/auth/google'
  });
}

// ============================================================================
// MEDICATION ENDPOINTS
// ============================================================================

app.get('/api/medications', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const allMedicationsQuery = `
      SELECT *, COALESCE(refill_of_id, id) as original_id 
      FROM medications 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `;
    const allResult = await db.query(allMedicationsQuery, [userId]);
    
    const medicationsByName = new Map();
    allResult.rows.forEach(med => {
      const medName = med.name.toLowerCase();
      if (!medicationsByName.has(medName)) {
        medicationsByName.set(medName, []);
      }
      medicationsByName.get(medName).push(med);
    });
    
    const medicationGroups = new Map();
    for (const [medName, medications] of medicationsByName) {
      medications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      const mostRecent = medications[0];
      medicationGroups.set(medName, medications);
    }
    
    const activeMedications = [];
    for (const [medName, medications] of medicationGroups) {
      const mostRecent = medications[0];
      const refillCount = medications.length - 1;
      activeMedications.push({
        ...mostRecent,
        refill_count: refillCount,
        has_refill_history: refillCount > 0,
        original_id: mostRecent.original_id || mostRecent.id,
        total_entries: medications.length
      });
    }
    
    activeMedications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    res.json({
      success: true,
      medications: activeMedications
    });
  } catch (error) {
    console.error('Error fetching medications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch medications',
      error: error.message
    });
  }
});

app.get('/api/medications/:id/history', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const medicationQuery = `
      SELECT *, COALESCE(refill_of_id, id) as original_id 
      FROM medications 
      WHERE id = $1 AND user_id = $2
    `;
    const medResult = await db.query(medicationQuery, [id, userId]);
    
    if (medResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found'
      });
    }
    
    const originalId = medResult.rows[0].original_id;
    
    const historyQuery = `
      SELECT * FROM medications 
      WHERE user_id = $1 
      AND (id = $2 OR refill_of_id = $2)
      ORDER BY created_at ASC
    `;
    const historyResult = await db.query(historyQuery, [userId, originalId]);
    
    res.json({
      success: true,
      medication_name: medResult.rows[0].name,
      original_id: originalId,
      history: historyResult.rows
    });
  } catch (error) {
    console.error('Error fetching medication history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch medication history',
      error: error.message
    });
  }
});

app.post('/api/preview-medication', isAuthenticated, (req, res) => {
  upload.single('photo')(req, res, async (err) => {
    if (err) {
      console.error('Upload error:', err);
      
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File too large. Please use an image smaller than 10MB.',
            error: 'FILE_TOO_LARGE'
          });
        }
      }
      
      if (err.message.includes('Only image files are allowed')) {
        return res.status(400).json({
          success: false,
          message: err.message,
          error: 'INVALID_FILE_TYPE'
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Upload failed',
        error: err.message
      });
    }

    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image file provided',
          error: 'NO_FILE'
        });
      }

      const photoPath = req.file.path;
      console.log(`Processing image: ${req.file.originalname} (${req.file.size} bytes)`);
      
      const { extractedText, extractedInfo } = await extractMedicationFromImage(photoPath);
      fs.unlinkSync(photoPath);

      res.json({
        success: true,
        message: 'Medication information extracted successfully',
        extractedInfo: extractedInfo,
        rawText: extractedText
      });

    } catch (error) {
      console.error('Error extracting medication info:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to extract medication information',
        error: error.message
      });
    }
  });
});

app.post('/api/medications', isAuthenticated, upload.single('photo'), async (req, res) => {
  try {
    const { 
      name, dosage, schedule, extractedInfo: previewExtractedInfoRaw, isRefill, originalMedicationId, specificTime,
      dateFilled, quantity, daysSupply, refillsRemaining, pharmacyName, rxNumber, refillExpiryDate
    } = req.body;
    const photoPath = req.file ? req.file.path : null;
    const userId = req.user.id;
    
    const specific_time = specificTime || null;
    const use_specific_time = !!specificTime;
    
    let dose_type = 'morning';
    if (schedule) {
      const scheduleLower = schedule.toLowerCase();
      if (scheduleLower.includes('evening') || scheduleLower.includes('night') || scheduleLower.includes('pm')) {
        dose_type = 'evening';
      } else if (scheduleLower.includes('afternoon') || scheduleLower.includes('noon')) {
        dose_type = 'afternoon';
      } else if (scheduleLower.includes('morning') || scheduleLower.includes('am')) {
        dose_type = 'morning';
      }
    }

    console.log('Medication request:', {
      name, dosage, schedule, userId, 
      isRefill: !!isRefill, 
      originalMedicationId: originalMedicationId || 'none',
      specificTime: specificTime || 'none',
      use_specific_time,
      dose_type
    });

    let previewExtractedInfo = null;
    if (previewExtractedInfoRaw) {
      try {
        previewExtractedInfo = typeof previewExtractedInfoRaw === 'string' 
          ? JSON.parse(previewExtractedInfoRaw) 
          : previewExtractedInfoRaw;
      } catch (parseError) {
        console.error('Error parsing preview extracted info:', parseError);
        previewExtractedInfo = null;
      }
    }

    let finalInfo;
    let extractionUsed = false;
    let rawExtractedText = null;
    let extractionConfidence = 'unknown';
    let refillData = null;
    
    const manualRefillData = {
      date_filled: parseDate(dateFilled),
      quantity: parseNumber(quantity),
      days_supply: parseNumber(daysSupply),
      refills_remaining: parseNumber(refillsRemaining),
      refill_expiry_date: parseDate(refillExpiryDate),
      pharmacy_name: pharmacyName || null,
      rx_number: rxNumber || null,
      ndc_code: null,
      manufacturer: null,
      prescriber: null,
      insurance_provider: null,
      retail_price: null,
      amount_due: null
    };

    if (previewExtractedInfo) {
      finalInfo = {
        medicationName: name || previewExtractedInfo.medicationName,
        dosage: dosage || previewExtractedInfo.dosage,
        schedule: schedule || previewExtractedInfo.schedule
      };
      const extractedRefillData = {
        date_filled: parseDate(previewExtractedInfo.dateFilled || previewExtractedInfo.date_filled),
        quantity: parseNumber(previewExtractedInfo.quantity),
        days_supply: parseNumber(previewExtractedInfo.daysSupply || previewExtractedInfo.days_supply),
        refills_remaining: parseNumber(previewExtractedInfo.refillsRemaining || previewExtractedInfo.refills_remaining),
        refill_expiry_date: parseDate(previewExtractedInfo.refillExpiryDate || previewExtractedInfo.refill_expiry_date),
        pharmacy_name: previewExtractedInfo.pharmacyName || previewExtractedInfo.pharmacy_name,
        rx_number: previewExtractedInfo.rxNumber || previewExtractedInfo.rx_number,
        ndc_code: previewExtractedInfo.ndcCode || previewExtractedInfo.ndc_code,
        manufacturer: previewExtractedInfo.manufacturer,
        prescriber: previewExtractedInfo.prescriber,
        insurance_provider: previewExtractedInfo.insuranceProvider || previewExtractedInfo.insurance_provider,
        retail_price: parsePrice(previewExtractedInfo.retailPrice || previewExtractedInfo.retail_price),
        amount_due: parsePrice(previewExtractedInfo.amountDue || previewExtractedInfo.amount_due)
      };
      
      refillData = { ...extractedRefillData, ...manualRefillData };
      extractionUsed = true;
      extractionConfidence = 'high';
    } else if (photoPath) {
      const { extractedInfo, extractedText } = await extractMedicationFromImage(photoPath);
      finalInfo = {
        medicationName: name || extractedInfo.medicationName,
        dosage: dosage || extractedInfo.dosage,
        schedule: schedule || extractedInfo.schedule
      };
      const extractedRefillData = {
        date_filled: parseDate(extractedInfo.dateFilled || extractedInfo.date_filled),
        quantity: parseNumber(extractedInfo.quantity),
        days_supply: parseNumber(extractedInfo.daysSupply || extractedInfo.days_supply),
        refills_remaining: parseNumber(extractedInfo.refillsRemaining || extractedInfo.refills_remaining),
        refill_expiry_date: parseDate(extractedInfo.refillExpiryDate || extractedInfo.refill_expiry_date),
        pharmacy_name: extractedInfo.pharmacyName || extractedInfo.pharmacy_name,
        rx_number: extractedInfo.rxNumber || extractedInfo.rx_number,
        ndc_code: extractedInfo.ndcCode || extractedInfo.ndc_code,
        manufacturer: extractedInfo.manufacturer,
        prescriber: extractedInfo.prescriber,
        insurance_provider: extractedInfo.insuranceProvider || extractedInfo.insurance_provider,
        retail_price: parsePrice(extractedInfo.retailPrice || extractedInfo.retail_price),
        amount_due: parsePrice(extractedInfo.amountDue || extractedInfo.amount_due)
      };
      
      refillData = { ...extractedRefillData, ...manualRefillData };
      extractionUsed = true;
      rawExtractedText = extractedText;
      extractionConfidence = 'medium';
    } else {
      finalInfo = {
        medicationName: name || 'Unknown Medication',
        dosage: dosage || 'Unknown Dosage',
        schedule: schedule || 'once daily'
      };
      extractionUsed = false;
      refillData = Object.values(manualRefillData).some(val => val !== null) ? manualRefillData : null;
    }

    const dbMedicationName = finalInfo.medicationName || 'Unknown Medication';
    const dbDosage = finalInfo.dosage || 'Unknown Dosage';
    const dbSchedule = finalInfo.schedule || 'once daily';

    let dbResult;

    if (isRefill && originalMedicationId) {
      console.log('Processing refill for medication ID:', originalMedicationId);
      
      const checkQuery = 'SELECT * FROM medications WHERE id = $1 AND user_id = $2';
      const checkResult = await db.query(checkQuery, [originalMedicationId, userId]);
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Original medication not found or does not belong to user'
        });
      }

      const originalMedication = checkResult.rows[0];
      console.log('Original medication:', originalMedication.name, originalMedication.schedule);

      const refillQuery = `
        INSERT INTO medications (
          user_id, name, dosage, schedule, dose_type, specific_time, use_specific_time, 
          photo_path, refill_of_id, created_at, extraction_used, raw_extracted_text, 
          extraction_confidence, date_filled, quantity, days_supply, refills_remaining, 
          refill_expiry_date, pharmacy_name, rx_number, ndc_code, manufacturer, 
          prescriber, insurance_provider, retail_price, amount_due
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
        RETURNING *
      `;

      const refillValues = [
        userId,
        dbMedicationName,
        dbDosage,
        dbSchedule,
        dose_type,
        specific_time,
        use_specific_time,
        photoPath,
        originalMedicationId,
        extractionUsed,
        rawExtractedText,
        extractionConfidence,
        refillData?.date_filled || null,
        refillData?.quantity || null,
        refillData?.days_supply || null,
        refillData?.refills_remaining || null,
        refillData?.refill_expiry_date || null,
        refillData?.pharmacy_name || null,
        refillData?.rx_number || null,
        refillData?.ndc_code || null,
        refillData?.manufacturer || null,
        refillData?.prescriber || null,
        refillData?.insurance_provider || null,
        refillData?.retail_price || null,
        refillData?.amount_due || null
      ];

      dbResult = await db.query(refillQuery, refillValues);
      console.log('Refill medication created successfully');
      
    } else {
      console.log('Creating new medication');
      
      const insertQuery = `
        INSERT INTO medications (
          user_id, name, dosage, schedule, dose_type, specific_time, use_specific_time, 
          photo_path, refill_of_id, created_at, extraction_used, raw_extracted_text, 
          extraction_confidence, date_filled, quantity, days_supply, refills_remaining, 
          refill_expiry_date, pharmacy_name, rx_number, ndc_code, manufacturer, 
          prescriber, insurance_provider, retail_price, amount_due
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
        RETURNING *
      `;

      const insertValues = [
        userId,
        dbMedicationName,
        dbDosage,
        dbSchedule,
        dose_type,
        specific_time,
        use_specific_time,
        photoPath,
        null,
        extractionUsed,
        rawExtractedText,
        extractionConfidence,
        refillData?.date_filled || null,
        refillData?.quantity || null,
        refillData?.days_supply || null,
        refillData?.refills_remaining || null,
        refillData?.refill_expiry_date || null,
        refillData?.pharmacy_name || null,
        refillData?.rx_number || null,
        refillData?.ndc_code || null,
        refillData?.manufacturer || null,
        refillData?.prescriber || null,
        refillData?.insurance_provider || null,
        refillData?.retail_price || null,
        refillData?.amount_due || null
      ];

      dbResult = await db.query(insertQuery, insertValues);
      console.log('New medication created successfully');
    }

    scheduleCache.clearUser(userId);

    let autoGeneratedReminders = null;
    if (refillData && refillData.date_filled && (refillData.quantity || refillData.days_supply)) {
      try {
        const medicationWithRefillData = {
          ...dbResult.rows[0],
          ...refillData
        };
        
        const reminders = refillCalculationService.generateRefillReminders(medicationWithRefillData);
        
        if (reminders.length > 0) {
          const reminderPromises = reminders.map(reminder => {
            const insertQuery = `
              INSERT INTO refill_reminders (
                user_id, medication_id, reminder_date, reminder_type, 
                status, message, created_at
              ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
              ON CONFLICT (user_id, medication_id, reminder_date, reminder_type) 
              DO UPDATE SET 
                message = EXCLUDED.message,
                updated_at = NOW()
              RETURNING *
            `;
            
            return db.query(insertQuery, [
              userId,
              dbResult.rows[0].id,
              reminder.reminder_date,
              reminder.type,
              'pending',
              reminder.message
            ]);
          });

          await Promise.all(reminderPromises);
          autoGeneratedReminders = reminders;
          
          console.log(`Auto-generated ${reminders.length} refill reminders for medication ${dbResult.rows[0].id}`);
        }
      } catch (error) {
        console.warn('Failed to auto-generate refill reminders:', error.message);
      }
    }

    res.status(201).json({
      success: true,
      message: isRefill ? 'Medication refilled successfully' : 'Medication added successfully',
      medication: dbResult.rows[0],
      finalInfo: finalInfo,
      usedPreviewData: !!previewExtractedInfo,
      isRefill: !!isRefill,
      refillData: refillData,
      autoGeneratedReminders: autoGeneratedReminders
    });

  } catch (error) {
    console.error('Error adding medication:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add medication',
      error: error.message
    });
  }
});

app.delete('/api/medications/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const checkQuery = 'SELECT * FROM medications WHERE id = $1 AND user_id = $2';
    const checkResult = await db.query(checkQuery, [id, userId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found or does not belong to user'
      });
    }

    const refillCheckQuery = 'SELECT id, name FROM medications WHERE refill_of_id = $1 AND user_id = $2';
    const refillsResult = await db.query(refillCheckQuery, [id, userId]);
    
    if (refillsResult.rows.length > 0) {
      console.log(`Found ${refillsResult.rows.length} refills for medication ${id}, deleting them first`);
      
      const deleteRefillsQuery = 'DELETE FROM medications WHERE refill_of_id = $1 AND user_id = $2';
      await db.query(deleteRefillsQuery, [id, userId]);
      
      console.log(`Deleted ${refillsResult.rows.length} refills`);
    }
    
    const deleteQuery = 'DELETE FROM medications WHERE id = $1 AND user_id = $2 RETURNING *';
    const deleteResult = await db.query(deleteQuery, [id, userId]);

    scheduleCache.clearUser(userId);

    let message = 'Medication deleted successfully';
    if (refillsResult.rows.length > 0) {
      message += ` (including ${refillsResult.rows.length} refill${refillsResult.rows.length > 1 ? 's' : ''})`;
    }
    
    res.json({
      success: true,
      message: message,
      deletedMedication: deleteResult.rows[0],
      deletedRefills: refillsResult.rows.length
    });

  } catch (error) {
    console.error('Error deleting medication:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete medication',
      error: error.message
    });
  }
});

app.put('/api/medications/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    let { schedule, specific_time, use_specific_time, dosage } = req.body;
    const userId = req.user.id;
    
    const dose_type = null;
    
    if (specific_time === "") {
      specific_time = null;
    }

    const verifyQuery = 'SELECT * FROM medications WHERE id = $1 AND user_id = $2';
    const verifyResult = await db.query(verifyQuery, [id, userId]);
    
    if (verifyResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found or access denied'
      });
    }

    const currentMedication = verifyResult.rows[0];
    
    const hasSignificantChanges = 
      schedule !== currentMedication.schedule ||
      dosage !== currentMedication.dosage;
    
    const normalizeTime = (time) => {
      if (time === null || time === undefined || time === '') return null;
      return time.toString();
    };
    
    const hasTimeChanges = 
      normalizeTime(specific_time) !== normalizeTime(currentMedication.specific_time) ||
      use_specific_time !== currentMedication.use_specific_time;

    console.log('Debug: Checking medication changes...');
    console.log('Current medication:', {
      schedule: currentMedication.schedule,
      dosage: currentMedication.dosage,
      specific_time: currentMedication.specific_time,
      use_specific_time: currentMedication.use_specific_time
    });
    console.log('Requested changes:', {
      schedule,
      dosage,
      specific_time,
      use_specific_time
    });
    console.log('Has significant changes:', hasSignificantChanges);
    console.log('Has time changes:', hasTimeChanges);

    const { action } = req.body;
    
    if (action === 'edit') {
      console.log(`Explicit edit mode for ${currentMedication.name} - updating in place (preserving refills)`);
      
      const updateQuery = `
        UPDATE medications 
        SET schedule = COALESCE($1, schedule),
            dose_type = COALESCE($2, dose_type),
            specific_time = COALESCE($3, specific_time),
            use_specific_time = COALESCE($4, use_specific_time),
            dosage = COALESCE($5, dosage)
        WHERE id = $6 AND user_id = $7
        RETURNING *
      `;
      
      const updateValues = [schedule, dose_type, specific_time, use_specific_time, dosage, id, userId];
      const result = await db.query(updateQuery, updateValues);
      
      scheduleCache.clearUser(userId);
      
      res.json({
        success: true,
        message: 'Medication updated successfully (edit mode - no refill created)',
        medication: result.rows[0],
        isNewEntry: false
      });
      
    } else if (hasSignificantChanges) {
      console.log(`Creating new medication entry to preserve historical data for ${currentMedication.name} (schedule/dosage change)`);
      
      const insertQuery = `
        INSERT INTO medications (
          user_id, name, dosage, schedule, dose_type, specific_time, 
          use_specific_time, photo_path, created_at, refill_of_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9) 
        RETURNING *
      `;
      
      const insertValues = [
        userId,
        currentMedication.name,
        dosage || currentMedication.dosage,
        schedule || currentMedication.schedule,
        dose_type !== undefined ? dose_type : currentMedication.dose_type,
        specific_time !== undefined ? specific_time : currentMedication.specific_time,
        use_specific_time !== undefined ? use_specific_time : currentMedication.use_specific_time,
        currentMedication.photo_path,
        id
      ];
      
      const result = await db.query(insertQuery, insertValues);
      
      console.log(`Created new medication entry (ID: ${result.rows[0].id}) linked to original (ID: ${id})`);
      
      scheduleCache.clearUser(userId);
      
      res.json({
        success: true,
        message: 'Medication updated successfully (new entry created to preserve history)',
        medication: result.rows[0],
        originalMedicationId: id,
        isNewEntry: true
      });
      
    } else if (hasTimeChanges) {
      console.log(`Updating time settings for ${currentMedication.name} in place (preserving refills)`);
      
      const updateQuery = `
        UPDATE medications 
        SET specific_time = COALESCE($1, specific_time),
            use_specific_time = COALESCE($2, use_specific_time)
        WHERE id = $3 AND user_id = $4
        RETURNING *
      `;
      
      const updateValues = [specific_time, use_specific_time, id, userId];
      const result = await db.query(updateQuery, updateValues);
      
      scheduleCache.clearUser(userId);
      
      res.json({
        success: true,
        message: 'Medication time settings updated successfully',
        medication: result.rows[0],
        isNewEntry: false
      });
      
    } else {
      const updateQuery = `
        UPDATE medications 
        SET schedule = COALESCE($1, schedule),
            dose_type = COALESCE($2, dose_type),
            specific_time = COALESCE($3, specific_time),
            use_specific_time = COALESCE($4, use_specific_time),
            dosage = COALESCE($5, dosage)
        WHERE id = $6 AND user_id = $7
        RETURNING *
      `;
      
      const updateValues = [schedule, dose_type, specific_time, use_specific_time, dosage, id, userId];
      const result = await db.query(updateQuery, updateValues);
      
      scheduleCache.clearUser(userId);
      
      res.json({
        message: 'Medication updated successfully',
        medication: result.rows[0],
        isNewEntry: false
      });
    }

  } catch (error) {
    console.error('Error updating medication:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update medication',
      error: error.message
    });
  }
});

app.get('/api/medications/:id/refills', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const refillQuery = `
      SELECT 
        m.*,
        CASE 
          WHEN m.refill_of_id IS NOT NULL THEN 'refill'
          ELSE 'original'
        END as medication_type,
        CASE 
          WHEN m.refill_of_id IS NOT NULL THEN 
            (SELECT name FROM medications WHERE id = m.refill_of_id)
          ELSE m.name
        END as original_name
      FROM medications m
      WHERE (m.id = $1 OR m.refill_of_id = $1) 
      AND m.user_id = $2
      ORDER BY m.created_at DESC
    `;
    
    const result = await db.query(refillQuery, [id, userId]);
    
    res.json({
      success: true,
      refills: result.rows
    });

  } catch (error) {
    console.error('Error fetching refills:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch refills',
      error: error.message
    });
  }
});

// ============================================================================
// DOSE LOGGING ENDPOINTS
// ============================================================================

app.post('/api/dose-log', isAuthenticated, upload.single('photo'), async (req, res) => {
  try {
    const { medicationId, doseType, notes } = req.body;
    const photoPath = req.file.path;
    const userId = req.user.id;

    if (!medicationId || !doseType) {
      return res.status(400).json({
        success: false,
        message: 'Medication ID and Dose Type (morning/afternoon/evening) are required'
      });
    }

    if (!['morning', 'afternoon', 'evening'].includes(doseType)) {
      return res.status(400).json({
        success: false,
        message: 'Dose type must be morning, afternoon, or evening'
      });
    }

    const medQuery = 'SELECT * FROM medications WHERE id = $1 AND user_id = $2';
    const medResult = await db.query(medQuery, [medicationId, userId]);
    
    if (medResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found'
      });
    }

    const medication = medResult.rows[0];
    const currentTime = new Date();
    const year = currentTime.getFullYear();
    const month = String(currentTime.getMonth() + 1).padStart(2, '0');
    const day = String(currentTime.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;

    const existingDoseQuery = `
      SELECT taken_at FROM dose_logs 
      WHERE user_id = $1 AND medication_id = $2 AND dose_type = $3 
      AND DATE(taken_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles') = $4
    `;
    const existingDoseResult = await db.query(existingDoseQuery, [userId, medicationId, doseType, today]);
    
    if (existingDoseResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: `You have already taken the ${doseType} dose of ${medication.name} today`,
        existingDose: existingDoseResult.rows[0]
      });
    }

    const recentDoseQuery = `
      SELECT taken_at, dose_type FROM dose_logs 
      WHERE user_id = $1 AND medication_id = $2 
      AND taken_at >= NOW() - INTERVAL '6 hours'
      ORDER BY taken_at DESC
      LIMIT 1
    `;
    const recentDoseResult = await db.query(recentDoseQuery, [userId, medicationId]);
    
    if (recentDoseResult.rows.length > 0) {
      const lastDose = recentDoseResult.rows[0];
      const timeSinceLastDose = (currentTime - new Date(lastDose.taken_at)) / (1000 * 60 * 60);
      
      if (timeSinceLastDose < 4) {
        return res.status(400).json({
          success: false,
          message: `Safety check: You took ${medication.name} ${timeSinceLastDose.toFixed(1)} hours ago. Please wait at least 4 hours between doses.`,
          lastDose: lastDose,
          timeSinceLastDose: timeSinceLastDose
        });
      }
    }

    const currentHour = currentTime.getHours();
    let appropriateTime = true;
    let timeWarning = null;
    let isWithinGracePeriod = false;

    const timeWindows = {
      morning: { start: 5, end: 12, graceStart: 4, graceEnd: 13 },
      afternoon: { start: 11, end: 17, graceStart: 10, graceEnd: 18 },
      evening: { start: 16, end: 23, graceStart: 15, graceEnd: 24 }
    };

    const window = timeWindows[doseType];
    
    if (currentHour < window.graceStart || currentHour > window.graceEnd) {
      appropriateTime = false;
      timeWarning = `${doseType.charAt(0).toUpperCase() + doseType.slice(1)} doses are typically taken between ${window.start}:00 and ${window.end}:00. It's currently ${currentHour}:${currentTime.getMinutes().toString().padStart(2, '0')}.`;
    } else if (currentHour < window.start || currentHour > window.end) {
      appropriateTime = true;
      isWithinGracePeriod = true;
      timeWarning = `${doseType.charAt(0).toUpperCase() + doseType.slice(1)} doses are ideally taken between ${window.start}:00 and ${window.end}:00, but you're within the acceptable grace period.`;
    } else {
      appropriateTime = true;
      isWithinGracePeriod = false;
    }

    const pillVerification = await verifyPillInImage(photoPath);
    
    if (!pillVerification.pillVisible) {
      return res.status(400).json({
        success: false,
        message: 'No medication detected in the image. Please take a photo showing the pill/medication.',
        verification: pillVerification
      });
    }

    const query = `
      INSERT INTO dose_logs (user_id, medication_id, dose_type, taken_at, photo_path, notes, created_at)
      VALUES ($1, $2, $3, NOW(), $4, $5, NOW())
      RETURNING *
    `;

    const values = [userId, medicationId, doseType, photoPath, notes || null];

    const result = await db.query(query, values);

    const response = {
      success: true,
      message: 'Dose logged successfully - pill verified!',
      doseLog: result.rows[0],
      verification: pillVerification,
      timing: {
        takenAt: result.rows[0].taken_at,
        appropriateTime: appropriateTime,
        isWithinGracePeriod: isWithinGracePeriod,
        timeWarning: timeWarning
      }
    };

    if (!appropriateTime) {
      response.message += ` Warning: ${timeWarning}`;
      response.success = true;
    } else if (isWithinGracePeriod) {
      response.message += ` Note: ${timeWarning}`;
    }

    res.status(201).json(response);

  } catch (error) {
    console.error('Error logging dose:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to log dose',
      error: error.message
    });
  }
});

app.get('/api/dose-log/history', isAuthenticated, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const userId = req.user.id;

    const takenQuery = `
      SELECT 
        dl.taken_at,
        dl.dose_type,
        m.name as medication_name,
        m.schedule
      FROM dose_logs dl
      JOIN medications m ON dl.medication_id = m.id
      WHERE dl.user_id = $1 AND dl.taken_at >= NOW() - INTERVAL '${days} days'
      ORDER BY dl.taken_at DESC
    `;

    const takenResult = await db.query(takenQuery, [userId]);

    const missedQuery = `
      SELECT 
        m.name as medication_name,
        m.schedule
      FROM medications m
      WHERE m.user_id = $1 AND m.created_at <= NOW() - INTERVAL '${days} days'
      AND NOT EXISTS (
        SELECT 1 FROM dose_logs dl 
        WHERE dl.medication_id = m.id 
        AND dl.user_id = $1
        AND dl.taken_at >= NOW() - INTERVAL '${days} days'
      )
    `;

    const missedResult = await db.query(missedQuery, [userId]);

    const takenDoses = takenResult.rows.map(dose => ({
      medicationName: dose.medication_name,
      takenAt: dose.taken_at,
      doseType: dose.dose_type,
      schedule: dose.schedule
    }));

    const missedDoses = missedResult.rows.map(med => ({
      medicationName: med.medication_name,
      schedule: med.schedule
    }));

    res.json({
      takenDoses,
      missedDoses,
      totalTaken: takenDoses.length,
      totalMissed: missedDoses.length
    });

  } catch (error) {
    console.error('Error fetching dose history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dose history'
    });
  }
});

app.post('/api/record-dose-with-photo', isAuthenticated, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Photo is required'
      });
    }

    const { medicationId, date, timeSlot, taken } = req.body;
    const userId = req.user.id;
    
    if (!medicationId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Medication ID and date are required'
      });
    }

    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    const currentYear = currentTime.getFullYear();
    const currentMonth = String(currentTime.getMonth() + 1).padStart(2, '0');
    const currentDay = String(currentTime.getDate()).padStart(2, '0');
    const currentDate = `${currentYear}-${currentMonth}-${currentDay}`;
    
    const medQuery = 'SELECT name, dose_type, use_specific_time, specific_time, schedule FROM medications WHERE id = $1 AND user_id = $2';
    const medResult = await db.query(medQuery, [medicationId, userId]);
    
    if (medResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found'
      });
    }

    const medication = medResult.rows[0];
    
    let doseType = 'manual';
    
    try {
      const todayDate = new Date();
      const year = todayDate.getFullYear();
      const month = String(todayDate.getMonth() + 1).padStart(2, '0');
      const day = String(todayDate.getDate()).padStart(2, '0');
      const today = `${year}-${month}-${day}`;
      const todaysSchedule = await persistentScheduleService.getOrCreatePersistentSchedule(medication.user_id, today);
      
      const availableSlots = [];
      if (todaysSchedule.morning.some(med => med.id === medicationId)) {
        availableSlots.push('morning');
      }
      if (todaysSchedule.afternoon.some(med => med.id === medicationId)) {
        availableSlots.push('afternoon');
      }
      if (todaysSchedule.evening.some(med => med.id === medicationId)) {
        availableSlots.push('evening');
      }
      
      console.log(`Medication ${medicationId} (${medication.name}) appears in slots:`, availableSlots);
      
      if (availableSlots.length > 1) {
        if (currentHour >= 5 && currentHour < 12 && availableSlots.includes('morning')) {
          doseType = 'morning';
        } else if (currentHour >= 12 && currentHour < 17 && availableSlots.includes('afternoon')) {
          doseType = 'afternoon';
        } else if (currentHour >= 17 && availableSlots.includes('evening')) {
          doseType = 'evening';
        } else if (currentHour >= 12 && availableSlots.includes('evening')) {
          doseType = 'evening';
        } else {
          doseType = availableSlots[0];
        }
      } else if (availableSlots.length === 1) {
        doseType = availableSlots[0];
      } else {
        console.log(`Medication ${medicationId} not found in today's schedule, using time-based fallback`);
        if (currentHour >= 5 && currentHour < 12) {
          doseType = 'morning';
        } else if (currentHour >= 12 && currentHour < 17) {
          doseType = 'afternoon';
        } else {
          doseType = 'evening';
        }
      }
      
      console.log(`Selected dose type: ${doseType} (current hour: ${currentHour}, available slots: [${availableSlots.join(', ')}])`);
      
    } catch (scheduleError) {
      console.log('Could not get schedule for dose type determination, using time-based fallback:', scheduleError.message);
      if (currentHour >= 5 && currentHour < 12) {
        doseType = 'morning';
      } else if (currentHour >= 12 && currentHour < 17) {
        doseType = 'afternoon';
      } else {
        doseType = 'evening';
      }
    }
    
    let allowedTimeSlots = [];
    let timeRestrictionMessage = '';
    
    if (medication.use_specific_time && medication.specific_time) {
      const specificHour = parseInt(medication.specific_time.split(':')[0]);
      const timeWindow = 2;
      
      if (Math.abs(currentHour - specificHour) <= timeWindow) {
        allowedTimeSlots = [medication.dose_type];
        timeRestrictionMessage = `This medication should be taken at ${medication.specific_time}`;
      } else {
        return res.status(400).json({
          success: false,
          message: `Time restriction: ${medication.name} should be taken at ${medication.specific_time} (±${timeWindow} hours). Current time: ${currentTime.toLocaleTimeString()}`,
          allowedTime: medication.specific_time,
          currentTime: currentTime.toLocaleTimeString()
        });
      }
    } else {
      const timeSlots = {
        'morning': '5 AM - 12 PM',
        'afternoon': '12 PM - 5 PM', 
        'evening': '5 PM - 5 AM'
      };
      
      let timeMatches = false;
      if (doseType === 'morning' && currentHour >= 5 && currentHour < 12) {
        timeMatches = true;
        allowedTimeSlots = ['morning'];
        timeRestrictionMessage = 'This medication should be taken in the morning (5 AM - 12 PM)';
      } else if (doseType === 'afternoon' && currentHour >= 12 && currentHour < 17) {
        timeMatches = true;
        allowedTimeSlots = ['afternoon'];
        timeRestrictionMessage = 'This medication should be taken in the afternoon (12 PM - 5 PM)';
      } else if (doseType === 'evening' && (currentHour >= 17 || currentHour < 5)) {
        timeMatches = true;
        allowedTimeSlots = ['evening'];
        timeRestrictionMessage = 'This medication should be taken in the evening (5 PM - 5 AM)';
      }
      
      if (!timeMatches) {
        return res.status(400).json({
          success: false,
          message: `Time restriction: ${medication.name} should be taken during ${timeSlots[doseType]}. Current time: ${currentTime.toLocaleTimeString()}`,
          allowedTimeSlot: doseType,
          currentTime: currentTime.toLocaleTimeString(),
          determinedSlot: doseType
        });
      }
    }

    const todayDosesQuery = `
      SELECT COUNT(*) as dose_count, MAX(taken_at) as last_taken
      FROM dose_logs 
      WHERE medication_id = $1 
      AND user_id = $2 
      AND DATE(taken_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles') = $3
    `;
    const todayDosesResult = await db.query(todayDosesQuery, [medicationId, userId, currentDate]);
    const todayDoseCount = parseInt(todayDosesResult.rows[0].dose_count);
    const lastTaken = todayDosesResult.rows[0].last_taken;

    let maxDosesPerDay = 1;
    if (medication.schedule) {
      if (medication.schedule.toLowerCase().includes('twice')) {
        maxDosesPerDay = 2;
      } else if (medication.schedule.toLowerCase().includes('three') || medication.schedule.toLowerCase().includes('3x')) {
        maxDosesPerDay = 3;
      } else if (medication.schedule.toLowerCase().includes('four') || medication.schedule.toLowerCase().includes('4x')) {
        maxDosesPerDay = 4;
      } else if (medication.schedule.toLowerCase().includes('once')) {
        maxDosesPerDay = 1;
      }
    }

    if (todayDoseCount >= maxDosesPerDay) {
      const timeSinceLastDose = lastTaken ? 
        Math.floor((currentTime - new Date(lastTaken)) / (1000 * 60 * 60)) : 0;
      
      return res.status(400).json({
        success: false,
        message: `Dose limit reached: ${medication.name} has already been taken ${todayDoseCount} time(s) today (max: ${maxDosesPerDay}). Last taken: ${lastTaken ? new Date(lastTaken).toLocaleTimeString() : 'Unknown'}`,
        doseCount: todayDoseCount,
        maxDoses: maxDosesPerDay,
        lastTaken: lastTaken,
        hoursSinceLastDose: timeSinceLastDose
      });
    }

    if (lastTaken) {
      const timeSinceLastDose = Math.floor((currentTime - new Date(lastTaken)) / (1000 * 60));
      if (timeSinceLastDose < 30) {
        return res.status(400).json({
          success: false,
          message: `Recent dose detected: ${medication.name} was taken ${timeSinceLastDose} minutes ago. Please wait at least 30 minutes between doses.`,
          minutesSinceLastDose: timeSinceLastDose,
          lastTaken: new Date(lastTaken).toLocaleTimeString()
        });
      }
    }

    const photoPath = req.file.path;
    console.log(`Recording dose with photo for medication: ${medicationId}`);

    let verificationResult = null;
    try {
      const medicationName = medication.name || 'Unknown';

      const pillVerification = await verifyPillInImage(photoPath, req);
      
      if (pillVerification.pillVisible) {
        const imageBuffer = fs.readFileSync(photoPath);
        const base64Image = imageBuffer.toString('base64');
        
        const userLanguage = req.headers['accept-language']?.includes('zh') ? 'zh' : 'en';
      
        const prompt = `
You are a medical assistant verifying medication intake. 

The user is trying to verify they are taking: ${medicationName}

IMPORTANT: Respond in ${userLanguage === 'zh' ? 'Chinese (Simplified)' : 'English'} language.

Look at this image and determine if the pill/medication shown matches what they should be taking.

Return ONLY a JSON object with these fields:
- isCorrectPill: true/false (does this pill match the expected medication?)
- confidence: "high", "medium", or "low" (how confident are you?)
- reason: brief explanation of your decision in ${userLanguage === 'zh' ? 'Chinese' : 'English'}
- description: what you see in the image in ${userLanguage === 'zh' ? 'Chinese' : 'English'}

Consider:
- Color, shape, size of the pill
- Any markings or text on the pill
- Overall appearance matching the expected medication

Return only the JSON object, no other text:
`;

        const result = await geminiModel.generateContent([
          prompt,
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image
            }
          }
        ]);
        
        const response = result.response.text();
        let cleanResponse = response.trim();
        if (cleanResponse.startsWith('```json')) {
          cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanResponse.startsWith('```')) {
          cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        
        verificationResult = JSON.parse(cleanResponse);
        console.log(`Gemini verification successful:`, verificationResult);
      } else {
        verificationResult = {
          isCorrectPill: true,
          confidence: 'low',
          reason: 'Fallback mode - any image accepted',
          description: 'Photo uploaded successfully (fallback verification)'
        };
      }
    } catch (geminiError) {
      console.log(`Gemini verification failed, using fallback:`, geminiError.message);
      verificationResult = {
        isCorrectPill: true,
        confidence: 'low',
        reason: 'Fallback mode - any image accepted',
        description: 'Photo uploaded successfully (fallback verification)'
      };
    }

    let doseResult;
    try {
      const doseQuery = `
        INSERT INTO dose_logs (medication_id, user_id, dose_type, taken_at, photo_path, verification_result)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
              const doseValues = [
          medicationId,
          userId,
          doseType,
          new Date(),
          photoPath,
          JSON.stringify(verificationResult)
        ];
      doseResult = await db.query(doseQuery, doseValues);
    } catch (dbError) {
      if (dbError.code === '42703') {
        console.log('verification_result column not found, using fallback query');
        const fallbackQuery = `
          INSERT INTO dose_logs (medication_id, user_id, dose_type, taken_at, photo_path)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `;
        const fallbackValues = [
          medicationId,
          userId,
          doseType,
          new Date(),
          photoPath
        ];
        doseResult = await db.query(fallbackQuery, fallbackValues);
      } else {
        throw dbError;
      }
    }
    
    console.log(`Dose recorded successfully with photo`);
    
    const todayDate = new Date();
    const todayYear = todayDate.getFullYear();
    const todayMonth = String(todayDate.getMonth() + 1).padStart(2, '0');
    const todayDay = String(todayDate.getDate()).padStart(2, '0');
    const today = `${todayYear}-${todayMonth}-${todayDay}`;
    scheduleCache.clearUser(userId);
    console.log(`Immediately invalidated today's schedule after dose recording`);

    res.json({
      success: true,
      message: 'Dose recorded successfully',
      doseId: doseResult.rows[0].id,
      verification: verificationResult,
      photoPath: photoPath
    });

  } catch (error) {
    console.error('Error recording dose with photo:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record dose',
      error: error.message
    });
  }
});

app.post('/api/dose-log/fix-afternoon-dose', isAuthenticated, async (req, res) => {
  try {
    const { medicationId } = req.body;
    const userId = req.user.id;
    
    if (!medicationId) {
      return res.status(400).json({
        success: false,
        message: 'Medication ID is required'
      });
    }
    
    const updateQuery = `
      UPDATE dose_logs 
      SET dose_type = 'evening' 
      WHERE medication_id = $1 AND user_id = $2 AND dose_type = 'afternoon' 
      AND DATE(taken_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles') = CURRENT_DATE
      RETURNING *
    `;
    
    const result = await db.query(updateQuery, [medicationId, userId]);
    
    if (result.rows.length > 0) {
      const todayDate = new Date();
      const year = todayDate.getFullYear();
      const month = String(todayDate.getMonth() + 1).padStart(2, '0');
      const day = String(todayDate.getDate()).padStart(2, '0');
      const today = `${year}-${month}-${day}`;
      scheduleCache.clearUser(userId);
      
      res.json({
        success: true,
        message: `Updated ${result.rows.length} dose log(s) from afternoon to evening`,
        updatedLogs: result.rows
      });
    } else {
      res.json({
        success: true,
        message: 'No afternoon doses found to update',
        updatedLogs: []
      });
    }
    
  } catch (error) {
    console.error('Error fixing afternoon dose:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fix afternoon dose',
      error: error.message
    });
  }
});

// ============================================================================
// SCHEDULE ENDPOINTS
// ============================================================================

app.get('/api/medications/schedule', isAuthenticated, async (req, res) => {
  try {
    const { date, timezone } = req.query;
    const userId = req.user.id;
    
    let userTimezone = timezone;
    
    if (!userTimezone) {
      try {
        const userResult = await db.query('SELECT timezone FROM users WHERE id = $1', [userId]);
        userTimezone = userResult.rows[0]?.timezone || 'America/Los_Angeles';
      } catch (error) {
        console.warn('Could not fetch user timezone, using default:', error.message);
        userTimezone = 'America/Los_Angeles';
      }
    }
    
    console.log(`Using timezone for user ${userId}: ${userTimezone}`);

    const persistentSchedule = await persistentScheduleService.getOrCreatePersistentSchedule(userId, date);
    
    const doseQuery = `
      SELECT dl.medication_id, dl.dose_type, dl.taken_at, m.name as medication_name
      FROM dose_logs dl
      JOIN medications m ON dl.medication_id = m.id
      WHERE dl.user_id = $1 
      AND DATE(dl.taken_at AT TIME ZONE 'UTC' AT TIME ZONE $3) = $2
      ORDER BY dl.taken_at DESC
    `;
    const doseResult = await db.query(doseQuery, [userId, date, userTimezone]);
    
    const takenDoses = new Map();
    const takenDosesByName = new Map();
    
    doseResult.rows.forEach(dose => {
      const key = `${dose.medication_id}_${dose.dose_type}`;
      const nameKey = `${dose.medication_name.toLowerCase()}_${dose.dose_type}`;
      
      takenDoses.set(key, dose.taken_at);
      takenDosesByName.set(nameKey, {
        medication_id: dose.medication_id,
        taken_at: dose.taken_at
      });
    });
    
    const anyDoseTaken = new Map();
    doseResult.rows.forEach(dose => {
      if (!anyDoseTaken.has(dose.medication_id)) {
        anyDoseTaken.set(dose.medication_id, dose.taken_at);
      }
    });
    
    console.log('Dose detection debug:');
    console.log('Date:', date);
    console.log('User ID:', userId);
    console.log('Full dose query:', doseQuery);
    console.log('Query params:', [userId, date]);
    console.log('Dose logs found:', doseResult.rows.length);
    console.log('Dose logs:', doseResult.rows.map(d => ({ medication_id: d.medication_id, dose_type: d.dose_type, taken_at: d.taken_at })));
    console.log('Taken doses map:', Object.fromEntries(takenDoses));
    
    const debugQuery = 'SELECT medication_id, dose_type, taken_at FROM dose_logs WHERE user_id = $1 ORDER BY taken_at DESC LIMIT 5';
    const debugResult = await db.query(debugQuery, [userId]);
    console.log('Recent doses for user (any date):', debugResult.rows);
    
    const showTakenDoses = req.query.showTaken === 'true';
    
    const isDoseTaken = (med, doseType) => {
      const exactKey = `${med.id}_${doseType}`;
      const nameKey = `${med.name.toLowerCase()}_${doseType}`;
      
      if (takenDoses.has(exactKey)) {
        return {
          taken: true,
          takenAt: takenDoses.get(exactKey)
        };
      }
      
      if (takenDosesByName.has(nameKey)) {
        const nameMatch = takenDosesByName.get(nameKey);
        return {
          taken: true,
          takenAt: nameMatch.taken_at
        };
      }
      
      const normalizedName = med.name.toLowerCase()
        .replace(/amoxibillin/g, 'amoxicillin')
        .replace(/amoxicillin/g, 'amoxibillin');
      const normalizedKey = `${normalizedName}_${doseType}`;
      
      if (takenDosesByName.has(normalizedKey)) {
        const normalizedMatch = takenDosesByName.get(normalizedKey);
        return {
          taken: true,
          takenAt: normalizedMatch.taken_at
        };
      }
      
      return {
        taken: false,
        takenAt: null
      };
    };

    const getTimeDisplay = (med, timeSlot) => {
      if (med.use_specific_time && med.specific_time) {
        const time = new Date(`2000-01-01T${med.specific_time}`);
        return time.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit', 
          hour12: true 
        });
      } else {
        switch(timeSlot) {
          case 'morning': return '8:00 AM';
          case 'afternoon': return '12:00 PM';
          case 'evening': return '6:00 PM';
          default: return '';
        }
      }
    };

    const sortByTime = (a, b) => {
      if (a.use_specific_time && a.specific_time && b.use_specific_time && b.specific_time) {
        return a.specific_time.localeCompare(b.specific_time);
      }
      if (a.use_specific_time && a.specific_time) return -1;
      if (b.use_specific_time && b.specific_time) return 1;
      return 0;
    };

    const scheduleWithTakenStatus = {
      morning: persistentSchedule.morning.map(med => {
        const status = isDoseTaken(med, 'morning');
        return {
          ...med,
          taken: status.taken,
          takenAt: status.takenAt,
          time: getTimeDisplay(med, 'morning')
        };
      }).filter(med => !med.taken || showTakenDoses).sort(sortByTime),
      afternoon: persistentSchedule.afternoon.map(med => {
        const status = isDoseTaken(med, 'afternoon');
        return {
          ...med,
          taken: status.taken,
          takenAt: status.takenAt,
          time: getTimeDisplay(med, 'afternoon')
        };
      }).filter(med => !med.taken || showTakenDoses).sort(sortByTime),
      evening: persistentSchedule.evening.map(med => {
        const status = isDoseTaken(med, 'evening');
        return {
          ...med,
          taken: status.taken,
          takenAt: status.takenAt,
          time: getTimeDisplay(med, 'evening')
        };
      }).filter(med => !med.taken || showTakenDoses).sort(sortByTime),
      _metadata: {
        scheduleCreatedAt: persistentSchedule.createdAt,
        medicationsSnapshot: persistentSchedule.medicationsSnapshot ? persistentSchedule.medicationsSnapshot.length : 0,
        showTakenDoses: showTakenDoses,
        takenDosesCount: doseResult.rows.length,
        takenDosesByName: Object.fromEntries(takenDosesByName)
      }
    };
    
    res.json({
      success: true,
      schedule: scheduleWithTakenStatus
    });

  } catch (error) {
    console.error('Error getting medication schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get medication schedule',
      error: error.message
    });
  }
});

app.post('/api/schedule/warm-cache', isAuthenticated, async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const userId = req.user.id;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    console.log(`Warming cache for user ${userId} from ${startDate} to ${endDate}`);
    
    const templateDate = startDate;
    
    try {
      console.log(`Creating template schedule for ${templateDate}`);
      await persistentScheduleService.getOrCreatePersistentSchedule(userId, templateDate);
    } catch (error) {
      console.error(`Error creating template schedule for ${templateDate}:`, error);
    }

    res.json({
      success: true,
      message: 'Cache warming completed - using template-based approach',
      templateDate: templateDate,
      dateRange: { startDate, endDate }
    });

  } catch (error) {
    console.error('Error warming cache:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to warm cache',
      error: error.message
    });
  }
});

app.post('/api/force-refresh-schedule', isAuthenticated, async (req, res) => {
  try {
    const { date } = req.body;
    const userId = req.user.id;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }
    
    scheduleCache.clearUser(userId);
    console.log('Force invalidated all schedules for force refresh');
    
    const result = await persistentScheduleService.forceRefreshPersistentSchedule(userId, date);
    
    res.json({
      success: true,
      message: 'Schedule refreshed successfully',
      result: result
    });
    
  } catch (error) {
    console.error('Error refreshing schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh schedule',
      error: error.message
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'MediHelper API is running' });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`MediHelper API server running on port ${PORT}`);
  console.log(`Google OAuth callback URL: ${process.env.GOOGLE_CALLBACK_URL || `http://localhost:${PORT}/auth/google/callback`}`);
});

// ============================================================================
// REFILL REMINDER ENDPOINTS
// ============================================================================

app.get('/api/medications/:id/refill-status', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const medicationQuery = `
      SELECT 
        m.*,
        COALESCE(m.days_supply, 30) as days_supply
      FROM medications m
      WHERE m.id = $1 AND m.user_id = $2
    `;
    
    const result = await db.query(medicationQuery, [id, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found'
      });
    }

    const medication = result.rows[0];
    
    const refillStatus = refillCalculationService.calculateRefillStatus(medication);
    
    let calculationComparison = null;
    if (medication.schedule && medication.quantity) {
      calculationComparison = refillCalculationService.compareCalculationMethods(
        medication.date_filled,
        medication.quantity,
        medication.schedule,
        medication.days_supply
      );
    }

    res.json({
      success: true,
      refillStatus,
      calculationComparison,
      medication: {
        id: medication.id,
        name: medication.name,
        schedule: medication.schedule,
        date_filled: medication.date_filled,
        quantity: medication.quantity,
        days_supply: medication.days_supply,
        refills_remaining: medication.refills_remaining,
        refill_expiry_date: medication.refill_expiry_date
      }
    });

  } catch (error) {
    console.error('Error fetching refill status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch refill status',
      error: error.message
    });
  }
});

app.post('/api/medications/:id/refill-reminders', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { reminder_type, custom_message } = req.body;

    const medicationQuery = `
      SELECT 
        m.*,
        COALESCE(m.days_supply, 30) as days_supply
      FROM medications m
      WHERE m.id = $1 AND m.user_id = $2
    `;
    
    const result = await db.query(medicationQuery, [id, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found'
      });
    }

    const medication = result.rows[0];
    
    const reminders = refillCalculationService.generateRefillReminders(medication);
    
    console.log('Generated reminders:', reminders);
    
    const reminderPromises = reminders.map(reminder => {
      const insertQuery = `
        INSERT INTO refill_reminders (
          user_id, medication_id, reminder_date, reminder_type, 
          status, message, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
        ON CONFLICT (user_id, medication_id, reminder_date, reminder_type) 
        DO UPDATE SET 
          message = EXCLUDED.message,
          updated_at = NOW()
        RETURNING *
      `;
      
      return db.query(insertQuery, [
        userId,
        id,
        reminder.reminder_date,
        reminder.reminder_type,
        'pending',
        reminder.message || custom_message
      ]);
    });

    const insertedReminders = await Promise.all(reminderPromises);
    
    res.json({
      success: true,
      message: `Generated ${reminders.length} refill reminders`,
      reminders: reminders.map((reminder, index) => ({
        ...reminder,
        id: insertedReminders[index].rows[0].id
      })),
      refillStatus: refillCalculationService.calculateRefillStatus(medication)
    });

  } catch (error) {
    console.error('Error generating refill reminders:', error);
    console.error('Error stack:', error.stack);
    console.error('Request params:', { id: req.params.id, userId: req.user.id, body: req.body });
    res.status(500).json({
      success: false,
      message: 'Failed to generate refill reminders',
      error: error.message
    });
  }
});

app.get('/api/refill-reminders', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, medication_id } = req.query;

    let query = `
      SELECT 
        rr.*,
        m.name as medication_name,
        m.schedule as medication_schedule
      FROM refill_reminders rr
      JOIN medications m ON rr.medication_id = m.id
      WHERE rr.user_id = $1
    `;
    
    const queryParams = [userId];
    let paramIndex = 2;

    if (status) {
      query += ` AND rr.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    if (medication_id) {
      query += ` AND rr.medication_id = $${paramIndex}`;
      queryParams.push(medication_id);
    }

    query += ` ORDER BY rr.reminder_date ASC, rr.created_at DESC`;

    const result = await db.query(query, queryParams);
    
    res.json({
      success: true,
      reminders: result.rows
    });

  } catch (error) {
    console.error('Error fetching refill reminders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch refill reminders',
      error: error.message
    });
  }
});

app.put('/api/refill-reminders/:id/status', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    if (!['pending', 'sent', 'dismissed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be pending, sent, or dismissed'
      });
    }

    let updateQuery = `
      UPDATE refill_reminders 
      SET 
        status = $1,
        updated_at = NOW()
    `;
    
    if (status === 'sent') {
      updateQuery += `, sent_at = NOW()`;
    }
    if (status === 'dismissed') {
      updateQuery += `, dismissed_at = NOW()`;
    }
    
    updateQuery += `
      WHERE id = $2 AND user_id = $3
      RETURNING *
    `;
    
    const result = await db.query(updateQuery, [status, id, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found'
      });
    }

    res.json({
      success: true,
      message: 'Reminder status updated successfully',
      reminder: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating reminder status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update reminder status',
      error: error.message
    });
  }
});

app.get('/api/medications/:id/refill-calculation', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const medicationQuery = `
      SELECT 
        m.*,
        COALESCE(m.days_supply, 30) as days_supply
      FROM medications m
      WHERE m.id = $1 AND m.user_id = $2
    `;
    
    const result = await db.query(medicationQuery, [id, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found'
      });
    }

    const medication = result.rows[0];
    
    if (!medication.schedule || !medication.quantity) {
      return res.json({
        success: true,
        message: 'Schedule and quantity data required for enhanced calculation',
        calculation: 'unavailable',
        basicCalculation: {
          refillDate: refillCalculationService.calculateRefillDate(
            medication.date_filled, 
            medication.days_supply
          ).toISOString().split('T')[0],
          daysUntil: refillCalculationService.daysUntilRefill(
            medication.date_filled, 
            medication.days_supply
          )
        }
      });
    }

    const comparison = refillCalculationService.compareCalculationMethods(
      medication.date_filled,
      medication.quantity,
      medication.schedule,
      medication.days_supply
    );

    res.json({
      success: true,
      comparison,
      medication: {
        id: medication.id,
        name: medication.name,
        schedule: medication.schedule,
        date_filled: medication.date_filled,
        quantity: medication.quantity,
        days_supply: medication.days_supply
      }
    });

  } catch (error) {
    console.error('Error calculating refill comparison:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate refill comparison',
      error: error.message
    });
  }
});

// ============================================================================
// DASHBOARD ENDPOINTS
// ============================================================================

app.get('/api/dashboard/refills', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;

    const medicationsQuery = `
      SELECT 
        m.id, m.name, m.schedule, m.date_filled, m.quantity, m.days_supply,
        m.refills_remaining, m.refill_expiry_date, m.pharmacy_name,
        m.created_at
      FROM medications m
      WHERE m.user_id = $1 
      AND m.refill_of_id IS NULL
      AND (m.date_filled IS NOT NULL OR m.quantity IS NOT NULL OR m.days_supply IS NOT NULL)
      ORDER BY m.created_at DESC
    `;
    
    const result = await db.query(medicationsQuery, [userId]);
    
    const medicationsWithRefillStatus = result.rows.map(medication => {
      const refillStatus = refillCalculationService.calculateRefillStatus(medication);
      
      return {
        ...medication,
        refillStatus,
        enhancedCalculation: medication.schedule && medication.quantity ? 
          refillCalculationService.calculateRefillDateWithSchedule(
            medication.date_filled,
            medication.quantity,
            medication.schedule,
            { daysSupply: medication.days_supply }
          ) : null
      };
    });

    const remindersQuery = `
      SELECT 
        rr.*,
        m.name as medication_name,
        m.schedule as medication_schedule
      FROM refill_reminders rr
      JOIN medications m ON rr.medication_id = m.id
      WHERE rr.user_id = $1 
      AND rr.status = 'pending'
      AND rr.reminder_date >= CURRENT_DATE
      ORDER BY rr.reminder_date ASC
      LIMIT 10
    `;
    
    const remindersResult = await db.query(remindersQuery, [userId]);
    
    const totalMedications = medicationsWithRefillStatus.length;
    const lowSupplyCount = medicationsWithRefillStatus.filter(m => m.refillStatus.isLowSupply).length;
    const overdueCount = medicationsWithRefillStatus.filter(m => m.refillStatus.status === 'overdue').length;
    const dueSoonCount = medicationsWithRefillStatus.filter(m => m.refillStatus.status === 'due_soon').length;
    
    res.json({
      success: true,
      summary: {
        totalMedications,
        lowSupplyCount,
        overdueCount,
        dueSoonCount,
        upcomingReminders: remindersResult.rows.length
      },
      medications: medicationsWithRefillStatus,
      upcomingReminders: remindersResult.rows
    });

  } catch (error) {
    console.error('Error fetching refill dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch refill dashboard',
      error: error.message
    });
  }
});

app.get('/api/dashboard/stats', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;

    const medsQuery = `
      SELECT COUNT(DISTINCT LOWER(TRIM(name))) as active_count 
      FROM medications 
      WHERE user_id = $1
    `;
    const medsResult = await db.query(medsQuery, [userId]);
    const activeMedications = parseInt(medsResult.rows[0].active_count);

    const takenQuery = `
      SELECT COUNT(*) as total_taken
      FROM dose_logs 
      WHERE user_id = $1 
        AND taken_at >= NOW() - INTERVAL '30 days'
    `;
    const takenResult = await db.query(takenQuery, [userId]);
    const totalTaken = parseInt(takenResult.rows[0].total_taken);

    let adherenceRate = 0;
    if (totalTaken >= 2) {
      adherenceRate = 100;
    } else if (totalTaken === 1) {
      adherenceRate = 75;
    } else {
      adherenceRate = 0;
    }
    
    const totalExpected = totalTaken > 0 ? totalTaken : activeMedications;

    const streakQuery = `
      SELECT COUNT(DISTINCT DATE(taken_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles')) as days_with_doses
      FROM dose_logs 
      WHERE user_id = $1 
        AND taken_at >= NOW() - INTERVAL '7 days'
    `;
    
    const streakResult = await db.query(streakQuery, [userId]);
    const currentStreak = parseInt(streakResult.rows[0].days_with_doses) || 0;

    console.log('Dashboard Stats Calculated:');
    console.log(`  Active Medications: ${activeMedications}`);
    console.log(`  Adherence: ${totalTaken}/${totalExpected} = ${adherenceRate}%`);
    console.log(`  Current Streak: ${currentStreak} days`);

    res.json({
      success: true,
      stats: {
        adherenceRate,
        activeMedications,
        currentStreak,
        debug: {
          totalTaken: totalTaken,
          totalExpected: totalExpected,
          period: '30 days'
        }
      }
    });

  } catch (error) {
    console.error('Error calculating dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate dashboard statistics',
      error: error.message
    });
  }
});

app.get('/api/next-dose', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;

    const currentTime = new Date();
    const year = currentTime.getFullYear();
    const month = String(currentTime.getMonth() + 1).padStart(2, '0');
    const day = String(currentTime.getDate()).padStart(2, '0');
    const currentDate = `${year}-${month}-${day}`;
    
    const persistentSchedule = await persistentScheduleService.getOrCreatePersistentSchedule(userId, currentDate);
    
    const doseQuery = `
      SELECT medication_id, dose_type, taken_at 
      FROM dose_logs 
      WHERE user_id = $1 
      AND DATE(taken_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles') = $2
    `;
    const doseResult = await db.query(doseQuery, [userId, currentDate]);
    
    const takenDoses = new Map();
    doseResult.rows.forEach(dose => {
      const key = `${dose.medication_id}_${dose.dose_type}`;
      takenDoses.set(key, dose.taken_at);
    });
    
    const upcomingDoses = [];
    const timeSlots = ['morning', 'afternoon', 'evening'];
    const timeSlotTimes = {
      'morning': { hour: 8, minute: 0 },
      'afternoon': { hour: 12, minute: 0 },
      'evening': { hour: 18, minute: 0 }
    };
    
    timeSlots.forEach(timeSlot => {
      if (persistentSchedule[timeSlot]) {
        persistentSchedule[timeSlot].forEach(med => {
          const doseKey = `${med.id}_${timeSlot}`;
          
          if (takenDoses.has(doseKey)) {
            return;
          }
          
          const doseTime = new Date(currentTime);
          doseTime.setHours(timeSlotTimes[timeSlot].hour, timeSlotTimes[timeSlot].minute, 0, 0);
          
          if (med.use_specific_time && med.specific_time) {
            const [hours, minutes] = med.specific_time.split(':');
            doseTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          }
          
          upcomingDoses.push({
            medicationId: med.id,
            name: med.name,
            dosage: med.dosage,
            doseType: timeSlot,
            scheduledTime: doseTime,
            timeDisplay: med.time || getDefaultTimeDisplay(timeSlot),
            originalSchedule: med.originalSchedule
          });
        });
      }
    });
    
    upcomingDoses.sort((a, b) => a.scheduledTime - b.scheduledTime);
    
    const graceTime = new Date(currentTime.getTime() - (2 * 60 * 60 * 1000));
    const nextDose = upcomingDoses.find(dose => dose.scheduledTime >= graceTime);
    
    let nextDoseResult = nextDose;
    if (!nextDose) {
      const tomorrow = new Date(currentTime);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowYear = tomorrow.getFullYear();
      const tomorrowMonth = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const tomorrowDay = String(tomorrow.getDate()).padStart(2, '0');
      const tomorrowDate = `${tomorrowYear}-${tomorrowMonth}-${tomorrowDay}`;
      
      const tomorrowSchedule = await persistentScheduleService.getOrCreatePersistentSchedule(userId, tomorrowDate);
      
      for (const timeSlot of timeSlots) {
        if (tomorrowSchedule[timeSlot] && tomorrowSchedule[timeSlot].length > 0) {
          const med = tomorrowSchedule[timeSlot][0];
          const doseTime = new Date(tomorrow);
          doseTime.setHours(timeSlotTimes[timeSlot].hour, timeSlotTimes[timeSlot].minute, 0, 0);
          
          if (med.use_specific_time && med.specific_time) {
            const [hours, minutes] = med.specific_time.split(':');
            doseTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          }
          
          nextDoseResult = {
            medicationId: med.id,
            name: med.name,
            dosage: med.dosage,
            doseType: timeSlot,
            scheduledTime: doseTime,
            timeDisplay: med.time || getDefaultTimeDisplay(timeSlot),
            originalSchedule: med.originalSchedule,
            isTomorrow: true
          };
          break;
        }
      }
    }
    
    function getDefaultTimeDisplay(timeSlot) {
      switch(timeSlot) {
        case 'morning': return '8:00 AM';
        case 'afternoon': return '12:00 PM';
        case 'evening': return '6:00 PM';
        default: return '';
      }
    }
    
    res.json({
      success: true,
      nextDose: nextDoseResult,
      upcomingToday: upcomingDoses.length,
      message: nextDoseResult ? 'Next dose found' : 'No upcoming doses found'
    });
    
  } catch (error) {
    console.error('Error getting next dose:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get next dose',
      error: error.message
    });
  }
});

app.get('/api/medication-eligibility', isAuthenticated, async (req, res) => {
  try {
    const { medicationId } = req.query;
    const userId = req.user.id;
    
    if (!medicationId) {
      return res.status(400).json({
        success: false,
        message: 'Medication ID is required'
      });
    }

    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    const year = currentTime.getFullYear();
    const month = String(currentTime.getMonth() + 1).padStart(2, '0');
    const day = String(currentTime.getDate()).padStart(2, '0');
    const currentDate = `${year}-${month}-${day}`;
    
    const medQuery = 'SELECT name, dose_type, use_specific_time, specific_time, schedule FROM medications WHERE id = $1 AND user_id = $2';
    const medResult = await db.query(medQuery, [medicationId, userId]);
    
    if (medResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found'
      });
    }

    const medication = medResult.rows[0];
    
    const parser = new DeterministicScheduleParser();
    const scheduledTimeSlots = parser.determineTimeSlots(medication.schedule.toLowerCase());
    
    let effectiveDoseType = medication.dose_type;
    let possibleTimeSlots = [];
    
    if (scheduledTimeSlots.length > 1) {
      possibleTimeSlots = scheduledTimeSlots;
    } else if (scheduledTimeSlots.length === 1) {
      possibleTimeSlots = scheduledTimeSlots;
    } else {
      possibleTimeSlots = effectiveDoseType ? [effectiveDoseType] : ['morning'];
    }
    
    if (!effectiveDoseType) {
      const isMultiDose = possibleTimeSlots.length > 1;
      const eveningStart = isMultiDose ? 12 : 17;
      
      if (currentHour >= 5 && currentHour < 12 && possibleTimeSlots.includes('morning')) {
        effectiveDoseType = 'morning';
      } else if (currentHour >= 12 && currentHour < 17 && possibleTimeSlots.includes('afternoon')) {
        effectiveDoseType = 'afternoon';
      } else if ((currentHour >= eveningStart || currentHour < 5) && possibleTimeSlots.includes('evening')) {
        effectiveDoseType = 'evening';
      } else {
        effectiveDoseType = possibleTimeSlots[0];
      }
    }
    
    let timeEligible = false;
    let timeMessage = '';
    let allowedTimeSlots = [];
    
    if (medication.use_specific_time && medication.specific_time) {
      const specificHour = parseInt(medication.specific_time.split(':')[0]);
      const timeWindow = 2;
      
      const withinSpecificTime = Math.abs(currentHour - specificHour) <= timeWindow;
      
      let withinOtherTimeSlot = false;
      let otherEligibleSlots = [];
      
      if (possibleTimeSlots.length > 1) {
        possibleTimeSlots.forEach(slot => {
          if (slot === 'morning' && currentHour >= 5 && currentHour < 12) {
            if (!withinSpecificTime) {
              withinOtherTimeSlot = true;
              otherEligibleSlots.push(slot);
            }
          } else if (slot === 'afternoon' && currentHour >= 12 && currentHour < 17) {
            withinOtherTimeSlot = true;
            otherEligibleSlots.push(slot);
          } else if (slot === 'evening' && (currentHour >= 17 || currentHour < 5)) {
            withinOtherTimeSlot = true;
            otherEligibleSlots.push(slot);
          }
        });
      }
      
      if (withinSpecificTime) {
        timeEligible = true;
        if (withinOtherTimeSlot) {
          timeMessage = `Can be taken at ${medication.specific_time} (±${timeWindow} hours) or during ${otherEligibleSlots.join('/')} time`;
          allowedTimeSlots = [effectiveDoseType, ...otherEligibleSlots];
        } else {
          timeMessage = `Can be taken at ${medication.specific_time} (±${timeWindow} hours)`;
          allowedTimeSlots = [effectiveDoseType];
        }
      } else if (withinOtherTimeSlot) {
        timeEligible = true;
        timeMessage = `Can be taken during ${otherEligibleSlots.join('/')} time (also scheduled for ${medication.specific_time})`;
        allowedTimeSlots = otherEligibleSlots;
      } else {
        const otherTimes = possibleTimeSlots.length > 1 ? 
          ` or during ${possibleTimeSlots.filter(s => s !== effectiveDoseType).join('/')} hours` : '';
        timeMessage = `Should be taken at ${medication.specific_time} (±${timeWindow} hours)${otherTimes}`;
        allowedTimeSlots = [];
      }
    } else {
      const isMultiDose = possibleTimeSlots.length > 1;
      console.log(`Multi-dose check: isMultiDose=${isMultiDose}, possibleTimeSlots=${JSON.stringify(possibleTimeSlots)}`);
      
      const timeSlotRanges = {
        'morning': { start: 5, end: 12, label: '5 AM - 12 PM' },
        'afternoon': { start: 12, end: 17, label: '12 PM - 5 PM' },
        'evening': { 
          start: isMultiDose ? 12 : 17,
          end: 24, 
          label: isMultiDose ? '12 PM - 5 AM' : '5 PM - 5 AM'
        }
      };
      
      console.log(`Evening range: start=${timeSlotRanges.evening.start}, current hour=${currentHour}`);
      
      let currentlyEligibleSlots = [];
      
      possibleTimeSlots.forEach(slot => {
        const range = timeSlotRanges[slot];
        if (range) {
          let inTimeRange = false;
          
          if (slot === 'evening') {
            const eveningStart = isMultiDose ? 12 : 17;
            inTimeRange = (currentHour >= eveningStart || currentHour < 5);
          } else {
            inTimeRange = (currentHour >= range.start && currentHour < range.end);
          }
          
          if (inTimeRange) {
            currentlyEligibleSlots.push(slot);
            timeEligible = true;
          }
        }
      });
      
      console.log(`Time Check Debug: currentHour=${currentHour}, currentlyEligibleSlots=${JSON.stringify(currentlyEligibleSlots)}, timeEligible=${timeEligible}`);
      
      if (timeEligible) {
        allowedTimeSlots = currentlyEligibleSlots;
        if (currentlyEligibleSlots.length === 1) {
          const slot = currentlyEligibleSlots[0];
          timeMessage = `Can be taken in the ${slot} (${timeSlotRanges[slot].label})`;
        } else {
          timeMessage = `Can be taken now (multiple time slots available)`;
        }
      } else {
        const slotLabels = possibleTimeSlots.map(slot => 
          `${slot} (${timeSlotRanges[slot].label})`
        ).join(' or ');
        timeMessage = `Should be taken during ${slotLabels}`;
        allowedTimeSlots = possibleTimeSlots;
      }
    }

    const todayDosesQuery = `
      SELECT COUNT(*) as dose_count, MAX(taken_at) as last_taken
      FROM dose_logs 
      WHERE medication_id = $1 
      AND user_id = $2 
      AND DATE(taken_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles') = $3
    `;
    const todayDosesResult = await db.query(todayDosesQuery, [medicationId, userId, currentDate]);
    const todayDoseCount = parseInt(todayDosesResult.rows[0].dose_count);
    const lastTaken = todayDosesResult.rows[0].last_taken;

    let maxDosesPerDay = 1;
    if (medication.schedule) {
      if (medication.schedule.toLowerCase().includes('twice')) {
        maxDosesPerDay = 2;
      } else if (medication.schedule.toLowerCase().includes('three') || medication.schedule.toLowerCase().includes('3x')) {
        maxDosesPerDay = 3;
      } else if (medication.schedule.toLowerCase().includes('four') || medication.schedule.toLowerCase().includes('4x')) {
        maxDosesPerDay = 4;
      } else if (medication.schedule.toLowerCase().includes('once')) {
        maxDosesPerDay = 1;
      }
    }

    const frequencyEligible = todayDoseCount < maxDosesPerDay;
    const frequencyMessage = frequencyEligible ? 
      `Can take dose ${todayDoseCount + 1} of ${maxDosesPerDay} today` :
      `Already taken ${todayDoseCount} of ${maxDosesPerDay} doses today`;

    let recentDoseEligible = true;
    let recentDoseMessage = '';
    if (lastTaken) {
      const timeSinceLastDose = Math.floor((currentTime - new Date(lastTaken)) / (1000 * 60));
      if (timeSinceLastDose < 30) {
        recentDoseEligible = false;
        recentDoseMessage = `Last dose was ${timeSinceLastDose} minutes ago. Wait at least 30 minutes between doses.`;
      } else {
        recentDoseMessage = `Last dose was ${timeSinceLastDose} minutes ago`;
      }
    } else {
      recentDoseMessage = 'No previous doses today';
    }

    const overallEligible = timeEligible && frequencyEligible && recentDoseEligible;

    res.json({
      success: true,
      eligible: overallEligible,
      medication: {
        id: medicationId,
        name: medication.name,
        doseType: medication.dose_type,
        effectiveDoseType: effectiveDoseType,
        possibleTimeSlots: possibleTimeSlots,
        schedule: medication.schedule,
        specificTime: medication.specific_time
      },
      timeCheck: {
        eligible: timeEligible,
        message: timeMessage,
        allowedTimeSlots: allowedTimeSlots,
        currentTime: currentTime.toLocaleTimeString()
      },
      frequencyCheck: {
        eligible: frequencyEligible,
        message: frequencyMessage,
        doseCount: todayDoseCount,
        maxDoses: maxDosesPerDay,
        lastTaken: lastTaken
      },
      recentDoseCheck: {
        eligible: recentDoseEligible,
        message: recentDoseMessage,
        minutesSinceLastDose: lastTaken ? Math.floor((currentTime - new Date(lastTaken)) / (1000 * 60)) : null
      }
    });

  } catch (error) {
    console.error('Error checking medication eligibility:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check medication eligibility',
      error: error.message
    });
  }
});

// ============================================================================
// PILL VERIFICATION ENDPOINTS
// ============================================================================

app.post('/api/verify-pill', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Photo is required'
      });
    }

    const { medicationName } = req.body;
    if (!medicationName) {
      return res.status(400).json({
        success: false,
        message: 'Medication name is required'
      });
    }

    const photoPath = req.file.path;
    console.log(`Verifying pill for medication: ${medicationName}`);

    const pillVerification = await verifyPillInImage(photoPath, req);
    
    if (!pillVerification.pillVisible) {
      return res.json({
        success: false,
        isCorrectPill: false,
        message: 'No pill visible in the image. Please take a clear photo of the medication.',
        confidence: pillVerification.confidence,
        description: pillVerification.description
      });
    }

    const imageBuffer = fs.readFileSync(photoPath);
    const base64Image = imageBuffer.toString('base64');
    
    const userLanguage = req.headers['accept-language']?.includes('zh') ? 'zh' : 'en';
    
    const prompt = `
You are a medical assistant verifying medication intake. 

The user is trying to verify they are taking: ${medicationName}

IMPORTANT: Respond in ${userLanguage === 'zh' ? 'Chinese (Simplified)' : 'English'} language.

Look at this image and determine if the pill/medication shown matches what they should be taking.

Return ONLY a JSON object with these fields:
- isCorrectPill: true/false (does this pill match the expected medication?)
- confidence: "high", "medium", or "low" (how confident are you?)
- reason: brief explanation of your decision in ${userLanguage === 'zh' ? 'Chinese' : 'English'}
- description: what you see in the image in ${userLanguage === 'zh' ? 'Chinese' : 'English'}

Consider:
- Color, shape, size of the pill
- Any markings or text on the pill
- Overall appearance matching the expected medication

Return only the JSON object, no other text:
`;

    const result = await geminiModel.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Image
        }
      }
    ]);
    
    const response = result.response.text();
    
    let cleanResponse = response.trim();
    if (cleanResponse.startsWith('```json')) {
      cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanResponse.startsWith('```')) {
      cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    const verification = JSON.parse(cleanResponse);
    
    console.log(`Pill verification completed for ${medicationName}:`, verification);

    res.json({
      success: true,
      isCorrectPill: verification.isCorrectPill || false,
      confidence: verification.confidence || 'low',
      reason: verification.reason || 'Unable to determine',
      description: verification.description || 'No description available',
      photoPath: photoPath
    });

  } catch (error) {
    console.error('Error verifying pill:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify pill',
      error: error.message
    });
  }
});

// ============================================================================
// CACHE MANAGEMENT ENDPOINTS
// ============================================================================

app.get('/api/cache/stats', async (req, res) => {
  try {
    const stats = scheduleCache.getStats();
    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    console.error('Error getting cache stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cache stats',
      error: error.message
    });
  }
});

app.post('/api/cache/clear', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    
    scheduleCache.clearUser(userId);
    console.log(`Cleared cache for user ${userId}`);
    
    res.json({
      success: true,
      message: `Cache cleared for user ${userId}`
    });
    
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache',
      error: error.message
    });
  }
});

// ============================================================================
// AUTHENTICATION ENDPOINTS
// ============================================================================

app.get('/api/auth/user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      success: true,
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        avatar_url: req.user.avatar_url,
        auth_provider: req.user.auth_provider,
        timezone: req.user.timezone
      }
    });
  } else {
    res.json({
      success: false,
      user: null
    });
  }
});

app.post('/api/auth/user/timezone', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    const { timezone } = req.body;
    
    if (!timezone || typeof timezone !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Valid timezone is required'
      });
    }
    
    const updateQuery = 'UPDATE users SET timezone = $1 WHERE id = $2 RETURNING timezone';
    const result = await db.query(updateQuery, [timezone, userId]);
    
    if (result.rows.length > 0) {
      req.user.timezone = timezone;
      
      console.log(`Updated timezone for user ${userId}: ${timezone}`);
      
      res.json({
        success: true,
        message: 'Timezone updated successfully',
        timezone: timezone
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
  } catch (error) {
    console.error('Error updating user timezone:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update timezone'
    });
  }
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/auth/login?error=oauth_failed' }),
  (req, res) => {
    console.log('OAuth successful for user:', req.user);
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
    res.redirect(`${frontendUrl}/?auth=success&userId=${req.user.id}`);
  }
);

app.post('/api/auth/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Error during logout'
      });
    }
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Error destroying session'
        });
      }
      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    });
  });
});

app.get('/api/users', async (req, res) => {
  try {
    const result = await db.query('SELECT id, name, email, auth_provider, created_at FROM users ORDER BY created_at DESC');
    res.json({
      success: true,
      users: result.rows
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});

app.get('/api/medications/refill-status', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await db.query(`
      SELECT * FROM medications 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `, [userId]);
    
    if (result.rows.length === 0) {
      return res.json({
        success: true,
        message: 'No medications found',
        refillStatus: {
          total: 0,
          needsRefill: 0,
          lowSupply: 0,
          expired: 0,
          healthy: 0,
          noData: 0,
          medications: []
        },
        nextRefill: null
      });
    }
    
    const refillStatus = automatedRefillService.getRefillStatusSummary(result.rows);
    const nextRefill = automatedRefillService.getNextRefillDue(result.rows);
    
    res.json({
      success: true,
      refillStatus,
      nextRefill,
      message: `Found ${result.rows.length} medications with refill status`
    });
    
  } catch (error) {
    console.error('Error fetching refill status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch refill status',
      error: error.message
    });
  }
});

// ============================================================================
// ADMIN ENDPOINTS
// ============================================================================

app.post('/api/admin/migrate-timezone', async (req, res) => {
  try {
    await db.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS timezone VARCHAR(100) DEFAULT 'America/Los_Angeles'
    `);
    
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_users_timezone ON users(timezone)
    `);
    
    console.log('Timezone migration completed successfully');
    
    res.json({
      success: true,
      message: 'Timezone migration completed successfully'
    });
  } catch (error) {
    console.error('Timezone migration failed:', error);
    res.status(500).json({
      success: false,
      message: 'Migration failed',
      error: error.message
    });
  }
});
