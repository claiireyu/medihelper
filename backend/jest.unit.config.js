import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load test environment variables
dotenv.config({ path: join(__dirname, 'test/integration/test.env') });

export default {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.js', '**/*.test.js'],
  // Exclude integration tests completely
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/coverage/',
    '<rootDir>/test/integration/'
  ],
  collectCoverageFrom: [
    'services/**/*.js',
    '!**/node_modules/**',
    '!**/coverage/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 10000,
  transform: {},
  moduleFileExtensions: ['js', 'json'],
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
  testEnvironmentOptions: {
    NODE_ENV: 'test'
  },
  // Mock all database-related modules
  moduleNameMapper: {
    '^../server$': '<rootDir>/test/mocks/server.mock.js',
    '^../config/database$': '<rootDir>/test/mocks/database.mock.js',
    '^pg$': '<rootDir>/test/mocks/database.mock.js'
  },
  // Ensure environment variables are set correctly
  setupFiles: ['<rootDir>/test/setup.js']
};
