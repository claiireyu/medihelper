import pg from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test database configuration
const TEST_DB_CONFIG = {
  user: process.env.TEST_DB_USER || 'postgres',
  host: process.env.TEST_DB_HOST || 'localhost',
  database: process.env.TEST_DB_NAME || 'medihelper',
  password: process.env.TEST_DB_PASSWORD || 'o6o82017',
  port: process.env.TEST_DB_PORT || 3000,
};

// Production database configuration (for comparison)
const PROD_DB_CONFIG = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'medihelper',
  password: process.env.DB_PASSWORD || 'password',
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
      console.log('✅ Test database connection closed');
    }
    if (prodDb) {
      await prodDb.end();
      console.log('✅ Production database connection closed');
    }
  } catch (error) {
    console.error('❌ Error closing database connections:', error.message);
  }
}

// Initialize test database schema
export async function initializeTestSchema() {
  try {
    // Read the database setup SQL
    const setupSQL = fs.readFileSync(join(__dirname, '../../database-setup.sql'), 'utf8');
    
    // Execute setup SQL on test database
    await testDb.query(setupSQL);
    
    console.log('✅ Test database schema initialized');
  } catch (error) {
    console.error('❌ Failed to initialize test schema:', error.message);
    throw error;
  }
}

// Clean test database
export async function cleanTestDatabase() {
  try {
    // Clear all data but keep schema
    await testDb.query('DELETE FROM dose_logs');
    await testDb.query('DELETE FROM health_logs');
    await testDb.query('DELETE FROM medications');
    await testDb.query('DELETE FROM users');
    
    // Reset sequences
    await testDb.query('ALTER SEQUENCE users_id_seq RESTART WITH 1');
    await testDb.query('ALTER SEQUENCE medications_id_seq RESTART WITH 1');
    await testDb.query('ALTER SEQUENCE dose_logs_id_seq RESTART WITH 1');
    await testDb.query('ALTER SEQUENCE health_logs_id_seq RESTART WITH 1');
    
    console.log('✅ Test database cleaned');
  } catch (error) {
    console.error('❌ Failed to clean test database:', error.message);
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
    
    console.log('✅ Test user created:', result.rows[0].id);
    return result.rows[0];
  } catch (error) {
    console.error('❌ Failed to create test user:', error.message);
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
    
    console.log('✅ Test medication created:', result.rows[0].id);
    return result.rows[0];
  } catch (error) {
    console.error('❌ Failed to create test medication:', error.message);
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
    
    console.log('✅ Test dose log created:', result.rows[0].id);
    return result.rows[0];
  } catch (error) {
    console.error('❌ Failed to create test dose log:', error.message);
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
