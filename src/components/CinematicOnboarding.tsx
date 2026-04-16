import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { SplashScreen } from './SplashScreen';
import {
  WelcomeLogo, ClosingLogo, TextReveal, SubtitleReveal,
  TrainingHeroVisual, AIHeroVisual, NutritionHeroVisual, ProgressHeroVisual,
} from './onboarding/OnboardingVisuals';

/* ═══════════════════════════════════════════
   PARTICLE FIELD — layered depth
   ═══════════════════════════════════════════ */

const ParticleField = ({ accentColor }: { accentColor: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const accentRef = useRef(accentColor);
  accentRef.current = accentColor;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = window.innerWidth;
    let h = window.innerHeight;

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    interface Particle {
      x: number; y: number; r: number;
      vx: number; vy: number;
      layer: number; // 0=far, 1=mid, 2=near
      phase: number; speed: number;
    }

    const PARTICLE_COUNT = 55;
    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => {
      const layer = Math.random() < 0.2 ? 2 : Math.random() < 0.5 ? 1 : 0;
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        r: layer === 2 ? 1.2 + Math.random() * 0.8 : layer === 1 ? 0.6 + Math.random() * 0.5 : 0.3 + Math.random() * 0.3,
        vx: (Math.random() - 0.5) * (layer === 2 ? 0.15 : 0.05),
        vy: (Math.random() - 0.5) * (layer === 2 ? 0.1 : 0.03),
        layer,
        phase: Math.random() * Math.PI * 2,
        speed: 0.8 + Math.random() * 1.5,
      };
    });

    const animate = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      const time = t * 0.001;

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;

        const twinkle = 0.15 + 0.85 * Math.pow((Math.sin(time * p.speed + p.phase) + 1) / 2, 0.5);
        const alpha = p.layer === 2 ? twinkle * 0.7 : p.layer === 1 ? twinkle * 0.35 : twinkle * 0.15;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
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

/* ═══════════════════════════════════════════
   SLIDE CONFIG
   ═══════════════════════════════════════════ */

interface SlideConfig {
  id: string;
  accentColor: string;
  accentGlow: string;
}

const SLIDES: SlideConfig[] = [
  { id: 'training',  accentColor: '#60A5FA',  accentGlow: '#3B82F6' },
  { id: 'ai',        accentColor: '#67E8F9',  accentGlow: '#22D3EE' },
  { id: 'nutrition',  accentColor: '#34D399',  accentGlow: '#10B981' },
  { id: 'progress',  accentColor: '#A78BFA',  accentGlow: '#8B5CF6' },
  { id: 'start',     accentColor: '#ffffff',  accentGlow: '#ffffff' },
];

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */

interface CinematicOnboardingProps {
  onComplete: () => void;
}

export const CinematicOnboarding = ({ onComplete }: CinematicOnboardingProps) => {
  const [showSplash, setShowSplash] = useState(true);
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const touchStartX = useRef(0);
  const progressRef = useRef<HTMLDivElement>(null);

  const slide = SLIDES[current];

  useEffect(() => {
    if (!progressRef.current) return;
    const pct = ((current + 1) / SLIDES.length) * 100;
    gsap.to(progressRef.current, { width: `${pct}%`, duration: 0.7, ease: 'power3.out' });
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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev]);

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) { diff > 0 ? next() : prev(); }
  };

  const ease = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];
  const slideVariants = useMemo(() => ({
    enter: (dir: number) => ({
      opacity: 0,
      scale: 0.94,
      x: dir > 0 ? '8%' : '-8%',
      filter: 'blur(8px)',
    }),
    center: {
      opacity: 1,
      scale: 1,
      x: 0,
      filter: 'blur(0px)',
      transition: { duration: 0.7, ease },
    },
    exit: (dir: number) => ({
      opacity: 0,
      scale: 0.96,
      x: dir > 0 ? '-6%' : '6%',
      filter: 'blur(6px)',
      transition: { duration: 0.45, ease },
    }),
  }), []);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <div
      className="fixed inset-0 z-[200] overflow-hidden bg-black"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Particle field */}
      <ParticleField accentColor={slide.accentColor} />

      {/* Ambient radial glow — per-slide accent */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-[2]"
        animate={{
          background: `radial-gradient(ellipse 50% 40% at 50% 38%, ${slide.accentGlow}0A 0%, transparent 70%)`,
        }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />

      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-white/[0.04] z-50">
        <div
          ref={progressRef}
          className="h-full transition-none"
          style={{
            width: `${((current + 1) / SLIDES.length) * 100}%`,
            background: `linear-gradient(90deg, ${slide.accentColor}60, ${slide.accentColor})`,
          }}
        />
      </div>

      {/* Dot indicators — morphing */}
      <div className="absolute top-7 left-1/2 -translate-x-1/2 flex gap-[6px] z-50">
        {SLIDES.map((s, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className="relative flex items-center justify-center"
            aria-label={`Go to slide ${i + 1}`}
          >
            <motion.div
              className="rounded-full"
              animate={{
                width: i === current ? 20 : 5,
                height: 5,
                backgroundColor: i === current ? slide.accentColor : 'rgba(255,255,255,0.15)',
              }}
              transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            />
          </button>
        ))}
      </div>

      {/* Skip */}
      <button
        onClick={onComplete}
        className="absolute top-6 right-5 z-50 text-[10px] tracking-[0.18em] uppercase font-medium transition-colors duration-300"
        style={{ color: 'rgba(255,255,255,0.2)' }}
        onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.2)')}
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
          className="absolute inset-0 flex flex-col items-center justify-center px-7"
        >
          {current === 0 && <WelcomeSlide />}
          {current === 1 && <TrainingSlide accent={slide.accentColor} />}
          {current === 2 && <AISlide accent={slide.accentColor} />}
          {current === 3 && <NutritionSlide accent={slide.accentColor} />}
          {current === 4 && <ProgressSlide accent={slide.accentColor} />}
          {current === 5 && <StartSlide onStart={onComplete} />}
        </motion.div>
      </AnimatePresence>

      {/* Navigation arrows — refined */}
      {current > 0 && (
        <button
          onClick={prev}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-50 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 active:scale-90"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 3L5 7L9 11" />
          </svg>
        </button>
      )}
      {current < SLIDES.length - 1 && (
        <button
          onClick={next}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-50 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 active:scale-90"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 3L9 7L5 11" />
          </svg>
        </button>
      )}

      {/* Swipe hint — first slide only */}
      {current === 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3, duration: 1 }}
          className="absolute bottom-7 left-1/2 -translate-x-1/2 text-[9px] tracking-[0.25em] uppercase z-50"
          style={{ color: 'rgba(255,255,255,0.12)' }}
        >
          Desliza para continuar
        </motion.p>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════
   SLIDE 0 — WELCOME
   ═══════════════════════════════════════════ */

