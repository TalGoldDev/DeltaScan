# DeltaScan - Standard Operating Procedures (SOP)

This document outlines the standard procedures for developing, maintaining, and extending the DeltaScan platform.

## Development Setup

### Initial Setup

1. **Clone Repository**:
   ```bash
   git clone <repository-url>
   cd DeltaScan
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment**:
   ```bash
   # Server
   cp packages/server/.env.example packages/server/.env
   # Edit packages/server/.env with your API keys

   # Client
   cp packages/client/.env.example packages/client/.env
   # Edit if needed (defaults should work for local development)
   ```

4. **Verify Setup**:
   ```bash
   npm run type-check
   ```

### Running the Application

**Development Mode** (Recommended):
```bash
npm run dev
```
This starts both client (port 3000) and server (port 3001) in watch mode.

**Individual Services**:
```bash
# Server only
npm run dev:server

# Client only
npm run dev:client
```

**Production Build**:
```bash
npm run build
npm run start
```

## Code Organization

### When to Add New Files

1. **New Platform Integration**:
   - Location: `packages/server/src/services/platforms/`
   - Create: `<PlatformName>Service.ts`
   - Implement platform-specific API calls
   - Update `MarketScannerService.ts` to include new platform

2. **New API Endpoint**:
   - Add route to `packages/server/src/routes/index.ts`
   - Create controller in `packages/server/src/controllers/`
   - Add service logic if needed

3. **New Shared Type**:
   - Location: `packages/shared/src/types/`
   - Export from `packages/shared/src/index.ts`
   - Use Zod schemas for validation

4. **New UI Component**:
   - Location: `packages/client/src/components/`
   - Follow React functional component pattern
   - Use TypeScript for props

5. **New Page**:
   - Location: `packages/client/src/pages/`
   - Add route in `packages/client/src/App.tsx`

## Adding a New Platform

Follow these steps to integrate a new prediction market platform:

### 1. Update Shared Types

```typescript
// packages/shared/src/types/market.ts
export enum MarketPlatform {
  // ... existing
  NEW_PLATFORM = 'newplatform',
}
```

### 2. Add Platform Configuration

```typescript
// packages/shared/src/constants/index.ts
export const PLATFORM_CONFIG = {
  // ... existing
  NEW_PLATFORM: {
    name: 'New Platform',
    apiUrl: 'https://api.newplatform.com',
    websiteUrl: 'https://newplatform.com',
    rateLimit: 100,
  },
} as const;
```

### 3. Create Platform Service

```typescript
// packages/server/src/services/platforms/NewPlatformService.ts
import axios from 'axios';
import { Market, Bet, MarketPlatform } from '@deltascan/shared';
import { PLATFORM_CONFIG } from '@deltascan/shared';

export class NewPlatformService {
  private apiUrl = PLATFORM_CONFIG.NEW_PLATFORM.apiUrl;

  async fetchMarkets(): Promise<Market[]> {
    // Implement API call
    const response = await axios.get(`${this.apiUrl}/markets`);
    return this.transformMarkets(response.data);
  }

  async fetchBets(marketId: string): Promise<Bet[]> {
    // Implement API call
    const response = await axios.get(`${this.apiUrl}/markets/${marketId}/bets`);
    return this.transformBets(response.data);
  }

  private transformMarkets(data: any[]): Market[] {
    // Transform platform-specific data to our Market type
    return data.map(item => ({
      id: item.id,
      platform: MarketPlatform.NEW_PLATFORM,
      title: item.title,
      // ... map all required fields
    }));
  }

  private transformBets(data: any[]): Bet[] {
    // Transform platform-specific data to our Bet type
    return data.map(item => ({
      marketId: item.market_id,
      platform: MarketPlatform.NEW_PLATFORM,
      // ... map all required fields
    }));
  }
}
```

### 4. Update Market Scanner

```typescript
// packages/server/src/services/MarketScannerService.ts
import { NewPlatformService } from './platforms/NewPlatformService';

export class MarketScannerService {
  private newPlatformService = new NewPlatformService();

  async scanAllPlatforms(): Promise<void> {
    await Promise.all([
      // ... existing
      this.scanNewPlatform(),
    ]);
  }

