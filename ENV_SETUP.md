# Environment Variables Setup

## For Local Development

Create a file called `.env.local` in the root directory with the following content:

```
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_UWH6nTy2XcA4BS7u_OS0oZHtQ56g3BjXFIWAqNSlxDPJVHV
DATABASE_URL=postgres://neondb_owner:npg_Lj2UaqCig6HI@ep-jolly-silence-afmn89zf-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require
```

## For Vercel Production

### Step 1: Add Environment Variables

Go to "Settings" → "Environment Variables" and add:

**Blob Storage:**
- **Name**: `BLOB_READ_WRITE_TOKEN`
- **Value**: `vercel_blob_rw_UWH6nTy2XcA4BS7u_OS0oZHtQ56g3BjXFIWAqNSlxDPJVHV`
- **Environment**: Production (and optionally Preview/Development)

**Neon Database:**
- **Name**: `DATABASE_URL`
- **Value**: `postgres://neondb_owner:npg_Lj2UaqCig6HI@ep-jolly-silence-afmn89zf-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require`
- **Environment**: Production

## Testing

After setting up the environment variables:

1. Restart your local server: `npm start`
2. Visit `http://localhost:3000/blob-test.html` to test the blob functionality
3. Check the server console for "Vercel Blob initialized successfully" message
4. Visit `http://localhost:3000/team.html` to test the team page
5. Check the server console for "✅ Connected to Neon PostgreSQL database" message

## Security Note

The `.env.local` file is automatically ignored by Git for security reasons.
Never commit this file to version control. 