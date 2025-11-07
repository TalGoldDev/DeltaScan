import { Router } from 'express';
import * as marketController from '../controllers/marketController';

const router = Router();

// Market routes
router.get('/markets', marketController.getMarkets);
router.get('/markets/:marketId/bets', marketController.getBets);
router.get('/markets/trending', marketController.getTrendingMarkets);
router.get('/markets/active', marketController.getActiveMarkets);

// Arbitrage routes
router.get('/arbitrage', marketController.getArbitrageOpportunities);

// Scan routes
router.post('/scan', marketController.triggerScan);

// Health check routes
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: { status: 'healthy', timestamp: new Date() },
    timestamp: new Date(),
  });
});
router.get('/health/polymarket', marketController.getPolymarketHealth);

export default router;
