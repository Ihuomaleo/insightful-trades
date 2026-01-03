import { useState } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, MoreHorizontal, Trash2, Edit } from 'lucide-react';
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

interface TradeTableProps {
  trades: Trade[];
  onDelete: (id: string) => void;
  onEdit?: (trade: Trade) => void;
}

export function TradeTable({ trades, onDelete, onEdit }: TradeTableProps) {
  if (trades.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No trades logged yet. Click "New Trade" to add your first trade.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/50 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="w-[120px]">Pair</TableHead>
            <TableHead className="w-[80px]">Direction</TableHead>
            <TableHead className="text-right">Entry</TableHead>
            <TableHead className="text-right">Exit</TableHead>
            <TableHead className="text-right">Pips</TableHead>
            <TableHead className="text-right">R-Multiple</TableHead>
            <TableHead className="text-right">P/L</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[150px]">Date</TableHead>
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
                  className="border-b border-border/30 hover:bg-muted/20 transition-colors"
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
                    'text-right font-mono text-sm',
                    pips !== null && (pips > 0 ? 'text-profit' : 'text-loss')
                  )}>
                    {pips !== null ? (pips > 0 ? '+' : '') + pips.toFixed(1) : '—'}
                  </TableCell>
                  <TableCell className={cn(
                    'text-right font-mono text-sm',
                    rMultiple !== null && (rMultiple > 0 ? 'text-profit' : 'text-loss')
                  )}>
                    {rMultiple !== null ? (rMultiple > 0 ? '+' : '') + rMultiple.toFixed(2) + 'R' : '—'}
                  </TableCell>
                  <TableCell className={cn(
                    'text-right font-mono text-sm font-medium',
                    pnl !== null && (isProfit ? 'text-profit' : 'text-loss')
                  )}>
                    {pnl !== null ? (isProfit ? '+$' : '-$') + Math.abs(pnl).toFixed(2) : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={trade.status === 'open' ? 'outline' : 'secondary'} className="text-xs">
                      {trade.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(trade.entry_time), 'MMM dd, HH:mm')}
                  </TableCell>
                  <TableCell>
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
                        <DropdownMenuItem
                          onClick={() => onDelete(trade.id)}
                          className="text-loss focus:text-loss"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
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
  );
}
