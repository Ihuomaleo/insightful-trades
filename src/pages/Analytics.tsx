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
import { useTrades, useTradeStats, useStrategyStats } from '@/hooks/useTrades';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EquityCurve } from '@/components/dashboard/EquityCurve';
import { CalendarHeatmap } from '@/components/analytics/CalendarHeatmap';
import { StreakTracker } from '@/components/analytics/StreakTracker';
import { calculatePnL, getTradingSession } from '@/types/trade';
import { TrendingUp, TrendingDown, AlertTriangle, Heart, Brain, Zap } from 'lucide-react';

export default function AnalyticsPage() {
  const { trades, isLoading } = useTrades();
  const stats = useTradeStats(trades);
  const strategyData = useStrategyStats(trades);

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

  // Emotion Impact Analysis
  const emotionData = useMemo(() => {
    const closedTrades = trades.filter(t => t.status === 'closed' && t.exit_price !== null);
    const emotionStats: Record<string, { wins: number; losses: number; pnl: number; count: number }> = {};

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
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl md:text-2xl font-semibold">Strategy Analytics</h1>
        <p className="text-sm md:text-base text-muted-foreground">Deep dive into your trading performance</p>
      </motion.div>

      <EquityCurve trades={trades} showComparison={true} />
      <CalendarHeatmap trades={trades} />
      <StreakTracker trades={trades} />

      {/* New Strategy Performance Breakdown */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="border-border/50 bg-card/80">
          <CardHeader>
            <CardTitle className="text-base md:text-lg font-medium">Strategy P/L Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {strategyData.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">No strategy data available</div>
            ) : (
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={strategyData} layout="vertical" margin={{ left: 40, right: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(217, 32%, 18%)" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={100} fontSize={12} stroke="#888" tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
                    <Bar dataKey="pnl" radius={[0, 4, 4, 0]}>
                      {strategyData.map((entry, index) => (
                        <Cell key={index} fill={entry.pnl >= 0 ? 'hsl(160, 84%, 39%)' : 'hsl(0, 84%, 60%)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {strategyData.map(strategy => (
                <div key={strategy.name} className="p-4 rounded-lg bg-muted/30 border border-border/50">
                  <p className="text-sm text-muted-foreground mb-1">{strategy.name}</p>
                  <p className="text-xl font-bold font-mono tracking-tight">{strategy.winRate}% Win Rate</p>
                  <p className="text-xs text-muted-foreground mt-1">{strategy.total} trades · ${strategy.pnl} P/L</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card className="border-border/50 bg-card/80">
          <CardHeader className="pb-2 md:pb-4"><CardTitle className="text-base md:text-lg font-medium">Session Performance</CardTitle></CardHeader>
          <CardContent className="px-2 md:px-6">
            {sessionData.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">No session data available</div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={sessionData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(217, 32%, 18%)" />
                  <XAxis dataKey="session" fontSize={10} stroke="#888" tickLine={false} axisLine={false} />
                  <YAxis fontSize={10} stroke="#888" tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
                  <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                    {sessionData.map((entry, index) => <Cell key={index} fill={entry.pnl >= 0 ? 'hsl(160, 84%, 39%)' : 'hsl(0, 84%, 60%)'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/80">
          <CardHeader className="pb-2 md:pb-4"><CardTitle className="text-base md:text-lg font-medium">Pair Distribution</CardTitle></CardHeader>
          <CardContent className="px-2 md:px-6">
            {pairDistribution.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">No pair data available</div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <ResponsiveContainer width="100%" height={220} className="sm:!w-1/2">
                  <PieChart>
                    <Pie data={pairDistribution} dataKey="count" nameKey="pair" cx="50%" cy="50%" innerRadius={35} outerRadius={70} paddingAngle={2}>
                      {pairDistribution.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="w-full sm:flex-1 grid grid-cols-2 sm:grid-cols-1 gap-1.5">
                  {pairDistribution.map((item, index) => (
                    <div key={item.pair} className="flex items-center gap-2 text-xs sm:text-sm">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="font-mono truncate">{item.pair}</span>
                      <span className="text-muted-foreground ml-auto">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Emotion Impact Analysis */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="border-border/50 bg-card/80">
          <CardHeader className="pb-2 md:pb-4">
            <CardTitle className="text-base md:text-lg font-medium flex items-center gap-2">
              <Brain className="w-4 h-4 md:w-5 md:h-5 text-primary" /> Emotion Impact Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {emotionData.emotions.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">No emotion data available</div>
            ) : (
              <>
                {emotionData.whatIf.negativeTradeCount > 0 && (
                  <div className="p-4 md:p-6 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30">
                    <div className="flex items-center gap-2 mb-4"><AlertTriangle className="w-5 h-5 text-amber-500" /><h3 className="font-semibold">Mistake Filter Analysis</h3></div>
                    <p className="text-xs md:text-sm text-muted-foreground mb-4">Performance without trades tagged with negative emotions.</p>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-3 rounded-lg bg-background/50"><p className="text-xs text-muted-foreground mb-1">Current P/L</p><p className={`text-lg font-mono font-semibold ${emotionData.whatIf.totalPnL >= 0 ? 'text-profit' : 'text-loss'}`}>${emotionData.whatIf.totalPnL.toFixed(2)}</p></div>
                      <div className="p-3 rounded-lg bg-background/50"><p className="text-xs text-muted-foreground mb-1">Without Mistakes</p><p className={`text-lg font-mono font-semibold ${emotionData.whatIf.cleanPnL >= 0 ? 'text-profit' : 'text-loss'}`}>${emotionData.whatIf.cleanPnL.toFixed(2)}</p></div>
                      <div className="p-3 rounded-lg bg-background/50"><p className="text-xs text-muted-foreground mb-1">Cost of Mistakes</p><p className={`text-lg font-mono font-semibold text-loss`}>-${Math.abs(emotionData.whatIf.negativePnL).toFixed(2)}</p></div>
                      <div className="p-3 rounded-lg bg-background/50"><p className="text-xs text-muted-foreground mb-1">Mistake Trades</p><p className="text-lg font-mono font-semibold text-amber-500">{emotionData.whatIf.negativeTradeCount}</p></div>
                    </div>
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2"><Zap className="w-4 h-4 text-primary" /> Performance by Emotion Tag</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {emotionData.emotions.map(item => (
                      <div key={item.emotion} className={`p-4 rounded-lg border ${item.isNegative ? 'bg-loss/5 border-loss/30' : item.isPositive ? 'bg-profit/5 border-profit/30' : 'bg-muted/30 border-border/50'}`}>
                        <div className="flex items-center justify-between mb-2"><span className="font-medium text-sm">{item.emotion}</span><span className={`font-mono text-sm ${item.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>${item.pnl}</span></div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground"><span>Win Rate: <strong className="text-foreground">{item.winRate}%</strong></span><span>Trades: <strong className="text-foreground">{item.totalTrades}</strong></span></div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card className="border-border/50 bg-card/80">
          <CardHeader><CardTitle className="text-base md:text-lg font-medium">Performance Summary</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div><p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Expectancy</p><p className={`text-xl font-mono font-semibold ${stats.expectancy >= 0 ? 'text-profit' : 'text-loss'}`}>${stats.expectancy.toFixed(2)}</p></div>
              <div><p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Risk/Reward</p><p className="text-xl font-mono font-semibold">{stats.avgLoss > 0 ? (stats.avgWin / stats.avgLoss).toFixed(2) : '—'}:1</p></div>
              <div><p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Break-Even WR</p><p className="text-xl font-mono font-semibold">{stats.avgWin + stats.avgLoss > 0 ? Math.round((stats.avgLoss / (stats.avgWin + stats.avgLoss)) * 100) : '—'}%</p></div>
              <div><p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Edge</p><p className={`text-xl font-mono font-semibold ${stats.winRate > (stats.avgLoss / (stats.avgWin + stats.avgLoss)) * 100 ? 'text-profit' : 'text-loss'}`}>{stats.avgWin + stats.avgLoss > 0 ? `${(stats.winRate - (stats.avgLoss / (stats.avgWin + stats.avgLoss)) * 100).toFixed(1)}%` : '—'}</p></div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}