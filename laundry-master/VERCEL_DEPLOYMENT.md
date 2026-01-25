# Vercel Deployment Guide (Frontend-Only)

## Overview

This website is now configured for **frontend-only** static deployment on Vercel. All backend code has been removed.

## What Was Removed

- `server.js` - Express backend
- All JSON data files (orders, logs, riders, settings, users)
- `package.json` and Node.js dependencies
- Backend API calls (commented out in HTML files)

## Deployment Steps

### 1. Install Vercel CLI (if not already installed)

```bash
npm install -g vercel
```

### 2. Deploy to Vercel

```bash
cd "c:\Users\kibag\Desktop\Github Projects\Laundry Service Website\laundry-master"
vercel --prod
```

### 3. Follow Prompts

- Set up and deploy: Yes
- Which scope: Your account
- Link to existing project: No (first time)
- Project name: laundry-service (or your choice)
- Directory: ./ (current directory)
- Override settings: No

## What Works

- All static pages (index, about, contact, services, pricing)
- Design and animations
- Glassmorphism and claymorphism styling
- Quantity selectors on pricing page

## What Doesn't Work (Backend Required)

- Admin dashboard
- Staff login
- Order creation/tracking
- Payment processing
- Data persistence

## Reconnecting Backend Later

All backend API calls are commented out with `/* BACKEND DISABLED */` markers.
To reconnect:

1. Deploy your backend separately
2. Uncomment API_BASE in each HTML file
3. Uncomment fetch() calls
4. Update API_BASE URL to your backend endpoint

## Files Modified

- `pricing.html` - Redesigned with claymorphism
- `session.js` - Backend calls removed
- `vercel.json` - Simplified for static deployment
- `staff.html` - Auth disabled
- `payment.html` - API calls disabled
- `dashboard.html` - API calls disabled

## Support

For issues, check console for "Backend not connected" messages.
