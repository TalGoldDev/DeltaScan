# Polymarket Integration - Implementation Plan

## Overview

This document provides a clear, step-by-step implementation plan for integrating Polymarket into DeltaScan based on the comprehensive research and design.

## Research Summary

### Key Findings

✅ **API Structure**:
- **Gamma API**: `https://gamma-api.polymarket.com` - Market metadata (no auth needed)
- **CLOB API**: `https://clob.polymarket.com` - Order book and pricing (public read access)
- Rate Limit: 100 requests/minute

✅ **Best Endpoints for Trending Markets**:
- `/events?closed=false&order=volume&ascending=false&limit=100` - Get events by volume
- `/markets?active=true&closed=false&order=volume&ascending=false&limit=100` - Get markets by volume

✅ **Key Data Points**:
- Market question, outcomes, status (active/closed)
- Token prices for YES/NO outcomes
- Volume (24hr and total)
- Liquidity available
- End date and timing
- Market metadata (images, descriptions, categories)

✅ **Arbitrage Detection**:
- For arbitrage: `YES_price_platform1 + NO_price_platform2 < $1.00`
- Need to match markets across platforms by question similarity
- Require sufficient liquidity and aligned close dates

## Architecture Design

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT (React)                          │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐ │
│  │ MarketList     │  │ MarketCard     │  │ MarketDetail │ │
│  │ Component      │  │ Component      │  │ Component    │ │
│  └────────────────┘  └────────────────┘  └──────────────┘ │
│           │                   │                  │          │
│           └───────────────────┴──────────────────┘          │
│                              │                              │
│                    ┌─────────▼─────────┐                   │
│                    │   API Client      │                   │
│                    │  (services/api)   │                   │
│                    └─────────┬─────────┘                   │
└──────────────────────────────┼─────────────────────────────┘
                               │ HTTP/WebSocket
┌──────────────────────────────▼─────────────────────────────┐
│                     SERVER (Express)                        │
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │         Market Scanner Service                     │   │
│  │  (Orchestrates scanning across platforms)          │   │
│  └──────────────┬─────────────────────────────────────┘   │
│                 │                                           │
│     ┌───────────┼───────────┬──────────────┐              │
│     │           │            │              │              │
│  ┌──▼────┐  ┌──▼────┐  ┌───▼───┐  ┌──────▼─────┐        │
│  │Poly   │  │Kalshi │  │Manifold│  │PredictIt   │        │
│  │market │  │Service│  │Service │  │Service     │        │
│  │Service│  │       │  │        │  │            │        │
│  └───┬───┘  └───────┘  └────────┘  └────────────┘        │
│      │                                                      │
│  ┌───▼────────────────────────────┐                       │
│  │  Polymarket API Client         │                       │
│  │  • Gamma API (metadata)        │                       │
│  │  • CLOB API (order book)       │                       │
│  │  • Rate limiting               │                       │
│  │  • Caching                     │                       │
│  └───┬────────────────────────────┘                       │
│      │                                                      │
│  ┌───▼────────────────────────────┐                       │
│  │  Polymarket Transformer        │                       │
│  │  • Parse API responses         │                       │
│  │  • Transform to internal types │                       │
│  │  • Extract YES/NO prices       │                       │
│  └────────────────────────────────┘                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  SHARED TYPES                               │
│  • Market, Bet, ArbitrageOpportunity (existing)            │
│  • PolymarketMarket, PolymarketEvent (new)                 │
│  • Transformation utilities                                 │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Phases

### Phase 1: Foundation (Core Integration)
**Goal**: Fetch and display Polymarket markets

#### Step 1.1: Create Polymarket Types
**File**: `packages/shared/src/types/polymarket.ts`

**Tasks**:
- [ ] Define `PolymarketToken` interface
- [ ] Define `PolymarketMarket` interface
- [ ] Define `PolymarketEvent` interface
- [ ] Define `CLOBOrderBook` interface
- [ ] Add Zod schemas for validation
- [ ] Export types from shared package

**Estimated Time**: 30 minutes

#### Step 1.2: Create API Client
**File**: `packages/server/src/services/polymarket/PolymarketAPIClient.ts`

**Tasks**:
- [ ] Set up Axios instance with base URL
- [ ] Implement `getMarkets()` method
- [ ] Implement `getEvents()` method
- [ ] Implement `getMarketById()` method
- [ ] Add query parameter building
- [ ] Add error handling
- [ ] Add response logging

