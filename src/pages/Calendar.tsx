import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useTrades } from '@/hooks/useTrades';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trade, calculatePnL } from '@/types/trade';

export default function CalendarPage() {
  const { trades, isLoading } = useTrades();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Calculate daily P/L
  const dailyPnL = useMemo(() => {
    const closedTrades = trades.filter(t => t.status === 'closed' && t.exit_price !== null);
    const pnlByDay: Record<string, { pnl: number; trades: number }> = {};

    closedTrades.forEach(trade => {
      const exitDate = trade.exit_time ? format(new Date(trade.exit_time), 'yyyy-MM-dd') : null;
      if (!exitDate) return;

      const pnl = calculatePnL(
        trade.pair,
        trade.entry_price,
        trade.exit_price!,
        trade.lot_size,
        trade.direction,
        trade.commission
      );

      if (!pnlByDay[exitDate]) {
        pnlByDay[exitDate] = { pnl: 0, trades: 0 };
      }
      pnlByDay[exitDate].pnl += pnl;
      pnlByDay[exitDate].trades += 1;
    });

    return pnlByDay;
  }, [trades]);

  const prevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Get the starting day offset (0 = Sunday)
  const startDayOffset = monthStart.getDay();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading calendar...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-semibold">Trading Calendar</h1>
        <p className="text-muted-foreground">
          Visual overview of your daily trading performance
        </p>
      </motion.div>

      {/* Calendar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-border/50 bg-card/80">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-medium">
              {format(currentMonth, 'MMMM yyyy')}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={prevMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={nextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for offset */}
              {Array.from({ length: startDayOffset }).map((_, index) => (
                <div key={`empty-${index}`} className="aspect-square" />
              ))}

              {/* Days */}
              {daysInMonth.map((day, index) => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const dayData = dailyPnL[dateKey];
                const hasProfit = dayData && dayData.pnl > 0;
                const hasLoss = dayData && dayData.pnl < 0;
                const hasBreakeven = dayData && dayData.pnl === 0;

                return (
                  <motion.div
                    key={dateKey}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.01 }}
                    className={cn(
                      'aspect-square p-2 rounded-lg border transition-all duration-200',
                      'hover:border-primary/50 cursor-pointer',
                      isToday(day) && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
                      hasProfit && 'border-profit/30 bg-profit/5',
                      hasLoss && 'border-loss/30 bg-loss/5',
                      hasBreakeven && 'border-muted-foreground/30',
                      !dayData && 'border-border/30'
                    )}
                  >
                    <div className="flex flex-col h-full">
                      <span className={cn(
                        'text-sm font-medium',
                        isToday(day) && 'text-primary'
                      )}>
                        {format(day, 'd')}
                      </span>

                      {dayData && (
                        <div className="mt-auto">
                          {/* P/L Indicator Dot */}
                          <div className="flex items-center gap-1 mb-1">
                            <div className={cn(
                              'w-2 h-2 rounded-full',
                              hasProfit && 'bg-profit',
                              hasLoss && 'bg-loss',
                              hasBreakeven && 'bg-muted-foreground'
                            )} />
                            <span className="text-[10px] text-muted-foreground">
                              {dayData.trades}
                            </span>
                          </div>

                          {/* P/L Amount */}
                          <span className={cn(
                            'text-xs font-mono font-medium',
                            hasProfit && 'text-profit',
                            hasLoss && 'text-loss'
                          )}>
                            {hasProfit ? '+' : ''}${Math.abs(dayData.pnl).toFixed(0)}
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 mt-6 pt-4 border-t border-border/50">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-profit" />
                <span className="text-sm text-muted-foreground">Profitable Day</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-loss" />
                <span className="text-sm text-muted-foreground">Losing Day</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-muted-foreground" />
                <span className="text-sm text-muted-foreground">Break-Even</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Monthly Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-border/50 bg-card/80">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Monthly Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const monthTrades = Object.entries(dailyPnL)
                .filter(([date]) => {
                  const d = new Date(date);
                  return d >= monthStart && d <= monthEnd;
                });

              if (monthTrades.length === 0) {
                return (
                  <p className="text-muted-foreground">
                    No trades closed in {format(currentMonth, 'MMMM yyyy')}
                  </p>
                );
              }

              const totalPnL = monthTrades.reduce((sum, [_, data]) => sum + data.pnl, 0);
              const tradingDays = monthTrades.length;
              const profitableDays = monthTrades.filter(([_, data]) => data.pnl > 0).length;
              const totalTrades = monthTrades.reduce((sum, [_, data]) => sum + data.trades, 0);

              return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Monthly P/L</p>
                    <p className={cn(
                      'text-2xl font-mono font-semibold',
                      totalPnL >= 0 ? 'text-profit' : 'text-loss'
                    )}>
                      {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Trading Days</p>
                    <p className="text-2xl font-semibold">{tradingDays}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Profitable Days</p>
                    <p className="text-2xl font-semibold">
                      {profitableDays} <span className="text-sm text-muted-foreground font-normal">
                        ({Math.round((profitableDays / tradingDays) * 100)}%)
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Trades</p>
                    <p className="text-2xl font-semibold">{totalTrades}</p>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
