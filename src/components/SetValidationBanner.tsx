/**
 * SetValidationBanner — Premium persistent banner for real-time set validation.
 * Renders one alert with severity-driven styling. User must accept manually.
 */
import { motion } from 'framer-motion';
import { AlertTriangle, AlertOctagon, Info, Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type {
  SetValidationAlert,
  ValidationSeverity,
} from '@/lib/setValidationEngine';

interface SetValidationBannerProps {
  alert: SetValidationAlert;
  onAccept: (id: string) => void;
  /** Optional secondary action label, e.g. "Volver al ejercicio" */
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

const SEVERITY_STYLES: Record<
  ValidationSeverity,
  {
    icon: typeof Info;
    iconClass: string;
    border: string;
    bg: string;
    accent: string;
    label: string;
  }
> = {
  mild: {
    icon: Info,
    iconClass: 'text-amber-500',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/5',
    accent: 'text-amber-600 dark:text-amber-400',
    label: 'Aviso leve',
  },
  moderate: {
    icon: AlertTriangle,
    iconClass: 'text-orange-500',
    border: 'border-orange-500/40',
    bg: 'bg-orange-500/8',
    accent: 'text-orange-600 dark:text-orange-400',
    label: 'Aviso moderado',
  },
  strong: {
    icon: AlertOctagon,
    iconClass: 'text-destructive',
    border: 'border-destructive/50',
    bg: 'bg-destructive/8',
    accent: 'text-destructive',
    label: 'Aviso fuerte',
  },
};

export const SetValidationBanner = ({
  alert,
  onAccept,
  secondaryActionLabel,
  onSecondaryAction,
}: SetValidationBannerProps) => {
  const style = SEVERITY_STYLES[alert.severity];
  const Icon = style.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        'rounded-xl border-l-4 border p-3.5 shadow-sm',
        style.border,
        style.bg,
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className={cn('shrink-0 mt-0.5', style.iconClass)}>
          <Icon className="w-5 h-5" strokeWidth={2} />
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          {/* Header row */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'text-[10px] font-bold uppercase tracking-wider',
                  style.accent,
                )}
              >
                {style.label}
              </span>
              <span className="text-[10px] text-muted-foreground">·</span>
              <span className="text-[10px] font-mono text-muted-foreground">
                Serie {alert.setNumber}
              </span>
            </div>
            <div
              className={cn(
                'text-[10px] font-bold tabular-nums px-2 py-0.5 rounded-full bg-background/70',
                style.accent,
              )}
            >
              {alert.precision}% precisión
            </div>
          </div>

          {/* Title */}
          <h4 className="text-sm font-semibold text-foreground leading-tight">
            {alert.title}
          </h4>

          {/* Description */}
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            {alert.description}
          </p>

          {/* Action hint */}
          <div className="flex items-start gap-1.5 pt-1">
            <ArrowRight
              className={cn('w-3.5 h-3.5 mt-0.5 shrink-0', style.iconClass)}
              strokeWidth={2.5}
            />
            <p className="text-[12px] font-medium text-foreground leading-relaxed">
              {alert.actionHint}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <Button
              size="sm"
              variant="default"
              onClick={() => onAccept(alert.id)}
              className="h-8 text-[11px] font-semibold gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              Entendido
            </Button>
            {secondaryActionLabel && onSecondaryAction && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onSecondaryAction}
                className="h-8 text-[11px] font-medium text-muted-foreground hover:text-foreground"
              >
                {secondaryActionLabel}
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * Stack of banners for an exercise. Renders in a column with smooth reorder.
 */
export const SetValidationBannerStack = ({
  alerts,
  onAccept,
}: {
  alerts: SetValidationAlert[];
  onAccept: (id: string) => void;
}) => {
  if (alerts.length === 0) return null;
  return (
    <div className="space-y-2">
      {alerts.map(a => (
        <SetValidationBanner key={a.id} alert={a} onAccept={onAccept} />
      ))}
    </div>
  );
};
