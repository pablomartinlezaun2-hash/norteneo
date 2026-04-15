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

/* --- Training: Orbital Precision Console --- */
export const TrainingHeroVisual = ({ accentColor }: { accentColor: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const SIZE = 320;
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    canvas.style.width = `${SIZE}px`;
    canvas.style.height = `${SIZE}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cx = SIZE / 2;
    const cy = SIZE / 2;
    let animId: number;
    let start: number | null = null;

    const hexToRgb = (hex: string) => ({
      r: parseInt(hex.slice(1, 3), 16),
      g: parseInt(hex.slice(3, 5), 16),
      b: parseInt(hex.slice(5, 7), 16),
    });
    const ac = hexToRgb(accentColor);
    const rgba = (a: number) => `rgba(${ac.r},${ac.g},${ac.b},${a})`;
    const wRgba = (a: number) => `rgba(255,255,255,${a})`;

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
    const easeInOutQuart = (t: number) => t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
    const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5);

    // Phase timing (ms) — sequential build, then LOCK
    const P1 = 500;    // silence
    const P2 = 1600;   // outer scaffold appears
    const P3 = 2600;   // rings trace inward
    const P4 = 3200;   // core deploys + cross-hairs lock
    const P5 = 3800;   // data readouts flash + system confirms
    const LOCKED = 4200; // everything settled — no rotation

    // Readout positions (cardinal + ordinal)
    const readouts = [
      { angle: -90, r: 100, label: 'VOL', value: '24.8' },
      { angle: 0, r: 100, label: 'RIR', value: '2.0' },
      { angle: 90, r: 100, label: 'INT', value: '78%' },
      { angle: 180, r: 100, label: 'FRQ', value: '4×' },
    ];

    const drawLine = (x1: number, y1: number, x2: number, y2: number, lw: number, color: string) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
      ctx.stroke();
    };

    const drawArc = (r: number, startRad: number, endRad: number, lw: number, color: string) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, startRad, endRad);
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
      ctx.lineCap = 'butt';
      ctx.stroke();
    };

    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const t = timestamp - start;
      ctx.clearRect(0, 0, SIZE, SIZE);

      const isLocked = t > LOCKED;
      const breathe = isLocked ? Math.sin(t * 0.0008) * 0.04 + 0.96 : 1;

      // ── LAYER 1: Outer scaffold — 72 precision ticks ──
      if (t > P1) {
        const p = easeOutCubic(Math.min((t - P1) / (P2 - P1), 1));
        const TICKS = 72;
        for (let i = 0; i < TICKS; i++) {
          const angle = (i / TICKS) * Math.PI * 2 - Math.PI / 2;
          const isMajor = i % 18 === 0; // 4 cardinal
          const isMinor = i % 6 === 0;  // 12 subdivisions
          // Stagger from top
          const stagger = ((i + TICKS / 4) % TICKS) / TICKS;
          const localP = easeOutCubic(Math.max(0, Math.min((p - stagger * 0.5) / 0.5, 1)));
          if (localP <= 0) continue;

          const rOuter = 138;
          const rInner = isMajor ? 126 : isMinor ? 131 : 134;
          const lw = isMajor ? 1.4 : isMinor ? 0.6 : 0.3;
          const alpha = (isMajor ? 0.7 : isMinor ? 0.3 : 0.08) * localP * breathe;

          drawLine(
            cx + rOuter * Math.cos(angle), cy + rOuter * Math.sin(angle),
            cx + rInner * Math.cos(angle), cy + rInner * Math.sin(angle),
            lw, isMajor ? rgba(alpha) : wRgba(alpha)
          );
        }

        // Cardinal labels at 45° offsets (tiny markers)
        if (p > 0.6) {
          const labelAlpha = easeOutCubic((p - 0.6) / 0.4) * 0.2 * breathe;
          [45, 135, 225, 315].forEach((deg) => {
            const rad = (deg * Math.PI) / 180;
            const x = cx + 144 * Math.cos(rad);
            const y = cy + 144 * Math.sin(rad);
            ctx.beginPath();
            ctx.arc(x, y, 1, 0, Math.PI * 2);
            ctx.fillStyle = rgba(labelAlpha);
            ctx.fill();
          });
        }
      }

      // ── LAYER 2: Primary rings — traced with laser precision ──
      if (t > P2 * 0.7) {
        const rp = Math.min((t - P2 * 0.7) / (P3 - P2), 1);

        // Ring A: r=120, full circle, thick
        const rA = easeInOutQuart(Math.min(rp / 0.6, 1));
        if (rA > 0) {
          const endAngle = -Math.PI / 2 + Math.PI * 2 * rA;
          drawArc(120, -Math.PI / 2, endAngle, 1.0, rgba(0.35 * rA * breathe));
          // Trace head glow during draw
          if (rA < 1) {
            const hx = cx + 120 * Math.cos(endAngle);
            const hy = cy + 120 * Math.sin(endAngle);
            const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, 6);
            g.addColorStop(0, rgba(0.8));
            g.addColorStop(1, 'transparent');
            ctx.fillStyle = g;
            ctx.fillRect(hx - 6, hy - 6, 12, 12);
          }
        }

        // Ring B: r=90, 270° arc, medium
        const rB = easeInOutQuart(Math.max(0, Math.min((rp - 0.15) / 0.6, 1)));
        if (rB > 0) {
          const startB = Math.PI / 4;
          const endB = startB + (Math.PI * 1.5) * rB;
          drawArc(90, startB, endB, 0.7, rgba(0.25 * rB * breathe));
          if (rB < 1) {
            const hx = cx + 90 * Math.cos(endB);
            const hy = cy + 90 * Math.sin(endB);
            const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, 5);
            g.addColorStop(0, rgba(0.6));
            g.addColorStop(1, 'transparent');
            ctx.fillStyle = g;
            ctx.fillRect(hx - 5, hy - 5, 10, 10);
          }
        }

        // Ring C: r=58, 180° arc
        const rC = easeInOutQuart(Math.max(0, Math.min((rp - 0.3) / 0.6, 1)));
        if (rC > 0) {
          const startC = -Math.PI;
          const endC = startC + Math.PI * rC;
          drawArc(58, startC, endC, 0.5, rgba(0.18 * rC * breathe));
        }

        // Thin tracking ring r=105
        const rD = easeOutCubic(Math.max(0, Math.min((rp - 0.1) / 0.5, 1)));
        if (rD > 0) {
          ctx.beginPath();
          ctx.arc(cx, cy, 105, 0, Math.PI * 2);
          ctx.strokeStyle = wRgba(0.04 * rD * breathe);
          ctx.lineWidth = 0.3;
          ctx.stroke();
        }
      }

      // ── LAYER 3: Core deployment — cross-hairs + nucleus ──
      if (t > P3 * 0.9) {
        const cp = easeOutQuint(Math.min((t - P3 * 0.9) / 600, 1));

        // Cross-hairs: extend from center outward, then STOP
        const chLen = 28 * cp;
        const gap = 10;
        ctx.strokeStyle = rgba(0.2 * cp * breathe);
        ctx.lineWidth = 0.5;

        // Horizontal
        drawLine(cx - chLen, cy, cx - gap, cy, 0.5, rgba(0.2 * cp * breathe));
        drawLine(cx + gap, cy, cx + chLen, cy, 0.5, rgba(0.2 * cp * breathe));
        // Vertical
        drawLine(cx, cy - chLen, cx, cy - gap, 0.5, rgba(0.2 * cp * breathe));
        drawLine(cx, cy + gap, cx, cy + chLen, 0.5, rgba(0.2 * cp * breathe));

        // Small corner brackets at crosshair ends
        const bLen = 4 * cp;
        const bAlpha = 0.15 * cp * breathe;
        [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([dx, dy]) => {
          const bx = cx + chLen * dx;
          const by = cy + chLen * dy;
          drawLine(bx, by, bx - bLen * dx, by, 0.4, rgba(bAlpha));
          drawLine(bx, by, bx, by - bLen * dy, 0.4, rgba(bAlpha));
        });

        // Core nucleus — small, precise, no glow
        ctx.beginPath();
        ctx.arc(cx, cy, 3.5 * cp, 0, Math.PI * 2);
        ctx.fillStyle = rgba(0.85 * cp * breathe);
        ctx.fill();

        // Inner precision ring
        ctx.beginPath();
        ctx.arc(cx, cy, 8, 0, Math.PI * 2);
        ctx.strokeStyle = rgba(0.12 * cp * breathe);
        ctx.lineWidth = 0.4;
        ctx.stroke();

        // Outer precision ring
        ctx.beginPath();
        ctx.arc(cx, cy, 18, 0, Math.PI * 2);
        ctx.strokeStyle = rgba(0.08 * cp * breathe);
        ctx.lineWidth = 0.3;
        ctx.stroke();
      }

      // ── LAYER 4: Data readouts — flash on, then hold ──
      if (t > P4) {
        const dp = Math.min((t - P4) / (P5 - P4), 1);

        ctx.font = '600 8px -apple-system, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        readouts.forEach((rd, i) => {
          const stagger = i * 0.15;
          const localP = easeOutCubic(Math.max(0, Math.min((dp - stagger) / 0.4, 1)));
          if (localP <= 0) return;

          const rad = (rd.angle * Math.PI) / 180;
          const x = cx + rd.r * Math.cos(rad);
          const y = cy + rd.r * Math.sin(rad);

          // Flash effect during reveal
          const flash = localP < 0.8 ? 1 + (1 - localP / 0.8) * 0.5 : 1;
          const alpha = localP * breathe * 0.6;

          // Value
          ctx.fillStyle = rgba(alpha * flash);
          ctx.font = '600 9px -apple-system, system-ui, sans-serif';
          ctx.fillText(rd.value, x, y - 4);

          // Label
          ctx.fillStyle = wRgba(alpha * 0.35);
          ctx.font = '500 6px -apple-system, system-ui, sans-serif';
          ctx.fillText(rd.label, x, y + 6);

          // Small tick connecting to ring
          const tickR1 = 118;
          const tickR2 = 122;
          drawLine(
            cx + tickR1 * Math.cos(rad), cy + tickR1 * Math.sin(rad),
            cx + tickR2 * Math.cos(rad), cy + tickR2 * Math.sin(rad),
            0.6, rgba(alpha * 0.5)
          );
        });
      }

      // ── LAYER 5: System confirmed — static locked state ──
      if (isLocked) {
        // Confirmation pulse: single outward ring that fades (only once)
        const confirmT = Math.min((t - LOCKED) / 800, 1);
        if (confirmT < 1) {
          const pulseR = 20 + 130 * easeOutCubic(confirmT);
          const pulseA = (1 - confirmT) * 0.08;
          ctx.beginPath();
          ctx.arc(cx, cy, pulseR, 0, Math.PI * 2);
          ctx.strokeStyle = rgba(pulseA);
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Subtle atmosphere — static, no rotation
        const atmos = ctx.createRadialGradient(cx, cy, 40, cx, cy, 145);
        atmos.addColorStop(0, rgba(0.03 * breathe));
        atmos.addColorStop(0.6, rgba(0.01 * breathe));
        atmos.addColorStop(1, 'transparent');
        ctx.fillStyle = atmos;
        ctx.fillRect(0, 0, SIZE, SIZE);
      }

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [accentColor]);

  return (
    <div className="relative w-[280px] h-[280px] md:w-[320px] md:h-[320px]">
      <canvas
        ref={canvasRef}
        className="w-full h-full pointer-events-none"
        style={{ width: 320, height: 320 }}
      />
    </div>
  );
};

/* --- AI: Cognitive Constellation Network --- */
export const AIHeroVisual = ({ accentColor }: { accentColor: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const SIZE = 320;
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    canvas.style.width = `${SIZE}px`;
    canvas.style.height = `${SIZE}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cx = SIZE / 2;
    const cy = SIZE / 2;
    let animId: number;
    let start: number | null = null;

    const hexToRgb = (hex: string) => ({
      r: parseInt(hex.slice(1, 3), 16),
      g: parseInt(hex.slice(3, 5), 16),
      b: parseInt(hex.slice(5, 7), 16),
    });
    const ac = hexToRgb(accentColor);
    const rgba = (a: number) => `rgba(${ac.r},${ac.g},${ac.b},${a})`;
    const wRgba = (a: number) => `rgba(255,255,255,${a})`;

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
    const easeInOutQuart = (t: number) => t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
    const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5);

    // Phase timing
    const P1 = 400;   // silence + atmosphere
    const P2 = 1400;  // nodes appear scattered
    const P3 = 2600;  // connections trace
    const P4 = 3400;  // core activates
    const P5 = 4000;  // system operational
    const ALIVE = 4400;

    // Node definitions: central + peripherals
    interface NetNode {
      x: number; y: number; r: number;
      scatterX: number; scatterY: number;
      appearDelay: number; // 0-1
      importance: number; // 0-1, affects glow
    }

    const peripheral = [
      { angle: -70, dist: 95, r: 3.2, imp: 0.7 },   // fatiga
      { angle: -25, dist: 105, r: 2.8, imp: 0.6 },  // sueño
      { angle: 20,  dist: 90, r: 3.0, imp: 0.65 },   // carga
      { angle: 65,  dist: 100, r: 2.6, imp: 0.5 },  // adherencia
      { angle: 110, dist: 95, r: 3.0, imp: 0.6 },   // rendimiento
      { angle: 155, dist: 105, r: 2.5, imp: 0.45 },  // recuperación
      { angle: 200, dist: 88, r: 2.8, imp: 0.55 },   // nutrición
      { angle: 250, dist: 100, r: 2.4, imp: 0.4 },  // estrés
      { angle: -110, dist: 80, r: 2.2, imp: 0.35 },  // HRV
      { angle: -140, dist: 110, r: 2.0, imp: 0.3 },  // volumen
      // Secondary cluster
      { angle: 45,  dist: 55, r: 2.0, imp: 0.5 },
      { angle: 135, dist: 50, r: 2.2, imp: 0.55 },
      { angle: -45, dist: 58, r: 1.8, imp: 0.4 },
      { angle: -135, dist: 52, r: 2.0, imp: 0.45 },
    ];

    const nodes: NetNode[] = [
      // Central node (index 0)
      { x: cx, y: cy, r: 5.5, scatterX: cx + (Math.random() - 0.5) * 40, scatterY: cy + (Math.random() - 0.5) * 40, appearDelay: 0.3, importance: 1.0 },
      ...peripheral.map((p, i) => {
        const rad = (p.angle * Math.PI) / 180;
        const nx = cx + p.dist * Math.cos(rad);
        const ny = cy + p.dist * Math.sin(rad);
        const sAngle = rad + (Math.random() - 0.5) * 1.2;
        const sDist = p.dist + 30 + Math.random() * 60;
        return {
          x: nx, y: ny, r: p.r,
          scatterX: cx + sDist * Math.cos(sAngle),
          scatterY: cy + sDist * Math.sin(sAngle),
          appearDelay: 0.05 + (i / peripheral.length) * 0.7,
          importance: p.imp,
        };
      }),
    ];

    // Connections: central to all, plus some inter-peripheral
    interface Connection {
      a: number; b: number;
      traceDelay: number; // 0-1 within P3 phase
      intensity: number;
    }

    const connections: Connection[] = [
      // Central to each peripheral
      ...nodes.slice(1).map((_, i) => ({
        a: 0, b: i + 1,
        traceDelay: i * 0.06,
        intensity: 0.5 + nodes[i + 1].importance * 0.5,
      })),
      // Inter-peripheral (selective)
      { a: 1, b: 2, traceDelay: 0.5, intensity: 0.3 },
      { a: 2, b: 3, traceDelay: 0.55, intensity: 0.25 },
      { a: 4, b: 5, traceDelay: 0.6, intensity: 0.3 },
      { a: 6, b: 7, traceDelay: 0.65, intensity: 0.2 },
      { a: 3, b: 11, traceDelay: 0.7, intensity: 0.35 },
      { a: 5, b: 12, traceDelay: 0.72, intensity: 0.3 },
      { a: 1, b: 13, traceDelay: 0.75, intensity: 0.25 },
      { a: 8, b: 14, traceDelay: 0.78, intensity: 0.2 },
      { a: 11, b: 12, traceDelay: 0.82, intensity: 0.3 },
      { a: 13, b: 14, traceDelay: 0.85, intensity: 0.25 },
    ];

    // Signal pulses traveling along connections
    interface SignalPulse {
      connIdx: number;
      progress: number; // 0-1
      speed: number;
      active: boolean;
      direction: number; // 1 or -1
    }
    const signals: SignalPulse[] = [];

    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const t = timestamp - start;
      ctx.clearRect(0, 0, SIZE, SIZE);

      const isAlive = t > ALIVE;
      const breathe = isAlive ? Math.sin(t * 0.0006) * 0.08 + 1 : 1;
      const breatheSlow = isAlive ? Math.sin(t * 0.0004) * 0.05 + 1 : 1;

      // ── Phase 1: Atmosphere ──
      // Subtle radial field
      const atmosAlpha = Math.min(t / 2000, 0.04);
      const atmos = ctx.createRadialGradient(cx, cy, 10, cx, cy, 160);
      atmos.addColorStop(0, rgba(atmosAlpha * 1.5));
      atmos.addColorStop(0.5, rgba(atmosAlpha * 0.5));
      atmos.addColorStop(1, 'transparent');
      ctx.fillStyle = atmos;
      ctx.fillRect(0, 0, SIZE, SIZE);

      // ── Phase 2: Nodes appear as scattered signals ──
      if (t > P1) {
        const nodePhase = Math.min((t - P1) / (P2 - P1), 1);

        nodes.forEach((node, i) => {
          const localP = Math.max(0, Math.min((nodePhase - node.appearDelay) / 0.25, 1));
          if (localP <= 0) return;

          const appear = easeOutCubic(localP);
          // During P2: still scattered; during P3+: converging
          const convergeP = t > P2 ? easeInOutQuart(Math.min((t - P2) / 1200, 1)) : 0;
          const nx = node.scatterX + (node.x - node.scatterX) * convergeP;
          const ny = node.scatterY + (node.y - node.scatterY) * convergeP;

          // Breathing offset in alive state
          const bx = isAlive ? Math.sin(t * 0.0008 + i * 0.7) * 1.5 : 0;
          const by = isAlive ? Math.cos(t * 0.001 + i * 0.5) * 1.2 : 0;
          const fx = nx + bx;
          const fy = ny + by;

          // Store current position for connection drawing
          (node as any)._cx = fx;
          (node as any)._cy = fy;

          // Influence halo (only after convergence)
          if (convergeP > 0.5 && node.importance > 0.4) {
            const haloR = (node.r + 8 + node.importance * 12) * breatheSlow;
            const haloA = (convergeP - 0.5) * 2 * node.importance * 0.06 * breathe;
            const halo = ctx.createRadialGradient(fx, fy, node.r, fx, fy, haloR);
            halo.addColorStop(0, rgba(haloA));
            halo.addColorStop(1, 'transparent');
            ctx.fillStyle = halo;
            ctx.beginPath();
            ctx.arc(fx, fy, haloR, 0, Math.PI * 2);
            ctx.fill();
          }

          // Node core
          const nodeAlpha = appear * (0.4 + node.importance * 0.6) * breathe;
          ctx.beginPath();
          ctx.arc(fx, fy, node.r * appear, 0, Math.PI * 2);
          ctx.fillStyle = i === 0 ? rgba(nodeAlpha) : rgba(nodeAlpha * 0.8);
          ctx.fill();

          // Tiny rim
          if (appear > 0.8 && node.importance > 0.3) {
            ctx.beginPath();
            ctx.arc(fx, fy, node.r * appear + 1, 0, Math.PI * 2);
            ctx.strokeStyle = rgba(nodeAlpha * 0.15);
            ctx.lineWidth = 0.4;
            ctx.stroke();
          }
        });
      }

      // ── Phase 3: Connections trace ──
      if (t > P2 + 400) {
        const connPhaseTotal = (t - P2 - 400) / (P3 - P2);

        connections.forEach((conn, ci) => {
          const localStart = conn.traceDelay;
          const localP = Math.max(0, Math.min((connPhaseTotal - localStart) / 0.3, 1));
          if (localP <= 0) return;

          const na = nodes[conn.a];
          const nb = nodes[conn.b];
          const ax = (na as any)._cx ?? na.x;
          const ay = (na as any)._cy ?? na.y;
          const bx = (nb as any)._cx ?? nb.x;
          const by = (nb as any)._cy ?? nb.y;

          const trace = easeOutQuint(localP);
          const ex = ax + (bx - ax) * trace;
          const ey = ay + (by - ay) * trace;

          const connAlpha = conn.intensity * 0.35 * breathe * (localP > 0.8 ? 1 : localP / 0.8);

          // Connection line
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(ex, ey);
          ctx.strokeStyle = rgba(connAlpha);
          ctx.lineWidth = 0.6;
          ctx.stroke();

          // Trace head glow
          if (trace < 1) {
            const g = ctx.createRadialGradient(ex, ey, 0, ex, ey, 4);
            g.addColorStop(0, rgba(0.6));
            g.addColorStop(1, 'transparent');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(ex, ey, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }

      // ── Phase 4: Core activation ──
      if (t > P4 - 400) {
        const coreP = easeOutCubic(Math.min((t - P4 + 400) / 800, 1));

        // Core radial pulse
        const coreR = 18 * coreP * breatheSlow;
        const coreG = ctx.createRadialGradient(
          (nodes[0] as any)._cx ?? cx, (nodes[0] as any)._cy ?? cy, 2,
          (nodes[0] as any)._cx ?? cx, (nodes[0] as any)._cy ?? cy, coreR
        );
        coreG.addColorStop(0, rgba(0.25 * coreP * breathe));
        coreG.addColorStop(0.6, rgba(0.08 * coreP * breathe));
        coreG.addColorStop(1, 'transparent');
        ctx.fillStyle = coreG;
        ctx.beginPath();
        ctx.arc((nodes[0] as any)._cx ?? cx, (nodes[0] as any)._cy ?? cy, coreR, 0, Math.PI * 2);
        ctx.fill();

        // Core ring
        if (coreP > 0.5) {
          const ringA = (coreP - 0.5) * 2 * 0.2 * breathe;
          ctx.beginPath();
          ctx.arc((nodes[0] as any)._cx ?? cx, (nodes[0] as any)._cy ?? cy, 12 * breatheSlow, 0, Math.PI * 2);
          ctx.strokeStyle = rgba(ringA);
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }

      // ── Phase 5: Signal pulses (alive state) ──
      if (isAlive) {
        // Spawn new signals periodically
        if (Math.random() < 0.012) {
          const ci = Math.floor(Math.random() * Math.min(connections.length, nodes.length));
          signals.push({
            connIdx: ci,
            progress: 0,
            speed: 0.003 + Math.random() * 0.004,
            active: true,
            direction: Math.random() > 0.5 ? 1 : -1,
          });
        }

        // Update and draw signals
        for (let si = signals.length - 1; si >= 0; si--) {
          const s = signals[si];
          s.progress += s.speed;
          if (s.progress > 1) { signals.splice(si, 1); continue; }

          const conn = connections[s.connIdx];
          if (!conn) { signals.splice(si, 1); continue; }
          const na = nodes[conn.a];
          const nb = nodes[conn.b];
          const ax = (na as any)._cx ?? na.x;
          const ay = (na as any)._cy ?? na.y;
          const bx = (nb as any)._cx ?? nb.x;
          const by = (nb as any)._cy ?? nb.y;

          const p = s.direction > 0 ? s.progress : 1 - s.progress;
          const sx = ax + (bx - ax) * p;
          const sy = ay + (by - ay) * p;
          const alpha = Math.sin(s.progress * Math.PI) * 0.7;

          const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, 3);
          sg.addColorStop(0, rgba(alpha));
          sg.addColorStop(1, 'transparent');
          ctx.fillStyle = sg;
          ctx.beginPath();
          ctx.arc(sx, sy, 3, 0, Math.PI * 2);
          ctx.fill();
        }

        // Periodic core expansion pulse
        const pulsePhase = ((t - ALIVE) % 6000) / 6000;
        if (pulsePhase < 0.15) {
          const pp = pulsePhase / 0.15;
          const pulseR = 8 + 50 * easeOutCubic(pp);
          const pulseA = (1 - pp) * 0.05;
          ctx.beginPath();
          ctx.arc((nodes[0] as any)._cx ?? cx, (nodes[0] as any)._cy ?? cy, pulseR, 0, Math.PI * 2);
          ctx.strokeStyle = rgba(pulseA);
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [accentColor]);

  return (
    <div className="relative w-[280px] h-[280px] md:w-[320px] md:h-[320px]">
      <canvas
        ref={canvasRef}
        className="w-full h-full pointer-events-none"
        style={{ width: 320, height: 320 }}
      />
    </div>
  );
};

/* --- Nutrition: Metabolic Orbital Synchronisation Console --- */
export const NutritionHeroVisual = ({ accentColor }: { accentColor: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const SIZE = 320;
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    canvas.style.width = `${SIZE}px`;
    canvas.style.height = `${SIZE}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cx = SIZE / 2;
    const cy = SIZE / 2;
    let animId: number;
    let start: number | null = null;

    const hexToRgb = (hex: string) => ({
      r: parseInt(hex.slice(1, 3), 16),
      g: parseInt(hex.slice(3, 5), 16),
      b: parseInt(hex.slice(5, 7), 16),
    });
    const ac = hexToRgb(accentColor);
    const rgba = (a: number) => `rgba(${ac.r},${ac.g},${ac.b},${a})`;
    const wRgba = (a: number) => `rgba(255,255,255,${a})`;
    // Secondary tones for layers
    const rgba2 = (a: number) => `rgba(${Math.min(ac.r + 30, 255)},${Math.min(ac.g + 15, 255)},${ac.b},${a})`;
    const rgba3 = (a: number) => `rgba(${Math.max(ac.r - 20, 0)},${ac.g},${Math.min(ac.b + 30, 255)},${a})`;

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
    const easeInOutQuart = (t: number) => t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
    const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5);

    // Phase timing
    const P1 = 400;   // silence
    const P2 = 1200;  // reference marks appear
    const P3 = 2400;  // arcs trace
    const P4 = 3200;  // sync pulses + nodes activate
    const P5 = 3800;  // core stabilises
    const ALIVE = 4200;

    // Orbital arcs definition
    interface OrbitalArc {
      r: number;
      startDeg: number;
      spanDeg: number;
      width: number;
      colorFn: (a: number) => string;
      traceOffset: number; // 0-1 stagger within P3
      label: string;
    }

    const arcs: OrbitalArc[] = [
      { r: 130, startDeg: -60, spanDeg: 200, width: 1.2, colorFn: rgba, traceOffset: 0, label: 'PRO' },
      { r: 130, startDeg: 170, spanDeg: 80, width: 0.6, colorFn: rgba, traceOffset: 0.3, label: '' },
      { r: 108, startDeg: -110, spanDeg: 250, width: 1.0, colorFn: rgba2, traceOffset: 0.08, label: 'CHO' },
      { r: 108, startDeg: 170, spanDeg: 60, width: 0.5, colorFn: rgba2, traceOffset: 0.35, label: '' },
      { r: 86, startDeg: -30, spanDeg: 180, width: 0.9, colorFn: rgba3, traceOffset: 0.15, label: 'FAT' },
      { r: 86, startDeg: 180, spanDeg: 100, width: 0.5, colorFn: rgba3, traceOffset: 0.38, label: '' },
      { r: 64, startDeg: -140, spanDeg: 220, width: 0.7, colorFn: rgba, traceOffset: 0.22, label: 'SUP' },
      { r: 64, startDeg: 110, spanDeg: 70, width: 0.4, colorFn: rgba, traceOffset: 0.42, label: '' },
    ];

    // Sync nodes on arcs
    interface SyncNode {
      arcIdx: number;
      angleDeg: number;
      r: number;
      size: number;
      pulseDelay: number;
    }

    const syncNodes: SyncNode[] = [
      { arcIdx: 0, angleDeg: 40, r: 130, size: 2.8, pulseDelay: 0 },
      { arcIdx: 0, angleDeg: -30, r: 130, size: 2.2, pulseDelay: 0.2 },
      { arcIdx: 2, angleDeg: -80, r: 108, size: 2.5, pulseDelay: 0.1 },
      { arcIdx: 2, angleDeg: 60, r: 108, size: 2.0, pulseDelay: 0.3 },
      { arcIdx: 4, angleDeg: 10, r: 86, size: 2.4, pulseDelay: 0.15 },
      { arcIdx: 4, angleDeg: 120, r: 86, size: 1.8, pulseDelay: 0.35 },
      { arcIdx: 6, angleDeg: -100, r: 64, size: 2.2, pulseDelay: 0.25 },
      { arcIdx: 6, angleDeg: 30, r: 64, size: 1.6, pulseDelay: 0.4 },
    ];

    // Cross-layer sync lines
    const syncLines = [
      { from: 0, to: 2 }, { from: 1, to: 3 },
      { from: 2, to: 4 }, { from: 4, to: 6 },
      { from: 5, to: 7 }, { from: 3, to: 5 },
    ];

    const drawArc = (r: number, startRad: number, endRad: number, lw: number, color: string) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, startRad, endRad);
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
      ctx.lineCap = 'round';
      ctx.stroke();
    };

    // Tick marks for each orbital ring
    const TICKS_PER_RING = [48, 36, 28, 20];

    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const t = timestamp - start;
      ctx.clearRect(0, 0, SIZE, SIZE);

      const isAlive = t > ALIVE;
      const breathe = isAlive ? Math.sin(t * 0.0007) * 0.05 + 1 : 1;
      const breatheSlow = isAlive ? Math.sin(t * 0.0004) * 0.03 + 1 : 1;

      // ── Atmosphere ──
      const atmosA = Math.min(t / 3000, 0.035);
      const atmos = ctx.createRadialGradient(cx, cy, 15, cx, cy, 160);
      atmos.addColorStop(0, rgba(atmosA * 2));
      atmos.addColorStop(0.5, rgba(atmosA * 0.6));
      atmos.addColorStop(1, 'transparent');
      ctx.fillStyle = atmos;
      ctx.fillRect(0, 0, SIZE, SIZE);

      // ── Phase 2: Reference ticks on orbital rings ──
      if (t > P1) {
        const tickP = easeOutCubic(Math.min((t - P1) / (P2 - P1), 1));
        const ringRadii = [130, 108, 86, 64];

        ringRadii.forEach((r, ri) => {
          const numTicks = TICKS_PER_RING[ri];
          for (let i = 0; i < numTicks; i++) {
            const angle = (i / numTicks) * Math.PI * 2 - Math.PI / 2;
            const stagger = (i / numTicks);
            const localP = easeOutCubic(Math.max(0, Math.min((tickP - stagger * 0.4 - ri * 0.1) / 0.4, 1)));
            if (localP <= 0) continue;

            const isMajor = i % (numTicks / 4) === 0;
            const isMinor = i % (numTicks / 12) === 0;
            const outerR = r + 3;
            const innerR = isMajor ? r - 4 : isMinor ? r - 2 : r - 1;
            const lw = isMajor ? 0.8 : isMinor ? 0.4 : 0.2;
            const alpha = (isMajor ? 0.25 : isMinor ? 0.12 : 0.05) * localP * breathe;

            ctx.beginPath();
            ctx.moveTo(cx + outerR * Math.cos(angle), cy + outerR * Math.sin(angle));
            ctx.lineTo(cx + innerR * Math.cos(angle), cy + innerR * Math.sin(angle));
            ctx.strokeStyle = wRgba(alpha);
            ctx.lineWidth = lw;
            ctx.stroke();
          }
        });
      }

      // ── Phase 3: Orbital arcs trace ──
      if (t > P2 * 0.8) {
        const arcPhaseTotal = Math.min((t - P2 * 0.8) / (P3 - P2), 1);

        arcs.forEach((arc) => {
          const localP = Math.max(0, Math.min((arcPhaseTotal - arc.traceOffset) / 0.5, 1));
          if (localP <= 0) return;

          const trace = easeInOutQuart(localP);
          const startRad = (arc.startDeg * Math.PI) / 180;
          const endRad = startRad + (arc.spanDeg * Math.PI / 180) * trace;
          const alpha = 0.45 * localP * breathe;

          drawArc(arc.r * breatheSlow, startRad, endRad, arc.width, arc.colorFn(alpha));

          // Trace head glow during draw
          if (trace < 1 && trace > 0) {
            const hx = cx + arc.r * Math.cos(endRad);
            const hy = cy + arc.r * Math.sin(endRad);
            const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, 5);
            g.addColorStop(0, arc.colorFn(0.7));
            g.addColorStop(1, 'transparent');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(hx, hy, 5, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }

      // ── Phase 4: Sync nodes activate ──
      if (t > P3 * 0.8) {
        const nodeP = Math.min((t - P3 * 0.8) / (P4 - P3), 1);

        syncNodes.forEach((node, ni) => {
          const localP = easeOutCubic(Math.max(0, Math.min((nodeP - node.pulseDelay) / 0.3, 1)));
          if (localP <= 0) return;

          const rad = (node.angleDeg * Math.PI) / 180;
          const nx = cx + node.r * breatheSlow * Math.cos(rad);
          const ny = cy + node.r * breatheSlow * Math.sin(rad);

          // Breathing offset in alive state
          const bx = isAlive ? Math.sin(t * 0.0009 + ni * 1.1) * 0.8 : 0;
          const by = isAlive ? Math.cos(t * 0.0007 + ni * 0.9) * 0.6 : 0;
          const fx = nx + bx;
          const fy = ny + by;

          // Store position
          (node as any)._fx = fx;
          (node as any)._fy = fy;

          // Halo
          if (localP > 0.5) {
            const haloR = (node.size + 6) * breathe;
            const haloA = (localP - 0.5) * 2 * 0.08;
            const halo = ctx.createRadialGradient(fx, fy, node.size, fx, fy, haloR);
            halo.addColorStop(0, rgba(haloA));
            halo.addColorStop(1, 'transparent');
            ctx.fillStyle = halo;
            ctx.beginPath();
            ctx.arc(fx, fy, haloR, 0, Math.PI * 2);
            ctx.fill();
          }

          // Node dot
          ctx.beginPath();
          ctx.arc(fx, fy, node.size * localP, 0, Math.PI * 2);
          ctx.fillStyle = rgba(0.6 * localP * breathe);
          ctx.fill();
        });

        // Sync lines between layers
        if (nodeP > 0.4) {
          const lineP = easeOutQuint(Math.min((nodeP - 0.4) / 0.5, 1));

          syncLines.forEach((sl, si) => {
            const nA = syncNodes[sl.from];
            const nB = syncNodes[sl.to];
            const ax = (nA as any)._fx ?? cx;
            const ay = (nA as any)._fy ?? cy;
            const bx = (nB as any)._fx ?? cx;
            const by = (nB as any)._fy ?? cy;

            const stagger = si * 0.12;
            const localLine = easeOutCubic(Math.max(0, Math.min((lineP - stagger) / 0.4, 1)));
            if (localLine <= 0) return;

            const ex = ax + (bx - ax) * localLine;
            const ey = ay + (by - ay) * localLine;

            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(ex, ey);
            ctx.strokeStyle = rgba(0.1 * localLine * breathe);
            ctx.lineWidth = 0.4;
            ctx.stroke();

            // Trace head
            if (localLine < 1) {
              const g = ctx.createRadialGradient(ex, ey, 0, ex, ey, 3);
              g.addColorStop(0, rgba(0.5));
              g.addColorStop(1, 'transparent');
              ctx.fillStyle = g;
              ctx.beginPath();
              ctx.arc(ex, ey, 3, 0, Math.PI * 2);
              ctx.fill();
            }
          });
        }
      }

      // ── Phase 5: Core stabilisation ──
      if (t > P4) {
        const coreP = easeOutCubic(Math.min((t - P4) / (P5 - P4), 1));

        // Core nucleus
        const coreR = 14 * coreP * breatheSlow;
        const coreG = ctx.createRadialGradient(cx, cy, 2, cx, cy, coreR);
        coreG.addColorStop(0, rgba(0.35 * coreP * breathe));
        coreG.addColorStop(0.5, rgba(0.12 * coreP * breathe));
        coreG.addColorStop(1, 'transparent');
        ctx.fillStyle = coreG;
        ctx.beginPath();
        ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(cx, cy, 3 * coreP, 0, Math.PI * 2);
        ctx.fillStyle = rgba(0.7 * coreP * breathe);
        ctx.fill();

        // Core ring
        if (coreP > 0.5) {
          ctx.beginPath();
          ctx.arc(cx, cy, 8 * breatheSlow, 0, Math.PI * 2);
          ctx.strokeStyle = rgba(0.15 * (coreP - 0.5) * 2 * breathe);
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }

        // Cross-hairs
        if (coreP > 0.7) {
          const chA = (coreP - 0.7) / 0.3 * 0.12 * breathe;
          const chLen = 20;
          [0, Math.PI / 2, Math.PI, Math.PI * 1.5].forEach(angle => {
            ctx.beginPath();
            ctx.moveTo(cx + 12 * Math.cos(angle), cy + 12 * Math.sin(angle));
            ctx.lineTo(cx + chLen * Math.cos(angle), cy + chLen * Math.sin(angle));
            ctx.strokeStyle = rgba(chA);
            ctx.lineWidth = 0.3;
            ctx.stroke();
          });
        }

        // Radial connection lines from core to inner ring
        if (coreP > 0.8) {
          const rcA = (coreP - 0.8) / 0.2 * 0.06 * breathe;
          for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(cx + 22 * Math.cos(angle), cy + 22 * Math.sin(angle));
            ctx.lineTo(cx + 58 * Math.cos(angle), cy + 58 * Math.sin(angle));
            ctx.strokeStyle = rgba(rcA);
            ctx.lineWidth = 0.2;
            ctx.stroke();
          }
        }
      }

      // ── Alive state: coordinated sync pulses ──
      if (isAlive) {
        // Orbital sweep — one per layer, slow
        const sweepLayers = [130, 108, 86, 64];
        sweepLayers.forEach((r, li) => {
          const sweepPeriod = 8000 + li * 2000;
          const sweepAngle = ((t - ALIVE + li * 500) % sweepPeriod) / sweepPeriod * Math.PI * 2 - Math.PI / 2;
          const sx = cx + r * breatheSlow * Math.cos(sweepAngle);
          const sy = cy + r * breatheSlow * Math.sin(sweepAngle);
          const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, 4);
          sg.addColorStop(0, rgba(0.25 * breathe));
          sg.addColorStop(1, 'transparent');
          ctx.fillStyle = sg;
          ctx.beginPath();
          ctx.arc(sx, sy, 4, 0, Math.PI * 2);
          ctx.fill();
        });

        // Periodic radial sync wave
        const wavePeriod = 7000;
        const wavePhase = ((t - ALIVE) % wavePeriod) / wavePeriod;
        if (wavePhase < 0.2) {
          const wp = wavePhase / 0.2;
          const waveR = 20 + 120 * easeOutCubic(wp);
          const waveA = (1 - wp) * 0.04;
          ctx.beginPath();
          ctx.arc(cx, cy, waveR, 0, Math.PI * 2);
          ctx.strokeStyle = rgba(waveA);
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [accentColor]);

  return (
    <div className="relative w-[280px] h-[280px] md:w-[320px] md:h-[320px]">
      <canvas
        ref={canvasRef}
        className="w-full h-full pointer-events-none"
        style={{ width: 320, height: 320 }}
      />
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   PROGRESS HERO — Premium Evolution Trajectory
   Canvas-based precision trend visualization
   ═══════════════════════════════════════════════════════ */

export const ProgressHeroVisual = ({ accentColor }: { accentColor: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = 320;
    const H = 260;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Parse accent color
    const hexToRgb = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return { r, g, b };
    };
    const ac = hexToRgb(accentColor);
    const rgba = (a: number) => `rgba(${ac.r},${ac.g},${ac.b},${a})`;

    // Curve data — aspirational ascent with micro-corrections
    const dataPoints = [
      { x: 0.04, y: 0.82 },
      { x: 0.12, y: 0.76 },
      { x: 0.20, y: 0.70 },
      { x: 0.28, y: 0.73 }, // dip
      { x: 0.36, y: 0.62 },
      { x: 0.44, y: 0.55 },
      { x: 0.50, y: 0.58 }, // dip
      { x: 0.58, y: 0.48 },
      { x: 0.66, y: 0.40 },
      { x: 0.74, y: 0.35 },
      { x: 0.82, y: 0.30 },
      { x: 0.90, y: 0.22 },
      { x: 0.96, y: 0.16 },
    ];

    const chartL = 30;
    const chartR = W - 20;
    const chartT = 40;
    const chartB = H - 40;
    const chartW = chartR - chartL;
    const chartH = chartB - chartT;

    const toCanvas = (p: { x: number; y: number }) => ({
      cx: chartL + p.x * chartW,
      cy: chartT + p.y * chartH,
    });

    // Easing
    const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);
    const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    // Phases (ms)
    const P = {
      gridStart: 200,
      gridEnd: 1000,
      traceStart: 800,
      traceEnd: 3200,
      dotsStart: 1600,
      dotsEnd: 3600,
      finalDotStart: 3400,
      aliveStart: 4000,
    };

    const startTime = performance.now();
    let animId: number;

    // Baseline (average trend line)
    const baselineY = 0.52;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      ctx.clearRect(0, 0, W, H);

      // --- Phase 1: Grid reference lines ---
      const gridP = Math.max(0, Math.min(1, (elapsed - P.gridStart) / (P.gridEnd - P.gridStart)));
      if (gridP > 0) {
        const gAlpha = easeOutQuart(gridP) * 0.06;
        ctx.strokeStyle = `rgba(255,255,255,${gAlpha})`;
        ctx.lineWidth = 0.4;
        // Horizontal
        for (let i = 0; i < 5; i++) {
          const y = chartT + (chartH / 4) * i;
          ctx.beginPath();
          ctx.moveTo(chartL, y);
          ctx.lineTo(chartR, y);
          ctx.stroke();
        }
        // Vertical subtle ticks
        for (let i = 0; i < 7; i++) {
          const x = chartL + (chartW / 6) * i;
          ctx.beginPath();
          ctx.moveTo(x, chartB);
          ctx.lineTo(x, chartB + 4);
          ctx.stroke();
        }
      }

      // --- Baseline ---
      const blP = Math.max(0, Math.min(1, (elapsed - P.gridStart) / 600));
      if (blP > 0) {
        const blAlpha = easeOutQuart(blP) * 0.08;
        const blY = chartT + baselineY * chartH;
        ctx.setLineDash([3, 4]);
        ctx.strokeStyle = `rgba(255,255,255,${blAlpha})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(chartL, blY);
        ctx.lineTo(chartL + chartW * easeOutQuart(blP), blY);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // --- Phase 2+3: Curve trace ---
      const traceP = Math.max(0, Math.min(1, (elapsed - P.traceStart) / (P.traceEnd - P.traceStart)));
      if (traceP > 0) {
        const progress = easeInOutCubic(traceP);
        const pts = dataPoints.map(toCanvas);
        const visibleCount = Math.max(2, Math.ceil(pts.length * progress));
        const visiblePts = pts.slice(0, visibleCount);

        // Partial last segment
        if (visibleCount < pts.length && progress < 1) {
          const frac = (pts.length * progress) - Math.floor(pts.length * progress);
          const prev = pts[visibleCount - 1];
          const next = pts[visibleCount];
          if (next) {
            visiblePts.push({
              cx: prev.cx + (next.cx - prev.cx) * frac,
              cy: prev.cy + (next.cy - prev.cy) * frac,
            });
          }
        }

        // Draw area fill (subtle gradient under curve)
        if (visiblePts.length >= 2) {
          const areaGrad = ctx.createLinearGradient(0, chartT, 0, chartB);
          areaGrad.addColorStop(0, rgba(0.12 * progress));
          areaGrad.addColorStop(0.6, rgba(0.04 * progress));
          areaGrad.addColorStop(1, rgba(0));

          ctx.beginPath();
          ctx.moveTo(visiblePts[0].cx, visiblePts[0].cy);
          for (let i = 1; i < visiblePts.length; i++) {
            const prev = visiblePts[i - 1];
            const curr = visiblePts[i];
            const cpx = (prev.cx + curr.cx) / 2;
            ctx.quadraticCurveTo(prev.cx + (cpx - prev.cx) * 0.8, prev.cy, cpx, (prev.cy + curr.cy) / 2);
            ctx.quadraticCurveTo(curr.cx - (curr.cx - cpx) * 0.8, curr.cy, curr.cx, curr.cy);
          }
          const last = visiblePts[visiblePts.length - 1];
          ctx.lineTo(last.cx, chartB);
          ctx.lineTo(visiblePts[0].cx, chartB);
          ctx.closePath();
          ctx.fillStyle = areaGrad;
          ctx.fill();
        }

        // Draw main curve
        if (visiblePts.length >= 2) {
          ctx.beginPath();
          ctx.moveTo(visiblePts[0].cx, visiblePts[0].cy);
          for (let i = 1; i < visiblePts.length; i++) {
            const prev = visiblePts[i - 1];
            const curr = visiblePts[i];
            const cpx = (prev.cx + curr.cx) / 2;
            ctx.quadraticCurveTo(prev.cx + (cpx - prev.cx) * 0.8, prev.cy, cpx, (prev.cy + curr.cy) / 2);
            ctx.quadraticCurveTo(curr.cx - (curr.cx - cpx) * 0.8, curr.cy, curr.cx, curr.cy);
          }
          ctx.strokeStyle = rgba(0.9);
          ctx.lineWidth = 1.8;
          ctx.stroke();

          // Subtle glow on the line
          ctx.strokeStyle = rgba(0.15);
          ctx.lineWidth = 6;
          ctx.stroke();
        }
      }

      // --- Phase 4: Data milestone dots ---
      const dotP = Math.max(0, Math.min(1, (elapsed - P.dotsStart) / (P.dotsEnd - P.dotsStart)));
      if (dotP > 0) {
        const pts = dataPoints.map(toCanvas);
        // Only show milestone dots (not all)
        const milestones = [0, 3, 6, 9, 12];
        milestones.forEach((idx, mi) => {
          const dp = Math.max(0, Math.min(1, (dotP - mi * 0.15) / 0.3));
          if (dp <= 0 || idx >= pts.length) return;
          const p = pts[idx];
          const isLast = idx === dataPoints.length - 1;
          const a = easeOutQuart(dp);

          // Outer ring
          ctx.beginPath();
          ctx.arc(p.cx, p.cy, isLast ? 5 : 3, 0, Math.PI * 2);
          ctx.strokeStyle = rgba(a * 0.5);
          ctx.lineWidth = 0.6;
          ctx.stroke();

          // Inner dot
          ctx.beginPath();
          ctx.arc(p.cx, p.cy, isLast ? 2.5 : 1.5, 0, Math.PI * 2);
          ctx.fillStyle = rgba(a * 0.9);
          ctx.fill();
        });
      }

      // --- Phase 5: Final point hero + alive state ---
      const finalP = Math.max(0, Math.min(1, (elapsed - P.finalDotStart) / 800));
      if (finalP > 0) {
        const lastPt = toCanvas(dataPoints[dataPoints.length - 1]);
        const a = easeOutQuart(finalP);

        // Radial confirmation wave
        if (finalP > 0.3 && finalP < 1) {
          const waveP = (finalP - 0.3) / 0.7;
          ctx.beginPath();
          ctx.arc(lastPt.cx, lastPt.cy, 8 + waveP * 20, 0, Math.PI * 2);
          ctx.strokeStyle = rgba((1 - waveP) * 0.15);
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }

        // Value label near final dot
        if (a > 0.5) {
          const labelA = Math.min(1, (a - 0.5) * 2);
          ctx.font = `600 ${9}px -apple-system, system-ui, sans-serif`;
          ctx.fillStyle = rgba(labelA * 0.7);
          ctx.textAlign = 'center';
          ctx.fillText('+12%', lastPt.cx, lastPt.cy - 14);
        }
      }

      // --- Alive: breathing ---
      if (elapsed > P.aliveStart) {
        const aliveT = (elapsed - P.aliveStart) * 0.001;
        const lastPt = toCanvas(dataPoints[dataPoints.length - 1]);
        const breathe = 0.5 + 0.5 * Math.sin(aliveT * 0.8);

        // Breathing halo
        ctx.beginPath();
        ctx.arc(lastPt.cx, lastPt.cy, 8 + breathe * 4, 0, Math.PI * 2);
        ctx.fillStyle = rgba(0.04 + breathe * 0.06);
        ctx.fill();

        // Steady core dot
        ctx.beginPath();
        ctx.arc(lastPt.cx, lastPt.cy, 3, 0, Math.PI * 2);
        ctx.fillStyle = rgba(0.95);
        ctx.fill();

        // Subtle scanline sweep (periodic)
        const sweepCycle = aliveT % 6;
        if (sweepCycle < 1.5) {
          const sweepX = chartL + (sweepCycle / 1.5) * chartW;
          const grad = ctx.createLinearGradient(sweepX - 15, 0, sweepX + 15, 0);
          grad.addColorStop(0, rgba(0));
          grad.addColorStop(0.5, rgba(0.06));
          grad.addColorStop(1, rgba(0));
          ctx.fillStyle = grad;
          ctx.fillRect(sweepX - 15, chartT, 30, chartH);
        }
      }

      // --- Axis labels (minimal) ---
      if (gridP > 0.5) {
        const labelA = Math.min(1, (gridP - 0.5) * 2) * 0.25;
        ctx.font = `500 ${7}px -apple-system, system-ui, sans-serif`;
        ctx.fillStyle = `rgba(255,255,255,${labelA})`;
        ctx.textAlign = 'left';
        ctx.fillText('SEM 1', chartL, chartB + 14);
        ctx.textAlign = 'right';
        ctx.fillText('SEM 12', chartR, chartB + 14);
        ctx.textAlign = 'center';
        ctx.fillText('HOY', chartR - 5, chartB + 14);
      }

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [accentColor]);

  return (
    <div className="relative flex items-center justify-center" style={{ width: 320, height: 260 }}>
      <canvas ref={canvasRef} className="relative z-10" />
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   STUBS for backward compat
   ═══════════════════════════════════════════════════════ */

export const StrokeIcon = TrainingHeroVisual as any;
export const NetworkNodes = () => null;
export const ChartEndDot = () => null;
