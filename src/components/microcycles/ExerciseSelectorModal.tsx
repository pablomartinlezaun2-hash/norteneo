import { useState, useMemo } from 'react';
import { useExerciseCatalog, CatalogExercise } from '@/hooks/useExerciseCatalog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Check, Loader2, ChevronDown, Lightbulb, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { extractVimeoId } from '@/components/LazyVimeoEmbed';
import { ExerciseSVGAnimation } from '@/components/exercise-animations';
import { motion, AnimatePresence } from 'framer-motion';

interface ExerciseSelectorModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (exercises: { id: string; name: string; group: string; videoUrl: string | null; description: string | null }[]) => void;
  excludeIds?: string[];
}

const difficultyColors: Record<string, string> = {
  beginner: 'bg-success/20 text-success',
  intermediate: 'bg-warning/20 text-warning',
  advanced: 'bg-destructive/20 text-destructive',
};

const difficultyLabels: Record<string, string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
};

const ExerciseDescription = ({ exercise }: { exercise: CatalogExercise }) => {
  const [open, setOpen] = useState(false);
  if (!exercise.description && (!exercise.tips || exercise.tips.length === 0)) return null;

  return (
    <div className="mt-1.5 overflow-hidden rounded-lg border border-border">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="flex w-full items-center justify-between px-2.5 py-1.5 transition-colors hover:bg-muted/50"
      >
        <span className="text-xs font-semibold text-foreground">Descripción</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 px-2.5 pb-2.5">
              {exercise.description && <p className="text-xs leading-relaxed text-muted-foreground">{exercise.description}</p>}
              {exercise.tips && exercise.tips.length > 0 && (
                <div>
                  <h4 className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-foreground">
                    <Lightbulb className="h-3 w-3 text-warning" />Tips
                  </h4>
                  <ul className="space-y-0.5">
                    {exercise.tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <span className="mt-0.5 text-primary">•</span>{tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const ExerciseSelectorModal = ({ open, onClose, onSelect, excludeIds = [] }: ExerciseSelectorModalProps) => {
  const { muscleGroups, exercises, loading } = useExerciseCatalog();
  const [search, setSearch] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    return exercises.filter(ex => {
      if (excludeIds.includes(ex.id)) return false;
      if (muscleFilter && ex.primary_muscle_id !== muscleFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return ex.name.toLowerCase().includes(q) || ex.primary_muscle?.name?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [exercises, search, muscleFilter, excludeIds]);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirm = () => {
    const selectedExercises = exercises
      .filter(ex => selected.has(ex.id))
      .map(ex => ({
        id: ex.id,
        name: ex.name,
        group: ex.primary_muscle?.name || '',
        videoUrl: ex.video_url,
        description: ex.description,
      }));
    onSelect(selectedExercises);
    setSelected(new Set());
    setSearch('');
    setMuscleFilter(null);
    onClose();
  };

  const groupedMuscles = useMemo(() => muscleGroups.reduce((acc, m) => {
    if (!acc[m.category]) acc[m.category] = [];
    acc[m.category].push(m);
    return acc;
  }, {} as Record<string, typeof muscleGroups>), [muscleGroups]);

  const categoryLabels: Record<string, string> = { upper: 'Tren superior', lower: 'Tren inferior', core: 'Core' };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle>Seleccionar ejercicios</DialogTitle>
        </DialogHeader>

        <div className="px-4 space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar ejercicio..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={muscleFilter || 'all'} onValueChange={v => setMuscleFilter(v === 'all' ? null : v)}>
              <SelectTrigger className="w-[140px]">
                <Filter className="mr-1 h-3.5 w-3.5" />
                <SelectValue placeholder="Músculo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(groupedMuscles).map(([cat, muscles]) => (
                  <div key={cat}>
                    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">{categoryLabels[cat] || cat}</div>
                    {muscles.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selected.size > 0 && (
            <div className="text-xs text-primary font-medium">{selected.size} seleccionado{selected.size > 1 ? 's' : ''}</div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">No se encontraron ejercicios</p>
          ) : (
            filtered.map(ex => {
              const isSelected = selected.has(ex.id);
              return (
                <div
                  key={ex.id}
                  className={cn(
                    "w-full rounded-xl border transition-all",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/30"
                  )}
                >
                  <button
                    onClick={() => toggleSelect(ex.id)}
                    className="w-full flex items-center gap-3 p-3 text-left"
                  >
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                      isSelected ? "border-primary bg-primary" : "border-muted-foreground/30"
                    )}>
                      {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted sm:h-16 sm:w-16">
                      {ex.video_url ? (() => {
                        const videoId = extractVimeoId(ex.video_url!);
                        return videoId ? (
                          <img
                            src={`https://vumbnail.com/${videoId}.jpg`}
                            alt={ex.name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Play className="h-5 w-5 text-muted-foreground" />
                          </div>
                        );
                      })() : (
                        <ExerciseSVGAnimation exerciseName={ex.name} compact className="h-full w-full rounded-lg" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-foreground truncate">{ex.name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        {ex.primary_muscle && (
                          <span className="text-xs text-muted-foreground">{ex.primary_muscle.name}</span>
                        )}
                        {ex.difficulty && (
                          <Badge className={cn('px-1.5 py-0 text-[10px]', difficultyColors[ex.difficulty])}>
                            {difficultyLabels[ex.difficulty] || ex.difficulty}
                          </Badge>
                        )}
                        {ex.is_compound && (
                          <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">Compuesto</Badge>
                        )}
                      </div>
                    </div>
                  </button>
                  <div className="px-3 pb-3">
                    <ExerciseDescription exercise={ex} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="px-4 pb-4 pt-2 border-t border-border flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button className="flex-1" onClick={handleConfirm} disabled={selected.size === 0}>
            Añadir ({selected.size})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
