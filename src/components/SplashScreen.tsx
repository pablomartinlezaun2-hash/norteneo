import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashScreenProps {
  onComplete: () => void;
}

/* ────────── constants ────────── */
const TOTAL_DURATION = 9.5; // seconds
const PHASE = {
  INIT_END: 1.5,
  SINGULARITY_END: 3.0,
  TUNNEL_END: 5.5,
  MAX_SPEED_END: 7.0,
  BURST_END: 8.0,
  LOGO_END: 9.2,
};

const PARTICLE_COUNT = 260;
const STREAK_COUNT = 80;

/* ────────── helpers ────────── */
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
const easeInCubic = (t: number) => t * t * t;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

interface Particle {
  x: number;
  y: number;
  z: number;
  baseX: number;
  baseY: number;
  speed: number;
  size: number;
  alpha: number;
  angle: number;
  radius: number;
}

interface Streak {
  angle: number;
  length: number;
  speed: number;
  dist: number;
  alpha: number;
  width: number;
}

interface LogoPixel {
  x: number;
  y: number;
}

function sampleTextPixels(
  text: string,
  w: number,
  h: number,
  fontSize: number
): LogoPixel[] {
  const offscreen = document.createElement('canvas');
  offscreen.width = w;
  offscreen.height = h;
  const ctx = offscreen.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.font = `800 ${fontSize}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, w / 2, h / 2);

  const data = ctx.getImageData(0, 0, w, h).data;
  const pixels: LogoPixel[] = [];
  const step = 3; // sample every 3 pixels for density
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const i = (y * w + x) * 4;
      if (data[i + 3] > 128) {
        pixels.push({ x: x - w / 2, y: y - h / 2 });
      }
    }
  }
  return pixels;
}

/* ────────── component ────────── */
export const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [phase, setPhase] = useState<'prescreen' | 'animating' | 'done'>('prescreen');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startTimeRef = useRef(0);
  const rafRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const streaksRef = useRef<Streak[]>([]);
  const logoPixelsRef = useRef<LogoPixel[]>([]);
  const logoParticlesRef = useRef<{ x: number; y: number; tx: number; ty: number; vx: number; vy: number; alpha: number }[]>([]);
  const doneCalledRef = useRef(false);

  // Pre-compute logo pixels once we know canvas size
  const initLogoPixels = useCallback((cw: number, ch: number) => {
    const fontSize = Math.min(cw * 0.28, 120);
    const sampleW = Math.floor(cw * 0.6);
    const sampleH = Math.floor(fontSize * 1.6);
    const raw = sampleTextPixels('NEO', sampleW, sampleH, fontSize);
    logoPixelsRef.current = raw;

    // Create logo particles scattered
    logoParticlesRef.current = raw.map((p) => ({
      x: (Math.random() - 0.5) * cw * 1.5,
      y: (Math.random() - 0.5) * ch * 1.5,
      tx: p.x,
      ty: p.y,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      alpha: 0,
    }));
  }, []);

  const initParticles = useCallback((cw: number, ch: number) => {
    const particles: Particle[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * Math.max(cw, ch) * 0.6;
      particles.push({
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        z: Math.random() * 1000,
        baseX: Math.cos(angle) * radius,
        baseY: Math.sin(angle) * radius,
        speed: 0.2 + Math.random() * 0.8,
        size: 0.5 + Math.random() * 1.5,
        alpha: 0.1 + Math.random() * 0.4,
        angle,
        radius,
      });
    }
    particlesRef.current = particles;

    const streaks: Streak[] = [];
    for (let i = 0; i < STREAK_COUNT; i++) {
      streaks.push({
        angle: Math.random() * Math.PI * 2,
        length: 20 + Math.random() * 60,
        speed: 2 + Math.random() * 5,
        dist: 50 + Math.random() * 300,
        alpha: 0.05 + Math.random() * 0.25,
        width: 0.5 + Math.random() * 1.5,
      });
    }
    streaksRef.current = streaks;
  }, []);

  const startAnimation = useCallback(() => {
    // Play intro audio
    try {
      const audio = new Audio('/audio/neo-intro.mp3');
      audio.volume = 0.7;
      audio.play().catch(() => {});
    } catch (_) {}
    setPhase('animating');
    startTimeRef.current = performance.now();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    canvas.width = cw * dpr;
    canvas.height = ch * dpr;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);

    initParticles(cw, ch);
    initLogoPixels(cw, ch);

    const loop = () => {
      const elapsed = (performance.now() - startTimeRef.current) / 1000;
      render(ctx, cw, ch, elapsed);

      if (elapsed < TOTAL_DURATION + 1.5) {
        rafRef.current = requestAnimationFrame(loop);
      } else if (!doneCalledRef.current) {
        doneCalledRef.current = true;
        setPhase('done');
        setTimeout(() => onComplete(), 400);
      }
    };
    rafRef.current = requestAnimationFrame(loop);
  }, [initParticles, initLogoPixels, onComplete]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  /* ────────── render loop ────────── */
  const render = useCallback(
    (ctx: CanvasRenderingContext2D, cw: number, ch: number, t: number) => {
      const cx = cw / 2;
      const cy = ch / 2;

      // Background
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, cw, ch);

      /* ── Phase 1: Initialization (0 – 1.5s) ── */
      if (t < PHASE.SINGULARITY_END) {
        const p1 = clamp01(t / PHASE.INIT_END);
        const initAlpha = easeInCubic(p1) * 0.3;

        // Subtle noise particles drifting toward center
        particlesRef.current.forEach((pt) => {
          const pull = t < PHASE.INIT_END ? p1 * 0.02 : 0.02 + clamp01((t - PHASE.INIT_END) / 1.5) * 0.08;
          pt.x = lerp(pt.x, 0, pull * pt.speed);
          pt.y = lerp(pt.y, 0, pull * pt.speed);

          const sx = cx + pt.x;
          const sy = cy + pt.y;
          const dist = Math.sqrt(pt.x * pt.x + pt.y * pt.y);
          const maxDist = Math.max(cw, ch) * 0.5;
          const distFade = clamp01(1 - dist / maxDist);

          ctx.beginPath();
          ctx.arc(sx, sy, pt.size * (0.5 + distFade * 0.5), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(200, 220, 240, ${pt.alpha * initAlpha * distFade})`;
          ctx.fill();
        });

        // Central glow building
        const glowSize = 30 + p1 * 40;
        const singP = clamp01((t - PHASE.INIT_END) / 1.5);
        const glowIntensity = initAlpha + singP * 0.15;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowSize + singP * 60);
        grad.addColorStop(0, `rgba(180, 210, 235, ${glowIntensity})`);
        grad.addColorStop(0.4, `rgba(140, 180, 210, ${glowIntensity * 0.4})`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, cw, ch);

        // Singularity rings (phase 2)
        if (t > PHASE.INIT_END) {
          const ringProgress = singP;
          for (let i = 0; i < 3; i++) {
            const ringT = clamp01(ringProgress - i * 0.15);
            if (ringT <= 0) continue;
            const r = 15 + i * 25 + (1 - easeOutCubic(ringT)) * 80;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(160, 200, 220, ${ringT * 0.15 * (1 - i * 0.2)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      /* ── Phase 3-4: Tunnel / Max Speed (3.0 – 7.0s) ── */
      if (t >= PHASE.SINGULARITY_END && t < PHASE.BURST_END) {
        const tunnelT = clamp01((t - PHASE.SINGULARITY_END) / (PHASE.MAX_SPEED_END - PHASE.SINGULARITY_END));
        const speedMult = easeInCubic(tunnelT) * 8 + 0.5;
        const maxSpeedT = clamp01((t - PHASE.MAX_SPEED_END) / (PHASE.BURST_END - PHASE.MAX_SPEED_END));

        // Z-axis particles (flying through space)
        particlesRef.current.forEach((pt) => {
          pt.z -= speedMult * pt.speed * 16;
          if (pt.z < 1) {
            pt.z = 800 + Math.random() * 200;
            pt.baseX = (Math.random() - 0.5) * cw * 1.2;
            pt.baseY = (Math.random() - 0.5) * ch * 1.2;
          }

          const perspective = 400 / pt.z;
          const sx = cx + pt.baseX * perspective;
          const sy = cy + pt.baseY * perspective;

          if (sx < -10 || sx > cw + 10 || sy < -10 || sy > ch + 10) return;

          // Streak effect at high speed
          const streakLen = Math.min(speedMult * 2 * perspective, 40);
          const angle2 = Math.atan2(pt.baseY, pt.baseX);

          const alpha = clamp01(perspective * 0.8) * pt.alpha * (0.4 + tunnelT * 0.6);

          if (streakLen > 3) {
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(
              sx - Math.cos(angle2) * streakLen,
              sy - Math.sin(angle2) * streakLen
            );
            const streakAlpha = alpha * 0.7;
            ctx.strokeStyle = `rgba(190, 215, 235, ${streakAlpha})`;
            ctx.lineWidth = pt.size * perspective * 0.5;
            ctx.stroke();
          }

          ctx.beginPath();
          ctx.arc(sx, sy, Math.max(0.5, pt.size * perspective * 0.8), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(200, 225, 245, ${alpha})`;
          ctx.fill();
        });

        // Radial speed streaks
        const streakAlphaBase = 0.05 + tunnelT * 0.25 + maxSpeedT * 0.2;
        streaksRef.current.forEach((s) => {
          s.dist += s.speed * speedMult * 0.8;
          if (s.dist > Math.max(cw, ch) * 0.7) {
            s.dist = 10 + Math.random() * 30;
            s.angle = Math.random() * Math.PI * 2;
          }

          const x1 = cx + Math.cos(s.angle) * s.dist;
          const y1 = cy + Math.sin(s.angle) * s.dist;
          const len = s.length * (0.3 + tunnelT * 0.7 + maxSpeedT * 0.5);
          const x2 = cx + Math.cos(s.angle) * (s.dist + len);
          const y2 = cy + Math.sin(s.angle) * (s.dist + len);

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = `rgba(180, 205, 225, ${s.alpha * streakAlphaBase})`;
          ctx.lineWidth = s.width;
          ctx.stroke();
        });

        // Central void
        const voidR = 8 + tunnelT * 15;
        const voidGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, voidR + 30);
        voidGrad.addColorStop(0, `rgba(20, 30, 40, ${0.6 + tunnelT * 0.3})`);
        voidGrad.addColorStop(0.5, `rgba(10, 15, 20, ${0.2})`);
        voidGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = voidGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, voidR + 30, 0, Math.PI * 2);
        ctx.fill();

        // Peripheral glow/vignette
        const vigGrad = ctx.createRadialGradient(cx, cy, Math.min(cw, ch) * 0.2, cx, cy, Math.max(cw, ch) * 0.7);
        vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
        vigGrad.addColorStop(1, `rgba(0,0,0,${0.4 + tunnelT * 0.3})`);
        ctx.fillStyle = vigGrad;
        ctx.fillRect(0, 0, cw, ch);
      }

      /* ── Phase 5: Creation burst (7.0 – 8.0s) ── */
      if (t >= PHASE.MAX_SPEED_END && t < PHASE.LOGO_END) {
        const burstT = clamp01((t - PHASE.MAX_SPEED_END) / (PHASE.BURST_END - PHASE.MAX_SPEED_END));
        const fadeT = clamp01((t - PHASE.BURST_END) / 0.4);

        // Flash
        const flashAlpha = burstT < 0.3
          ? easeOutCubic(burstT / 0.3) * 0.7
          : lerp(0.7, 0, easeInCubic(clamp01((burstT - 0.3) / 0.7)));

        if (flashAlpha > 0.01) {
          const flashGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(cw, ch) * 0.5 * (0.3 + burstT * 0.7));
          flashGrad.addColorStop(0, `rgba(210, 230, 245, ${flashAlpha})`);
          flashGrad.addColorStop(0.3, `rgba(160, 200, 225, ${flashAlpha * 0.5})`);
          flashGrad.addColorStop(0.7, `rgba(100, 150, 180, ${flashAlpha * 0.15})`);
          flashGrad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = flashGrad;
          ctx.fillRect(0, 0, cw, ch);
        }

        // Expanding ring
        const ringR = burstT * Math.max(cw, ch) * 0.4;
        const ringAlpha = (1 - burstT) * 0.4;
        if (ringAlpha > 0.01) {
          ctx.beginPath();
          ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(180, 210, 230, ${ringAlpha})`;
          ctx.lineWidth = 2 - burstT;
          ctx.stroke();
        }

        // Logo particle convergence
        if (t > PHASE.MAX_SPEED_END + 0.5) {
          const convT = clamp01((t - (PHASE.MAX_SPEED_END + 0.5)) / 1.8);
          const convEased = easeInOutCubic(convT);

          logoParticlesRef.current.forEach((lp) => {
            lp.x = lerp(lp.x, lp.tx, convEased * 0.15 + convEased * convEased * 0.1);
            lp.y = lerp(lp.y, lp.ty, convEased * 0.15 + convEased * convEased * 0.1);
            lp.alpha = lerp(lp.alpha, 1, convEased * 0.12);

            const sx = cx + lp.x;
            const sy = cy + lp.y;

            if (sx < -20 || sx > cw + 20 || sy < -20 || sy > ch + 20) return;

            ctx.beginPath();
            ctx.arc(sx, sy, 1.2 + convEased * 0.6, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(210, 230, 245, ${lp.alpha * 0.7})`;
            ctx.fill();
          });
        }
      }

      /* ── Phase 6-7: Logo formation & final state (8.0s+) ── */
      if (t >= PHASE.BURST_END) {
        const formT = clamp01((t - PHASE.BURST_END) / 1.2);
        const formEased = easeOutCubic(formT);
        const stableT = clamp01((t - PHASE.LOGO_END) / 0.6);

        // Continue converging particles
        logoParticlesRef.current.forEach((lp) => {
          lp.x = lerp(lp.x, lp.tx, 0.15 + formEased * 0.15);
          lp.y = lerp(lp.y, lp.ty, 0.15 + formEased * 0.15);
          lp.alpha = lerp(lp.alpha, 1, 0.1);

          const sx = cx + lp.x;
          const sy = cy + lp.y;
          if (sx < -20 || sx > cw + 20 || sy < -20 || sy > ch + 20) return;

          const pSize = 1.2 + formEased * 0.5;
          ctx.beginPath();
          ctx.arc(sx, sy, pSize, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(220, 235, 248, ${lp.alpha * (0.5 + formEased * 0.5)})`;
          ctx.fill();
        });

        // Solid text fade-in on top
        if (formT > 0.4) {
          const textAlpha = easeOutCubic(clamp01((formT - 0.4) / 0.6));
          const fontSize = Math.min(cw * 0.28, 120);
          ctx.save();
          ctx.font = `800 ${fontSize}px system-ui, -apple-system, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = `rgba(255, 255, 255, ${textAlpha})`;

          // Subtle glow behind text
          if (textAlpha > 0.3) {
            ctx.shadowColor = `rgba(170, 210, 235, ${textAlpha * 0.5})`;
            ctx.shadowBlur = 30 + (1 - formT) * 20;
          }

          ctx.fillText('NEO', cx, cy);
          ctx.restore();
        }

        // Breathing glow in final state
        if (stableT > 0) {
          const breath = Math.sin(t * 1.5) * 0.05 + 0.1;
          const glowGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 80);
          glowGrad.addColorStop(0, `rgba(170, 210, 235, ${breath * stableT})`);
          glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = glowGrad;
          ctx.fillRect(cx - 80, cy - 80, 160, 160);
        }
      }
    },
    []
  );

  /* ── Final overlay text (subtitle + tagline) ── */
  const showSubtitle = phase === 'animating' || phase === 'done';

  return (
    <AnimatePresence>
      {phase !== 'done' ? (
        <motion.div
          className="fixed inset-0 z-[100] bg-black"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* Pre-screen */}
          <AnimatePresence>
            {phase === 'prescreen' && (
              <motion.div
                className="absolute inset-0 flex flex-col items-center justify-center z-20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                <motion.p
                  className="text-[13px] tracking-[0.25em] uppercase font-medium mb-10"
                  style={{ color: 'rgba(255,255,255,0.35)' }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                >
                  Sube el volumen
                </motion.p>
                <motion.button
                  onClick={startAnimation}
                  className="px-8 py-3 rounded-full border text-sm font-semibold tracking-[0.15em] uppercase transition-all duration-300"
                  style={{
                    borderColor: 'rgba(255,255,255,0.15)',
                    color: 'rgba(255,255,255,0.8)',
                    background: 'rgba(255,255,255,0.03)',
                  }}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  whileHover={{
                    borderColor: 'rgba(255,255,255,0.3)',
                    background: 'rgba(255,255,255,0.06)',
                    scale: 1.03,
                  }}
                  whileTap={{ scale: 0.97 }}
                >
                  Estoy listo
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Canvas */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ opacity: phase === 'animating' ? 1 : 0 }}
          />

          {/* Overlay text – subtitle & tagline */}
          <SubtitleOverlay visible={phase === 'animating'} />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

/* ── Synced transcript overlay ── */
const TRANSCRIPT_CUES = [
  { text: 'INICIANDO SISTEMA', start: 600, end: 2200 },
  { text: 'ACTIVANDO RED NEURONAL', start: 3200, end: 6400 },
  { text: 'BIENVENIDO', start: 6900, end: 8000 },
  { text: 'A NEO', start: 8000, end: 9200, final: true },
];

function SubtitleOverlay({ visible }: { visible: boolean }) {
  const [activeCue, setActiveCue] = useState<number | null>(null);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    if (!visible) {
      setActiveCue(null);
      return;
    }

    const timers: number[] = [];

    TRANSCRIPT_CUES.forEach((cue, i) => {
      // Show
      timers.push(window.setTimeout(() => setActiveCue(i), cue.start));
      // Hide (unless it's the final cue — let it linger)
      if (!cue.final) {
        timers.push(window.setTimeout(() => setActiveCue((prev) => (prev === i ? null : prev)), cue.end));
      }
    });

    timersRef.current = timers;
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [visible]);

  const cue = activeCue !== null ? TRANSCRIPT_CUES[activeCue] : null;

  return (
    <div className="absolute inset-0 flex items-end justify-center pb-[18%] z-30 pointer-events-none">
      <AnimatePresence>
        {cue && (
          <motion.p
            key={cue.text}
            className={`text-center uppercase font-medium select-none ${
              cue.final
                ? 'text-[15px] tracking-[0.26em]'
                : 'text-[12.5px] tracking-[0.3em]'
            }`}
            style={{
              color: cue.final
                ? 'rgba(215, 235, 250, 0.82)'
                : 'rgba(205, 222, 240, 0.62)',
            }}
            initial={{ opacity: 0, y: 4, filter: cue.final ? 'blur(2px)' : 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -2, filter: 'blur(3px)' }}
            transition={{
              duration: cue.final ? 0.45 : 0.38,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
          >
            {cue.text}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
