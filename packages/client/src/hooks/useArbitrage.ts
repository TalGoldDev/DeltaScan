import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { marketApi } from '../services/api';
import { wsService } from '../services/websocket';
import { useArbitrageStore } from '../store/arbitrageStore';
import { WS_EVENTS } from '@deltascan/shared';
import type { ArbitrageOpportunity } from '@deltascan/shared';

export const useArbitrage = () => {
  const { setOpportunities, setLoading, setError } = useArbitrageStore();

  // Fetch arbitrage opportunities
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['arbitrage'],
    queryFn: async () => {
      const response = await marketApi.getArbitrageOpportunities();
      return response.data || [];
    },
    refetchInterval: 60000, // Refetch every minute
  });

  // Update store when data changes
  useEffect(() => {
    if (data) {
      setOpportunities(data);
    }
  }, [data, setOpportunities]);

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  useEffect(() => {
    setError(error?.message || null);
  }, [error, setError]);

  // WebSocket updates
  useEffect(() => {
    const handleArbitrageUpdate = (opportunities: ArbitrageOpportunity[]) => {
      setOpportunities(opportunities);
    };

    wsService.on(WS_EVENTS.ARBITRAGE_OPPORTUNITY, handleArbitrageUpdate);

    return () => {
      wsService.off(WS_EVENTS.ARBITRAGE_OPPORTUNITY, handleArbitrageUpdate);
    };
  }, [setOpportunities]);

  return {
    opportunities: data || [],
    isLoading,
    error,
    refetch,
  };
};
