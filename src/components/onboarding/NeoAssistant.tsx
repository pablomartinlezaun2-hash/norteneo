import { useState, useRef, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import {
  WelcomeLogo,
  ClosingLogo,
  StrokeIcon,
  NetworkNodes,
  ChartEndDot,
  TextReveal,
  SubtitleReveal,
} from './OnboardingVisuals';

/* ═══════════════════════════════════════════════════════
   SLIDE DATA
   ═══════════════════════════════════════════════════════ */

interface Slide {
  id: number;
  type: 'welcome' | 'feature' | 'closing';
  headline: string;
  sub: string;
  iconKey?: string;
  glowColor?: string;
  hasNodes?: boolean;
  hasEndDot?: boolean;
}

const SLIDES: Slide[] = [
  {
    id: 0,
    type: 'welcome',
    headline: 'El rendimiento, rediseñado.',
    sub: '',
  },
  {
    id: 1,
    type: 'feature',
    headline: 'Entrena con precisión',
    sub: 'Seguimiento real de series, cargas y fatiga.',
    iconKey: 'barbell',
    glowColor: 'rgba(59,130,246,0.08)',
  },
  {
    id: 2,
    type: 'feature',
    headline: 'Un algoritmo diferente',
    sub: 'NEO interpreta fuerza, running y natación dentro de una sola lógica.',
    iconKey: 'network',
    glowColor: 'rgba(165,243,252,0.06)',
    hasNodes: true,
  },
  {
    id: 3,
    type: 'feature',
    headline: 'Nutrición dinámica',
    sub: 'Ajuste automático según tu carga de entrenamiento.',
    iconKey: 'utensils',
    glowColor: 'rgba(45,212,191,0.07)',
  },
  {
    id: 4,
    type: 'feature',
    headline: 'Visualiza tu evolución',
    sub: 'Gráficas y análisis del rendimiento.',
    iconKey: 'chart',
    glowColor: 'rgba(196,181,253,0.08)',
    hasEndDot: true,
  },
  {
    id: 5,
    type: 'closing',
    headline: 'Bienvenido a NEO',
    sub: 'Tu rendimiento empieza ahora.',
  },
];

/* ═══════════════════════════════════════════════════════
   PROPS
   ═══════════════════════════════════════════════════════ */

interface NeoAssistantProps {
  onComplete: () => void;
  onSkip: () => void;
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */

export const NeoAssistant = ({ onComplete, onSkip }: NeoAssistantProps) => {
  const [current, setCurrent] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const isAnimating = useRef(false);
  const touchStartX = useRef(0);
  const exitCtx = useRef<gsap.Context | null>(null);

  const slide = SLIDES[current];
  const isLast = current === SLIDES.length - 1;

  /* ─── Transition logic ─── */

  const transitionTo = useCallback((next: number) => {
    if (isAnimating.current || !contentRef.current) return;
    if (next < 0 || next >= SLIDES.length) {
      if (next >= SLIDES.length) {
        // Exit transition
        isAnimating.current = true;
        const tl = gsap.timeline({
          onComplete: () => onComplete(),
        });
        tl.to(contentRef.current, {
          opacity: 0,
          scale: 0.985,
          filter: 'blur(8px)',
          duration: 0.6,
          ease: 'power2.in',
        });
        if (dotsRef.current) {
          tl.to(dotsRef.current, { opacity: 0, duration: 0.3 }, 0);
        }
        if (btnRef.current) {
          tl.to(btnRef.current, { opacity: 0, y: 10, duration: 0.3 }, 0);
        }
      }
      return;
    }

    isAnimating.current = true;

    exitCtx.current = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          exitCtx.current?.revert();
          setCurrent(next);
          isAnimating.current = false;
        },
      });

      // Exit: content fades + slight up + blur
      tl.to(contentRef.current!, {
        opacity: 0,
        y: -14,
        filter: 'blur(6px)',
        duration: 0.4,
        ease: 'power2.in',
      });
    });
  }, [onComplete]);

  /* ─── Entrance animation on slide change ─── */

  useEffect(() => {
    if (!contentRef.current) return;

    // Welcome and closing have internal animations
    if (slide.type === 'welcome') {
      gsap.set(contentRef.current, { opacity: 1, y: 0, filter: 'blur(0px)' });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(contentRef.current!,
        { opacity: 0, y: 16, filter: 'blur(6px)' },
        {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 0.55,
          ease: 'power3.out',
          delay: 0.08,
        }
      );
    });

    return () => ctx.revert();
  }, [current, slide.type]);

  /* ─── Button entrance ─── */

  useEffect(() => {
    if (!btnRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(btnRef.current!,
        { opacity: 0, y: 12 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power2.out',
          delay: slide.type === 'welcome' ? 2.6 : 0.9,
        }
      );
    });
    return () => ctx.revert();
  }, [current, slide.type]);

  /* ─── Dots animation ─── */

  useEffect(() => {
    if (!dotsRef.current) return;
    const dots = dotsRef.current.children;
    Array.from(dots).forEach((dot, i) => {
      gsap.to(dot, {
        width: i === current ? 20 : 4,
        backgroundColor: i === current ? '#F5F5F7' : '#3A3A3C',
        duration: 0.45,
        ease: 'power2.inOut',
      });
    });
  }, [current]);

  /* ─── Navigation helpers ─── */

  const goNext = useCallback(() => transitionTo(current + 1), [current, transitionTo]);
  const goPrev = useCallback(() => transitionTo(current - 1), [current, transitionTo]);

  /* ─── Keyboard ─── */

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goNext(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev]);

  /* ─── Touch ─── */

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? goNext() : goPrev();
    }
  };

  /* ─── Button tap feedback ─── */

  const handleBtnPress = () => {
    if (!btnRef.current) return;
    gsap.to(btnRef.current, { scale: 0.985, duration: 0.1, ease: 'power2.out' });
  };
  const handleBtnRelease = () => {
    if (!btnRef.current) return;
    gsap.to(btnRef.current, {
      scale: 1,
      duration: 0.25,
      ease: 'power2.out',
      onComplete: goNext,
    });
  };

  /* ─── Render ─── */

  return (
    <div
      className="fixed inset-0 bg-black flex flex-col z-50 select-none overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Skip button */}
      {!isLast && (
        <div className="flex justify-end px-6 pt-6 relative z-10">
          <button
            onClick={onSkip}
            className="text-[12px] tracking-[0.14em] uppercase font-medium transition-colors duration-300"
            style={{ color: '#3A3A3C' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#8E8E93')}
            onMouseLeave={e => (e.currentTarget.style.color = '#3A3A3C')}
          >
            Saltar
          </button>
        </div>
      )}
      {isLast && <div className="h-[52px]" />}

      {/* Content area */}
      <div className="flex-1 flex items-center justify-center relative">
        <div
          ref={contentRef}
          className="flex flex-col items-center justify-center px-8 w-full max-w-md"
        >
          {/* WELCOME SLIDE */}
          {slide.type === 'welcome' && (
            <>
              <WelcomeLogo key="welcome" />
              <div className="mt-2">
                <TextReveal
                  key="welcome-h"
                  text={slide.headline}
                  as="h1"
                  className="text-[18px] font-light tracking-[0.03em] text-center leading-relaxed"
                  style_color="#8E8E93"
                  delay={2.0}
                />
              </div>
            </>
          )}

          {/* FEATURE SLIDES */}
          {slide.type === 'feature' && (
            <>
              <div className="mb-14 relative">
                <StrokeIcon
                  key={`icon-${slide.id}`}
                  iconKey={slide.iconKey!}
                  glowColor={slide.glowColor || 'transparent'}
                />
                {slide.hasNodes && <NetworkNodes key={`nodes-${slide.id}`} />}
                {slide.hasEndDot && <ChartEndDot key={`dot-${slide.id}`} />}
              </div>
              <div className="text-center space-y-4">
                <TextReveal
                  key={`h-${slide.id}`}
                  text={slide.headline}
                  as="h1"
                  className="text-[28px] font-semibold tracking-[-0.01em] leading-tight"
                  style_color="#F5F5F7"
                  delay={0.4}
                />
                <SubtitleReveal
                  key={`s-${slide.id}`}
                  text={slide.sub}
                  className="text-[15px] font-light leading-relaxed tracking-[0.01em] max-w-[280px] mx-auto"
                  delay={0.6}
                />
              </div>
            </>
          )}

          {/* CLOSING SLIDE */}
          {slide.type === 'closing' && (
            <>
              <ClosingLogo key="closing" />
              <div className="text-center space-y-4">
                <TextReveal
                  key="closing-h"
                  text={slide.headline}
                  as="h1"
                  className="text-[28px] font-semibold tracking-[-0.01em] leading-tight"
                  style_color="#F5F5F7"
                  delay={0.55}
                />
                <SubtitleReveal
                  key="closing-s"
                  text={slide.sub}
                  className="text-[15px] font-light leading-relaxed tracking-[0.01em]"
                  delay={0.75}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom controls */}
      <div className="flex flex-col items-center gap-7 pb-12 px-8 relative z-10">
        {/* Dots */}
        <div ref={dotsRef} className="flex gap-[6px]">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className="h-[3px] rounded-full"
              style={{
                width: i === current ? 20 : 4,
                backgroundColor: i === current ? '#F5F5F7' : '#3A3A3C',
                transition: 'none', // GSAP handles this
              }}
            />
          ))}
        </div>

        {/* CTA Button */}
        <button
          ref={btnRef}
          onMouseDown={handleBtnPress}
          onMouseUp={handleBtnRelease}
          onTouchStart={handleBtnPress}
          onTouchEnd={(e) => { e.preventDefault(); handleBtnRelease(); }}
          className="w-full max-w-[280px] h-[52px] rounded-[16px] font-medium text-[15px] tracking-[0.02em] flex items-center justify-center"
          style={{
            backgroundColor: '#F5F5F7',
            color: '#000000',
            opacity: 0,
          }}
        >
          {isLast ? 'Empezar' : 'Siguiente'}
        </button>
      </div>
    </div>
  );
};
