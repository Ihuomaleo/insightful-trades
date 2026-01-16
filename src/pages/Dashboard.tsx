import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Percent,
  DollarSign,
  BarChart3,
  Filter,
  Info,
} from 'lucide-react';
import { useTrades, useTradeStats } from '@/hooks/useTrades';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { EquityCurve } from '@/components/dashboard/EquityCurve';
import { TradeTable } from '@/components/trades/TradeTable';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton'; // Professional skeleton state
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { DEMO_TRADES } from '@/data/demoTrades';
import { TradeForm } from '@/components/trades/TradeForm'; // To support the empty state CTA

export default function DashboardPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isDemo = location.search.includes('demo=true');
  
  // Performance optimization: Fetch only recent 5 for table, but all for analysis
  const { trades: userTrades, isLoading, deleteTrade, addTrade, isAdding } = useTrades(isDemo ? undefined : 5);
  const { trades: allUserTrades } = useTrades();

  const [excludeFOMO, setExcludeFOMO] = useState(false);
  const [excludeRuleBreak, setExcludeRuleBreak] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const displayTrades = isDemo ? DEMO_TRADES.slice(0, 5) : userTrades;
  const analysisTrades = isDemo ? DEMO_TRADES : allUserTrades;

  const excludeEmotions = [
    ...(excludeFOMO ? ['FOMO'] : []),
    ...(excludeRuleBreak ? ['Rule Break'] : []),
  ];

  const stats = useTradeStats(analysisTrades, excludeEmotions);

  // Professional loading experience
  if (isLoading && !isDemo) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Demo Banner */}
      {isDemo && (
        <Alert className="border-primary/50 bg-primary/10">
          <Info className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>You're viewing demo data. Sign up to start tracking your own trades!</span>
            <Button size="sm" onClick={() => navigate('/auth')}>
              Get Started
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-semibold">
            {isDemo ? 'Dashboard' : `Welcome back${user?.user_metadata?.display_name ? `, ${user.user_metadata.display_name}` : user?.email ? `, ${user.email.split('@')[0]}` : ''}`}
          </h1>
          <p className="text-muted-foreground">
            {isDemo ? 'Demo trading performance data' : 'Overview of your trading performance'}
          </p>
        </div>
        {!isDemo && (
          <Button onClick={() => setIsFormOpen(true)} className="hidden sm:flex">
            New Trade
          </Button>
        )}
      </motion.div>

      {/* Mistake Filter */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Filter className="w-4 h-4 text-primary" />
            Mistake Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
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
            <span className="text-xs text-muted-foreground italic">
              Showing potential "what-if" impact
            </span>
          )}
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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

      {/* Equity Curve Analysis */}
      <EquityCurve
        trades={analysisTrades}
        excludeEmotions={excludeEmotions}
        title={excludeEmotions.length > 0 ? "Performance Analysis: Reality vs. Potential" : "Equity Curve"}
      />

      {/* Recent Trades with Empty State CTA */}
      <Card className="border-border/50 bg-card/80">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Recent Trades</CardTitle>
        </CardHeader>
        <CardContent>
          <TradeTable
            trades={displayTrades}
            onDelete={isDemo ? undefined : deleteTrade}
            onAddFirst={() => setIsFormOpen(true)} // Connected to the empty state CTA
          />
        </CardContent>
      </Card>

      {!isDemo && (
        <TradeForm 
          open={isFormOpen} 
          onOpenChange={setIsFormOpen} 
          onSubmit={(data) => {
            addTrade(data);
            setIsFormOpen(false);
          }}
          isSubmitting={isAdding}
        />
      )}
    </div>
  );
}