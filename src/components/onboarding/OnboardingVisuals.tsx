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
      'M14 18v28',
      'M10 22v20',
      'M14 32h36',
      'M50 18v28',
      'M54 22v20',
    ],
  },
  network: {
    viewBox: '0 0 64 64',
    paths: [],
  },
  utensils: {
    viewBox: '0 0 64 64',
    paths: [],
  },
  chart: {
    viewBox: '0 0 64 64',
    paths: [],
  },
};

/* ═══════════════════════════════════════════════════════
   STROKE-DRAW ICON (barbell only now)
   ═══════════════════════════════════════════════════════ */

interface StrokeIconProps {
  iconKey: string;
  glowColor: string;
}

export const StrokeIcon = ({ iconKey, glowColor }: StrokeIconProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    // Only run for barbell (generic path-based icons)
    if (iconKey !== 'barbell' || !svgRef.current || !containerRef.current) return;
    const ctx = gsap.context(() => {
      const paths = svgRef.current!.querySelectorAll('path');
      const glow = containerRef.current!.querySelector('.icon-glow') as HTMLElement;
      paths.forEach(p => {
        const len = p.getTotalLength();
        gsap.set(p, { strokeDasharray: len, strokeDashoffset: len, opacity: 1 });
      });
      if (glow) gsap.set(glow, { opacity: 0, scale: 0.6 });
      const tl = gsap.timeline({ delay: 0.25 });
      paths.forEach((p, i) => {
        tl.to(p, { strokeDashoffset: 0, duration: 0.55, ease: 'power2.inOut' }, i * 0.1);
      });
      if (glow) tl.to(glow, { opacity: 1, scale: 1, duration: 1, ease: 'power2.out' }, 0.3);
      tl.to(svgRef.current!, { y: -2.5, duration: 2.4, ease: 'sine.inOut', repeat: -1, yoyo: true }, '>-0.4');
    }, containerRef);
    return () => ctx.revert();
  }, [iconKey]);

  // Delegate to specialised visuals
  if (iconKey === 'network') return <AlgorithmVisual glowColor={glowColor} />;
  if (iconKey === 'utensils') return <NutritionVisual glowColor={glowColor} />;
  if (iconKey === 'chart') return <ProgressVisual glowColor={glowColor} />;


  const icon = ICONS[iconKey];
  if (!icon || icon.paths.length === 0) return null;

  return (
    <div ref={containerRef} className="relative w-[104px] h-[104px] flex items-center justify-center">
      <div className="icon-glow absolute inset-[-16px] rounded-[40px] blur-[28px]" style={{ backgroundColor: glowColor }} />
      <div className="relative w-full h-full rounded-[28px] bg-[#ffffff05] border border-[#ffffff08] flex items-center justify-center backdrop-blur-[0.5px]">
        <svg ref={svgRef} viewBox={icon.viewBox} className="w-10 h-10" fill="none" stroke="#F5F5F7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          {icon.paths.map((d, i) => (
            <path key={i} d={d} opacity="0" />
          ))}
        </svg>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   ALGORITHM VISUAL — clean geometric network
   ═══════════════════════════════════════════════════════ */

