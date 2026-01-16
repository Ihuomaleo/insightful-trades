import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface StatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: 'profit' | 'loss' | 'neutral';
  delay?: number;
}

export function StatsCard({ title, value, subtitle, icon, trend, delay = 0 }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
    >
      <Card className="border-border/50 bg-card/50 overflow-hidden group hover:border-primary/30 transition-colors">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {title}
              </p>
              <div className={cn(
                "text-xl sm:text-2xl font-bold font-mono tracking-tight", // Added font-mono for professional numerical alignment
                trend === 'profit' ? 'text-profit' : trend === 'loss' ? 'text-loss' : ''
              )}>
                {value}
              </div>
              {subtitle && (
                <p className="text-[10px] sm:text-xs text-muted-foreground italic">
                  {subtitle}
                </p>
              )}
            </div>
            {icon && (
              <div className={cn(
                "p-2 rounded-lg bg-muted/50 text-muted-foreground group-hover:text-primary transition-colors",
                trend === 'profit' && "group-hover:bg-profit/10 group-hover:text-profit",
                trend === 'loss' && "group-hover:bg-loss/10 group-hover:text-loss"
              )}>
                {icon}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}