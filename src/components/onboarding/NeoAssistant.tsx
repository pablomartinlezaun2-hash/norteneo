import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Dumbbell, TrendingUp, Apple, Zap, User, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NeoCharacter } from './NeoCharacter';

interface NeoAssistantProps {
  onComplete: () => void;
  onSkip: () => void;
}

type Pose = 'wave' | 'flex' | 'point' | 'think' | 'celebrate' | 'run' | 'eat';

interface Slide {
  id: number;
  pose: Pose;
  emoji: string;
  tag: string;
  tagColor: string;
  headline: string;
  sub: string;
  cta: string;
  accent: string;
  Icon: React.ElementType;
}

const SLIDES: Slide[] = [
  {
    id: 0,
    pose: 'wave',
    emoji: '👋',
    tag: 'Bienvenida',
    tagColor: 'from-primary to-primary/70',
    headline: 'Hola, soy Neo.',
    sub: 'Tu guía personal en NEO. Vamos a conocer la app juntos.',
    cta: 'Vamos',
    accent: 'from-primary/20 to-primary/5',
    Icon: Sparkles,
  },
  {
    id: 1,
    pose: 'flex',
    emoji: '💪',
    tag: 'Entrenamientos',
    tagColor: 'from-orange-500 to-red-500',
    headline: 'Registra cada serie.',
    sub: 'Gym, natación y running. Todo tu progreso en un solo lugar.',
    cta: 'Entendido',
    accent: 'from-orange-500/20 to-orange-500/5',
    Icon: Dumbbell,
  },
  {
    id: 2,
    pose: 'point',
    emoji: '⚡',
    tag: 'Diseño con IA',
    tagColor: 'from-amber-500 to-orange-500',
    headline: 'Yo diseño tu rutina.',
    sub: 'Dime tu nivel y objetivo. Te genero un plan personalizado al instante.',
    cta: 'Siguiente',
    accent: 'from-amber-500/20 to-amber-500/5',
    Icon: Zap,
  },
  {
    id: 3,
    pose: 'celebrate',
    emoji: '📈',
    tag: 'Progreso',
    tagColor: 'from-emerald-500 to-teal-500',
    headline: 'Mejora cada semana.',
    sub: 'Gráficas y modelo anatómico 3D para ver tu evolución muscular.',
    cta: 'Siguiente',
    accent: 'from-emerald-500/20 to-emerald-500/5',
    Icon: TrendingUp,
  },
  {
    id: 4,
    pose: 'eat',
    emoji: '🍎',
    tag: 'Nutrición',
    tagColor: 'from-green-500 to-lime-500',
    headline: 'Controla tu nutrición.',
    sub: 'Calorías, macros, recetas y suplementos. Todo bajo control.',
    cta: 'Siguiente',
    accent: 'from-green-500/20 to-green-500/5',
    Icon: Apple,
  },
  {
    id: 5,
    pose: 'think',
    emoji: '👤',
    tag: 'Perfil',
    tagColor: 'from-cyan-500 to-blue-500',
    headline: 'Personaliza tu experiencia.',
    sub: 'Tema, idioma, perfil de salud y más. La app se adapta a ti.',
    cta: 'Siguiente',
    accent: 'from-cyan-500/20 to-cyan-500/5',
    Icon: User,
  },
  {
    id: 6,
    pose: 'celebrate',
    emoji: '🚀',
    tag: '¡Listo!',
    tagColor: 'from-primary to-primary/70',
    headline: '¡Estás preparado!',
    sub: 'Todo configurado. Empieza tu primer entrenamiento ahora.',
    cta: 'Empezar',
    accent: 'from-primary/20 to-primary/5',
    Icon: Sparkles,
  },
];

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 300 : -300,
    opacity: 0,
    scale: 0.95,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 300, damping: 30 },
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -300 : 300,
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 },
  }),
};

export const NeoAssistant = ({ onComplete, onSkip }: NeoAssistantProps) => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  const slide = SLIDES[current];
  const isLast = current === SLIDES.length - 1;
  const progress = ((current + 1) / SLIDES.length) * 100;

  const goNext = () => {
    if (isLast) {
      onComplete();
      return;
    }
    setDirection(1);
    setCurrent(prev => prev + 1);
  };

  return (
    <div className="fixed inset-0 bg-background flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-safe-top pt-4 pb-2">
        {/* Progress dots */}
        <div className="flex gap-1.5">
          {SLIDES.map((_, i) => (
            <motion.div
              key={i}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                i === current
                  ? 'w-6 bg-primary'
                  : i < current
                  ? 'w-1.5 bg-primary/40'
                  : 'w-1.5 bg-muted'
              )}
            />
          ))}
        </div>

        <button
          onClick={onSkip}
          className="text-xs text-muted-foreground px-3 py-1.5 rounded-full hover:bg-muted transition-colors"
        >
          Saltar
        </button>
      </div>

      {/* Slide content */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={slide.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="absolute inset-0 flex flex-col items-center justify-between px-6 py-4"
          >
            {/* Tag */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-gradient-to-r',
                slide.tagColor
              )}
            >
              <span>{slide.emoji}</span>
              <span>{slide.tag}</span>
            </motion.div>

            {/* Neo character */}
            <motion.div
              className="relative flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 250 }}
            >
              {/* Glow background */}
              <div className={cn(
                'absolute inset-0 rounded-full blur-3xl opacity-40 bg-gradient-to-b',
                slide.accent
              )} />
              <NeoCharacter pose={slide.pose} size={160} className="relative z-10" />
            </motion.div>

            {/* Text */}
            <motion.div
              className="text-center space-y-3 w-full max-w-xs"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-3xl font-extrabold text-foreground leading-tight">
                {slide.headline}
              </h1>
              <p className="text-base text-muted-foreground leading-relaxed">
                {slide.sub}
              </p>
            </motion.div>

            {/* CTA button */}
            <motion.div
              className="w-full max-w-xs space-y-2 pb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <motion.button
                onClick={goNext}
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.02 }}
                className={cn(
                  'w-full h-14 rounded-2xl font-bold text-base text-white flex items-center justify-center gap-2',
                  'bg-gradient-to-r shadow-lg',
                  isLast ? 'from-primary to-primary/80 shadow-primary/30' : 'from-primary to-primary/80 shadow-primary/20'
                )}
              >
                {slide.cta}
                {!isLast && <ChevronRight className="w-5 h-5" />}
                {isLast && <Sparkles className="w-5 h-5" />}
              </motion.button>

              {/* Step counter */}
              <p className="text-center text-xs text-muted-foreground">
                {current + 1} de {SLIDES.length}
              </p>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
