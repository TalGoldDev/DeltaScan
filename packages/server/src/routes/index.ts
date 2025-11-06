import { Router } from 'express';
import * as marketController from '../controllers/marketController';

const router = Router();

// Market routes
router.get('/markets', marketController.getMarkets);
router.get('/markets/:marketId/bets', marketController.getBets);

// Arbitrage routes
router.get('/arbitrage', marketController.getArbitrageOpportunities);

// Scan routes
router.post('/scan', marketController.triggerScan);

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: { status: 'healthy', timestamp: new Date() },
    timestamp: new Date(),
  });
});

export default router;
