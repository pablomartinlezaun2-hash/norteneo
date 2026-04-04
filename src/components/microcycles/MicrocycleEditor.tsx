import { useState, useCallback } from 'react';
import { MicrocycleExercise } from '@/hooks/useCustomMicrocycles';
import { Input } from '@/components/ui/input';
import { NumericInput } from '@/components/ui/numeric-input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, GripVertical, Trash2, Save, Loader2 } from 'lucide-react';
import { ExerciseSelectorModal } from './ExerciseSelectorModal';
import { motion, AnimatePresence } from 'framer-motion';

interface MicrocycleEditorProps {
  initialName?: string;
  initialExercises?: MicrocycleExercise[];
  onSave: (name: string, exercises: MicrocycleExercise[]) => Promise<boolean | string | null>;
  onCancel: () => void;
  isEditing?: boolean;
}

export const MicrocycleEditor = ({ initialName = '', initialExercises = [], onSave, onCancel, isEditing = false }: MicrocycleEditorProps) => {
  const [name, setName] = useState(initialName);
  const [exercises, setExercises] = useState<MicrocycleExercise[]>(initialExercises);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const handleAddExercises = useCallback((selected: { id: string; name: string; group: string; videoUrl: string | null; description: string | null }[]) => {
    setExercises(prev => [
      ...prev,
      ...selected.map((ex, i) => ({
        exerciseCatalogId: ex.id,
        name: ex.name,
        group: ex.group,
        videoUrl: ex.videoUrl,
        description: ex.description,
        sets: 3,
        repRangeMin: 8,
        repRangeMax: 12,
        orderIndex: prev.length + i,
      })),
    ]);
  }, []);

  const updateExercise = (index: number, field: 'sets' | 'repRangeMin' | 'repRangeMax', value: number) => {
    setExercises(prev => prev.map((ex, i) => i === index ? { ...ex, [field]: Math.max(1, value) } : ex));
  };

  const removeExercise = (index: number) => {
    setExercises(prev => prev.filter((_, i) => i !== index));
  };

  const moveExercise = (from: number, to: number) => {
    if (to < 0 || to >= exercises.length) return;
    setExercises(prev => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next.map((ex, i) => ({ ...ex, orderIndex: i }));
    });
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onSave(name.trim(), exercises);
    setSaving(false);
  };

  const excludeIds = exercises.map(ex => ex.exerciseCatalogId);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <ArrowLeft className="mr-1 h-4 w-4" />Volver
        </Button>
        <h2 className="text-lg font-bold text-foreground">{isEditing ? 'Editar microciclo' : 'Crear microciclo'}</h2>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">Nombre del microciclo</label>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Semana de fuerza A" />
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Ejercicios ({exercises.length})</h3>
        <Button size="sm" variant="outline" onClick={() => setSelectorOpen(true)}>
          <Plus className="mr-1 h-3.5 w-3.5" />Añadir
        </Button>
      </div>

      {exercises.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">Aún no hay ejercicios. Pulsa "Añadir" para seleccionar de la biblioteca.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {exercises.map((ex, index) => (
              <motion.div
                key={`${ex.exerciseCatalogId}-${index}`}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="rounded-xl border border-border bg-card p-3 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => moveExercise(index, index - 1)} disabled={index === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
                      <GripVertical className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">{ex.name}</p>
                    {ex.group && <Badge variant="outline" className="text-[10px] mt-0.5">{ex.group}</Badge>}
                  </div>
                  <button onClick={() => removeExercise(index)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground block mb-0.5">Series</label>
                    <NumericInput value={ex.sets} onCommit={v => updateExercise(index, 'sets', v)} />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground block mb-0.5">Reps mín</label>
                    <NumericInput value={ex.repRangeMin} onCommit={v => updateExercise(index, 'repRangeMin', v)} />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground block mb-0.5">Reps máx</label>
                    <NumericInput value={ex.repRangeMax} onCommit={v => updateExercise(index, 'repRangeMax', v)} />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button variant="outline" className="flex-1" onClick={onCancel}>Cancelar</Button>
        <Button className="flex-1" onClick={handleSave} disabled={!name.trim() || saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {isEditing ? 'Guardar cambios' : 'Crear microciclo'}
        </Button>
      </div>

      <ExerciseSelectorModal
        open={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        onSelect={handleAddExercises}
        excludeIds={excludeIds}
      />
    </div>
  );
};
