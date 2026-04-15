import { useRef, useEffect } from 'react';
import gsap from 'gsap';

/* ═══════════════════════════════════════════════════════
   TEXT REVEAL — clip-path mask with blur lift
   ═══════════════════════════════════════════════════════ */

interface TextRevealProps {
  text: string;
  className?: string;
  delay?: number;
  as?: 'h1' | 'p';
  style_color?: string;
}

export const TextReveal = ({ text, className, delay = 0, as = 'p', style_color }: TextRevealProps) => {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!wrapRef.current) return;
    const inner = wrapRef.current.querySelector('.tr-inner') as HTMLElement;
    const ctx = gsap.context(() => {
      gsap.set(wrapRef.current!, { clipPath: 'inset(0 100% 0 0)' });
      gsap.set(inner, { opacity: 0, filter: 'blur(6px)' });
      const tl = gsap.timeline({ delay });
      tl.to(inner, { opacity: 1, filter: 'blur(0px)', duration: 0.01 }, 0);
      tl.to(wrapRef.current!, {
        clipPath: 'inset(0 0% 0 0)',
        duration: 0.85,
        ease: 'power3.inOut',
      }, 0);
    }, wrapRef);
    return () => ctx.revert();
  }, [delay, text]);

  const Tag = as;
  return (
    <div ref={wrapRef} style={{ clipPath: 'inset(0 100% 0 0)' }}>
      <div className="tr-inner" style={{ opacity: 0 }}>
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
   SUBTITLE REVEAL — blur + lift
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
        { opacity: 0, y: 14, filter: 'blur(6px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.8, delay, ease: 'power3.out' }
      );
    }, ref);
    return () => ctx.revert();
  }, [delay, text]);
  return <p ref={ref} className={className} style={{ opacity: 0, color: '#8E8E93' }}>{text}</p>;
};

/* ═══════════════════════════════════════════════════════
   WELCOME LOGO — particle convergence + laser formation
   Premium hero animation: scattered particles converge
   into the NEO wordmark, with laser trace and micro-glow.
   ═══════════════════════════════════════════════════════ */

