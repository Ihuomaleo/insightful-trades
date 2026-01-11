import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trade, calculatePnL } from '@/types/trade';
import { Flame, TrendingUp, TrendingDown, Calendar, Trophy, Target } from 'lucide-react';
import { format, parseISO, startOfDay, isSameDay } from 'date-fns';

interface StreakTrackerProps {
  trades: Trade[];
}

interface DayResult {
  date: Date;
  pnl: number;
  trades: number;
}

export function StreakTracker({ trades }: StreakTrackerProps) {
  const streakData = useMemo(() => {
    const closedTrades = trades.filter(t => t.status === 'closed' && t.exit_price !== null);
    
    if (closedTrades.length === 0) {
      return {
        currentStreak: 0,
        currentStreakType: 'neutral' as const,
        longestWinStreak: 0,
        longestLossStreak: 0,
        dailyResults: [] as DayResult[],
        totalProfitableDays: 0,
        totalLosingDays: 0,
        currentStreakStart: null as Date | null,
      };
    }

    // Group trades by day
    const dayMap = new Map<string, DayResult>();
    
    closedTrades.forEach(trade => {
      const dayKey = format(parseISO(trade.entry_time), 'yyyy-MM-dd');
      const pnl = calculatePnL(trade.pair, trade.entry_price, trade.exit_price!, trade.lot_size, trade.direction, trade.commission);
      
      if (dayMap.has(dayKey)) {
        const existing = dayMap.get(dayKey)!;
        existing.pnl += pnl;
        existing.trades += 1;
      } else {
        dayMap.set(dayKey, {
          date: startOfDay(parseISO(trade.entry_time)),
          pnl,
          trades: 1,
        });
      }
    });

    // Sort by date
    const dailyResults = Array.from(dayMap.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // Calculate streaks
    let currentStreak = 0;
    let currentStreakType: 'profit' | 'loss' | 'neutral' = 'neutral';
    let currentStreakStart: Date | null = null;
    let longestWinStreak = 0;
    let longestLossStreak = 0;
    let tempWinStreak = 0;
    let tempLossStreak = 0;
    let totalProfitableDays = 0;
    let totalLosingDays = 0;

    dailyResults.forEach((day, index) => {
      if (day.pnl > 0) {
        totalProfitableDays++;
        tempWinStreak++;
        tempLossStreak = 0;
        longestWinStreak = Math.max(longestWinStreak, tempWinStreak);
      } else if (day.pnl < 0) {
        totalLosingDays++;
        tempLossStreak++;
        tempWinStreak = 0;
        longestLossStreak = Math.max(longestLossStreak, tempLossStreak);
      } else {
        // Break-even day breaks both streaks
        tempWinStreak = 0;
        tempLossStreak = 0;
      }
    });

    // Calculate current streak from the end
    if (dailyResults.length > 0) {
      const lastDay = dailyResults[dailyResults.length - 1];
      if (lastDay.pnl > 0) {
        currentStreakType = 'profit';
        currentStreak = 1;
        currentStreakStart = lastDay.date;
        
        for (let i = dailyResults.length - 2; i >= 0; i--) {
          if (dailyResults[i].pnl > 0) {
            currentStreak++;
            currentStreakStart = dailyResults[i].date;
          } else {
            break;
          }
        }
      } else if (lastDay.pnl < 0) {
        currentStreakType = 'loss';
        currentStreak = 1;
        currentStreakStart = lastDay.date;
        
        for (let i = dailyResults.length - 2; i >= 0; i--) {
          if (dailyResults[i].pnl < 0) {
            currentStreak++;
            currentStreakStart = dailyResults[i].date;
          } else {
            break;
          }
        }
      }
    }

    return {
      currentStreak,
      currentStreakType,
      longestWinStreak,
      longestLossStreak,
      dailyResults,
      totalProfitableDays,
      totalLosingDays,
      currentStreakStart,
    };
  }, [trades]);

  const recentDays = streakData.dailyResults.slice(-14);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
    >
      <Card className="border-border/50 bg-card/80">
        <CardHeader className="pb-2 md:pb-4">
          <CardTitle className="text-base md:text-lg font-medium flex items-center gap-2">
            <Flame className="w-4 h-4 md:w-5 md:h-5 text-amber-500" />
            Streak Tracker
          </CardTitle>
        </CardHeader>
        <CardContent>
          {streakData.dailyResults.length === 0 ? (
            <div className="h-[150px] flex items-center justify-center text-muted-foreground text-sm text-center px-4">
              No trading days recorded. Close some trades to see your streaks.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Current Streak Hero */}
              <div className={`p-4 md:p-6 rounded-xl border ${
                streakData.currentStreakType === 'profit' 
                  ? 'bg-gradient-to-br from-profit/10 to-emerald-500/5 border-profit/30' 
                  : streakData.currentStreakType === 'loss'
                  ? 'bg-gradient-to-br from-loss/10 to-red-500/5 border-loss/30'
                  : 'bg-muted/30 border-border/50'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground mb-1">Current Streak</p>
                    <div className="flex items-center gap-2">
                      {streakData.currentStreakType === 'profit' ? (
                        <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-profit" />
                      ) : streakData.currentStreakType === 'loss' ? (
                        <TrendingDown className="w-6 h-6 md:w-8 md:h-8 text-loss" />
                      ) : (
                        <Target className="w-6 h-6 md:w-8 md:h-8 text-muted-foreground" />
                      )}
                      <span className={`text-3xl md:text-4xl font-bold font-mono ${
                        streakData.currentStreakType === 'profit' 
                          ? 'text-profit' 
                          : streakData.currentStreakType === 'loss'
                          ? 'text-loss'
                          : 'text-muted-foreground'
                      }`}>
                        {streakData.currentStreak}
                      </span>
                      <span className="text-lg md:text-xl text-muted-foreground">
                        {streakData.currentStreak === 1 ? 'day' : 'days'}
                      </span>
                    </div>
                    {streakData.currentStreakStart && streakData.currentStreak > 0 && (
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Since {format(streakData.currentStreakStart, 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {streakData.currentStreakType === 'profit' 
                        ? '🔥 Keep it up!' 
                        : streakData.currentStreakType === 'loss'
                        ? '💪 Time to bounce back'
                        : 'Start a new streak!'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <div className="p-3 md:p-4 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <p className="text-xs text-muted-foreground">Best Win Streak</p>
                  </div>
                  <p className="text-xl md:text-2xl font-bold font-mono text-profit">
                    {streakData.longestWinStreak}
                  </p>
                </div>
                <div className="p-3 md:p-4 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingDown className="w-4 h-4 text-loss" />
                    <p className="text-xs text-muted-foreground">Worst Loss Streak</p>
                  </div>
                  <p className="text-xl md:text-2xl font-bold font-mono text-loss">
                    {streakData.longestLossStreak}
                  </p>
                </div>
                <div className="p-3 md:p-4 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-profit" />
                    <p className="text-xs text-muted-foreground">Profitable Days</p>
                  </div>
                  <p className="text-xl md:text-2xl font-bold font-mono">
                    {streakData.totalProfitableDays}
                  </p>
                </div>
                <div className="p-3 md:p-4 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingDown className="w-4 h-4 text-loss" />
                    <p className="text-xs text-muted-foreground">Losing Days</p>
                  </div>
                  <p className="text-xl md:text-2xl font-bold font-mono">
                    {streakData.totalLosingDays}
                  </p>
                </div>
              </div>

              {/* Recent Days Timeline */}
              <div>
                <p className="text-xs md:text-sm text-muted-foreground mb-3">Last 14 Trading Days</p>
                <div className="flex gap-1 md:gap-1.5 flex-wrap">
                  {recentDays.map((day, index) => (
                    <div
                      key={index}
                      className={`w-7 h-7 md:w-9 md:h-9 rounded-md flex items-center justify-center text-xs font-mono cursor-default transition-transform hover:scale-110 ${
                        day.pnl > 0 
                          ? 'bg-profit/20 text-profit border border-profit/30' 
                          : day.pnl < 0 
                          ? 'bg-loss/20 text-loss border border-loss/30'
                          : 'bg-muted/50 text-muted-foreground border border-border/50'
                      }`}
                      title={`${format(day.date, 'MMM d')}: $${day.pnl.toFixed(2)} (${day.trades} trade${day.trades !== 1 ? 's' : ''})`}
                    >
                      {day.pnl > 0 ? '+' : day.pnl < 0 ? '-' : '0'}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
