import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load test environment variables
dotenv.config({ path: join(__dirname, 'test/integration/test.env') });

export default {
  testEnvironment: 'node',
  testMatch: ['**/test/integration/**/*.test.js'],
  collectCoverageFrom: [
    'services/**/*.js',
    '!**/node_modules/**',
    '!**/coverage/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 30000, // Longer timeout for integration tests
  transform: {},
  moduleFileExtensions: ['js', 'json'],
  setupFilesAfterEnv: ['<rootDir>/test/integration/setup.js'],
  testEnvironmentOptions: {
    NODE_ENV: 'test'
  },
  // Don't mock database connections for integration tests
  moduleNameMapper: {},
  // Ensure environment variables are set correctly
  setupFiles: ['<rootDir>/test/integration/setup.js']
};
