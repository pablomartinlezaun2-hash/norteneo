import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import gsap from 'gsap';

interface NeoAssistantProps {
  onComplete: () => void;
  onSkip: () => void;
}

/* ─── SVG icon paths (stroke-drawable) ─── */
const ICON_PATHS: Record<string, { viewBox: string; paths: string[] }> = {
  dumbbell: {
    viewBox: '0 0 24 24',
    paths: [
      'M6.5 6.5h-2a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1z',
      'M17.5 6.5h2a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1z',
      'M7.5 12h9',
      'M2 9.5h1.5', 'M2 14.5h1.5',
      'M20.5 9.5H22', 'M20.5 14.5H22',
    ],
  },
  zap: {
    viewBox: '0 0 24 24',
    paths: ['M13 2L3 14h9l-1 8 10-12h-9l1-8z'],
  },
  utensils: {
    viewBox: '0 0 24 24',
    paths: [
      'M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2',
      'M7 2v20',
      'M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3',
      'M18 22v-7',
    ],
  },
  chart: {
    viewBox: '0 0 24 24',
    paths: [
      'M22 12h-4l-3 9L9 3l-3 9H2',
    ],
  },
};

interface Slide {
  id: number;
  headline: string;
  sub: string;
  iconKey?: string;
  glowColor?: string;
  isWelcome?: boolean;
}

const SLIDES: Slide[] = [
  { id: 0, headline: 'NEO', sub: 'El rendimiento, rediseñado.', isWelcome: true },
  { id: 1, headline: 'Entrena con precisión', sub: 'Seguimiento real de series, cargas y fatiga.', iconKey: 'dumbbell', glowColor: 'rgba(34,211,238,0.15)' },
  { id: 2, headline: 'Diseño inteligente', sub: 'Rutinas generadas por nuestro algoritmo.', iconKey: 'zap', glowColor: 'rgba(251,191,36,0.15)' },
  { id: 3, headline: 'Nutrición dinámica', sub: 'Ajuste automático según tu carga de entrenamiento.', iconKey: 'utensils', glowColor: 'rgba(52,211,153,0.12)' },
  { id: 4, headline: 'Progreso real', sub: 'Gráficas y análisis del rendimiento.', iconKey: 'chart', glowColor: 'rgba(167,139,250,0.15)' },
];

/* ─── Stroke-draw icon component ─── */
const StrokeIcon = ({ iconKey, glowColor }: { iconKey: string; glowColor: string }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const icon = ICON_PATHS[iconKey];

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;
    const paths = svgRef.current.querySelectorAll('path');
    const glow = containerRef.current.querySelector('.icon-glow') as HTMLElement;

    // Set initial state
    paths.forEach(p => {
      const len = p.getTotalLength();
      gsap.set(p, { strokeDasharray: len, strokeDashoffset: len, opacity: 1 });
    });
    if (glow) gsap.set(glow, { opacity: 0, scale: 0.5 });

    const tl = gsap.timeline({ delay: 0.3 });

    // Draw each path
    paths.forEach((p, i) => {
      const len = p.getTotalLength();
      tl.to(p, { strokeDashoffset: 0, duration: 0.6, ease: 'power2.inOut' }, i * 0.12);
    });

    // Glow reveal
    if (glow) {
      tl.to(glow, { opacity: 1, scale: 1, duration: 0.8, ease: 'power2.out' }, 0.2);
    }

    // Breathing
    tl.to(svgRef.current, {
      y: -4, duration: 2, ease: 'sine.inOut', repeat: -1, yoyo: true,
    }, '>-0.3');

    return () => { tl.kill(); };
  }, [iconKey]);

  if (!icon) return null;

  return (
    <div ref={containerRef} className="relative w-28 h-28 flex items-center justify-center">
      {/* Glow */}
      <div
        className="icon-glow absolute inset-0 rounded-[32px] blur-2xl"
        style={{ backgroundColor: glowColor }}
      />
      {/* Border container */}
      <div className="relative w-full h-full rounded-[32px] bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
        <svg
          ref={svgRef}
          viewBox={icon.viewBox}
          className="w-12 h-12"
          fill="none"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {icon.paths.map((d, i) => (
            <path key={i} d={d} opacity="0" />
          ))}
        </svg>
      </div>
    </div>
  );
};

/* ─── Welcome logo with laser-reveal ─── */
const WelcomeLogo = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const laser = containerRef.current.querySelector('.laser-line') as HTMLElement;
    const logo = containerRef.current.querySelector('.logo-text') as HTMLElement;
    const glow = containerRef.current.querySelector('.logo-glow') as HTMLElement;
    const subtitle = containerRef.current.querySelector('.subtitle') as HTMLElement;
    const mask = containerRef.current.querySelector('.logo-mask') as HTMLElement;

    gsap.set([logo, glow, subtitle], { opacity: 0 });
    gsap.set(laser, { scaleX: 0, transformOrigin: 'left center' });
    gsap.set(mask, { clipPath: 'inset(0 100% 0 0)' });

    const tl = gsap.timeline();

    // Laser draws across
    tl.to(laser, { scaleX: 1, duration: 0.8, ease: 'power3.inOut' });

    // Logo reveals behind mask
    tl.to(mask, { clipPath: 'inset(0 0% 0 0)', duration: 0.7, ease: 'power3.inOut' }, 0.4);
    tl.to(logo, { opacity: 1, duration: 0.01 }, 0.4);

    // Laser fades
    tl.to(laser, { opacity: 0, duration: 0.4 }, 0.9);

    // Glow appears
    tl.fromTo(glow,
      { opacity: 0, scale: 0.7 },
      { opacity: 1, scale: 1, duration: 1.2, ease: 'power2.out' },
      1.0
    );

    // Subtitle reveal
    tl.fromTo(subtitle,
      { opacity: 0, y: 16, filter: 'blur(8px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.8, ease: 'power3.out' },
      1.3
    );

    return () => { tl.kill(); };
  }, []);

  return (
    <div ref={containerRef} className="flex flex-col items-center">
      {/* Laser line */}
      <div className="laser-line absolute w-40 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent top-1/2 -translate-y-1/2" />

      {/* Logo container */}
      <div className="relative mb-10">
        <div className="logo-glow absolute inset-0 rounded-3xl bg-white/8 blur-2xl" />
        <div className="logo-mask relative">
          <div className="logo-text relative bg-white rounded-3xl px-10 py-6">
            <span className="text-5xl font-bold tracking-tight text-black select-none">NEO</span>
          </div>
        </div>
      </div>

      {/* Subtitle */}
      <p className="subtitle text-[20px] text-white/40 font-light tracking-[0.04em] text-center">
        El rendimiento, rediseñado.
      </p>
    </div>
  );
};

