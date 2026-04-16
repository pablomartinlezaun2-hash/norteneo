import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashScreenProps {
  onComplete: () => void;
}

/* ── Timing (compressed ~6s total) ── */
const T = {
  INIT: 0,       // 0.0 – 0.8s  → awakening
  SING: 0.8,     // 0.8 – 1.6s  → singularity forms
  ACCEL: 1.6,    // 1.6 – 3.2s  → tunnel + acceleration
  PEAK: 3.2,     // 3.2 – 3.8s  → max velocity
  BURST: 3.8,    // 3.8 – 4.3s  → creation flash
  LOGO: 4.3,     // 4.3 – 5.2s  → logo materializes
  HOLD: 5.2,     // 5.2 – 6.2s  → final state + text
  END: 6.5,
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const sat = (t: number) => Math.max(0, Math.min(1, t));
const easeIn = (t: number) => t * t * t;
const easeOut = (t: number) => 1 - (1 - t) ** 3;
const easeIO = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

/* ── Particle pool ── */
interface Dot {
  ax: number; ay: number; // anchor position (relative to center)
  z: number;
  s: number;  // speed factor
  r: number;  // radius
  a: number;  // base alpha
}

interface Ray {
  ang: number; dist: number; len: number; spd: number; w: number; a: number;
}

function createDots(cw: number, ch: number, n: number): Dot[] {
  const maxR = Math.hypot(cw, ch) * 0.55;
  return Array.from({ length: n }, () => {
    const ang = Math.random() * Math.PI * 2;
    const dist = Math.random() * maxR;
    return {
      ax: Math.cos(ang) * dist,
      ay: Math.sin(ang) * dist,
      z: 50 + Math.random() * 950,
      s: 0.3 + Math.random() * 0.7,
      r: 0.4 + Math.random() * 1.2,
      a: 0.15 + Math.random() * 0.45,
    };
  });
}

function createRays(n: number): Ray[] {
  return Array.from({ length: n }, () => ({
    ang: Math.random() * Math.PI * 2,
    dist: 20 + Math.random() * 120,
    len: 30 + Math.random() * 80,
    spd: 3 + Math.random() * 6,
    w: 0.3 + Math.random() * 1.2,
    a: 0.08 + Math.random() * 0.2,
  }));
}

/* ── Logo pixel sampler ── */
function sampleLogo(cw: number, _ch: number) {
  const fs = Math.min(cw * 0.3, 110);
  const sw = Math.ceil(fs * 3);
  const sh = Math.ceil(fs * 1.4);
  const c = document.createElement('canvas');
  c.width = sw; c.height = sh;
  const x = c.getContext('2d')!;
  x.fillStyle = '#fff';
  x.font = `900 ${fs}px system-ui, -apple-system, sans-serif`;
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillText('NEO', sw / 2, sh / 2);
  const d = x.getImageData(0, 0, sw, sh).data;
  const pts: { tx: number; ty: number }[] = [];
  const step = 2;
  for (let y = 0; y < sh; y += step)
    for (let xi = 0; xi < sw; xi += step)
      if (d[(y * sw + xi) * 4 + 3] > 100)
        pts.push({ tx: xi - sw / 2, ty: y - sh / 2 });
  return { pts, fontSize: fs };
}

/* ── Component ── */
export const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [stage, setStage] = useState<'pre' | 'run' | 'out'>('pre');
  const cvRef = useRef<HTMLCanvasElement>(null);
  const raf = useRef(0);
  const t0 = useRef(0);
  const done = useRef(false);

  // Mutable state
  const dots = useRef<Dot[]>([]);
  const rays = useRef<Ray[]>([]);
  const logoPts = useRef<{ x: number; y: number; tx: number; ty: number; a: number }[]>([]);
  const logoFS = useRef(80);

  const go = useCallback(() => {
    setStage('run');
    const cv = cvRef.current!;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const cw = cv.clientWidth;
    const ch = cv.clientHeight;
    cv.width = cw * dpr;
    cv.height = ch * dpr;
    const ctx = cv.getContext('2d', { alpha: false })!;
    ctx.scale(dpr, dpr);

    dots.current = createDots(cw, ch, 200);
    rays.current = createRays(60);

    const logo = sampleLogo(cw, ch);
    logoFS.current = logo.fontSize;
    const maxR = Math.hypot(cw, ch);
    logoPts.current = logo.pts.map(p => ({
      x: (Math.random() - 0.5) * maxR,
      y: (Math.random() - 0.5) * maxR,
      tx: p.tx, ty: p.ty,
      a: 0,
    }));

    t0.current = performance.now();

    const frame = () => {
      const t = (performance.now() - t0.current) / 1000;
      draw(ctx, cw, ch, t);
      if (t < T.END + 0.6) {
        raf.current = requestAnimationFrame(frame);
      } else if (!done.current) {
        done.current = true;
        setStage('out');
        setTimeout(onComplete, 350);
      }
    };
    raf.current = requestAnimationFrame(frame);
  }, [onComplete]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  /* ════════════════ DRAW ════════════════ */
  const draw = useCallback((ctx: CanvasRenderingContext2D, cw: number, ch: number, t: number) => {
    const cx = cw / 2, cy = ch / 2;

    // Clear
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, cw, ch);

    // ── PHASE 1: Awakening (0 → 0.8s) ──
    const awake = sat(t / T.SING);  // 0→1 over first 0.8s
    const singP = sat((t - T.SING) / (T.ACCEL - T.SING)); // singularity progress

    if (t < T.ACCEL) {
      // Particles compress toward center
      const pull = 0.01 + awake * 0.03 + singP * 0.06;
      for (const d of dots.current) {
        d.ax *= (1 - pull * d.s);
        d.ay *= (1 - pull * d.s);
        const sx = cx + d.ax;
        const sy = cy + d.ay;
        const dist = Math.hypot(d.ax, d.ay);
        const fade = sat(1 - dist / (Math.max(cw, ch) * 0.5));
        const alpha = d.a * easeIn(awake) * 0.5 * fade;
        if (alpha < 0.005) continue;
        ctx.beginPath();
        ctx.arc(sx, sy, d.r * (0.6 + fade * 0.4), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(190,215,240,${alpha})`;
        ctx.fill();
      }

      // Central singularity glow
      const glowR = 20 + awake * 30 + singP * 50;
      const glowA = easeIn(awake) * 0.15 + singP * 0.25;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
      g.addColorStop(0, `rgba(200,225,245,${glowA})`);
      g.addColorStop(0.5, `rgba(150,190,220,${glowA * 0.3})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, cw, ch);

      // Compression rings
      if (singP > 0) {
        for (let i = 0; i < 4; i++) {
          const rp = sat(singP - i * 0.12);
          if (rp <= 0) continue;
          const r = 10 + i * 18 + (1 - easeOut(rp)) * 70;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(170,210,235,${rp * 0.12})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }

    // ── PHASE 2: Tunnel + acceleration (1.6 → 3.8s) ──
    if (t >= T.ACCEL && t < T.BURST) {
      const tun = sat((t - T.ACCEL) / (T.PEAK - T.ACCEL)); // 0→1 tunnel
      const peak = sat((t - T.PEAK) / (T.BURST - T.PEAK));  // 0→1 max speed
      const speed = 0.6 + easeIn(tun) * 10 + peak * 8;

      // Z-axis starfield
      for (const d of dots.current) {
        d.z -= speed * d.s * 14;
        if (d.z < 1) {
          d.z = 700 + Math.random() * 300;
          d.ax = (Math.random() - 0.5) * cw * 1.4;
          d.ay = (Math.random() - 0.5) * ch * 1.4;
        }
        const p = 300 / d.z;
        const sx = cx + d.ax * p;
        const sy = cy + d.ay * p;
        if (sx < -20 || sx > cw + 20 || sy < -20 || sy > ch + 20) continue;

        const alpha = sat(p * 0.7) * d.a * (0.5 + tun * 0.5);
        const streak = Math.min(speed * 1.8 * p, 50);
        const ang = Math.atan2(d.ay, d.ax);

        if (streak > 2) {
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx - Math.cos(ang) * streak, sy - Math.sin(ang) * streak);
          ctx.strokeStyle = `rgba(200,220,245,${alpha * 0.6})`;
          ctx.lineWidth = d.r * p * 0.4;
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(sx, sy, Math.max(0.3, d.r * p * 0.6), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(210,230,250,${alpha})`;
        ctx.fill();
      }

      // Radial rays
      const rayA = 0.06 + tun * 0.2 + peak * 0.15;
      for (const r of rays.current) {
        r.dist += r.spd * speed * 0.5;
        if (r.dist > Math.max(cw, ch) * 0.65) {
          r.dist = 8 + Math.random() * 20;
          r.ang = Math.random() * Math.PI * 2;
        }
        const x1 = cx + Math.cos(r.ang) * r.dist;
        const y1 = cy + Math.sin(r.ang) * r.dist;
        const l = r.len * (0.4 + tun * 0.6 + peak * 0.6);
        const x2 = cx + Math.cos(r.ang) * (r.dist + l);
        const y2 = cy + Math.sin(r.ang) * (r.dist + l);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = `rgba(185,210,235,${r.a * rayA})`;
        ctx.lineWidth = r.w;
        ctx.stroke();
      }

      // Vignette
      const vg = ctx.createRadialGradient(cx, cy, Math.min(cw, ch) * 0.15, cx, cy, Math.max(cw, ch) * 0.65);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, `rgba(0,0,0,${0.5 + tun * 0.3})`);
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, cw, ch);
    }

    // ── PHASE 3: Creation burst (3.8 → 4.3s) ──
    if (t >= T.BURST && t < T.LOGO + 0.3) {
      const bp = sat((t - T.BURST) / (T.LOGO - T.BURST));
      // Flash
      const flash = bp < 0.25 ? easeOut(bp / 0.25) * 0.85 : lerp(0.85, 0, easeIn(sat((bp - 0.25) / 0.75)));
      if (flash > 0.005) {
        const fg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(cw, ch) * (0.2 + bp * 0.5));
        fg.addColorStop(0, `rgba(225,240,255,${flash})`);
        fg.addColorStop(0.35, `rgba(170,210,240,${flash * 0.4})`);
        fg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = fg;
        ctx.fillRect(0, 0, cw, ch);
      }
      // Shockwave ring
      const ringR = bp * Math.max(cw, ch) * 0.35;
      const ringA = (1 - bp) * 0.5;
      if (ringA > 0.01) {
        ctx.beginPath();
        ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(200,225,245,${ringA})`;
        ctx.lineWidth = 1.5 * (1 - bp);
        ctx.stroke();
      }
    }

    // ── PHASE 4: Logo convergence (4.3 → 5.2s) ──
    if (t >= T.BURST) {
      const cp = sat((t - T.BURST) / (T.HOLD - T.BURST)); // convergence 0→1
      const ce = easeIO(cp);

      // Particles converge
      const showPts = cp < 0.85; // hide particles once text is solid
      if (showPts) {
        for (const lp of logoPts.current) {
          lp.x = lerp(lp.x, lp.tx, ce * 0.2);
          lp.y = lerp(lp.y, lp.ty, ce * 0.2);
          lp.a = lerp(lp.a, 1, ce * 0.15);
          const sx = cx + lp.x, sy = cy + lp.y;
          if (sx < -10 || sx > cw + 10 || sy < -10 || sy > ch + 10) continue;
          ctx.beginPath();
          ctx.arc(sx, sy, 0.8 + ce * 0.4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(220,238,255,${lp.a * (0.4 + ce * 0.4)})`;
          ctx.fill();
        }
      }

      // Solid text
      if (cp > 0.3) {
        const ta = easeOut(sat((cp - 0.3) / 0.5));
        ctx.save();
        ctx.font = `900 ${logoFS.current}px system-ui, -apple-system, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (ta > 0.2) {
          ctx.shadowColor = `rgba(180,215,240,${ta * 0.4})`;
          ctx.shadowBlur = 25 * (1.2 - cp * 0.4);
        }
        ctx.fillStyle = `rgba(255,255,255,${ta})`;
        ctx.fillText('NEO', cx, cy);
        ctx.restore();
      }

      // Breathing glow in hold
      const holdP = sat((t - T.HOLD) / 1);
      if (holdP > 0) {
        const breath = 0.08 + Math.sin(t * 2) * 0.04;
        const bg = ctx.createRadialGradient(cx, cy, 5, cx, cy, 70);
        bg.addColorStop(0, `rgba(180,215,240,${breath * holdP})`);
        bg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = bg;
        ctx.fillRect(cx - 70, cy - 70, 140, 140);
      }
    }
  }, []);

  return (
    <AnimatePresence>
      {stage !== 'out' ? (
        <motion.div
          className="fixed inset-0 z-[100] bg-black"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* Pre-screen */}
          <AnimatePresence>
            {stage === 'pre' && (
              <motion.div
                className="absolute inset-0 flex flex-col items-center justify-center z-20"
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <motion.p
                  className="text-[12px] tracking-[0.3em] uppercase font-medium mb-10"
                  style={{ color: 'rgba(255,255,255,0.3)' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  Sube el volumen
                </motion.p>
                <motion.button
                  onClick={go}
                  className="px-7 py-2.5 rounded-full border text-[13px] font-semibold tracking-[0.18em] uppercase"
                  style={{
                    borderColor: 'rgba(255,255,255,0.12)',
                    color: 'rgba(255,255,255,0.75)',
                    background: 'rgba(255,255,255,0.02)',
                  }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  whileTap={{ scale: 0.96 }}
                >
                  Estoy listo
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Canvas */}
          <canvas
            ref={cvRef}
            className="absolute inset-0 w-full h-full"
            style={{ opacity: stage === 'run' ? 1 : 0 }}
          />

          {/* Final text overlay */}
          <FinalText visible={stage === 'run'} />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

/* ── Final text ── */
function FinalText({ visible }: { visible: boolean }) {
  const [sub, setSub] = useState(false);
  const [tag, setTag] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const a = setTimeout(() => setSub(true), (T.HOLD + 0.3) * 1000);
    const b = setTimeout(() => setTag(true), (T.HOLD + 0.8) * 1000);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [visible]);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-end pb-[18%] z-30 pointer-events-none">
      <AnimatePresence>
        {sub && (
          <motion.p
            className="text-[13px] font-medium tracking-[0.1em]"
            style={{ color: 'rgba(255,255,255,0.4)' }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            El rendimiento, rediseñado.
          </motion.p>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {tag && (
          <motion.p
            className="mt-3 text-[9px] tracking-[0.35em] uppercase font-medium"
            style={{ color: 'rgba(255,255,255,0.18)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            Planificación · Ejecución · Evolución
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