export const WelcomeLogo = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const logoTextRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx2d = canvas.getContext('2d');
    if (!ctx2d) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = 360;
    const H = 160;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Sample target points from text
    const offscreen = document.createElement('canvas');
    offscreen.width = W * 2;
    offscreen.height = H * 2;
    const offCtx = offscreen.getContext('2d')!;
    offCtx.fillStyle = '#fff';
    offCtx.font = `bold ${56 * 2}px system-ui, -apple-system, sans-serif`;
    offCtx.textAlign = 'center';
    offCtx.textBaseline = 'middle';
    offCtx.letterSpacing = `${56 * 0.06 * 2}px`;
    offCtx.fillText('NEO', W, H);
    const imageData = offCtx.getImageData(0, 0, W * 2, H * 2);

    const targets: { x: number; y: number }[] = [];
    const step = 3;
    for (let y = 0; y < H * 2; y += step) {
      for (let x = 0; x < W * 2; x += step) {
        if (imageData.data[(y * W * 2 + x) * 4 + 3] > 128) {
          targets.push({ x: x / 2, y: y / 2 });
        }
      }
    }

    // Limit particle count for performance
    const MAX_PARTICLES = 420;
    const shuffled = targets.sort(() => Math.random() - 0.5).slice(0, MAX_PARTICLES);

    interface Particle {
      x: number; y: number;
      tx: number; ty: number;
      sx: number; sy: number;
      delay: number;
      size: number;
    }

    const particles: Particle[] = shuffled.map(t => {
      const angle = Math.random() * Math.PI * 2;
      const dist = 120 + Math.random() * 200;
      return {
        x: W / 2 + Math.cos(angle) * dist,
        y: H / 2 + Math.sin(angle) * dist,
        sx: W / 2 + Math.cos(angle) * dist,
        sy: H / 2 + Math.sin(angle) * dist,
        tx: t.x,
        ty: t.y,
        delay: Math.random() * 0.35,
        size: 0.6 + Math.random() * 1.0,
      };
    });

    let start: number | null = null;
    let animId: number;
    const CONVERGE_DURATION = 2200; // ms
    const HOLD_BEFORE_GLOW = 400;

    let glowTriggered = false;

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
    const easeInOutQuart = (t: number) => t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;

    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;

      ctx2d.clearRect(0, 0, W, H);

      // Draw laser scan line
      const laserProgress = Math.min(elapsed / 1200, 1);
      if (laserProgress < 1) {
        const lx = laserProgress * W;
        const grad = ctx2d.createLinearGradient(lx - 60, H / 2, lx + 10, H / 2);
        grad.addColorStop(0, 'rgba(255,255,255,0)');
        grad.addColorStop(0.6, 'rgba(255,255,255,0.15)');
        grad.addColorStop(1, 'rgba(255,255,255,0.6)');
        ctx2d.strokeStyle = grad;
        ctx2d.lineWidth = 1;
        ctx2d.beginPath();
        ctx2d.moveTo(Math.max(0, lx - 60), H / 2);
        ctx2d.lineTo(lx, H / 2);
        ctx2d.stroke();

        // Vertical scan line
        ctx2d.strokeStyle = `rgba(255,255,255,${0.08 * (1 - laserProgress)})`;
        ctx2d.lineWidth = 0.5;
        ctx2d.beginPath();
        ctx2d.moveTo(lx, 0);
        ctx2d.lineTo(lx, H);
        ctx2d.stroke();
      }

      // Draw particles
      let allSettled = true;
      particles.forEach(p => {
        const pElapsed = Math.max(0, elapsed - p.delay * CONVERGE_DURATION);
        const raw = Math.min(pElapsed / CONVERGE_DURATION, 1);
        const t = easeInOutQuart(raw);

        p.x = p.sx + (p.tx - p.sx) * t;
        p.y = p.sy + (p.ty - p.sy) * t;

        if (raw < 1) allSettled = false;

        // Trail line from origin
        if (raw < 0.7 && raw > 0) {
          ctx2d.strokeStyle = `rgba(255,255,255,${0.04 * (1 - raw)})`;
          ctx2d.lineWidth = 0.3;
          ctx2d.beginPath();
          ctx2d.moveTo(p.sx, p.sy);
          ctx2d.lineTo(p.x, p.y);
          ctx2d.stroke();
        }

        // Particle glow
        const alpha = raw < 0.3 ? 0.2 + raw * 2 : 0.8;
        const size = raw < 1 ? p.size * (0.5 + t * 0.5) : p.size;

        // Micro-glow halo
        if (raw > 0.7) {
          ctx2d.beginPath();
          ctx2d.arc(p.x, p.y, size + 2, 0, Math.PI * 2);
          ctx2d.fillStyle = `rgba(255,255,255,${0.03 * (raw - 0.7) / 0.3})`;
          ctx2d.fill();
        }

        ctx2d.beginPath();
        ctx2d.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx2d.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx2d.fill();
      });

      // Breathing pulse after settled
      if (allSettled && !glowTriggered) {
        glowTriggered = true;
        // Trigger glow & text reveals via GSAP
        if (glowRef.current && logoTextRef.current) {
          const tl = gsap.timeline();
          tl.to(glowRef.current, { opacity: 0.6, scale: 1, duration: 1.0, ease: 'power2.out' });
          tl.to(glowRef.current, { opacity: 0.25, scale: 1.02, duration: 3, ease: 'sine.inOut', repeat: -1, yoyo: true }, '>');
        }
      }

      // Breathing effect on settled particles
      if (allSettled) {
        const breathe = Math.sin(elapsed * 0.0015) * 0.06;
        particles.forEach(p => {
          const bx = p.tx + (p.tx - W / 2) * breathe;
          const by = p.ty + (p.ty - H / 2) * breathe;
          ctx2d.beginPath();
          ctx2d.arc(bx, by, p.size, 0, Math.PI * 2);
          ctx2d.fillStyle = 'rgba(255,255,255,0.85)';
          ctx2d.fill();
        });
      }

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div ref={containerRef} className="flex flex-col items-center relative">
      {/* Ambient glow behind logo */}
      <div
        ref={glowRef}
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 240,
          height: 100,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%) scale(0.7)',
          background: 'radial-gradient(ellipse, rgba(255,255,255,0.08) 0%, transparent 70%)',
          opacity: 0,
          filter: 'blur(30px)',
        }}
      />
      {/* Canvas for particle animation */}
      <canvas
        ref={canvasRef}
        className="relative z-10 pointer-events-none"
        style={{ width: 360, height: 160 }}
      />
      {/* Hidden text ref for accessibility */}
      <div ref={logoTextRef} className="sr-only">NEO</div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   CLOSING LOGO — authoritative entrance
   ═══════════════════════════════════════════════════════ */

