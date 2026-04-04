import { useState } from 'react';
import { usePlanningMesocycles, PlanningMesocycle, PlanningMicrocycle } from '@/hooks/usePlanningMesocycles';
import { useActivateMesocycle } from '@/hooks/useActivateMesocycle';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Loader2, Calendar, Layers, Target, Play, ChevronRight } from 'lucide-react';
import { MesocycleWizard } from './MesocycleWizard';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export const MesocycleList = () => {
  const { mesocycles, loading, deleteMesocycle } = usePlanningMesocycles();
  const { activateMicrocycle, activating } = useActivateMesocycle();
  const [view, setView] = useState<'list' | 'create'>('list');
  const [selectorMeso, setSelectorMeso] = useState<PlanningMesocycle | null>(null);

  const handleActivate = async (meso: PlanningMesocycle, micro: PlanningMicrocycle) => {
    const ok = await activateMicrocycle(meso, micro);
    if (ok) setSelectorMeso(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (view === 'create') {
    return <MesocycleWizard onComplete={() => setView('list')} onCancel={() => setView('list')} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground">Planificación</h3>
          <p className="text-xs text-muted-foreground">
            {mesocycles.length} mesociclo{mesocycles.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button size="sm" onClick={() => setView('create')}>
          <Plus className="mr-1 h-3.5 w-3.5" />Crear mesociclo
        </Button>
      </div>

      {mesocycles.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-dashed border-border p-8 text-center space-y-3"
        >
          <Target className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">Aún no has creado ningún mesociclo.</p>
          <Button size="sm" variant="outline" onClick={() => setView('create')}>
            <Plus className="mr-1 h-3.5 w-3.5" />Crear primer mesociclo
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {mesocycles.map((meso, index) => {
              const totalSessions = meso.microcycles.reduce((sum, mc) => sum + mc.sessions.length, 0);
              const totalExercises = meso.microcycles.reduce((sum, mc) =>
                sum + mc.sessions.reduce((s2, sess) => s2 + sess.exercises.length, 0), 0);

              return (
                <motion.div
                  key={meso.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25, delay: index * 0.05 }}
                  className="rounded-xl border border-border bg-card p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-foreground truncate">{meso.name}</h4>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="secondary" className="text-[10px]">
                          <Calendar className="h-2.5 w-2.5 mr-1" />
                          {meso.durationWeeks} semanas
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">
                          <Layers className="h-2.5 w-2.5 mr-1" />
                          {meso.microcycleCount} microciclos
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {totalSessions} sesiones · {totalExercises} ejercicios
                        </Badge>
                      </div>
                      {meso.goal && (
                        <p className="text-[10px] text-muted-foreground mt-1">{meso.goal}</p>
                      )}
                      <span className="text-[10px] text-muted-foreground mt-1 block">
                        Actualizado {format(new Date(meso.updatedAt), 'dd MMM yyyy', { locale: es })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setSelectorMeso(meso)}
                        className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                        title="Activar como entrenamiento"
                      >
                        <Play className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteMesocycle(meso.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Microcycle selector dialog */}
      <Dialog open={!!selectorMeso} onOpenChange={(open) => !open && setSelectorMeso(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Activar microciclo</DialogTitle>
            <DialogDescription>
              Selecciona qué microciclo de <span className="font-medium">{selectorMeso?.name}</span> quieres usar como entrenamiento activo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 mt-2">
            {selectorMeso?.microcycles.map((mc) => {
              const sessCount = mc.sessions.length;
              const exCount = mc.sessions.reduce((s, sess) => s + sess.exercises.length, 0);
              return (
                <button
                  key={mc.id || mc.orderIndex}
                  disabled={activating || sessCount === 0}
                  onClick={() => handleActivate(selectorMeso!, mc)}
                  className="w-full flex items-center justify-between rounded-lg border border-border bg-card p-3 hover:bg-accent/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">{mc.name || `Microciclo ${mc.orderIndex + 1}`}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {sessCount} sesiones · {exCount} ejercicios
                    </p>
                  </div>
                  {activating ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
