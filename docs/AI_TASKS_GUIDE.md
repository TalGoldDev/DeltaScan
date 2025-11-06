# DeltaScan - AI Assistant Task Guide

This document provides guidance for AI assistants working on the DeltaScan project. It outlines common tasks, where to find relevant code, and how to approach different types of changes.

## Understanding the Codebase

### Quick Reference Map

**Shared Package** (`packages/shared/`):
- Type definitions: `src/types/`
- Calculation utilities: `src/utils/calculations.ts`
- Constants and config: `src/constants/`

**Server Package** (`packages/server/`):
- Entry point: `src/index.ts`
- API routes: `src/routes/`
- Controllers: `src/controllers/`
- Services: `src/services/`
- Configuration: `src/config/`
- Middleware: `src/middleware/`

**Client Package** (`packages/client/`):
- Entry point: `src/main.tsx`
- App setup: `src/App.tsx`
- Pages: `src/pages/`
- Components: `src/components/`
- API client: `src/services/api.ts`
- WebSocket: `src/services/websocket.ts`
- State: `src/store/`
- Hooks: `src/hooks/`

## Common AI Tasks

### Task 1: Add a New API Endpoint

**Scenario**: Add endpoint to get market details by ID

**Steps**:

1. **Define response type** (if needed):
   ```typescript
   // packages/shared/src/types/api.ts
   export const GetMarketResponseSchema = ApiResponseSchema(MarketSchema);
   export type GetMarketResponse = z.infer<typeof GetMarketResponseSchema>;
   ```

2. **Add controller method**:
   ```typescript
   // packages/server/src/controllers/marketController.ts
   export const getMarketById = asyncHandler(async (req: Request, res: Response) => {
     const { marketId } = req.params;
     const market = scannerService.getMarkets().find(m => m.id === marketId);

     if (!market) {
       throw new AppError(404, 'Market not found');
     }

     res.json({
       success: true,
       data: market,
       timestamp: new Date(),
     });
   });
   ```

3. **Add route**:
   ```typescript
   // packages/server/src/routes/index.ts
   router.get('/markets/:marketId', marketController.getMarketById);
   ```

4. **Add client API method**:
   ```typescript
   // packages/client/src/services/api.ts
   export const marketApi = {
     getMarketById: async (marketId: string): Promise<GetMarketResponse> => {
       const response = await api.get(`/markets/${marketId}`);
       return response.data;
     },
   };
   ```

### Task 2: Add a New UI Component

**Scenario**: Create a MarketList component

**Steps**:

1. **Create component file**:
   ```typescript
   // packages/client/src/components/MarketList.tsx
   import type { Market } from '@deltascan/shared';

   interface MarketListProps {
     markets: Market[];
   }

   export const MarketList: React.FC<MarketListProps> = ({ markets }) => {
     return (
       <div className="space-y-4">
         {markets.map(market => (
           <div key={market.id} className="border rounded p-4">
             <h3 className="font-semibold">{market.title}</h3>
             <p className="text-sm text-gray-600">{market.platform}</p>
           </div>
         ))}
       </div>
     );
   };
   ```

2. **Use in page**:
   ```typescript
   // packages/client/src/pages/Dashboard.tsx
   import { MarketList } from '../components/MarketList';

   // In component:
   <MarketList markets={markets} />
   ```

### Task 3: Modify Arbitrage Detection Logic

**Scenario**: Change minimum profit threshold

**Steps**:

1. **Update constant**:
   ```typescript
   // packages/shared/src/constants/index.ts
   export const ARBITRAGE_CONFIG = {
     MIN_PROFIT_MARGIN: 3, // Changed from 2
   };
   ```

2. **Use in detection**:
   ```typescript
   // packages/server/src/services/MarketScannerService.ts
   import { ARBITRAGE_CONFIG } from '@deltascan/shared';

   if (profitMargin && profitMargin > ARBITRAGE_CONFIG.MIN_PROFIT_MARGIN) {
     // Create opportunity
   }
   ```

### Task 4: Add Platform Integration

**Full procedure in SOP document**, but key files:

1. `packages/shared/src/types/market.ts` - Add to enum
2. `packages/shared/src/constants/index.ts` - Add config
3. `packages/server/src/services/platforms/<Platform>Service.ts` - New file
4. `packages/server/src/services/MarketScannerService.ts` - Integrate
5. `packages/server/.env` - Add API key

### Task 5: Enhance Error Handling

**Scenario**: Add better error messages

**Server**:
```typescript
// packages/server/src/middleware/errorHandler.ts
// Modify AppError class or errorHandler function

// Usage:
throw new AppError(400, 'Invalid market ID format', true);
```

**Client**:
```typescript
// packages/client/src/hooks/useArbitrage.ts
onError: (error: Error) => {
  const message = error.response?.data?.error || error.message;
  setError(message);
  // Show notification
}
```

### Task 6: Add WebSocket Event

**Scenario**: Add market update event

**Steps**:

1. **Add event constant**:
   ```typescript
   // packages/shared/src/constants/index.ts
   export const WS_EVENTS = {
     // ... existing
     MARKET_UPDATE: 'market:update',
   };
   ```

2. **Emit from server**:
   ```typescript
   // packages/server/src/index.ts or service
   io.to('markets').emit(WS_EVENTS.MARKET_UPDATE, updatedMarket);
   ```