export const ClosingLogo = () => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      const logo = ref.current!.querySelector('.closing-logo') as HTMLElement;
      const glow = ref.current!.querySelector('.closing-glow') as HTMLElement;
      gsap.set(logo, { opacity: 0, scale: 0.88, filter: 'blur(8px)' });
      gsap.set(glow, { opacity: 0, scale: 0.6 });
      const tl = gsap.timeline({ delay: 0.15 });
      tl.to(logo, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1.1, ease: 'power2.out' });
      tl.to(glow, { opacity: 0.7, scale: 1, duration: 1.4, ease: 'power2.out' }, 0.2);
      tl.to(glow, { opacity: 0.35, scale: 1.02, duration: 3, ease: 'sine.inOut', repeat: -1, yoyo: true }, '>');
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} className="relative">
      <div className="closing-glow absolute inset-[-32px] rounded-full bg-[#ffffff06] blur-[40px]" />
      <div className="closing-logo">
        <span className="text-[64px] font-bold tracking-[0.06em] text-white select-none leading-none">
          NEO
        </span>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   HERO VISUALS — one per slide
   ═══════════════════════════════════════════════════════ */

/* --- Training: Precision Rings --- */
export const TrainingHeroVisual = ({ accentColor }: { accentColor: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      const rings = ref.current!.querySelectorAll('.ring-arc');
      const core = ref.current!.querySelector('.core-dot') as SVGElement;
      const ticks = ref.current!.querySelectorAll('.tick-mark');

      rings.forEach(r => {
        const len = (r as SVGPathElement).getTotalLength();
        gsap.set(r, { strokeDasharray: len, strokeDashoffset: len, opacity: 1 });
      });
      gsap.set(core, { opacity: 0, scale: 0, transformOrigin: 'center' });
      gsap.set(ticks, { opacity: 0, scaleY: 0, transformOrigin: 'center bottom' });

      const tl = gsap.timeline({ delay: 0.2 });
      // Draw rings staggered
      rings.forEach((r, i) => {
        tl.to(r, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut' }, i * 0.15);
      });
      // Core pulse
      tl.to(core, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(2)' }, 0.6);
      // Ticks
      ticks.forEach((t, i) => {
        tl.to(t, { opacity: 0.6, scaleY: 1, duration: 0.3, ease: 'power2.out' }, 0.4 + i * 0.04);
      });
      // Breathing rotation
      tl.to(ref.current!.querySelector('svg')!, {
        rotation: 360, duration: 60, ease: 'none', repeat: -1,
      }, 0);
    }, ref);
    return () => ctx.revert();
  }, []);

  const cx = 80, cy = 80;
  const arc = (r: number, start: number, end: number) => {
    const s = (start * Math.PI) / 180;
    const e = (end * Math.PI) / 180;
    const x1 = cx + r * Math.cos(s), y1 = cy + r * Math.sin(s);
    const x2 = cx + r * Math.cos(e), y2 = cy + r * Math.sin(e);
    const large = end - start > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };

  // Generate tick marks around outer ring
  const tickAngles = Array.from({ length: 36 }, (_, i) => i * 10);

  return (
    <div ref={ref} className="relative w-[200px] h-[200px]">
      <svg viewBox="0 0 160 160" className="w-full h-full" fill="none" strokeLinecap="round">
        {/* Tick marks */}
        {tickAngles.map((angle, i) => {
          const r1 = 72, r2 = angle % 30 === 0 ? 68 : 70;
          const rad = (angle * Math.PI) / 180;
          return (
            <line
              key={i}
              className="tick-mark"
              x1={cx + r1 * Math.cos(rad)} y1={cy + r1 * Math.sin(rad)}
              x2={cx + r2 * Math.cos(rad)} y2={cy + r2 * Math.sin(rad)}
              stroke={accentColor} strokeWidth={angle % 30 === 0 ? 1.2 : 0.5} opacity="0"
            />
          );
        })}
        {/* Outer ring — 270° */}
        <path className="ring-arc" d={arc(64, -135, 135)} stroke={accentColor} strokeWidth="2" opacity="0" />
        {/* Middle ring — 210° */}
        <path className="ring-arc" d={arc(52, -120, 90)} stroke={accentColor} strokeWidth="1.5" opacity="0" strokeOpacity="0.5" />
        {/* Inner ring — 150° */}
        <path className="ring-arc" d={arc(40, -90, 60)} stroke={accentColor} strokeWidth="1" opacity="0" strokeOpacity="0.3" />
        {/* Core */}
        <circle className="core-dot" cx={cx} cy={cy} r="4" fill={accentColor} opacity="0" />
      </svg>
    </div>
  );
};

