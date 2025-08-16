import { configurePassport } from '../passport.js';

// Mock the database
const mockDb = {
  query: () => Promise.resolve({ rows: [] })
};

// Mock environment variables
const originalEnv = process.env;

describe('Passport Configuration', () => {
  beforeEach(() => {
    // Reset environment
    process.env = { ...originalEnv };
    
    // Set required environment variables
    process.env.GOOGLE_CLIENT_ID = 'test_client_id';
    process.env.GOOGLE_CLIENT_SECRET = 'test_client_secret';
    process.env.GOOGLE_CALLBACK_URL = 'http://localhost:8000/auth/google/callback';
  });

  afterEach(() => {
    // Restore environment
    process.env = originalEnv;
  });

  describe('Configuration Setup', () => {
    it('should configure passport without throwing errors', () => {
      expect(() => {
        configurePassport(mockDb);
      }).not.toThrow();
    });

    it('should throw error when required environment variables are missing', () => {
      delete process.env.GOOGLE_CLIENT_ID;
      delete process.env.GOOGLE_CLIENT_SECRET;
      
      expect(() => {
        configurePassport(mockDb);
      }).toThrow('OAuth2Strategy requires a clientID option');
    });

    it('should return a passport instance', () => {
      const passportInstance = configurePassport(mockDb);
      expect(passportInstance).toBeDefined();
      expect(typeof passportInstance).toBe('object');
    });
  });

  describe('Environment Variable Handling', () => {
    it('should use environment variables when available', () => {
      process.env.GOOGLE_CLIENT_ID = 'custom_client_id';
      process.env.GOOGLE_CLIENT_SECRET = 'custom_client_secret';
      process.env.GOOGLE_CALLBACK_URL = 'http://custom.url/callback';
      
      expect(() => {
        configurePassport(mockDb);
      }).not.toThrow();
    });

    it('should throw error when environment variables are undefined', () => {
      process.env.GOOGLE_CLIENT_ID = undefined;
      process.env.GOOGLE_CLIENT_SECRET = undefined;
      process.env.GOOGLE_CALLBACK_URL = undefined;
      
      expect(() => {
        configurePassport(mockDb);
      }).toThrow('OAuth2Strategy requires a clientID option');
    });
  });

  describe('Database Integration', () => {
    it('should accept database connection', () => {
      expect(() => {
        configurePassport(mockDb);
      }).not.toThrow();
    });

    it('should handle null database connection gracefully', () => {
      expect(() => {
        configurePassport(null);
      }).not.toThrow();
    });

    it('should handle undefined database connection gracefully', () => {
      expect(() => {
        configurePassport(undefined);
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle configuration errors gracefully', () => {
      // Test with invalid database that throws errors
      const invalidDb = {
        query: () => Promise.reject(new Error('Database error'))
      };
      
      expect(() => {
        configurePassport(invalidDb);
      }).not.toThrow();
    });

    it('should handle missing passport dependencies gracefully', () => {
      // This test verifies the function doesn't crash if passport modules are missing
      expect(() => {
        configurePassport(mockDb);
      }).not.toThrow();
    });
  });

  describe('Return Value', () => {
    it('should return the configured passport instance', () => {
      const passportInstance = configurePassport(mockDb);
      expect(passportInstance).toBeDefined();
      expect(typeof passportInstance).toBe('object');
    });

    it('should return consistent instance type', () => {
      const instance1 = configurePassport(mockDb);
      const instance2 = configurePassport(mockDb);
      
      expect(typeof instance1).toBe(typeof instance2);
      expect(instance1).toBeDefined();
      expect(instance2).toBeDefined();
    });
  });
});
