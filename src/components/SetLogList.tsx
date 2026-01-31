import { useState } from 'react';
import { SetLog } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react';
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
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Historial ({logs.length} registros)
        </span>
        {logs.length > 3 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-primary flex items-center gap-1 hover:underline"
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

      <div className="space-y-1.5">
        {displayLogs.map((log) => (
          <div
            key={log.id}
            className={cn(
              "flex items-center justify-between p-2 rounded-lg border border-border bg-card",
              log.is_warmup && "bg-muted/50 border-dashed"
            )}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {log.is_warmup && (
                  <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-medium uppercase">
                    Warmup
                  </span>
                )}
                <span className="text-sm font-medium text-foreground">
                  {log.weight} kg × {log.reps}
                  {log.partial_reps > 0 && (
                    <span className="text-muted-foreground"> +{log.partial_reps}p</span>
                  )}
                </span>
                {log.rir !== null && (
                  <span className="text-xs text-muted-foreground">
                    RIR {log.rir}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {format(new Date(log.logged_at), "dd MMM yyyy · HH:mm", { locale: es })}
              </p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => handleDelete(log.id)}
              disabled={deletingId === log.id}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