/* --- AI: Neural Constellation --- */
export const AIHeroVisual = ({ accentColor }: { accentColor: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      const edges = ref.current!.querySelectorAll('.nn-edge');
      const nodes = ref.current!.querySelectorAll('.nn-node');
      const pulses = ref.current!.querySelectorAll('.nn-pulse');

      edges.forEach(e => {
        const len = (e as SVGPathElement).getTotalLength?.() || (e as SVGLineElement).getTotalLength?.() || 100;
        gsap.set(e, { strokeDasharray: len, strokeDashoffset: len, opacity: 1 });
      });
      gsap.set(nodes, { opacity: 0, scale: 0, transformOrigin: 'center' });
      gsap.set(pulses, { opacity: 0, scale: 0, transformOrigin: 'center' });

      const tl = gsap.timeline({ delay: 0.2 });
      edges.forEach((e, i) => {
        tl.to(e, { strokeDashoffset: 0, duration: 0.6, ease: 'power2.inOut' }, i * 0.06);
      });
      nodes.forEach((n, i) => {
        tl.to(n, { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(2)' }, 0.3 + i * 0.05);
      });
      // Pulse glow on central node
      pulses.forEach((p) => {
        tl.to(p, { opacity: 0.3, scale: 1, duration: 0.8, ease: 'power2.out' }, 0.8);
        tl.to(p, { opacity: 0.1, scale: 1.6, duration: 2.5, ease: 'sine.inOut', repeat: -1, yoyo: true }, '>');
      });
      // Subtle float
      tl.to(ref.current!.querySelector('svg')!, {
        y: -3, duration: 3, ease: 'sine.inOut', repeat: -1, yoyo: true,
      }, 0);
    }, ref);
    return () => ctx.revert();
  }, []);

  // More complex neural network
  const nodes = [
    { x: 80, y: 80, r: 5 },  // center
    { x: 40, y: 40, r: 3 },
    { x: 120, y: 40, r: 3 },
    { x: 30, y: 90, r: 2.5 },
    { x: 130, y: 90, r: 2.5 },
    { x: 50, y: 130, r: 3 },
    { x: 110, y: 130, r: 3 },
    { x: 80, y: 30, r: 2 },
    { x: 80, y: 130, r: 2 },
  ];
  const edges = [
    [0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[1,7],[2,7],[1,3],[2,4],[3,5],[4,6],[5,8],[6,8],
  ];

  return (
    <div ref={ref} className="relative w-[200px] h-[200px]">
      <svg viewBox="0 0 160 160" className="w-full h-full" fill="none">
        {edges.map(([a, b], i) => (
          <line
            key={i} className="nn-edge"
            x1={nodes[a].x} y1={nodes[a].y}
            x2={nodes[b].x} y2={nodes[b].y}
            stroke={accentColor} strokeWidth="0.8" strokeOpacity="0.4" opacity="0"
          />
        ))}
        {/* Center pulse */}
        <circle className="nn-pulse" cx={80} cy={80} r="16" fill={accentColor} opacity="0" />
        {nodes.map((n, i) => (
          <circle key={i} className="nn-node" cx={n.x} cy={n.y} r={n.r} fill={accentColor} opacity="0" />
        ))}
      </svg>
    </div>
  );
};

