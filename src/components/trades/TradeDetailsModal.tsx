import { format } from 'date-fns';
import { ArrowUpRight, ArrowDownRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CurrencyBadge } from './CurrencyBadge';
import { Trade, calculatePnL, calculatePips, calculateRMultiple, getTradingSession } from '@/types/trade';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TradeDetailsModalProps {
  trade: Trade | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TradeDetailsModal({ trade, open, onOpenChange }: TradeDetailsModalProps) {
  if (!trade) return null;

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
  const session = getTradingSession(trade.entry_time);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-3">
            <CurrencyBadge pair={trade.pair} />
            <div className={cn(
              'flex items-center gap-1 text-sm font-medium',
              trade.direction === 'long' ? 'text-profit' : 'text-loss'
            )}>
              {trade.direction === 'long' ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4" />
              )}
              {trade.direction.toUpperCase()}
            </div>
            <Badge variant={trade.status === 'open' ? 'outline' : 'secondary'}>
              {trade.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-80px)]">
          <div className="p-6 pt-4 space-y-6">
            {/* P/L Summary */}
            {pnl !== null && (
              <div className={cn(
                'rounded-lg p-4 text-center',
                isProfit ? 'bg-profit/10' : 'bg-loss/10'
              )}>
                <p className="text-sm text-muted-foreground mb-1">Profit / Loss</p>
                <p className={cn(
                  'text-3xl font-bold font-mono',
                  isProfit ? 'text-profit' : 'text-loss'
                )}>
                  {isProfit ? '+$' : '-$'}{Math.abs(pnl).toFixed(2)}
                </p>
                <div className="flex items-center justify-center gap-4 mt-2 text-sm">
                  {pips !== null && (
                    <span className={cn(isProfit ? 'text-profit' : 'text-loss')}>
                      {pips > 0 ? '+' : ''}{pips.toFixed(1)} pips
                    </span>
                  )}
                  {rMultiple !== null && (
                    <span className={cn(isProfit ? 'text-profit' : 'text-loss')}>
                      {rMultiple > 0 ? '+' : ''}{rMultiple.toFixed(2)}R
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Trade Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <DetailItem label="Entry Price" value={trade.entry_price.toFixed(5)} mono />
              <DetailItem label="Exit Price" value={trade.exit_price?.toFixed(5) ?? '—'} mono />
              <DetailItem label="Lot Size" value={trade.lot_size.toString()} mono />
              <DetailItem label="Stop Loss" value={trade.stop_loss.toFixed(5)} mono />
              <DetailItem label="Take Profit" value={trade.take_profit?.toFixed(5) ?? '—'} mono />
              <DetailItem label="Commission" value={trade.commission ? `$${trade.commission}` : '—'} mono />
              <DetailItem label="Entry Time" value={format(new Date(trade.entry_time), 'MMM dd, yyyy HH:mm')} />
              <DetailItem label="Exit Time" value={trade.exit_time ? format(new Date(trade.exit_time), 'MMM dd, yyyy HH:mm') : '—'} />
              <DetailItem label="Session" value={session} />
            </div>

            {/* Setups */}
            {trade.setups.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Setups</p>
                <div className="flex flex-wrap gap-2">
                  {trade.setups.map((setup) => (
                    <Badge key={setup} variant="outline">
                      {setup}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Emotions */}
            {trade.emotions.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Emotions</p>
                <div className="flex flex-wrap gap-2">
                  {trade.emotions.map((emotion) => (
                    <Badge 
                      key={emotion} 
                      variant="outline"
                      className={cn(
                        emotion === 'FOMO' && 'border-yellow-500/50 text-yellow-500',
                        emotion === 'Rule Break' && 'border-loss/50 text-loss'
                      )}
                    >
                      {emotion}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {trade.notes && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Notes</p>
                <p className="text-sm bg-muted/30 rounded-lg p-3">{trade.notes}</p>
              </div>
            )}

            {/* Screenshots */}
            {(trade.before_screenshot || trade.after_screenshot) && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Screenshots</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {trade.before_screenshot && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Before</p>
                      <a 
                        href={trade.before_screenshot} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <img
                          src={trade.before_screenshot}
                          alt="Before trade"
                          className="rounded-lg border border-border/50 w-full object-cover hover:opacity-80 transition-opacity cursor-pointer"
                        />
                      </a>
                    </div>
                  )}
                  {trade.after_screenshot && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">After</p>
                      <a 
                        href={trade.after_screenshot} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <img
                          src={trade.after_screenshot}
                          alt="After trade"
                          className="rounded-lg border border-border/50 w-full object-cover hover:opacity-80 transition-opacity cursor-pointer"
                        />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function DetailItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn('text-sm', mono && 'font-mono')}>{value}</p>
    </div>
  );
}
