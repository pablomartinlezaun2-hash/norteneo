import { useRef, useEffect } from 'react';
import gsap from 'gsap';

/* ═══════════════════════════════════════════════════════
   SVG ICON DATA
   ═══════════════════════════════════════════════════════ */

interface IconDef {
  viewBox: string;
  paths: string[];
}

const ICONS: Record<string, IconDef> = {
  barbell: {
    viewBox: '0 0 64 64',
    paths: [
      // Left plate
      'M14 18v28',
      'M10 22v20',
      // Bar
      'M14 32h36',
      // Right plate
      'M50 18v28',
      'M54 22v20',
    ],
  },
  network: {
    viewBox: '0 0 64 64',
    paths: [
      // Connecting lines first (behind nodes)
      'M32 14L18 28', 'M32 14L46 28',
      'M18 28L28 44', 'M46 28L36 44',
      'M18 28L46 28', 'M28 44L36 44',
      'M32 14L32 8',
      'M28 44L24 52', 'M36 44L40 52',
    ],
  },
  utensils: {
    viewBox: '0 0 64 64',
    paths: [
      // Fork
      'M22 12v14c0 3.3 2.7 6 6 6v20',
      'M22 12v10', 'M28 12v10',
      // Knife
      'M42 12c-4 0-8 6-8 14h8v22',
    ],
  },
  chart: {
    viewBox: '0 0 64 64',
    paths: [
      'M8 52L20 40L30 44L42 28L56 16',
    ],
  },
};

/* ═══════════════════════════════════════════════════════
   STROKE-DRAW ICON
   ═══════════════════════════════════════════════════════ */

interface StrokeIconProps {
  iconKey: string;
  glowColor: string;
}

export const StrokeIcon = ({ iconKey, glowColor }: StrokeIconProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const ctx = gsap.context(() => {
      const paths = svgRef.current!.querySelectorAll('path');
      const glow = containerRef.current!.querySelector('.icon-glow') as HTMLElement;

      // Set initial stroke state
      paths.forEach(p => {
        const len = p.getTotalLength();
        gsap.set(p, { strokeDasharray: len, strokeDashoffset: len, opacity: 1 });
      });
      if (glow) gsap.set(glow, { opacity: 0, scale: 0.6 });

      const tl = gsap.timeline({ delay: 0.25 });

      // Draw strokes sequentially
      paths.forEach((p, i) => {
        tl.to(p, {
          strokeDashoffset: 0,
          duration: 0.55,
          ease: 'power2.inOut',
        }, i * 0.1);
      });

      // Glow reveal
      if (glow) {
        tl.to(glow, {
          opacity: 1,
          scale: 1,
          duration: 1,
          ease: 'power2.out',
        }, 0.3);
      }

      // Subtle breathing
      tl.to(svgRef.current!, {
        y: -2.5,
        duration: 2.4,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      }, '>-0.4');
    }, containerRef);

    return () => ctx.revert();
  }, [iconKey]);

  const icon = ICONS[iconKey];
  if (!icon) return null;

  return (
    <div ref={containerRef} className="relative w-[104px] h-[104px] flex items-center justify-center">
      {/* Glow */}
      <div
        className="icon-glow absolute inset-[-16px] rounded-[40px] blur-[28px]"
        style={{ backgroundColor: glowColor }}
      />
      {/* Icon container */}
      <div className="relative w-full h-full rounded-[28px] bg-[#ffffff05] border border-[#ffffff08] flex items-center justify-center backdrop-blur-[0.5px]">
        <svg
          ref={svgRef}
          viewBox={icon.viewBox}
          className="w-10 h-10"
          fill="none"
          stroke="#F5F5F7"
          strokeWidth="1.8"
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

/* ═══════════════════════════════════════════════════════
   NETWORK NODES (Algorithm slide overlay)
   ═══════════════════════════════════════════════════════ */

export const NetworkNodes = () => {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const ctx = gsap.context(() => {
      const circles = ref.current!.querySelectorAll('circle');
      gsap.set(circles, { opacity: 0, scale: 0 });

      const tl = gsap.timeline({ delay: 0.8 });
      circles.forEach((c, i) => {
        tl.to(c, {
          opacity: 0.35,
          scale: 1,
          duration: 0.5,
          ease: 'power2.out',
          transformOrigin: 'center center',
        }, i * 0.06);
      });
    }, ref);

    return () => ctx.revert();
  }, []);

  return (
    <svg ref={ref} viewBox="0 0 64 64" className="absolute inset-0 w-full h-full pointer-events-none">
      <circle cx="32" cy="14" r="2.5" fill="#A5F3FC" />
      <circle cx="18" cy="28" r="2" fill="#A5F3FC" />
      <circle cx="46" cy="28" r="2" fill="#A5F3FC" />
      <circle cx="28" cy="44" r="2" fill="#A5F3FC" />
      <circle cx="36" cy="44" r="2" fill="#A5F3FC" />
      <circle cx="32" cy="8" r="1.5" fill="#A5F3FC" />
      <circle cx="24" cy="52" r="1.5" fill="#A5F3FC" />
      <circle cx="40" cy="52" r="1.5" fill="#A5F3FC" />
    </svg>
  );
};

