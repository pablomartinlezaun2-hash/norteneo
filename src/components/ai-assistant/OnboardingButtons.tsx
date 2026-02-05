import { motion } from 'framer-motion';
import { Dumbbell, TrendingUp, Heart, Sparkles, User, Users } from 'lucide-react';

interface OnboardingButtonsProps {
  type: 'level' | 'goal' | 'sex';
  onSelect: (value: string) => void;
  selected?: string | null;
}

const levelOptions = [
  { value: 'principiante', label: 'Principiante', icon: '🌱', description: 'Empezando mi viaje fitness' },
  { value: 'intermedio', label: 'Intermedio', icon: '💪', description: '1-3 años entrenando' },
  { value: 'avanzado', label: 'Avanzado', icon: '🔥', description: 'Atleta experimentado' },
];

const goalOptions = [
  { value: 'fuerza', label: 'Fuerza', icon: Dumbbell, description: 'Más peso, más poder' },
  { value: 'hipertrofia', label: 'Hipertrofia', icon: TrendingUp, description: 'Ganar músculo' },
  { value: 'resistencia', label: 'Resistencia', icon: Heart, description: 'Aguante y cardio' },
  { value: 'tonificacion', label: 'Tonificación', icon: Sparkles, description: 'Definir y esculpir' },
];

const sexOptions = [
  { value: 'hombre', label: 'Hombre', icon: User },
  { value: 'mujer', label: 'Mujer', icon: Users },
];

export const OnboardingButtons = ({ type, onSelect, selected }: OnboardingButtonsProps) => {
  const getOptions = () => {
    switch (type) {
      case 'level':
        return levelOptions;
      case 'goal':
        return goalOptions;
      case 'sex':
        return sexOptions;
      default:
        return [];
    }
  };

  const options = getOptions();

  if (type === 'level') {
    return (
      <div className="grid grid-cols-3 gap-2">
        {levelOptions.map((option, index) => (
          <motion.button
            key={option.value}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onSelect(option.value)}
            className={`p-3 rounded-xl border-2 transition-all ${
              selected === option.value
                ? 'border-primary bg-primary/10'
                : 'border-border bg-card hover:border-primary/50'
            }`}
          >
            <div className="text-2xl mb-1">{option.icon}</div>
            <div className="font-semibold text-sm">{option.label}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{option.description}</div>
          </motion.button>
        ))}
      </div>
    );
  }

  if (type === 'goal') {
    return (
      <div className="grid grid-cols-2 gap-2">
        {goalOptions.map((option, index) => {
          const Icon = option.icon;
          return (
            <motion.button
              key={option.value}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.08 }}
              onClick={() => onSelect(option.value)}
              className={`p-3 rounded-xl border-2 transition-all flex items-center gap-2 ${
                selected === option.value
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-card hover:border-primary/50'
              }`}
            >
              <div className={`p-2 rounded-lg ${selected === option.value ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-sm">{option.label}</div>
                <div className="text-[10px] text-muted-foreground">{option.description}</div>
              </div>
            </motion.button>
          );
        })}
      </div>
    );
  }

  if (type === 'sex') {
    return (
      <div className="flex gap-3 justify-center">
        {sexOptions.map((option, index) => {
          const Icon = option.icon;
          return (
            <motion.button
              key={option.value}
              initial={{ opacity: 0, x: index === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              onClick={() => onSelect(option.value)}
              className={`px-6 py-3 rounded-xl border-2 transition-all flex items-center gap-2 ${
                selected === option.value
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card hover:border-primary/50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-semibold">{option.label}</span>
            </motion.button>
          );
        })}
      </div>
    );
  }

  return null;
};
