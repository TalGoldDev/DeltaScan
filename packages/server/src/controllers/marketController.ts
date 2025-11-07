import { Request, Response } from 'express';
import { MarketScannerService } from '../services/MarketScannerService';
import { asyncHandler } from '../middleware/errorHandler';

const scannerService = new MarketScannerService();

/**
 * Get all markets
 */
export const getMarkets = asyncHandler(async (req: Request, res: Response) => {
  const markets = scannerService.getMarkets();

  res.json({
    success: true,
    data: {
      items: markets,
      pagination: {
        page: 1,
        pageSize: markets.length,
        totalPages: 1,
        totalItems: markets.length,
      },
    },
    timestamp: new Date(),
  });
});

/**
 * Get bets for a specific market
 */
export const getBets = asyncHandler(async (req: Request, res: Response) => {
  const { marketId } = req.params;
  const bets = scannerService.getBetsForMarket(marketId);

  res.json({
    success: true,
    data: bets,
    timestamp: new Date(),
  });
});

/**
 * Get arbitrage opportunities
 */
export const getArbitrageOpportunities = asyncHandler(
  async (req: Request, res: Response) => {
    const opportunities = scannerService.getArbitrageOpportunities();

    res.json({
      success: true,
      data: opportunities,
      timestamp: new Date(),
    });
  }
);

/**
 * Trigger a manual scan
 */
export const triggerScan = asyncHandler(async (req: Request, res: Response) => {
  await scannerService.scanAllPlatforms();

  res.json({
    success: true,
    data: { message: 'Scan completed successfully' },
    timestamp: new Date(),
  });
});

/**
 * Get trending markets from Polymarket
 */
export const getTrendingMarkets = asyncHandler(
  async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const polymarketService = scannerService.getPolymarketService();
    const markets = await polymarketService.getTrendingMarkets(limit);

    res.json({
      success: true,
      data: {
        items: markets,
        pagination: {
          page: 1,
          pageSize: markets.length,
          totalPages: 1,
          totalItems: markets.length,
        },
      },
      timestamp: new Date(),
    });
  }
);

/**
 * Get active markets from Polymarket
 */
export const getActiveMarkets = asyncHandler(
  async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const polymarketService = scannerService.getPolymarketService();
    const markets = await polymarketService.getActiveMarkets(limit);

    res.json({
      success: true,
      data: {
        items: markets,
        pagination: {
          page: 1,
          pageSize: markets.length,
          totalPages: 1,
          totalItems: markets.length,
        },
      },
      timestamp: new Date(),
    });
  }
);

/**
 * Get Polymarket service health status
 */
export const getPolymarketHealth = asyncHandler(
  async (req: Request, res: Response) => {
    const polymarketService = scannerService.getPolymarketService();
    const isHealthy = await polymarketService.healthCheck();
    const rateLimiterStatus = polymarketService.getRateLimiterStatus();

    res.json({
      success: true,
      data: {
        healthy: isHealthy,
        rateLimiter: rateLimiterStatus,
      },
      timestamp: new Date(),
    });
  }
);

// Export the scanner service instance for use in scheduled tasks
export { scannerService };
