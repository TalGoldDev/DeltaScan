import { create } from 'zustand';
import type { ArbitrageOpportunity, Market } from '@deltascan/shared';

interface ArbitrageStore {
  opportunities: ArbitrageOpportunity[];
  markets: Market[];
  isLoading: boolean;
  error: string | null;

  setOpportunities: (opportunities: ArbitrageOpportunity[]) => void;
  setMarkets: (markets: Market[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useArbitrageStore = create<ArbitrageStore>((set) => ({
  opportunities: [],
  markets: [],
  isLoading: false,
  error: null,

  setOpportunities: (opportunities) => set({ opportunities }),
  setMarkets: (markets) => set({ markets }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
