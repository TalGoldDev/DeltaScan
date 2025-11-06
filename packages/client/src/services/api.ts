import axios from 'axios';
import type {
  GetMarketsResponse,
  GetBetsResponse,
  GetArbitrageOpportunitiesResponse,
} from '@deltascan/shared';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const marketApi = {
  /**
   * Get all markets
   */
  getMarkets: async (): Promise<GetMarketsResponse> => {
    const response = await api.get('/markets');
    return response.data;
  },

  /**
   * Get bets for a specific market
   */
  getBets: async (marketId: string): Promise<GetBetsResponse> => {
    const response = await api.get(`/markets/${marketId}/bets`);
    return response.data;
  },

  /**
   * Get arbitrage opportunities
   */
  getArbitrageOpportunities: async (): Promise<GetArbitrageOpportunitiesResponse> => {
    const response = await api.get('/arbitrage');
    return response.data;
  },

  /**
   * Trigger a manual scan
   */
  triggerScan: async (): Promise<void> => {
    await api.post('/scan');
  },
};

export default api;
