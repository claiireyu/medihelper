# Integration Testing Suite

This directory contains comprehensive integration tests for the MediHelper medication management system. These tests verify that all components work together correctly, including database operations, API endpoints, and service interactions.

## 🏗️ Test Architecture

### Test Components
- **Database Integration Tests**: Test complete database workflows
- **API Endpoint Tests**: Test HTTP API functionality
- **Service Integration Tests**: Test service interactions
- **Authentication Tests**: Test user isolation and security

### Test Infrastructure
- **Test Database**: Isolated PostgreSQL database for testing
- **Test Server**: Express.js server with test configurations
- **Mock Services**: Simulated external dependencies
- **Test Data**: Automated test data generation

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+ with ES module support
- PostgreSQL 12+ database server
- Access to create databases and users

### 1. Database Setup

#### Create Test Database
```sql
-- Connect to PostgreSQL as superuser
psql -U postgres

-- Create test database
CREATE DATABASE medihelper_test;

-- Create test user
CREATE USER test_user WITH PASSWORD 'test_password';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE medihelper_test TO test_user;

-- Connect to test database
\c medihelper_test

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO test_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO test_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO test_user;
```

#### Environment Configuration
Copy the test environment file and update with your database credentials:

```bash
cp test.env .env.test
# Edit .env.test with your actual database credentials
```

### 2. Install Dependencies
```bash
# From the backend directory
npm install

# Install additional test dependencies if needed
npm install --save-dev supertest @types/supertest
```

### 3. Run Integration Tests

#### Run All Integration Tests
```bash
npm run test:integration
```

#### Run Specific Test Categories
```bash
# Database integration tests only
npm test -- --testNamePattern="Database Integration Tests"

# API endpoint tests only
npm test -- --testNamePattern="API Endpoint Integration Tests"

# Specific test file
npm test -- test/integration/database.integration.test.js
```

#### Run with Coverage
```bash
npm run test:integration:coverage
```

## 📋 Test Categories

### 1. Database Integration Tests (`database.integration.test.js`)

#### Medication CRUD Operations
- ✅ Create medications with various schedules
- ✅ Update medication schedules
- ✅ Delete medications and verify cleanup
- ✅ Handle refill creation and consolidation
- ✅ Bulk medication operations

#### Schedule Generation Pipeline
- ✅ End-to-end schedule generation
- ✅ Cache hit/miss scenarios
- ✅ Template creation and usage
- ✅ Historical schedule generation
- ✅ Medication change detection

#### Dose Logging and History
- ✅ Create and retrieve dose logs
- ✅ Filter dose log history
- ✅ Update and delete dose logs
- ✅ Date range filtering

#### User Isolation and Security
- ✅ Complete user data isolation
- ✅ Cross-user access prevention
- ✅ Cascade cleanup on user deletion

#### Error Handling and Edge Cases
- ✅ Database connection failures
- ✅ Invalid medication data
- ✅ Malformed schedule strings
- ✅ Cache corruption scenarios

#### Performance and Scalability
- ✅ Large medication lists (100+ medications)
- ✅ Multiple users (10+ users)
- ✅ Concurrent operations

### 2. API Endpoint Tests (`api.integration.test.js`)

#### Health Check Endpoints
- ✅ Server health status
- ✅ 404 error handling

#### Medication Endpoints
- ✅ CRUD operations via HTTP
- ✅ File upload handling
- ✅ Cross-user access prevention
- ✅ Input validation

#### Schedule Endpoints
- ✅ Schedule generation via API
- ✅ Cache warming
- ✅ Date-specific schedules
- ✅ Empty medication handling

#### Dose Log Endpoints
- ✅ Dose log creation
- ✅ History retrieval
- ✅ Filtering and pagination
- ✅ Date range queries

#### Cache Management
- ✅ Cache statistics
- ✅ User-specific cache clearing
- ✅ Cache invalidation

#### Authentication and Authorization
- ✅ Protected endpoint access
- ✅ User ID validation
- ✅ Data isolation

#### Error Handling
- ✅ Invalid data handling
- ✅ Malformed requests
- ✅ Missing fields
- ✅ Non-existent resources

#### Performance Testing
- ✅ Concurrent request handling
- ✅ Large data sets
- ✅ Response time monitoring

## 🔧 Test Configuration

### Test Database
- **Database**: `medihelper_test`
- **User**: `test_user`
- **Schema**: Automatically created from `database-setup.sql`
- **Data**: Cleaned before each test

### Test Server
- **Port**: 3002 (configurable)
- **Environment**: Test mode
- **Mock Services**: Enabled for external dependencies
- **File Uploads**: In-memory storage

### Test Data
- **Users**: Automatically created with unique IDs
- **Medications**: Various schedules and dosages
- **Dose Logs**: Time-stamped entries
- **Cleanup**: Automatic after each test

## 📊 Test Results and Coverage

### Coverage Targets
- **Database Operations**: 90%+
- **API Endpoints**: 85%+
- **Service Integration**: 80%+
- **Overall Integration**: 85%+

### Performance Benchmarks
- **Database Operations**: <100ms per operation
- **API Response Time**: <200ms per request
- **Concurrent Requests**: 10+ simultaneous
- **Large Data Sets**: 1000+ records

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Failures
```bash
# Check database status
sudo systemctl status postgresql

# Verify connection
psql -U test_user -d medihelper_test -h localhost

# Check environment variables
echo $TEST_DB_USER
echo $TEST_DB_PASSWORD
```

#### Port Conflicts
```bash
# Check if port 3002 is in use
lsof -i :3002

# Kill process if needed
kill -9 <PID>

# Or change port in test configuration
```

#### Permission Issues
```bash
# Verify database permissions
psql -U postgres -d medihelper_test -c "\du"

# Grant additional permissions if needed
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO test_user;
```

### Debug Mode
Enable verbose logging for debugging:

```bash
# Set debug environment variable
export TEST_LOG_LEVEL=debug

# Run tests with debug output
npm test -- --verbose
```

## 🔄 Continuous Integration

### GitHub Actions
Integration tests are automatically run on:
- Pull requests
- Main branch pushes
- Scheduled nightly runs

### Pre-commit Hooks
Run integration tests before committing:
```bash
npm run test:integration:quick
```

### Performance Monitoring
Track performance regressions:
```bash
npm run test:performance:baseline
npm run test:performance:compare
```

## 📚 Additional Resources

### Test Documentation
- [Jest Testing Framework](https://jestjs.io/)
- [Supertest HTTP Testing](https://github.com/visionmedia/supertest)
- [PostgreSQL Testing](https://www.postgresql.org/docs/current/testing.html)

### Related Documentation
- [API Documentation](../api/README.md)
- [Database Schema](../database/README.md)
- [Service Architecture](../services/README.md)

### Support
For questions or issues with integration tests:
1. Check this README
2. Review test logs
3. Check database connectivity
4. Verify environment configuration
5. Create an issue with test output

## 🎯 Next Steps

After running integration tests successfully:

1. **Review Coverage**: Identify areas needing additional testing
2. **Performance Analysis**: Monitor response times and throughput
3. **Security Testing**: Verify user isolation and access controls
4. **Load Testing**: Test with production-like data volumes
5. **End-to-End Testing**: Test complete user workflows

---

**Note**: Integration tests require a running PostgreSQL database and may take several minutes to complete. Ensure your test environment is properly configured before running tests.
