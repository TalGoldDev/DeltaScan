import axios, { AxiosInstance, AxiosError } from 'axios';
import { logger } from '../../utils/logger';
import type {
  PolymarketMarket,
  PolymarketEvent,
  CLOBOrderBook,
  CLOBPrice,
  MarketQueryParams,
  EventQueryParams,
} from '@deltascan/shared';

/**
 * API Client for Polymarket's Gamma and CLOB APIs
 * Handles all HTTP requests to Polymarket endpoints
 */
export class PolymarketAPIClient {
  private gammaClient: AxiosInstance;
  private clobClient: AxiosInstance;

  constructor(
    private gammaBaseURL: string = 'https://gamma-api.polymarket.com',
    private clobBaseURL: string = 'https://clob.polymarket.com'
  ) {
    // Gamma API client (market metadata)
    this.gammaClient = axios.create({
      baseURL: gammaBaseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // CLOB API client (order book, pricing)
    this.clobClient = axios.create({
      baseURL: clobBaseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Set up request/response interceptors for logging and error handling
   */
  private setupInterceptors(): void {
    // Gamma client interceptors
    this.gammaClient.interceptors.request.use(
      (config) => {
        logger.debug('Gamma API Request', {
          method: config.method?.toUpperCase(),
          url: config.url,
          params: config.params,
        });
        return config;
      },
      (error) => {
        logger.error('Gamma API Request Error', { error: error.message });
        return Promise.reject(error);
      }
    );

    this.gammaClient.interceptors.response.use(
      (response) => {
        logger.debug('Gamma API Response', {
          status: response.status,
          url: response.config.url,
          dataLength: Array.isArray(response.data) ? response.data.length : 'N/A',
        });
        return response;
      },
      (error) => {
        this.handleAPIError(error, 'Gamma');
        return Promise.reject(error);
      }
    );

    // CLOB client interceptors
    this.clobClient.interceptors.request.use(
      (config) => {
        logger.debug('CLOB API Request', {
          method: config.method?.toUpperCase(),
          url: config.url,
          params: config.params,
        });
        return config;
      },
      (error) => {
        logger.error('CLOB API Request Error', { error: error.message });
        return Promise.reject(error);
      }
    );

    this.clobClient.interceptors.response.use(
      (response) => {
        logger.debug('CLOB API Response', {
          status: response.status,
          url: response.config.url,
        });
        return response;
      },
      (error) => {
        this.handleAPIError(error, 'CLOB');
        return Promise.reject(error);
      }
    );
  }

  /**
   * Handle API errors with appropriate logging
   */
  private handleAPIError(error: AxiosError, apiName: string): void {
    if (error.response) {
      // Server responded with error status
      logger.error(`${apiName} API Error`, {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        url: error.config?.url,
      });
    } else if (error.request) {
      // Request made but no response
      logger.error(`${apiName} API No Response`, {
        url: error.config?.url,
        message: error.message,
      });
    } else {
      // Error setting up request
      logger.error(`${apiName} API Request Setup Error`, {
        message: error.message,
      });
    }
  }

  /**
   * Build query string from parameters
   */
  private buildQueryParams(params: Record<string, any>): Record<string, string> {
    const queryParams: Record<string, string> = {};

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams[key] = String(value);
      }
    });

    return queryParams;
  }

  // ==================== GAMMA API METHODS ====================

  /**
   * Fetch markets from Gamma API
   * @param params Query parameters for filtering and pagination
   * @returns Array of Polymarket markets
   */
  async getMarkets(params: MarketQueryParams = {}): Promise<PolymarketMarket[]> {
    try {
      const queryParams = this.buildQueryParams(params);
      const response = await this.gammaClient.get<PolymarketMarket[]>('/markets', {
        params: queryParams,
      });

      logger.info('Fetched markets from Polymarket', {
        count: response.data.length,
        params,
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to fetch markets', { error, params });
      throw error;
    }
  }

  /**
   * Fetch a specific market by ID
   * @param marketId Market identifier
   * @returns Single market
   */
  async getMarketById(marketId: string): Promise<PolymarketMarket> {
    try {
      const response = await this.gammaClient.get<PolymarketMarket>(
        `/markets/${marketId}`
      );

      logger.info('Fetched market by ID', { marketId });

      return response.data;
    } catch (error) {
      logger.error('Failed to fetch market by ID', { error, marketId });
      throw error;
    }
  }

  /**
   * Fetch events from Gamma API
   * Events are groupings of related markets
   * @param params Query parameters for filtering and pagination
   * @returns Array of Polymarket events
   */
  async getEvents(params: EventQueryParams = {}): Promise<PolymarketEvent[]> {
    try {
      const queryParams = this.buildQueryParams(params);
      const response = await this.gammaClient.get<PolymarketEvent[]>('/events', {
        params: queryParams,
      });

      logger.info('Fetched events from Polymarket', {
        count: response.data.length,
        params,
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to fetch events', { error, params });
      throw error;
    }
  }

  /**
   * Fetch a specific event by ID
   * @param eventId Event identifier
   * @returns Single event with associated markets
   */
  async getEventById(eventId: string): Promise<PolymarketEvent> {
    try {
      const response = await this.gammaClient.get<PolymarketEvent>(
        `/events/${eventId}`
      );

      logger.info('Fetched event by ID', { eventId });

      return response.data;
    } catch (error) {
      logger.error('Failed to fetch event by ID', { error, eventId });
      throw error;
    }
  }

  // ==================== CLOB API METHODS ====================

  /**
   * Fetch order book for a specific token
   * @param tokenId CLOB token identifier
   * @returns Order book with bids and asks
   */
  async getOrderBook(tokenId: string): Promise<CLOBOrderBook> {
    try {
      const response = await this.clobClient.get<CLOBOrderBook>('/book', {
        params: { token_id: tokenId },
      });

      logger.debug('Fetched order book', { tokenId });

      return response.data;
    } catch (error) {
      logger.error('Failed to fetch order book', { error, tokenId });
      throw error;
    }
  }

  /**
   * Fetch current price for a specific token
   * @param tokenId CLOB token identifier
   * @returns Current price
   */
  async getPrice(tokenId: string): Promise<CLOBPrice> {
    try {
      const response = await this.clobClient.get<CLOBPrice>('/price', {
        params: { token_id: tokenId },
      });

      logger.debug('Fetched price', { tokenId, price: response.data.price });

      return response.data;
    } catch (error) {
      logger.error('Failed to fetch price', { error, tokenId });
      throw error;
    }
  }

  /**
   * Fetch prices for multiple tokens
   * @param tokenIds Array of CLOB token identifiers
   * @returns Map of token ID to price
   */
  async getPrices(tokenIds: string[]): Promise<Map<string, number>> {
    const prices = new Map<string, number>();

    try {
      // Fetch prices in parallel (with reasonable batch size)
      const batchSize = 10;
      for (let i = 0; i < tokenIds.length; i += batchSize) {
        const batch = tokenIds.slice(i, i + batchSize);
        const pricePromises = batch.map((tokenId) =>
          this.getPrice(tokenId)
            .then((priceData) => ({
              tokenId,
              price: parseFloat(priceData.price),
            }))
            .catch((error) => {
              logger.warn('Failed to fetch price for token', { tokenId, error });
              return null;
            })
        );

        const results = await Promise.all(pricePromises);

        results.forEach((result) => {
          if (result) {
            prices.set(result.tokenId, result.price);
          }
        });
      }

      logger.info('Fetched multiple prices', { count: prices.size });

      return prices;
    } catch (error) {
      logger.error('Failed to fetch prices', { error, tokenIds });
      throw error;
    }
  }

  /**
   * Health check for Gamma API
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.gammaClient.get('/health');
      return true;
    } catch (error) {
      logger.error('Health check failed', { error });
      return false;
    }
  }
}
