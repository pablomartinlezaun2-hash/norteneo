import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashScreenProps {
  onComplete: () => void;
}

/* ═══════════════════════════════════════════════
   TIMING BEATS
   ═══════════════════════════════════════════════ */
const B = {
  TENSION_END: 1.5,
  SINGULARITY_END: 3.0,
  ACCEL_END: 5.5,
  PEAK_END: 7.0,
  CREATION_END: 8.0,
  STABLE_END: 9.0,
  DONE: 9.8,
};

/* ═══════════════════════════════════════════════
   MATH UTILS
   ═══════════════════════════════════════════════ */
const sat = (v: number) => v < 0 ? 0 : v > 1 ? 1 : v;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const eIn3 = (t: number) => t * t * t;
const eOut3 = (t: number) => 1 - (1 - t) ** 3;
const eOut4 = (t: number) => 1 - (1 - t) ** 4;
const eIO = (t: number) => t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
const smoothstep = (lo: number, hi: number, x: number) => {
  const t = sat((x - lo) / (hi - lo));
  return t * t * (3 - 2 * t);
};

/* ═══════════════════════════════════════════════
   LOGO PIXEL SAMPLER
   ═══════════════════════════════════════════════ */
function sampleLogoPixels(canvasW: number): { pts: { tx: number; ty: number }[]; fs: number } {
  const fs = Math.min(canvasW * 0.28, 100);
  const sw = Math.ceil(fs * 3.2);
  const sh = Math.ceil(fs * 1.5);
  const off = document.createElement('canvas');
  off.width = sw; off.height = sh;
  const c = off.getContext('2d')!;
  c.fillStyle = '#fff';
  c.font = `900 ${fs}px system-ui, -apple-system, sans-serif`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('NEO', sw / 2, sh / 2);
  const d = c.getImageData(0, 0, sw, sh).data;
  const pts: { tx: number; ty: number }[] = [];
  const step = 2;
  for (let y = 0; y < sh; y += step)
    for (let x = 0; x < sw; x += step)
      if (d[(y * sw + x) * 4 + 3] > 80)
        pts.push({ tx: x - sw / 2, ty: y - sh / 2 });
  return { pts, fs };
}

/* ═══════════════════════════════════════════════
   FIELD PARTICLE
   ═══════════════════════════════════════════════ */
interface FieldDot {
  // polar origin
  ang: number;
  dist: number;
  // current cartesian (relative to center)
  x: number; y: number;
  z: number;
  speed: number;
  size: number;
  alpha: number;
}

interface LogoDot {
  x: number; y: number;
  tx: number; ty: number;
  a: number;
}

