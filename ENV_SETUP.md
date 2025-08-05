# Environment Variables Setup

## For Local Development

Create a file called `.env.local` in the root directory with the following content:

```
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_UWH6nTy2XcA4BS7u_OS0oZHtQ56g3BjXFIWAqNSlxDPJVHV
REDIS_URL=redis://default:VTXmdYzdNkE0l338u8aEVRtQLpB3TTbj@redis-18758.c285.us-west-2-2.ec2.redns.redis-cloud.com:18758
```

## For Vercel Production

### Step 1: Add Environment Variables

Go to "Settings" → "Environment Variables" and add:

**Blob Storage:**
- **Name**: `BLOB_READ_WRITE_TOKEN`
- **Value**: `vercel_blob_rw_UWH6nTy2XcA4BS7u_OS0oZHtQ56g3BjXFIWAqNSlxDPJVHV`
- **Environment**: Production (and optionally Preview/Development)

**Redis Database:**
- **Name**: `REDIS_URL`
- **Value**: `redis://default:VTXmdYzdNkE0l338u8aEVRtQLpB3TTbj@redis-18758.c285.us-west-2-2.ec2.redns.redis-cloud.com:18758`
- **Environment**: Production

## Testing

After setting up the environment variables:

1. Restart your local server: `npm start`
2. Visit `http://localhost:3000/blob-test.html` to test the blob functionality
3. Check the server console for "Vercel Blob initialized successfully" message
4. Visit `http://localhost:3000/team.html` to test the team page
5. Check the server console for "Redis initialized successfully" message

## Security Note

The `.env.local` file is automatically ignored by Git for security reasons.
Never commit this file to version control. 