/* --- Nutrition: Macro Ring System --- */
export const NutritionHeroVisual = ({ accentColor }: { accentColor: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      const arcs = ref.current!.querySelectorAll('.macro-arc');
      const labels = ref.current!.querySelectorAll('.macro-label');
      const center = ref.current!.querySelector('.macro-center') as SVGElement;

      arcs.forEach(a => {
        const len = (a as SVGPathElement).getTotalLength();
        gsap.set(a, { strokeDasharray: len, strokeDashoffset: len, opacity: 1 });
      });
      gsap.set(labels, { opacity: 0 });
      gsap.set(center, { opacity: 0, scale: 0, transformOrigin: 'center' });

      const tl = gsap.timeline({ delay: 0.2 });
      arcs.forEach((a, i) => {
        tl.to(a, { strokeDashoffset: 0, duration: 0.8, ease: 'power2.inOut' }, i * 0.2);
      });
      tl.to(center, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(2)' }, 0.5);
      labels.forEach((l, i) => {
        tl.to(l, { opacity: 0.7, duration: 0.4, ease: 'power2.out' }, 0.7 + i * 0.1);
      });
      tl.to(ref.current!.querySelector('svg')!, {
        y: -3, duration: 3, ease: 'sine.inOut', repeat: -1, yoyo: true,
      }, 0);
    }, ref);
    return () => ctx.revert();
  }, []);

  const cx = 80, cy = 80;
  const arcPath = (r: number, start: number, end: number) => {
    const s = (start * Math.PI) / 180;
    const e = (end * Math.PI) / 180;
    const x1 = cx + r * Math.cos(s), y1 = cy + r * Math.sin(s);
    const x2 = cx + r * Math.cos(e), y2 = cy + r * Math.sin(e);
    const large = end - start > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };

  return (
    <div ref={ref} className="relative w-[200px] h-[200px]">
      <svg viewBox="0 0 160 160" className="w-full h-full" fill="none" strokeLinecap="round">
        {/* Outer: Protein — 240° */}
        <path className="macro-arc" d={arcPath(64, -150, 90)} stroke="#2DD4BF" strokeWidth="3" opacity="0" />
        {/* Middle: Carbs — 180° */}
        <path className="macro-arc" d={arcPath(52, -120, 60)} stroke={accentColor} strokeWidth="2.5" opacity="0" />
        {/* Inner: Fats — 120° */}
        <path className="macro-arc" d={arcPath(40, -80, 40)} stroke="#5EEAD4" strokeWidth="2" opacity="0" />
        {/* Center */}
        <circle className="macro-center" cx={cx} cy={cy} r="4" fill={accentColor} opacity="0" />
        {/* Labels */}
        <text className="macro-label" x="140" y="50" fill="#2DD4BF" fontSize="7" fontWeight="500" opacity="0">PRO</text>
        <text className="macro-label" x="140" y="80" fill={accentColor} fontSize="7" fontWeight="500" opacity="0">CHO</text>
        <text className="macro-label" x="140" y="110" fill="#5EEAD4" fontSize="7" fontWeight="500" opacity="0">FAT</text>
      </svg>
    </div>
  );
};

