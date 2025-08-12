# Deployment, Observability, and Rollback Plan
## EWA Payment System Implementation Guide

### Overview
This document outlines the deployment strategy, observability implementation, and rollback procedures for the EWA payment system enhancement.

### Deployment Strategy

#### Environment Architecture

**Development Environment**
- **Purpose**: Local development and testing
- **Database**: Local PostgreSQL or Neon development instance
- **Storage**: Local file system with Vercel Blob fallback
- **URL**: `http://localhost:3000`
- **Features**: Full debugging, hot reload, development tools

**Staging Environment**
- **Purpose**: Pre-production testing and validation
- **Database**: Neon staging instance
- **Storage**: Vercel Blob staging bucket
- **URL**: `https://ewa-website-staging.vercel.app`
- **Features**: Production-like configuration, testing tools

**Production Environment**
- **Purpose**: Live production system
- **Database**: Neon production instance
- **Storage**: Vercel Blob production bucket
- **URL**: `https://ewa-website.com`
- **Features**: Full production configuration, monitoring

#### Deployment Pipeline

**CI/CD Configuration**
```yaml
# .github/workflows/deploy.yml
name: Deploy Payment System

on:
  push:
    branches: [main, feature/payment-system-enhancement]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:full
      - run: npm run security:ci
      - run: npm run test:e2e

  deploy-staging:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/feature/payment-system-enhancement'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'

  deploy-production:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

#### Environment Variables Management

**Development Environment**
```env
# .env.local
NODE_ENV=development
DATABASE_URL=postgresql://...
BLOB_READ_WRITE_TOKEN=...
SESSION_SECRET=dev-secret-key
LOG_LEVEL=debug
STRIPE_ALLOWED_DOMAINS=buy.stripe.com,donate.stripe.com
RATE_LIMIT_ENABLED=false
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

**Staging Environment**
```env
# Vercel Environment Variables
NODE_ENV=staging
DATABASE_URL=postgresql://... # Neon staging instance
BLOB_READ_WRITE_TOKEN=... # Vercel Blob staging token
SESSION_SECRET=<strong-random-secret>
LOG_LEVEL=info
STRIPE_ALLOWED_DOMAINS=buy.stripe.com,donate.stripe.com
RATE_LIMIT_ENABLED=true
CORS_ORIGINS=https://ewa-website-staging.vercel.app
```

**Production Environment**
```env
# Vercel Environment Variables
NODE_ENV=production
DATABASE_URL=postgresql://... # Neon production instance
BLOB_READ_WRITE_TOKEN=... # Vercel Blob production token
SESSION_SECRET=<strong-random-secret>
LOG_LEVEL=warn
STRIPE_ALLOWED_DOMAINS=buy.stripe.com,donate.stripe.com
RATE_LIMIT_ENABLED=true
CORS_ORIGINS=https://ewa-website.com,https://www.ewa-website.com
```

### Database Migration Strategy

#### Safe Migration Process

**Pre-Migration Checklist**
- [ ] Database backup created
- [ ] Migration tested in staging
- [ ] Rollback plan prepared
- [ ] Maintenance window scheduled
- [ ] Stakeholders notified

**Migration Execution**
```bash
# 1. Create backup
npm run db:backup

# 2. Run migration
node database/add-payment-fields.js

# 3. Verify migration
npm run db:verify

# 4. Update application code
git push origin main
```

**Post-Migration Verification**
- [ ] All payment fields present
- [ ] Audit logging working
- [ ] Indexes created
- [ ] Constraints applied
- [ ] Application functionality verified

#### Rollback Procedures

**Database Rollback**
```sql
-- Rollback payment fields (if needed)
ALTER TABLE booster_clubs DROP COLUMN IF EXISTS zelle_qr_code_path;
ALTER TABLE booster_clubs DROP COLUMN IF EXISTS stripe_donation_link;
ALTER TABLE booster_clubs DROP COLUMN IF EXISTS stripe_membership_link;
ALTER TABLE booster_clubs DROP COLUMN IF EXISTS stripe_fees_link;
ALTER TABLE booster_clubs DROP COLUMN IF EXISTS payment_instructions;
ALTER TABLE booster_clubs DROP COLUMN IF EXISTS is_payment_enabled;
ALTER TABLE booster_clubs DROP COLUMN IF EXISTS last_payment_update_by;
ALTER TABLE booster_clubs DROP COLUMN IF EXISTS last_payment_update_at;

-- Drop audit table
DROP TABLE IF EXISTS payment_audit_log;

-- Drop trigger and function
DROP TRIGGER IF EXISTS trigger_payment_audit ON booster_clubs;
DROP FUNCTION IF EXISTS log_payment_change();
```

**Application Rollback**
```bash
# Revert to previous version
git revert HEAD
git push origin main

# Or rollback to specific commit
git reset --hard <commit-hash>
git push --force origin main
```

