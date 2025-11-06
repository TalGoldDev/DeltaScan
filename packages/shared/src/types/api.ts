import { z } from 'zod';
import { MarketSchema, BetSchema, ArbitrageOpportunitySchema } from './market';

/**
 * Generic API response wrapper
 */
export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    timestamp: z.date(),
  });

/**
 * Pagination metadata
 */
export const PaginationSchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  totalPages: z.number().int().nonnegative(),
  totalItems: z.number().int().nonnegative(),
});

/**
 * Paginated response
 */
export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    pagination: PaginationSchema,
  });

// API endpoint response types
export const GetMarketsResponseSchema = ApiResponseSchema(
  PaginatedResponseSchema(MarketSchema)
);

export const GetBetsResponseSchema = ApiResponseSchema(z.array(BetSchema));

export const GetArbitrageOpportunitiesResponseSchema = ApiResponseSchema(
  z.array(ArbitrageOpportunitySchema)
);

// Type exports
export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
};

export type Pagination = z.infer<typeof PaginationSchema>;
export type PaginatedResponse<T> = {
  items: T[];
  pagination: Pagination;
};

export type GetMarketsResponse = z.infer<typeof GetMarketsResponseSchema>;
export type GetBetsResponse = z.infer<typeof GetBetsResponseSchema>;
export type GetArbitrageOpportunitiesResponse = z.infer<
  typeof GetArbitrageOpportunitiesResponseSchema
>;
