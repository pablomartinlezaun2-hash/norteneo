import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { SessionPlan } from '@/lib/autoregulation/sessionPlanManager';

interface ActivePlanViewProps {
  basePlan: SessionPlan;
  activePlan: SessionPlan;
  showDiff?: boolean;
}

export function ActivePlanView({ basePlan, activePlan, showDiff = true }: ActivePlanViewProps) {
  const baseMap = new Map(basePlan.exercises.map(e => [e.exercise_id, e]));

  return (
    <div className="space-y-2">
      {activePlan.exercises.map((ex) => {
        const baseEx = baseMap.get(ex.exercise_id);
        const setsChanged = showDiff && baseEx && baseEx.sets !== ex.sets;
        const rirChanged = showDiff && baseEx && baseEx.rir !== ex.rir;

        return (
          <Card key={ex.exercise_id} className={cn(
            'border bg-card',
            ex.is_modified && 'border-[hsl(35,92%,50%)]/30'
          )}>
            <CardContent className="p-3 flex items-center justify-between">
              <div className="space-y-0.5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground truncate">
                    {ex.exercise_name}
                  </p>
                  {ex.is_modified && (
                    <Badge variant="outline" className="text-[10px] bg-[hsl(35,92%,50%)]/15 text-[hsl(35,92%,50%)] border-[hsl(35,92%,50%)]/30 shrink-0">
                      {ex.modification_type === 'substituted' ? 'Sustituido' :
                       ex.modification_type === 'added_set' ? '+Serie' :
                       ex.modification_type === 'removed_set' ? '-Serie' :
                       ex.modification_type === 'increased_rir' ? 'RIR↑' : 'Mod'}
                    </Badge>
                  )}
                </div>
                {ex.is_modified && ex.original_exercise_name && (
                  <p className="text-xs text-muted-foreground line-through">{ex.original_exercise_name}</p>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs tabular-nums shrink-0 ml-3">
                <div className="text-center">
                  <p className="text-muted-foreground">Series</p>
                  <p className={cn('font-semibold', setsChanged ? 'text-[hsl(35,92%,50%)]' : 'text-foreground')}>
                    {ex.sets}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground">Reps</p>
                  <p className="font-semibold text-foreground">{ex.rep_range}</p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground">RIR</p>
                  <p className={cn('font-semibold', rirChanged ? 'text-[hsl(35,92%,50%)]' : 'text-foreground')}>
                    {ex.rir}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
