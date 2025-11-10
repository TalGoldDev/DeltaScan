import { useEffect } from 'react';
import { useArbitrage } from '../hooks/useArbitrage';
import { ArbitrageCard } from '../components/ArbitrageCard';
import { wsService } from '../services/websocket';
import type { ArbitrageOpportunity } from '@deltascan/shared';

export const Dashboard: React.FC = () => {
  const { opportunities, isLoading, error, refetch } = useArbitrage();

  useEffect(() => {
    wsService.connect();
    return () => wsService.disconnect();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Loading arbitrage opportunities...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-600">Error: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">DeltaScan</h1>
              <p className="text-gray-600 mt-1">
                Prediction Market Arbitrage Platform
              </p>
            </div>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">
            Arbitrage Opportunities
          </h2>
          <p className="text-gray-600 mt-1">
            {opportunities.length} opportunities found
          </p>
        </div>

        {opportunities.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">
              No arbitrage opportunities found at the moment.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              The system will automatically scan for new opportunities.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {opportunities.map((opportunity: ArbitrageOpportunity) => (
              <ArbitrageCard key={opportunity.id} opportunity={opportunity} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
