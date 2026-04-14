import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { WelcomeLogo, StrokeIcon, TextReveal, SubtitleReveal, ClosingLogo } from './onboarding/OnboardingVisuals';
import { ChevronRight, ChevronLeft } from 'lucide-react';

/* ═══════════════════════════════════════════
   TWINKLING STARS BACKGROUND
   ═══════════════════════════════════════════ */

const TwinklingStars = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    const STAR_COUNT = 80;
    const stars = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.2 + 0.3,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.8 + 0.3,
    }));

    const animate = (t: number) => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      stars.forEach((s) => {
        const opacity = 0.15 + 0.55 * ((Math.sin(t * 0.001 * s.speed + s.phase) + 1) / 2);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${opacity})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-[1]" />;
};

interface CinematicOnboardingProps {
  onComplete: () => void;
}

interface SlideConfig {
  id: string;
  bg: string;
  accentColor: string;
}

const SLIDES: SlideConfig[] = [
  { id: 'welcome', bg: '#000000', accentColor: '#ffffff' },
  { id: 'training', bg: '#000000', accentColor: '#60A5FA' },
  { id: 'ai', bg: '#000000', accentColor: '#A5F3FC' },
  { id: 'nutrition', bg: '#000000', accentColor: '#34D399' },
  { id: 'progress', bg: '#000000', accentColor: '#C4B5FD' },
  { id: 'start', bg: '#000000', accentColor: '#ffffff' },
];

