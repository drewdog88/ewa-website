// Legacy / unused: Jest loads `tests/helpers/test-setup.js` (see jest.config.js).
// Do not add new mocks here — merge into tests/helpers/test-setup.js instead.
//
// Test setup file
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/testdb';
process.env.BLOB_READ_WRITE_TOKEN = 'test_token';

// Global test timeout
jest.setTimeout(10000);

// Mock the database functions
jest.mock('../database/neon-functions', () => ({
  getOfficers: jest.fn().mockResolvedValue([
    { id: '1', name: 'Test Officer', position: 'President', club: 'test-club' }
  ]),
  addOfficer: jest.fn().mockResolvedValue({ success: true }),
  getUsers: jest.fn().mockResolvedValue({
    'admin': { username: 'admin', role: 'admin', password: 'ewa2025' }
  }),
  updateUser: jest.fn().mockResolvedValue({ success: true }),
  getInsurance: jest.fn().mockResolvedValue([]),
  addInsurance: jest.fn().mockResolvedValue({ success: true }),
  getDocuments: jest.fn().mockResolvedValue([]),
  addDocument: jest.fn().mockResolvedValue({ success: true }),
  deleteDocument: jest.fn().mockResolvedValue({ success: true })
}));

// Mock Vercel Blob
jest.mock('@vercel/blob', () => ({
  put: jest.fn().mockResolvedValue({ url: 'https://test.blob.url' }),
  del: jest.fn().mockResolvedValue({ success: true })
}));

// Mock the backup manager
jest.mock('../backup/backup-manager', () => ({
  BackupManager: jest.fn().mockImplementation(() => ({
    startScheduledBackups: jest.fn(),
    log: jest.fn()
  }))
}));

// Suppress console logs during tests unless there's an error
const originalLog = console.log;
const originalError = console.error;

beforeAll(() => {
  console.log = jest.fn();
  console.error = originalError; // Keep error logging
});

afterAll(() => {
  console.log = originalLog;
});
