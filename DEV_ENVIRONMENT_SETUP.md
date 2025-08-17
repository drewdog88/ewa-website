# Development Environment Setup Guide

## 🚨 CRITICAL SAFETY MEASURES

### Database Safety
- **PRODUCTION DB**: `ep-jolly-silence-afmn89zf-pooler.c-2.us-west-2.aws.neon.tech`
- **DEV DB**: `ep-floral-meadow-ad5lu8xi-pooler.c-2.us-east-1.aws.neon.tech`
- **NEVER** run database migrations or changes against production
- **ALWAYS** verify you're connected to dev database before any operations

### Environment File Strategy
- **Production**: `.env.local` (current production settings)
- **Development**: `.env.dev` (new development settings)
- **Backup**: `.env.local.backup` (safety backup)

## 📋 Setup Steps

### Step 1: Create Environment Backups
```bash
# Backup current production environment
cp .env.local .env.local.backup
cp .env.local .env.production
```

### Step 2: Create Development Environment
```bash
# Create development environment file
cp .env.local .env.dev
```

### Step 3: Update Development Environment
Replace the DATABASE_URL in `.env.dev` with the development database URL.

### Step 4: Environment Switching Scripts
Create scripts to safely switch between environments.

## 🔍 Verification Process

### Before Any Database Operation:
1. Check current environment file
2. Verify database connection string
3. Run test query to confirm database
4. Check database name in connection

### Environment Indicators:
- **Production**: `ep-jolly-silence-afmn89zf`
- **Development**: `ep-floral-meadow-ad5lu8xi`

## 🛡️ Safety Checklist

- [ ] Backup created for production environment
- [ ] Development environment file created
- [ ] Database URLs clearly different
- [ ] Switching scripts created
- [ ] Verification process documented
- [ ] Team notified of environment changes
- [ ] Old production blob storage backed up locally
- [ ] Old production blob storage cleaned up

## 📝 Usage Instructions

### To Switch to Development:
```bash
npm run dev-env
```

### To Switch to Production:
```bash
npm run prod-env
```

### To Verify Current Environment:
```bash
npm run check-env
```

## 🧹 Blob Storage Backup (Manual Cleanup)

### Backup Old Production Blob Storage
```bash
npm run backup-prod-blob
```
This will download all files from the old production blob storage to `/devbackup` directory.

**Note**: Blob storage cleanup will be handled manually by the development team.
