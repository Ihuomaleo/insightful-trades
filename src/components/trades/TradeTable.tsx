import { useState } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, MoreHorizontal, Trash2, Edit, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CurrencyBadge } from './CurrencyBadge';
import { Trade, calculatePnL, calculatePips, calculateRMultiple } from '@/types/trade';
import { TradeDetailsModal } from './TradeDetailsModal';

interface TradeTableProps {
  trades: Trade[];
  onDelete?: (id: string) => void;
  onEdit?: (trade: Trade) => void;
  onAddFirst?: () => void; // Added for empty state CTA
}

export function TradeTable({ trades, onDelete, onEdit, onAddFirst }: TradeTableProps) {
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const handleTradeClick = (trade: Trade) => {
    setSelectedTrade(trade);
    setDetailsOpen(true);
  };

  // Action-oriented Empty State
  if (trades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed border-border/50 rounded-xl bg-card/30">
        <div className="p-4 bg-muted rounded-full mb-4">
          <PlusCircle className="w-10 h-10 text-muted-foreground opacity-50" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No trades logged yet</h3>
        <p className="text-muted-foreground max-w-xs mb-6">
          Start building your journal to see your performance analytics and equity curve.
        </p>
        <Button 
          variant="default" 
          onClick={onAddFirst}
          className="shadow-lg hover:shadow-primary/20 transition-all"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Log your first trade
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table View (Hidden on mobile) */}
      <div className="hidden md:block rounded-lg border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-[120px]">Pair</TableHead>
              <TableHead className="w-[80px]">Direction</TableHead>
              <TableHead className="text-right">Entry</TableHead>
              <TableHead className="text-right">Exit</TableHead>
              <TableHead className="text-right hidden lg:table-cell">Pips</TableHead>
              <TableHead className="text-right hidden lg:table-cell">R-Multiple</TableHead>
              <TableHead className="text-right">P/L</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[150px] hidden xl:table-cell">Date</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {trades.map((trade, index) => {
                const pnl = trade.exit_price
                  ? calculatePnL(trade.pair, trade.entry_price, trade.exit_price, trade.lot_size, trade.direction, trade.commission)
                  : null;
                const pips = trade.exit_price
                  ? calculatePips(trade.pair, trade.entry_price, trade.exit_price, trade.direction)
                  : null;
                const rMultiple = trade.exit_price
                  ? calculateRMultiple(trade.entry_price, trade.exit_price, trade.stop_loss, trade.direction)
                  : null;
                const isProfit = pnl !== null && pnl > 0;

                return (
                  <motion.tr
                    key={trade.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.02 }}
                    className="border-b border-border/30 hover:bg-muted/20 transition-colors cursor-pointer"
                    onClick={() => handleTradeClick(trade)}
                  >
                    <TableCell>
                      <CurrencyBadge pair={trade.pair} />
                    </TableCell>
                    <TableCell>
                      <div className={cn(
                        'flex items-center gap-1 text-xs font-medium',
                        trade.direction === 'long' ? 'text-profit' : 'text-loss'
                      )}>
                        {trade.direction === 'long' ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4" />
                        )}
                        {trade.direction.toUpperCase()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {trade.entry_price.toFixed(5)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {trade.exit_price?.toFixed(5) ?? '—'}
                    </TableCell>
                    <TableCell className={cn(
                      'text-right font-mono text-sm hidden lg:table-cell',
                      pips !== null && (pips > 0 ? 'text-profit' : 'text-loss')
                    )}>
                      {pips !== null ? (pips > 0 ? '+' : '') + pips.toFixed(1) : '—'}
                    </TableCell>
                    <TableCell className={cn(
                      'text-right font-mono text-sm hidden lg:table-cell',
                      rMultiple !== null && (rMultiple > 0 ? 'text-profit' : 'text-loss')
                    )}>
                      {rMultiple !== null ? (rMultiple > 0 ? '+' : '') + rMultiple.toFixed(2) + 'R' : '—'}
                    </TableCell>
                    <TableCell className={cn(
                      'text-right font-mono text-sm font-bold',
                      pnl !== null && (isProfit ? 'text-profit' : 'text-loss')
                    )}>
                      {pnl !== null ? (isProfit ? '+$' : '-$') + Math.abs(pnl).toFixed(2) : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={trade.status === 'open' ? 'outline' : 'secondary'} className="text-xs">
                        {trade.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden xl:table-cell">
                      {format(new Date(trade.entry_time), 'MMM dd, HH:mm')}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {onEdit && (
                            <DropdownMenuItem onClick={() => onEdit(trade)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {onDelete && (
                            <DropdownMenuItem
                              onClick={() => onDelete(trade.id)}
                              className="text-loss focus:text-loss"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>

      {/* Refined Mobile Card View (Hidden on desktop) */}
      <div className="md:hidden grid grid-cols-1 gap-3">
        <AnimatePresence>
          {trades.map((trade, index) => {
            const pnl = trade.exit_price
              ? calculatePnL(trade.pair, trade.entry_price, trade.exit_price, trade.lot_size, trade.direction, trade.commission)
              : null;
            const pips = trade.exit_price
              ? calculatePips(trade.pair, trade.entry_price, trade.exit_price, trade.direction)
              : null;
            const isProfit = pnl !== null && pnl > 0;

            return (
              <motion.div
                key={trade.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.02 }}
                className="p-4 rounded-xl border border-border/50 bg-card shadow-sm active:scale-[0.98] transition-all cursor-pointer"
                onClick={() => handleTradeClick(trade)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <CurrencyBadge pair={trade.pair} />
                    <Badge 
                      variant={trade.direction === 'long' ? 'default' : 'destructive'} 
                      className={cn(
                        "text-[10px] h-5 px-1.5",
                        trade.direction === 'long' ? 'bg-profit hover:bg-profit' : 'bg-loss hover:bg-loss'
                      )}
                    >
                      {trade.direction.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex flex-col items-end">
                    <p className={cn(
                      "font-mono font-bold text-lg leading-none",
                      pnl !== null && (isProfit ? "text-profit" : "text-loss")
                    )}>
                      {pnl !== null ? (isProfit ? '+$' : '-$') + Math.abs(pnl).toFixed(2) : '—'}
                    </p>
                    {pips !== null && (
                      <span className="text-[10px] text-muted-foreground mt-1">
                        {pips > 0 ? '+' : ''}{pips.toFixed(1)} pips
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 py-3 border-y border-border/30 text-sm">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Entry Price</span>
                    <span className="font-mono text-foreground font-medium">{trade.entry_price.toFixed(5)}</span>
                  </div>
                  <div className="flex flex-col gap-0.5 text-right">
                    <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Exit Price</span>
                    <span className="font-mono text-foreground font-medium">{trade.exit_price?.toFixed(5) ?? '—'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-muted-foreground italic">
                    {format(new Date(trade.entry_time), 'MMM dd, HH:mm')}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant={trade.status === 'open' ? 'outline' : 'secondary'} className="text-[10px] h-5">
                      {trade.status}
                    </Badge>
                    <div onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {onEdit && (
                            <DropdownMenuItem onClick={() => onEdit(trade)}>
                              <Edit className="w-4 h-4 mr-2" /> Edit
                            </DropdownMenuItem>
                          )}
                          {onDelete && (
                            <DropdownMenuItem
                              onClick={() => onDelete(trade.id)}
                              className="text-loss focus:text-loss"
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <TradeDetailsModal
        trade={selectedTrade}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </>
  );
}