import { logger } from '../../utils/logger';
import type {
  PolymarketMarket,
  ParsedMarketPrices,
  Market,
  Bet,
  MarketPlatform,
} from '@deltascan/shared';
import { BetOutcome, MarketStatus } from '@deltascan/shared';

/**
 * Transformer for converting Polymarket data to internal types
 * Handles parsing, transformation, and data extraction
 */
export class PolymarketTransformer {
  /**
   * Parse stringified JSON array (e.g., outcomePrices, clobTokenIds)
   */
  parseStringifiedArray(jsonString: string | undefined): string[] {
    if (!jsonString) return [];

    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item));
      }
      return [];
    } catch (error) {
      logger.warn('Failed to parse stringified array', { jsonString, error });
      return [];
    }
  }

  /**
   * Extract YES/NO prices from market data
   * Handles different data formats and fallbacks
   */
  extractYesNoPrice(market: PolymarketMarket): ParsedMarketPrices | null {
    try {
      // Try to get prices from tokens array first (most reliable)
      if (market.tokens && market.tokens.length >= 2) {
        const yesToken = market.tokens.find(
          (t: any) => t.outcome.toLowerCase() === 'yes'
        );
        const noToken = market.tokens.find(
          (t: any) => t.outcome.toLowerCase() === 'no'
        );

        if (yesToken && noToken && yesToken.price !== undefined && noToken.price !== undefined) {
          return {
            yesPrice: yesToken.price,
            noPrice: noToken.price,
            yesTokenId: yesToken.token_id,
            noTokenId: noToken.token_id,
            lastUpdated: new Date(),
          };
        }
      }

      // Fallback: Try to parse outcomePrices string
      if (market.outcomePrices) {
        const prices = this.parseStringifiedArray(market.outcomePrices);
        if (prices.length >= 2) {
          const yesPrice = parseFloat(prices[0]);
          const noPrice = parseFloat(prices[1]);

          if (!isNaN(yesPrice) && !isNaN(noPrice)) {
            // Try to get token IDs from clobTokenIds
            let yesTokenId: string | undefined;
            let noTokenId: string | undefined;

            if (market.clobTokenIds) {
              const tokenIds = this.parseStringifiedArray(market.clobTokenIds);
              if (tokenIds.length >= 2) {
                yesTokenId = tokenIds[0];
                noTokenId = tokenIds[1];
              }
            }

            return {
              yesPrice,
              noPrice,
              yesTokenId,
              noTokenId,
              lastUpdated: new Date(),
            };
          }
        }
      }

      logger.warn('Could not extract YES/NO prices', {
        marketId: market.id,
        question: market.question,
      });
      return null;
    } catch (error) {
      logger.error('Error extracting YES/NO prices', {
        error,
        marketId: market.id,
      });
      return null;
    }
  }

  /**
   * Determine market status from Polymarket flags
   */
  determineMarketStatus(market: PolymarketMarket): MarketStatus {
    if (market.closed) {
      return MarketStatus.CLOSED;
    }
    if (market.archived) {
      return MarketStatus.CLOSED;
    }
    if (market.active && market.accepting_orders) {
      return MarketStatus.ACTIVE;
    }
    if (market.active === false) {
      return MarketStatus.SUSPENDED;
    }
    return MarketStatus.ACTIVE; // Default
  }

  /**
   * Transform Polymarket market to internal Market type
   */
  transformMarket(polyMarket: PolymarketMarket): Market | null {
    try {
      // Extract prices
      const prices = this.extractYesNoPrice(polyMarket);
      if (!prices) {
        logger.warn('Skipping market without valid prices', {
          marketId: polyMarket.id,
          question: polyMarket.question,
        });
        return null;
      }

      // Parse dates
      const closeDate = polyMarket.end_date_iso
        ? new Date(polyMarket.end_date_iso)
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // Default: 1 year from now

      // Determine status
      const status = this.determineMarketStatus(polyMarket);

      // Build market URL
      const url = polyMarket.market_slug
        ? `https://polymarket.com/event/${polyMarket.market_slug}`
        : `https://polymarket.com/market/${polyMarket.id}`;

      // Create internal Market object
      const market: Market = {
        id: polyMarket.id,
        platform: 'polymarket' as MarketPlatform,
        title: polyMarket.question,
        description: polyMarket.description,
        category: polyMarket.events?.[0]?.slug, // Use event slug as category if available
        closeDate,
        status,
        volume: polyMarket.volume,
        liquidity: polyMarket.liquidity,
        url,
        createdAt: new Date(), // Polymarket doesn't provide creation date in this API
        updatedAt: new Date(),
      };

      return market;
    } catch (error) {
      logger.error('Error transforming market', {
        error,
        marketId: polyMarket.id,
      });
      return null;
    }
  }

  /**
   * Transform Polymarket market to internal Bet array
   * Creates YES and NO bet objects
   */
  transformToBets(polyMarket: PolymarketMarket): Bet[] {
    try {
      const prices = this.extractYesNoPrice(polyMarket);
      if (!prices) {
        return [];
      }

      const bets: Bet[] = [];
      const now = new Date();

      // Create YES bet
      bets.push({
        marketId: polyMarket.id,
        platform: 'polymarket' as MarketPlatform,
        outcome: BetOutcome.YES,
        price: prices.yesPrice,
        displayPrice: prices.yesPrice * 100,
        availableLiquidity: polyMarket.liquidity
          ? polyMarket.liquidity / 2 // Rough estimate
          : undefined,
        lastUpdated: now,
      });

      // Create NO bet
      bets.push({
        marketId: polyMarket.id,
        platform: 'polymarket' as MarketPlatform,
        outcome: BetOutcome.NO,
        price: prices.noPrice,
        displayPrice: prices.noPrice * 100,
        availableLiquidity: polyMarket.liquidity
          ? polyMarket.liquidity / 2 // Rough estimate
          : undefined,
        lastUpdated: now,
      });

      return bets;
    } catch (error) {
      logger.error('Error transforming to bets', {
        error,
        marketId: polyMarket.id,
      });
      return [];
    }
  }

  /**
   * Transform multiple markets in batch
   */
  transformMarkets(polyMarkets: PolymarketMarket[]): Market[] {
    const markets: Market[] = [];

    for (const polyMarket of polyMarkets) {
      const market = this.transformMarket(polyMarket);
      if (market) {
        markets.push(market);
      }
    }

    logger.info('Transformed markets', {
      input: polyMarkets.length,
      output: markets.length,
      skipped: polyMarkets.length - markets.length,
    });

    return markets;
  }

  /**
   * Transform multiple markets to bets in batch
   */
  transformMarketsToBets(polyMarkets: PolymarketMarket[]): Map<string, Bet[]> {
    const betsMap = new Map<string, Bet[]>();

    for (const polyMarket of polyMarkets) {
      const bets = this.transformToBets(polyMarket);
      if (bets.length > 0) {
        betsMap.set(polyMarket.id, bets);
      }
    }

    logger.info('Transformed markets to bets', {
      markets: polyMarkets.length,
      marketsWithBets: betsMap.size,
    });

    return betsMap;
  }

  /**
   * Validate market has minimum required data for arbitrage detection
   */
  isMarketValid(market: PolymarketMarket): boolean {
    // Must be active
    if (!market.active || market.closed || market.archived) {
      return false;
    }

    // Must accept orders
    if (!market.accepting_orders) {
      return false;
    }

    // Must have valid prices
    const prices = this.extractYesNoPrice(market);
    if (!prices) {
      return false;
    }

    // Prices should sum to approximately 1 (within reasonable range)
    const priceSum = prices.yesPrice + prices.noPrice;
    if (priceSum < 0.8 || priceSum > 1.2) {
      logger.warn('Invalid price sum', {
        marketId: market.id,
        priceSum,
        yesPrice: prices.yesPrice,
        noPrice: prices.noPrice,
      });
      return false;
    }

    // Must have minimum liquidity (if provided)
    if (market.liquidity !== undefined && market.liquidity < 100) {
      return false;
    }

    return true;
  }

  /**
   * Filter markets to only include valid ones for arbitrage
   */
  filterValidMarkets(markets: PolymarketMarket[]): PolymarketMarket[] {
    return markets.filter((market) => this.isMarketValid(market));
  }
}
