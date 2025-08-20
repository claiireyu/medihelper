import pg from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Polyfill fetch for Node.js testing environment
import fetch from 'node-fetch';
global.fetch = fetch;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test database configuration
const TEST_DB_CONFIG = {
  user: process.env.TEST_DB_USER || 'postgres',
  host: process.env.TEST_DB_HOST || 'localhost',
  database: process.env.TEST_DB_NAME || 'medihelper',
  password: process.env.TEST_DB_PASSWORD || '',
  port: process.env.TEST_DB_PORT || 3000,
};

// Production database configuration (for comparison)
const PROD_DB_CONFIG = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'medihelper',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 5432,
};

let testDb;
let prodDb;

// Setup test database
export async function setupTestDatabase() {
  try {
    // Connect to test database
    testDb = new pg.Client(TEST_DB_CONFIG);
    await testDb.connect();
    
    // Connect to production database for schema comparison
    prodDb = new pg.Client(PROD_DB_CONFIG);
    await prodDb.connect();
    
    console.log('✅ Test database connected successfully');
    console.log('✅ Production database connected for schema comparison');
    
    return { testDb, prodDb };
  } catch (error) {
    console.error('❌ Failed to connect to test database:', error.message);
    throw error;
  }
}

// Teardown test database
export async function teardownTestDatabase() {
  try {
    if (testDb) {
      await testDb.end();
      console.log('Test database connection closed');
    }
    if (prodDb) {
      await prodDb.end();
      console.log('Production database connection closed');
    }
  } catch (error) {
    console.error('Error closing database connections:', error.message);
  }
}

// Initialize test database schema
export async function initializeTestSchema() {
  try {
    // Get the schema from production database
    const schemaQuery = `
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      ORDER BY table_name, ordinal_position
    `;
    
    const schemaResult = await prodDb.query(schemaQuery);
    console.log('Retrieved schema from production database');
    
    // Create tables in test database based on production schema
    // For now, we'll use the basic table structure that the tests expect
    const createTablesSQL = `
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          google_id VARCHAR(255) UNIQUE,
          email VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255),
          auth_provider VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Medications table
      CREATE TABLE IF NOT EXISTS medications (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          dosage VARCHAR(100),
          schedule TEXT,
          dose_type VARCHAR(50),
          instructions TEXT,
          photo_path VARCHAR(500),
          refill_of_id INTEGER REFERENCES medications(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Dose logs table
      CREATE TABLE IF NOT EXISTS dose_logs (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          medication_id INTEGER NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
          dose_type VARCHAR(50),
          scheduled_time TIME,
          taken_at TIMESTAMP NOT NULL,
          photo_path VARCHAR(500),
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Refill reminders table
      CREATE TABLE IF NOT EXISTS refill_reminders (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          medication_id INTEGER NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
          reminder_date DATE NOT NULL,
          reminder_type VARCHAR(50) NOT NULL,
          status VARCHAR(50) DEFAULT 'pending',
          message TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          sent_at TIMESTAMP,
          dismissed_at TIMESTAMP,
          completed_at TIMESTAMP,
          UNIQUE(user_id, medication_id, reminder_date, reminder_type)
      );


    `;
    
    await testDb.query(createTablesSQL);
    
    // Wait a moment for tables to be fully created
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Create basic indexes (skip problematic ones for now)
    const createIndexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_medications_user_id ON medications(user_id);
      CREATE INDEX IF NOT EXISTS idx_dose_logs_user_id ON dose_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_dose_logs_medication_id ON dose_logs(medication_id);
      CREATE INDEX IF NOT EXISTS idx_dose_logs_taken_at ON dose_logs(taken_at);
      CREATE INDEX IF NOT EXISTS idx_refill_reminders_user_id ON refill_reminders(user_id);
      CREATE INDEX IF NOT EXISTS idx_refill_reminders_medication_id ON refill_reminders(medication_id);
      CREATE INDEX IF NOT EXISTS idx_refill_reminders_reminder_date ON refill_reminders(reminder_date);

    `;
    
    await testDb.query(createIndexesSQL);
    
    console.log('Test database schema initialized');
  } catch (error) {
    console.error('Failed to initialize test schema:', error.message);
    throw error;
  }
}

// Clean test database
export async function cleanTestDatabase() {
  try {
    // Clear all data but keep schema
    await testDb.query('DELETE FROM refill_reminders');
    await testDb.query('DELETE FROM dose_logs');
    await testDb.query('DELETE FROM medications');
    await testDb.query('DELETE FROM users');
    
    // Reset sequences
    await testDb.query('ALTER SEQUENCE users_id_seq RESTART WITH 1');
    await testDb.query('ALTER SEQUENCE medications_id_seq RESTART WITH 1');
    await testDb.query('ALTER SEQUENCE dose_logs_id_seq RESTART WITH 1');
    await testDb.query('ALTER SEQUENCE refill_reminders_id_seq RESTART WITH 1');
    
    console.log('Test database cleaned');
  } catch (error) {
    console.error('Failed to clean test database:', error.message);
    throw error;
  }
}

// Create test user
export async function createTestUser(userData = {}) {
  const defaultUser = {
    name: 'Test User',
    email: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}@example.com`,
    google_id: `test_google_id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    auth_provider: 'google',
    ...userData
  };
  
  try {
    const result = await testDb.query(
      'INSERT INTO users (name, email, google_id, auth_provider) VALUES ($1, $2, $3, $4) RETURNING *',
      [defaultUser.name, defaultUser.email, defaultUser.google_id, defaultUser.auth_provider]
    );
    
    console.log('Test user created:', result.rows[0].id);
    return result.rows[0];
  } catch (error) {
    console.error('Failed to create test user:', error.message);
    throw error;
  }
}

// Create test medication
export async function createTestMedication(userId, medicationData = {}) {
  const defaultMedication = {
    name: 'Test Medication',
    dosage: '10mg',
    schedule: 'once daily',
    dose_type: 'morning',
    photo_path: null,
    refill_of_id: null,
    ...medicationData
  };
  
  try {
    const result = await testDb.query(
      `INSERT INTO medications 
       (user_id, name, dosage, schedule, dose_type, photo_path, refill_of_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        userId,
        defaultMedication.name,
        defaultMedication.dosage,
        defaultMedication.schedule,
        defaultMedication.dose_type,
        defaultMedication.photo_path,
        defaultMedication.refill_of_id
      ]
    );
    
    console.log('Test medication created:', result.rows[0].id);
    return result.rows[0];
  } catch (error) {
    console.error('Failed to create test medication:', error.message);
    throw error;
  }
}