### Observability Implementation

#### Logging Strategy

**Structured Logging with Pino**
```javascript
// utils/logger.js
const pino = require('pino');

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  redact: {
    paths: [
      'password',
      'token',
      'secret',
      'authorization',
      'cookie',
      'stripe_link',
      'payment_link'
    ],
    remove: true
  },
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err
  }
});

module.exports = logger;
```

**Request Logging Middleware**
```javascript
// middleware/request-logger.js
const pinoHttp = require('pino-http');
const { v4: uuidv4 } = require('uuid');

const requestLogger = pinoHttp({
  logger: require('../utils/logger'),
  genReqId: (req) => {
    req.id = uuidv4();
    return req.id;
  },
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 400 && res.statusCode < 500) {
      return 'warn';
    }
    if (res.statusCode >= 500 || err) {
      return 'error';
    }
    return 'info';
  },
  customSuccessMessage: (req, res) => {
    return `${req.method} ${req.url} - ${res.statusCode}`;
  },
  customErrorMessage: (req, res, err) => {
    return `${req.method} ${req.url} - ${res.statusCode} - ${err.message}`;
  }
});

module.exports = requestLogger;
```

#### Metrics and Monitoring

**Health Check Endpoint**
```javascript
// api/health.js
app.get('/api/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  };

  try {
    // Database health check
    const dbHealth = await checkDatabaseHealth();
    health.database = dbHealth;

    // Storage health check
    const storageHealth = await checkStorageHealth();
    health.storage = storageHealth;

    res.status(200).json(health);
  } catch (error) {
    health.status = 'error';
    health.error = error.message;
    res.status(503).json(health);
  }
});
```

**Performance Metrics**
```javascript
// middleware/performance-monitor.js
const performanceMonitor = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, url } = req;
    const { statusCode } = res;
    
    logger.info('Request completed', {
      method,
      url,
      statusCode,
      duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
    
    // Track slow requests
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        method,
        url,
        duration,
        threshold: 1000
      });
    }
  });
  
  next();
};
```

#### Error Tracking and Alerting

**Error Handling Middleware**
```javascript
// middleware/error-handler.js
const errorHandler = (err, req, res, next) => {
  const errorId = uuidv4();
  
  logger.error('Application error', {
    errorId,
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  // Send error to monitoring service (if configured)
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(err, {
      extra: {
        errorId,
        url: req.url,
        method: req.method
      }
    });
  }
  
  res.status(err.status || 500).json({
    error: 'Internal server error',
    errorId: process.env.NODE_ENV === 'development' ? errorId : undefined
  });
};
```

**Alerting Configuration**
```javascript
// utils/alerts.js
const sendAlert = async (level, message, context) => {
  const alert = {
    level,
    message,
    context,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  };
  
  logger[level]('Alert triggered', alert);
  
  // Send to external alerting service (if configured)
  if (process.env.ALERT_WEBHOOK_URL) {
    try {
      await fetch(process.env.ALERT_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alert)
      });
    } catch (error) {
      logger.error('Failed to send alert', { error: error.message });
    }
  }
};
```

### Deployment Monitoring

#### Pre-Deployment Checks
```javascript
// scripts/pre-deploy-check.js
const preDeployCheck = async () => {
  const checks = [
    { name: 'Database Connection', fn: checkDatabaseConnection },
    { name: 'Storage Access', fn: checkStorageAccess },
    { name: 'Environment Variables', fn: checkEnvironmentVariables },
    { name: 'Security Configuration', fn: checkSecurityConfiguration }
  ];
  
  const results = await Promise.allSettled(
    checks.map(async (check) => {
      const result = await check.fn();
      return { name: check.name, ...result };
    })
  );
  
  const failures = results.filter(r => r.status === 'rejected');
  
  if (failures.length > 0) {
    console.error('Pre-deployment checks failed:', failures);
    process.exit(1);
  }
  
  console.log('All pre-deployment checks passed');
};
```

#### Post-Deployment Verification
```javascript
// scripts/post-deploy-verify.js
const postDeployVerify = async () => {
  const verifications = [
    { name: 'Health Check', fn: verifyHealthCheck },
    { name: 'Payment API', fn: verifyPaymentAPI },
    { name: 'Database Migration', fn: verifyDatabaseMigration },
    { name: 'File Upload', fn: verifyFileUpload }
  ];
  
  const results = await Promise.allSettled(
    verifications.map(async (verification) => {
      const result = await verification.fn();
      return { name: verification.name, ...result };
    })
  );
  
  const failures = results.filter(r => r.status === 'rejected');
  
  if (failures.length > 0) {
    console.error('Post-deployment verification failed:', failures);
    // Trigger rollback
    await triggerRollback();
    process.exit(1);
  }
  
  console.log('All post-deployment verifications passed');
};
```

### Rollback Strategy

