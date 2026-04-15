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
