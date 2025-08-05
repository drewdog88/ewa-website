# EWA Website

Eastlake Wolfpack Association website with admin panel and dynamic content management.

<!-- Last deployment: 2025-01-05 12:45 UTC -->

## Features

- Static website with Node.js backend
- Admin panel for content management
- Dynamic team member loading with Redis storage
- Session management
- Vercel Blob file storage
- Vercel deployment ready

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express
- **Database**: Redis (Vercel Redis)
- **File Storage**: Vercel Blob
- **Deployment**: Vercel

## Environment Variables

### Local Development

Create a `.env.local` file in the root directory:

```env
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_UWH6nTy2XcA4BS7u_OS0oZHtQ56g3BjXFIWAqNSlxDPJVHV
REDIS_URL=redis://default:VTXmdYzdNkE0l338u8aEVRtQLpB3TTbj@redis-18758.c285.us-west-2-2.ec2.redns.redis-cloud.com:18758
```

### Vercel Production

Add these environment variables in your Vercel dashboard:

1. Go to **Settings → Environment Variables**
2. Add:
   - `BLOB_READ_WRITE_TOKEN` = `vercel_blob_rw_UWH6nTy2XcA4BS7u_OS0oZHtQ56g3BjXFIWAqNSlxDPJVHV`
   - `REDIS_URL` = `redis://default:VTXmdYzdNkE0l338u8aEVRtQLpB3TTbj@redis-18758.c285.us-west-2-2.ec2.redns.redis-cloud.com:18758`
3. Set environment to "Production"
4. Redeploy

## Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Test API endpoints
node test-api.js

# Test Redis connection
node test-redis.js

# Test Blob functionality
node test-blob-api.js
```

## API Endpoints

- `GET /api/officers` - Get all team officers
- `GET /api/health` - Health check endpoint
- `POST /api/upload` - Upload files to Vercel Blob
- `POST /api/upload-document` - Upload documents with metadata

## Project Structure

```
ewa_website/
├── api/                    # Vercel serverless functions
│   ├── index.js           # Main API handler
│   └── officers.js        # Officers endpoint
├── admin/                 # Admin panel
├── assets/               # Static assets
├── data/                 # JSON data files
├── server.js             # Main server file
├── *.html               # Static pages
└── vercel.json          # Vercel configuration
```

## Deployment

This project is configured for Vercel deployment via GitHub integration.

### Prerequisites

1. **Redis Database**: Set up in Vercel dashboard
2. **Environment Variables**: Configure as described above
3. **GitHub Integration**: Connected to Vercel

### Deployment Process

1. Push changes to GitHub
2. Vercel automatically detects changes
3. Build and deploy with environment variables
4. Verify Redis and Blob functionality

## Recent Updates

- **Redis Migration**: Migrated from Vercel KV to Redis for better performance
- **Environment Variables**: Added proper Redis and Blob configuration
- **API Structure**: Organized serverless functions in `/api` directory
- **Navigation**: Removed duplicate EWA Team link
- **Documentation**: Updated setup instructions

## Support

For issues or questions, check the `ENV_SETUP.md` file for detailed environment configuration instructions. 