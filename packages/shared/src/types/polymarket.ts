import { z } from 'zod';

/**
 * Polymarket Token - represents a tradeable outcome token
 */
export const PolymarketTokenSchema = z.object({
  token_id: z.string(),
  outcome: z.string(),
  price: z.number().optional(),
  winner: z.boolean().optional(),
});

export type PolymarketToken = z.infer<typeof PolymarketTokenSchema>;

/**
 * Polymarket Market - represents a prediction market from Polymarket
 */
export const PolymarketMarketSchema = z.object({
  // Core identification
  id: z.string(),
  question_id: z.string().optional(),
  condition_id: z.string().optional(),
  market_slug: z.string().optional(),

  // Market question
  question: z.string(),
  description: z.string().optional(),
  outcomes: z.array(z.string()).optional(),

  // Status & timing
  active: z.boolean().optional(),
  closed: z.boolean().optional(),
  archived: z.boolean().optional(),
  accepting_orders: z.boolean().optional(),
  accepting_order_timestamp: z.string().optional(),
  end_date_iso: z.string().optional(),
  game_start_time: z.string().optional(),

  // Trading information
  tokens: z.array(PolymarketTokenSchema).optional(),
  enable_order_book: z.boolean().optional(),

  // Volume & liquidity
  volume: z.number().optional(),
  volume_24hr: z.number().optional(),
  liquidity: z.number().optional(),

  // Market mechanics
  fpmm: z.string().optional(),
  minimum_order_size: z.number().optional(),
  minimum_tick_size: z.number().optional(),
  maker_base_fee: z.number().optional(),
  neg_risk: z.boolean().optional(),
  neg_risk_market_id: z.string().optional(),
  neg_risk_request_id: z.string().optional(),

  // Media & presentation
  icon: z.string().optional(),
  image: z.string().optional(),
  competitive: z.number().optional(),

  // Stringified JSON fields (need parsing)
  outcomePrices: z.string().optional(),
  clobTokenIds: z.string().optional(),

  // Parsed data (populated after transformation)
  outcome_prices: z.array(z.string()).optional(),
  clob_token_ids: z.array(z.string()).optional(),

  // Rewards and events
  rewards: z.record(z.any()).optional(),
  events: z.array(z.any()).optional(),
});

export type PolymarketMarket = z.infer<typeof PolymarketMarketSchema>;

/**
 * Polymarket Event - represents a grouping of related markets
 */
export const PolymarketEventSchema = z.object({
  // Identification
  id: z.string(),
  slug: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),

  // Status & timing
  active: z.boolean().optional(),
  closed: z.boolean().optional(),
  archived: z.boolean().optional(),
  end_date_iso: z.string().optional(),
  start_date_iso: z.string().optional(),

  // Markets
  markets: z.array(PolymarketMarketSchema).optional(),

  // Metadata
  tags: z.array(z.string()).optional(),
  competitive: z.number().optional(),
  liquidity: z.number().optional(),
  volume: z.number().optional(),
  volume_24hr: z.number().optional(),

  // Media
  icon: z.string().optional(),
  image: z.string().optional(),
});

export type PolymarketEvent = z.infer<typeof PolymarketEventSchema>;

/**
 * CLOB Order Book - represents order book data from CLOB API
 */
export const CLOBOrderSchema = z.object({
  price: z.string(),
  size: z.string(),
});

export const CLOBOrderBookSchema = z.object({
  market: z.string().optional(),
  asset_id: z.string(),
  bids: z.array(CLOBOrderSchema),
  asks: z.array(CLOBOrderSchema),
  timestamp: z.number().optional(),
  hash: z.string().optional(),
});

export type CLOBOrder = z.infer<typeof CLOBOrderSchema>;
export type CLOBOrderBook = z.infer<typeof CLOBOrderBookSchema>;

/**
 * CLOB Price Response - simplified price data
 */
export const CLOBPriceSchema = z.object({
  price: z.string(),
  timestamp: z.number().optional(),
});

export type CLOBPrice = z.infer<typeof CLOBPriceSchema>;

/**
 * Market Query Parameters - for filtering and pagination
 */
export interface MarketQueryParams {
  limit?: number;
  offset?: number;
  closed?: boolean;
  archived?: boolean;
  active?: boolean;
  order?: string;
  ascending?: boolean;
  // Additional filters
  id?: string;
  slug?: string;
}

/**
 * Event Query Parameters - for filtering and pagination
 */
export interface EventQueryParams {
  limit?: number;
  offset?: number;
  closed?: boolean;
  archived?: boolean;
  active?: boolean;
  order?: string;
  ascending?: boolean;
  // Additional filters
  id?: string;
  slug?: string;
  tag?: string;
}

/**
 * Parsed Market Prices - extracted and parsed price data
 */
export interface ParsedMarketPrices {
  yesPrice: number;
  noPrice: number;
  yesTokenId?: string;
  noTokenId?: string;
  lastUpdated: Date;
}
