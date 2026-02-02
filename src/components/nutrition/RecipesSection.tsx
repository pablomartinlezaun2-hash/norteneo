import { useState } from 'react';
import { ChefHat, Clock, Users, Search, Flame, Beef, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Recipe } from '@/hooks/useNutritionData';

interface RecipesSectionProps {
  recipes: Recipe[];
  onAddToLog?: (recipe: Recipe) => void;
}

export const RecipesSection = ({ recipes, onAddToLog }: RecipesSectionProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMealType, setSelectedMealType] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const mealTypes = ['desayuno', 'comida', 'cena', 'snack'];
  const tags = ['alto en proteínas', 'bajo en calorías', 'rápido', 'vegetariano'];

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesMealType = !selectedMealType || 
      recipe.meal_type?.includes(selectedMealType);
    
    const matchesTag = !selectedTag ||
      recipe.tags?.includes(selectedTag);
    
    return matchesSearch && matchesMealType && matchesTag;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="gradient-primary rounded-xl p-3">
          <ChefHat className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Recetas e Ideas</h2>
          <p className="text-sm text-muted-foreground">{recipes.length} recetas disponibles</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar recetas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filters - Meal types */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Tipo de comida</p>
        <div className="flex flex-wrap gap-2">
          {mealTypes.map(type => (
            <Button
              key={type}
              variant={selectedMealType === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedMealType(selectedMealType === type ? null : type)}
              className="capitalize"
            >
              {type}
            </Button>
          ))}
        </div>
      </div>

      {/* Filters - Tags */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Etiquetas</p>
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <Badge
              key={tag}
              variant={selectedTag === tag ? 'default' : 'outline'}
              className="cursor-pointer capitalize"
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* Recipe cards */}
      {filteredRecipes.length > 0 ? (
        <div className="grid gap-4">
          {filteredRecipes.map((recipe, index) => (
            <motion.div
              key={recipe.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="gradient-card rounded-2xl border border-border overflow-hidden card-hover"
            >
              {/* Recipe image placeholder */}
              {recipe.image_url ? (
                <img
                  src={recipe.image_url}
                  alt={recipe.name}
                  className="w-full h-40 object-cover"
                />
              ) : (
                <div className="w-full h-40 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                  <ChefHat className="w-12 h-12 text-primary/30" />
                </div>
              )}
              
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{recipe.name}</h3>
                    {recipe.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {recipe.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Meta info */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {recipe.prep_time_minutes && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{recipe.prep_time_minutes} min</span>
                    </div>
                  )}
                  {recipe.servings && (
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{recipe.servings} pers.</span>
                    </div>
                  )}
                </div>

                {/* Macros */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-sm">
                    <Flame className="w-4 h-4 text-primary" />
                    <span className="font-medium text-foreground">{recipe.calories}</span>
                    <span className="text-muted-foreground">kcal</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <Beef className="w-4 h-4 text-success" />
                    <span className="font-medium text-foreground">{recipe.protein}g</span>
                    <span className="text-muted-foreground">prot</span>
                  </div>
                </div>

                {/* Tags */}
                {recipe.tags && recipe.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {recipe.tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs capitalize">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Add to log button */}
                {onAddToLog && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => onAddToLog(recipe)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Añadir al registro
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <ChefHat className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">
            {searchQuery || selectedMealType || selectedTag 
              ? 'No se encontraron recetas con esos filtros'
              : 'No hay recetas disponibles'}
          </p>
          {(searchQuery || selectedMealType || selectedTag) && (
            <Button
              variant="link"
              className="mt-2"
              onClick={() => {
                setSearchQuery('');
                setSelectedMealType(null);
                setSelectedTag(null);
              }}
            >
              Limpiar filtros
            </Button>
          )}
        </motion.div>
      )}
    </div>
  );
};
