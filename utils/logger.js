// Vercel-friendly logging utility for EWA Website
// Optimized for serverless environment with size limits

class VercelLogger {
    constructor() {
        this.maxLogSize = 1024 * 1024; // 1MB total limit
        this.currentLogSize = 0;
        this.logBuffer = [];
        this.maxBufferSize = 100; // Keep only last 100 log entries in memory
    }

    formatMessage(level, message, data = {}) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            ...data
        };

        // Calculate approximate size
        const logString = JSON.stringify(logEntry);
        this.currentLogSize += logString.length;

        // Add to buffer
        this.logBuffer.push(logEntry);
        
        // Keep buffer size manageable
        if (this.logBuffer.length > this.maxBufferSize) {
            const removed = this.logBuffer.shift();
            this.currentLogSize -= JSON.stringify(removed).length;
        }

        return logEntry;
    }

    // Console logging with structured format for Vercel
    logToConsole(level, message, data = {}) {
        const logEntry = this.formatMessage(level, message, data);
        
        // Use structured logging for better Vercel integration
        const consoleData = {
            timestamp: logEntry.timestamp,
            level: logEntry.level,
            message: logEntry.message,
            ...data
        };

        switch (level) {
            case 'INFO':
                console.log(JSON.stringify(consoleData));
                break;
            case 'WARN':
                console.warn(JSON.stringify(consoleData));
                break;
            case 'ERROR':
                console.error(JSON.stringify(consoleData));
                break;
            case 'DEBUG':
                if (process.env.NODE_ENV === 'development') {
                    console.log(JSON.stringify(consoleData));
                }
                break;
        }
    }

    info(message, data = {}) {
        this.logToConsole('INFO', message, data);
    }

    warn(message, data = {}) {
        this.logToConsole('WARN', message, data);
    }

    error(message, data = {}) {
        this.logToConsole('ERROR', message, data);
    }

    debug(message, data = {}) {
        this.logToConsole('DEBUG', message, data);
    }

    // Specialized logging methods for different operations
    database(operation, details = {}) {
        this.info(`Database operation: ${operation}`, {
            operation,
            ...details,
            environment: process.env.NODE_ENV || 'development'
        });
    }

    api(operation, details = {}) {
        this.info(`API operation: ${operation}`, {
            operation,
            ...details,
            environment: process.env.NODE_ENV || 'development'
        });
    }

    auth(operation, details = {}) {
        this.info(`Authentication: ${operation}`, {
            operation,
            ...details,
            environment: process.env.NODE_ENV || 'development'
        });
    }

    file(operation, details = {}) {
        this.info(`File operation: ${operation}`, {
            operation,
            ...details,
            environment: process.env.NODE_ENV || 'development'
        });
    }

    // Performance logging
    performance(operation, duration, details = {}) {
        this.info(`Performance: ${operation} took ${duration}ms`, {
            operation,
            duration,
            ...details,
            environment: process.env.NODE_ENV || 'development'
        });
    }

    // Critical error logging (always logged, even in production)
    critical(message, data = {}) {
        this.error(`CRITICAL: ${message}`, {
            ...data,
            environment: process.env.NODE_ENV || 'development',
            critical: true
        });
    }

    // Get current log statistics
    getStats() {
        return {
            currentSize: this.currentLogSize,
            bufferSize: this.logBuffer.length,
            maxSize: this.maxLogSize,
            maxBufferSize: this.maxBufferSize
        };
    }

    // Get recent logs (for debugging)
    getRecentLogs(limit = 10) {
        return this.logBuffer.slice(-limit);
    }
}

// Create singleton instance
const logger = new VercelLogger();

module.exports = logger; 