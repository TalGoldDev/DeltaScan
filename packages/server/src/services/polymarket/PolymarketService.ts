import { logger } from '../../utils/logger';
import { PolymarketAPIClient } from './PolymarketAPIClient';
import { PolymarketTransformer } from './PolymarketTransformer';
import { RateLimiter } from './RateLimiter';
import type { Market, Bet, PolymarketMarket, PolymarketEvent } from '@deltascan/shared';

/**
 * Cache entry for storing cached data with TTL
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * Main service for Polymarket integration
 * Orchestrates API calls, rate limiting, caching, and data transformation
 */
export class PolymarketService {
  private apiClient: PolymarketAPIClient;
  private transformer: PolymarketTransformer;
  private rateLimiter: RateLimiter;

  // In-memory cache
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultCacheTTL: number = 5 * 60 * 1000; // 5 minutes

  // Configuration
  private readonly MIN_LIQUIDITY = 1000; // $1000 minimum
  private readonly MIN_VOLUME_24HR = 500; // $500 minimum 24hr volume
  private readonly DEFAULT_LIMIT = 100;

  constructor(
    gammaApiUrl?: string,
    clobApiUrl?: string,
    cacheTTL?: number
  ) {
    this.apiClient = new PolymarketAPIClient(gammaApiUrl, clobApiUrl);
    this.transformer = new PolymarketTransformer();
    this.rateLimiter = new RateLimiter(100, 100); // 100 req/min, 100ms min delay

    if (cacheTTL) {
      this.defaultCacheTTL = cacheTTL;
    }

    logger.info('PolymarketService initialized', {
      cacheTTL: this.defaultCacheTTL,
      minLiquidity: this.MIN_LIQUIDITY,
      minVolume24hr: this.MIN_VOLUME_24HR,
    });
  }

  /**
   * Get data from cache or execute fetcher if cache miss/expired
   */
  private async getOrFetch<T>(
    cacheKey: string,
    fetcher: () => Promise<T>,
    ttl: number = this.defaultCacheTTL
  ): Promise<T> {
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < ttl) {
      logger.debug('Cache hit', { cacheKey });
      return cached.data;
    }

