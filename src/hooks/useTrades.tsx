import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Trade, TradeStats, calculatePnL, calculateRMultiple } from '@/types/trade';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export function useTrades(limit?: number) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const tradesQuery = useQuery({
    queryKey: ['trades', user?.id, limit],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .order('entry_time', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Trade[];
    },
    enabled: !!user,
  });

  const addTradeMutation = useMutation({
    mutationFn: async (trade: Omit<Trade, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('trades')
        .insert([{ ...trade, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      toast({
        title: 'Trade Added',
        description: 'Your trade has been logged successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateTradeMutation = useMutation({
    mutationFn: async ({ id, ...trade }: Partial<Trade> & { id: string }) => {
      const { data, error } = await supabase
        .from('trades')
        .update(trade)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      toast({
        title: 'Trade Updated',
        description: 'Your trade has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteTradeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('trades')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      toast({
        title: 'Trade Deleted',
        description: 'Your trade has been removed.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    trades: tradesQuery.data ?? [],
    isLoading: tradesQuery.isLoading,
    error: tradesQuery.error,
    addTrade: addTradeMutation.mutate,
    updateTrade: updateTradeMutation.mutate,
    deleteTrade: deleteTradeMutation.mutate,
    isAdding: addTradeMutation.isPending,
    isUpdating: updateTradeMutation.isPending,
    isDeleting: deleteTradeMutation.isPending,
  };
}

export function useTradeStats(trades: Trade[], excludeEmotions: string[] = []): TradeStats {
  const closedTrades = trades.filter(t => t.status === 'closed' && t.exit_price !== null);
  
  const filteredTrades = excludeEmotions.length > 0
    ? closedTrades.filter(t => !t.emotions.some(e => excludeEmotions.includes(e)))
    : closedTrades;

  if (filteredTrades.length === 0) {
    return {
      totalTrades: 0,
      winRate: 0,
      profitFactor: 0,
      avgWin: 0,
      avgLoss: 0,
      totalPnL: 0,
      expectancy: 0,
      bestTrade: 0,
      worstTrade: 0,
    };
  }

  const tradeResults = filteredTrades.map(t => ({
    pnl: calculatePnL(t.pair, t.entry_price, t.exit_price!, t.lot_size, t.direction, t.commission),
    rMultiple: calculateRMultiple(t.entry_price, t.exit_price!, t.stop_loss, t.direction),
  }));

  const wins = tradeResults.filter(t => t.pnl > 0);
  const losses = tradeResults.filter(t => t.pnl < 0);

  const totalWins = wins.reduce((sum, t) => sum + t.pnl, 0);
  const totalLosses = Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0));
  const totalPnL = tradeResults.reduce((sum, t) => sum + t.pnl, 0);

  const winRate = (wins.length / filteredTrades.length) * 100;
  const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0;
  const avgWin = wins.length > 0 ? totalWins / wins.length : 0;
  const avgLoss = losses.length > 0 ? totalLosses / losses.length : 0;

  const lossRate = (100 - winRate) / 100;
  const expectancy = (winRate / 100 * avgWin) - (lossRate * avgLoss);

  const allPnL = tradeResults.map(t => t.pnl);
  const bestTrade = allPnL.length > 0 ? Math.max(...allPnL) : 0;
  const worstTrade = allPnL.length > 0 ? Math.min(...allPnL) : 0;

  return {
    totalTrades: filteredTrades.length,
    winRate: Math.round(winRate * 10) / 10,
    profitFactor: Math.round(profitFactor * 100) / 100,
    avgWin: Math.round(avgWin * 100) / 100,
    avgLoss: Math.round(avgLoss * 100) / 100,
    totalPnL: Math.round(totalPnL * 100) / 100,
    expectancy: Math.round(expectancy * 100) / 100,
    bestTrade: Math.round(bestTrade * 100) / 100,
    worstTrade: Math.round(worstTrade * 100) / 100,
  };
}

/**
 * New hook to calculate statistics per setup/strategy
 */
export function useStrategyStats(trades: Trade[]) {
  return useMemo(() => {
    const strategyMap: Record<string, { name: string; pnl: number; wins: number; total: number }> = {};

    trades.filter(t => t.status === 'closed' && t.exit_price !== null).forEach(trade => {
      trade.setups.forEach(setup => {
        if (!strategyMap[setup]) {
          strategyMap[setup] = { name: setup, pnl: 0, wins: 0, total: 0 };
        }
        
        const pnl = calculatePnL(trade.pair, trade.entry_price, trade.exit_price!, trade.lot_size, trade.direction, trade.commission);
        strategyMap[setup].pnl += pnl;
        strategyMap[setup].total += 1;
        if (pnl > 0) strategyMap[setup].wins += 1;
      });
    });

    return Object.values(strategyMap).map(s => ({
      ...s,
      winRate: s.total > 0 ? Math.round((s.wins / s.total) * 100) : 0,
      pnl: Math.round(s.pnl * 100) / 100
    })).sort((a, b) => b.pnl - a.pnl);
  }, [trades]);
}