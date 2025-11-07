# DeltaScan - Testing Guide

## Phase 1: Polymarket Integration - Testing Instructions

This guide provides step-by-step instructions for testing the Polymarket integration.

## Prerequisites

1. **Node.js** >= 18.0.0
2. **npm** >= 9.0.0
3. **Internet connection** (for API calls to Polymarket)

## Setup

### 1. Install Dependencies

```bash
# From project root
npm install
```

### 2. Configure Environment (Optional)

The Polymarket Gamma API doesn't require authentication for read-only access, so no API keys are needed for basic testing.

```bash
# Server config (defaults should work)
cd packages/server
cp .env.example .env
# Edit if needed, but defaults are fine for Polymarket
```

### 3. Build Shared Package

The shared package needs to be built so the server can use the types:

```bash
# From project root
cd packages/shared
npm run build
```

## Running the Server

### Option 1: Development Mode (Recommended for Testing)

```bash
# From project root
npm run dev:server
```

This starts the server with hot-reload on port 3001.

### Option 2: Build and Run

```bash
# From project root
npm run build:server
cd packages/server
npm start
```

## Testing API Endpoints

### 1. Health Check

**Test basic server health:**

```bash
curl http://localhost:3001/api/health
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-11-06T..."
  },
  "timestamp": "2025-11-06T..."
}
```

**Test Polymarket service health:**

```bash
curl http://localhost:3001/api/health/polymarket
```

**Expected Response:**
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
  },
  "timestamp": "2025-11-06T..."
}
```

### 2. Fetch Trending Markets

**Get top trending markets:**

```bash
curl "http://localhost:3001/api/markets/trending?limit=5"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "...",
        "platform": "polymarket",
        "title": "Will Bitcoin reach $100,000 by end of 2025?",
        "description": "...",
        "closeDate": "2025-12-31T...",
        "status": "active",
        "volume": 1500000,
        "liquidity": 250000,
        "url": "https://polymarket.com/event/...",
        "createdAt": "2025-11-06T...",
        "updatedAt": "2025-11-06T..."
      },
      // ... more markets
    ],
    "pagination": {
      "page": 1,
      "pageSize": 5,
      "totalPages": 1,
      "totalItems": 5
    }
  },
  "timestamp": "2025-11-06T..."
}
```

**Test with different limits:**

```bash
# Get 10 markets
curl "http://localhost:3001/api/markets/trending?limit=10"

# Get 20 markets
curl "http://localhost:3001/api/markets/trending?limit=20"
```

### 3. Fetch Active Markets

**Get active markets with minimum criteria:**

```bash
curl "http://localhost:3001/api/markets/active?limit=5"
```

This endpoint filters markets that:
- Are active and accepting orders
- Have minimum liquidity ($1,000)
- Have minimum 24hr volume ($500)

### 4. Trigger Manual Scan

**Manually trigger a full platform scan:**

```bash
curl -X POST http://localhost:3001/api/scan
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "message": "Scan completed successfully"
  },
  "timestamp": "2025-11-06T..."
}
```

**Check server logs to see:**
- Markets fetched count
- Bets created count
- Any arbitrage opportunities detected

### 5. Get All Markets (After Scan)

After running a scan, you can get all markets in memory:

```bash
curl http://localhost:3001/api/markets
```

### 6. Get Arbitrage Opportunities

```bash
curl http://localhost:3001/api/arbitrage
```

**Note:** Currently will return empty array since we only have Polymarket. Arbitrage requires multiple platforms. Will populate once other platforms are integrated.

## Verification Checklist

### ✅ Phase 1 Success Criteria

- [ ] **Server Starts**: Server starts without errors on port 3001
- [ ] **Health Check**: `/api/health` returns healthy status
- [ ] **Polymarket Health**: `/api/health/polymarket` returns healthy: true
- [ ] **Trending Markets**: Returns 5+ markets with valid data
- [ ] **Active Markets**: Returns markets meeting minimum criteria
- [ ] **Market Data Quality**:
  - [ ] All markets have valid IDs
  - [ ] Questions are populated
  - [ ] Platform is "polymarket"
  - [ ] URLs are valid Polymarket links
  - [ ] Volume and liquidity are numbers
  - [ ] Close dates are valid
- [ ] **Manual Scan**: Scan completes without errors
- [ ] **Rate Limiting**: No rate limit errors (check logs)
- [ ] **Caching**: Second request to same endpoint is faster (check logs for cache hit)
- [ ] **Logging**: Detailed logs show data flow

## Checking Logs

The server logs provide detailed information about what's happening:

**Look for these log entries:**

1. **Service Initialization:**
```
[info] MarketScannerService initialized
[info] PolymarketService initialized
[info] RateLimiter initialized
```

2. **API Requests:**
```
[debug] Gamma API Request { method: 'GET', url: '/events', params: {...} }
[debug] Gamma API Response { status: 200, url: '/events', dataLength: 50 }
```

3. **Data Transformation:**
```
[info] Transformed markets { input: 50, output: 45, skipped: 5 }
[info] Fetched trending markets { count: 20 }
```

4. **Cache Activity:**
```
[debug] Cache miss { cacheKey: 'trending_markets_20' }
[debug] Cache hit { cacheKey: 'trending_markets_20' }
```

5. **Rate Limiting:**
```
[warn] Rate limit reached, waiting { waitTimeMs: 1234, requestsInLastMinute: 100 }
```

## Common Issues and Solutions

### Issue: Server won't start

**Error:** `Cannot find module '@deltascan/shared'`

**Solution:**
```bash
cd packages/shared
npm run build
```

### Issue: Empty markets array

**Check:**
1. Is the Polymarket API accessible? (Check health endpoint)
2. Are markets being filtered out? (Check logs for "skipped" count)
3. Try with higher limit: `?limit=100`

### Issue: Rate limit errors

**Solution:**
- The RateLimiter should handle this automatically
- Check logs for rate limiter status
- Wait a minute and try again
- If persistent, there may be a bug in the rate limiter

### Issue: Invalid data in responses

**Check logs for:**
- Transformation errors
- Validation warnings
- Missing fields in API responses

**Debug:**
```bash
# Set log level to debug (in .env)
LOG_LEVEL=debug
```

## Testing with Browser

You can also test endpoints in your browser:

1. **Health Check:**
   - http://localhost:3001/api/health

2. **Trending Markets:**
   - http://localhost:3001/api/markets/trending?limit=10

3. **Polymarket Health:**
   - http://localhost:3001/api/health/polymarket

## Advanced Testing

### Test Rate Limiting

Make multiple rapid requests to see rate limiting in action:

```bash
# Run 10 requests in parallel
for i in {1..10}; do
  curl "http://localhost:3001/api/markets/trending?limit=5" &
