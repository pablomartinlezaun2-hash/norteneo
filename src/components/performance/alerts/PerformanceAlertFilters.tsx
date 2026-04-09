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
    <div className="flex gap-1.5 p-1 rounded-xl bg-muted/30 border border-border/20">
      {FILTERS.map((f) => {
        const isActive = value === f.key;
        const count = counts[f.key];
        return (
          <button
            key={f.key}
            onClick={() => onChange(f.key)}
            className={cn(
              'relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              isActive
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground/70'
            )}
          >
            {isActive && (
              <motion.div
                layoutId="alert-filter-bg"
                className="absolute inset-0 rounded-lg bg-secondary border border-border/30"
                transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
              />
            )}
            <span className="relative z-10">{f.label}</span>
            {count > 0 && (
              <span className={cn(
                'relative z-10 text-[10px] tabular-nums',
                isActive ? 'text-foreground/60' : 'text-muted-foreground/50'
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
