# Logging Strategy for EWA Website (Vercel Serverless)

## Overview

This document outlines our logging strategy for the EWA website deployed on Vercel's serverless platform, addressing the unique challenges of serverless environments.

## Vercel Logging Limitations

### Built-in Logging
- **Function Logs**: Available in Vercel dashboard under "Functions" tab
- **Build Logs**: Available during deployment
- **Runtime Logs**: Limited to function execution time
- **No Persistent Storage**: Logs are not stored permanently
- **Size Limits**: Function logs have size and retention limits

### Challenges
1. **No File System**: Cannot write to local files
2. **No Persistent Storage**: Logs disappear after function execution
3. **Database Dependency**: Can't log to database if database is down
4. **Cost Concerns**: Excessive logging increases costs
5. **Cold Starts**: Logging during cold starts may be lost

## Our Logging Strategy

### 1. Console-Based Logging (Primary)
```javascript
// Structured JSON logging for Vercel
console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'INFO',
    message: 'User login successful',
    userId: 'admin',
    environment: 'production'
}));
```

### 2. Size Limits & Optimization
- **Total Log Size**: Maximum 1MB per function execution
- **Buffer Size**: Keep only last 100 log entries in memory
- **Structured Format**: JSON for easy parsing and filtering
- **Environment-Aware**: Different log levels for dev/prod

### 3. Log Levels & Usage

#### ERROR (Always Logged)
- Database connection failures
- Authentication failures
- Critical system errors
- Security violations

#### WARN (Important Issues)
- Database query timeouts
- Rate limit exceeded
- Deprecated feature usage
- Performance degradation

#### INFO (Normal Operations)
- User actions (login, logout, data changes)
- API requests and responses
- Database operations
- File uploads/downloads

#### DEBUG (Development Only)
- Detailed function execution
- Variable values
- Performance metrics
- Internal state

### 4. Error Handling Strategy

#### Database Errors
```javascript
try {
    const result = await databaseOperation();
} catch (error) {
    // Log to console (always available)
    logger.error('Database operation failed', {
        operation: 'getOfficers',
        error: error.message,
        code: error.code
    });
    
    // Return graceful fallback
    return [];
}
```

#### Critical Errors
```javascript
// Always log critical errors, even if database is down
logger.critical('Database connection lost', {
    error: error.message,
    timestamp: new Date().toISOString()
});
```

### 5. Monitoring & Alerting

#### Vercel Dashboard
- Monitor function execution times
- Check error rates
- Review build logs
- Monitor function invocations

#### Health Check Endpoint
```javascript
app.get('/api/health', async (req, res) => {
    const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
            database: { status: 'connected', officersCount: 6 },
            blob: { status: 'available' }
        },
        logs: logger.getStats()
    };
    res.json(health);
});
```

### 6. Log Analysis Tools

#### Vercel CLI
```bash
# View function logs
vercel logs --follow

# View specific function logs
vercel logs api/index.js

# Filter logs by time
vercel logs --since=1h
```

#### External Logging Services (Optional)
- **Vercel Analytics**: Built-in performance monitoring
- **Sentry**: Error tracking and performance monitoring
- **LogRocket**: Session replay and error tracking
- **DataDog**: Comprehensive monitoring and logging

### 7. Best Practices

#### Do's
- ✅ Use structured JSON logging
- ✅ Include timestamps and context
- ✅ Log errors with stack traces
- ✅ Use appropriate log levels
- ✅ Keep logs concise and relevant
- ✅ Include request IDs for tracing

#### Don'ts
- ❌ Don't log sensitive data (passwords, tokens)
- ❌ Don't log excessive debug information in production
- ❌ Don't depend on database for logging
- ❌ Don't log large objects or arrays
- ❌ Don't use console.log for everything

### 8. Troubleshooting Guide

#### Common Issues

**Database Connection Errors**
```javascript
// Check DATABASE_URL environment variable
console.log('Database URL configured:', !!process.env.DATABASE_URL);

// Test connection
try {
    const officers = await getOfficers();
    console.log('Database connected, officers count:', officers.length);
} catch (error) {
    console.error('Database connection failed:', error.message);
}
```

**Blob Storage Errors**
```javascript
// Check BLOB_READ_WRITE_TOKEN
console.log('Blob token configured:', !!process.env.BLOB_READ_WRITE_TOKEN);

// Test blob functionality
try {
    const { url } = await blob.put('test.txt', 'Hello World', { access: 'public' });
    console.log('Blob storage working:', url);
} catch (error) {
    console.error('Blob storage failed:', error.message);
}
```

**Function Timeout Errors**
```javascript
// Monitor function execution time
const startTime = Date.now();
try {
    await databaseOperation();
    logger.performance('databaseOperation', Date.now() - startTime);
} catch (error) {
    logger.error('Function timeout', { duration: Date.now() - startTime });
}
```

### 9. Cost Optimization

#### Log Volume Control
- **Development**: Full debug logging
- **Production**: Error and warning only
- **Staging**: Info level and above

#### Log Retention
- **Vercel Logs**: Automatically managed by Vercel
- **External Services**: Configure retention policies
- **Database Logs**: Clean up old log entries regularly

### 10. Emergency Procedures

#### When Database is Down
1. Check Vercel function logs for connection errors
2. Verify DATABASE_URL environment variable
3. Test database connection manually
4. Check Neon dashboard for database status
5. Review recent deployments for changes

#### When Blob Storage is Down
1. Check BLOB_READ_WRITE_TOKEN environment variable
2. Verify Vercel Blob service status
3. Test blob operations manually
4. Check for rate limits or quotas

#### When Functions are Failing
1. Check Vercel dashboard for function errors
2. Review function logs for specific error messages
3. Test functions locally with same environment
4. Check for environment variable issues
5. Verify function timeout settings

## Conclusion

Our logging strategy prioritizes:
1. **Reliability**: Console logging that always works
2. **Efficiency**: Size limits and structured format
3. **Debugging**: Comprehensive error information
4. **Cost Control**: Appropriate log levels and retention
5. **Vercel Integration**: Optimized for serverless environment

This approach ensures we can troubleshoot issues effectively while maintaining performance and cost efficiency in Vercel's serverless environment. 