/* ═══════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════ */
export const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [stage, setStage] = useState<'pre' | 'run' | 'out'>('pre');
  const cvRef = useRef<HTMLCanvasElement>(null);
  const raf = useRef(0);
  const t0 = useRef(0);
  const ended = useRef(false);

  // Mutable animation state (not React state — perf)
  const fieldRef = useRef<FieldDot[]>([]);
  const logoRef = useRef<LogoDot[]>([]);
  const logoFsRef = useRef(80);

  /* ── INIT ── */
  const init = useCallback((cw: number, ch: number) => {
    const maxR = Math.hypot(cw, ch) * 0.6;
    const COUNT = 280;
    const field: FieldDot[] = [];
    for (let i = 0; i < COUNT; i++) {
      const ang = Math.random() * Math.PI * 2;
      const dist = 30 + Math.random() * maxR;
      field.push({
        ang,
        dist,
        x: Math.cos(ang) * dist,
        y: Math.sin(ang) * dist,
        z: 40 + Math.random() * 960,
        speed: 0.25 + Math.random() * 0.75,
        size: 0.3 + Math.random() * 1.0,
        alpha: 0.1 + Math.random() * 0.35,
      });
    }
    fieldRef.current = field;

    const { pts, fs } = sampleLogoPixels(cw);
    logoFsRef.current = fs;
    const scatter = Math.max(cw, ch) * 1.2;
    logoRef.current = pts.map(p => ({
      x: (Math.random() - 0.5) * scatter,
      y: (Math.random() - 0.5) * scatter,
      tx: p.tx,
      ty: p.ty,
      a: 0,
    }));
  }, []);

  /* ── START ── */
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

    init(cw, ch);
    t0.current = performance.now();

    const tick = () => {
      const t = (performance.now() - t0.current) / 1000;
      paint(ctx, cw, ch, t);
      if (t < B.DONE + 0.5) {
        raf.current = requestAnimationFrame(tick);
      } else if (!ended.current) {
        ended.current = true;
        setStage('out');
        setTimeout(onComplete, 300);
      }
    };
    raf.current = requestAnimationFrame(tick);
  }, [init, onComplete]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  /* ════════════════════════════════════════════════
     PAINT — the core render loop
     ════════════════════════════════════════════════ */
  const paint = useCallback((ctx: CanvasRenderingContext2D, cw: number, ch: number, t: number) => {
    const cx = cw / 2;
    const cy = ch / 2;
    const diag = Math.hypot(cw, ch);

    // ── Background: always pure black ──
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, cw, ch);

    /* ════════════════════════════════════
       PHASE 1 — TENSION (0 → 1.5s)
       Deep black. Micro-noise drifting
       inward. A gravitational whisper.
       ════════════════════════════════════ */
    if (t < B.SINGULARITY_END) {
      const wake = smoothstep(0, B.TENSION_END, t);
      const singP = smoothstep(B.TENSION_END, B.SINGULARITY_END, t);
      const pullStrength = 0.008 + wake * 0.012 + singP * 0.05;

      for (const d of fieldRef.current) {
        // Gravitational pull toward center
        d.x *= 1 - pullStrength * d.speed;
        d.y *= 1 - pullStrength * d.speed;

        const dist = Math.hypot(d.x, d.y);
        const fade = sat(1 - dist / (diag * 0.45));
        const a = d.alpha * eIn3(wake) * 0.4 * fade;
        if (a < 0.003) continue;

        const sx = cx + d.x;
        const sy = cy + d.y;

        // Particles: tiny, precise, cold
        ctx.beginPath();
        ctx.arc(sx, sy, d.size * (0.4 + fade * 0.5), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(185,210,235,${a})`;
        ctx.fill();
      }

      // ── Central singularity glow ──
      const coreR = 15 + wake * 20 + singP * 45;
      const coreA = eIn3(wake) * 0.1 + singP * 0.2;
      const g1 = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
      g1.addColorStop(0, `rgba(200,225,248,${coreA})`);
      g1.addColorStop(0.35, `rgba(160,195,225,${coreA * 0.3})`);
      g1.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g1;
      ctx.fillRect(cx - coreR, cy - coreR, coreR * 2, coreR * 2);

      // ── Singularity: gravitational lens rings ──
      if (singP > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 5; i++) {
          const rp = sat(singP - i * 0.08);
          if (rp <= 0) continue;
          const r = 8 + i * 14 + (1 - eOut3(rp)) * 60;
          const ra = rp * 0.07 * (1 - i * 0.12);
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(170,210,240,${ra})`;
          ctx.lineWidth = 0.6 + (1 - i * 0.15) * 0.4;
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    /* ════════════════════════════════════
       PHASE 2 — TUNNEL (3.0 → 7.0s)
       Z-axis traversal. Progressive
       acceleration. Radial streaks.
       ════════════════════════════════════ */
    if (t >= B.SINGULARITY_END && t < B.CREATION_END) {
      const enterP = smoothstep(B.SINGULARITY_END, B.ACCEL_END, t); // 0→1 entry→accel
      const peakP = smoothstep(B.ACCEL_END, B.PEAK_END, t);          // 0→1 peak speed
      const exitP = smoothstep(B.PEAK_END, B.CREATION_END, t);       // 0→1 toward burst

      // Speed curve: slow → fast → extreme
      const speed = 0.4 + eIn3(enterP) * 6 + peakP * 12 + exitP * 4;

      // ── Z-axis starfield ──
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const d of fieldRef.current) {
        d.z -= speed * d.speed * 12;
        if (d.z < 1) {
          d.z = 600 + Math.random() * 400;
          d.x = (Math.random() - 0.5) * cw * 1.6;
          d.y = (Math.random() - 0.5) * ch * 1.6;
        }

        const persp = 250 / d.z;
        const sx = cx + d.x * persp;
        const sy = cy + d.y * persp;
        if (sx < -30 || sx > cw + 30 || sy < -30 || sy > ch + 30) continue;

        const brightP = sat(persp * 0.6);
        const a = brightP * d.alpha * (0.35 + enterP * 0.4 + peakP * 0.25);

        // Streak length proportional to speed
        const streak = Math.min(speed * 1.5 * persp, 55);
        const ang = Math.atan2(d.y, d.x);

        if (streak > 1.5) {
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx - Math.cos(ang) * streak, sy - Math.sin(ang) * streak);
          ctx.strokeStyle = `rgba(195,220,245,${a * 0.55})`;
          ctx.lineWidth = Math.max(0.3, d.size * persp * 0.35);
          ctx.stroke();
        }

        // Head dot
        const dotR = Math.max(0.2, d.size * persp * 0.5);
        ctx.beginPath();
        ctx.arc(sx, sy, dotR, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(210,232,252,${a})`;
        ctx.fill();
      }
      ctx.restore();

      // ── Radial speed lines (distinct from starfield) ──
      const lineCount = 40 + Math.floor(peakP * 30);
      const lineAlpha = 0.02 + enterP * 0.08 + peakP * 0.12;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < lineCount; i++) {
        // Deterministic angle spread
        const a = (i / lineCount) * Math.PI * 2 + t * 0.03;
        const innerR = 6 + Math.sin(i * 7.3 + t * 2) * 4;
        const outerR = innerR + 40 + enterP * 80 + peakP * 120 + Math.sin(i * 3.7) * 30;
        const x1 = cx + Math.cos(a) * innerR;
        const y1 = cy + Math.sin(a) * innerR;
        const x2 = cx + Math.cos(a) * outerR;
        const y2 = cy + Math.sin(a) * outerR;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        const la = lineAlpha * (0.3 + Math.sin(i * 5.1) * 0.3 + 0.4);
        ctx.strokeStyle = `rgba(180,210,235,${la})`;
        ctx.lineWidth = 0.4 + Math.sin(i * 2.9) * 0.3;
        ctx.stroke();
      }
      ctx.restore();

      // ── Vignette (depth cue) ──
      const vg = ctx.createRadialGradient(cx, cy, Math.min(cw, ch) * 0.1, cx, cy, diag * 0.6);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, `rgba(0,0,0,${0.4 + enterP * 0.2 + peakP * 0.2})`);
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, cw, ch);
    }

    /* ════════════════════════════════════
       PHASE 3 — CREATION (7.0 → 8.0s)
       Controlled white/cyan implosion.
       Logo particles begin converging.
       ════════════════════════════════════ */
    if (t >= B.PEAK_END) {
      const burstP = smoothstep(B.PEAK_END, B.CREATION_END, t);
      const formP = smoothstep(B.CREATION_END, B.STABLE_END, t);
      const holdP = smoothstep(B.STABLE_END, B.DONE, t);

      // ── Flash: brief, elegant ──
      if (burstP < 1) {
        const flashCurve = burstP < 0.2
          ? eOut4(burstP / 0.2) * 0.75
          : 0.75 * (1 - eIn3(sat((burstP - 0.2) / 0.8)));

        if (flashCurve > 0.005) {
          const radius = Math.max(cw, ch) * (0.15 + burstP * 0.4);
          const fg = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
          fg.addColorStop(0, `rgba(230,242,255,${flashCurve})`);
          fg.addColorStop(0.25, `rgba(180,215,240,${flashCurve * 0.4})`);
          fg.addColorStop(0.6, `rgba(140,185,215,${flashCurve * 0.1})`);
          fg.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = fg;
          ctx.fillRect(0, 0, cw, ch);
        }

        // Shockwave ring
        const ringR = eOut3(burstP) * diag * 0.3;
        const ringA = (1 - burstP) * 0.35;
        if (ringA > 0.005) {
          ctx.beginPath();
          ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(200,228,248,${ringA})`;
          ctx.lineWidth = 1.2 * (1 - burstP * 0.5);
          ctx.stroke();
        }
      }

      // ── Logo particle convergence ──
      const convP = sat(burstP * 0.4 + formP); // starts during burst, completes during form
      const convEased = eIO(sat(convP));
      const showDots = convP < 0.92;

      if (showDots) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (const lp of logoRef.current) {
          const factor = 0.08 + convEased * 0.18;
          lp.x = lerp(lp.x, lp.tx, factor);
          lp.y = lerp(lp.y, lp.ty, factor);
          lp.a = lerp(lp.a, 1, convEased * 0.1);

          const sx = cx + lp.x;
          const sy = cy + lp.y;
          if (sx < -15 || sx > cw + 15 || sy < -15 || sy > ch + 15) continue;

          ctx.beginPath();
          ctx.arc(sx, sy, 0.6 + convEased * 0.4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(215,235,255,${lp.a * (0.3 + convEased * 0.5)})`;
          ctx.fill();
        }
        ctx.restore();
      }

      // ── Solid logo text ──
      const textP = smoothstep(0.35, 0.8, convP);
      if (textP > 0) {
        ctx.save();
        ctx.font = `900 ${logoFsRef.current}px system-ui, -apple-system, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Glow: fade from intense to subtle
        const glowIntensity = textP * (1 - holdP * 0.6);
        if (glowIntensity > 0.05) {
          ctx.shadowColor = `rgba(180,218,245,${glowIntensity * 0.45})`;
          ctx.shadowBlur = 20 + (1 - textP) * 25;
        }

        ctx.fillStyle = `rgba(255,255,255,${eOut3(textP)})`;
        ctx.fillText('NEO', cx, cy);
        ctx.restore();
      }

      // ── Breathing glow (hold state) ──
      if (holdP > 0) {
        const breath = 0.06 + Math.sin(t * 1.8) * 0.03;
        const bg = ctx.createRadialGradient(cx, cy, 4, cx, cy, 55);
        bg.addColorStop(0, `rgba(175,215,240,${breath * holdP})`);
        bg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = bg;
        ctx.fillRect(cx - 55, cy - 55, 110, 110);
      }
    }
  }, []);

  /* ════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════ */
  return (
    <AnimatePresence>
      {stage !== 'out' ? (
        <motion.div
          className="fixed inset-0 z-[100] bg-black"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* Pre-screen */}
          <AnimatePresence>
            {stage === 'pre' && (
              <motion.div
                className="absolute inset-0 flex flex-col items-center justify-center z-20"
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <motion.p
                  className="text-[11px] tracking-[0.35em] uppercase font-medium mb-10"
                  style={{ color: 'rgba(255,255,255,0.25)' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.15 }}
                >
                  Sube el volumen
                </motion.p>
                <motion.button
                  onClick={go}
                  className="px-7 py-2.5 rounded-full border text-[12px] font-semibold tracking-[0.2em] uppercase"
                  style={{
                    borderColor: 'rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.7)',
                    background: 'rgba(255,255,255,0.02)',
                  }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.35 }}
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

          {/* Final copy */}
          <CopyOverlay visible={stage === 'run'} />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

/* ═══════════════════════════════════════════════
   COPY OVERLAY — editorial timing
   ═══════════════════════════════════════════════ */
function CopyOverlay({ visible }: { visible: boolean }) {
  const [sub, setSub] = useState(false);
  const [tag, setTag] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const a = setTimeout(() => setSub(true), (B.STABLE_END + 0.2) * 1000);
    const b = setTimeout(() => setTag(true), (B.STABLE_END + 0.7) * 1000);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [visible]);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-end pb-[17%] z-30 pointer-events-none">
      <AnimatePresence>
        {sub && (
          <motion.p
            className="text-[13px] font-medium tracking-[0.1em]"
            style={{ color: 'rgba(255,255,255,0.38)' }}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            El rendimiento, rediseñado.
          </motion.p>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {tag && (
          <motion.p
            className="mt-3 text-[9px] tracking-[0.35em] uppercase font-medium"
            style={{ color: 'rgba(255,255,255,0.15)' }}
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
