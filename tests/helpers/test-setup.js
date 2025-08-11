// const path = require('path'); // Unused - can be removed in future cleanup

// Test configuration
const TEST_CONFIG = {
  BASE_URL: process.env.TEST_BASE_URL || 'http://localhost:3000',
  DATABASE_URL: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/test_db',
  TIMEOUT: 10000
};

// Mock utilities
const mockUtils = {
  mockVercelBlob: () => ({
    put: jest.fn().mockResolvedValue({ url: 'https://blob.url/test-file.json' }),
    get: jest.fn().mockResolvedValue({ url: 'https://blob.url/test-file.json' }),
    del: jest.fn().mockResolvedValue({ success: true })
  }),

  mockDatabase: () => ({
    query: jest.fn(),
    connect: jest.fn(),
    end: jest.fn()
  }),

  mockNeonFunctions: () => ({
    getOfficers: jest.fn(),
    addOfficer: jest.fn(),
    updateOfficer: jest.fn(),
    deleteOfficer: jest.fn(),
    getVolunteers: jest.fn(),
    addVolunteer: jest.fn(),
    getForm1099: jest.fn(),
    addForm1099: jest.fn(),
    updateForm1099: jest.fn(),
    deleteForm1099: jest.fn(),
    getUsers: jest.fn(),
    updateUser: jest.fn(),
    getInsurance: jest.fn(),
    addInsurance: jest.fn(),
    getDocuments: jest.fn(),
    addDocument: jest.fn(),
    deleteDocument: jest.fn()
  }),

  mockSecurityScanner: () => ({
    runFullScan: jest.fn(),
    generateReport: jest.fn(),
    getSecurityScore: jest.fn(),
    runTestCoverage: jest.fn()
  }),

  mockFileSystem: () => ({
    existsSync: jest.fn(),
    readFileSync: jest.fn(),
    writeFileSync: jest.fn(),
    promises: {
      access: jest.fn(),
      readFile: jest.fn(),
      writeFile: jest.fn()
    }
  }),

  mockChildProcess: () => ({
    execSync: jest.fn()
  })
};

// Database utilities for integration tests
const dbUtils = {
  async resetDatabase() {
    // This would reset the test database
    // For now, just log that it's being called
    console.log('Resetting test database...');
  },

  async seedTestData() {
    // This would seed the test database with known data
    console.log('Seeding test data...');
  },

  async cleanupTestData() {
    // This would clean up test data
    console.log('Cleaning up test data...');
  }
};

// Test data factories
const createTestData = {
  officers: (count = 1) => Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Test Officer ${i + 1}`,
    position: 'Test Position',
    email: `officer${i + 1}@test.com`,
    phone: '555-123-4567',
    booster_club: 'Test Club',
    created_at: new Date().toISOString()
  })),

  volunteers: (count = 1) => Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Test Volunteer ${i + 1}`,
    email: `volunteer${i + 1}@test.com`,
    phone: '555-987-6543',
    booster_club: 'Test Club',
    created_at: new Date().toISOString()
  })),

  form1099: (count = 1) => Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    recipient_name: `Test Recipient ${i + 1}`,
    recipient_tin: `123-45-${String(6789 + i).padStart(4, '0')}`,
    amount: 1000.00 + (i * 100),
    description: `Test payment ${i + 1}`,
    booster_club: 'Test Club',
    tax_year: 2024,
    w9_filename: `w9-test-${i + 1}.pdf`,
    status: 'pending',
    submitted_by: 'test-admin',
    created_at: new Date().toISOString()
  })),

  users: () => ({
    admin: {
      username: 'admin',
      password: 'password123',
      role: 'admin',
      club: 'ewa',
      clubName: 'EWA',
      isLocked: false,
      isFirstLogin: false
    },
    testuser: {
      username: 'testuser',
      password: 'password123',
      role: 'user',
      club: 'test',
      clubName: 'Test Club',
      isLocked: false,
      isFirstLogin: false
    }
  })
};

// Environment setup for tests
const setupTestEnvironment = () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = TEST_CONFIG.DATABASE_URL;
  process.env.BLOB_READ_WRITE_TOKEN = 'test-token';
  
  // Mock console methods to reduce noise in tests
  const originalConsole = { ...console };
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
  
  return () => {
    // Restore console methods
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
  };
};

// Cleanup function for tests
const cleanupTestEnvironment = () => {
  // Clear all mocks
  jest.clearAllMocks();
  
  // Reset environment variables
  delete process.env.NODE_ENV;
  delete process.env.DATABASE_URL;
  delete process.env.BLOB_READ_WRITE_TOKEN;
};

module.exports = {
  TEST_CONFIG,
  mockUtils,
  dbUtils,
  createTestData,
  setupTestEnvironment,
  cleanupTestEnvironment
};