/* ─── Text reveal component ─── */
const RevealText = ({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(ref.current,
      { opacity: 0, y: 20, filter: 'blur(10px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.7, delay, ease: 'power3.out' }
    );
  }, [delay]);

  return <div ref={ref} className={className} style={{ opacity: 0 }}>{text}</div>;
};

/* ─── Main component ─── */
export const NeoAssistant = ({ onComplete, onSkip }: NeoAssistantProps) => {
  const [current, setCurrent] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isAnimating = useRef(false);
  const touchStartX = useRef(0);

  const slide = SLIDES[current];
  const isLast = current === SLIDES.length - 1;
  const isFirst = current === 0;

  const transitionTo = useCallback((next: number) => {
    if (isAnimating.current || !contentRef.current) return;
    if (next < 0 || next >= SLIDES.length) {
      if (next >= SLIDES.length) onComplete();
      return;
    }
    isAnimating.current = true;

    const tl = gsap.timeline({
      onComplete: () => {
        setCurrent(next);
        isAnimating.current = false;
      },
    });

    // Exit: fade + blur + slight shift
    tl.to(contentRef.current, {
      opacity: 0,
      y: -20,
      filter: 'blur(6px)',
      duration: 0.35,
      ease: 'power2.in',
    });
  }, [onComplete]);

  // Entrance animation after state change
  useEffect(() => {
    if (!contentRef.current) return;
    // Skip welcome slide (has its own animation)
    if (SLIDES[current].isWelcome) return;

    gsap.fromTo(contentRef.current,
      { opacity: 0, y: 30, filter: 'blur(8px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.5, ease: 'power3.out', delay: 0.05 }
    );
  }, [current]);

  const goNext = useCallback(() => transitionTo(current + 1), [current, transitionTo]);
  const goPrev = useCallback(() => transitionTo(current - 1), [current, transitionTo]);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev]);

  // Touch
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) { diff > 0 ? goNext() : goPrev(); }
  };

  // Dot indicator animation
  const dotsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!dotsRef.current) return;
    const dots = dotsRef.current.children;
    Array.from(dots).forEach((dot, i) => {
      gsap.to(dot, {
        width: i === current ? 24 : 5,
        backgroundColor: i === current ? '#ffffff' : 'rgba(255,255,255,0.12)',
        duration: 0.4,
        ease: 'power2.inOut',
      });
    });
  }, [current]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black flex flex-col z-50 select-none overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Skip */}
      {!isLast && (
        <div className="flex justify-end px-6 pt-6 relative z-10">
          <button
            onClick={onSkip}
            className="text-[13px] text-white/20 hover:text-white/50 transition-colors duration-300 tracking-widest uppercase"
          >
            Saltar
          </button>
        </div>
      )}
      {isLast && <div className="pt-6" />}

      {/* Content */}
      <div className="flex-1 flex items-center justify-center relative">
        <div ref={contentRef} className="flex flex-col items-center justify-center px-8 w-full max-w-md">
          {slide.isWelcome ? (
            <WelcomeLogo key="welcome" />
          ) : (
            <>
              <div className="mb-14">
                <StrokeIcon
                  key={slide.iconKey!}
                  iconKey={slide.iconKey!}
                  glowColor={slide.glowColor || 'transparent'}
                />
              </div>
              <div className="text-center space-y-5">
                <RevealText
                  key={`h-${slide.id}`}
                  text={slide.headline}
                  className="text-[30px] font-semibold text-white leading-tight tracking-tight"
                  delay={0.35}
                />
                <RevealText
                  key={`s-${slide.id}`}
                  text={slide.sub}
                  className="text-[16px] text-white/35 leading-relaxed font-light tracking-wide"
                  delay={0.55}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom controls */}
      <div className="flex flex-col items-center gap-8 pb-12 px-8 relative z-10">
        {/* Dots */}
        <div ref={dotsRef} className="flex gap-2">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className="h-[4px] rounded-full"
              style={{
                width: i === current ? 24 : 5,
                backgroundColor: i === current ? '#ffffff' : 'rgba(255,255,255,0.12)',
              }}
            />
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={goNext}
          className={cn(
            "h-14 rounded-full font-medium text-[15px] flex items-center justify-center gap-2 transition-all duration-500 tracking-wide",
            isLast
              ? "w-full max-w-xs bg-white text-black"
              : "px-12 bg-white/90 text-black hover:bg-white"
          )}
        >
          {isLast ? 'Empezar' : 'Siguiente'}
        </button>
      </div>
    </div>
  );
};