**Estimated Time**: 1 hour

#### Step 1.3: Create Rate Limiter
**File**: `packages/server/src/services/polymarket/RateLimiter.ts`

**Tasks**:
- [ ] Create rate limiter class
- [ ] Implement queue mechanism
- [ ] Track requests per minute
- [ ] Add wait/delay logic
- [ ] Add metrics logging

**Estimated Time**: 45 minutes

#### Step 1.4: Create Transformer
**File**: `packages/server/src/services/polymarket/PolymarketTransformer.ts`

**Tasks**:
- [ ] Parse stringified JSON fields (outcomePrices, clobTokenIds)
- [ ] Transform PolymarketMarket to internal Market type
- [ ] Transform PolymarketMarket to Bet array
- [ ] Extract YES/NO prices
- [ ] Calculate display prices (percentage)
- [ ] Handle edge cases (multi-outcome, missing data)

**Estimated Time**: 1 hour

#### Step 1.5: Create Polymarket Service
**File**: `packages/server/src/services/polymarket/PolymarketService.ts`

**Tasks**:
- [ ] Initialize API client and rate limiter
- [ ] Implement `getTrendingMarkets()` method
- [ ] Implement `getActiveMarkets()` method
- [ ] Implement `getMarketsByVolume()` method
- [ ] Add caching logic (in-memory)
- [ ] Add market filtering (active, not closed, has liquidity)
- [ ] Add logging

**Estimated Time**: 1.5 hours

#### Step 1.6: Update Market Scanner
**File**: `packages/server/src/services/MarketScannerService.ts`

**Tasks**:
- [ ] Import PolymarketService
- [ ] Update `scanPolymarket()` method
- [ ] Fetch markets using service
- [ ] Store markets in map
- [ ] Generate bets from markets
- [ ] Store bets in map
- [ ] Add error handling
- [ ] Add logging

**Estimated Time**: 45 minutes

#### Step 1.7: Update API Endpoints
**File**: `packages/server/src/routes/index.ts`

**Tasks**:
- [ ] Add `/api/markets/trending` endpoint
- [ ] Add `/api/markets/:marketId` endpoint
- [ ] Return proper response format
- [ ] Add error handling

**Estimated Time**: 30 minutes

#### Step 1.8: Test Integration
**Tasks**:
- [ ] Start server
- [ ] Trigger manual scan
- [ ] Verify markets are fetched
- [ ] Check logs for errors
- [ ] Verify data transformation
- [ ] Test API endpoints

**Estimated Time**: 1 hour

**Phase 1 Total**: ~7 hours

### Phase 2: Enhanced UI (Display Markets)
**Goal**: Display Polymarket markets beautifully in the UI

#### Step 2.1: Create Market Card Component
**File**: `packages/client/src/components/MarketCard.tsx`

**Tasks**:
- [ ] Design card layout
- [ ] Display market question
- [ ] Display YES/NO prices
- [ ] Display volume and liquidity
- [ ] Display end date
- [ ] Add market image/icon
- [ ] Add link to Polymarket
- [ ] Make responsive

**Estimated Time**: 1 hour

#### Step 2.2: Create Market List Component
**File**: `packages/client/src/components/MarketList.tsx`

**Tasks**:
- [ ] Create grid layout
- [ ] Map markets to MarketCard
- [ ] Add loading state
- [ ] Add empty state
- [ ] Add error state
- [ ] Add pagination (if needed)

**Estimated Time**: 45 minutes

#### Step 2.3: Create Markets Page
**File**: `packages/client/src/pages/Markets.tsx`

**Tasks**:
- [ ] Fetch markets using React Query
- [ ] Display MarketList
- [ ] Add filtering options
- [ ] Add sorting options
- [ ] Add search functionality
- [ ] Add category filter

**Estimated Time**: 1.5 hours

#### Step 2.4: Update Navigation
**File**: `packages/client/src/App.tsx`

**Tasks**:
- [ ] Add route for Markets page
- [ ] Update navigation menu
- [ ] Add link to Markets

**Estimated Time**: 15 minutes

#### Step 2.5: Create Market API Hooks
**File**: `packages/client/src/hooks/useMarkets.ts`

**Tasks**:
- [ ] Create `useMarkets()` hook
- [ ] Create `useMarket(id)` hook
- [ ] Add React Query configuration
- [ ] Add error handling

