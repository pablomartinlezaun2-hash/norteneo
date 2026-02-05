import { motion } from 'framer-motion';
import { Zap, RefreshCw, Save, Share2, Calendar, FileDown, Apple } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  variant?: 'default' | 'outline' | 'secondary';
  gradient?: boolean;
}

interface QuickActionsProps {
  actions: QuickAction[];
  onAction: (actionId: string) => void;
}

const defaultActions: QuickAction[] = [
  { id: 'generate', label: 'Generar rutina', icon: Zap, gradient: true },
  { id: 'alternative', label: 'Alternativa', icon: RefreshCw, variant: 'outline' },
  { id: 'save', label: 'Guardar', icon: Save, variant: 'secondary' },
];

export const QuickActions = ({ actions = defaultActions, onAction }: QuickActionsProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap gap-2"
    >
      {actions.map((action, index) => {
        const Icon = action.icon;
        return (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
          >
            <Button
              size="sm"
              variant={action.variant || 'default'}
              className={`text-xs ${action.gradient ? 'gradient-primary' : ''}`}
              onClick={() => onAction(action.id)}
            >
              <Icon className="w-3 h-3 mr-1.5" />
              {action.label}
            </Button>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

// Routine actions after generation
export const RoutineActions = ({ onAction }: { onAction: (actionId: string) => void }) => {
  const actions: QuickAction[] = [
    { id: 'save-routine', label: 'Guardar', icon: Save, gradient: true },
    { id: 'add-calendar', label: 'Calendario', icon: Calendar, variant: 'outline' },
    { id: 'export-pdf', label: 'PDF', icon: FileDown, variant: 'outline' },
    { id: 'share', label: 'Compartir', icon: Share2, variant: 'outline' },
  ];

  return <QuickActions actions={actions} onAction={onAction} />;
};

// Nutrition quick suggestions
interface NutritionSuggestionProps {
  goal: string;
  allergies?: string[];
  onSelect: (suggestion: string) => void;
}

const nutritionSuggestions: Record<string, { emoji: string; title: string; description: string }[]> = {
  hipertrofia: [
    { emoji: '🥩', title: 'Alto en proteína', description: 'Pollo, huevos, pescado' },
    { emoji: '🍚', title: 'Carbos complejos', description: 'Arroz, avena, patata' },
    { emoji: '🥑', title: 'Grasas saludables', description: 'Aguacate, frutos secos' },
  ],
  fuerza: [
    { emoji: '🥚', title: 'Proteína completa', description: 'Huevos, carne, legumbres' },
    { emoji: '🍌', title: 'Pre-entreno', description: 'Plátano y avena' },
    { emoji: '💧', title: 'Hidratación', description: '3L agua + electrolitos' },
  ],
  resistencia: [
    { emoji: '🍝', title: 'Carga de carbos', description: 'Pasta, arroz integral' },
    { emoji: '🍯', title: 'Energía rápida', description: 'Miel, frutas, dátiles' },
    { emoji: '🥤', title: 'Recuperación', description: 'Batido proteico + fruta' },
  ],
  tonificacion: [
    { emoji: '🥗', title: 'Déficit ligero', description: 'Verduras + proteína' },
    { emoji: '🍳', title: 'Proteína magra', description: 'Clara de huevo, pavo' },
    { emoji: '🫐', title: 'Antioxidantes', description: 'Frutos rojos, té verde' },
  ],
};

export const NutritionSuggestions = ({ goal, allergies = [], onSelect }: NutritionSuggestionProps) => {
  const suggestions = nutritionSuggestions[goal] || nutritionSuggestions.hipertrofia;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Apple className="w-3 h-3" />
        Sugerencias nutricionales
      </div>
      <div className="grid grid-cols-3 gap-2">
        {suggestions.map((suggestion, index) => (
          <motion.button
            key={suggestion.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onSelect(suggestion.title)}
            className="p-2 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors text-left"
          >
            <div className="text-xl mb-0.5">{suggestion.emoji}</div>
            <div className="text-[10px] font-semibold">{suggestion.title}</div>
            <div className="text-[9px] text-muted-foreground">{suggestion.description}</div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};
