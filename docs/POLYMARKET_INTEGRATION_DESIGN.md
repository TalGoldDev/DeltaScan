# Polymarket Integration - Design Document

## Executive Summary

This document outlines the comprehensive design for integrating Polymarket's Gamma API into DeltaScan to fetch, process, and display prediction market data for arbitrage detection.

## Research Findings

### Polymarket API Structure

Polymarket provides two main APIs:

1. **Gamma API** (Market Metadata)
   - Base URL: `https://gamma-api.polymarket.com`
   - Purpose: Market metadata, categorization, volume, events
   - Access: Read-only, public
   - No authentication required for reading

2. **CLOB API** (Central Limit Order Book)
   - Base URL: `https://clob.polymarket.com`
   - Purpose: Order book, trading, real-time prices
   - Requires authentication for trading (read-only is public)

### Key Endpoints

#### Gamma API Endpoints

1. **Markets Endpoint**: `/markets`
   - Returns all markets with metadata
   - Supports filtering, pagination, sorting
   - Query parameters:
     - `limit`: Number of results (default: 100)
     - `offset`: Pagination offset
     - `closed`: Filter by closed status (true/false)
     - `archived`: Filter archived markets
     - `active`: Filter active markets
     - `order`: Sort field
     - `ascending`: Sort direction

2. **Events Endpoint**: `/events`
   - Returns events (groupings of markets)
   - Preferred for fetching trending/popular markets
   - Query parameters:
     - `limit`, `offset`: Pagination
     - `closed`: Filter closed events
     - `order`: Sort by field (id, end_date_iso, etc.)
     - `ascending`: Sort direction

3. **Market by ID**: `/markets/{market_id}`
   - Get specific market details

### Data Structure

#### Market Object Fields (from research)

**Core Identification**:
- `id`: Unique market identifier
- `question_id`: Question identifier
- `condition_id`: On-chain condition ID
- `market_slug`: URL-friendly identifier

**Market Question**:
- `question`: The prediction question
- `description`: Detailed description
- `outcomes`: Array of possible outcomes (e.g., ["Yes", "No"])

**Status & Timing**:
- `active`: Is market active (boolean)
- `closed`: Is market closed (boolean)
- `archived`: Is market archived (boolean)
- `accepting_orders`: Can accept new orders (boolean)
- `end_date_iso`: Market close date (ISO string)
- `game_start_time`: Event start time (ISO string)

**Trading Information**:
- `tokens`: Array of token objects
  - `token_id`: Token identifier
  - `outcome`: Outcome name ("Yes"/"No")
  - `price`: Current price (0-1)
  - `winner`: Is winning outcome (boolean, after resolution)
- `outcomePrices`: Stringified JSON array of prices
- `clobTokenIds`: Stringified JSON array of CLOB token IDs
- `enable_order_book`: Order book enabled (boolean)

**Volume & Liquidity**:
- `volume`: Total trading volume
- `volume_24hr`: 24-hour volume
- `liquidity`: Available liquidity

**Market Mechanics**:
- `fpmm`: Fixed Product Market Maker address
- `minimum_order_size`: Minimum order size
- `minimum_tick_size`: Minimum price increment
- `maker_base_fee`: Maker fee percentage
- `neg_risk`: Negative risk market flag
- `neg_risk_market_id`: Related neg risk market
- `neg_risk_request_id`: Neg risk request ID

**Media & Presentation**:
- `icon`: Icon URL
- `image`: Image URL
- `competitive`: Is competitive market

**Metadata**:
- `rewards`: Reward information
- `events`: Associated events
- `tags`: Categorization tags

#### Event Object Fields

**Identification**:
- `id`: Event ID
- `slug`: URL-friendly slug
- `title`: Event title
- `description`: Event description

**Markets**:
- `markets`: Array of associated markets

**Status & Timing**:
- `active`: Is event active
- `closed`: Is event closed
- `archived`: Is event archived
- `end_date_iso`: Event end date

**Metadata**:
- `tags`: Category tags
- `competitive`: Is competitive event
- `liquidity`: Total liquidity
- `volume`: Total volume

