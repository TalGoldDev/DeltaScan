# Railway Deployment Guide

This guide walks you through deploying DeltaScan to Railway.app, a modern platform-as-a-service (PaaS) for rapid deployments.

## Prerequisites

- A [Railway account](https://railway.app/) (free tier available)
- Git repository connected to Railway
- Railway CLI installed (optional, for local development)

## Quick Deploy

### Option 1: Deploy via Railway Dashboard (Recommended)

1. **Create a New Project**
   - Go to [Railway Dashboard](https://railway.app/dashboard)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your DeltaScan repository

2. **Configure the Service**
   - Railway will auto-detect the Node.js project
   - The configuration files (`railway.toml`, `railway.json`) will be used automatically

3. **Set Environment Variables**
   - In your Railway project dashboard, go to the "Variables" tab
   - Add the following required variables:
     ```
     NODE_ENV=production
     CORS_ORIGIN=https://your-frontend-url.railway.app
     POLYMARKET_API_KEY=your_api_key_here
     ENABLE_AUTO_SCAN=true
     SCAN_INTERVAL_MINUTES=5
     LOG_LEVEL=info
     ```
   - Note: `PORT` is automatically set by Railway, don't override it
   - See `.env.example` for all available variables

4. **Deploy**
   - Railway will automatically build and deploy your application
   - Monitor the build logs in the deployment tab
   - Once deployed, Railway will provide a public URL

### Option 2: Deploy via Railway CLI

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   # or
   npm run railway:install  # This is already in package.json
   ```

2. **Login to Railway**
   ```bash
   railway login
   ```

3. **Link Your Project**
   ```bash
   # From the project root
   railway link
   # or use the npm script
   npm run railway:link
   ```

4. **Set Environment Variables**
   ```bash
   # Set variables one by one
   railway variables set NODE_ENV=production
   railway variables set CORS_ORIGIN=https://your-frontend-url.railway.app
   railway variables set POLYMARKET_API_KEY=your_api_key_here
   railway variables set ENABLE_AUTO_SCAN=true
   railway variables set SCAN_INTERVAL_MINUTES=5

   # Or use the Railway dashboard to set them via UI
   ```

5. **Deploy**
   ```bash
   railway up
   # or use the npm script
   npm run railway:deploy
   ```

## Configuration Files

### `railway.toml`
Main Railway configuration file that specifies:
- Build command: `npm install && npm run build:server`
- Start command: `npm run start`
- Health check endpoint: `/api/health`
- Restart policy: Restart on failure, max 10 retries

### `railway.json`
Alternative JSON format for Railway configuration with the same settings.

### `Procfile`
Specifies the web process: `web: npm run start`

## Monorepo Setup

DeltaScan uses a monorepo structure with workspaces. Railway is configured to:
1. Install all workspace dependencies
2. Build only the server package
3. Start the server package

The build process:
```bash
npm install          # Installs all workspace dependencies
npm run build:server # Builds @deltascan/server package
npm run start        # Starts the server from dist/index.js
```

## Health Checks

Railway uses the `/api/health` endpoint to monitor your service:
- **Endpoint**: `GET /api/health`
- **Expected Response**:
  ```json
  {
    "success": true,
    "data": { "status": "healthy", "timestamp": "..." },
    "timestamp": "..."
  }
  ```
- **Timeout**: 300 seconds
- **Interval**: Every 30 seconds

## Monitoring and Management

### View Logs
```bash
railway logs
# or
npm run railway:logs
```

### Check Service Status
```bash
railway status
# or
npm run railway:status
```

### View Metrics
- Go to your Railway project dashboard
- Click on your service
- View CPU, Memory, and Network metrics in real-time

## Environment Variables

All environment variables should be set in the Railway dashboard under the "Variables" tab. See `.env.example` for a complete list.

### Required Variables
- `NODE_ENV` - Set to `production`
- `CORS_ORIGIN` - Your frontend URL
- `POLYMARKET_API_KEY` - Your Polymarket API key (if using Polymarket)

### Optional Variables
- `KALSHI_API_KEY` - Kalshi API key
- `MANIFOLD_API_KEY` - Manifold API key
- `PREDICTIT_API_KEY` - PredictIt API key
- `SCAN_INTERVAL_MINUTES` - Market scan interval (default: 5)
- `ENABLE_AUTO_SCAN` - Enable automatic scanning (default: false)
- `LOG_LEVEL` - Logging level (default: info)

### Automatically Set by Railway
- `PORT` - The port your application should listen on
- `RAILWAY_ENVIRONMENT` - The environment name
- `RAILWAY_PROJECT_ID` - Your project ID
- `RAILWAY_SERVICE_ID` - Your service ID

## Deploying Frontend (Client)

To deploy the client as a separate service:

1. **Create a New Service** in your Railway project
2. **Configure Build Settings**:
   - Build Command: `npm install && npm run build:client`
   - Start Command: `npx serve -s packages/client/dist -p $PORT`
3. **Set Environment Variables**:
   - `NODE_ENV=production`
   - `VITE_API_URL=https://your-backend-url.railway.app`

Or use a static hosting service like:
- Vercel
- Netlify
- Cloudflare Pages

Just build the client locally and deploy the `packages/client/dist` folder.

## Custom Domains

1. Go to your Railway service settings
2. Click "Networking" tab
3. Click "Generate Domain" for a Railway subdomain
4. Or click "Custom Domain" to add your own domain
5. Update `CORS_ORIGIN` environment variable to match your domain

## Troubleshooting

### Build Fails
- Check build logs in Railway dashboard
- Ensure all dependencies are in `package.json`
- Verify Node.js version in `package.json` engines field

### Service Won't Start
- Check that `PORT` environment variable is not overridden
- Verify the start command in `railway.toml`
- Check application logs for errors

### Health Check Fails
- Ensure `/api/health` endpoint is accessible
- Check that server is binding to `0.0.0.0` (not `localhost`)
- Verify `HOST` environment variable is set to `0.0.0.0`

### CORS Errors
- Update `CORS_ORIGIN` environment variable
- Ensure it matches your frontend URL exactly (including protocol)

## Cost Optimization

Railway offers:
- **Free Tier**: $5/month in credits (good for small projects)
- **Hobby Plan**: $5/month for hobbyists
- **Pro Plan**: $20/month for production apps

To minimize costs:
- Adjust `SCAN_INTERVAL_MINUTES` to reduce CPU usage
- Set `ENABLE_AUTO_SCAN=false` if manual scanning is preferred
- Monitor your usage in the Railway dashboard

## Next Steps

After deploying to Railway:
1. Test the API endpoints using the provided Railway URL
2. Update your frontend to point to the Railway backend URL
3. Set up custom domains if needed
4. Configure monitoring and alerts
5. Review and adjust environment variables for production

## Useful Commands

```bash
# Link to Railway project
npm run railway:link

# Deploy to Railway
npm run railway:deploy

# View deployment logs
npm run railway:logs

# Check service status
npm run railway:status

# Local development (not Railway-specific)
npm run dev:server
```

## Additional Resources

- [Railway Documentation](https://docs.railway.app/)
- [Railway CLI Reference](https://docs.railway.app/develop/cli)
- [Railway Environment Variables](https://docs.railway.app/develop/variables)
- [Railway Healthchecks](https://docs.railway.app/deploy/healthchecks)

## Support

If you encounter issues:
1. Check Railway status page: https://status.railway.app/
2. Review Railway documentation: https://docs.railway.app/
3. Check DeltaScan documentation in `/docs`
4. Open an issue in the DeltaScan repository
