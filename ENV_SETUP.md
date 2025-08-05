# Environment Variables Setup

## For Local Development

Create a file called `.env.local` in the root directory with the following content:

```
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_UWH6nTy2XcA4BS7u_OS0oZHtQ56g3BjXFIWAqNSlxDPJVHV
```

## For Vercel Production

1. Go to your Vercel dashboard
2. Select your EWA website project
3. Go to "Settings" → "Environment Variables"
4. Add a new environment variable:
   - **Name**: `BLOB_READ_WRITE_TOKEN`
   - **Value**: `vercel_blob_rw_UWH6nTy2XcA4BS7u_OS0oZHtQ56g3BjXFIWAqNSlxDPJVHV`
   - **Environment**: Production (and optionally Preview/Development)

## Testing

After setting up the environment variables:

1. Restart your local server: `npm start`
2. Visit `http://localhost:3000/blob-test.html` to test the blob functionality
3. Check the server console for "Vercel Blob initialized successfully" message

## Security Note

The `.env.local` file is automatically ignored by Git for security reasons.
Never commit this file to version control. 