import { nutritionInfo, supplements, foods } from '@/data/workouts';
import { Apple, Pill, Footprints, Flame } from 'lucide-react';

export const NutritionSection = () => {
  return (
    <div className="space-y-6">
      {/* Explanation */}
      <div className="gradient-card rounded-lg p-4 border border-border">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {nutritionInfo.explanation}
        </p>
      </div>

      {/* Nutrition Cards */}
      <div className="grid grid-cols-1 gap-4">
        <div className="gradient-card rounded-lg p-4 border border-border">
          <div className="flex items-center gap-2 mb-3">
            <div className="gradient-primary rounded-lg p-2">
              <Flame className="w-4 h-4 text-primary-foreground" />
            </div>
            <h3 className="font-semibold text-foreground">Días de Gym</h3>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Footprints className="w-4 h-4 text-primary" />
            <span>{nutritionInfo.gymDays.steps} pasos diarios</span>
          </div>
        </div>

        <div className="gradient-card rounded-lg p-4 border border-border">
          <div className="flex items-center gap-2 mb-3">
            <div className="gradient-primary rounded-lg p-2">
              <Apple className="w-4 h-4 text-primary-foreground" />
            </div>
            <h3 className="font-semibold text-foreground">Días de Descanso</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="text-primary font-bold">Kcal:</span>
              <span>{nutritionInfo.restDays.kcal}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Footprints className="w-4 h-4 text-primary" />
              <span>{nutritionInfo.restDays.steps} pasos diarios</span>
            </div>
          </div>
        </div>
      </div>

      {/* Supplements */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Pill className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold text-foreground">Suplementación</h3>
        </div>
        <div className="space-y-3">
          {supplements.map((supplement, index) => (
            <div 
              key={index}
              className="gradient-card rounded-lg p-4 border border-border card-hover animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <h4 className="font-semibold text-foreground mb-2">{supplement.name}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {supplement.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Foods */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Apple className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold text-foreground">Alimentos Recomendados</h3>
        </div>
        <div className="space-y-3">
          {foods.map((food, index) => (
            <div 
              key={index}
              className="gradient-card rounded-lg p-4 border border-border card-hover animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <h4 className="font-semibold text-foreground mb-2">{food.name}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {food.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
