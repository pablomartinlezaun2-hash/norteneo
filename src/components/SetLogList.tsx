import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SetLog } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Trash2, ChevronDown, ChevronUp, History } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface SetLogListProps {
  logs: SetLog[];
  onDelete: (id: string) => Promise<{ error: string | null }>;
}

export const SetLogList = ({ logs, onDelete }: SetLogListProps) => {
  const [expanded, setExpanded] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (logs.length === 0) return null;

  const displayLogs = expanded ? logs : logs.slice(0, 3);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await onDelete(id);
    setDeletingId(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">
            Historial
          </span>
          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
            {logs.length}
          </span>
        </div>
        {logs.length > 3 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-primary flex items-center gap-1 hover:underline font-medium"
          >
            {expanded ? (
              <>
                Ver menos <ChevronUp className="w-3 h-3" />
              </>
            ) : (
              <>
                Ver todos <ChevronDown className="w-3 h-3" />
              </>
            )}
          </button>
        )}
      </div>

      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {displayLogs.map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "flex items-center justify-between p-3 rounded-xl border transition-all duration-200",
                log.is_warmup 
                  ? "bg-amber-500/5 border-amber-500/20" 
                  : "bg-card border-border hover:border-primary/30"
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {log.is_warmup && (
                    <span className="text-[10px] bg-amber-500/20 text-amber-600 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide">
                      Warmup
                    </span>
                  )}
                  <span className="text-sm font-bold text-foreground">
                    {log.weight} kg
                  </span>
                  <span className="text-muted-foreground">×</span>
                  <span className="text-sm font-semibold text-foreground">
                    {log.reps}
                  </span>
                  {log.partial_reps > 0 && (
                    <span className="text-xs text-muted-foreground">
                      +{log.partial_reps}p
                    </span>
                  )}
                  {log.rir !== null && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                      RIR {log.rir}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5 font-medium">
                  {format(new Date(log.logged_at), "EEEE, dd MMM · HH:mm", { locale: es })}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                onClick={() => handleDelete(log.id)}
                disabled={deletingId === log.id}
              >
                <Trash2 className={cn(
                  "w-4 h-4 transition-transform",
                  deletingId === log.id && "animate-spin"
                )} />
              </Button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
