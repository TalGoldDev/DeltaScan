# Environment Variables Setup Guide

This guide explains how to configure environment variables for DeltaScan across different environments.

## 📁 Environment Files Overview

DeltaScan uses multiple environment file templates for different purposes:

| File | Purpose | Usage |
|------|---------|-------|
| `.env.example` | General template with all possible variables | Reference for all available options |
| `.env.development.example` | Development-specific configuration | Copy to `.env.development` for local dev |
| `.env.production.example` | Production-specific configuration | Reference for production deployments |
| `.env.github.example` | GitHub Actions secrets reference | Configure in GitHub repository settings |

## 🚀 Quick Start

### For Local Development

1. **Copy the development template:**
   ```bash
   cp .env.development.example .env
   ```

2. **Edit `.env` with your values:**
   ```bash
   # Required: Add your API keys
   POLYMARKET_API_KEY=your_actual_api_key_here

   # The rest have sensible defaults for local development
   ```

3. **Start the development servers:**
   ```bash
   npm run dev
   ```

### For Production Deployment

See the [Deployment Configuration](#deployment-configuration) section below.

---

## 📋 Environment Variables by Category

### Application Environment

```bash
# Development: development
# Production: production
# Test: test
NODE_ENV=development
```

### Server Configuration

```bash
# Port (auto-set by hosting platforms in production)
PORT=3001

# Host binding
HOST=0.0.0.0  # Production: bind to all interfaces
HOST=localhost  # Development: local only

# Server URL (for client to connect)
SERVER_URL=http://localhost:3001  # Development
SERVER_URL=https://your-app.onrender.com  # Production
```

### Client Configuration

```bash
# IMPORTANT: Vite requires VITE_ prefix for env vars to be exposed to client
# API endpoint URL
VITE_API_URL=http://localhost:3001  # Development
VITE_API_URL=https://your-app.onrender.com  # Production

# Client URL
CLIENT_URL=http://localhost:5173  # Development
CLIENT_URL=https://your-app.vercel.app  # Production
```

### CORS Configuration

```bash
# Single origin
CORS_ORIGIN=http://localhost:5173

# Multiple origins (comma-separated)
CORS_ORIGIN=http://localhost:5173,http://localhost:3000,https://your-app.vercel.app
```

### API Keys (Prediction Markets)

```bash
# Required for Polymarket integration
POLYMARKET_API_KEY=your_polymarket_api_key

# Optional - other markets
KALSHI_API_KEY=your_kalshi_api_key
MANIFOLD_API_KEY=your_manifold_api_key
PREDICTIT_API_KEY=your_predictit_api_key
```

**Where to get API keys:**
- Polymarket: https://polymarket.com/developers
- Kalshi: https://kalshi.com/api
- Manifold: https://docs.manifold.markets/api
- PredictIt: https://www.predictit.org/api

### Market Scanning

```bash
# Scan frequency (minutes)
SCAN_INTERVAL_MINUTES=5  # Production
SCAN_INTERVAL_MINUTES=1  # Development (faster for testing)

# Auto-scanning toggle
ENABLE_AUTO_SCAN=true

# Minimum arbitrage percentage to report
MIN_ARBITRAGE_THRESHOLD=1.5  # Production
MIN_ARBITRAGE_THRESHOLD=0.5  # Development (catch more for testing)

# Max markets per scan
MAX_MARKETS_PER_SCAN=100  # Production
MAX_MARKETS_PER_SCAN=20   # Development
```

### WebSocket Configuration

```bash
# Heartbeat interval (milliseconds)
WS_HEARTBEAT_INTERVAL=30000

# Reconnection delay (milliseconds)
WS_RECONNECT_DELAY=5000
```

### Logging

```bash
# Log levels: error, warn, info, debug, verbose
LOG_LEVEL=info      # Production
LOG_LEVEL=debug     # Development

# Enable detailed error logging
ENABLE_ERROR_LOGGING=true

# Log formats: json, simple, pretty
LOG_FORMAT=json     # Production (structured)
LOG_FORMAT=pretty   # Development (readable)
```

### Security & Authentication

```bash
# JWT secret (generate a strong random string for production!)
# Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your-super-secret-key-change-this

# JWT expiration
JWT_EXPIRES_IN=7d

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000      # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100      # 100 requests per window
```

### Monitoring & Analytics

```bash
# Sentry error tracking
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
SENTRY_ENVIRONMENT=production

# Google Analytics
GA_TRACKING_ID=G-XXXXXXXXXX
```

### Feature Flags

```bash
# Enable/disable features
FEATURE_WEBSOCKET_ENABLED=true
FEATURE_REAL_TIME_UPDATES=true
FEATURE_HISTORICAL_DATA=false
```

---

## 🔧 Deployment Configuration

### Vercel (Client/Frontend)

1. **Go to Vercel Dashboard:**
   - Navigate to your project
   - Go to Settings → Environment Variables

2. **Add these variables:**
   ```bash
   # Required
   VITE_API_URL=https://your-server.onrender.com

   # Optional
   GA_TRACKING_ID=G-XXXXXXXXXX
   SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
   ```

3. **Environment-specific values:**
   - **Production:** Use production API URL
   - **Preview:** Use staging API URL or same as production
   - **Development:** Not needed (uses local `.env`)

### Render (Server/Backend)

1. **Go to Render Dashboard:**
   - Select your web service
   - Go to Environment → Environment Variables

2. **Add these variables:**
   ```bash
   # Required
   NODE_ENV=production
   CORS_ORIGIN=https://your-app.vercel.app
   POLYMARKET_API_KEY=your_production_api_key

   # Optional but recommended
   LOG_LEVEL=info
   LOG_FORMAT=json
   ENABLE_AUTO_SCAN=true
   SCAN_INTERVAL_MINUTES=5

   # Security
   JWT_SECRET=your-strong-random-secret

   # If using monitoring
   SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
   ```

3. **Render automatically sets:**
   - `PORT` - Don't override this
   - `RENDER_EXTERNAL_URL` - Your service URL
   - `RENDER_GIT_COMMIT` - Current commit SHA

### Railway (Alternative)

1. **Go to Railway Dashboard:**
   - Select your service
   - Go to Variables tab

2. **Add environment variables** (same as Render above)

3. **Railway automatically sets:**
   - `PORT`
   - `RAILWAY_ENVIRONMENT`
   - `RAILWAY_SERVICE_NAME`

---

## 🔐 GitHub Actions Secrets

For automated deployments, configure these in GitHub:

**Settings → Secrets and variables → Actions → New repository secret**

### Required for Vercel Deployment

```bash
VERCEL_TOKEN=xxx              # From vercel.com/account/tokens
VERCEL_ORG_ID=team_xxx        # From `vercel link`
VERCEL_PROJECT_ID=prj_xxx     # From `vercel link`
VITE_API_URL=https://...      # Your API endpoint
```

### Required for Render Deployment

```bash
RENDER_API_KEY=rnd_xxx        # From Render account settings
RENDER_SERVICE_ID=srv_xxx     # From Render service settings
```

### Optional (for builds that need API access)

```bash
POLYMARKET_API_KEY=xxx
SENTRY_AUTH_TOKEN=xxx         # For source map uploads
```

**See `.env.github.example` for detailed instructions.**

---

## 📝 Environment File Priority

Environment variables are loaded in this order (later overrides earlier):

1. System environment variables
2. `.env` file (if exists)
3. `.env.local` file (if exists, gitignored)
4. `.env.development` or `.env.production` (based on NODE_ENV)
5. `.env.development.local` or `.env.production.local` (gitignored)

**Best practice:**
- Use `.env` for shared defaults
- Use `.env.local` for personal overrides (never commit)
- Use platform-specific env vars for production secrets

---

## 🔒 Security Best Practices

### ✅ DO:

1. **Use `.env.local` for sensitive local values** (already gitignored)
2. **Rotate API keys regularly** (quarterly minimum)
3. **Use different keys for development vs production**
4. **Store production secrets in your deployment platform**
5. **Use environment-specific GitHub secrets**
6. **Enable 2FA on all service accounts**
7. **Review who has access to production secrets**
8. **Use strong, random JWT secrets** (64+ characters)
9. **Monitor for exposed secrets** (GitHub secret scanning)
10. **Document secrets in your team's password manager**

### ❌ DON'T:

1. **Never commit `.env` files** (in `.gitignore`)
2. **Never commit actual API keys or secrets**
3. **Never use development keys in production**
4. **Never share `.env` files via email or Slack**
5. **Never log or expose secrets in error messages**
6. **Never use default/example secrets in production**
7. **Never commit `.env.local` or `.env.production.local`**

---

## 🧪 Testing Your Configuration

### Check Environment Variables

```bash
# Server (Node.js)
npm run dev:server

# Look for startup logs showing loaded config
# Should NOT show actual secret values, just confirmation they're loaded

# Client (Vite)
npm run dev:client

# Vite will show which VITE_ variables are exposed
```

### Verify API Connections

```bash
# Test server
curl http://localhost:3001/health

# Should return: {"status":"ok"}

# Test client → server connection
# Open http://localhost:5173
# Check browser console for any CORS or connection errors
```

### Common Issues

**CORS errors in browser:**
```bash
# Check server .env has correct CORS_ORIGIN
CORS_ORIGIN=http://localhost:5173
```

**Client can't connect to API:**
```bash
# Check client .env has correct VITE_API_URL
VITE_API_URL=http://localhost:3001

# Note: Vite requires restart after .env changes
```

**Environment variables not loading:**
```bash
# 1. Check file is named exactly `.env` (not `.env.txt`)
# 2. Check file is in project root
# 3. Restart dev servers after changes
# 4. Check for syntax errors (no spaces around =)
```

---

## 📚 Additional Resources

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Node.js Environment Variables](https://nodejs.org/en/learn/command-line/how-to-read-environment-variables-from-nodejs)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Render Environment Variables](https://render.com/docs/configure-environment-variables)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

---

## 🆘 Getting Help

If you encounter issues with environment configuration:

1. Check this guide's [Testing Your Configuration](#testing-your-configuration) section
2. Verify all required variables are set (see `.env.example`)
3. Check for typos in variable names (case-sensitive!)
4. Ensure `.env` file has no syntax errors
5. Check platform-specific documentation (Vercel, Render, etc.)
6. Review deployment logs for missing environment variables

---

## 📋 Quick Reference Checklist

### Local Development Setup
- [ ] Copy `.env.development.example` to `.env`
- [ ] Add your `POLYMARKET_API_KEY`
- [ ] Verify `VITE_API_URL=http://localhost:3001`
- [ ] Verify `CORS_ORIGIN=http://localhost:5173`
- [ ] Run `npm run dev` and test

### Production Deployment Setup
- [ ] Configure Vercel environment variables
- [ ] Configure Render environment variables
- [ ] Set up GitHub Actions secrets
- [ ] Test deployment with preview/staging first
- [ ] Verify client can connect to server
- [ ] Check logs for any missing env vars
- [ ] Test all features work in production

### Security Checklist
- [ ] Never committed `.env` files
- [ ] Used strong JWT secret
- [ ] Rotated development API keys
- [ ] Different keys for dev vs production
- [ ] Enabled 2FA on all accounts
- [ ] Documented secrets in password manager
- [ ] Set up secret scanning alerts