    logger.debug('Cache miss', { cacheKey });
    const data = await fetcher();

    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });

    return data;
  }

  /**
   * Clear cache (useful for forced refresh)
   */
  clearCache(): void {
    this.cache.clear();
    logger.info('Cache cleared');
  }

  /**
   * Fetch trending markets sorted by volume
   * Returns markets with highest trading activity
   */
  async getTrendingMarkets(limit: number = this.DEFAULT_LIMIT): Promise<Market[]> {
    try {
      logger.info('Fetching trending markets', { limit });

      const cacheKey = `trending_markets_${limit}`;

      const markets = await this.getOrFetch(
        cacheKey,
        async () => {
          // Fetch events sorted by volume (descending)
          const events = await this.rateLimiter.enqueue(() =>
            this.apiClient.getEvents({
              closed: false,
              active: true,
              order: 'volume',
              ascending: false,
              limit: Math.min(limit, 100), // API may have limits
            })
          );

          // Extract markets from events
          const allMarkets: PolymarketMarket[] = [];
          for (const event of events) {
            if (event.markets && event.markets.length > 0) {
              allMarkets.push(...event.markets);
            }
          }

          // Filter valid markets
          const validMarkets = this.transformer.filterValidMarkets(allMarkets);

          // Sort by volume
          validMarkets.sort((a, b) => {
            const volumeA = a.volume_24hr || a.volume || 0;
            const volumeB = b.volume_24hr || b.volume || 0;
            return volumeB - volumeA;
          });

          // Limit results
          return validMarkets.slice(0, limit);
        },
        this.defaultCacheTTL
      );

      // Transform to internal Market type
      const transformedMarkets = this.transformer.transformMarkets(markets);

      logger.info('Fetched trending markets', {
        count: transformedMarkets.length,
      });

      return transformedMarkets;
    } catch (error) {
      logger.error('Failed to fetch trending markets', { error, limit });
      throw error;
    }
  }

  /**
   * Fetch active markets that meet minimum criteria
   */
  async getActiveMarkets(limit: number = this.DEFAULT_LIMIT): Promise<Market[]> {
    try {
      logger.info('Fetching active markets', { limit });

      const cacheKey = `active_markets_${limit}`;

      const markets = await this.getOrFetch(
        cacheKey,
        async () => {
          // Fetch active markets
          const rawMarkets = await this.rateLimiter.enqueue(() =>
            this.apiClient.getMarkets({
              active: true,
              closed: false,
              archived: false,
              limit: Math.min(limit * 2, 200), // Fetch extra to account for filtering
            })
          );

          // Filter valid markets
          let validMarkets = this.transformer.filterValidMarkets(rawMarkets);

          // Additional filtering for minimum criteria
          validMarkets = validMarkets.filter((market) => {
            // Minimum liquidity
            if (market.liquidity && market.liquidity < this.MIN_LIQUIDITY) {
              return false;
            }

            // Minimum 24hr volume
            if (market.volume_24hr && market.volume_24hr < this.MIN_VOLUME_24HR) {
              return false;
            }

            return true;
          });

          return validMarkets.slice(0, limit);
        },
        this.defaultCacheTTL
      );

      // Transform to internal Market type
      const transformedMarkets = this.transformer.transformMarkets(markets);

      logger.info('Fetched active markets', {
        count: transformedMarkets.length,
      });

      return transformedMarkets;
    } catch (error) {
      logger.error('Failed to fetch active markets', { error, limit });
      throw error;
    }
  }

  /**
   * Fetch markets by category/tag
   */
  async getMarketsByCategory(
    tags: string[],
    limit: number = this.DEFAULT_LIMIT
  ): Promise<Market[]> {
    try {
      logger.info('Fetching markets by category', { tags, limit });

      const cacheKey = `markets_category_${tags.join('_')}_${limit}`;

      const markets = await this.getOrFetch(
        cacheKey,
        async () => {
          // Fetch events for each tag
          const allMarkets: PolymarketMarket[] = [];

          for (const tag of tags) {
            const events = await this.rateLimiter.enqueue(() =>
              this.apiClient.getEvents({
                tag,
                closed: false,
                active: true,
                limit: 50,
              })
            );

            for (const event of events) {
              if (event.markets && event.markets.length > 0) {
                allMarkets.push(...event.markets);
              }
            }
          }

          // Remove duplicates
          const uniqueMarkets = Array.from(
            new Map(allMarkets.map((m) => [m.id, m])).values()
          );

          // Filter valid markets
          const validMarkets = this.transformer.filterValidMarkets(uniqueMarkets);

          return validMarkets.slice(0, limit);
        },
        this.defaultCacheTTL
      );

      // Transform to internal Market type
      const transformedMarkets = this.transformer.transformMarkets(markets);

      logger.info('Fetched markets by category', {
        tags,
        count: transformedMarkets.length,
      });

      return transformedMarkets;
    } catch (error) {
      logger.error('Failed to fetch markets by category', { error, tags, limit });
      throw error;
    }
  }

  /**
   * Fetch markets with their bets (YES/NO prices)
   * Returns both markets and bets map
   */
  async getMarketsWithBets(
    limit: number = this.DEFAULT_LIMIT
  ): Promise<{ markets: Market[]; bets: Map<string, Bet[]> }> {
    try {
      logger.info('Fetching markets with bets', { limit });

      // Get trending markets (raw Polymarket format)
      const cacheKey = `markets_with_bets_${limit}`;

      const polyMarkets = await this.getOrFetch(
        cacheKey,
        async () => {
          // Fetch events sorted by volume
          const events = await this.rateLimiter.enqueue(() =>
            this.apiClient.getEvents({
              closed: false,
              active: true,
              order: 'volume',
              ascending: false,
              limit: Math.min(limit, 100),
            })
          );

          // Extract markets
          const allMarkets: PolymarketMarket[] = [];
          for (const event of events) {
            if (event.markets && event.markets.length > 0) {
              allMarkets.push(...event.markets);
            }
          }

          // Filter valid markets
          const validMarkets = this.transformer.filterValidMarkets(allMarkets);

          return validMarkets.slice(0, limit);
        },
        this.defaultCacheTTL
      );

      // Transform markets
      const markets = this.transformer.transformMarkets(polyMarkets);

      // Transform to bets
      const bets = this.transformer.transformMarketsToBets(polyMarkets);

      logger.info('Fetched markets with bets', {
        marketsCount: markets.length,
        betsCount: bets.size,
      });

      return { markets, bets };
    } catch (error) {
      logger.error('Failed to fetch markets with bets', { error, limit });
      throw error;
    }
  }

  /**
   * Get specific market by ID with bets
   */
  async getMarketWithBets(
    marketId: string
  ): Promise<{ market: Market; bets: Bet[] } | null> {
    try {
      logger.info('Fetching market with bets', { marketId });

      const cacheKey = `market_${marketId}`;

      const polyMarket = await this.getOrFetch(
        cacheKey,
        async () => {
          return await this.rateLimiter.enqueue(() =>
            this.apiClient.getMarketById(marketId)
          );
        },
        this.defaultCacheTTL
      );

      // Validate market
      if (!this.transformer.isMarketValid(polyMarket)) {
        logger.warn('Market is not valid for arbitrage', { marketId });
        return null;
      }

      // Transform
      const market = this.transformer.transformMarket(polyMarket);
      const bets = this.transformer.transformToBets(polyMarket);

      if (!market || bets.length === 0) {
        return null;
      }

      return { market, bets };
    } catch (error) {
      logger.error('Failed to fetch market with bets', { error, marketId });
      throw error;
    }
  }

  /**
   * Check if service is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const isHealthy = await this.apiClient.healthCheck();
      logger.info('Polymarket service health check', { isHealthy });
      return isHealthy;
    } catch (error) {
      logger.error('Polymarket service health check failed', { error });
      return false;
    }
  }

  /**
   * Get rate limiter status
   */
  getRateLimiterStatus() {
    return this.rateLimiter.getStatus();
  }
}
