import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MuscleGroup {
  id: string;
  name: string;
  category: string;
  description: string | null;
}

export interface CatalogExercise {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  execution: string | null;
  primary_muscle_id: string | null;
  secondary_muscles: string[] | null;
  equipment: string[] | null;
  difficulty: string | null;
  resistance_profile: string | null;
  strength_curve: string | null;
  video_url: string | null;
  image_url: string | null;
  tips: string[] | null;
  variants: string[] | null;
  is_compound: boolean | null;
  primary_muscle?: MuscleGroup;
}

export const useExerciseCatalog = () => {
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  const [exercises, setExercises] = useState<CatalogExercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch muscle groups
      const { data: muscles } = await supabase
        .from('muscle_groups')
        .select('*')
        .order('category, name');

      if (muscles) {
        setMuscleGroups(muscles);
      }

      // Fetch exercises
      const { data: exercisesData } = await supabase
        .from('exercise_catalog')
        .select('*')
        .order('name');

      if (exercisesData) {
        // Map muscle groups to exercises
        const exercisesWithMuscles = exercisesData.map(ex => ({
          ...ex,
          primary_muscle: muscles?.find(m => m.id === ex.primary_muscle_id)
        }));
        setExercises(exercisesWithMuscles);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  const filterByMuscle = (muscleId: string | null): CatalogExercise[] => {
    if (!muscleId) return exercises;
    return exercises.filter(ex => ex.primary_muscle_id === muscleId);
  };

  const filterByEquipment = (equipment: string | null): CatalogExercise[] => {
    if (!equipment) return exercises;
    return exercises.filter(ex => ex.equipment?.includes(equipment));
  };

  const searchExercises = (query: string): CatalogExercise[] => {
    if (!query.trim()) return exercises;
    const lowerQuery = query.toLowerCase();
    return exercises.filter(ex => 
      ex.name.toLowerCase().includes(lowerQuery) ||
      ex.description?.toLowerCase().includes(lowerQuery) ||
      ex.primary_muscle?.name.toLowerCase().includes(lowerQuery)
    );
  };

  return {
    muscleGroups,
    exercises,
    loading,
    filterByMuscle,
    filterByEquipment,
    searchExercises,
  };
};
