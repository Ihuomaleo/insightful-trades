import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trade, calculatePnL } from '@/types/trade';
import { format } from 'date-fns';

interface EquityCurveProps {
  trades: Trade[];
  startingBalance?: number;
  title?: string;
}

export function EquityCurve({ trades, startingBalance = 10000, title = 'Equity Curve' }: EquityCurveProps) {
  const chartData = useMemo(() => {
    const closedTrades = trades
      .filter(t => t.status === 'closed' && t.exit_price !== null)
      .sort((a, b) => new Date(a.exit_time!).getTime() - new Date(b.exit_time!).getTime());

    let balance = startingBalance;
    const data = [{ date: 'Start', balance, label: 'Starting Balance' }];

    closedTrades.forEach((trade, index) => {
      const pnl = calculatePnL(
        trade.pair,
        trade.entry_price,
        trade.exit_price!,
        trade.lot_size,
        trade.direction,
        trade.commission
      );
      balance += pnl;
      data.push({
        date: format(new Date(trade.exit_time!), 'MMM dd'),
        balance: Math.round(balance * 100) / 100,
        label: `Trade ${index + 1}: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`,
      });
    });

    return data;
  }, [trades, startingBalance]);

  const isPositive = chartData.length > 1 && chartData[chartData.length - 1].balance >= startingBalance;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length <= 1 ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              <p>No closed trades yet. Start trading to see your equity curve.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="lossGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 32%, 18%)" />
                <XAxis
                  dataKey="date"
                  stroke="hsl(215, 20%, 55%)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(215, 20%, 55%)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(222, 47%, 8%)',
                    border: '1px solid hsl(217, 32%, 18%)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                  }}
                  labelStyle={{ color: 'hsl(210, 40%, 98%)' }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Balance']}
                />
                <Area
                  type="monotone"
                  dataKey="balance"
                  stroke={isPositive ? 'hsl(160, 84%, 39%)' : 'hsl(0, 84%, 60%)'}
                  strokeWidth={2}
                  fill={isPositive ? 'url(#profitGradient)' : 'url(#lossGradient)'}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