#### Automated Rollback Triggers
- **Health Check Failure**: If health check fails for 3 consecutive attempts
- **Error Rate Threshold**: If error rate exceeds 5% for 5 minutes
- **Performance Degradation**: If response time increases by 200% for 10 minutes
- **Database Issues**: If database connection fails or migration errors occur

#### Manual Rollback Procedures

**Quick Rollback (Code Only)**
```bash
# Revert to previous deployment
vercel rollback

# Or revert to specific deployment
vercel rollback <deployment-id>
```

**Full Rollback (Code + Database)**
```bash
# 1. Revert code
git revert HEAD
git push origin main

# 2. Rollback database (if needed)
node database/rollback-payment-fields.js

# 3. Verify rollback
npm run verify:rollback
```

#### Rollback Verification
```javascript
// scripts/verify-rollback.js
const verifyRollback = async () => {
  const checks = [
    { name: 'Application Status', fn: checkApplicationStatus },
    { name: 'Database Integrity', fn: checkDatabaseIntegrity },
    { name: 'Payment Functionality', fn: checkPaymentFunctionality },
    { name: 'File Access', fn: checkFileAccess }
  ];
  
  const results = await Promise.allSettled(
    checks.map(async (check) => {
      const result = await check.fn();
      return { name: check.name, ...result };
    })
  );
  
  const failures = results.filter(r => r.status === 'rejected');
  
  if (failures.length > 0) {
    console.error('Rollback verification failed:', failures);
    return false;
  }
  
  console.log('Rollback verification successful');
  return true;
};
```

### Monitoring Dashboard

#### Key Metrics to Monitor

**Performance Metrics**
- Response time (p50, p95, p99)
- Throughput (requests per second)
- Error rate (4xx, 5xx errors)
- Database query performance

**Business Metrics**
- Payment page visits
- QR code downloads
- Stripe link clicks
- Admin payment configuration changes

**Infrastructure Metrics**
- CPU and memory usage
- Database connection pool
- Storage usage
- CDN performance

**Security Metrics**
- Failed authentication attempts
- Rate limit violations
- File upload attempts
- Audit log entries

#### Dashboard Configuration
```javascript
// monitoring/dashboard-config.js
const dashboardConfig = {
  title: 'EWA Payment System Dashboard',
  refreshInterval: 30000, // 30 seconds
  panels: [
    {
      title: 'System Health',
      type: 'stat',
      targets: [
        { expr: 'up{job="ewa-payment-system"}' }
      ]
    },
    {
      title: 'Response Time',
      type: 'graph',
      targets: [
        { expr: 'histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))' }
      ]
    },
    {
      title: 'Error Rate',
      type: 'graph',
      targets: [
        { expr: 'rate(http_requests_total{status=~"5.."}[5m])' }
      ]
    },
    {
      title: 'Payment Activity',
      type: 'graph',
      targets: [
        { expr: 'rate(payment_page_visits_total[5m])' },
        { expr: 'rate(qr_code_downloads_total[5m])' }
      ]
    }
  ]
};
```

### Deployment Checklist

#### Pre-Deployment
- [ ] All tests passing
- [ ] Security scan completed
- [ ] Code review approved
- [ ] Database backup created
- [ ] Staging deployment verified
- [ ] Rollback plan prepared
- [ ] Stakeholders notified

#### During Deployment
- [ ] Deployment started
- [ ] Database migration executed
- [ ] Application deployed
- [ ] Health checks passing
- [ ] Smoke tests completed
- [ ] Performance verified

#### Post-Deployment
- [ ] All functionality verified
- [ ] Monitoring alerts configured
- [ ] Performance baseline established
- [ ] Documentation updated
- [ ] Stakeholders notified
- [ ] Rollback procedures tested

### Success Metrics

#### Deployment Success Criteria
- **Zero Downtime**: No service interruption during deployment
- **Health Check Pass**: All health checks passing within 5 minutes
- **Performance Maintained**: Response time within 10% of baseline
- **Error Rate**: Error rate below 1% for first hour
- **Functionality**: All payment features working correctly

#### Rollback Success Criteria
- **Quick Rollback**: Rollback completed within 10 minutes
- **Data Integrity**: No data loss during rollback
- **Service Restoration**: All services restored to previous state
- **User Impact**: Minimal user impact during rollback

### Conclusion

This deployment, observability, and rollback plan ensures reliable and safe deployment of the EWA payment system. The comprehensive monitoring and automated rollback procedures minimize risk and ensure quick recovery from any issues.

The plan prioritizes:
- **Safety**: Multiple verification steps and rollback procedures
- **Visibility**: Comprehensive logging and monitoring
- **Speed**: Automated deployment and rollback processes
- **Reliability**: Health checks and performance monitoring

Regular review and updates of this plan will ensure it continues to meet the needs of the payment system as it evolves.