/* ═══════════════════════════════════════════════════════
   CHART END DOT (Progress slide)
   ═══════════════════════════════════════════════════════ */

export const ChartEndDot = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const ctx = gsap.context(() => {
      gsap.set(ref.current!, { opacity: 0, scale: 0 });
      gsap.to(ref.current!, {
        opacity: 1,
        scale: 1,
        duration: 0.5,
        delay: 1.1,
        ease: 'power2.out',
      });
      // Micro pulse
      gsap.to(ref.current!, {
        scale: 1.15,
        opacity: 0.7,
        duration: 1.8,
        delay: 1.6,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      });
    }, ref);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={ref}
      className="absolute"
      style={{ top: '22%', right: '16%', width: 6, height: 6, borderRadius: '50%', background: '#C4B5FD' }}
    />
  );
};

/* ═══════════════════════════════════════════════════════
   TEXT REVEAL (mask-based)
   ═══════════════════════════════════════════════════════ */

interface TextRevealProps {
  text: string;
  className?: string;
  delay?: number;
  as?: 'h1' | 'p';
  style_color?: string;
}

export const TextReveal = ({ text, className, delay = 0, as = 'p', style_color }: TextRevealProps) => {
  const maskRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!maskRef.current || !innerRef.current) return;

    const ctx = gsap.context(() => {
      gsap.set(maskRef.current!, { clipPath: 'inset(0 100% 0 0)' });
      gsap.set(innerRef.current!, { opacity: 0 });

      const tl = gsap.timeline({ delay });
      tl.to(innerRef.current!, { opacity: 1, duration: 0.01 }, 0);
      tl.to(maskRef.current!, {
        clipPath: 'inset(0 0% 0 0)',
        duration: 0.7,
        ease: 'power3.inOut',
      }, 0);
    }, maskRef);

    return () => ctx.revert();
  }, [delay, text]);

  const Tag = as;

  return (
    <div ref={maskRef} style={{ clipPath: 'inset(0 100% 0 0)' }}>
      <div ref={innerRef} style={{ opacity: 0 }}>
        {Tag === 'h1' ? (
          <h1 className={className} style={style_color ? { color: style_color } : undefined}>{text}</h1>
        ) : (
          <p className={className} style={style_color ? { color: style_color } : undefined}>{text}</p>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   SUBTITLE REVEAL (fade + translateY)
   ═══════════════════════════════════════════════════════ */

interface SubtitleRevealProps {
  text: string;
  className?: string;
  delay?: number;
}

export const SubtitleReveal = ({ text, className, delay = 0 }: SubtitleRevealProps) => {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(ref.current!,
        { opacity: 0, y: 10, filter: 'blur(4px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.65, delay, ease: 'power3.out' }
      );
    }, ref);

    return () => ctx.revert();
  }, [delay, text]);

  return <p ref={ref} className={className} style={{ opacity: 0, color: '#8E8E93' }}>{text}</p>;
};

