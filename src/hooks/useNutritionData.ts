import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  category?: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g?: number;
  serving_size?: number;
  serving_unit?: string;
  is_default?: boolean;
}

export interface FoodLog {
  id: string;
  food_id?: string;
  food_name: string;
  meal_type: string;
  quantity: number;
  unit?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  logged_date: string;
}

export interface NutritionGoals {
  id: string;
  daily_calories: number;
  daily_protein: number;
  daily_carbs: number;
  daily_fat: number;
}

export interface UserSupplement {
  id: string;
  name: string;
  dosage?: string;
  timing?: string;
  notes?: string;
  is_active: boolean;
}

export interface SupplementLog {
  id: string;
  supplement_id: string;
  taken_at: string;
  logged_date: string;
}

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  prep_time_minutes?: number;
  servings?: number;
  ingredients?: any;
  instructions?: string[];
  meal_type?: string[];
  tags?: string[];
  is_default?: boolean;
}

export const useNutritionData = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [foodCatalog, setFoodCatalog] = useState<FoodItem[]>([]);
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [goals, setGoals] = useState<NutritionGoals | null>(null);
  const [supplements, setSupplements] = useState<UserSupplement[]>([]);
  const [supplementLogs, setSupplementLogs] = useState<SupplementLog[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const formattedDate = format(selectedDate, 'yyyy-MM-dd');

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user, formattedDate]);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchFoodCatalog(),
      fetchFoodLogs(),
      fetchGoals(),
      fetchSupplements(),
      fetchSupplementLogs(),
      fetchRecipes()
    ]);
    setLoading(false);
  };

  const fetchFoodCatalog = async () => {
    const { data, error } = await supabase
      .from('food_catalog')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching food catalog:', error);
      return;
    }
    setFoodCatalog(data || []);
  };

  const fetchFoodLogs = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('food_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('logged_date', formattedDate)
      .order('created_at');
    
    if (error) {
      console.error('Error fetching food logs:', error);
      return;
    }
    setFoodLogs(data || []);
  };

  const fetchGoals = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('nutrition_goals')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching goals:', error);
      return;
    }
    setGoals(data);
  };

  const fetchSupplements = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('user_supplements')
      .select('*')
      .eq('user_id', user.id)
      .order('name');
    
    if (error) {
      console.error('Error fetching supplements:', error);
      return;
    }
    setSupplements(data || []);
  };

  const fetchSupplementLogs = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('supplement_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('logged_date', formattedDate);
    
    if (error) {
      console.error('Error fetching supplement logs:', error);
      return;
    }
    setSupplementLogs(data || []);
  };

  const fetchRecipes = async () => {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching recipes:', error);
      return;
    }
    setRecipes(data || []);
  };

  // Add food log
  const addFoodLog = async (food: FoodItem, mealType: string, quantity: number) => {
    if (!user) return;
    
    const multiplier = quantity / 100;
    const newLog = {
      user_id: user.id,
      food_id: food.id,
      food_name: food.name,
      meal_type: mealType,
      quantity,
      unit: food.serving_unit || 'g',
      calories: Math.round(food.calories_per_100g * multiplier),
      protein: Math.round(food.protein_per_100g * multiplier * 10) / 10,
      carbs: Math.round(food.carbs_per_100g * multiplier * 10) / 10,
      fat: Math.round(food.fat_per_100g * multiplier * 10) / 10,
      logged_date: formattedDate
    };

    const { error } = await supabase.from('food_logs').insert(newLog);
    
    if (error) {
      toast.error('Error al añadir alimento');
      console.error(error);
      return;
    }
    
    toast.success('Alimento añadido');
    fetchFoodLogs();
  };

  // Delete food log
  const deleteFoodLog = async (id: string) => {
    const { error } = await supabase.from('food_logs').delete().eq('id', id);
    
    if (error) {
      toast.error('Error al eliminar');
      return;
    }
    
    toast.success('Alimento eliminado');
    fetchFoodLogs();
  };

  // Update goals
  const updateGoals = async (newGoals: Partial<NutritionGoals>) => {
    if (!user) return;
    
    if (goals) {
      const { error } = await supabase
        .from('nutrition_goals')
        .update(newGoals)
        .eq('id', goals.id);
      
      if (error) {
        toast.error('Error al actualizar objetivos');
        return;
      }
    } else {
      const { error } = await supabase
        .from('nutrition_goals')
        .insert({ ...newGoals, user_id: user.id });
      
      if (error) {
        toast.error('Error al crear objetivos');
        return;
      }
    }
    
    toast.success('Objetivos actualizados');
    fetchGoals();
  };

  // Add supplement
  const addSupplement = async (supplement: Omit<UserSupplement, 'id' | 'is_active'>): Promise<UserSupplement | null> => {
    if (!user) return null;
    
    const { data, error } = await supabase
      .from('user_supplements')
      .insert({ ...supplement, user_id: user.id, is_active: true })
      .select()
      .single();
    
    if (error) {
      toast.error('Error al añadir suplemento');
      return null;
    }
    
    toast.success('Suplemento añadido');
    await fetchSupplements();
    return data as UserSupplement;
  };

  // Delete supplement
  const deleteSupplement = async (id: string) => {
    const { error } = await supabase.from('user_supplements').delete().eq('id', id);
    
    if (error) {
      toast.error('Error al eliminar');
      return;
    }
    
    toast.success('Suplemento eliminado');
    fetchSupplements();
  };

  // Toggle supplement taken
  const toggleSupplementTaken = async (supplementId: string) => {
    if (!user) return;
    
    const existingLog = supplementLogs.find(log => log.supplement_id === supplementId);
    
    if (existingLog) {
      const { error } = await supabase
        .from('supplement_logs')
        .delete()
        .eq('id', existingLog.id);
      
      if (error) {
        toast.error('Error');
        return;
      }
    } else {
      const { error } = await supabase
        .from('supplement_logs')
        .insert({ 
          user_id: user.id, 
          supplement_id: supplementId,
          logged_date: formattedDate
        });
      
      if (error) {
        toast.error('Error');
        return;
      }
    }
    
    fetchSupplementLogs();
  };

  // Calculate daily totals
  const dailyTotals = foodLogs.reduce((acc, log) => ({
    calories: acc.calories + log.calories,
    protein: acc.protein + log.protein,
    carbs: acc.carbs + log.carbs,
    fat: acc.fat + log.fat
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  return {
    loading,
    foodCatalog,
    foodLogs,
    goals,
    supplements,
    supplementLogs,
    recipes,
    dailyTotals,
    selectedDate,
    setSelectedDate,
    addFoodLog,
    deleteFoodLog,
    updateGoals,
    addSupplement,
    deleteSupplement,
    toggleSupplementTaken,
    refetch: fetchAllData
  };
};