done
wait

# Check rate limiter status
curl http://localhost:3001/api/health/polymarket
```

### Test Caching

```bash
# First request (cache miss - slower)
time curl "http://localhost:3001/api/markets/trending?limit=5" > /dev/null

# Second request (cache hit - faster)
time curl "http://localhost:3001/api/markets/trending?limit=5" > /dev/null
```

Check logs for "Cache miss" and "Cache hit" messages.

### Test with jq (Pretty JSON)

If you have `jq` installed:

```bash
# Pretty print markets
curl -s "http://localhost:3001/api/markets/trending?limit=3" | jq '.'

# Extract just market titles
curl -s "http://localhost:3001/api/markets/trending?limit=10" | jq '.data.items[].title'

# Extract just volumes
curl -s "http://localhost:3001/api/markets/trending?limit=10" | jq '.data.items[] | {title: .title, volume: .volume}'
```

## Performance Benchmarks

### Expected Performance

- **First Request** (cache miss): 1-3 seconds
- **Cached Request**: < 100ms
- **Manual Scan**: 10-30 seconds (depends on limit)
- **Rate Limit Recovery**: Automatic, < 1 minute max wait

### Memory Usage

- **Idle**: ~50MB
- **After 100 markets**: ~80MB
- **After full scan**: ~100-150MB

## Integration Testing

### Test Full Workflow

1. Start server
2. Health check
3. Fetch trending markets
4. Trigger manual scan
5. Get all markets
6. Check for arbitrage (will be empty for now)

```bash
#!/bin/bash

echo "1. Health check..."
curl -s http://localhost:3001/api/health | jq '.success'

echo "\n2. Polymarket health..."
curl -s http://localhost:3001/api/health/polymarket | jq '.data.healthy'

echo "\n3. Fetch trending markets..."
MARKETS=$(curl -s "http://localhost:3001/api/markets/trending?limit=5" | jq '.data.items | length')
echo "Got $MARKETS markets"

echo "\n4. Trigger scan..."
curl -s -X POST http://localhost:3001/api/scan | jq '.data.message'

echo "\n5. Get all markets..."
ALL_MARKETS=$(curl -s http://localhost:3001/api/markets | jq '.data.items | length')
echo "Total markets in memory: $ALL_MARKETS"

echo "\n6. Check arbitrage..."
ARB_COUNT=$(curl -s http://localhost:3001/api/arbitrage | jq '.data | length')
echo "Arbitrage opportunities: $ARB_COUNT"

echo "\nAll tests completed!"
```

Save as `test.sh`, make executable (`chmod +x test.sh`), and run.

## Next Steps After Testing

Once Phase 1 testing is successful:

1. **Phase 2**: Implement UI components to display markets
2. **Phase 3**: Add CLOB integration for real-time pricing
3. **Phase 4**: Add more platforms (Kalshi, Manifold, PredictIt)
4. **Phase 5**: Enhance arbitrage detection with market matching

## Troubleshooting

### Enable Debug Logging

Edit `packages/server/.env`:
```env
LOG_LEVEL=debug
```

This will show all debug messages including:
- Every API request/response
- Cache hits/misses
- Data transformation details
- Rate limiter activity

### Check Network

If API calls fail:

```bash
# Test direct access to Polymarket API
curl https://gamma-api.polymarket.com/health

# Should return something like: "OK" or similar
```

### Verify TypeScript Build

```bash
# Rebuild everything
npm run clean
npm install
npm run build

# Then restart server
npm run dev:server
```

## Success Indicators

✅ **Phase 1 is working correctly if:**

1. Server starts without TypeScript errors
2. Health checks return positive status
3. Trending markets returns 5+ real Polymarket markets
4. Market data includes valid questions, volumes, URLs
5. Logs show successful API calls and transformations
6. Rate limiter prevents hitting API limits
7. Caching improves response times on repeated requests
8. Manual scan completes and populates markets

---

**Document Version**: 1.0
**Last Updated**: 2025-11-06
**Phase**: 1 - Core Integration Testing
