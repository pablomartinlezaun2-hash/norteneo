import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export type AlertFilter = 'all' | 'positive' | 'negative';

interface PerformanceAlertFiltersProps {
  value: AlertFilter;
  onChange: (filter: AlertFilter) => void;
  counts: { all: number; positive: number; negative: number };
}

const FILTERS: { key: AlertFilter; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'positive', label: 'Mejoras' },
  { key: 'negative', label: 'Caídas' },
];

export const PerformanceAlertFilters = ({ value, onChange, counts }: PerformanceAlertFiltersProps) => {
  return (
    <div className="flex gap-1 p-0.5 rounded-lg bg-muted/10 border border-border/8">
      {FILTERS.map((f) => {
        const isActive = value === f.key;
        const count = counts[f.key];
        return (
          <button
            key={f.key}
            onClick={() => onChange(f.key)}
            className={cn(
              'relative flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors flex-1 justify-center',
              isActive
                ? 'text-foreground'
                : 'text-muted-foreground/50 hover:text-muted-foreground/70'
            )}
          >
            {isActive && (
              <motion.div
                layoutId="alert-filter-bg"
                className="absolute inset-0 rounded-md bg-secondary/60 border border-border/15"
                transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
              />
            )}
            <span className="relative z-10">{f.label}</span>
            {count > 0 && (
              <span className={cn(
                'relative z-10 text-[9px] tabular-nums font-mono',
                isActive ? 'text-foreground/50' : 'text-muted-foreground/30'
              )}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
