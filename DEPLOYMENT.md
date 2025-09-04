# Message Analyzer Platform - Deployment Guide

## 🚀 Vercel Deployment Instructions

### Prerequisites
- Vercel account
- NEON Postgres database
- Git repository with your code

### Step 1: Environment Variables Setup

1. **In Vercel Dashboard:**
   - Go to your project settings
   - Navigate to "Environment Variables"
   - Add the following variables:

   ```
   DATABASE_URL=postgresql://username:password@hostname:port/database?sslmode=require
   NODE_ENV=production
   ```

2. **Get your NEON Postgres connection string:**
   - Log into your NEON dashboard
   - Copy the connection string from your database settings
   - Paste it as the `DATABASE_URL` value in Vercel

### Step 2: Deploy to Vercel

#### Option A: Deploy via Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

#### Option B: Deploy via Git Integration
1. Connect your GitHub/GitLab repository to Vercel
2. Vercel will automatically detect the React app
3. The `vercel.json` configuration will handle both frontend and backend

### Step 3: Database Setup

1. **Run the SQL schema:**
   ```bash
   # Connect to your NEON database
   psql "your_database_url_here" -f schema.sql
   ```

2. **Verify tables were created:**
   - Check your NEON dashboard
   - Or run: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`

### Step 4: Test the Deployment

1. **Check API endpoints:**
   - `https://your-app.vercel.app/api/health` - Should return `{"status":"OK"}`
   - `https://your-app.vercel.app/api/threads` - Should return empty array or data
   - `https://your-app.vercel.app/api/stats` - Should return statistics

2. **Test the frontend:**
   - Visit `https://your-app.vercel.app`
   - Check browser console for any errors
   - Try the refresh button to test API connectivity

### Step 5: Troubleshooting

#### Common Issues:

1. **API calls failing:**
   - Check that `DATABASE_URL` is set correctly in Vercel
   - Verify the database connection string format
   - Check Vercel function logs for errors

2. **Database connection issues:**
   - Ensure your NEON database is active
   - Check that the connection string includes `?sslmode=require`
   - Verify the database has the correct tables (run schema.sql)

3. **Frontend not loading:**
   - Check that the build completed successfully
   - Verify all environment variables are set
   - Check browser console for JavaScript errors

#### Debug Commands:
```bash
# Check Vercel function logs
vercel logs

# Test database connection locally
psql "your_database_url_here" -c "SELECT version();"

# Test API endpoints locally
curl http://localhost:5000/api/health
```

### Step 6: Production Checklist

- [ ] Environment variables configured in Vercel
- [ ] Database schema applied successfully
- [ ] API endpoints responding correctly
- [ ] Frontend loading without errors
- [ ] Database connection working
- [ ] All features tested in production

### Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | NEON Postgres connection string | `postgresql://user:pass@host:5432/db?sslmode=require` |
| `NODE_ENV` | Environment mode | `production` |
| `REACT_APP_API_URL` | Frontend API base URL (optional) | Leave empty for production |

### Support

If you encounter issues:
1. Check the Vercel function logs
2. Verify your database connection
3. Test API endpoints individually
4. Check browser console for frontend errors

The app should now be fully functional on Vercel with your NEON Postgres database!