### Order Book Data (CLOB API)

For real-time pricing and arbitrage detection, we need:

1. **Best Bid/Ask Prices**: Current market prices
2. **Order Book Depth**: Available liquidity at each price
3. **Last Trades**: Recent trade history

CLOB endpoints:
- `GET /price?token_id={token_id}`: Get current price
- `GET /book?token_id={token_id}`: Get full order book
- WebSocket: `wss://ws-subscriptions-clob.polymarket.com/ws/` for real-time updates

## Arbitrage Detection Strategy

### Understanding Binary Market Pricing

In binary prediction markets:
- YES token price + NO token price should equal $1.00
- Price represents implied probability
- Example: YES at $0.60 = 60% probability

### Cross-Platform Arbitrage

**Condition for Arbitrage**:
```
If (Polymarket_YES_Price + OtherPlatform_NO_Price) < 1.00
OR (Polymarket_NO_Price + OtherPlatform_YES_Price) < 1.00
THEN arbitrage exists
```

**Profit Calculation**:
```
Total_Investment = 1.00
Cost = Polymarket_YES_Price + OtherPlatform_NO_Price
Profit = 1.00 - Cost
Profit_Margin = (Profit / Cost) * 100
```

**Example**:
- Polymarket: YES = $0.55 (55%)
- Kalshi: NO = $0.40 (60% for YES, so 40% for NO)
- Total cost: $0.55 + $0.40 = $0.95
- Guaranteed return: $1.00
- Profit: $0.05 (5.26% return)

### Data Requirements for Arbitrage

For each market, we need:

1. **Market Matching**:
   - Question/title similarity
   - Event identification
   - Resolution criteria alignment
   - Close date alignment

2. **Pricing Data**:
   - Current YES price
   - Current NO price
   - Last updated timestamp
   - Available liquidity

3. **Market Validation**:
   - Is market active?
   - Is market accepting orders?
   - Sufficient liquidity?
   - Reasonable close date?

## Service Architecture Design

### 1. Data Models Layer (`packages/shared/src/types/polymarket.ts`)

```typescript
interface PolymarketToken {
  token_id: string;
  outcome: string;
  price: number;
  winner?: boolean;
}

interface PolymarketMarket {
  id: string;
  question: string;
  description?: string;
  outcomes: string[];

  // Status
  active: boolean;
  closed: boolean;
  archived: boolean;
  accepting_orders: boolean;

  // Timing
  end_date_iso: string;
  game_start_time?: string;

  // Trading
  tokens: PolymarketToken[];
  enable_order_book: boolean;
  volume?: number;
  volume_24hr?: number;
  liquidity?: number;

  // Metadata
  market_slug: string;
  condition_id?: string;
  icon?: string;
  image?: string;

  // Parsed data
  outcomePrices?: number[];
  clobTokenIds?: string[];
}

interface PolymarketEvent {
  id: string;
  title: string;
  slug: string;
  description?: string;

  // Status
  active: boolean;
  closed: boolean;
  archived: boolean;

  // Timing
  end_date_iso?: string;

  // Markets
  markets: PolymarketMarket[];

  // Metadata
  volume?: number;
  liquidity?: number;
  competitive?: number;
  tags?: string[];
}

interface CLOBOrderBookResponse {
  market: string;
  asset_id: string;
  bids: Array<{ price: string; size: string }>;
  asks: Array<{ price: string; size: string }>;
  timestamp: number;
}
```

### 2. API Client Layer (`packages/server/src/services/polymarket/PolymarketAPIClient.ts`)

**Responsibilities**:
- HTTP client for Gamma and CLOB APIs
- Request/response handling
- Rate limiting (100 req/min for Gamma)
- Error handling and retries
- Response parsing

**Methods**:
```typescript
class PolymarketAPIClient {
  // Gamma API
  async getMarkets(params: MarketQueryParams): Promise<PolymarketMarket[]>
  async getMarketById(id: string): Promise<PolymarketMarket>
  async getEvents(params: EventQueryParams): Promise<PolymarketEvent[]>
  async getEventById(id: string): Promise<PolymarketEvent>

  // CLOB API
  async getOrderBook(tokenId: string): Promise<CLOBOrderBookResponse>
  async getPrice(tokenId: string): Promise<number>
  async getMarketPrices(marketId: string): Promise<Map<string, number>>
}
```

