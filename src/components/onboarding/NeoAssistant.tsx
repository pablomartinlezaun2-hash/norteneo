import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Dumbbell, TrendingUp, UtensilsCrossed, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NeoAssistantProps {
  onComplete: () => void;
  onSkip: () => void;
}

interface Slide {
  id: number;
  headline: string;
  sub: string;
  Icon?: React.ElementType;
  iconColor?: string;
  glowColor?: string;
  isWelcome?: boolean;
}

const SLIDES: Slide[] = [
  {
    id: 0,
    headline: 'NEO',
    sub: 'El rendimiento, rediseñado.',
    isWelcome: true,
  },
  {
    id: 1,
    headline: 'Entrena con precisión',
    sub: 'Seguimiento real de series, cargas y fatiga.',
    Icon: Dumbbell,
    iconColor: 'text-cyan-400',
    glowColor: 'rgba(34,211,238,0.25)',
  },
  {
    id: 2,
    headline: 'Diseño inteligente',
    sub: 'Rutinas generadas por nuestro algoritmo.',
    Icon: Zap,
    iconColor: 'text-amber-400',
    glowColor: 'rgba(251,191,36,0.25)',
  },
  {
    id: 3,
    headline: 'Nutrición dinámica',
    sub: 'Ajuste automático según tu carga de entrenamiento.',
    Icon: UtensilsCrossed,
    iconColor: 'text-emerald-400',
    glowColor: 'rgba(52,211,153,0.25)',
  },
  {
    id: 4,
    headline: 'Progreso real',
    sub: 'Gráficas y análisis del rendimiento.',
    Icon: TrendingUp,
    iconColor: 'text-violet-400',
    glowColor: 'rgba(167,139,250,0.25)',
  },
];

export const NeoAssistant = ({ onComplete, onSkip }: NeoAssistantProps) => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const touchStartX = useRef(0);

  const slide = SLIDES[current];
  const isLast = current === SLIDES.length - 1;
  const isFirst = current === 0;

  const goNext = () => {
    if (isLast) { onComplete(); return; }
    setDirection(1);
    setCurrent(prev => prev + 1);
  };

  const goPrev = () => {
    if (isFirst) return;
    setDirection(-1);
    setCurrent(prev => prev - 1);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? goNext() : goPrev();
    }
  };

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  const contentVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -100 : 100,
      opacity: 0,
      transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
    }),
  };

  return (
    <div
      className="fixed inset-0 bg-black flex flex-col z-50 select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Skip */}
      {!isLast && (
        <div className="flex justify-end px-6 pt-6">
          <button
            onClick={onSkip}
            className="text-[13px] text-white/30 hover:text-white/60 transition-colors tracking-wide"
          >
            Saltar
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={slide.id}
            custom={direction}
            variants={contentVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="flex flex-col items-center justify-center px-8 w-full max-w-md"
          >
            {slide.isWelcome ? (
              /* Welcome slide — logo + text */
              <>
                <motion.div
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="relative mb-10"
                >
                  {/* Glow */}
                  <motion.div
                    className="absolute inset-0 rounded-3xl blur-2xl bg-white/10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.6, 0.3] }}
                    transition={{ duration: 2, ease: 'easeInOut' }}
                  />
                  <div className="relative bg-white rounded-3xl px-10 py-6">
                    <span className="text-5xl font-bold tracking-tight text-black">NEO</span>
                  </div>
                </motion.div>

                <motion.p
                  className="text-[22px] text-white/50 font-light tracking-wide text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.7 }}
                >
                  {slide.sub}
                </motion.p>
              </>
            ) : (
              /* Feature slides */
              <>
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="relative mb-12"
                >
                  {/* Icon glow */}
                  <div
                    className="absolute inset-0 rounded-[32px] blur-2xl"
                    style={{ backgroundColor: slide.glowColor }}
                  />
                  <div className="relative w-28 h-28 rounded-[32px] bg-white/[0.05] border border-white/[0.08] flex items-center justify-center backdrop-blur-sm">
                    {slide.Icon && (
                      <motion.div
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <slide.Icon className={cn('w-12 h-12', slide.iconColor)} strokeWidth={1.5} />
                      </motion.div>
                    )}
                  </div>
                </motion.div>

                <motion.div
                  className="text-center space-y-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.6 }}
                >
                  <h1 className="text-[32px] font-bold text-white leading-tight tracking-tight">
                    {slide.headline}
                  </h1>
                  <p className="text-[17px] text-white/40 leading-relaxed font-light">
                    {slide.sub}
                  </p>
                </motion.div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom */}
      <div className="flex flex-col items-center gap-8 pb-12 px-8">
        {/* Dots */}
        <div className="flex gap-2">
          {SLIDES.map((_, i) => (
            <motion.div
              key={i}
              className="h-[5px] rounded-full"
              animate={{
                width: i === current ? 24 : 5,
                backgroundColor: i === current ? '#ffffff' : 'rgba(255,255,255,0.15)',
              }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            />
          ))}
        </div>

        {/* CTA */}
        <motion.button
          onClick={goNext}
          whileTap={{ scale: 0.96 }}
          whileHover={{ scale: 1.02 }}
          className={cn(
            "h-14 rounded-full font-semibold text-[15px] flex items-center justify-center gap-2 transition-all duration-300",
            isLast
              ? "w-full max-w-xs bg-white text-black"
              : "px-10 bg-white/90 text-black"
          )}
        >
          {isLast ? 'Empezar' : 'Siguiente'}
          {!isLast && <ChevronRight className="w-4 h-4" />}
        </motion.button>
      </div>
    </div>
  );
};
