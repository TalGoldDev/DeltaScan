# DeltaScan

A TypeScript monorepo application for scanning prediction markets and identifying arbitrage opportunities across multiple platforms.

## Overview

DeltaScan monitors multiple prediction market platforms (Polymarket, Kalshi, Manifold Markets, PredictIt) to find profitable arbitrage opportunities. The platform scans markets, compares prices across platforms, and displays potential arbitrage bets with calculated profit margins.

## Architecture

This is a monorepo with three main packages:

- **`packages/client`**: React frontend application with Vite
- **`packages/server`**: Express.js backend API with WebSocket support
- **`packages/shared`**: Shared TypeScript types, utilities, and constants

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- TanStack Query (React Query)
- Zustand (state management)
- Socket.IO Client
- React Router

### Backend
- Node.js + TypeScript
- Express.js
- Socket.IO
- Winston (logging)
- node-cron (scheduling)
- Axios

### Shared
- TypeScript
- Zod (validation)

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation

```bash
# Install dependencies
npm install
```

### Configuration

1. **Server Environment**:
```bash
cp packages/server/.env.example packages/server/.env
```

Edit `packages/server/.env` and add your API keys:
```env
PORT=3001
CORS_ORIGIN=http://localhost:3000
POLYMARKET_API_KEY=your_key
KALSHI_API_KEY=your_key
MANIFOLD_API_KEY=your_key
PREDICTIT_API_KEY=your_key
SCAN_INTERVAL_MINUTES=5
ENABLE_AUTO_SCAN=true
```

2. **Client Environment** (optional):
```bash
cp packages/client/.env.example packages/client/.env
```

### Development

Start both client and server in watch mode:
```bash
npm run dev
```

Or run them separately:
```bash
npm run dev:server  # Server on http://localhost:3001
npm run dev:client  # Client on http://localhost:3000
```

### Building

Build all packages:
```bash
npm run build
```

Build individual packages:
```bash
npm run build:server
npm run build:client
```

### Production

```bash
npm run build
npm run start
```

## Project Structure

```
DeltaScan/
├── packages/
│   ├── client/                 # Frontend React app
│   │   ├── src/
│   │   │   ├── components/     # React components
│   │   │   ├── pages/          # Page components
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   ├── services/       # API and WebSocket clients
│   │   │   ├── store/          # Zustand stores
│   │   │   └── utils/          # Utility functions
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   ├── server/                 # Backend Express app
│   │   ├── src/
│   │   │   ├── config/         # Configuration
│   │   │   ├── controllers/    # Route controllers
│   │   │   ├── middleware/     # Express middleware
│   │   │   ├── routes/         # API routes
│   │   │   ├── services/       # Business logic
│   │   │   ├── utils/          # Utility functions
│   │   │   └── index.ts        # Entry point
│   │   └── package.json
│   │
│   └── shared/                 # Shared code
│       ├── src/
│       │   ├── types/          # TypeScript types
│       │   ├── constants/      # Shared constants
│       │   └── utils/          # Shared utilities
│       └── package.json
│
├── docs/                       # Documentation
│   ├── SYSTEM_OVERVIEW.md
│   ├── STANDARD_OPERATING_PROCEDURES.md
│   └── AI_TASKS_GUIDE.md
│
├── package.json                # Root package (workspace)
├── tsconfig.json               # Root TypeScript config
└── README.md
```

## API Endpoints

### Markets
- `GET /api/markets` - Get all markets (paginated)
- `GET /api/markets/:marketId/bets` - Get bets for a market

### Arbitrage
- `GET /api/arbitrage` - Get all arbitrage opportunities

### Utilities
- `POST /api/scan` - Trigger manual market scan
- `GET /api/health` - Health check

## WebSocket Events

- `connect` - Client connected
- `disconnect` - Client disconnected
- `subscribe:markets` - Subscribe to market updates
- `unsubscribe:markets` - Unsubscribe from updates
- `arbitrage:opportunity` - New arbitrage opportunities

## Features

### Current
- ✅ Monorepo architecture with TypeScript
- ✅ REST API for market data
- ✅ WebSocket for real-time updates
- ✅ Scheduled market scanning
- ✅ Arbitrage detection algorithm
- ✅ React dashboard UI
- ✅ Shared type definitions
- ✅ Comprehensive logging

### Planned
- [ ] Platform API integrations
- [ ] Database persistence
- [ ] User authentication
- [ ] Advanced filtering and sorting
- [ ] Historical data and analytics
- [ ] Email/SMS notifications
- [ ] Mobile app
- [ ] Testing suite

## Documentation

- **[System Overview](docs/SYSTEM_OVERVIEW.md)** - Architecture and technical details
- **[Standard Operating Procedures](docs/STANDARD_OPERATING_PROCEDURES.md)** - Development workflows and procedures
- **[AI Tasks Guide](docs/AI_TASKS_GUIDE.md)** - Guide for AI assistants working on the project

## Development Scripts

```bash
npm run dev              # Start both client and server
npm run dev:client       # Start client only
npm run dev:server       # Start server only
npm run build            # Build all packages
npm run build:client     # Build client
npm run build:server     # Build server
npm run start            # Start production server
npm run type-check       # Check TypeScript across all packages
npm run clean            # Remove build artifacts and node_modules
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Run type check: `npm run type-check`
4. Test locally
5. Commit with descriptive message
6. Create pull request

## License

MIT

## Support

For issues and questions, please check the documentation in the `docs/` folder.

## Platform Support

Currently configured for:
- **Polymarket** - Decentralized prediction markets
- **Kalshi** - Regulated event contracts
- **Manifold Markets** - Play-money prediction markets
- **PredictIt** - Political prediction markets

Note: Platform integrations are scaffolded but require API implementation and valid API keys.
