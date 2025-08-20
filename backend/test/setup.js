import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load test environment variables
dotenv.config({ path: join(__dirname, 'integration/test.env') });

// Set NODE_ENV to test
process.env.NODE_ENV = 'test';

// Verify test database configuration

// Ensure we're using test database
if (process.env.TEST_DB_NAME === process.env.DB_NAME) {
  console.warn('⚠️  WARNING: Test and production databases are the same!');
  console.warn('   This could cause data corruption in production.');
}

if (process.env.NODE_ENV === 'test') {
  // Only show logs if explicitly enabled
  if (process.env.TEST_VERBOSE === 'true') {
    // Enable verbose logging if needed
    console.log('Test verbose logging enabled');
  }
}

// Ensure database connections are mocked for unit tests
if (process.env.NODE_ENV === 'test') {
  // Mock any global database connections
  global.mockDatabaseConnections = true;
  
  // Override any environment variables that might cause database connections
  process.env.DB_NAME = process.env.TEST_DB_NAME || 'medihelper-tests';
  process.env.DB_HOST = process.env.TEST_DB_HOST || 'localhost';
  process.env.DB_PORT = process.env.TEST_DB_PORT || '3000';
}