/* --- Progress: Trend Chart --- */
export const ProgressHeroVisual = ({ accentColor }: { accentColor: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      const gridLines = ref.current!.querySelectorAll('.grid-ln');
      const chartLine = ref.current!.querySelector('.chart-ln') as SVGPathElement;
      const areaFill = ref.current!.querySelector('.chart-area') as SVGPathElement;
      const endDot = ref.current!.querySelector('.end-dot') as SVGElement;
      const endPulse = ref.current!.querySelector('.end-pulse') as SVGElement;
      const dataPoints = ref.current!.querySelectorAll('.data-pt');

      gsap.set(gridLines, { opacity: 0 });
      if (chartLine) {
        const len = chartLine.getTotalLength();
        gsap.set(chartLine, { strokeDasharray: len, strokeDashoffset: len, opacity: 1 });
      }
      gsap.set(areaFill, { opacity: 0 });
      gsap.set(endDot, { opacity: 0, scale: 0, transformOrigin: 'center' });
      gsap.set(endPulse, { opacity: 0, scale: 0, transformOrigin: 'center' });
      gsap.set(dataPoints, { opacity: 0, scale: 0, transformOrigin: 'center' });

      const tl = gsap.timeline({ delay: 0.2 });
      tl.to(gridLines, { opacity: 0.08, duration: 0.8, stagger: 0.03 }, 0);
      if (chartLine) tl.to(chartLine, { strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut' }, 0.3);
      tl.to(areaFill, { opacity: 0.08, duration: 0.8, ease: 'power2.out' }, 1.0);
      dataPoints.forEach((d, i) => {
        tl.to(d, { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(2)' }, 0.5 + i * 0.12);
      });
      tl.to(endDot, { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(2)' }, 1.5);
      tl.to(endPulse, { opacity: 0.4, scale: 1, duration: 0.6 }, 1.6);
      tl.to(endPulse, { opacity: 0.15, scale: 1.8, duration: 2.5, ease: 'sine.inOut', repeat: -1, yoyo: true }, '>');
    }, ref);
    return () => ctx.revert();
  }, []);

  const chartD = 'M 10 110 C 25 105, 35 95, 50 88 C 65 81, 70 90, 85 78 C 100 66, 108 72, 120 55 C 130 42, 138 38, 150 28';
  const areaD = chartD + ' L 150 120 L 10 120 Z';
  const points = [
    { x: 50, y: 88 }, { x: 85, y: 78 }, { x: 120, y: 55 },
  ];

  return (
    <div ref={ref} className="relative w-[220px] h-[180px]">
      <svg viewBox="0 0 160 130" className="w-full h-full" fill="none" strokeLinecap="round">
        {/* Grid */}
        {[40, 60, 80, 100].map((y, i) => (
          <line key={`h${i}`} className="grid-ln" x1="8" y1={y} x2="152" y2={y} stroke="white" strokeWidth="0.3" opacity="0" />
        ))}
        {[30, 60, 90, 120, 150].map((x, i) => (
          <line key={`v${i}`} className="grid-ln" x1={x} y1="25" x2={x} y2="115" stroke="white" strokeWidth="0.3" opacity="0" />
        ))}
        {/* Area fill */}
        <path className="chart-area" d={areaD} fill={accentColor} opacity="0" />
        {/* Line */}
        <path className="chart-ln" d={chartD} stroke={accentColor} strokeWidth="2" opacity="0" />
        {/* Data points */}
        {points.map((p, i) => (
          <circle key={i} className="data-pt" cx={p.x} cy={p.y} r="2.5" fill={accentColor} opacity="0" />
        ))}
        {/* End pulse */}
        <circle className="end-pulse" cx="150" cy="28" r="10" fill={accentColor} opacity="0" />
        <circle className="end-dot" cx="150" cy="28" r="3.5" fill={accentColor} opacity="0" />
      </svg>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   STUBS for backward compat
   ═══════════════════════════════════════════════════════ */

export const StrokeIcon = TrainingHeroVisual as any;
export const NetworkNodes = () => null;
export const ChartEndDot = () => null;
