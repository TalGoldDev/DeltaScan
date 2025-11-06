import { z } from 'zod';

/**
 * Supported prediction market platforms
 */
export enum MarketPlatform {
  POLYMARKET = 'polymarket',
  KALSHI = 'kalshi',
  MANIFOLD = 'manifold',
  PREDICTIT = 'predictit',
}

/**
 * Bet outcome type (YES/NO for binary markets)
 */
export enum BetOutcome {
  YES = 'YES',
  NO = 'NO',
}

/**
 * Market status
 */
export enum MarketStatus {
  ACTIVE = 'active',
  CLOSED = 'closed',
  RESOLVED = 'resolved',
  SUSPENDED = 'suspended',
}

/**
 * Schema for a prediction market
 */
export const MarketSchema = z.object({
  id: z.string(),
  platform: z.nativeEnum(MarketPlatform),
  title: z.string(),
  description: z.string().optional(),
  category: z.string().optional(),
  closeDate: z.date(),
  status: z.nativeEnum(MarketStatus),
  volume: z.number().optional(),
  liquidity: z.number().optional(),
  url: z.string().url(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Schema for a bet option/position
 */
export const BetSchema = z.object({
  marketId: z.string(),
  platform: z.nativeEnum(MarketPlatform),
  outcome: z.nativeEnum(BetOutcome),
  price: z.number().min(0).max(1), // Probability as decimal (0-1)
  displayPrice: z.number().min(0).max(100), // Probability as percentage (0-100)
  availableLiquidity: z.number().optional(),
  lastUpdated: z.date(),
});

/**
 * Schema for an arbitrage opportunity
 */
export const ArbitrageOpportunitySchema = z.object({
  id: z.string(),
  market1: BetSchema,
  market2: BetSchema,
  profitMargin: z.number(), // Percentage profit
  requiredCapital: z.number(),
  estimatedProfit: z.number(),
  confidence: z.number().min(0).max(1), // Confidence score 0-1
  detectedAt: z.date(),
  expiresAt: z.date().optional(),
});

// Type exports
export type Market = z.infer<typeof MarketSchema>;
export type Bet = z.infer<typeof BetSchema>;
export type ArbitrageOpportunity = z.infer<typeof ArbitrageOpportunitySchema>;
