import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: 'profit' | 'loss' | 'neutral';
  delay?: number;
}

export function StatsCard({ title, value, subtitle, icon, trend = 'neutral', delay = 0 }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <Card className={cn(
        'p-5 border-border/50 bg-card/80 backdrop-blur-sm',
        'hover:shadow-elevated transition-shadow duration-300',
        trend === 'profit' && 'hover:shadow-profit-glow',
        trend === 'loss' && 'hover:shadow-loss-glow'
      )}>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className={cn(
              'text-2xl font-semibold font-mono tracking-tight',
              trend === 'profit' && 'text-profit',
              trend === 'loss' && 'text-loss'
            )}>
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {icon && (
            <div className={cn(
              'p-2 rounded-lg',
              trend === 'profit' && 'bg-profit/10 text-profit',
              trend === 'loss' && 'bg-loss/10 text-loss',
              trend === 'neutral' && 'bg-primary/10 text-primary'
            )}>
              {icon}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
