import { useState } from 'react';
import { useExerciseCatalog, CatalogExercise } from '@/hooks/useExerciseCatalog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, Filter, Dumbbell, ChevronRight, ArrowLeft,
  Play, Lightbulb, Zap, Loader2, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExerciseGifPreview } from './ExerciseGifPreview';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const resistanceLabels: Record<string, string> = {
  ascending: 'Ascendente',
  descending: 'Descendente',
  'bell-shaped': 'Campana',
  constant: 'Constante',
};

export const ExerciseCatalog = () => {
  const { muscleGroups, exercises, loading, searchExercises, filterByMuscle } = useExerciseCatalog();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<CatalogExercise | null>(null);

  const filteredExercises = selectedMuscle 
    ? filterByMuscle(selectedMuscle).filter(ex => 
        ex.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : searchExercises(searchQuery);

  const groupedMuscles = muscleGroups.reduce((acc, muscle) => {
    if (!acc[muscle.category]) {
      acc[muscle.category] = [];
    }
    acc[muscle.category].push(muscle);
    return acc;
  }, {} as Record<string, typeof muscleGroups>);

  const categoryLabels: Record<string, string> = {
    upper: 'Tren Superior',
    lower: 'Tren Inferior',
    core: 'Core',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Exercise detail view
  if (selectedExercise) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setSelectedExercise(null)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>

        <div className="gradient-card rounded-xl p-6 border border-border space-y-6">
          {/* GIF Preview */}
          <ExerciseGifPreview exerciseName={selectedExercise.name} className="w-full rounded-xl" />

          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">{selectedExercise.name}</h2>
              <div className="flex items-center gap-2 mt-2">
                {selectedExercise.primary_muscle && (
                  <Badge variant="outline">{selectedExercise.primary_muscle.name}</Badge>
                )}
                {selectedExercise.difficulty && (
                  <Badge className={difficultyColors[selectedExercise.difficulty]}>
                    {difficultyLabels[selectedExercise.difficulty]}
                  </Badge>
                )}
                {selectedExercise.is_compound && (
                  <Badge variant="secondary">Compuesto</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {selectedExercise.description && (
            <div>
              <h3 className="font-semibold text-foreground mb-2">Descripción</h3>
              <p className="text-muted-foreground leading-relaxed">{selectedExercise.description}</p>
            </div>
          )}

          {/* Execution */}
          {selectedExercise.execution && (
            <div>
              <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <Play className="w-4 h-4 text-primary" />
                Ejecución
              </h3>
              <p className="text-muted-foreground leading-relaxed">{selectedExercise.execution}</p>
            </div>
          )}

          {/* Resistance Profile */}
          {selectedExercise.resistance_profile && (
            <div>
              <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                Perfil de Resistencia
              </h3>
              <Badge variant="outline" className="text-sm">
                {resistanceLabels[selectedExercise.resistance_profile] || selectedExercise.resistance_profile}
              </Badge>
            </div>
          )}

          {/* Tips */}
          {selectedExercise.tips && selectedExercise.tips.length > 0 && (
            <div>
              <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-warning" />
                Consejos Clave
              </h3>
              <ul className="space-y-2">
                {selectedExercise.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-muted-foreground">
                    <span className="text-primary mt-1">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Variants */}
          {selectedExercise.variants && selectedExercise.variants.length > 0 && (
            <div>
              <h3 className="font-semibold text-foreground mb-2">Variantes</h3>
              <div className="flex flex-wrap gap-2">
                {selectedExercise.variants.map((variant, i) => (
                  <Badge key={i} variant="secondary">{variant}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Equipment */}
          {selectedExercise.equipment && selectedExercise.equipment.length > 0 && (
            <div>
              <h3 className="font-semibold text-foreground mb-2">Equipamiento</h3>
              <div className="flex flex-wrap gap-2">
                {selectedExercise.equipment.map((eq, i) => (
                  <Badge key={i} variant="outline" className="capitalize">{eq}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="gradient-primary rounded-xl p-2.5">
          <Dumbbell className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Batería de Ejercicios</h2>
          <p className="text-sm text-muted-foreground">{exercises.length} ejercicios disponibles</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar ejercicio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedMuscle || 'all'} onValueChange={(v) => setSelectedMuscle(v === 'all' ? null : v)}>
          <SelectTrigger className="w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Músculo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(groupedMuscles).map(([category, muscles]) => (
              <div key={category}>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  {categoryLabels[category] || category}
                </div>
                {muscles.map((muscle) => (
                  <SelectItem key={muscle.id} value={muscle.id}>
                    {muscle.name}
                  </SelectItem>
                ))}
              </div>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Active filter */}
      {selectedMuscle && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtrando por:</span>
          <Badge variant="secondary" className="gap-1">
            {muscleGroups.find(m => m.id === selectedMuscle)?.name}
            <button onClick={() => setSelectedMuscle(null)}>
              <X className="w-3 h-3" />
            </button>
          </Badge>
        </div>
      )}

      {/* Exercise List */}
      <div className="space-y-3">
        {filteredExercises.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No se encontraron ejercicios
          </div>
        ) : (
          filteredExercises.map((exercise) => (
            <button
              key={exercise.id}
              onClick={() => setSelectedExercise(exercise)}
              className="w-full gradient-card rounded-xl p-4 border border-border text-left hover:border-primary/50 transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <ExerciseGifPreview exerciseName={exercise.name} compact className="flex-shrink-0 rounded-lg" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{exercise.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {exercise.primary_muscle && (
                      <span className="text-xs text-muted-foreground">
                        {exercise.primary_muscle.name}
                      </span>
                    )}
                    {exercise.difficulty && (
                      <Badge className={cn("text-[10px] px-1.5 py-0", difficultyColors[exercise.difficulty])}>
                        {difficultyLabels[exercise.difficulty]}
                      </Badge>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};