const AlgorithmVisual = ({ glowColor }: { glowColor: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      const lines = containerRef.current!.querySelectorAll('.algo-line');
      const nodes = containerRef.current!.querySelectorAll('.algo-node');
      const glow = containerRef.current!.querySelector('.icon-glow') as HTMLElement;

      // Init
      lines.forEach(l => {
        const len = (l as SVGPathElement).getTotalLength();
        gsap.set(l, { strokeDasharray: len, strokeDashoffset: len, opacity: 1 });
      });
      gsap.set(nodes, { opacity: 0, scale: 0, transformOrigin: 'center center' });
      if (glow) gsap.set(glow, { opacity: 0, scale: 0.6 });

      const tl = gsap.timeline({ delay: 0.25 });

      // Draw lines
      lines.forEach((l, i) => {
        tl.to(l, { strokeDashoffset: 0, duration: 0.5, ease: 'power2.inOut' }, i * 0.07);
      });

      // Pop nodes
      nodes.forEach((n, i) => {
        tl.to(n, { opacity: 1, scale: 1, duration: 0.4, ease: 'power2.out' }, 0.3 + i * 0.06);
      });

      // Glow
      if (glow) {
        tl.to(glow, { opacity: 1, scale: 1, duration: 1, ease: 'power2.out' }, 0.3);
      }

      // Breathing
      tl.to(containerRef.current!.querySelector('svg')!, {
        y: -2, duration: 2.6, ease: 'sine.inOut', repeat: -1, yoyo: true,
      }, '>-0.3');
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Hexagonal-ish network: 5 nodes, 7 edges
  const nodes = [
    { x: 32, y: 12, r: 2.5 },   // top
    { x: 16, y: 28, r: 2 },     // left
    { x: 48, y: 28, r: 2 },     // right
    { x: 22, y: 48, r: 2 },     // bottom-left
    { x: 42, y: 48, r: 2 },     // bottom-right
  ];

  const edges = [
    [0, 1], [0, 2], [1, 3], [2, 4], [1, 2], [3, 4], [0, 3],
  ];

  return (
    <div ref={containerRef} className="relative w-[104px] h-[104px] flex items-center justify-center">
      <div className="icon-glow absolute inset-[-16px] rounded-[40px] blur-[28px]" style={{ backgroundColor: glowColor }} />
      <div className="relative w-full h-full rounded-[28px] bg-[#ffffff05] border border-[#ffffff08] flex items-center justify-center backdrop-blur-[0.5px]">
        <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none">
          {/* Edges */}
          {edges.map(([a, b], i) => (
            <line
              key={`e-${i}`}
              className="algo-line"
              x1={nodes[a].x} y1={nodes[a].y}
              x2={nodes[b].x} y2={nodes[b].y}
              stroke="#ffffff20"
              strokeWidth="0.8"
              opacity="0"
            />
          ))}
          {/* Nodes */}
          {nodes.map((n, i) => (
            <circle
              key={`n-${i}`}
              className="algo-node"
              cx={n.x} cy={n.y} r={n.r}
              fill="#A5F3FC"
              opacity="0"
            />
          ))}
        </svg>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   NUTRITION VISUAL — abstract macro rings / blocks
   ═══════════════════════════════════════════════════════ */

const NutritionVisual = ({ glowColor }: { glowColor: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      const arcs = containerRef.current!.querySelectorAll('.macro-arc');
      const center = containerRef.current!.querySelector('.macro-center') as SVGElement;
      const glow = containerRef.current!.querySelector('.icon-glow') as HTMLElement;

      arcs.forEach(a => {
        const len = (a as SVGPathElement).getTotalLength();
        gsap.set(a, { strokeDasharray: len, strokeDashoffset: len, opacity: 1 });
      });
      if (center) gsap.set(center, { opacity: 0, scale: 0.5, transformOrigin: 'center center' });
      if (glow) gsap.set(glow, { opacity: 0, scale: 0.6 });

      const tl = gsap.timeline({ delay: 0.25 });

      // Draw arcs sequentially
      arcs.forEach((a, i) => {
        tl.to(a, { strokeDashoffset: 0, duration: 0.65, ease: 'power2.inOut' }, i * 0.15);
      });

      // Center dot
      if (center) {
        tl.to(center, { opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out' }, 0.4);
      }

      // Glow
      if (glow) {
        tl.to(glow, { opacity: 1, scale: 1, duration: 1, ease: 'power2.out' }, 0.3);
      }

      // Breathing
      tl.to(containerRef.current!.querySelector('svg')!, {
        y: -2, duration: 2.6, ease: 'sine.inOut', repeat: -1, yoyo: true,
      }, '>-0.3');
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Three concentric arc segments representing macros
  const r1 = 22, r2 = 18, r3 = 14;
  const cx = 32, cy = 32;

  const arcPath = (r: number, startDeg: number, endDeg: number) => {
    const s = (startDeg * Math.PI) / 180;
    const e = (endDeg * Math.PI) / 180;
    const x1 = cx + r * Math.cos(s);
    const y1 = cy + r * Math.sin(s);
    const x2 = cx + r * Math.cos(e);
    const y2 = cy + r * Math.sin(e);
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };

  return (
    <div ref={containerRef} className="relative w-[104px] h-[104px] flex items-center justify-center">
      <div className="icon-glow absolute inset-[-16px] rounded-[40px] blur-[28px]" style={{ backgroundColor: glowColor }} />
      <div className="relative w-full h-full rounded-[28px] bg-[#ffffff05] border border-[#ffffff08] flex items-center justify-center backdrop-blur-[0.5px]">
        <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" strokeLinecap="round">
          {/* Outer arc — protein (210°) */}
          <path className="macro-arc" d={arcPath(r1, -120, 90)} stroke="#2DD4BF" strokeWidth="2" opacity="0" />
          {/* Middle arc — carbs (150°) */}
          <path className="macro-arc" d={arcPath(r2, -90, 60)} stroke="#34D399" strokeWidth="1.6" opacity="0" />
          {/* Inner arc — fat (100°) */}
          <path className="macro-arc" d={arcPath(r3, -60, 40)} stroke="#5EEAD4" strokeWidth="1.2" opacity="0" />
          {/* Center precision dot */}
          <circle className="macro-center" cx={cx} cy={cy} r="2" fill="#F5F5F7" opacity="0" />
        </svg>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   PROGRESS VISUAL — technical chart with grid
   ═══════════════════════════════════════════════════════ */

const ProgressVisual = ({ glowColor }: { glowColor: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      const gridLines = containerRef.current!.querySelectorAll('.grid-line');
      const chartLine = containerRef.current!.querySelector('.chart-line') as SVGPathElement;
      const endDot = containerRef.current!.querySelector('.end-dot') as SVGElement;
      const endGlow = containerRef.current!.querySelector('.end-glow') as SVGElement;
      const glow = containerRef.current!.querySelector('.icon-glow') as HTMLElement;

      // Grid fades in
      gsap.set(gridLines, { opacity: 0 });
      // Chart line draws
      if (chartLine) {
        const len = chartLine.getTotalLength();
        gsap.set(chartLine, { strokeDasharray: len, strokeDashoffset: len, opacity: 1 });
      }
      gsap.set(endDot, { opacity: 0, scale: 0, transformOrigin: 'center center' });
      gsap.set(endGlow, { opacity: 0, scale: 0, transformOrigin: 'center center' });
      if (glow) gsap.set(glow, { opacity: 0, scale: 0.6 });

      const tl = gsap.timeline({ delay: 0.25 });

      // Grid appears softly
      tl.to(gridLines, { opacity: 0.12, duration: 0.6, ease: 'power2.out', stagger: 0.04 }, 0);

      // Chart line draws L→R
      if (chartLine) {
        tl.to(chartLine, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut' }, 0.2);
      }

      // End dot appears
      tl.to(endDot, { opacity: 1, scale: 1, duration: 0.4, ease: 'power2.out' }, 1.1);
      tl.to(endGlow, { opacity: 0.6, scale: 1, duration: 0.6, ease: 'power2.out' }, 1.2);

      // End dot pulse
      tl.to(endGlow, {
        opacity: 0.25, scale: 1.4, duration: 2, ease: 'sine.inOut', repeat: -1, yoyo: true,
      }, '>');

      // Glow
      if (glow) {
        tl.to(glow, { opacity: 1, scale: 1, duration: 1, ease: 'power2.out' }, 0.3);
      }

      // Breathing
      tl.to(containerRef.current!.querySelector('svg')!, {
        y: -2, duration: 2.6, ease: 'sine.inOut', repeat: -1, yoyo: true,
      }, '>-0.3');
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Performance line: subtle upward trend with organic feel
  const chartPath = 'M 6 42 C 12 40, 16 38, 20 36 C 24 34, 26 37, 30 33 C 34 29, 36 31, 40 26 C 44 21, 48 23, 52 18 C 54 16, 56 14, 58 12';
  const endX = 58, endY = 12;

  return (
    <div ref={containerRef} className="relative w-[104px] h-[104px] flex items-center justify-center">
      <div className="icon-glow absolute inset-[-16px] rounded-[40px] blur-[28px]" style={{ backgroundColor: glowColor }} />
      <div className="relative w-full h-full rounded-[28px] bg-[#ffffff05] border border-[#ffffff08] flex items-center justify-center backdrop-blur-[0.5px]">
        <svg viewBox="0 0 64 56" className="w-14 h-12" fill="none" strokeLinecap="round">
          {/* Subtle grid — horizontal lines */}
          {[16, 26, 36, 46].map((y, i) => (
            <line key={`h-${i}`} className="grid-line" x1="4" y1={y} x2="60" y2={y} stroke="#F5F5F7" strokeWidth="0.3" opacity="0" />
          ))}
          {/* Subtle grid — vertical lines */}
          {[14, 26, 38, 50].map((x, i) => (
            <line key={`v-${i}`} className="grid-line" x1={x} y1="10" x2={x} y2="48" stroke="#F5F5F7" strokeWidth="0.3" opacity="0" />
          ))}
          {/* Chart line */}
          <path className="chart-line" d={chartPath} stroke="#C4B5FD" strokeWidth="1.6" opacity="0" />
          {/* End glow */}
          <circle className="end-glow" cx={endX} cy={endY} r="6" fill="#C4B5FD" opacity="0" />
          {/* End dot */}
          <circle className="end-dot" cx={endX} cy={endY} r="2.5" fill="#C4B5FD" opacity="0" />
        </svg>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   NETWORK NODES — now unused (handled inside AlgorithmVisual)
   ═══════════════════════════════════════════════════════ */

export const NetworkNodes = () => null;

/* ═══════════════════════════════════════════════════════
   CHART END DOT — now unused (handled inside ProgressVisual)
   ═══════════════════════════════════════════════════════ */

export const ChartEndDot = () => null;

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
