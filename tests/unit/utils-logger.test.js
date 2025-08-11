// const { mockUtils } = require('../helpers/test-setup'); // Unused - can be removed in future cleanup

// Mock console methods
const originalConsole = { ...console };
const mockConsole = {
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Import the logger (singleton instance)
const logger = require('../../utils/logger');

describe('VercelLogger Unit Tests', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    console.log = mockConsole.log;
    console.warn = mockConsole.warn;
    console.error = mockConsole.error;
    process.env = { ...originalEnv };
    
    // Reset logger state
    logger.logBuffer = [];
    logger.currentLogSize = 0;
  });

  afterEach(() => {
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    process.env = originalEnv;
  });

  describe('Constructor', () => {
    test('should initialize with correct default values', () => {
      expect(logger.maxLogSize).toBe(1024 * 1024); // 1MB
      expect(logger.maxBufferSize).toBe(100);
    });
  });

  describe('formatMessage', () => {
    test('should format message with timestamp and level', () => {
      const result = logger.formatMessage('INFO', 'Test message');

      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('level', 'INFO');
      expect(result).toHaveProperty('message', 'Test message');
      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    test('should include additional data in formatted message', () => {
      const data = { userId: '123', operation: 'login' };
      const result = logger.formatMessage('INFO', 'Test message', data);

      expect(result).toHaveProperty('userId', '123');
      expect(result).toHaveProperty('operation', 'login');
    });

    test('should track log buffer size', () => {
      logger.formatMessage('INFO', 'Test message');
      
      expect(logger.logBuffer).toHaveLength(1);
      expect(logger.currentLogSize).toBeGreaterThan(0);
    });

    test('should limit buffer size to maxBufferSize', () => {
      // Add more than maxBufferSize messages
      for (let i = 0; i < 110; i++) {
        logger.formatMessage('INFO', `Message ${i}`);
      }

      expect(logger.logBuffer).toHaveLength(100);
      expect(logger.logBuffer[0].message).toBe('Message 10'); // First message should be removed
    });
  });

  describe('logToConsole', () => {
    test('should call console.log for INFO level', () => {
      logger.logToConsole('INFO', 'Test info message');

      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('"level":"INFO"')
      );
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('"message":"Test info message"')
      );
    });

    test('should call console.warn for WARN level', () => {
      logger.logToConsole('WARN', 'Test warning message');

      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('"level":"WARN"')
      );
    });

    test('should call console.error for ERROR level', () => {
      logger.logToConsole('ERROR', 'Test error message');

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('"level":"ERROR"')
      );
    });

    test('should call console.log for DEBUG level in development', () => {
      process.env.NODE_ENV = 'development';
      logger.logToConsole('DEBUG', 'Test debug message');

      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('"level":"DEBUG"')
      );
    });

    test('should not call console.log for DEBUG level in production', () => {
      process.env.NODE_ENV = 'production';
      logger.logToConsole('DEBUG', 'Test debug message');

      expect(mockConsole.log).not.toHaveBeenCalled();
    });

    test('should include structured data in console output', () => {
      const data = { userId: '123', operation: 'login' };
      logger.logToConsole('INFO', 'Test message', data);

      const logCall = mockConsole.log.mock.calls[0][0];
      const logData = JSON.parse(logCall);

      expect(logData).toHaveProperty('userId', '123');
      expect(logData).toHaveProperty('operation', 'login');
    });
  });

  describe('Convenience Methods', () => {
    test('info should call logToConsole with INFO level', () => {
      logger.info('Test info message');

      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('"level":"INFO"')
      );
    });

    test('warn should call logToConsole with WARN level', () => {
      logger.warn('Test warning message');

      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('"level":"WARN"')
      );
    });

    test('error should call logToConsole with ERROR level', () => {
      logger.error('Test error message');

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('"level":"ERROR"')
      );
    });

    test('debug should call logToConsole with DEBUG level', () => {
      process.env.NODE_ENV = 'development';
      logger.debug('Test debug message');

      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('"level":"DEBUG"')
      );
    });
  });

  describe('Specialized Logging Methods', () => {
    test('database should log with database context', () => {
      const details = { table: 'users', operation: 'SELECT' };
      logger.database('getUsers', details);

      const logCall = mockConsole.log.mock.calls[0][0];
      const logData = JSON.parse(logCall);

      expect(logData.message).toBe('Database operation: getUsers');
      expect(logData).toHaveProperty('table', 'users');
      expect(logData).toHaveProperty('operation', 'SELECT');
      expect(logData).toHaveProperty('environment');
    });

    test('api should log with API context', () => {
      const details = { endpoint: '/api/login', method: 'POST' };
      logger.api('login', details);

      const logCall = mockConsole.log.mock.calls[0][0];
      const logData = JSON.parse(logCall);

      expect(logData.message).toBe('API operation: login');
      expect(logData).toHaveProperty('operation', 'login');
      expect(logData).toHaveProperty('endpoint', '/api/login');
      expect(logData).toHaveProperty('method', 'POST');
    });

    test('auth should log with authentication context', () => {
      const details = { username: 'admin', success: true };
      logger.auth('login', details);

      const logCall = mockConsole.log.mock.calls[0][0];
      const logData = JSON.parse(logCall);

      expect(logData.message).toBe('Authentication: login');
      expect(logData).toHaveProperty('operation', 'login');
      expect(logData).toHaveProperty('username', 'admin');
      expect(logData).toHaveProperty('success', true);
    });

    test('file should log with file operation context', () => {
      const details = { filename: 'test.pdf', size: 1024 };
      logger.file('upload', details);

      const logCall = mockConsole.log.mock.calls[0][0];
      const logData = JSON.parse(logCall);

      expect(logData.message).toBe('File operation: upload');
      expect(logData).toHaveProperty('operation', 'upload');
      expect(logData).toHaveProperty('filename', 'test.pdf');
      expect(logData).toHaveProperty('size', 1024);
    });

    test('performance should log with performance metrics', () => {
      const details = { endpoint: '/api/officers' };
      logger.performance('getOfficers', 150, details);

      const logCall = mockConsole.log.mock.calls[0][0];
      const logData = JSON.parse(logCall);

      expect(logData.message).toBe('Performance: getOfficers took 150ms');
      expect(logData).toHaveProperty('operation', 'getOfficers');
      expect(logData).toHaveProperty('duration', 150);
      expect(logData).toHaveProperty('endpoint', '/api/officers');
    });

    test('critical should log with critical level', () => {
      const data = { system: 'database', error: 'Connection lost' };
      logger.critical('System failure', data);

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('"level":"ERROR"')
      );
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('"message":"CRITICAL: System failure"')
      );
    });
  });

  describe('Statistics and Monitoring', () => {
    test('getStats should return current statistics', () => {
      logger.formatMessage('INFO', 'Test message 1');
      logger.formatMessage('ERROR', 'Test message 2');

      const stats = logger.getStats();

      expect(stats).toHaveProperty('currentSize');
      expect(stats).toHaveProperty('bufferSize', 2);
      expect(stats).toHaveProperty('maxSize', 1024 * 1024);
      expect(stats).toHaveProperty('maxBufferSize', 100);
    });

    test('getRecentLogs should return recent log entries', () => {
      logger.formatMessage('INFO', 'Message 1');
      logger.formatMessage('WARN', 'Message 2');
      logger.formatMessage('ERROR', 'Message 3');

      const recentLogs = logger.getRecentLogs(2);

      expect(recentLogs).toHaveLength(2);
      expect(recentLogs[0].message).toBe('Message 2');
      expect(recentLogs[1].message).toBe('Message 3');
    });

    test('getRecentLogs should respect limit parameter', () => {
      for (let i = 0; i < 5; i++) {
        logger.formatMessage('INFO', `Message ${i}`);
      }

      const recentLogs = logger.getRecentLogs(3);

      expect(recentLogs).toHaveLength(3);
      expect(recentLogs[0].message).toBe('Message 2');
      expect(recentLogs[1].message).toBe('Message 3');
      expect(recentLogs[2].message).toBe('Message 4');
    });

    test('getRecentLogs should return all logs if limit exceeds buffer size', () => {
      for (let i = 0; i < 3; i++) {
        logger.formatMessage('INFO', `Message ${i}`);
      }

      const recentLogs = logger.getRecentLogs(10);

      expect(recentLogs).toHaveLength(3);
    });
  });

  describe('Memory Management', () => {
    test('should maintain log size within limits', () => {
      const largeMessage = 'x'.repeat(1000);
      
      // Add logs until we approach the size limit
      for (let i = 0; i < 1000; i++) {
        logger.formatMessage('INFO', largeMessage);
        
        if (logger.currentLogSize > logger.maxLogSize) {
          break;
        }
      }

      expect(logger.currentLogSize).toBeLessThanOrEqual(logger.maxLogSize);
    });

    test('should handle very large individual messages', () => {
      const hugeMessage = 'x'.repeat(1024 * 1024 + 1000); // Larger than maxLogSize
      
      expect(() => {
        logger.formatMessage('INFO', hugeMessage);
      }).not.toThrow();
    });
  });

  describe('Environment Handling', () => {
    test('should include environment in specialized logs', () => {
      process.env.NODE_ENV = 'production';
      logger.database('test');

      const logCall = mockConsole.log.mock.calls[0][0];
      const logData = JSON.parse(logCall);

      expect(logData).toHaveProperty('environment', 'production');
    });

    test('should default to development environment', () => {
      delete process.env.NODE_ENV;
      logger.database('test');

      const logCall = mockConsole.log.mock.calls[0][0];
      const logData = JSON.parse(logCall);

      expect(logData).toHaveProperty('environment', 'development');
    });
  });
});
