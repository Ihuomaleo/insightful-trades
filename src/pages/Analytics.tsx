import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { useTrades, useTradeStats } from '@/hooks/useTrades';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EquityCurve } from '@/components/dashboard/EquityCurve';
import { Trade, calculatePnL, getTradingSession, SETUPS } from '@/types/trade';

export default function AnalyticsPage() {
  const { trades, isLoading } = useTrades();
  const stats = useTradeStats(trades);

  // Session Analysis
  const sessionData = useMemo(() => {
    const closedTrades = trades.filter(t => t.status === 'closed' && t.exit_price !== null);
    const sessions: Record<string, { pnl: number; count: number }> = {
      'Asian': { pnl: 0, count: 0 },
      'London': { pnl: 0, count: 0 },
      'New York': { pnl: 0, count: 0 },
      'Off-Hours': { pnl: 0, count: 0 },
    };

    closedTrades.forEach(trade => {
      const session = getTradingSession(trade.entry_time);
      const pnl = calculatePnL(trade.pair, trade.entry_price, trade.exit_price!, trade.lot_size, trade.direction, trade.commission);
      sessions[session].pnl += pnl;
      sessions[session].count += 1;
    });

    return Object.entries(sessions)
      .filter(([_, data]) => data.count > 0)
      .map(([session, data]) => ({
        session,
        pnl: Math.round(data.pnl * 100) / 100,
        trades: data.count,
        avgPnl: data.count > 0 ? Math.round((data.pnl / data.count) * 100) / 100 : 0,
      }));
  }, [trades]);

  // Setup Performance
  const setupData = useMemo(() => {
    const closedTrades = trades.filter(t => t.status === 'closed' && t.exit_price !== null);
    const setupStats: Record<string, { wins: number; losses: number; pnl: number }> = {};

    closedTrades.forEach(trade => {
      const pnl = calculatePnL(trade.pair, trade.entry_price, trade.exit_price!, trade.lot_size, trade.direction, trade.commission);
      const isWin = pnl > 0;

      trade.setups.forEach(setup => {
        if (!setupStats[setup]) {
          setupStats[setup] = { wins: 0, losses: 0, pnl: 0 };
        }
        if (isWin) {
          setupStats[setup].wins += 1;
        } else {
          setupStats[setup].losses += 1;
        }
        setupStats[setup].pnl += pnl;
      });
    });

    return Object.entries(setupStats)
      .map(([setup, data]) => ({
        setup,
        winRate: Math.round((data.wins / (data.wins + data.losses)) * 100),
        totalTrades: data.wins + data.losses,
        pnl: Math.round(data.pnl * 100) / 100,
      }))
      .sort((a, b) => b.pnl - a.pnl);
  }, [trades]);

  // Currency Pair Distribution
  const pairDistribution = useMemo(() => {
    const pairCounts: Record<string, number> = {};
    trades.forEach(trade => {
      pairCounts[trade.pair] = (pairCounts[trade.pair] || 0) + 1;
    });

    return Object.entries(pairCounts)
      .map(([pair, count]) => ({ pair, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [trades]);

  const COLORS = [
    'hsl(217, 91%, 60%)',
    'hsl(160, 84%, 39%)',
    'hsl(38, 92%, 50%)',
    'hsl(280, 65%, 60%)',
    'hsl(0, 84%, 60%)',
    'hsl(195, 80%, 45%)',
    'hsl(330, 65%, 50%)',
    'hsl(45, 80%, 50%)',
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-semibold">Strategy Analytics</h1>
        <p className="text-muted-foreground">
          Deep dive into your trading performance
        </p>
      </motion.div>

      {/* Equity Curve */}
      <EquityCurve trades={trades} />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Session Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-border/50 bg-card/80">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Session Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {sessionData.length === 0 ? (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  No session data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={sessionData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 32%, 18%)" />
                    <XAxis
                      dataKey="session"
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
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(222, 47%, 8%)',
                        border: '1px solid hsl(217, 32%, 18%)',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number, name: string) => {
                        if (name === 'pnl') return [`$${value.toFixed(2)}`, 'P/L'];
                        return [value, name];
                      }}
                    />
                    <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                      {sessionData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.pnl >= 0 ? 'hsl(160, 84%, 39%)' : 'hsl(0, 84%, 60%)'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Pair Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-border/50 bg-card/80">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Pair Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {pairDistribution.length === 0 ? (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  No pair data available
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <ResponsiveContainer width="50%" height={250}>
                    <PieChart>
                      <Pie
                        data={pairDistribution}
                        dataKey="count"
                        nameKey="pair"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={90}
                        paddingAngle={2}
                      >
                        {pairDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(222, 47%, 8%)',
                          border: '1px solid hsl(217, 32%, 18%)',
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2">
                    {pairDistribution.map((item, index) => (
                      <div key={item.pair} className="flex items-center gap-2 text-sm">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-mono">{item.pair}</span>
                        <span className="text-muted-foreground ml-auto">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Setup Performance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="border-border/50 bg-card/80">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Setup Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {setupData.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No setup data available. Tag your trades with setups to see performance.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {setupData.map(setup => (
                  <div
                    key={setup.setup}
                    className="p-4 rounded-lg bg-muted/30 border border-border/50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{setup.setup}</span>
                      <span className={`font-mono text-sm ${setup.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                        {setup.pnl >= 0 ? '+' : ''}${setup.pnl}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Win Rate: <strong className="text-foreground">{setup.winRate}%</strong></span>
                      <span>Trades: <strong className="text-foreground">{setup.totalTrades}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Key Stats Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="border-border/50 bg-card/80">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Performance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Expectancy Formula</p>
                <p className="text-xs text-muted-foreground font-mono">
                  (Win% × Avg Win) - (Loss% × Avg Loss)
                </p>
                <p className={`text-xl font-mono font-semibold mt-2 ${stats.expectancy >= 0 ? 'text-profit' : 'text-loss'}`}>
                  ${stats.expectancy.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Risk/Reward</p>
                <p className="text-xs text-muted-foreground">
                  Average Win vs Average Loss
                </p>
                <p className="text-xl font-mono font-semibold mt-2">
                  {stats.avgLoss > 0 ? (stats.avgWin / stats.avgLoss).toFixed(2) : '—'}:1
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Break-Even Win Rate</p>
                <p className="text-xs text-muted-foreground">
                  Required win rate to break even
                </p>
                <p className="text-xl font-mono font-semibold mt-2">
                  {stats.avgWin + stats.avgLoss > 0
                    ? Math.round((stats.avgLoss / (stats.avgWin + stats.avgLoss)) * 100)
                    : '—'}%
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Edge</p>
                <p className="text-xs text-muted-foreground">
                  Win Rate vs Break-Even
                </p>
                <p className={`text-xl font-mono font-semibold mt-2 ${
                  stats.winRate > (stats.avgLoss / (stats.avgWin + stats.avgLoss)) * 100 ? 'text-profit' : 'text-loss'
                }`}>
                  {stats.avgWin + stats.avgLoss > 0
                    ? `${(stats.winRate - (stats.avgLoss / (stats.avgWin + stats.avgLoss)) * 100).toFixed(1)}%`
                    : '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
