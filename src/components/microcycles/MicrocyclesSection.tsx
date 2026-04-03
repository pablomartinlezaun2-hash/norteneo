import { useState } from 'react';
import { useCustomMicrocycles, MicrocycleExercise, CustomMicrocycle } from '@/hooks/useCustomMicrocycles';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, Loader2, Dumbbell, Calendar } from 'lucide-react';
import { MicrocycleEditor } from './MicrocycleEditor';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const premiumEase = [0.25, 0.46, 0.45, 0.94] as const;

export const MicrocyclesSection = () => {
  const { microcycles, loading, createMicrocycle, updateMicrocycle, deleteMicrocycle } = useCustomMicrocycles();
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [editingMicrocycle, setEditingMicrocycle] = useState<CustomMicrocycle | null>(null);

  const handleCreate = async (name: string, exercises: MicrocycleExercise[]) => {
    const result = await createMicrocycle(name, exercises);
    if (result) setView('list');
    return result;
  };

  const handleUpdate = async (name: string, exercises: MicrocycleExercise[]) => {
    if (!editingMicrocycle) return false;
    const result = await updateMicrocycle(editingMicrocycle.id, name, exercises);
    if (result) {
      setView('list');
      setEditingMicrocycle(null);
    }
    return result;
  };

  const handleEdit = (mc: CustomMicrocycle) => {
    setEditingMicrocycle(mc);
    setView('edit');
  };

  const handleDelete = async (id: string) => {
    await deleteMicrocycle(id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (view === 'create') {
    return (
      <MicrocycleEditor
        onSave={handleCreate}
        onCancel={() => setView('list')}
      />
    );
  }

  if (view === 'edit' && editingMicrocycle) {
    return (
      <MicrocycleEditor
        initialName={editingMicrocycle.name}
        initialExercises={editingMicrocycle.exercises}
        onSave={handleUpdate}
        onCancel={() => { setView('list'); setEditingMicrocycle(null); }}
        isEditing
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground">Microciclos</h3>
          <p className="text-xs text-muted-foreground">{microcycles.length} microciclo{microcycles.length !== 1 ? 's' : ''} creado{microcycles.length !== 1 ? 's' : ''}</p>
        </div>
        <Button size="sm" onClick={() => setView('create')}>
          <Plus className="mr-1 h-3.5 w-3.5" />Crear
        </Button>
      </div>

      {microcycles.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: premiumEase }}
          className="rounded-xl border border-dashed border-border p-8 text-center space-y-3"
        >
          <Dumbbell className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">Aún no has creado ningún microciclo.</p>
          <Button size="sm" variant="outline" onClick={() => setView('create')}>
            <Plus className="mr-1 h-3.5 w-3.5" />Crear primer microciclo
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {microcycles.map((mc, index) => (
              <motion.div
                key={mc.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25, ease: premiumEase, delay: index * 0.05 }}
                className="rounded-xl border border-border bg-card p-4 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-foreground truncate">{mc.name}</h4>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="secondary" className="text-[10px]">
                        <Dumbbell className="h-2.5 w-2.5 mr-1" />
                        {mc.exercises.length} ejercicio{mc.exercises.length !== 1 ? 's' : ''}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-2.5 w-2.5" />
                        {format(new Date(mc.updatedAt), 'dd MMM yyyy', { locale: es })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => handleEdit(mc)} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(mc.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {mc.exercises.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {mc.exercises.slice(0, 5).map((ex, i) => (
                      <Badge key={i} variant="outline" className="text-[10px]">{ex.name}</Badge>
                    ))}
                    {mc.exercises.length > 5 && (
                      <Badge variant="outline" className="text-[10px]">+{mc.exercises.length - 5} más</Badge>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
