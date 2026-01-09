import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trade, calculatePnL } from '@/types/trade';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, subMonths, addMonths, isSameDay } from 'date-fns';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CalendarHeatmapProps {
  trades: Trade[];
}

interface DayData {
  date: Date;
  pnl: number;
  trades: number;
  wins: number;
  losses: number;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarHeatmap({ trades }: CalendarHeatmapProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { dailyData, maxPnL, minPnL, monthStats } = useMemo(() => {
    const closedTrades = trades.filter(t => t.status === 'closed' && t.exit_price !== null);
    
    // Group trades by day
    const dailyMap = new Map<string, DayData>();
    
    closedTrades.forEach(trade => {
      const exitDate = new Date(trade.exit_time!);
      const dateKey = format(exitDate, 'yyyy-MM-dd');
      const pnl = calculatePnL(
        trade.pair,
        trade.entry_price,
        trade.exit_price!,
        trade.lot_size,
        trade.direction,
        trade.commission
      );
      
      const existing = dailyMap.get(dateKey);
      if (existing) {
        existing.pnl += pnl;
        existing.trades += 1;
        if (pnl > 0) existing.wins += 1;
        else existing.losses += 1;
      } else {
        dailyMap.set(dateKey, {
          date: exitDate,
          pnl,
          trades: 1,
          wins: pnl > 0 ? 1 : 0,
          losses: pnl <= 0 ? 1 : 0,
        });
      }
    });

    // Calculate max/min for color scaling
    let max = 0;
    let min = 0;
    dailyMap.forEach(day => {
      if (day.pnl > max) max = day.pnl;
      if (day.pnl < min) min = day.pnl;
    });

    // Calculate month stats
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    let monthPnL = 0;
    let monthTrades = 0;
    let monthWins = 0;
    let tradingDays = 0;

    dailyMap.forEach((day, key) => {
      const dayDate = new Date(key);
      if (dayDate >= monthStart && dayDate <= monthEnd) {
        monthPnL += day.pnl;
        monthTrades += day.trades;
        monthWins += day.wins;
        tradingDays += 1;
      }
    });

    return { 
      dailyData: dailyMap, 
      maxPnL: max, 
      minPnL: min,
      monthStats: {
        pnl: Math.round(monthPnL * 100) / 100,
        trades: monthTrades,
        winRate: monthTrades > 0 ? Math.round((monthWins / monthTrades) * 100) : 0,
        tradingDays,
      }
    };
  }, [trades, currentMonth]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Add padding for days before the first of month
    const startPadding = getDay(monthStart);
    
    return { days, startPadding };
  }, [currentMonth]);

  const getColorIntensity = (pnl: number): string => {
    if (pnl === 0) return 'bg-muted/30';
    
    const maxAbs = Math.max(Math.abs(maxPnL), Math.abs(minPnL), 1);
    const intensity = Math.min(Math.abs(pnl) / maxAbs, 1);
    
    if (pnl > 0) {
      // Green shades for profit
      if (intensity > 0.75) return 'bg-emerald-500';
      if (intensity > 0.5) return 'bg-emerald-500/75';
      if (intensity > 0.25) return 'bg-emerald-500/50';
      return 'bg-emerald-500/30';
    } else {
      // Red shades for loss
      if (intensity > 0.75) return 'bg-red-500';
      if (intensity > 0.5) return 'bg-red-500/75';
      if (intensity > 0.25) return 'bg-red-500/50';
      return 'bg-red-500/30';
    }
  };

  const getDayData = (date: Date): DayData | undefined => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return dailyData.get(dateKey);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
    >
      <Card className="border-border/50 bg-card/80">
        <CardHeader className="pb-2 md:pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-base md:text-lg font-medium flex items-center gap-2">
              <CalendarDays className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              Daily P/L Heatmap
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[120px] text-center">
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Month Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
              <p className="text-xs text-muted-foreground mb-1">Month P/L</p>
              <p className={`text-lg font-mono font-semibold ${monthStats.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                {monthStats.pnl >= 0 ? '+' : ''}${monthStats.pnl}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
              <p className="text-xs text-muted-foreground mb-1">Trades</p>
              <p className="text-lg font-mono font-semibold">{monthStats.trades}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
              <p className="text-xs text-muted-foreground mb-1">Win Rate</p>
              <p className="text-lg font-mono font-semibold">{monthStats.winRate}%</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
              <p className="text-xs text-muted-foreground mb-1">Trading Days</p>
              <p className="text-lg font-mono font-semibold">{monthStats.tradingDays}</p>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="space-y-2">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1">
              {WEEKDAYS.map(day => (
                <div key={day} className="text-center text-xs text-muted-foreground py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <TooltipProvider delayDuration={100}>
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for padding */}
                {Array.from({ length: calendarDays.startPadding }).map((_, i) => (
                  <div key={`pad-${i}`} className="aspect-square" />
                ))}
                
                {/* Actual days */}
                {calendarDays.days.map(day => {
                  const dayData = getDayData(day);
                  const isToday = isSameDay(day, new Date());
                  
                  return (
                    <Tooltip key={day.toISOString()}>
                      <TooltipTrigger asChild>
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          className={`
                            aspect-square rounded-md flex items-center justify-center text-xs
                            cursor-pointer transition-colors relative
                            ${dayData ? getColorIntensity(dayData.pnl) : 'bg-muted/10'}
                            ${isToday ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''}
                          `}
                        >
                          <span className={`${dayData ? 'text-white font-medium drop-shadow-sm' : 'text-muted-foreground'}`}>
                            {format(day, 'd')}
                          </span>
                          {dayData && dayData.trades > 1 && (
                            <span className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-white/70" />
                          )}
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="p-3">
                        <div className="space-y-1">
                          <p className="font-medium">{format(day, 'EEEE, MMM d')}</p>
                          {dayData ? (
                            <>
                              <p className={`font-mono text-sm ${dayData.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                                {dayData.pnl >= 0 ? '+' : ''}${dayData.pnl.toFixed(2)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {dayData.trades} trade{dayData.trades !== 1 ? 's' : ''} • {dayData.wins}W / {dayData.losses}L
                              </p>
                            </>
                          ) : (
                            <p className="text-xs text-muted-foreground">No trades</p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </TooltipProvider>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-2 mt-6 text-xs text-muted-foreground">
            <span>Loss</span>
            <div className="flex gap-0.5">
              <div className="w-4 h-4 rounded bg-red-500" />
              <div className="w-4 h-4 rounded bg-red-500/75" />
              <div className="w-4 h-4 rounded bg-red-500/50" />
              <div className="w-4 h-4 rounded bg-red-500/30" />
              <div className="w-4 h-4 rounded bg-muted/30" />
              <div className="w-4 h-4 rounded bg-emerald-500/30" />
              <div className="w-4 h-4 rounded bg-emerald-500/50" />
              <div className="w-4 h-4 rounded bg-emerald-500/75" />
              <div className="w-4 h-4 rounded bg-emerald-500" />
            </div>
            <span>Profit</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
