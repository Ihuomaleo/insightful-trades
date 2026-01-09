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
import { Trade, calculatePnL, getTradingSession, SETUPS, EMOTIONS } from '@/types/trade';
import { TrendingUp, TrendingDown, AlertTriangle, Heart, Brain, Zap } from 'lucide-react';

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

  // Emotion Impact Analysis
  const emotionData = useMemo(() => {
    const closedTrades = trades.filter(t => t.status === 'closed' && t.exit_price !== null);
    const emotionStats: Record<string, { wins: number; losses: number; pnl: number; count: number }> = {};

    // Categorize emotions as positive or negative
    const negativeEmotions = ['FOMO', 'Greedy', 'Fearful', 'Revenge Trading', 'Overconfident', 'Impulsive', 'Rule Break'];
    const positiveEmotions = ['Disciplined', 'Confident', 'Patient'];

    closedTrades.forEach(trade => {
      const pnl = calculatePnL(trade.pair, trade.entry_price, trade.exit_price!, trade.lot_size, trade.direction, trade.commission);
      const isWin = pnl > 0;

      trade.emotions.forEach(emotion => {
        if (!emotionStats[emotion]) {
          emotionStats[emotion] = { wins: 0, losses: 0, pnl: 0, count: 0 };
        }
        if (isWin) {
          emotionStats[emotion].wins += 1;
        } else {
          emotionStats[emotion].losses += 1;
        }
        emotionStats[emotion].pnl += pnl;
        emotionStats[emotion].count += 1;
      });
    });

    const emotionList = Object.entries(emotionStats)
      .map(([emotion, data]) => ({
        emotion,
        winRate: Math.round((data.wins / (data.wins + data.losses)) * 100),
        totalTrades: data.wins + data.losses,
        pnl: Math.round(data.pnl * 100) / 100,
        isNegative: negativeEmotions.includes(emotion),
        isPositive: positiveEmotions.includes(emotion),
      }))
      .sort((a, b) => b.pnl - a.pnl);

    // Calculate "What If" - performance without negative emotion trades
    const negativeEmotionTrades = closedTrades.filter(t => 
      t.emotions.some(e => negativeEmotions.includes(e))
    );
    const cleanTrades = closedTrades.filter(t => 
      !t.emotions.some(e => negativeEmotions.includes(e))
    );

    const negativePnL = negativeEmotionTrades.reduce((sum, t) => 
      sum + calculatePnL(t.pair, t.entry_price, t.exit_price!, t.lot_size, t.direction, t.commission), 0
    );
    const cleanPnL = cleanTrades.reduce((sum, t) => 
      sum + calculatePnL(t.pair, t.entry_price, t.exit_price!, t.lot_size, t.direction, t.commission), 0
    );
    const totalPnL = closedTrades.reduce((sum, t) => 
      sum + calculatePnL(t.pair, t.entry_price, t.exit_price!, t.lot_size, t.direction, t.commission), 0
    );

    const cleanWins = cleanTrades.filter(t => 
      calculatePnL(t.pair, t.entry_price, t.exit_price!, t.lot_size, t.direction, t.commission) > 0
    ).length;
    const cleanWinRate = cleanTrades.length > 0 ? Math.round((cleanWins / cleanTrades.length) * 100) : 0;

    return {
      emotions: emotionList,
      whatIf: {
        totalPnL: Math.round(totalPnL * 100) / 100,
        cleanPnL: Math.round(cleanPnL * 100) / 100,
        negativePnL: Math.round(negativePnL * 100) / 100,
        lostOpportunity: Math.round((cleanPnL - totalPnL) * 100) / 100,
        negativeTradeCount: negativeEmotionTrades.length,
        cleanTradeCount: cleanTrades.length,
        cleanWinRate,
      },
      negativeEmotions,
      positiveEmotions,
    };
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
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-xl md:text-2xl font-semibold">Strategy Analytics</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Deep dive into your trading performance
        </p>
      </motion.div>

      {/* Equity Curve */}
      <EquityCurve trades={trades} />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Session Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-border/50 bg-card/80">
            <CardHeader className="pb-2 md:pb-4">
              <CardTitle className="text-base md:text-lg font-medium">Session Performance</CardTitle>
            </CardHeader>
            <CardContent className="px-2 md:px-6">
              {sessionData.length === 0 ? (
                <div className="h-[200px] md:h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                  No session data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200} className="md:!h-[250px]">
                  <BarChart data={sessionData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 32%, 18%)" />
                    <XAxis
                      dataKey="session"
                      stroke="hsl(215, 20%, 55%)"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis
                      stroke="hsl(215, 20%, 55%)"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `$${value}`}
                      width={45}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(222, 47%, 8%)',
                        border: '1px solid hsl(217, 32%, 18%)',
                        borderRadius: '8px',
                        fontSize: '12px',
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
            <CardHeader className="pb-2 md:pb-4">
              <CardTitle className="text-base md:text-lg font-medium">Pair Distribution</CardTitle>
            </CardHeader>
            <CardContent className="px-2 md:px-6">
              {pairDistribution.length === 0 ? (
                <div className="h-[200px] md:h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                  No pair data available
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <ResponsiveContainer width="100%" height={180} className="sm:!w-1/2 sm:!h-[220px]">
                    <PieChart>
                      <Pie
                        data={pairDistribution}
                        dataKey="count"
                        nameKey="pair"
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={70}
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
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="w-full sm:flex-1 grid grid-cols-2 sm:grid-cols-1 gap-1.5 sm:space-y-1.5">
                    {pairDistribution.map((item, index) => (
                      <div key={item.pair} className="flex items-center gap-2 text-xs sm:text-sm">
                        <div
                          className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-mono truncate">{item.pair}</span>
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
          <CardHeader className="pb-2 md:pb-4">
            <CardTitle className="text-base md:text-lg font-medium">Setup Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {setupData.length === 0 ? (
              <div className="h-[150px] md:h-[200px] flex items-center justify-center text-muted-foreground text-sm text-center px-4">
                No setup data available. Tag your trades with setups to see performance.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {setupData.map(setup => (
                  <div
                    key={setup.setup}
                    className="p-3 md:p-4 rounded-lg bg-muted/30 border border-border/50"
                  >
                    <div className="flex items-center justify-between mb-1.5 md:mb-2">
                      <span className="font-medium text-sm md:text-base truncate mr-2">{setup.setup}</span>
                      <span className={`font-mono text-xs md:text-sm flex-shrink-0 ${setup.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                        {setup.pnl >= 0 ? '+' : ''}${setup.pnl}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 md:gap-4 text-xs md:text-sm text-muted-foreground">
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

      {/* Emotion Impact Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
      >
        <Card className="border-border/50 bg-card/80">
          <CardHeader className="pb-2 md:pb-4">
            <CardTitle className="text-base md:text-lg font-medium flex items-center gap-2">
              <Brain className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              Emotion Impact Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {emotionData.emotions.length === 0 ? (
              <div className="h-[150px] md:h-[200px] flex items-center justify-center text-muted-foreground text-sm text-center px-4">
                No emotion data available. Tag your trades with emotions to see their impact.
              </div>
            ) : (
              <>
                {/* What If Analysis Card */}
                {emotionData.whatIf.negativeTradeCount > 0 && (
                  <div className="p-4 md:p-6 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                      <h3 className="font-semibold text-sm md:text-base">Mistake Filter Analysis</h3>
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground mb-4">
                      What your performance would look like without trades tagged with negative emotions 
                      (FOMO, Greedy, Fearful, Revenge Trading, Overconfident, Impulsive, Rule Break).
                    </p>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-3 rounded-lg bg-background/50">
                        <p className="text-xs text-muted-foreground mb-1">Current P/L</p>
                        <p className={`text-lg md:text-xl font-mono font-semibold ${emotionData.whatIf.totalPnL >= 0 ? 'text-profit' : 'text-loss'}`}>
                          {emotionData.whatIf.totalPnL >= 0 ? '+' : ''}${emotionData.whatIf.totalPnL.toFixed(2)}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-background/50">
                        <p className="text-xs text-muted-foreground mb-1">Without Mistakes</p>
                        <p className={`text-lg md:text-xl font-mono font-semibold ${emotionData.whatIf.cleanPnL >= 0 ? 'text-profit' : 'text-loss'}`}>
                          {emotionData.whatIf.cleanPnL >= 0 ? '+' : ''}${emotionData.whatIf.cleanPnL.toFixed(2)}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-background/50">
                        <p className="text-xs text-muted-foreground mb-1">Cost of Mistakes</p>
                        <p className={`text-lg md:text-xl font-mono font-semibold ${emotionData.whatIf.negativePnL >= 0 ? 'text-profit' : 'text-loss'}`}>
                          {emotionData.whatIf.negativePnL >= 0 ? '+' : ''}${emotionData.whatIf.negativePnL.toFixed(2)}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-background/50">
                        <p className="text-xs text-muted-foreground mb-1">Mistake Trades</p>
                        <p className="text-lg md:text-xl font-mono font-semibold text-amber-500">
                          {emotionData.whatIf.negativeTradeCount} trades
                        </p>
                      </div>
                    </div>
                    {emotionData.whatIf.lostOpportunity > 0 && (
                      <div className="mt-4 p-3 rounded-lg bg-profit/10 border border-profit/30 flex items-center gap-3">
                        <TrendingUp className="w-5 h-5 text-profit flex-shrink-0" />
                        <p className="text-xs md:text-sm">
                          <strong className="text-profit">Potential gain:</strong>{' '}
                          <span className="text-muted-foreground">
                            You could be{' '}
                            <span className="font-mono font-semibold text-profit">
                              ${emotionData.whatIf.lostOpportunity.toFixed(2)}
                            </span>{' '}
                            ahead without emotional trades ({emotionData.whatIf.cleanWinRate}% win rate on clean trades).
                          </span>
                        </p>
                      </div>
                    )}
                    {emotionData.whatIf.lostOpportunity <= 0 && emotionData.whatIf.negativeTradeCount > 0 && (
                      <div className="mt-4 p-3 rounded-lg bg-loss/10 border border-loss/30 flex items-center gap-3">
                        <TrendingDown className="w-5 h-5 text-loss flex-shrink-0" />
                        <p className="text-xs md:text-sm">
                          <strong className="text-loss">Impact:</strong>{' '}
                          <span className="text-muted-foreground">
                            Emotional trades have cost you{' '}
                            <span className="font-mono font-semibold text-loss">
                              ${Math.abs(emotionData.whatIf.negativePnL).toFixed(2)}
                            </span>. Focus on eliminating these patterns.
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Emotion Performance Grid */}
                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    Performance by Emotion Tag
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                    {emotionData.emotions.map(item => (
                      <div
                        key={item.emotion}
                        className={`p-3 md:p-4 rounded-lg border ${
                          item.isNegative 
                            ? 'bg-loss/5 border-loss/30' 
                            : item.isPositive 
                              ? 'bg-profit/5 border-profit/30' 
                              : 'bg-muted/30 border-border/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5 md:mb-2">
                          <div className="flex items-center gap-2">
                            {item.isNegative ? (
                              <AlertTriangle className="w-3.5 h-3.5 text-loss" />
                            ) : item.isPositive ? (
                              <Heart className="w-3.5 h-3.5 text-profit" />
                            ) : null}
                            <span className="font-medium text-sm md:text-base truncate">{item.emotion}</span>
                          </div>
                          <span className={`font-mono text-xs md:text-sm flex-shrink-0 ${item.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                            {item.pnl >= 0 ? '+' : ''}${item.pnl}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 md:gap-4 text-xs md:text-sm text-muted-foreground">
                          <span>Win Rate: <strong className="text-foreground">{item.winRate}%</strong></span>
                          <span>Trades: <strong className="text-foreground">{item.totalTrades}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
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
          <CardHeader className="pb-2 md:pb-4">
            <CardTitle className="text-base md:text-lg font-medium">Performance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground mb-0.5 md:mb-1">Expectancy</p>
                <p className="text-[10px] md:text-xs text-muted-foreground font-mono hidden sm:block">
                  (Win% × Avg Win) - (Loss% × Avg Loss)
                </p>
                <p className={`text-lg md:text-xl font-mono font-semibold mt-1 md:mt-2 ${stats.expectancy >= 0 ? 'text-profit' : 'text-loss'}`}>
                  ${stats.expectancy.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground mb-0.5 md:mb-1">Risk/Reward</p>
                <p className="text-[10px] md:text-xs text-muted-foreground hidden sm:block">
                  Average Win vs Average Loss
                </p>
                <p className="text-lg md:text-xl font-mono font-semibold mt-1 md:mt-2">
                  {stats.avgLoss > 0 ? (stats.avgWin / stats.avgLoss).toFixed(2) : '—'}:1
                </p>
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground mb-0.5 md:mb-1">Break-Even WR</p>
                <p className="text-[10px] md:text-xs text-muted-foreground hidden sm:block">
                  Required win rate to break even
                </p>
                <p className="text-lg md:text-xl font-mono font-semibold mt-1 md:mt-2">
                  {stats.avgWin + stats.avgLoss > 0
                    ? Math.round((stats.avgLoss / (stats.avgWin + stats.avgLoss)) * 100)
                    : '—'}%
                </p>
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground mb-0.5 md:mb-1">Edge</p>
                <p className="text-[10px] md:text-xs text-muted-foreground hidden sm:block">
                  Win Rate vs Break-Even
                </p>
                <p className={`text-lg md:text-xl font-mono font-semibold mt-1 md:mt-2 ${
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