const WelcomeSlide = () => (
  <div className="flex flex-col items-center gap-8">
    {/* Hero visual: particle convergence forming NEO */}
    <WelcomeLogo />

    {/* Subtitle — enters after particles settle (~2.8s) */}
    <div className="flex flex-col items-center gap-5 mt-1">
      <TextReveal
        text="El rendimiento, rediseñado."
        className="text-[18px] md:text-[21px] tracking-[0.05em] text-center font-medium"
        style_color="rgba(255,255,255,0.5)"
        delay={2.8}
      />
      <SubtitleReveal
        text="PLANIFICACIÓN. EJECUCIÓN. EVOLUCIÓN."
        className="text-[11px] tracking-[0.22em] uppercase text-center font-semibold"
        delay={3.6}
      />
    </div>
  </div>
);

/* ═══════════════════════════════════════════
   SLIDE 1 — TRAINING
   ═══════════════════════════════════════════ */

const TrainingSlide = ({ accent }: { accent: string }) => (
  <div className="flex flex-col items-center gap-5">
    <TrainingHeroVisual accentColor={accent} />
    <div className="flex flex-col items-center gap-3 -mt-1">
      <TextReveal
        text="Precisión absoluta"
        as="h1"
        className="text-[34px] md:text-[44px] font-bold tracking-[-0.04em] text-center leading-[1.05]"
        style_color="#F5F5F7"
        delay={2.6}
      />
      <SubtitleReveal
        text="Periodización avanzada, autorregulación inteligente y control total de cada serie, cada sesión, cada microciclo."
        className="text-[13px] md:text-[15px] text-center max-w-[300px] leading-[1.7] tracking-[0.01em]"
        delay={3.2}
      />
    </div>
    <FeaturePills items={['Periodización', 'Autorregulación', 'Microciclos']} delay={3.8} color={accent} />
  </div>
);

/* ═══════════════════════════════════════════
   SLIDE 2 — AI
   ═══════════════════════════════════════════ */

const AISlide = ({ accent }: { accent: string }) => (
  <div className="flex flex-col items-center gap-5">
    <AIHeroVisual accentColor={accent} />
    <div className="flex flex-col items-center gap-3 -mt-1">
      <TextReveal
        text="Inteligencia que aprende"
        as="h1"
        className="text-[34px] md:text-[44px] font-bold tracking-[-0.04em] text-center leading-[1.05]"
        style_color="#F5F5F7"
        delay={2.8}
      />
      <SubtitleReveal
        text="NEO analiza fatiga, sueño y rendimiento para ajustar cada sesión antes de que empieces."
        className="text-[13px] md:text-[15px] text-center max-w-[300px] leading-[1.7] tracking-[0.01em]"
        delay={3.4}
      />
    </div>
    <FeaturePills items={['IA Adaptativa', 'Check-in', 'Predicciones']} delay={4.0} color={accent} />
  </div>
);

/* ═══════════════════════════════════════════
   SLIDE 3 — NUTRITION
   ═══════════════════════════════════════════ */