3. **Listen on client**:
   ```typescript
   // packages/client/src/services/websocket.ts
   this.socket.on(WS_EVENTS.MARKET_UPDATE, (data: Market) => {
     this.emit(WS_EVENTS.MARKET_UPDATE, data);
   });
   ```

4. **React to event**:
   ```typescript
   // packages/client/src/hooks/useMarkets.ts
   useEffect(() => {
     const handleUpdate = (market: Market) => {
       // Update state
     };
     wsService.on(WS_EVENTS.MARKET_UPDATE, handleUpdate);
     return () => wsService.off(WS_EVENTS.MARKET_UPDATE, handleUpdate);
   }, []);
   ```

### Task 7: Add Data Persistence

**Scenario**: Add database for markets

**Recommended approach**:

1. Install Prisma or TypeORM
2. Create schema/models
3. Add database service layer
4. Update MarketScannerService to use database
5. Add migrations
6. Update configuration

**Key files**:
- `packages/server/src/db/` - Database code
- `packages/server/prisma/` - Prisma schema
- `packages/server/src/services/DatabaseService.ts` - DB abstraction
- `packages/server/src/config/index.ts` - DB connection string

## Debugging Guide

### Server Issues

1. **Check logs**:
   - Look for Winston log output in console
   - Check error messages and stack traces

2. **Common issues**:
   - Missing environment variables → Check `.env`
   - API errors → Check API keys and platform status
   - Type errors → Run `npm run type-check`

3. **Debugging tools**:
   - Add `logger.debug()` statements
   - Use VS Code debugger with `tsx` watch mode
   - Check network tab for API calls

### Client Issues

1. **Check browser console**:
   - Look for errors and warnings
   - Check network tab for failed requests

2. **Common issues**:
   - WebSocket not connecting → Check server URL in `.env`
   - API errors → Check CORS and proxy config
   - Type errors → Run `npm run type-check`

3. **Debugging tools**:
   - React DevTools
   - Console.log in components
   - Network tab for API/WebSocket
   - TanStack Query DevTools (can be added)

## Code Quality Guidelines

### TypeScript

- Always define types, avoid `any`
- Use Zod schemas for runtime validation
- Leverage type inference when possible
- Use utility types (`Pick`, `Omit`, `Partial`)

### React

- Use functional components
- Use hooks for state and effects
- Extract logic to custom hooks
- Keep components small and focused
- Use TypeScript for props

### Error Handling

- Use try/catch in async code
- Throw AppError on server
- Log errors appropriately
- Provide user-friendly messages

### Performance

- Memoize expensive calculations
- Use React.memo for expensive components
- Implement pagination for large lists
- Use WebSocket for real-time updates
- Cache API responses with React Query

## Testing Strategy

### Unit Tests (To Be Implemented)

**Server**:
- Test calculation functions
- Test data transformations
- Test API endpoints
- Test error handling

**Client**:
- Test components
- Test hooks
- Test utilities
- Test state management

**Shared**:
- Test calculation functions
- Test validators

### Integration Tests (To Be Implemented)

- Test full API flow
- Test WebSocket communication
- Test platform integration
- Test arbitrage detection

## Performance Optimization

### Backend

1. **Caching**:
   - Cache API responses
   - Use Redis for distributed cache
   - Implement request deduplication

2. **Database**:
   - Add indexes
   - Use connection pooling
   - Implement query optimization

3. **API**:
   - Implement rate limiting
   - Use compression
   - Add pagination

### Frontend

1. **Rendering**:
   - Use React.memo
   - Implement virtualization for long lists
   - Lazy load routes and components

2. **Data**:
   - Cache with React Query
   - Debounce search inputs
   - Implement optimistic updates

3. **Assets**:
   - Code splitting
   - Image optimization
   - Bundle size optimization

## Security Considerations

### API Keys

- Never commit to git
- Use environment variables
- Rotate regularly
- Implement key validation

### Input Validation

- Validate all inputs with Zod
- Sanitize user input
- Implement rate limiting
- Use CORS properly

### Authentication (Future)

- Implement JWT tokens
- Use secure HTTP-only cookies
- Add role-based access control
- Implement refresh tokens

## Future Enhancements

Potential tasks for AI assistants:

1. **Database Integration**: Add PostgreSQL with Prisma
2. **Authentication**: Implement user login and API keys
3. **Advanced Analytics**: Charts, trends, historical data
4. **Notifications**: Email/SMS alerts for opportunities
5. **Trading Integration**: Auto-execute trades (requires careful consideration)
6. **Machine Learning**: Predict opportunity likelihood
7. **Mobile App**: React Native client
8. **Admin Panel**: Manage platforms, view logs
9. **Testing Suite**: Comprehensive unit and integration tests
10. **Docker**: Containerize application

## Getting Help

When stuck:

1. Read the relevant documentation file
2. Check TypeScript types and interfaces
3. Look at existing similar code
4. Review error messages carefully
5. Check environment configuration
6. Verify API keys and endpoints
7. Test each layer independently

## Quick Commands Reference

```bash
# Development
npm run dev              # Start both client and server
npm run dev:client       # Start client only
npm run dev:server       # Start server only

# Build
npm run build            # Build all packages
npm run build:client     # Build client only
npm run build:server     # Build server only

# Quality
npm run type-check       # Check TypeScript
npm run lint             # Run linters
npm run test             # Run tests

# Other
npm run clean            # Clean build artifacts
```

Remember: The monorepo structure means changes to `shared` package require rebuilding before they're available to client/server in production builds (not necessary in dev mode with TypeScript project references).