### 3. Data Transformation Layer (`packages/server/src/services/polymarket/PolymarketTransformer.ts`)

**Responsibilities**:
- Transform Polymarket data to our internal Market/Bet types
- Parse stringified JSON fields (outcomePrices, clobTokenIds)
- Extract YES/NO prices
- Calculate implied probabilities
- Handle edge cases (multi-outcome markets, etc.)

**Methods**:
```typescript
class PolymarketTransformer {
  transformMarket(polyMarket: PolymarketMarket): Market
  transformToBets(polyMarket: PolymarketMarket): Bet[]
  parseOutcomePrices(pricesString: string): number[]
  extractYesNoPrice(tokens: PolymarketToken[]): { yesPrice: number, noPrice: number }
}
```

### 4. Service Layer (`packages/server/src/services/polymarket/PolymarketService.ts`)

**Responsibilities**:
- High-level business logic
- Fetching trending/popular markets
- Filtering and sorting markets
- Caching strategy
- Integration with main scanner

**Methods**:
```typescript
class PolymarketService {
  // Fetch trending markets
  async getTrendingMarkets(limit: number): Promise<Market[]>

  // Fetch markets by criteria
  async getActiveMarkets(limit: number): Promise<Market[]>
  async getMarketsByVolume(limit: number): Promise<Market[]>
  async getMarketsByCategory(tags: string[], limit: number): Promise<Market[]>

  // Get detailed market data with order book
  async getMarketWithPricing(marketId: string): Promise<{ market: Market, bets: Bet[] }>

  // Batch operations
  async getMarketsWithPricing(marketIds: string[]): Promise<Map<string, { market: Market, bets: Bet[] }>>

  // Utility
  async isMarketSuitableForArbitrage(market: Market): Promise<boolean>
}
```

### 5. Market Matching Service (`packages/server/src/services/MarketMatchingService.ts`)

**Responsibilities**:
- Match markets across platforms
- Compare questions/titles
- Validate same event
- Align close dates

**Methods**:
```typescript
class MarketMatchingService {
  // Find matching markets
  findMatchingMarkets(
    polymarketMarket: Market,
    otherPlatformMarkets: Market[]
  ): Market[]

  // Calculate similarity score
  calculateSimilarity(market1: Market, market2: Market): number

  // Validate match
  validateMatch(market1: Market, market2: Market): boolean
}
```

## Implementation Strategy

### Phase 1: Core Integration (High Priority)

1. **Create Polymarket Types** (`packages/shared/src/types/polymarket.ts`)
   - Define all Polymarket-specific interfaces
   - Add validation schemas with Zod

2. **Create API Client** (`packages/server/src/services/polymarket/PolymarketAPIClient.ts`)
   - Implement Gamma API calls
   - Add rate limiting
   - Add error handling

3. **Create Transformer** (`packages/server/src/services/polymarket/PolymarketTransformer.ts`)
   - Transform Polymarket data to internal types
   - Handle edge cases

4. **Create Service** (`packages/server/src/services/polymarket/PolymarketService.ts`)
   - Implement business logic
   - Add caching

5. **Update Scanner** (`packages/server/src/services/MarketScannerService.ts`)
   - Integrate Polymarket service
   - Add to scan cycle

### Phase 2: Enhanced Features (Medium Priority)

1. **Add CLOB Integration**
   - Real-time pricing
   - Order book data
   - Better liquidity information

2. **Market Matching**
   - Cross-platform matching
   - Similarity algorithms

3. **Enhanced UI**
   - Display market details
   - Show market metadata (images, descriptions)
   - Filter by category

### Phase 3: Advanced Features (Low Priority)

1. **WebSocket Integration**
   - Real-time price updates
   - Live market changes

2. **Historical Data**
   - Price history
   - Volume trends

3. **Advanced Analytics**
   - Market trends
   - Category performance

