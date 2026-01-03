import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Percent,
  DollarSign,
  BarChart3,
  Filter,
} from 'lucide-react';
import { useTrades, useTradeStats } from '@/hooks/useTrades';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { EquityCurve } from '@/components/dashboard/EquityCurve';
import { TradeTable } from '@/components/trades/TradeTable';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  const { trades, isLoading, deleteTrade } = useTrades();
  const [excludeFOMO, setExcludeFOMO] = useState(false);
  const [excludeRuleBreak, setExcludeRuleBreak] = useState(false);

  const excludeEmotions = [
    ...(excludeFOMO ? ['FOMO'] : []),
    ...(excludeRuleBreak ? ['Rule Break'] : []),
  ];

  const stats = useTradeStats(trades, excludeEmotions);
  const fullStats = useTradeStats(trades);

  const recentTrades = trades.slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading trades...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your trading performance
          </p>
        </div>
      </motion.div>

      {/* Mistake Filter */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Filter className="w-4 h-4 text-primary" />
            Mistake Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Switch
              id="exclude-fomo"
              checked={excludeFOMO}
              onCheckedChange={setExcludeFOMO}
            />
            <Label htmlFor="exclude-fomo" className="text-sm cursor-pointer">
              Exclude FOMO trades
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="exclude-rulebreak"
              checked={excludeRuleBreak}
              onCheckedChange={setExcludeRuleBreak}
            />
            <Label htmlFor="exclude-rulebreak" className="text-sm cursor-pointer">
              Exclude Rule Breaks
            </Label>
          </div>
          {(excludeFOMO || excludeRuleBreak) && (
            <span className="text-xs text-muted-foreground">
              Showing what-if scenario without mistake trades
            </span>
          )}
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total P/L"
          value={`${stats.totalPnL >= 0 ? '+' : ''}$${stats.totalPnL.toLocaleString()}`}
          subtitle={`${stats.totalTrades} closed trades`}
          icon={<DollarSign className="w-5 h-5" />}
          trend={stats.totalPnL >= 0 ? 'profit' : 'loss'}
          delay={0}
        />
        <StatsCard
          title="Win Rate"
          value={`${stats.winRate}%`}
          subtitle={`${Math.round(stats.winRate * stats.totalTrades / 100)} wins`}
          icon={<Percent className="w-5 h-5" />}
          trend={stats.winRate >= 50 ? 'profit' : 'loss'}
          delay={0.1}
        />
        <StatsCard
          title="Profit Factor"
          value={stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)}
          subtitle="Gross profit / Gross loss"
          icon={<BarChart3 className="w-5 h-5" />}
          trend={stats.profitFactor >= 1.5 ? 'profit' : stats.profitFactor >= 1 ? 'neutral' : 'loss'}
          delay={0.2}
        />
        <StatsCard
          title="Expectancy"
          value={`$${stats.expectancy.toFixed(2)}`}
          subtitle="Expected value per trade"
          icon={<Target className="w-5 h-5" />}
          trend={stats.expectancy >= 0 ? 'profit' : 'loss'}
          delay={0.3}
        />
      </div>

      {/* Second Row Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Average Win"
          value={`+$${stats.avgWin.toFixed(2)}`}
          icon={<TrendingUp className="w-5 h-5" />}
          trend="profit"
          delay={0.4}
        />
        <StatsCard
          title="Average Loss"
          value={`-$${stats.avgLoss.toFixed(2)}`}
          icon={<TrendingDown className="w-5 h-5" />}
          trend="loss"
          delay={0.5}
        />
        <StatsCard
          title="Best Trade"
          value={`+$${stats.bestTrade.toFixed(2)}`}
          trend="profit"
          delay={0.6}
        />
        <StatsCard
          title="Worst Trade"
          value={`$${stats.worstTrade.toFixed(2)}`}
          trend="loss"
          delay={0.7}
        />
      </div>

      {/* Equity Curve */}
      <EquityCurve
        trades={excludeEmotions.length > 0
          ? trades.filter(t => !t.emotions.some(e => excludeEmotions.includes(e)))
          : trades
        }
        title={excludeEmotions.length > 0 ? 'Equity Curve (Filtered)' : 'Equity Curve'}
      />

      {/* Recent Trades */}
      <Card className="border-border/50 bg-card/80">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Recent Trades</CardTitle>
        </CardHeader>
        <CardContent>
          <TradeTable
            trades={recentTrades}
            onDelete={deleteTrade}
          />
        </CardContent>
      </Card>
    </div>
  );
}
