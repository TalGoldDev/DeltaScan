import { Bet } from '../types/market';

/**
 * Calculate if an arbitrage opportunity exists between two bets
 * Returns the profit margin percentage, or null if no arbitrage exists
 */
export function calculateArbitrage(bet1: Bet, bet2: Bet): number | null {
  // For arbitrage, we need opposing positions (YES on one, NO on other)
  if (bet1.outcome === bet2.outcome) {
    return null;
  }

  // Calculate total implied probability
  const totalProbability = bet1.price + bet2.price;

  // If total probability < 1, arbitrage exists
  if (totalProbability < 1) {
    // Profit margin = (1 - total probability) / total probability * 100
    const profitMargin = ((1 - totalProbability) / totalProbability) * 100;
    return profitMargin;
  }

  return null;
}

/**
 * Calculate required capital for an arbitrage opportunity
 */
export function calculateRequiredCapital(
  bet1: Bet,
  bet2: Bet,
  targetProfit: number = 100
): number {
  const totalProbability = bet1.price + bet2.price;

  if (totalProbability >= 1) {
    throw new Error('No arbitrage opportunity exists');
  }

  // Calculate required capital to achieve target profit
  const profitMargin = (1 - totalProbability) / totalProbability;
  const requiredCapital = targetProfit / profitMargin;

  return requiredCapital;
}

/**
 * Calculate stake allocation for each position
 */
export function calculateStakeAllocation(
  bet1: Bet,
  bet2: Bet,
  totalCapital: number
): { stake1: number; stake2: number } {
  const totalProbability = bet1.price + bet2.price;

  if (totalProbability >= 1) {
    throw new Error('No arbitrage opportunity exists');
  }

  // Calculate stakes to ensure equal profit regardless of outcome
  const stake1 = (totalCapital * bet1.price) / totalProbability;
  const stake2 = (totalCapital * bet2.price) / totalProbability;

  return { stake1, stake2 };
}

/**
 * Calculate expected profit from an arbitrage opportunity
 */
export function calculateExpectedProfit(
  bet1: Bet,
  bet2: Bet,
  totalCapital: number
): number {
  const totalProbability = bet1.price + bet2.price;

  if (totalProbability >= 1) {
    return 0;
  }

  const profitMargin = (1 - totalProbability) / totalProbability;
  return totalCapital * profitMargin;
}

/**
 * Convert decimal odds to percentage
 */
export function decimalToPercentage(decimal: number): number {
  return decimal * 100;
}

/**
 * Convert percentage to decimal odds
 */
export function percentageToDecimal(percentage: number): number {
  return percentage / 100;
}
