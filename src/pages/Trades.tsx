import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Filter } from 'lucide-react';
import { useTrades } from '@/hooks/useTrades';
import { TradeTable } from '@/components/trades/TradeTable';
import { TradeForm } from '@/components/trades/TradeForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CURRENCY_PAIRS, Trade } from '@/types/trade';

export default function TradesPage() {
  const { trades, isLoading, addTrade, updateTrade, deleteTrade, isAdding, isUpdating } = useTrades();
  const [formOpen, setFormOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPair, setFilterPair] = useState<string>('all');
  const [filterDirection, setFilterDirection] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredTrades = trades.filter(trade => {
    if (searchQuery && !trade.pair.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filterPair !== 'all' && trade.pair !== filterPair) {
      return false;
    }
    if (filterDirection !== 'all' && trade.direction !== filterDirection) {
      return false;
    }
    if (filterStatus !== 'all' && trade.status !== filterStatus) {
      return false;
    }
    return true;
  });

  const handleAddTrade = (data: any) => {
    addTrade({
      ...data,
      entry_time: data.entry_time.toISOString(),
      exit_time: data.exit_time?.toISOString() || null,
    });
    setFormOpen(false);
  };

  const handleEditTrade = (trade: Trade) => {
    setEditingTrade(trade);
  };

  const handleUpdateTrade = (data: any) => {
    if (!editingTrade) return;
    updateTrade({
      id: editingTrade.id,
      ...data,
      entry_time: data.entry_time.toISOString(),
      exit_time: data.exit_time?.toISOString() || null,
    });
    setEditingTrade(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading trades...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-semibold">Trade Log</h1>
          <p className="text-muted-foreground">
            {trades.length} total trades logged
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          New Trade
        </Button>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap items-center gap-4 p-4 rounded-lg bg-muted/30 border border-border/50"
      >
        <div className="flex items-center gap-2 text-muted-foreground">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filters</span>
        </div>

        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search pairs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={filterPair} onValueChange={setFilterPair}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Pairs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Pairs</SelectItem>
            {CURRENCY_PAIRS.map(pair => (
              <SelectItem key={pair} value={pair}>{pair}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterDirection} onValueChange={setFilterDirection}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Direction" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="long">Long</SelectItem>
            <SelectItem value="short">Short</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>

        {(searchQuery || filterPair !== 'all' || filterDirection !== 'all' || filterStatus !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setFilterPair('all');
              setFilterDirection('all');
              setFilterStatus('all');
            }}
          >
            Clear filters
          </Button>
        )}
      </motion.div>

      {/* Trade Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <TradeTable
          trades={filteredTrades}
          onDelete={deleteTrade}
          onEdit={handleEditTrade}
        />
      </motion.div>

      {/* Add Trade Form */}
      <TradeForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleAddTrade}
        isSubmitting={isAdding}
        mode="create"
      />

      {/* Edit Trade Form */}
      <TradeForm
        open={!!editingTrade}
        onOpenChange={(open) => !open && setEditingTrade(null)}
        onSubmit={handleUpdateTrade}
        isSubmitting={isUpdating}
        mode="edit"
        defaultValues={editingTrade ? {
          pair: editingTrade.pair,
          direction: editingTrade.direction as 'long' | 'short',
          entry_price: editingTrade.entry_price,
          exit_price: editingTrade.exit_price,
          stop_loss: editingTrade.stop_loss,
          take_profit: editingTrade.take_profit,
          lot_size: editingTrade.lot_size,
          commission: editingTrade.commission || 0,
          entry_time: new Date(editingTrade.entry_time),
          exit_time: editingTrade.exit_time ? new Date(editingTrade.exit_time) : null,
          status: editingTrade.status as 'open' | 'closed',
          setups: editingTrade.setups || [],
          emotions: editingTrade.emotions || [],
          notes: editingTrade.notes,
          before_screenshot: editingTrade.before_screenshot,
          after_screenshot: editingTrade.after_screenshot,
        } : undefined}
      />
    </div>
  );
}