  private async scanNewPlatform(): Promise<void> {
    try {
      const markets = await this.newPlatformService.fetchMarkets();
      markets.forEach(market => this.markets.set(market.id, market));

      for (const market of markets) {
        const bets = await this.newPlatformService.fetchBets(market.id);
        this.bets.set(market.id, bets);
      }
    } catch (error) {
      logger.error('Error scanning New Platform:', error);
    }
  }
}
```

### 5. Add Environment Variable

```bash
# packages/server/.env
NEW_PLATFORM_API_KEY=your_api_key_here
```

```typescript
// packages/server/src/config/index.ts
export const config = {
  apiKeys: {
    // ... existing
    newPlatform: process.env.NEW_PLATFORM_API_KEY || '',
  },
};
```

## Testing Procedures

### Manual Testing

1. **Start Development Environment**:
   ```bash
   npm run dev
   ```

2. **Test API Endpoints**:
   ```bash
   # Health check
   curl http://localhost:3001/api/health

   # Trigger scan
   curl -X POST http://localhost:3001/api/scan

   # Get arbitrage opportunities
   curl http://localhost:3001/api/arbitrage
   ```

3. **Test Frontend**:
   - Open http://localhost:3000
   - Verify dashboard loads
   - Click "Refresh" button
   - Check browser console for WebSocket connection

### Integration Testing

1. **Test with Real API**:
   - Add real API keys to `.env`
   - Trigger scan
   - Verify data is fetched and transformed correctly

2. **Test Arbitrage Detection**:
   - Ensure scan returns data
   - Verify arbitrage opportunities are calculated
   - Check profit margin calculations

## Error Handling

### Server Errors

All server errors should be handled using the error middleware:

```typescript
import { AppError } from '../middleware/errorHandler';

// Throw operational errors
throw new AppError(404, 'Market not found');

// Use asyncHandler for route handlers
export const myHandler = asyncHandler(async (req, res) => {
  // Your code here
});
```

### Client Errors

Handle errors in React Query:

```typescript
const { data, error, isLoading } = useQuery({
  queryKey: ['key'],
  queryFn: fetchData,
  onError: (error) => {
    console.error('Error:', error);
    // Show toast notification, etc.
  },
});
```

## Logging Standards

### Server Logging

Use Winston logger with appropriate levels:

```typescript
import { logger } from '../utils/logger';

logger.info('Informational message');
logger.warn('Warning message');
logger.error('Error message', { error });
logger.debug('Debug message');
```

### Client Logging

Use console methods:

```typescript
console.log('Info');
console.warn('Warning');
console.error('Error');
console.debug('Debug');
```

## Git Workflow

### Branch Naming

- Feature: `feature/description`
- Bug fix: `fix/description`
- Documentation: `docs/description`

### Commit Messages

Follow conventional commits:

```
feat: add new platform integration
fix: correct arbitrage calculation
docs: update API documentation
refactor: reorganize market scanner
style: format code
test: add unit tests
chore: update dependencies
```

### Pull Request Process

1. Create feature branch
2. Implement changes
3. Run type check: `npm run type-check`
4. Test locally
5. Commit with descriptive message
6. Push and create PR
7. Request review
8. Merge after approval

## Deployment

### Pre-Deployment Checklist

- [ ] All tests pass
- [ ] Type check passes
- [ ] No console errors
- [ ] Environment variables documented
- [ ] API keys secured
- [ ] Build succeeds
- [ ] Documentation updated

### Build Process

```bash
# Clean previous builds
npm run clean

# Install fresh dependencies
npm install

# Build all packages
npm run build

# Verify build
cd packages/server/dist && ls
cd packages/client/dist && ls
```

### Environment Setup

1. Set production environment variables
2. Configure CORS for production domain
3. Set up SSL certificates
4. Configure reverse proxy (nginx)
5. Set up process manager (PM2)

## Monitoring

### Health Checks

Monitor these endpoints:
- `/api/health` - Server health
- WebSocket connection status
- Scan success rate
- API response times

### Metrics to Track

- Number of markets scanned
- Number of arbitrage opportunities found
- Average profit margin
- Scan duration
- API error rates
- WebSocket connection count

## Maintenance

### Daily Tasks

- Monitor logs for errors
- Check scan success rate
- Verify WebSocket connections

### Weekly Tasks

- Review and update API keys if needed
- Check for dependency updates
- Review arbitrage detection accuracy

### Monthly Tasks

- Analyze platform API changes
- Update documentation
- Review and optimize performance
- Update dependencies
