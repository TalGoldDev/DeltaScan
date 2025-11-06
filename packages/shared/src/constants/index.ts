/**
 * Platform API endpoints and configuration
 */
export const PLATFORM_CONFIG = {
  POLYMARKET: {
    name: 'Polymarket',
    apiUrl: 'https://gamma-api.polymarket.com',
    websiteUrl: 'https://polymarket.com',
    rateLimit: 100, // requests per minute
  },
  KALSHI: {
    name: 'Kalshi',
    apiUrl: 'https://trading-api.kalshi.com',
    websiteUrl: 'https://kalshi.com',
    rateLimit: 60,
  },
  MANIFOLD: {
    name: 'Manifold Markets',
    apiUrl: 'https://api.manifold.markets/v0',
    websiteUrl: 'https://manifold.markets',
    rateLimit: 100,
  },
  PREDICTIT: {
    name: 'PredictIt',
    apiUrl: 'https://www.predictit.org/api',
    websiteUrl: 'https://www.predictit.org',
    rateLimit: 60,
  },
} as const;

/**
 * Arbitrage detection thresholds
 */
export const ARBITRAGE_CONFIG = {
  // Minimum profit margin to consider (percentage)
  MIN_PROFIT_MARGIN: 2,

  // Maximum profit margin (above this might indicate data error)
  MAX_PROFIT_MARGIN: 50,

  // Minimum confidence score to display
  MIN_CONFIDENCE: 0.7,

  // Maximum age of data to consider (milliseconds)
  MAX_DATA_AGE: 5 * 60 * 1000, // 5 minutes

  // Minimum liquidity required (USD)
  MIN_LIQUIDITY: 100,
} as const;

/**
 * API configuration
 */
export const API_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  REQUEST_TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

/**
 * WebSocket events
 */
export const WS_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  MARKET_UPDATE: 'market:update',
  BET_UPDATE: 'bet:update',
  ARBITRAGE_OPPORTUNITY: 'arbitrage:opportunity',
  SUBSCRIBE_MARKETS: 'subscribe:markets',
  UNSUBSCRIBE_MARKETS: 'unsubscribe:markets',
} as const;
