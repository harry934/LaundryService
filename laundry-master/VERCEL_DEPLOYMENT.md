# Vercel Deployment Guide for Red Rose Laundry

## Quick Fix for 404 Errors

The 404 error on Vercel is likely because:

1. Vercel doesn't know how to handle your Node.js backend
2. Static files aren't being served correctly

### Solution Applied

I've created `vercel.json` with the correct configuration.

### Deployment Steps

1. **Make sure you have a Vercel account** and the Vercel CLI installed:

   ```bash
   npm install -g vercel
   ```

2. **Deploy from your project directory**:

   ```bash
   cd "c:\Users\kibag\Desktop\Github Projects\Laundry Service Website\laundry-master"
   vercel
   ```

3. **Follow the prompts**:
   - Link to existing project or create new one
   - Confirm the settings
   - Wait for deployment

### Alternative: Deploy via Vercel Dashboard

1. Go to https://vercel.com/new
2. Import your Git repository (GitHub/GitLab/Bitbucket)
3. Vercel will auto-detect the configuration from `vercel.json`
4. Click "Deploy"

### Important Notes

- **Root Directory**: Make sure Vercel is deploying from the `laundry-master` folder
- **Environment Variables**: If your server.js uses any environment variables, add them in Vercel dashboard under Settings → Environment Variables
- **MongoDB Connection**: If using MongoDB, make sure your connection string allows connections from Vercel's IP addresses

### Testing Locally Before Deploy

```bash
# Install Vercel CLI
npm install -g vercel

# Run local development server
vercel dev
```

This will simulate the Vercel environment locally so you can test before deploying.

### Common Issues

**404 on all pages:**

- Check that `vercel.json` is in the root directory
- Verify the build completed successfully

**API routes not working:**

- Ensure server.js exports a proper handler
- Check that routes match the `/api/*` pattern

**Static files not loading:**

- Verify file paths are relative (not absolute)
- Check that assets folder is included in deployment

### Need Help?

Check Vercel deployment logs:

```bash
vercel logs [deployment-url]
```
