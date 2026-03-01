import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Dumbbell, TrendingUp, UtensilsCrossed, Zap, User, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NeoLogo } from '@/components/NeoLogo';

interface NeoAssistantProps {
  onComplete: () => void;
  onSkip: () => void;
}

interface Slide {
  id: number;
  headline: string;
  sub: string;
  iconColor: string;
  glowColor: string;
  Icon: React.ElementType;
  isWelcome?: boolean;
}

const SLIDES: Slide[] = [
  {
    id: 0,
    headline: 'Bienvenido a NEO',
    sub: 'Tu plataforma premium de fitness y nutrición.',
    iconColor: 'text-foreground',
    glowColor: 'shadow-white/5',
    Icon: Sparkles,
    isWelcome: true,
  },
  {
    id: 1,
    headline: 'Registra cada entrenamiento',
    sub: 'Series, pesos y progreso real en cada sesión.',
    iconColor: 'text-cyan-400',
    glowColor: 'shadow-cyan-500/20',
    Icon: Dumbbell,
  },
  {
    id: 2,
    headline: 'Diseña con inteligencia',
    sub: 'Rutinas personalizadas generadas por IA.',
    iconColor: 'text-amber-400',
    glowColor: 'shadow-amber-500/20',
    Icon: Zap,
  },
  {
    id: 3,
    headline: 'Controla tu nutrición',
    sub: 'TDEE dinámico adaptado a tu tipo de día.',
    iconColor: 'text-emerald-400',
    glowColor: 'shadow-emerald-500/20',
    Icon: UtensilsCrossed,
  },
  {
    id: 4,
    headline: 'Visualiza tu progreso',
    sub: 'Gráficas, alertas y análisis de rendimiento.',
    iconColor: 'text-violet-400',
    glowColor: 'shadow-violet-500/20',
    Icon: TrendingUp,
  },
];

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 200 : -200,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { type: 'spring' as const, stiffness: 300, damping: 30 },
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -200 : 200,
    opacity: 0,
    transition: { duration: 0.2 },
  }),
};

export const NeoAssistant = ({ onComplete, onSkip }: NeoAssistantProps) => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  const slide = SLIDES[current];
  const isLast = current === SLIDES.length - 1;

  const goNext = () => {
    if (isLast) {
      onComplete();
      return;
    }
    setDirection(1);
    setCurrent(prev => prev + 1);
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-50">
      {/* Skip button */}
      <div className="flex justify-end px-6 pt-safe-top pt-5">
        <button
          onClick={onSkip}
          className="text-sm text-white/40 hover:text-white/70 transition-colors"
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
            className="absolute inset-0 flex flex-col items-center justify-center px-8"
          >
            {/* Icon container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 250 }}
              className="mb-10"
            >
              {slide.isWelcome ? (
                <div className="w-28 h-28 rounded-[28px] bg-black border border-white/15 flex items-center justify-center shadow-lg">
                  <NeoLogo size="sm" />
                </div>
              ) : (
                <div className={cn(
                  'w-28 h-28 rounded-[28px] bg-white/[0.04] border border-white/10 flex items-center justify-center shadow-lg',
                  slide.glowColor
                )}>
                  <slide.Icon className={cn('w-12 h-12', slide.iconColor)} strokeWidth={1.5} />
                </div>
              )}
            </motion.div>

            {/* Text */}
            <motion.div
              className="text-center space-y-4 w-full max-w-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-[28px] font-bold text-white leading-tight tracking-tight">
                {slide.headline}
              </h1>
              <p className="text-[17px] text-white/40 leading-relaxed">
                {slide.sub}
              </p>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom section */}
      <div className="flex flex-col items-center gap-8 pb-12 px-8">
        {/* Dot indicators */}
        <div className="flex gap-2">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-[6px] rounded-full transition-all duration-300',
                i === current
                  ? 'w-6 bg-white'
                  : 'w-[6px] bg-white/20'
              )}
            />
          ))}
        </div>

        {/* CTA button */}
        <motion.button
          onClick={goNext}
          whileTap={{ scale: 0.97 }}
          className="h-14 px-10 rounded-full bg-white/95 text-black font-semibold text-base flex items-center gap-2 hover:bg-white transition-colors"
        >
          {isLast ? 'Empezar' : 'Siguiente'}
          <ChevronRight className="w-5 h-5" />
        </motion.button>
      </div>
    </div>
  );
};