const NutritionSlide = ({ accent }: { accent: string }) => (
  <div className="flex flex-col items-center gap-5">
    <NutritionHeroVisual accentColor={accent} />
    <div className="flex flex-col items-center gap-3 -mt-1">
      <TextReveal
        text="Nutrición sincronizada"
        as="h1"
        className="text-[34px] md:text-[44px] font-bold tracking-[-0.04em] text-center leading-[1.05]"
        style_color="#F5F5F7"
        delay={2.8}
      />
      <SubtitleReveal
        text="Macros, suplementación y comidas integradas con tu entrenamiento. Todo conectado."
        className="text-[13px] md:text-[15px] text-center max-w-[300px] leading-[1.7] tracking-[0.01em]"
        delay={3.4}
      />
    </div>
    <FeaturePills items={['Macros', 'Suplementos', 'Recetas']} delay={4.0} color={accent} />
  </div>
);

/* ═══════════════════════════════════════════
   SLIDE 4 — PROGRESS
   ═══════════════════════════════════════════ */

const ProgressSlide = ({ accent }: { accent: string }) => (
  <div className="flex flex-col items-center gap-5">
    <ProgressHeroVisual accentColor={accent} />
    <div className="flex flex-col items-center gap-3 -mt-1">
      <TextReveal
        text="Mide tu evolución"
        as="h1"
        className="text-[34px] md:text-[44px] font-bold tracking-[-0.04em] text-center leading-[1.05]"
        style_color="#F5F5F7"
        delay={2.8}
      />
      <SubtitleReveal
        text="Tendencias, alertas de rendimiento y análisis por ejercicio. Datos que te hacen mejor."
        className="text-[13px] md:text-[15px] text-center max-w-[300px] leading-[1.7] tracking-[0.01em]"
        delay={3.4}
      />
    </div>
    <FeaturePills items={['Tendencias', 'Alertas', '1RM estimado']} delay={4.0} color={accent} />
  </div>
);

/* ═══════════════════════════════════════════
   SLIDE 5 — START (CTA)
   ═══════════════════════════════════════════ */

const StartSlide = ({ onStart }: { onStart: () => void }) => {
  const btnRef = useRef<HTMLButtonElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!btnRef.current || !glowRef.current) return;
    const ctx = gsap.context(() => {
      gsap.set(btnRef.current!, { opacity: 0, y: 24, scale: 0.92 });
      gsap.set(glowRef.current!, { opacity: 0, scale: 0.5 });

      const tl = gsap.timeline({ delay: 1.0 });
      tl.to(btnRef.current!, { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: 'power3.out' });
      tl.to(glowRef.current!, { opacity: 0.3, scale: 1, duration: 1.2, ease: 'power2.out' }, 0.3);
      tl.to(glowRef.current!, {
        opacity: 0.15, scale: 1.1, duration: 2.5, ease: 'sine.inOut', repeat: -1, yoyo: true,
      }, '>');
    });
    return () => ctx.revert();
  }, []);

  return (
    <div className="flex flex-col items-center gap-10">
      <ClosingLogo />
      <div className="flex flex-col items-center gap-4">
        <TextReveal
          text="Tu viaje empieza ahora."
          as="h1"
          className="text-[32px] md:text-[40px] font-bold tracking-[-0.03em] text-center leading-[1.08]"
          style_color="#F5F5F7"
          delay={0.3}
        />
        <SubtitleReveal
          text="Entrena más inteligente. Evoluciona sin límites."
          className="text-[14px] md:text-[15px] text-center max-w-[320px] leading-[1.65]"
          delay={0.7}
        />
      </div>
      <div className="relative mt-2">
        <div ref={glowRef} className="absolute inset-[-12px] rounded-3xl bg-white/10 blur-[20px]" />
        <button
          ref={btnRef}
          onClick={onStart}
          className="relative px-10 py-4 rounded-2xl text-[15px] font-semibold tracking-[0.02em] transition-all duration-200 active:scale-[0.97] opacity-0"
          style={{
            background: '#F5F5F7',
            color: '#000',
          }}
        >
          Comenzar
        </button>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════
   FEATURE PILLS — premium chips
   ═══════════════════════════════════════════ */

const FeaturePills = ({ items, delay, color }: { items: string[]; delay: number; color: string }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      const pills = ref.current!.children;
      gsap.fromTo(
        pills,
        { opacity: 0, y: 10, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'power2.out', stagger: 0.1, delay }
      );
    }, ref);
    return () => ctx.revert();
  }, [delay]);

  return (
    <div ref={ref} className="flex gap-2.5 flex-wrap justify-center mt-2">
      {items.map((item) => (
        <span
          key={item}
          className="px-3.5 py-1.5 rounded-full text-[10px] tracking-[0.12em] uppercase font-semibold opacity-0"
          style={{
            color,
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: `${color}25`,
            backgroundColor: `${color}08`,
          }}
        >
          {item}
        </span>
      ))}
    </div>
  );
};
