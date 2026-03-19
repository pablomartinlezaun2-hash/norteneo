import { useState, useMemo, useCallback } from 'react';
import { useExerciseCatalog, CatalogExercise } from '@/hooks/useExerciseCatalog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Dumbbell, ChevronRight, ArrowLeft, Play, Lightbulb, Zap, Loader2, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExerciseSVGAnimation } from './exercise-animations';
import { LazyVimeoEmbed, VimeoThumbnail } from './LazyVimeoEmbed';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

const DescripcionCollapsible = ({ description, tips, t }: { description: string | null; tips: string[] | null; t: (key: string) => string }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-3 transition-colors hover:bg-muted/50"
      >
        <h3 className="text-sm font-semibold text-foreground">Descripción</h3>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="overflow-hidden"
          >
            <div className="space-y-3 px-3 pb-3">
              {description && <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>}
              {tips && tips.length > 0 && (
                <div>
                  <h4 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <Lightbulb className="h-3.5 w-3.5 text-warning" />Tips
                  </h4>
                  <ul className="space-y-1">
                    {tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="mt-0.5 text-primary">•</span>
                        {tip}
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

export const ExerciseCatalog = () => {
  const { t } = useTranslation();
  const { muscleGroups, exercises, loading } = useExerciseCatalog();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<CatalogExercise | null>(null);

  const difficultyColors: Record<string, string> = {
    beginner: 'bg-success/20 text-success',
    intermediate: 'bg-warning/20 text-warning',
    advanced: 'bg-destructive/20 text-destructive',
  };

  const difficultyLabels: Record<string, string> = {
    beginner: t('catalog.beginner'),
    intermediate: t('catalog.intermediate'),
    advanced: t('catalog.advanced'),
  };

  const resistanceLabels: Record<string, string> = {
    ascending: t('catalog.ascending'),
    descending: t('catalog.descending'),
    'bell-shaped': t('catalog.bellShaped'),
    constant: t('catalog.constant'),
  };

  const categoryLabels: Record<string, string> = {
    upper: t('catalog.upperBody'),
    lower: t('catalog.lowerBody'),
    core: t('catalog.core'),
  };

  const PAGE_SIZE = 12;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredExercises = useMemo(() => {
    return exercises.filter((exercise) => {
      const matchesMuscle = !selectedMuscle || exercise.primary_muscle_id === selectedMuscle;
      if (!matchesMuscle) return false;
      if (!normalizedQuery) return true;

      return [exercise.name, exercise.description ?? '', exercise.primary_muscle?.name ?? '']
        .some((value) => value.toLowerCase().includes(normalizedQuery));
    });
  }, [exercises, normalizedQuery, selectedMuscle]);

  const visibleExercises = useMemo(() => filteredExercises.slice(0, visibleCount), [filteredExercises, visibleCount]);
  const hasMore = visibleCount < filteredExercises.length;

  const handleLoadMore = useCallback(() => setVisibleCount((prev) => prev + PAGE_SIZE), []);
  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
    setVisibleCount(PAGE_SIZE);
  }, []);
  const handleMuscleFilter = useCallback((value: string | null) => {
    setSelectedMuscle(value);
    setVisibleCount(PAGE_SIZE);
  }, []);

  const groupedMuscles = useMemo(() => muscleGroups.reduce((acc, muscle) => {
    if (!acc[muscle.category]) acc[muscle.category] = [];
    acc[muscle.category].push(muscle);
    return acc;
  }, {} as Record<string, typeof muscleGroups>), [muscleGroups]);

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (selectedExercise) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setSelectedExercise(null)}>
          <ArrowLeft className="mr-2 h-4 w-4" />{t('catalog.back')}
        </Button>
        <div className="gradient-card space-y-6 rounded-xl border border-border p-6">
          {selectedExercise.video_url ? (
            <LazyVimeoEmbed
              key={selectedExercise.id}
              videoUrl={selectedExercise.video_url}
              title={selectedExercise.name}
              className="shadow-sm"
            />
          ) : (
            <ExerciseSVGAnimation exerciseName={selectedExercise.name} className="w-full rounded-xl" />
          )}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">{selectedExercise.name}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {selectedExercise.primary_muscle && <Badge variant="outline">{selectedExercise.primary_muscle.name}</Badge>}
                {selectedExercise.difficulty && <Badge className={difficultyColors[selectedExercise.difficulty]}>{difficultyLabels[selectedExercise.difficulty]}</Badge>}
                {selectedExercise.is_compound && <Badge variant="secondary">{t('catalog.compound')}</Badge>}
              </div>
            </div>
          </div>
          {(selectedExercise.description || (selectedExercise.tips && selectedExercise.tips.length > 0)) && (
            <DescripcionCollapsible
              description={selectedExercise.description}
              tips={selectedExercise.tips}
              t={t}
            />
          )}
          {selectedExercise.execution && (
            <div>
              <h3 className="mb-2 flex items-center gap-2 font-semibold text-foreground">
                <Play className="h-4 w-4 text-primary" />
                {t('catalog.execution')}
              </h3>
              <p className="leading-relaxed text-muted-foreground">{selectedExercise.execution}</p>
            </div>
          )}
          {selectedExercise.resistance_profile && (
            <div>
              <h3 className="mb-2 flex items-center gap-2 font-semibold text-foreground">
                <Zap className="h-4 w-4 text-primary" />
                {t('catalog.resistanceProfile')}
              </h3>
              <Badge variant="outline" className="text-sm">{resistanceLabels[selectedExercise.resistance_profile] || selectedExercise.resistance_profile}</Badge>
            </div>
          )}
          {selectedExercise.variants && selectedExercise.variants.length > 0 && (
            <div>
              <h3 className="mb-2 font-semibold text-foreground">{t('catalog.variants')}</h3>
              <div className="flex flex-wrap gap-2">
                {selectedExercise.variants.map((variant, i) => <Badge key={i} variant="secondary">{variant}</Badge>)}
              </div>
            </div>
          )}
          {selectedExercise.equipment && selectedExercise.equipment.length > 0 && (
            <div>
              <h3 className="mb-2 font-semibold text-foreground">{t('catalog.equipment')}</h3>
              <div className="flex flex-wrap gap-2">
                {selectedExercise.equipment.map((equipment, i) => <Badge key={i} variant="outline" className="capitalize">{equipment}</Badge>)}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-6 flex items-center gap-3">
        <div className="gradient-primary rounded-xl p-2.5"><Dumbbell className="h-5 w-5 text-primary-foreground" /></div>
        <div>
          <h2 className="text-xl font-bold text-foreground">{t('catalog.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('catalog.available', { count: exercises.length })}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder={t('catalog.searchPlaceholder')} value={searchQuery} onChange={(e) => handleSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={selectedMuscle || 'all'} onValueChange={(value) => handleMuscleFilter(value === 'all' ? null : value)}>
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" /><SelectValue placeholder={t('catalog.muscle')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('catalog.all')}</SelectItem>
            {Object.entries(groupedMuscles).map(([category, muscles]) => (
              <div key={category}>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{categoryLabels[category] || category}</div>
                {muscles.map((muscle) => <SelectItem key={muscle.id} value={muscle.id}>{muscle.name}</SelectItem>)}
              </div>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedMuscle && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t('catalog.filteringBy')}</span>
          <Badge variant="secondary" className="gap-1">
            {muscleGroups.find((muscle) => muscle.id === selectedMuscle)?.name}
            <button onClick={() => handleMuscleFilter(null)}><X className="h-3 w-3" /></button>
          </Badge>
        </div>
      )}

      <div className="space-y-3">
        {filteredExercises.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">{t('catalog.noResults')}</div>
        ) : (
          <>
            {visibleExercises.map((exercise) => (
              <button
                key={exercise.id}
                onClick={() => setSelectedExercise(exercise)}
                className="w-full rounded-xl border border-border bg-card text-left transition-all duration-200 hover:border-primary/50"
              >
                <div className="flex items-center gap-3 p-3 sm:p-4">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg sm:h-20 sm:w-20">
                    {exercise.video_url ? (
                      <VimeoThumbnail
                        videoUrl={exercise.video_url}
                        alt={`Vista previa de ${exercise.name}`}
                        className="h-full w-full rounded-lg"
                      />
                    ) : (
                      <ExerciseSVGAnimation exerciseName={exercise.name} compact className="h-full w-full rounded-lg" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-foreground">{exercise.name}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {exercise.primary_muscle && <span className="text-xs text-muted-foreground">{exercise.primary_muscle.name}</span>}
                      {exercise.difficulty && <Badge className={cn('px-1.5 py-0 text-[10px]', difficultyColors[exercise.difficulty])}>{difficultyLabels[exercise.difficulty]}</Badge>}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                </div>
              </button>
            ))}
            {hasMore && (
              <Button variant="outline" className="w-full" onClick={handleLoadMore}>
                {t('catalog.loadMore', { defaultValue: 'Load more' })} ({filteredExercises.length - visibleCount} {t('catalog.remaining', { defaultValue: 'remaining' })})
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