/* ═══════════════════════════════════════════════════════
   WELCOME LOGO (laser reveal)
   ═══════════════════════════════════════════════════════ */

export const WelcomeLogo = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      const laser = containerRef.current!.querySelector('.laser') as HTMLElement;
      const logoMask = containerRef.current!.querySelector('.logo-mask') as HTMLElement;
      const logoInner = containerRef.current!.querySelector('.logo-inner') as HTMLElement;
      const glow = containerRef.current!.querySelector('.logo-glow') as HTMLElement;

      gsap.set(laser, { scaleX: 0, transformOrigin: 'left center' });
      gsap.set(logoMask, { clipPath: 'inset(0 100% 0 0)' });
      gsap.set(logoInner, { opacity: 0 });
      gsap.set(glow, { opacity: 0, scale: 0.8 });

      const tl = gsap.timeline({ delay: 0.4 });

      // Laser draws
      tl.to(laser, { scaleX: 1, duration: 1.2, ease: 'power3.inOut' });

      // Logo reveals
      tl.to(logoInner, { opacity: 1, duration: 0.01 }, 0.5);
      tl.to(logoMask, {
        clipPath: 'inset(0 0% 0 0)',
        duration: 0.8,
        ease: 'power3.inOut',
      }, 0.5);

      // Laser fades
      tl.to(laser, { opacity: 0, duration: 0.5 }, 1.1);

      // Glow breathes in
      tl.to(glow, {
        opacity: 1,
        scale: 1,
        duration: 1.4,
        ease: 'power2.out',
      }, 1.0);

      // Subtle glow breathing
      tl.to(glow, {
        opacity: 0.6,
        scale: 1.02,
        duration: 2.8,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      }, '>');
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="flex flex-col items-center">
      {/* Laser line */}
      <div className="laser absolute w-44 h-[1px] bg-gradient-to-r from-transparent via-[#F5F5F7] to-transparent top-1/2 -translate-y-1/2" />

      {/* Logo */}
      <div className="relative mb-12">
        <div className="logo-glow absolute inset-[-20px] rounded-[32px] bg-[#ffffff0a] blur-[24px]" />
        <div className="logo-mask">
          <div className="logo-inner bg-[#F5F5F7] rounded-[20px] px-10 py-5">
            <span className="text-[42px] font-bold tracking-[0.04em] text-black select-none leading-none">
              NEO
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   CLOSING LOGO (authoritative entrance)
   ═══════════════════════════════════════════════════════ */

export const ClosingLogo = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const ctx = gsap.context(() => {
      const logo = ref.current!.querySelector('.closing-logo') as HTMLElement;
      const glow = ref.current!.querySelector('.closing-glow') as HTMLElement;

      gsap.set(logo, { opacity: 0, scale: 0.92, filter: 'blur(6px)' });
      gsap.set(glow, { opacity: 0, scale: 0.7 });

      const tl = gsap.timeline({ delay: 0.15 });

      tl.to(logo, {
        opacity: 1,
        scale: 1,
        filter: 'blur(0px)',
        duration: 0.9,
        ease: 'power2.out',
      });

      tl.to(glow, {
        opacity: 0.8,
        scale: 1,
        duration: 1.2,
        ease: 'power2.out',
      }, 0.2);

      // Gentle glow breathing
      tl.to(glow, {
        opacity: 0.5,
        scale: 1.015,
        duration: 3,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      }, '>');
    }, ref);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} className="relative mb-12">
      <div className="closing-glow absolute inset-[-24px] rounded-[32px] bg-[#ffffff08] blur-[28px]" />
      <div className="closing-logo bg-[#F5F5F7] rounded-[20px] px-10 py-5">
        <span className="text-[42px] font-bold tracking-[0.04em] text-black select-none leading-none">
          NEO
        </span>
      </div>
    </div>
  );
};
