import dotenv from 'dotenv';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || 'localhost',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',

  // API Keys
  apiKeys: {
    polymarket: process.env.POLYMARKET_API_KEY || '',
    kalshi: process.env.KALSHI_API_KEY || '',
    manifold: process.env.MANIFOLD_API_KEY || '',
    predictit: process.env.PREDICTIT_API_KEY || '',
  },

  // Scanning configuration
  scanning: {
    intervalMinutes: parseInt(process.env.SCAN_INTERVAL_MINUTES || '5', 10),
    enableAutoScan: process.env.ENABLE_AUTO_SCAN === 'true',
  },

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
} as const;
