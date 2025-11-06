# DeltaScan - System Overview

## Project Description

DeltaScan is a prediction market arbitrage platform that scans multiple prediction market platforms to identify and display profitable arbitrage opportunities. The system continuously monitors different markets, compares prices across platforms, and calculates potential profit margins.

## Architecture

### Monorepo Structure

The project is organized as a TypeScript monorepo with clear separation between client and server:

```
DeltaScan/
├── packages/
│   ├── client/          # React frontend application
│   ├── server/          # Express.js backend API
│   └── shared/          # Shared types, utilities, and constants
├── docs/                # Documentation
└── package.json         # Root workspace configuration
```

### Technology Stack

#### Client (Frontend)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Real-time Updates**: Socket.IO Client
- **Routing**: React Router
- **Charts**: Recharts
- **HTTP Client**: Axios

#### Server (Backend)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **WebSocket**: Socket.IO
- **Scheduling**: node-cron
- **Logging**: Winston
- **Validation**: Zod
- **HTTP Client**: Axios

#### Shared
- **Type System**: TypeScript with Zod schemas
- **Validation**: Zod
- **Utilities**: Arbitrage calculation functions

## Core Components

### 1. Market Scanner Service (`packages/server/src/services/MarketScannerService.ts`)

**Purpose**: Scans multiple prediction market platforms and detects arbitrage opportunities.

**Key Functions**:
- `scanAllPlatforms()`: Orchestrates scanning across all platforms
- `scanPolymarket()`: Fetches data from Polymarket API
- `scanKalshi()`: Fetches data from Kalshi API
- `scanManifold()`: Fetches data from Manifold Markets API
- `scanPredictIt()`: Fetches data from PredictIt API
- `detectArbitrageOpportunities()`: Analyzes collected data to find arbitrage

**State**:
- `markets`: Map of all discovered markets
- `bets`: Map of bets by market ID
- `arbitrageOpportunities`: Array of detected opportunities

### 2. API Routes (`packages/server/src/routes/index.ts`)

**Endpoints**:
- `GET /api/markets` - List all markets with pagination
- `GET /api/markets/:marketId/bets` - Get bets for a specific market
- `GET /api/arbitrage` - Get all arbitrage opportunities
- `POST /api/scan` - Trigger manual scan
- `GET /api/health` - Health check

### 3. WebSocket Events (`packages/server/src/index.ts`)

**Real-time Communication**:
- `connect` - Client connects
- `disconnect` - Client disconnects
- `subscribe:markets` - Subscribe to market updates
- `unsubscribe:markets` - Unsubscribe from updates
- `arbitrage:opportunity` - Broadcast new opportunities

### 4. Frontend Components

**Dashboard** (`packages/client/src/pages/Dashboard.tsx`):
- Main view for displaying arbitrage opportunities
- Real-time updates via WebSocket
- Manual refresh capability

**ArbitrageCard** (`packages/client/src/components/ArbitrageCard.tsx`):
- Displays individual arbitrage opportunity
- Shows profit margin, platforms, prices, and capital requirements

### 5. Shared Types (`packages/shared/src/types/`)

**Core Types**:
- `Market`: Prediction market metadata
- `Bet`: Individual bet position with price
- `ArbitrageOpportunity`: Detected arbitrage with profit calculations
- `MarketPlatform`: Enum of supported platforms
- `BetOutcome`: YES/NO outcomes

## Data Flow

1. **Scheduled Scanning**:
   - Cron job triggers `scanAllPlatforms()` at configured interval
   - Scanner fetches data from each platform API
   - Data is stored in memory (markets and bets)

2. **Arbitrage Detection**:
   - After scanning, `detectArbitrageOpportunities()` runs
   - Compares bets across platforms for same events
   - Calculates profit margins using shared utilities
   - Stores valid opportunities (profit > threshold)

3. **API Serving**:
   - Clients request data via REST API
   - Server returns opportunities from memory
   - Real-time updates pushed via WebSocket

4. **Frontend Display**:
   - Dashboard fetches initial data via React Query
   - WebSocket connection established for real-time updates
   - Zustand store manages client-side state
   - UI updates automatically when new opportunities arrive

## Arbitrage Calculation

The system uses the following logic to detect arbitrage:

```typescript
// Two opposing bets on different platforms
bet1: YES @ 0.60 (60%)
bet2: NO @ 0.35 (35%)

// Total implied probability
total = 0.60 + 0.35 = 0.95

// If total < 1.0, arbitrage exists
profitMargin = (1 - 0.95) / 0.95 = 5.26%

// Stake allocation ensures equal profit
stake1 = (capital * bet1.price) / total
stake2 = (capital * bet2.price) / total
```

## Supported Platforms

1. **Polymarket** - Decentralized prediction market
2. **Kalshi** - Regulated event contracts
3. **Manifold Markets** - Play-money prediction market
4. **PredictIt** - Political prediction market

## Configuration

### Server Configuration (`.env`):
- `PORT`: Server port (default: 3001)
- `CORS_ORIGIN`: Allowed frontend origin
- `SCAN_INTERVAL_MINUTES`: How often to scan
- `ENABLE_AUTO_SCAN`: Enable/disable automatic scanning
- Platform API keys

### Client Configuration (`.env`):
- `VITE_API_URL`: Backend API URL
- `VITE_WS_URL`: WebSocket server URL

## Security Considerations

1. **API Keys**: Stored in environment variables, never committed
2. **CORS**: Configured to allow only specific origins
3. **Rate Limiting**: Respects platform rate limits (configured in constants)
4. **Error Handling**: Comprehensive error handling and logging
5. **Input Validation**: Zod schemas validate all data

## Scalability Considerations

**Current Implementation** (In-Memory):
- Markets and opportunities stored in memory
- Suitable for development and testing
- Data lost on server restart

**Future Enhancements**:
- Database integration (PostgreSQL/MongoDB)
- Redis for caching and real-time data
- Message queue for async processing
- Horizontal scaling with load balancer
- Rate limiting and request queuing

## Development Workflow

1. **Install Dependencies**: `npm install` (at root)
2. **Development**: `npm run dev` (runs both client and server)
3. **Build**: `npm run build` (builds all packages)
4. **Type Check**: `npm run type-check` (across all packages)

## Monitoring and Logging

- **Winston Logger**: Structured logging with levels
- **Request Logging**: All HTTP requests logged
- **Error Tracking**: Errors logged with stack traces
- **WebSocket Events**: Connection events logged
- **Scan Results**: Scan metrics logged (markets, bets, opportunities)
