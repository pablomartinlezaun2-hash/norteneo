import { useState } from 'react';
import { usePlanningMesocycles, PlanningMicrocycle, PlanningSession, PlanningExercise } from '@/hooks/usePlanningMesocycles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NumericInput } from '@/components/ui/numeric-input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, Check, Loader2, Plus, Trash2, GripVertical } from 'lucide-react';
import { ExerciseSelectorModal } from '@/components/microcycles/ExerciseSelectorModal';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MesocycleWizardProps {
  onComplete: () => void;
  onCancel: () => void;
}

const STEPS = ['Datos básicos', 'Estructura', 'Ejercicios', 'Revisar'];

export const MesocycleWizard = ({ onComplete, onCancel }: MesocycleWizardProps) => {
  const { saveMesocycle } = usePlanningMesocycles();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1 state
  const [name, setName] = useState('');
  const [durationWeeks, setDurationWeeks] = useState(4);
  const [microcycleCount, setMicrocycleCount] = useState(4);
  const [goal, setGoal] = useState('');

  // Step 2+ state
  const [microcycles, setMicrocycles] = useState<PlanningMicrocycle[]>([]);

  // Step 3 state
  const [activeMicro, setActiveMicro] = useState(0);
  const [activeSession, setActiveSession] = useState(0);
  const [selectorOpen, setSelectorOpen] = useState(false);

  const initMicrocycles = () => {
    if (microcycles.length === microcycleCount) return;
    const newMicros: PlanningMicrocycle[] = Array.from({ length: microcycleCount }, (_, i) => {
      const existing = microcycles[i];
      return existing || {
        name: `Microciclo ${i + 1}`,
        orderIndex: i,
        sessions: [
          { name: 'Día 1', orderIndex: 0, exercises: [] },
          { name: 'Día 2', orderIndex: 1, exercises: [] },
          { name: 'Día 3', orderIndex: 2, exercises: [] },
        ],
      };
    });
    setMicrocycles(newMicros);
  };

  const updateSessionCount = (microIdx: number, count: number) => {
    setMicrocycles(prev => prev.map((mc, i) => {
      if (i !== microIdx) return mc;
      const currentSessions = mc.sessions;
      if (count > currentSessions.length) {
        const newSessions = [...currentSessions];
        for (let j = currentSessions.length; j < count; j++) {
          newSessions.push({ name: `Día ${j + 1}`, orderIndex: j, exercises: [] });
        }
        return { ...mc, sessions: newSessions };
      }
      return { ...mc, sessions: currentSessions.slice(0, count) };
    }));
  };

  const updateSessionName = (microIdx: number, sessIdx: number, newName: string) => {
    setMicrocycles(prev => prev.map((mc, i) => {
      if (i !== microIdx) return mc;
      return {
        ...mc,
        sessions: mc.sessions.map((s, j) => j === sessIdx ? { ...s, name: newName } : s),
      };
    }));
  };

  const updateMicroName = (microIdx: number, newName: string) => {
    setMicrocycles(prev => prev.map((mc, i) =>
      i === microIdx ? { ...mc, name: newName } : mc
    ));
  };

  const addExercisesToSession = (selected: { id: string; name: string; group: string; videoUrl: string | null; description: string | null }[]) => {
    setMicrocycles(prev => prev.map((mc, mi) => {
      if (mi !== activeMicro) return mc;
      return {
        ...mc,
        sessions: mc.sessions.map((s, si) => {
          if (si !== activeSession) return s;
          const newExercises: PlanningExercise[] = selected.map((ex, idx) => ({
            exerciseCatalogId: ex.id,
            name: ex.name,
            group: ex.group,
            videoUrl: ex.videoUrl,
            description: ex.description,
            sets: 3,
            repRangeMin: 8,
            repRangeMax: 12,
            orderIndex: s.exercises.length + idx,
          }));
          return { ...s, exercises: [...s.exercises, ...newExercises] };
        }),
      };
    }));
  };

  const updateExercise = (microIdx: number, sessIdx: number, exIdx: number, field: 'sets' | 'repRangeMin' | 'repRangeMax', value: number) => {
    setMicrocycles(prev => prev.map((mc, mi) => {
      if (mi !== microIdx) return mc;
      return {
        ...mc,
        sessions: mc.sessions.map((s, si) => {
          if (si !== sessIdx) return s;
          return {
            ...s,
            exercises: s.exercises.map((ex, ei) =>
              ei === exIdx ? { ...ex, [field]: Math.max(1, value) } : ex
            ),
          };
        }),
      };
    }));
  };

  const removeExercise = (microIdx: number, sessIdx: number, exIdx: number) => {
    setMicrocycles(prev => prev.map((mc, mi) => {
      if (mi !== microIdx) return mc;
      return {
        ...mc,
        sessions: mc.sessions.map((s, si) => {
          if (si !== sessIdx) return s;
          return { ...s, exercises: s.exercises.filter((_, ei) => ei !== exIdx) };
        }),
      };
    }));
  };

  const canAdvance = () => {
    if (step === 0) return name.trim().length > 0 && durationWeeks >= 1 && microcycleCount >= 1;
    if (step === 1) return microcycles.length > 0 && microcycles.every(mc => mc.sessions.length > 0);
    return true;
  };

  const handleNext = () => {
    if (step === 0) {
      initMicrocycles();
    }
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const handleSave = async () => {
    setSaving(true);
    const result = await saveMesocycle({
      name: name.trim(),
      durationWeeks,
      microcycleCount,
      goal: goal.trim() || undefined,
      microcycles,
    });
    setSaving(false);
    if (result) onComplete();
  };

  const currentMicro = microcycles[activeMicro];
  const currentSession = currentMicro?.sessions?.[activeSession];
  const excludeIds = currentSession?.exercises.map(e => e.exerciseCatalogId) || [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={step === 0 ? onCancel : () => setStep(s => s - 1)}>
          <ArrowLeft className="mr-1 h-4 w-4" />{step === 0 ? 'Cancelar' : 'Atrás'}
        </Button>
        <h2 className="text-lg font-bold text-foreground flex-1">Crear mesociclo</h2>
      </div>

      {/* Step indicators */}
      <div className="flex gap-1">
        {STEPS.map((label, i) => (
          <div key={i} className="flex-1 space-y-1">
            <div className={cn(
              "h-1 rounded-full transition-colors",
              i <= step ? "bg-primary" : "bg-muted"
            )} />
            <p className={cn(
              "text-[10px] text-center transition-colors",
              i <= step ? "text-primary font-medium" : "text-muted-foreground"
            )}>{label}</p>
          </div>
        ))}
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Nombre del mesociclo</label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Fuerza máxima Q1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">Duración (semanas)</label>
                  <NumericInput
                    value={durationWeeks}
                    onCommit={v => setDurationWeeks(Math.min(52, v))}
                    min={1}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">Nº de microciclos</label>
                  <NumericInput
                    value={microcycleCount}
                    onCommit={v => setMicrocycleCount(Math.min(20, v))}
                    min={1}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Objetivo (opcional)</label>
                <Input value={goal} onChange={e => setGoal(e.target.value)} placeholder="Ej: Hipertrofia, fuerza, definición..." />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Define la estructura de cada microciclo: nombre y número de sesiones.</p>
              {microcycles.map((mc, mi) => (
                <div key={mi} className="rounded-xl border border-border bg-card p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px] shrink-0">{mi + 1}</Badge>
                    <Input
                      value={mc.name}
                      onChange={e => updateMicroName(mi, e.target.value)}
                      className="h-8 text-sm font-medium"
                      placeholder={`Microciclo ${mi + 1}`}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground whitespace-nowrap">Sesiones:</label>
                    <NumericInput
                      value={mc.sessions.length}
                      onCommit={v => updateSessionCount(mi, Math.min(7, v))}
                      min={1}
                    />
                    <div className="flex flex-wrap gap-1 flex-1">
                      {mc.sessions.map((s, si) => (
                        <Badge key={si} variant="outline" className="text-[10px]">{s.name}</Badge>
                      ))}
                    </div>
                  </div>
                  {/* Rename sessions inline */}
                  <div className="grid grid-cols-2 gap-1">
                    {mc.sessions.map((s, si) => (
                      <Input
                        key={si}
                        value={s.name}
                        onChange={e => updateSessionName(mi, si, e.target.value)}
                        className="h-7 text-[11px]"
                        placeholder={`Día ${si + 1}`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Añade ejercicios a cada sesión de cada microciclo.</p>

              {/* Micro tabs */}
              <div className="flex gap-1 overflow-x-auto pb-1">
                {microcycles.map((mc, mi) => (
                  <button
                    key={mi}
                    onClick={() => { setActiveMicro(mi); setActiveSession(0); }}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors",
                      mi === activeMicro ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {mc.name}
                  </button>
                ))}
              </div>

              {/* Session tabs */}
              {currentMicro && (
                <div className="flex gap-1 overflow-x-auto pb-1">
                  {currentMicro.sessions.map((s, si) => (
                    <button
                      key={si}
                      onClick={() => setActiveSession(si)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors",
                        si === activeSession ? "bg-primary/20 text-primary border border-primary/30" : "bg-card border border-border text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {s.name}
                      {s.exercises.length > 0 && (
                        <span className="ml-1 text-[10px]">({s.exercises.length})</span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Exercise list for current session */}
              {currentSession && (
                <div className="space-y-2">
                  {currentSession.exercises.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border p-6 text-center">
                      <p className="text-sm text-muted-foreground mb-2">Sin ejercicios en {currentSession.name}</p>
                    </div>
                  ) : (
                    currentSession.exercises.map((ex, ei) => (
                      <div key={ei} className="rounded-xl border border-border bg-card p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-foreground truncate">{ex.name}</p>
                            {ex.group && <span className="text-[10px] text-muted-foreground">{ex.group}</span>}
                          </div>
                          <button
                            onClick={() => removeExercise(activeMicro, activeSession, ei)}
                            className="text-muted-foreground hover:text-destructive transition-colors p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-[10px] font-medium text-muted-foreground block mb-0.5">Series</label>
                            <NumericInput
                              value={ex.sets}
                              onCommit={v => updateExercise(activeMicro, activeSession, ei, 'sets', v)}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-medium text-muted-foreground block mb-0.5">Reps mín</label>
                            <NumericInput
                              value={ex.repRangeMin}
                              onCommit={v => updateExercise(activeMicro, activeSession, ei, 'repRangeMin', v)}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-medium text-muted-foreground block mb-0.5">Reps máx</label>
                            <NumericInput
                              value={ex.repRangeMax}
                              onCommit={v => updateExercise(activeMicro, activeSession, ei, 'repRangeMax', v)}
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <Button size="sm" variant="outline" className="w-full" onClick={() => setSelectorOpen(true)}>
                    <Plus className="mr-1 h-3.5 w-3.5" />Añadir ejercicios
                  </Button>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Revisa tu mesociclo antes de guardar.</p>
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Nombre</p>
                  <p className="font-semibold text-foreground">{name}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Duración</p>
                    <p className="text-sm font-medium text-foreground">{durationWeeks} semanas</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Microciclos</p>
                    <p className="text-sm font-medium text-foreground">{microcycleCount}</p>
                  </div>
                </div>
                {goal && (
                  <div>
                    <p className="text-xs text-muted-foreground">Objetivo</p>
                    <p className="text-sm text-foreground">{goal}</p>
                  </div>
                )}
              </div>

              {microcycles.map((mc, mi) => (
                <div key={mi} className="rounded-xl border border-border bg-card p-3 space-y-2">
                  <p className="font-semibold text-sm text-foreground">{mc.name}</p>
                  {mc.sessions.map((s, si) => (
                    <div key={si} className="ml-3 border-l-2 border-primary/20 pl-3">
                      <p className="text-xs font-medium text-foreground">{s.name}</p>
                      {s.exercises.length === 0 ? (
                        <p className="text-[10px] text-muted-foreground italic">Sin ejercicios</p>
                      ) : (
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {s.exercises.map((ex, ei) => (
                            <Badge key={ei} variant="outline" className="text-[10px]">
                              {ex.name} {ex.sets}×{ex.repRangeMin}-{ex.repRangeMax}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex gap-2 pt-2">
        {step < STEPS.length - 1 ? (
          <Button className="flex-1" onClick={handleNext} disabled={!canAdvance()}>
            Siguiente <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button className="flex-1" onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
            Guardar mesociclo
          </Button>
        )}
      </div>

      <ExerciseSelectorModal
        open={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        onSelect={addExercisesToSession}
        excludeIds={excludeIds}
      />
    </div>
  );
};
