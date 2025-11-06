import { logger } from '../../utils/logger';

/**
 * Rate Limiter for API requests
 * Ensures we don't exceed API rate limits (e.g., 100 requests/minute for Polymarket)
 */
export class RateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private requestTimestamps: number[] = [];

  constructor(
    private maxRequestsPerMinute: number = 100,
    private minDelayMs: number = 100 // Minimum delay between requests
  ) {
    logger.info('RateLimiter initialized', {
      maxRequestsPerMinute,
      minDelayMs,
    });
  }

  /**
   * Enqueue a request to be executed with rate limiting
   * @param request Function that returns a Promise
   * @returns Promise that resolves with the request result
   */
  async enqueue<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      // Start processing if not already processing
      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  /**
   * Process queued requests with rate limiting
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      // Check if we need to wait before making next request
      await this.waitIfNeeded();

      // Get next request from queue
      const request = this.queue.shift();
      if (!request) break;

      // Record request timestamp
      const now = Date.now();
      this.requestTimestamps.push(now);

      // Clean up old timestamps (older than 1 minute)
      this.cleanupTimestamps();

      // Execute request
      try {
        await request();
      } catch (error) {
        logger.error('Request failed in rate limiter', { error });
      }

      // Minimum delay between requests
      if (this.minDelayMs > 0 && this.queue.length > 0) {
        await this.sleep(this.minDelayMs);
      }
    }

    this.processing = false;
  }

  /**
   * Wait if we're approaching rate limit
   */
  private async waitIfNeeded(): Promise<void> {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Count requests in the last minute
    const recentRequests = this.requestTimestamps.filter(
      (timestamp) => timestamp > oneMinuteAgo
    );

    if (recentRequests.length >= this.maxRequestsPerMinute) {
      // Calculate how long to wait
      const oldestRecentRequest = recentRequests[0];
      const waitTime = oldestRecentRequest + 60000 - now + 100; // Add 100ms buffer

      if (waitTime > 0) {
        logger.warn('Rate limit reached, waiting', {
          waitTimeMs: waitTime,
          requestsInLastMinute: recentRequests.length,
        });
        await this.sleep(waitTime);
      }
    }
  }

  /**
   * Remove timestamps older than 1 minute
   */
  private cleanupTimestamps(): void {
    const oneMinuteAgo = Date.now() - 60000;
    this.requestTimestamps = this.requestTimestamps.filter(
      (timestamp) => timestamp > oneMinuteAgo
    );
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get current queue status
   */
  getStatus(): {
    queueLength: number;
    requestsInLastMinute: number;
    processing: boolean;
  } {
    const oneMinuteAgo = Date.now() - 60000;
    const requestsInLastMinute = this.requestTimestamps.filter(
      (timestamp) => timestamp > oneMinuteAgo
    ).length;

    return {
      queueLength: this.queue.length,
      requestsInLastMinute,
      processing: this.processing,
    };
  }

  /**
   * Clear the queue (useful for shutdown or reset)
   */
  clear(): void {
    this.queue = [];
    this.requestTimestamps = [];
    this.processing = false;
    logger.info('RateLimiter queue cleared');
  }
}