**Estimated Time**: 30 minutes

**Phase 2 Total**: ~4 hours

### Phase 3: CLOB Integration (Real-Time Pricing)
**Goal**: Get accurate, real-time prices from order book

#### Step 3.1: Add CLOB Client Methods
**File**: `packages/server/src/services/polymarket/PolymarketAPIClient.ts`

**Tasks**:
- [ ] Add CLOB base URL
- [ ] Implement `getOrderBook(tokenId)` method
- [ ] Implement `getPrice(tokenId)` method
- [ ] Implement `getMarketPrices(tokenIds[])` method
- [ ] Add error handling

**Estimated Time**: 45 minutes

#### Step 3.2: Update Polymarket Service
**File**: `packages/server/src/services/polymarket/PolymarketService.ts`

**Tasks**:
- [ ] Add `getMarketWithPricing(marketId)` method
- [ ] Fetch order book data for tokens
- [ ] Calculate best bid/ask prices
- [ ] Update bet prices with CLOB data
- [ ] Add caching for prices (1-minute TTL)

**Estimated Time**: 1 hour

#### Step 3.3: Update Scanner to Use CLOB Prices
**File**: `packages/server/src/services/MarketScannerService.ts`

**Tasks**:
- [ ] Optionally fetch CLOB prices for active markets
- [ ] Update bet prices with real-time data
- [ ] Add configuration flag for CLOB usage

**Estimated Time**: 30 minutes

**Phase 3 Total**: ~2 hours

### Phase 4: Enhanced Arbitrage Detection
**Goal**: Better arbitrage detection with market matching

#### Step 4.1: Create Market Matching Service
**File**: `packages/server/src/services/MarketMatchingService.ts`

**Tasks**:
- [ ] Implement text similarity algorithm
- [ ] Create `calculateSimilarity(market1, market2)` method
- [ ] Create `findMatchingMarkets()` method
- [ ] Add date alignment validation
- [ ] Add outcome validation

**Estimated Time**: 2 hours

#### Step 4.2: Update Arbitrage Detection
**File**: `packages/server/src/services/MarketScannerService.ts`

**Tasks**:
- [ ] Use MarketMatchingService for finding matches
- [ ] Only compare matched markets
- [ ] Add confidence scoring
- [ ] Filter by minimum similarity threshold

**Estimated Time**: 1 hour

#### Step 4.3: Enhanced Arbitrage Display
**File**: `packages/client/src/components/ArbitrageCard.tsx`

**Tasks**:
- [ ] Show market questions for both sides
- [ ] Display similarity score
- [ ] Show market metadata
- [ ] Add links to both markets
- [ ] Show detailed calculation

**Estimated Time**: 1 hour

**Phase 4 Total**: ~4 hours

## File Structure (After Implementation)

```
packages/
├── shared/
│   └── src/
│       ├── types/
│       │   ├── market.ts (existing)
│       │   ├── api.ts (existing)
│       │   └── polymarket.ts (NEW)
│       └── utils/
│           └── calculations.ts (existing)
│
├── server/
│   └── src/
│       ├── services/
│       │   ├── MarketScannerService.ts (UPDATE)
│       │   ├── MarketMatchingService.ts (NEW)
│       │   └── polymarket/
│       │       ├── PolymarketAPIClient.ts (NEW)
│       │       ├── PolymarketTransformer.ts (NEW)
│       │       ├── PolymarketService.ts (NEW)
│       │       └── RateLimiter.ts (NEW)
│       ├── routes/
│       │   └── index.ts (UPDATE)
│       └── controllers/
│           └── marketController.ts (UPDATE)
│
└── client/
    └── src/
        ├── components/
        │   ├── MarketCard.tsx (NEW)
        │   ├── MarketList.tsx (NEW)
        │   ├── MarketDetail.tsx (NEW)
        │   └── ArbitrageCard.tsx (UPDATE)
        ├── pages/
        │   ├── Markets.tsx (NEW)
        │   └── Dashboard.tsx (UPDATE)
        ├── hooks/
        │   └── useMarkets.ts (NEW)
        └── services/
            └── api.ts (UPDATE)
```

## Testing Checklist

### API Testing
- [ ] Gamma API: Fetch markets successfully
- [ ] Gamma API: Fetch events successfully
- [ ] Gamma API: Handle rate limiting
- [ ] Gamma API: Handle errors
- [ ] CLOB API: Fetch order book
- [ ] CLOB API: Fetch prices
- [ ] Rate limiter works correctly
- [ ] Caching works correctly

