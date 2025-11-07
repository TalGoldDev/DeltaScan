# DeltaScan - Installation Guide

Complete guide for setting up the DeltaScan prediction market arbitrage platform.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start (Automated)](#quick-start-automated)
3. [Manual Installation](#manual-installation)
4. [Configuration](#configuration)
5. [Running the Application](#running-the-application)
6. [Verification](#verification)
7. [Troubleshooting](#troubleshooting)
8. [Development Setup](#development-setup)

## Prerequisites

### Required Software

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Git** (for cloning the repository)

### Verify Installation

```bash
node --version    # Should be >= v18.0.0
npm --version     # Should be >= 9.0.0
git --version     # Any recent version
```

### Installing Node.js

If you don't have Node.js installed:

**macOS (using Homebrew):**
```bash
brew install node@18
```

**Ubuntu/Debian:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Windows:**
Download from [nodejs.org](https://nodejs.org/)

## Quick Start (Automated)

### Using the Installation Script

We provide an automated installation script that handles everything:

```bash
# Make the script executable
chmod +x install.sh

# Run the installation
./install.sh
```

The script will:
- ✅ Check prerequisites
- ✅ Install all dependencies
- ✅ Build all packages
- ✅ Set up environment files
- ✅ Verify installation
- ✅ Provide next steps

**That's it!** Skip to [Running the Application](#running-the-application).

---

## Manual Installation

If you prefer to install manually or the script fails, follow these steps:

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd DeltaScan
```

### Step 2: Install Dependencies

DeltaScan uses npm workspaces, so a single command installs everything:

```bash
npm install
```

This installs dependencies for:
- Root workspace
- packages/client
- packages/server
- packages/shared

**Time estimate:** 1-2 minutes

### Step 3: Build Shared Package

The shared package must be built first since server and client depend on it:

```bash
cd packages/shared
npm run build
cd ../..
```

**What this does:**
- Compiles TypeScript types
- Creates `dist/` folder
- Makes types available to server and client

**Time estimate:** 10-20 seconds

### Step 4: Set Up Environment Files

#### Server Environment

```bash
cd packages/server
cp .env.example .env
```

Edit `.env` if needed (defaults work fine for development):

```env
# Server Configuration
NODE_ENV=development
PORT=3001
HOST=localhost

# CORS
CORS_ORIGIN=http://localhost:3000

# No API keys needed for Polymarket (public API)
# Add when integrating other platforms:
# KALSHI_API_KEY=
# MANIFOLD_API_KEY=
# PREDICTIT_API_KEY=

# Scanning Configuration
SCAN_INTERVAL_MINUTES=5
ENABLE_AUTO_SCAN=true

# Logging
LOG_LEVEL=info
```

#### Client Environment (Optional)

```bash
cd ../client
cp .env.example .env
```

Defaults should work:

```env
# API Configuration
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=http://localhost:3001
```

### Step 5: Verify Installation

Run type check across all packages:

```bash
cd ../..
npm run type-check
```

**Expected output:**
```
✓ No TypeScript errors
```

If you see errors, see [Troubleshooting](#troubleshooting).

---

## Configuration

### Server Configuration

File: `packages/server/.env`

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | development | Environment (development/production) |
| `PORT` | 3001 | Server port |
| `HOST` | localhost | Server host |
| `CORS_ORIGIN` | http://localhost:3000 | Allowed frontend origin |
| `SCAN_INTERVAL_MINUTES` | 5 | Auto-scan interval |
| `ENABLE_AUTO_SCAN` | true | Enable automatic scanning |
| `LOG_LEVEL` | info | Logging level (error/warn/info/debug) |

### Client Configuration

File: `packages/client/.env`

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | http://localhost:3001/api | Backend API URL |
| `VITE_WS_URL` | http://localhost:3001 | WebSocket URL |

### Polymarket Configuration

No API keys required! Polymarket's Gamma API is publicly accessible for read-only operations.

The following are configured in code:
- Rate Limit: 100 requests/minute (automatic)
- Cache TTL: 5 minutes (configurable)
- Min Liquidity: $1,000 (configurable)
- Min Volume 24hr: $500 (configurable)

---

## Running the Application

### Development Mode (Recommended)

**Option 1: Run everything together**

```bash
npm run dev
```

This starts:
- Server on http://localhost:3001
- Client on http://localhost:3000

**Option 2: Run separately**

```bash
# Terminal 1 - Server
npm run dev:server

# Terminal 2 - Client
npm run dev:client
```

### Production Mode

```bash
# Build all packages
npm run build

# Start server
npm run start
```

**Note:** Production mode requires proper deployment configuration (PM2, Docker, etc.)

---

## Verification

### 1. Check Server is Running

```bash
curl http://localhost:3001/api/health
```

**Expected:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-11-06T..."
  }
}
```

### 2. Check Polymarket Integration

```bash
curl http://localhost:3001/api/health/polymarket
```

**Expected:**
```json
{
  "success": true,
  "data": {
    "healthy": true,
    "rateLimiter": {
      "queueLength": 0,
      "requestsInLastMinute": 1,
      "processing": false
    }
  }
}
```

### 3. Fetch Trending Markets

```bash
curl "http://localhost:3001/api/markets/trending?limit=5"
```

**Expected:** JSON response with 5 Polymarket markets

### 4. Check Client (if running)

Open browser to: http://localhost:3000

You should see the DeltaScan dashboard.

---

## Troubleshooting

### Issue: `npm install` fails

**Error:** `EACCES: permission denied`

**Solution:**
```bash
# Fix npm permissions
sudo chown -R $USER:$(id -gn $USER) ~/.npm
sudo chown -R $USER:$(id -gn $USER) ~/.config
```

---

### Issue: TypeScript errors about shared package

**Error:** `Cannot find module '@deltascan/shared'`

**Solution:**
```bash
# Rebuild shared package
cd packages/shared
npm run build
cd ../..
```

---

### Issue: Server won't start

**Error:** `Port 3001 already in use`

**Solution:**
```bash
# Find and kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Or use a different port
# Edit packages/server/.env
PORT=3002
```

---

### Issue: Client won't start

**Error:** `Port 3000 already in use`

**Solution:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or let Vite choose another port (it will prompt)
```

---

### Issue: Empty markets array

**Check:**
1. Is Polymarket API accessible?
   ```bash
   curl https://gamma-api.polymarket.com/health
   ```

2. Check server logs for errors

3. Try manual scan:
   ```bash
   curl -X POST http://localhost:3001/api/scan
   ```

4. Check with higher limit:
   ```bash
   curl "http://localhost:3001/api/markets/trending?limit=100"
   ```

---

### Issue: Rate limit errors

**Error:** Rate limit messages in logs

**Solution:**
- This is normal! The rate limiter handles it automatically
- Wait 1 minute for window to reset
- Check status: `curl http://localhost:3001/api/health/polymarket`

---

### Issue: CORS errors in browser

**Error:** `Access to fetch ... blocked by CORS policy`

**Solution:**
Edit `packages/server/.env`:
```env
CORS_ORIGIN=http://localhost:3000
```

Restart server.

---

### Issue: Workspace errors

**Error:** `No workspaces found`

**Solution:**
Make sure you're in the project root, not in a package folder:
```bash
cd /path/to/DeltaScan
npm install
```

---

## Development Setup

### IDE Setup (VS Code Recommended)

**Recommended Extensions:**
- ESLint
- Prettier
- TypeScript Vue Plugin
- Tailwind CSS IntelliSense

**Workspace Settings:**

Create `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.tsdk": "node_modules/typescript/lib",
  "eslint.workingDirectories": [
    "packages/client",
    "packages/server",
    "packages/shared"
  ]
}
```

### Git Hooks (Optional)

Set up pre-commit hooks to run type checking:

```bash
# Install husky
npm install --save-dev husky

# Initialize
npx husky install

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run type-check"
```

### Debugging

#### Debug Server (VS Code)

Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Server",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev:server"],
      "skipFiles": ["<node_internals>/**"],
      "console": "integratedTerminal"
    }
  ]
}
```

#### Debug Client

Use browser DevTools (F12)

### Hot Reload

Both client and server support hot reload in development mode:

- **Server**: Uses `tsx watch` - auto-restarts on file changes
- **Client**: Uses Vite HMR - instant updates without page reload

---

## Project Structure After Installation

```
DeltaScan/
├── node_modules/              # Root dependencies
├── packages/
│   ├── client/
│   │   ├── node_modules/      # Client dependencies
│   │   ├── dist/              # Built client (after build)
│   │   ├── src/
│   │   └── .env               # Client config
│   ├── server/
│   │   ├── node_modules/      # Server dependencies
│   │   ├── dist/              # Built server (after build)
│   │   ├── src/
│   │   └── .env               # Server config
│   └── shared/
│       ├── node_modules/      # Shared dependencies
│       ├── dist/              # Built shared package ⚠️ REQUIRED
│       └── src/
├── docs/                      # Documentation
├── package.json               # Root workspace config
└── install.sh                 # Installation script
```

---

## Build Outputs

### Development Build

```bash
npm run dev
```

- Uses `tsx watch` for server (no build needed)
- Uses Vite dev server for client (no build needed)
- Only shared package needs building once

### Production Build

```bash
npm run build
```

Creates:
- `packages/shared/dist/` - Compiled shared package
- `packages/server/dist/` - Compiled server
- `packages/client/dist/` - Optimized client bundle

---

## Environment Variables Summary

### Required (None!)

All defaults work out of the box for development.

### Optional

**For production:**
- `NODE_ENV=production`
- `PORT` (if deploying to specific port)
- `CORS_ORIGIN` (set to your frontend domain)

**For other platforms (future):**
- `KALSHI_API_KEY`
- `MANIFOLD_API_KEY`
- `PREDICTIT_API_KEY`

---

## Next Steps After Installation

1. **Verify Installation:**
   ```bash
   npm run dev
   curl http://localhost:3001/api/health
   curl "http://localhost:3001/api/markets/trending?limit=5"
   ```

2. **Read Documentation:**
   - `docs/TESTING_GUIDE.md` - How to test
   - `docs/SYSTEM_OVERVIEW.md` - Architecture overview
   - `docs/POLYMARKET_INTEGRATION_DESIGN.md` - Polymarket details

3. **Start Development:**
   - See `docs/STANDARD_OPERATING_PROCEDURES.md` for workflows
   - See `docs/AI_TASKS_GUIDE.md` for development tasks

4. **Deploy (Optional):**
   - See deployment guides (TODO)

---

## Quick Command Reference

```bash
# Installation
npm install                    # Install dependencies
npm run build                  # Build all packages

# Development
npm run dev                    # Run client + server
npm run dev:server            # Run server only
npm run dev:client            # Run client only

# Building
npm run build                  # Build all packages
npm run build:server          # Build server only
npm run build:client          # Build client only

# Quality
npm run type-check            # Check TypeScript
npm run lint                  # Run linters
npm run test                  # Run tests

# Cleanup
npm run clean                 # Remove build artifacts and node_modules
```

---

## System Requirements

### Minimum

- **CPU:** 2 cores
- **RAM:** 4 GB
- **Disk:** 2 GB free
- **Network:** Internet connection for API calls

### Recommended

- **CPU:** 4+ cores
- **RAM:** 8+ GB
- **Disk:** 5+ GB free
- **Network:** Stable broadband connection

---

## Support

### Documentation

All documentation is in the `docs/` folder:
- `INSTALLATION.md` (this file)
- `TESTING_GUIDE.md`
- `SYSTEM_OVERVIEW.md`
- `STANDARD_OPERATING_PROCEDURES.md`
- `POLYMARKET_INTEGRATION_DESIGN.md`
- `IMPLEMENTATION_PLAN.md`
- `AI_TASKS_GUIDE.md`

### Logs

Check logs for troubleshooting:
```bash
# Server logs (in terminal where server is running)
# Look for ERROR, WARN messages

# Set debug mode for more details
# Edit packages/server/.env:
LOG_LEVEL=debug
```

### Common Issues

Most issues are covered in the [Troubleshooting](#troubleshooting) section above.

---

## Platform-Specific Notes

### macOS

Should work out of the box with Homebrew-installed Node.js.

**M1/M2 Macs:** No special configuration needed.

### Linux (Ubuntu/Debian)

May need to install build tools:
```bash
sudo apt-get install build-essential
```

### Windows

**Recommended:** Use WSL2 (Windows Subsystem for Linux)

**Native Windows:**
- Install Node.js from nodejs.org
- Use PowerShell or Command Prompt
- May need to install Python and Visual Studio Build Tools for native modules

---

## Security Notes

### API Keys

- Polymarket requires no API keys (public API)
- When adding other platforms, store keys in `.env` files
- Never commit `.env` files to git (already in `.gitignore`)

### CORS

In production, set `CORS_ORIGIN` to your actual frontend domain:
```env
CORS_ORIGIN=https://yourdomain.com
```

### Rate Limiting

- Automatically handled by RateLimiter
- Respects API limits (100 req/min for Polymarket)
- No action needed

---

## Performance Tips

### Development

1. **Use hot reload** - Don't restart servers manually
2. **Keep shared package built** - Rebuild only when changing shared types
3. **Use debug logging selectively** - Only when troubleshooting

### Production

1. **Build with optimizations** - Use `npm run build`
2. **Use process manager** - PM2, systemd, Docker
3. **Enable caching** - Already implemented
4. **Monitor memory** - Restart periodically if needed

---

**Installation Guide Version**: 1.0
**Last Updated**: 2025-11-06
**Tested On**: macOS, Ubuntu 22.04, Windows 11 (WSL2)

---

## Success Checklist

After installation, you should be able to:

- [ ] Run `npm run dev` without errors
- [ ] Access http://localhost:3001/api/health (returns healthy)
- [ ] Access http://localhost:3001/api/markets/trending?limit=5 (returns markets)
- [ ] Access http://localhost:3000 (client loads)
- [ ] See server logs in terminal
- [ ] See market data in responses
- [ ] Run `npm run type-check` without errors

If all checked, **installation is successful!** 🎉
