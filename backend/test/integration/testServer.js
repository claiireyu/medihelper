import express from 'express';
import pg from 'pg';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { scheduleCache } from '../../cache/scheduleCache.js';
import { PersistentScheduleService } from '../../services/persistentScheduleService.js';
import { DeterministicScheduleParser } from '../../services/deterministicScheduleParser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create test server
export function createTestServer(testDb) {
  const app = express();
  
  // Middleware
  app.use(cors({
    origin: ['http://localhost:8080', 'http://localhost:5173'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  }));
  
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // JSON parsing error handling middleware
  app.use((error, req, res, next) => {
    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid JSON format' 
      });
    }
    next();
  });
  
  // Test file upload configuration
  const storage = multer.memoryStorage(); // Use memory storage for tests
  const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: function (req, file, cb) {
      const allowedExtensions = /\.(jpg|jpeg|png|gif|webp|bmp|tiff)$/i;
      const allowedMimeTypes = /^image\/(jpeg|jpg|png|gif|webp|bmp|tiff)$/i;
      
      const hasValidExtension = allowedExtensions.test(file.originalname);
      const hasValidMimeType = allowedMimeTypes.test(file.mimetype);
      
      if (hasValidExtension && hasValidMimeType) {
        cb(null, true);
      } else {
        cb(new Error(`Only image files are allowed! Supported formats: JPG, JPEG, PNG, GIF, WebP, BMP, TIFF`), false);
      }
    }
  });
  
  // Mock authentication middleware for testing
  const mockAuth = async (req, res, next) => {
    try {
      const userId = req.headers['x-test-user-id'] || req.query.userId;
      
      if (!userId) {
        return res.status(400).json({ 
          success: false,
          message: 'Missing user ID in x-test-user-id header' 
        });
      }
      
      // Validate that the user exists in the database
      const userResult = await testDb.query('SELECT * FROM users WHERE id = $1', [userId]);
      
      if (userResult.rows.length === 0) {
        return res.status(400).json({ 
          success: false,
          message: 'Invalid user ID - user not found' 
        });
      }
      
      req.user = userResult.rows[0];
      next();
    } catch (error) {
      console.error('Authentication error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Authentication service error' 
      });
    }
  };
  


  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      environment: 'test'
    });
  });
  
  // Schedule endpoints (MUST come before medication CRUD endpoints to avoid route conflicts)
  app.get('/api/medications/schedule', mockAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const { date } = req.query;
      
      // Use the PersistentScheduleService to generate schedule
      const scheduleService = new PersistentScheduleService(testDb);
      const schedule = await scheduleService.getOrCreatePersistentSchedule(userId, date || '2024-01-15');
      
      res.json({
        success: true,
        schedule: schedule
      });
    } catch (error) {
      console.error('Error generating schedule:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  app.post('/api/schedule/warm-cache', mockAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const { date } = req.body;
      
      // Use the PersistentScheduleService to warm cache
      const scheduleService = new PersistentScheduleService(testDb);
      const schedule = await scheduleService.getOrCreatePersistentSchedule(userId, date || '2024-01-15');
      
      res.json({ 
        success: true,
        message: 'Cache warming completed - using template-based approach',
        schedule: schedule
      });
    } catch (error) {
      console.error('Error warming cache:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // Medications endpoints
  app.get('/api/medications', mockAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const result = await testDb.query(
        'SELECT * FROM medications WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );
      
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching medications:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  app.post('/api/medications', mockAuth, upload.single('photo'), async (req, res) => {
    try {
      const userId = req.user.id;
      const { name, dosage, schedule, dose_type, specific_time, use_specific_time } = req.body;
      
      // Validate required fields
      if (!name || !name.trim()) {
        return res.status(400).json({ 
          success: false,
          message: 'Medication name is required' 
        });
      }
      
      if (!dosage || !dosage.trim()) {
        return res.status(400).json({ 
          success: false,
          message: 'Medication dosage is required' 
        });
      }
      
      if (!schedule || !schedule.trim()) {
        return res.status(400).json({ 
          success: false,
          message: 'Medication schedule is required' 
        });
      }
      
      const result = await testDb.query(
        `INSERT INTO medications 
         (user_id, name, dosage, schedule, dose_type, specific_time, use_specific_time, photo_path) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [userId, name, dosage, schedule, dose_type, specific_time, use_specific_time, req.file ? 'test_photo.jpg' : null]
      );
      
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creating medication:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  app.get('/api/medications/:id', mockAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const result = await testDb.query(
        'SELECT * FROM medications WHERE id = $1 AND user_id = $2',
        [id, userId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Medication not found' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error fetching medication:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  app.put('/api/medications/:id', mockAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { name, dosage, schedule, dose_type, specific_time, use_specific_time } = req.body;
      
      const result = await testDb.query(
        `UPDATE medications 
         SET name = $1, dosage = $2, schedule = $3, dose_type = $4, specific_time = $5, use_specific_time = $6
         WHERE id = $7 AND user_id = $8 RETURNING *`,
        [name, dosage, schedule, dose_type, specific_time, use_specific_time, id, userId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Medication not found' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating medication:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  app.delete('/api/medications/:id', mockAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const result = await testDb.query(
        'DELETE FROM medications WHERE id = $1 AND user_id = $2 RETURNING *',
        [id, userId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Medication not found' });
      }
      
      res.json({ message: 'Medication deleted successfully' });
    } catch (error) {
      console.error('Error deleting medication:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // Dose log endpoints
  app.post('/api/dose-log', mockAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const { medication_id, dose_type, scheduled_time, notes } = req.body;
      
      const result = await testDb.query(
        `INSERT INTO dose_logs 
         (user_id, medication_id, dose_type, scheduled_time, taken_at, notes) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [userId, medication_id, dose_type, scheduled_time, new Date(), notes]
      );
      
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creating dose log:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  app.get('/api/dose-log/history', mockAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const { days = 7 } = req.query;

      // Get taken doses - minimal data for UI (matching main API implementation)
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

      const takenResult = await testDb.query(takenQuery, [userId]);

      // Get missed medications - minimal data for UI (matching main API implementation)
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

      const missedResult = await testDb.query(missedQuery, [userId]);

      // Format for UI - only essential fields (matching main API implementation)
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
      console.error('Error fetching dose log history:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // Cache management endpoints
  app.get('/api/cache/stats', async (req, res) => {
    try {
      const stats = scheduleCache.getCacheStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching cache stats:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  app.post('/api/cache/clear', mockAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Clear user-specific cache
      scheduleCache.invalidateUserSchedules(userId);
      
      res.json({ message: 'Cache cleared successfully for user' });
    } catch (error) {
      console.error('Error clearing cache:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // Force refresh schedule endpoint
  app.post('/api/force-refresh-schedule', mockAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const { date } = req.body;
      
      const scheduleService = new PersistentScheduleService(testDb);
      const result = await scheduleService.forceRefreshPersistentSchedule(userId, date || '2024-01-15');
      
      res.json({
        message: 'Schedule refreshed successfully',
        result: result
      });
    } catch (error) {
      console.error('Error refreshing schedule:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // Error handling middleware
  app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  });
  
  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
  });
  
  return app;
}

// Helper function to start test server
export async function startTestServer(testDb, port = 3002) {
  const app = createTestServer(testDb);
  
  return new Promise((resolve) => {
    const server = app.listen(port, () => {
      console.log(`✅ Test server running on port ${port}`);
      resolve({ app, server });
    });
  });
}

// Helper function to stop test server
export function stopTestServer(server) {
  return new Promise((resolve) => {
    server.close(() => {
      console.log('✅ Test server stopped');
      resolve();
    });
  });
}