### Data Testing
- [ ] Markets are transformed correctly
- [ ] Bets are created correctly
- [ ] YES/NO prices are extracted correctly
- [ ] Stringified JSON is parsed correctly
- [ ] Edge cases handled (multi-outcome, missing data)

### Integration Testing
- [ ] Market scanner fetches Polymarket data
- [ ] Markets are stored correctly
- [ ] Bets are stored correctly
- [ ] API endpoints return correct data
- [ ] Arbitrage detection works

### UI Testing
- [ ] Markets display correctly
- [ ] Market cards look good
- [ ] Filtering works
- [ ] Sorting works
- [ ] Loading states work
- [ ] Error states work
- [ ] Links to Polymarket work
- [ ] Responsive design works

## Configuration

### Environment Variables

Add to `packages/server/.env`:
```env
# Polymarket Configuration
POLYMARKET_API_URL=https://gamma-api.polymarket.com
POLYMARKET_CLOB_URL=https://clob.polymarket.com
POLYMARKET_RATE_LIMIT=100
POLYMARKET_CACHE_TTL_SECONDS=300
POLYMARKET_ENABLE_CLOB=true
```

### Constants

Add to `packages/shared/src/constants/index.ts`:
```typescript
export const POLYMARKET_CONFIG = {
  GAMMA_API_URL: 'https://gamma-api.polymarket.com',
  CLOB_API_URL: 'https://clob.polymarket.com',
  RATE_LIMIT: 100, // requests per minute
  CACHE_TTL: 300, // 5 minutes
  DEFAULT_MARKET_LIMIT: 100,
  MIN_LIQUIDITY: 1000, // $1000 minimum liquidity
  MIN_VOLUME_24HR: 500, // $500 minimum 24hr volume
};
```

## Success Metrics

After implementation, we should see:

1. **Markets Fetched**: 100+ active Polymarket markets
2. **Data Quality**: All markets have valid prices, volumes, and metadata
3. **Performance**: Scan completes in < 30 seconds
4. **UI**: Markets display beautifully with images and details
5. **Arbitrage**: Detected opportunities (if any exist in market)

## Risk Mitigation

### Potential Issues and Solutions

1. **Rate Limiting**:
   - **Risk**: Hitting API rate limits
   - **Solution**: Implement queue-based rate limiter, cache aggressively

2. **Data Quality**:
   - **Risk**: Missing or malformed data
   - **Solution**: Robust parsing with fallbacks, skip bad data, log issues

3. **Performance**:
   - **Risk**: Slow scans with many markets
   - **Solution**: Parallel fetching, pagination, limit market count

4. **Market Matching**:
   - **Risk**: False positives in matching
   - **Solution**: High similarity threshold, manual validation option

5. **API Changes**:
   - **Risk**: Polymarket API changes breaking integration
   - **Solution**: Version API responses, add monitoring, graceful degradation

## Next Platform Integration

After Polymarket is stable, we can replicate this pattern for:

1. **Kalshi**: Similar structure, different API
2. **Manifold Markets**: Simpler API, less data
3. **PredictIt**: More complex, requires more parsing

Each platform follows the same pattern:
- Create types
- Create API client
- Create transformer
- Create service
- Integrate with scanner

## Timeline Estimate

**Aggressive** (Full-time focus):
- Phase 1: 1 day
- Phase 2: 1 day
- Phase 3: 0.5 day
- Phase 4: 1 day
- Testing & Polish: 0.5 day
**Total: 4 days**

**Moderate** (Part-time):
- Phase 1: 2 days
- Phase 2: 1.5 days
- Phase 3: 1 day
- Phase 4: 1.5 days
- Testing & Polish: 1 day
**Total: 7 days**

**Conservative** (Careful, thorough):
- Phase 1: 3 days
- Phase 2: 2 days
- Phase 3: 1.5 days
- Phase 4: 2 days
- Testing & Polish: 1.5 days
**Total: 10 days**

## Ready to Implement

This plan is ready for implementation. All research is complete, architecture is designed, and steps are clearly defined. We can start with Phase 1 immediately.

---

**Document Version**: 1.0
**Last Updated**: 2025-11-06
**Status**: ✅ Ready for Implementation
