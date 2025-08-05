# EWA Website

A comprehensive website for the Eastlake Wolves Association (EWA) with admin panel, volunteer management, and file storage capabilities.

## 🚀 Features

- **Static website** with Node.js backend
- **Admin panel** for content management
- **Dynamic team member loading** with Neon PostgreSQL database
- **Session management** with secure authentication
- **Vercel Blob** file storage for documents and images
- **Volunteer interest submission** and management
- **Insurance and 1099 form** management
- **Document upload and management** with blob storage
- **Analytics and reporting** capabilities
- **Comprehensive logging** and error handling
- **Database backup and restore** functionality

## 🛠 Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express
- **Database**: Neon PostgreSQL (serverless)
- **File Storage**: Vercel Blob
- **Deployment**: Vercel (serverless functions)
- **Logging**: Structured JSON logging with size limits
- **Environment**: Development and production configurations

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Vercel account
- Neon PostgreSQL database
- Vercel Blob storage

## 🚀 Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/drewdog88/ewa-website.git
   cd ewa-website
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_UWH6nTy2XcA4BS7u_OS0oZHtQ56g3BjXFIWAqNSlxDPJVHV
   DATABASE_URL=postgres://neondb_owner:npg_Lj2UaqCig6HI@ep-jolly-silence-afmn89zf-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require
   ```

4. **Initialize database**
   ```bash
   node database/migrate-neon.js
   ```

5. **Start the development server**
   ```bash
   npm start
   ```

6. **Access the application**
   - Website: http://localhost:3000
   - Admin Panel: http://localhost:3000/admin/login.html
   - Health Check: http://localhost:3000/api/health

### Testing

```bash
# Test database connection
node -e "require('./database/neon-functions').getOfficers().then(officers => console.log('Database connected:', officers.length, 'officers')).catch(console.error)"

# Test API endpoints
curl http://localhost:3000/api/health
curl http://localhost:3000/api/officers
```

## 🌐 Deployment

### Vercel Deployment

1. **Connect to Vercel**
   - Link your GitHub repository to Vercel
   - Configure environment variables in Vercel dashboard

2. **Set Environment Variables**
   In Vercel dashboard, add:
   - `BLOB_READ_WRITE_TOKEN` = `vercel_blob_rw_UWH6nTy2XcA4BS7u_OS0oZHtQ56g3BjXFIWAqNSlxDPJVHV`
   - `DATABASE_URL` = `postgres://neondb_owner:npg_Lj2UaqCig6HI@ep-jolly-silence-afmn89zf-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require`

3. **Deploy**
   - Vercel automatically detects changes
   - Build and deploy with environment variables
   - Verify Neon database and Blob functionality

## 📊 API Endpoints

### Public Endpoints
- `GET /` - Main website
- `GET /team.html` - Team members page
- `GET /volunteers.html` - Volunteer signup page
- `GET /api/health` - Health check
- `GET /api/officers` - Get all officers
- `GET /api/officers/:club` - Get officers by club

### Admin Endpoints
- `POST /api/login` - Admin authentication
- `GET /api/users` - Get all users (admin only)
- `POST /api/users` - Create new user (admin only)
- `GET /api/volunteers` - Get all volunteers (admin only)
- `POST /api/volunteers` - Submit volunteer interest
- `GET /api/insurance` - Get insurance forms (admin only)
- `POST /api/insurance` - Submit insurance form
- `GET /api/1099` - Get 1099 forms (admin only)
- `POST /api/1099` - Submit 1099 form

### File Management
- `POST /api/upload` - Upload files to Vercel Blob
- `GET /api/documents` - Get all documents (admin only)
- `GET /api/documents/:boosterClub` - Get documents by club
- `DELETE /api/documents/:documentId` - Delete document

## 🔧 Database Management

### Backup and Restore
```bash
# Create backup
node database/backup.js

# Restore from backup
node database/backup.js --restore backup-2024-01-01.json

# List backups
node database/backup.js --list
```

### Migration
```bash
# Run database migration
node database/migrate-neon.js
```

## 📝 Logging and Monitoring

### Log Levels
- **ERROR**: Critical errors, always logged
- **WARN**: Important issues, warnings
- **INFO**: Normal operations, user actions
- **DEBUG**: Detailed debugging (development only)

### Monitoring
- **Vercel Dashboard**: Function logs and performance
- **Health Check**: `/api/health` endpoint
- **Vercel CLI**: `vercel logs --follow`

### Log Analysis
```bash
# View real-time logs
vercel logs --follow

# View specific function logs
vercel logs api/index.js

# Filter logs by time
vercel logs --since=1h
```

## 🔐 Security

### Authentication
- **Admin**: `admin` / `ewa2025`
- **Orchestra Booster**: `orchestra_booster` / `ewa_orchestra_2025`

### Environment Variables
- All sensitive data stored in environment variables
- `.env.local` file ignored by Git
- Production variables set in Vercel dashboard

## 📁 Project Structure

```
ewa_website/
├── admin/                 # Admin panel files
├── api/                   # Vercel serverless functions
├── assets/               # Static assets (images, etc.)
├── data/                 # JSON data files (fallback)
├── database/             # Database utilities
│   ├── backup.js         # Backup and restore functionality
│   ├── migrate-neon.js   # Database migration script
│   ├── neon-functions.js # Database operations
│   └── schema.sql        # Database schema
├── docs/                 # Documentation
│   ├── BACKUP_RESTORE.md # Backup procedures
│   └── LOGGING_STRATEGY.md # Logging documentation
├── utils/                # Utility functions
│   └── logger.js         # Vercel-friendly logging
├── server.js             # Main server file
├── package.json          # Dependencies
└── vercel.json           # Vercel configuration
```

## 🆘 Troubleshooting

### Common Issues

**Database Connection Errors**
- Check `DATABASE_URL` environment variable
- Verify Neon database is running
- Test connection with health check endpoint

**Blob Storage Errors**
- Check `BLOB_READ_WRITE_TOKEN` environment variable
- Verify Vercel Blob service status
- Check for rate limits or quotas

**Function Errors**
- Check Vercel function logs
- Verify environment variables
- Test functions locally

### Emergency Procedures
1. Check Vercel dashboard for function errors
2. Review function logs for specific error messages
3. Test functions locally with same environment
4. Check environment variable configuration
5. Verify database and blob service status

## 📈 Recent Updates

- **Neon Migration**: Migrated from Redis to Neon PostgreSQL for better reliability and backup capabilities
- **Comprehensive Logging**: Implemented Vercel-friendly logging with size limits and structured format
- **Error Handling**: Enhanced error handling with user-friendly messages and detailed logging
- **Database Backup**: Added automated backup and restore functionality
- **Health Monitoring**: Enhanced health check endpoint with detailed service status
- **Documentation**: Comprehensive documentation for deployment, logging, and troubleshooting
- **API Structure**: Organized serverless functions in `/api` directory
- **Security**: Improved authentication and environment variable management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support and questions:
- Check the documentation in `/docs`
- Review the troubleshooting guide
- Check Vercel dashboard for logs
- Contact the development team 