// Create test dose log
export async function createTestDoseLog(userId, medicationId, doseLogData = {}) {
  const defaultDoseLog = {
    dose_type: 'morning',
    scheduled_time: '08:00:00',
    taken_at: new Date(),
    photo_path: null,
    notes: null,
    ...doseLogData
  };
  
  try {
    const result = await testDb.query(
      `INSERT INTO dose_logs 
       (user_id, medication_id, dose_type, scheduled_time, taken_at, photo_path, notes) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        userId,
        medicationId,
        defaultDoseLog.dose_type,
        defaultDoseLog.scheduled_time,
        defaultDoseLog.taken_at,
        defaultDoseLog.photo_path,
        defaultDoseLog.notes
      ]
    );
    
    console.log('Test dose log created:', result.rows[0].id);
    return result.rows[0];
  } catch (error) {
    console.error('Failed to create test dose log:', error.message);
    throw error;
  }
}

// Create test refill reminder
export async function createTestRefillReminder(userId, medicationId, reminderData = {}) {
  const defaultReminder = {
    reminder_date: '2024-02-01',
    reminder_type: 'email',
    status: 'pending',
    message: 'Test reminder',
    ...reminderData
  };
  
  try {
    const result = await testDb.query(
      `INSERT INTO refill_reminders 
       (user_id, medication_id, reminder_date, reminder_type, status, message) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, medicationId, defaultReminder.reminder_date, defaultReminder.reminder_type, defaultReminder.status, defaultReminder.message]
    );
    
    console.log('Test refill reminder created:', result.rows[0].id);
    return result.rows[0];
  } catch (error) {
    console.error('Failed to create test refill reminder:', error.message);
    throw error;
  }
}

// Get database connection for tests
export function getTestDb() {
  return testDb;
}

export function getProdDb() {
  return prodDb;
}

// Export configuration for use in tests
export { TEST_DB_CONFIG, PROD_DB_CONFIG };
