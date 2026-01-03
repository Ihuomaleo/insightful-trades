import { cn } from '@/lib/utils';
import { getPairBaseCurrency } from '@/types/trade';

interface CurrencyBadgeProps {
  pair: string;
  className?: string;
}

const currencyColors: Record<string, string> = {
  USD: 'bg-badge-usd/20 text-badge-usd border-badge-usd/30',
  EUR: 'bg-badge-eur/20 text-badge-eur border-badge-eur/30',
  GBP: 'bg-badge-gbp/20 text-badge-gbp border-badge-gbp/30',
  JPY: 'bg-badge-jpy/20 text-badge-jpy border-badge-jpy/30',
  AUD: 'bg-badge-aud/20 text-badge-aud border-badge-aud/30',
  CAD: 'bg-badge-cad/20 text-badge-cad border-badge-cad/30',
  CHF: 'bg-badge-chf/20 text-badge-chf border-badge-chf/30',
  NZD: 'bg-badge-nzd/20 text-badge-nzd border-badge-nzd/30',
  XAU: 'bg-badge-chf/20 text-badge-chf border-badge-chf/30',
};

export function CurrencyBadge({ pair, className }: CurrencyBadgeProps) {
  const baseCurrency = getPairBaseCurrency(pair);
  const colorClass = currencyColors[baseCurrency] || 'bg-primary/20 text-primary border-primary/30';

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium border',
        colorClass,
        className
      )}
    >
      {pair}
    </span>
  );
}
