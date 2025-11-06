import type { ArbitrageOpportunity } from '@deltascan/shared';
import { formatDistance } from 'date-fns';

interface ArbitrageCardProps {
  opportunity: ArbitrageOpportunity;
}

export const ArbitrageCard: React.FC<ArbitrageCardProps> = ({ opportunity }) => {
  const { market1, market2, profitMargin, estimatedProfit, requiredCapital, detectedAt } = opportunity;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Arbitrage Opportunity
          </h3>
          <p className="text-sm text-gray-500">
            Detected {formatDistance(detectedAt, new Date(), { addSuffix: true })}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-600">
            {profitMargin.toFixed(2)}%
          </div>
          <div className="text-sm text-gray-500">Profit Margin</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="border rounded p-3">
          <div className="text-sm font-medium text-gray-700 mb-1">
            {market1.platform.toUpperCase()}
          </div>
          <div className="text-lg font-semibold">
            {market1.outcome}: {market1.displayPrice.toFixed(1)}%
          </div>
        </div>
        <div className="border rounded p-3">
          <div className="text-sm font-medium text-gray-700 mb-1">
            {market2.platform.toUpperCase()}
          </div>
          <div className="text-lg font-semibold">
            {market2.outcome}: {market2.displayPrice.toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-600">Required Capital:</span>
          <span className="ml-2 font-semibold">${requiredCapital.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-gray-600">Est. Profit:</span>
          <span className="ml-2 font-semibold text-green-600">
            ${estimatedProfit.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};