## API Rate Limiting Strategy

Polymarket Gamma API: 100 requests/minute

**Strategy**:
- Use queue with rate limiter
- Batch requests where possible
- Cache results (5-minute TTL for active markets)
- Use events endpoint instead of individual market calls
- Implement exponential backoff on errors

**Implementation**:
```typescript
class RateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private requestsThisMinute = 0;
  private maxRequestsPerMinute = 100;

  async enqueue<T>(request: () => Promise<T>): Promise<T>
}
```

## Caching Strategy

**In-Memory Cache**:
- Active markets: 5-minute TTL
- Closed markets: 1-hour TTL
- Event data: 10-minute TTL

**Cache Keys**:
- `polymarket:markets:active`
- `polymarket:markets:{id}`
- `polymarket:events:{id}`
- `polymarket:prices:{token_id}`

## Error Handling

**Error Categories**:

1. **Network Errors**: Retry with exponential backoff
2. **Rate Limit Errors**: Queue and wait
3. **Invalid Data**: Log and skip
4. **API Errors**: Log and notify

**Error Response**:
```typescript
interface APIError {
  code: string;
  message: string;
  details?: any;
  retryable: boolean;
}
```

## Testing Strategy

### Unit Tests

1. **API Client Tests**:
   - Mock HTTP responses
   - Test error handling
   - Test rate limiting

2. **Transformer Tests**:
   - Test data transformation
   - Test edge cases
   - Test validation

3. **Service Tests**:
   - Test business logic
   - Test caching
   - Test filtering

### Integration Tests

1. **Live API Tests**:
   - Test with real API (limited)
   - Validate response structure
   - Test error scenarios

2. **End-to-End Tests**:
   - Full scan cycle
   - Arbitrage detection
   - UI display

## UI/UX Design

### Market Display Components

1. **MarketCard Component**:
   - Market question
   - Current prices (YES/NO)
   - 24hr volume
   - Liquidity
   - End date
   - Market image/icon
   - Link to Polymarket

2. **MarketDetail Component**:
   - Full description
   - Price chart
   - Order book
   - Historical prices
   - Related markets

3. **MarketFilter Component**:
   - Filter by category
   - Filter by volume
   - Filter by end date
   - Sort options

4. **MarketComparison Component**:
   - Side-by-side comparison
   - Highlight differences
   - Show arbitrage opportunity

### Dashboard Enhancements

1. **Trending Markets Section**:
   - Top markets by volume
   - Recently active markets
   - Featured markets

2. **Category Browser**:
   - Browse by category/tag
   - Category statistics
   - Popular categories

3. **Market Search**:
   - Search by question
   - Filter results
   - Autocomplete

## Performance Considerations

### Optimization Strategies

1. **Parallel Fetching**:
   - Fetch multiple markets concurrently
   - Use Promise.all() for batch operations
   - Limit concurrent requests (max 10)

2. **Efficient Pagination**:
   - Fetch in batches of 100
   - Process incrementally
   - Stop when sufficient data

3. **Smart Caching**:
   - Cache frequently accessed data
   - Invalidate on updates
   - Use stale-while-revalidate pattern

4. **Data Prioritization**:
   - Fetch trending markets first
   - Defer less important data
   - Load on demand

## Security Considerations

1. **API Key Management** (if needed later):
   - Store in environment variables
   - Never log or expose
   - Rotate regularly

2. **Input Validation**:
   - Validate all API responses
   - Sanitize before displaying
   - Handle malicious data

3. **Rate Limit Protection**:
   - Respect API limits
   - Implement client-side limiting
   - Monitor usage

## Monitoring & Logging

### Metrics to Track

1. **API Metrics**:
   - Request count
   - Error rate
   - Response times
   - Rate limit hits

2. **Data Metrics**:
   - Markets fetched
   - Arbitrage opportunities found
   - Average profit margins

3. **System Metrics**:
   - Cache hit rate
   - Memory usage
   - Scan duration

### Logging

```typescript
logger.info('Fetching Polymarket markets', { limit, filters });
logger.debug('Market data', { marketId, question, prices });
logger.error('API error', { error, endpoint, retryCount });
logger.warn('Rate limit approaching', { requestsRemaining });
```

