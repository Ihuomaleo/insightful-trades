export interface Trade {
  id: string;
  user_id: string;
  pair: string;
  direction: 'long' | 'short';
  entry_price: number;
  exit_price: number | null;
  stop_loss: number;
  take_profit: number | null;
  lot_size: number;
  commission: number;
  entry_time: string;
  exit_time: string | null;
  status: 'open' | 'closed';
  setups: string[];
  emotions: string[];
  notes: string | null;
  before_screenshot: string | null;
  after_screenshot: string | null;
  created_at: string;
  updated_at: string;
}

export interface TradeStats {
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  totalPnL: number;
  expectancy: number;
  bestTrade: number;
  worstTrade: number;
}

export const CURRENCY_PAIRS = [
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF',
  'AUD/USD', 'USD/CAD', 'NZD/USD', 'EUR/GBP',
  'EUR/JPY', 'GBP/JPY', 'AUD/JPY', 'EUR/AUD',
  'EUR/CAD', 'GBP/AUD', 'GBP/CAD', 'XAU/USD',
] as const;

export const SETUPS = [
  'Breakout', 'FVG', 'Order Block', 'Trend Continuation',
  'Reversal', 'Support/Resistance', 'Fibonacci', 'Supply/Demand',
  'Liquidity Grab', 'ICT', 'SMC', 'Elliott Wave',
] as const;

export const EMOTIONS = [
  'Disciplined', 'Confident', 'Patient',
  'FOMO', 'Greedy', 'Fearful', 'Revenge Trading',
  'Overconfident', 'Impulsive', 'Rule Break',
] as const;

export const TRADING_SESSIONS = {
  'Asian': { start: 0, end: 9 },
  'London': { start: 8, end: 17 },
  'New York': { start: 13, end: 22 },
} as const;

export function calculatePips(pair: string, entryPrice: number, exitPrice: number, direction: 'long' | 'short'): number {
  const isJPYPair = pair.includes('JPY');
  const pipMultiplier = isJPYPair ? 100 : 10000;
  
  const priceDiff = direction === 'long' 
    ? (exitPrice - entryPrice) 
    : (entryPrice - exitPrice);
  
  return Math.round(priceDiff * pipMultiplier * 10) / 10;
}

export function calculatePnL(
  pair: string,
  entryPrice: number,
  exitPrice: number,
  lotSize: number,
  direction: 'long' | 'short',
  commission: number = 0
): number {
  const pips = calculatePips(pair, entryPrice, exitPrice, direction);
  const isJPYPair = pair.includes('JPY');
  const pipValue = isJPYPair ? 1000 : 10; // Per standard lot
  
  const grossPnL = pips * pipValue * lotSize;
  return Math.round((grossPnL - commission) * 100) / 100;
}

export function calculateRMultiple(
  entryPrice: number,
  exitPrice: number,
  stopLoss: number,
  direction: 'long' | 'short'
): number {
  const riskPerUnit = direction === 'long' 
    ? entryPrice - stopLoss 
    : stopLoss - entryPrice;
  
  if (riskPerUnit === 0) return 0;
  
  const rewardPerUnit = direction === 'long'
    ? exitPrice - entryPrice
    : entryPrice - exitPrice;
  
  return Math.round((rewardPerUnit / riskPerUnit) * 100) / 100;
}

export function getTradingSession(timestamp: string): 'Asian' | 'London' | 'New York' | 'Off-Hours' {
  const hour = new Date(timestamp).getUTCHours();
  
  if (hour >= 0 && hour < 9) return 'Asian';
  if (hour >= 8 && hour < 17) return 'London';
  if (hour >= 13 && hour < 22) return 'New York';
  return 'Off-Hours';
}

export function getPairBaseCurrency(pair: string): string {
  return pair.split('/')[0];
}
