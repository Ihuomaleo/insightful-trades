import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  Line,
  ComposedChart,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Trade, calculatePnL } from '@/types/trade';
import { format } from 'date-fns';
import { AlertTriangle, TrendingUp } from 'lucide-react';

interface EquityCurveProps {
  trades: Trade[];
  startingBalance?: number;
  title?: string;
  showComparison?: boolean;
}

const NEGATIVE_EMOTIONS = ['FOMO', 'Greedy', 'Fearful', 'Revenge Trading', 'Overconfident', 'Impulsive', 'Rule Break'];

export function EquityCurve({ 
  trades, 
  startingBalance = 10000, 
  title = 'Equity Curve',
  showComparison = false 
}: EquityCurveProps) {
  const [comparisonEnabled, setComparisonEnabled] = useState(showComparison);

  const { chartData, hasNegativeEmotionTrades, stats } = useMemo(() => {
    const closedTrades = trades
      .filter(t => t.status === 'closed' && t.exit_price !== null)
      .sort((a, b) => new Date(a.exit_time!).getTime() - new Date(b.exit_time!).getTime());

    let actualBalance = startingBalance;
    let cleanBalance = startingBalance;
    
    const data: Array<{
      date: string;
      balance: number;
      cleanBalance: number;
      label: string;
      isNegativeEmotion: boolean;
    }> = [{ 
      date: 'Start', 
      balance: startingBalance, 
      cleanBalance: startingBalance,
      label: 'Starting Balance',
      isNegativeEmotion: false
    }];

    let hasNegative = false;
    let negativeCount = 0;
    let negativePnL = 0;

    closedTrades.forEach((trade, index) => {
      const pnl = calculatePnL(
        trade.pair,
        trade.entry_price,
        trade.exit_price!,
        trade.lot_size,
        trade.direction,
        trade.commission
      );
      
      const isNegativeEmotion = trade.emotions.some(e => NEGATIVE_EMOTIONS.includes(e));
      
      if (isNegativeEmotion) {
        hasNegative = true;
        negativeCount++;
        negativePnL += pnl;
      }

      actualBalance += pnl;
      
      // Clean balance only adds trades without negative emotions
      if (!isNegativeEmotion) {
        cleanBalance += pnl;
      }

      data.push({
        date: format(new Date(trade.exit_time!), 'MMM dd'),
        balance: Math.round(actualBalance * 100) / 100,
        cleanBalance: Math.round(cleanBalance * 100) / 100,
        label: `Trade ${index + 1}: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}${isNegativeEmotion ? ' ⚠️' : ''}`,
        isNegativeEmotion,
      });
    });

    return { 
      chartData: data, 
      hasNegativeEmotionTrades: hasNegative,
      stats: {
        negativeCount,
        negativePnL: Math.round(negativePnL * 100) / 100,
        difference: Math.round((cleanBalance - actualBalance) * 100) / 100,
        actualFinal: Math.round(actualBalance * 100) / 100,
        cleanFinal: Math.round(cleanBalance * 100) / 100,
      }
    };
  }, [trades, startingBalance]);

  const isPositive = chartData.length > 1 && chartData[chartData.length - 1].balance >= startingBalance;
  const isCleanPositive = chartData.length > 1 && chartData[chartData.length - 1].cleanBalance >= startingBalance;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base md:text-lg font-medium">{title}</CardTitle>
          {hasNegativeEmotionTrades && (
            <div className="flex items-center gap-2">
              <Switch
                id="comparison-mode"
                checked={comparisonEnabled}
                onCheckedChange={setComparisonEnabled}
              />
              <Label htmlFor="comparison-mode" className="text-xs md:text-sm text-muted-foreground cursor-pointer">
                Show "Without Mistakes"
              </Label>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {chartData.length <= 1 ? (
            <div className="h-[250px] md:h-[300px] flex items-center justify-center text-muted-foreground">
              <p className="text-sm text-center px-4">No closed trades yet. Start trading to see your equity curve.</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={280} className="md:!h-[320px]">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="lossGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="cleanGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 32%, 18%)" />
                  <XAxis
                    dataKey="date"
                    stroke="hsl(215, 20%, 55%)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(215, 20%, 55%)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                    width={55}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(222, 47%, 8%)',
                      border: '1px solid hsl(217, 32%, 18%)',
                      borderRadius: '8px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                      fontSize: '12px',
                    }}
                    labelStyle={{ color: 'hsl(210, 40%, 98%)' }}
                    formatter={(value: number, name: string) => {
                      if (name === 'balance') return [`$${value.toLocaleString()}`, 'Actual Balance'];
                      if (name === 'cleanBalance') return [`$${value.toLocaleString()}`, 'Without Mistakes'];
                      return [value, name];
                    }}
                  />
                  {comparisonEnabled && (
                    <Legend 
                      wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                      formatter={(value) => {
                        if (value === 'balance') return <span className="text-foreground">Actual</span>;
                        if (value === 'cleanBalance') return <span className="text-amber-500">Without Mistakes</span>;
                        return value;
                      }}
                    />
                  )}
                  <Area
                    type="monotone"
                    dataKey="balance"
                    stroke={isPositive ? 'hsl(160, 84%, 39%)' : 'hsl(0, 84%, 60%)'}
                    strokeWidth={2}
                    fill={isPositive ? 'url(#profitGradient)' : 'url(#lossGradient)'}
                    name="balance"
                  />
                  {comparisonEnabled && (
                    <Line
                      type="monotone"
                      dataKey="cleanBalance"
                      stroke="hsl(38, 92%, 50%)"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                      name="cleanBalance"
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>

              {/* Comparison Stats */}
              {comparisonEnabled && hasNegativeEmotionTrades && stats.negativeCount > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-3 md:p-4 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <span className="text-xs md:text-sm">
                        <strong className="text-amber-500">{stats.negativeCount}</strong> emotional trade{stats.negativeCount !== 1 ? 's' : ''} tracked
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs md:text-sm text-muted-foreground">
                        Cost: <strong className={stats.negativePnL >= 0 ? 'text-profit' : 'text-loss'}>
                          {stats.negativePnL >= 0 ? '+' : ''}${stats.negativePnL}
                        </strong>
                      </span>
                    </div>
                    {stats.difference > 0 && (
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-profit flex-shrink-0" />
                        <span className="text-xs md:text-sm">
                          Potential gain: <strong className="text-profit font-mono">+${stats.difference}</strong>
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