## Next Steps

### Immediate Actions

1. ✅ Create this design document
2. ⏳ Implement Polymarket types
3. ⏳ Implement API client
4. ⏳ Implement transformer
5. ⏳ Implement service
6. ⏳ Update scanner
7. ⏳ Create UI components
8. ⏳ Test integration

### Future Enhancements

- Add more platforms (Kalshi, Manifold, PredictIt)
- Implement market matching algorithm
- Add WebSocket for real-time updates
- Create advanced analytics
- Implement notification system

## References

- Polymarket Gamma API: https://gamma-api.polymarket.com/
- Polymarket Docs: https://docs.polymarket.com/
- Polymarket Agents: https://github.com/Polymarket/agents
- CLOB API: https://clob.polymarket.com/

## Appendix A: Example API Responses

### Example Market Response

```json
{
  "id": "1234",
  "question": "Will Bitcoin reach $100,000 by end of 2025?",
  "description": "This market resolves YES if...",
  "outcomes": ["Yes", "No"],
  "active": true,
  "closed": false,
  "archived": false,
  "accepting_orders": true,
  "end_date_iso": "2025-12-31T23:59:59Z",
  "tokens": [
    {
      "token_id": "12345",
      "outcome": "Yes",
      "price": 0.45
    },
    {
      "token_id": "12346",
      "outcome": "No",
      "price": 0.55
    }
  ],
  "enable_order_book": true,
  "volume": 1250000,
  "volume_24hr": 50000,
  "liquidity": 100000,
  "market_slug": "bitcoin-100k-2025",
  "icon": "https://...",
  "image": "https://..."
}
```

### Example Event Response

```json
{
  "id": "event-123",
  "title": "2024 Presidential Election",
  "slug": "2024-presidential-election",
  "description": "Markets related to the 2024 US Presidential Election",
  "active": true,
  "closed": false,
  "markets": [
    { /* market objects */ }
  ],
  "tags": ["Politics", "Elections"],
  "volume": 5000000,
  "liquidity": 500000
}
```

## Appendix B: Arbitrage Calculation Examples

### Example 1: Simple Arbitrage

**Polymarket**:
- Question: "Will Team A win?"
- YES: $0.52
- NO: $0.48

**Kalshi**:
- Question: "Will Team A win?"
- YES: $0.60
- NO: $0.40

**Arbitrage**:
- Buy NO on Polymarket: $0.48
- Buy YES on Kalshi: $0.60
- Total Cost: $1.08 (NO ARBITRAGE - costs more than $1)

Alternative:
- Buy YES on Polymarket: $0.52
- Buy NO on Kalshi: $0.40
- Total Cost: $0.92
- Guaranteed Return: $1.00
- Profit: $0.08 (8.7% return)

### Example 2: Cross-Platform Arbitrage

**Platform Comparison**:

| Platform | YES Price | NO Price | Implied Total |
|----------|-----------|----------|---------------|
| Polymarket | $0.55 | $0.45 | $1.00 |
| Kalshi | $0.62 | $0.38 | $1.00 |

**Arbitrage Opportunity**:
- Buy YES on Polymarket: $0.55
- Buy NO on Kalshi: $0.38
- Total Cost: $0.93
- Profit: $0.07 (7.5% return)

### Example 3: No Arbitrage

**Platform Comparison**:

| Platform | YES Price | NO Price |
|----------|-----------|----------|
| Polymarket | $0.55 | $0.45 |
| Kalshi | $0.53 | $0.47 |

**Analysis**:
- Option 1: Poly YES + Kalshi NO = $0.55 + $0.47 = $1.02 (LOSS)
- Option 2: Poly NO + Kalshi YES = $0.45 + $0.53 = $0.98 (PROFIT $0.02, but 2% might be below threshold)

This represents a marginal opportunity that may not be worth pursuing after fees.

---

**Document Version**: 1.0
**Last Updated**: 2025-11-06
**Author**: AI Assistant
**Status**: Ready for Implementation