export const CinematicOnboarding = ({ onComplete }: CinematicOnboardingProps) => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);

  // Animate progress bar
  useEffect(() => {
    if (!progressRef.current) return;
    const pct = ((current + 1) / SLIDES.length) * 100;
    gsap.to(progressRef.current, { width: `${pct}%`, duration: 0.6, ease: 'power2.out' });
  }, [current]);

  const goTo = useCallback((index: number) => {
    if (index < 0 || index >= SLIDES.length) return;
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
  }, [current]);

  const next = useCallback(() => {
    if (current < SLIDES.length - 1) goTo(current + 1);
  }, [current, goTo]);

  const prev = useCallback(() => {
    if (current > 0) goTo(current - 1);
  }, [current, goTo]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev]);

  // Touch swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) next();
      else prev();
    }
  };

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.92,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: { duration: 0.65, ease: 'easeOut' as const },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? '-40%' : '40%',
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.45, ease: 'easeOut' as const },
    }),
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[200] overflow-hidden"
      style={{ background: SLIDES[current].bg }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Twinkling stars */}
      <TwinklingStars />

      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-1000 z-[2]"
        style={{
          background: `radial-gradient(ellipse 60% 50% at 50% 40%, ${SLIDES[current].accentColor}08 0%, transparent 70%)`,
        }}
      />

      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/5 z-50">
        <div
          ref={progressRef}
          className="h-full bg-white/30"
          style={{ width: `${((current + 1) / SLIDES.length) * 100}%` }}
        />
      </div>

      {/* Dot indicators */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-2 z-50">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
              i === current ? 'bg-white/80 scale-125' : 'bg-white/20 hover:bg-white/40'
            }`}
          />
        ))}
      </div>

      {/* Skip button */}
      <button
        onClick={onComplete}
        className="absolute top-5 right-5 z-50 text-[11px] tracking-[0.15em] uppercase text-white/30 hover:text-white/60 transition-colors font-medium"
      >
        Omitir
      </button>

      {/* Slides */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={current}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="absolute inset-0 flex flex-col items-center justify-center px-8"
        >
          {current === 0 && <WelcomeSlide />}
          {current === 1 && <TrainingSlide />}
          {current === 2 && <AISlide />}
          {current === 3 && <NutritionSlide />}
          {current === 4 && <ProgressSlide />}
          {current === 5 && <StartSlide onStart={onComplete} />}
        </motion.div>
      </AnimatePresence>

      {/* Navigation arrows */}
      {current > 0 && (
        <button
          onClick={prev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-50 w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-white/40" />
        </button>
      )}
      {current < SLIDES.length - 1 && (
        <button
          onClick={next}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-50 w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-white/40" />
        </button>
      )}

      {/* Tap to advance hint (first slide only) */}
      {current === 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5, duration: 0.8 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.2em] uppercase text-white/20 z-50"
        >
          Desliza o pulsa → para continuar
        </motion.p>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════
   SLIDE 0 — WELCOME (logo laser reveal)
   ═══════════════════════════════════════════ */

const WelcomeSlide = () => {
  return (
    <div className="relative flex flex-col items-center justify-center gap-6">
      <WelcomeLogo />
      <div className="mt-4">
        <TextReveal
          text="Tu plataforma integral de rendimiento"
          className="text-[15px] tracking-[0.06em] text-center font-medium"
          style_color="#8E8E93"
          delay={1.4}
        />
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════
   SLIDE 1 — TRAINING
   ═══════════════════════════════════════════ */

const TrainingSlide = () => {
  return (
    <div className="flex flex-col items-center gap-8">
      <StrokeIcon iconKey="barbell" glowColor="#60A5FA20" />
      <div className="flex flex-col items-center gap-3 mt-4">
        <TextReveal
          text="Entrena con precisión"
          as="h1"
          className="text-[28px] md:text-[36px] font-bold tracking-[-0.02em] text-center leading-tight"
          style_color="#F5F5F7"
          delay={0.3}
        />
        <SubtitleReveal
          text="Programas periodizados, autoregulación inteligente y registro detallado de cada serie."
          className="text-[14px] md:text-[15px] text-center max-w-[340px] leading-relaxed"
          delay={0.7}
        />
      </div>
      <FeaturePills
        items={['Periodización', 'Autoregulación', 'Microciclos']}
        delay={1.1}
        color="#60A5FA"
      />
    </div>
  );
};

/* ═══════════════════════════════════════════
   SLIDE 2 — AI
   ═══════════════════════════════════════════ */

const AISlide = () => {
  return (
    <div className="flex flex-col items-center gap-8">
      <StrokeIcon iconKey="network" glowColor="#A5F3FC20" />
      <div className="flex flex-col items-center gap-3 mt-4">
        <TextReveal
          text="Inteligencia adaptativa"
          as="h1"
          className="text-[28px] md:text-[36px] font-bold tracking-[-0.02em] text-center leading-tight"
          style_color="#F5F5F7"
          delay={0.3}
        />
        <SubtitleReveal
          text="NEO analiza tu fatiga, sueño y rendimiento para ajustar cada sesión en tiempo real."
          className="text-[14px] md:text-[15px] text-center max-w-[340px] leading-relaxed"
          delay={0.7}
        />
      </div>
      <FeaturePills
        items={['IA Adaptativa', 'Check-in diario', 'Recomendaciones']}
        delay={1.1}
        color="#A5F3FC"
      />
    </div>
  );
};

/* ═══════════════════════════════════════════
   SLIDE 3 — NUTRITION
   ═══════════════════════════════════════════ */

const NutritionSlide = () => {
  return (
    <div className="flex flex-col items-center gap-8">
      <StrokeIcon iconKey="utensils" glowColor="#34D39920" />
      <div className="flex flex-col items-center gap-3 mt-4">
        <TextReveal
          text="Nutrición sincronizada"
          as="h1"
          className="text-[28px] md:text-[36px] font-bold tracking-[-0.02em] text-center leading-tight"
          style_color="#F5F5F7"
          delay={0.3}
        />
        <SubtitleReveal
          text="Control de macros, suplementación y registro de comidas integrado con tu entrenamiento."
          className="text-[14px] md:text-[15px] text-center max-w-[340px] leading-relaxed"
          delay={0.7}
        />
      </div>
      <FeaturePills
        items={['Macros', 'Suplementos', 'Recetas']}
        delay={1.1}
        color="#34D399"
      />
    </div>
  );
};

/* ═══════════════════════════════════════════
   SLIDE 4 — PROGRESS
   ═══════════════════════════════════════════ */

const ProgressSlide = () => {
  return (
    <div className="flex flex-col items-center gap-8">
      <StrokeIcon iconKey="chart" glowColor="#C4B5FD20" />
      <div className="flex flex-col items-center gap-3 mt-4">
        <TextReveal
          text="Mide tu evolución"
          as="h1"
          className="text-[28px] md:text-[36px] font-bold tracking-[-0.02em] text-center leading-tight"
          style_color="#F5F5F7"
          delay={0.3}
        />
        <SubtitleReveal
          text="Gráficas de rendimiento, alertas inteligentes y análisis de tendencias por ejercicio."
          className="text-[14px] md:text-[15px] text-center max-w-[340px] leading-relaxed"
          delay={0.7}
        />
      </div>
      <FeaturePills
        items={['Tendencias', 'Alertas', '1RM estimado']}
        delay={1.1}
        color="#C4B5FD"
      />
    </div>
  );
};

/* ═══════════════════════════════════════════
   SLIDE 5 — START
   ═══════════════════════════════════════════ */

const StartSlide = ({ onStart }: { onStart: () => void }) => {
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!btnRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        btnRef.current!,
        { opacity: 0, y: 20, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.8, delay: 1.2, ease: 'power3.out' }
      );
    });
    return () => ctx.revert();
  }, []);

  return (
    <div className="flex flex-col items-center gap-8">
      <ClosingLogo />
      <div className="flex flex-col items-center gap-3">
        <TextReveal
          text="Tu viaje comienza ahora"
          as="h1"
          className="text-[28px] md:text-[36px] font-bold tracking-[-0.02em] text-center leading-tight"
          style_color="#F5F5F7"
          delay={0.4}
        />
        <SubtitleReveal
          text="Entrena más inteligente. Evoluciona sin límites."
          className="text-[14px] md:text-[15px] text-center max-w-[340px]"
          delay={0.8}
        />
      </div>
      <button
        ref={btnRef}
        onClick={onStart}
        className="mt-4 px-8 py-3.5 rounded-2xl bg-[#F5F5F7] text-black text-[15px] font-semibold tracking-wide hover:bg-white transition-colors opacity-0"
      >
        Comenzar
      </button>
    </div>
  );
};

/* ═══════════════════════════════════════════
   FEATURE PILLS (animated tags)
   ═══════════════════════════════════════════ */

const FeaturePills = ({ items, delay, color }: { items: string[]; delay: number; color: string }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      const pills = ref.current!.children;
      gsap.fromTo(
        pills,
        { opacity: 0, y: 12, scale: 0.85 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.5,
          ease: 'power2.out',
          stagger: 0.12,
          delay,
        }
      );
    }, ref);
    return () => ctx.revert();
  }, [delay]);

  return (
    <div ref={ref} className="flex gap-2 flex-wrap justify-center">
      {items.map((item) => (
        <span
          key={item}
          className="px-3 py-1.5 rounded-full text-[11px] tracking-[0.08em] uppercase font-medium border opacity-0"
          style={{
            color: color,
            borderColor: `${color}30`,
            backgroundColor: `${color}08`,
          }}
        >
          {item}
        </span>
      ))}
    </div>
  );
};
