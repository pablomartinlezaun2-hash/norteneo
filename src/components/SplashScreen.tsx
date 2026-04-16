import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface SplashScreenProps {
  onComplete: () => void;
}

const B = {
  WAIT_END: 1.2,
  SINGULARITY_END: 2.8,
  ENTRY_END: 4.8,
  PEAK_END: 6.6,
  FORM_END: 7.6,
  COPY_END: 8.5,
  DONE: 8.9,
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeIn3 = (t: number) => t * t * t;
const easeOut3 = (t: number) => 1 - (1 - t) ** 3;
const easeOut4 = (t: number) => 1 - (1 - t) ** 4;
const easeInOut3 = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const smoothstep = (from: number, to: number, value: number) => {
  const t = clamp01((value - from) / (to - from));
  return t * t * (3 - 2 * t);
};

const color = {
  black: (a = 1) => `hsla(0, 0%, 0%, ${a})`,
  white: (a = 1) => `hsla(0, 0%, 100%, ${a})`,
  silver: (a = 1) => `hsla(210, 18%, 86%, ${a})`,
  frost: (a = 1) => `hsla(205, 34%, 78%, ${a})`,
  cyan: (a = 1) => `hsla(195, 56%, 74%, ${a})`,
};

interface SpacePoint {
  x0: number;
  y0: number;
  z: number;
  speed: number;
  size: number;
  alpha: number;
  seed: number;
}

interface LogoPoint {
  ox: number;
  oy: number;
  tx: number;
  ty: number;
  seed: number;
}

function sampleLogoPoints(canvasWidth: number) {
  const fontSize = Math.min(canvasWidth * 0.255, 94);
  const sampleCanvas = document.createElement('canvas');
  sampleCanvas.width = Math.ceil(fontSize * 3.35);
  sampleCanvas.height = Math.ceil(fontSize * 1.5);

  const ctx = sampleCanvas.getContext('2d');
  if (!ctx) return { fontSize, points: [] as Array<{ tx: number; ty: number }> };

  ctx.clearRect(0, 0, sampleCanvas.width, sampleCanvas.height);
  ctx.fillStyle = '#ffffff';
  ctx.font = `900 ${fontSize}px Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('NEO', sampleCanvas.width / 2, sampleCanvas.height / 2);

  const data = ctx.getImageData(0, 0, sampleCanvas.width, sampleCanvas.height).data;
  const points: Array<{ tx: number; ty: number }> = [];

  for (let y = 0; y < sampleCanvas.height; y += 3) {
    for (let x = 0; x < sampleCanvas.width; x += 3) {
      if (data[(y * sampleCanvas.width + x) * 4 + 3] > 180) {
        points.push({
          tx: x - sampleCanvas.width / 2,
          ty: y - sampleCanvas.height / 2,
        });
      }
    }
  }

  return { fontSize, points };
}

export const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [phase, setPhase] = useState<'pre' | 'run' | 'out'>('pre');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const startRef = useRef(0);
  const doneRef = useRef(false);
  const spaceRef = useRef<SpacePoint[]>([]);
  const logoRef = useRef<LogoPoint[]>([]);
  const logoFontRef = useRef(88);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const timings = useMemo(
    () => ({
      subtitle: (B.COPY_END + 0.05) * 1000,
      tagline: (B.COPY_END + 0.45) * 1000,
    }),
    []
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || phase === 'pre') return;

    let ctx: CanvasRenderingContext2D | null = null;
    let width = 0;
    let height = 0;
    let dpr = 1;

    const resetPoint = (point: SpacePoint) => {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.max(width, height) * (0.22 + Math.random() * 0.92);
      point.x0 = Math.cos(angle) * radius;
      point.y0 = Math.sin(angle) * radius;
      point.z = 140 + Math.random() * 980;
      point.speed = 0.42 + Math.random() * 0.9;
      point.size = 0.65 + Math.random() * 1.2;
      point.alpha = 0.1 + Math.random() * 0.28;
      point.seed = Math.random() * Math.PI * 2;
    };

    const initScene = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const stars = Array.from({ length: 170 }, () => {
        const point = {
          x0: 0,
          y0: 0,
          z: 0,
          speed: 0,
          size: 0,
          alpha: 0,
          seed: 0,
        };
        resetPoint(point);
        return point;
      });
      spaceRef.current = stars;

      const { fontSize, points } = sampleLogoPoints(width);
      logoFontRef.current = fontSize;
      const originRadius = Math.max(width, height) * 0.18;
      logoRef.current = points.map((point) => {
        const angle = Math.atan2(point.ty || 1, point.tx || 1) + (Math.random() - 0.5) * 0.42;
        const radius = originRadius + Math.random() * (originRadius * 0.85);
        return {
          ox: Math.cos(angle) * radius + point.tx * 0.16,
          oy: Math.sin(angle) * radius + point.ty * 0.16,
          tx: point.tx,
          ty: point.ty,
          seed: Math.random() * Math.PI * 2,
        };
      });
    };

    const drawBackdrop = (time: number, cx: number, cy: number, diag: number) => {
      if (!ctx) return;

      const wait = smoothstep(0, B.WAIT_END, time);
      const singularity = smoothstep(B.WAIT_END * 0.45, B.SINGULARITY_END, time);
      const travel = smoothstep(B.SINGULARITY_END, B.PEAK_END, time);

      ctx.fillStyle = color.black();
      ctx.fillRect(0, 0, width, height);

      for (let index = 0; index < 42; index += 1) {
        const point = spaceRef.current[index];
        if (!point) continue;
        const drift = 0.94 - singularity * 0.16;
        const sx = cx + point.x0 * 0.13 * drift + Math.cos(point.seed + time * 0.12) * 1.2;
        const sy = cy + point.y0 * 0.13 * drift + Math.sin(point.seed + time * 0.11) * 1.2;
        const alpha = point.alpha * 0.13 * (1 - travel * 0.35);
        ctx.beginPath();
        ctx.arc(sx, sy, 0.45, 0, Math.PI * 2);
        ctx.fillStyle = color.silver(alpha);
        ctx.fill();
      }

      const coreRadius = 4 + wait * 6 + singularity * 24;
      const coreGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreRadius * 3.8);
      coreGlow.addColorStop(0, color.white(0.02 + singularity * 0.08));
      coreGlow.addColorStop(0.38, color.frost(0.028 + singularity * 0.08));
      coreGlow.addColorStop(1, color.black(0));
      ctx.fillStyle = coreGlow;
      ctx.fillRect(cx - coreRadius * 4, cy - coreRadius * 4, coreRadius * 8, coreRadius * 8);

      for (let i = 0; i < 3; i += 1) {
        const ringProgress = clamp01(singularity - i * 0.12);
        if (ringProgress <= 0) continue;
        const radius = 10 + i * 12 + (1 - easeOut4(ringProgress)) * 36;
        ctx.beginPath();
        ctx.ellipse(cx, cy, radius * 1.08, radius * 0.78, 0, 0, Math.PI * 2);
        ctx.strokeStyle = color.cyan((0.025 + ringProgress * 0.06) * (1 - i * 0.18));
        ctx.lineWidth = 0.7 - i * 0.08;
        ctx.stroke();
      }

      const horizontalGlow = 30 + singularity * 110 + travel * 50;
      const lineGradient = ctx.createLinearGradient(cx - horizontalGlow, cy, cx + horizontalGlow, cy);
      lineGradient.addColorStop(0, color.black(0));
      lineGradient.addColorStop(0.5, color.frost(0.04 + singularity * 0.12));
      lineGradient.addColorStop(1, color.black(0));
      ctx.fillStyle = lineGradient;
      ctx.fillRect(cx - horizontalGlow, cy - 0.5, horizontalGlow * 2, 1);

      const vignette = ctx.createRadialGradient(cx, cy, Math.min(width, height) * 0.06, cx, cy, diag * 0.62);
      vignette.addColorStop(0, color.black(0));
      vignette.addColorStop(1, color.black(0.76));
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);
    };

    const drawTravel = (time: number, cx: number, cy: number) => {
      if (!ctx || time < B.SINGULARITY_END || time > B.FORM_END) return;

      const entry = smoothstep(B.SINGULARITY_END, B.ENTRY_END, time);
      const peak = smoothstep(B.ENTRY_END, B.PEAK_END, time);
      const release = smoothstep(B.PEAK_END, B.FORM_END, time);
      const speed = 0.7 + easeIn3(entry) * 6.8 + peak * 11.2 - release * 2.6;

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      for (const point of spaceRef.current) {
        point.z -= speed * point.speed * 11;
        if (point.z < 18) resetPoint(point);

        const perspective = 260 / point.z;
        const sx = cx + point.x0 * perspective;
        const sy = cy + point.y0 * perspective;
        if (sx < -60 || sx > width + 60 || sy < -60 || sy > height + 60) continue;

        const dx = sx - cx;
        const dy = sy - cy;
        const distance = Math.hypot(dx, dy) || 1;
        const streak = Math.min(42, speed * perspective * 11);
        const opacity = point.alpha * clamp01(perspective * 1.55) * (0.22 + entry * 0.46 + peak * 0.22);

        if (streak > 0.8) {
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx - (dx / distance) * streak, sy - (dy / distance) * streak);
          ctx.strokeStyle = color.frost(opacity * 0.8);
          ctx.lineWidth = Math.max(0.42, point.size * perspective * 0.55);
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(sx, sy, Math.max(0.28, point.size * perspective * 0.46), 0, Math.PI * 2);
        ctx.fillStyle = color.white(opacity * 0.95);
        ctx.fill();
      }

      ctx.restore();

      const compressionRadius = 26 + entry * 80 + peak * 90;
      const compression = ctx.createRadialGradient(cx, cy, 0, cx, cy, compressionRadius * 2.2);
      compression.addColorStop(0, color.frost(0.05 + peak * 0.13));
      compression.addColorStop(0.4, color.cyan(0.015 + peak * 0.05));
      compression.addColorStop(1, color.black(0));
      ctx.fillStyle = compression;
      ctx.fillRect(cx - compressionRadius * 2.5, cy - compressionRadius * 2.5, compressionRadius * 5, compressionRadius * 5);
    };

    const drawCreation = (time: number, cx: number, cy: number, diag: number) => {
      if (!ctx || time < B.PEAK_END) return;

      const burst = smoothstep(B.PEAK_END, B.FORM_END, time);
      const formation = smoothstep(B.PEAK_END + 0.08, B.FORM_END, time);
      const settle = smoothstep(B.FORM_END, B.COPY_END, time);
      const hold = smoothstep(B.COPY_END, B.DONE, time);
      const flash = burst < 0.15 ? easeOut4(burst / 0.15) : 1 - smoothstep(0.15, 0.52, burst);

      if (flash > 0.001) {
        const radius = diag * (0.08 + burst * 0.24);
        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        glow.addColorStop(0, color.white(flash * 0.9));
        glow.addColorStop(0.2, color.frost(flash * 0.38));
        glow.addColorStop(0.5, color.cyan(flash * 0.1));
        glow.addColorStop(1, color.black(0));
        ctx.fillStyle = glow;
        ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

        ctx.beginPath();
        ctx.ellipse(cx, cy, radius * 0.56, radius * 0.4, 0, 0, Math.PI * 2);
        ctx.strokeStyle = color.white(flash * 0.36);
        ctx.lineWidth = 1.1;
        ctx.stroke();
      }

      const convergence = easeInOut3(formation);
      if (convergence > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        for (const point of logoRef.current) {
          const previous = Math.max(0, convergence - 0.06);
          const px = lerp(point.ox, point.tx, previous);
          const py = lerp(point.oy, point.ty, previous);
          const x = lerp(point.ox, point.tx, convergence) + Math.sin(point.seed + time * 3.4) * (1 - convergence) * 5.5;
          const y = lerp(point.oy, point.ty, convergence) + Math.cos(point.seed + time * 3.1) * (1 - convergence) * 5.5;

          if (convergence < 0.94) {
            ctx.beginPath();
            ctx.moveTo(cx + px, cy + py);
            ctx.lineTo(cx + x, cy + y);
            ctx.strokeStyle = color.frost((0.05 + convergence * 0.18) * (1 - convergence * 0.45));
            ctx.lineWidth = 0.55;
            ctx.stroke();
          }

          ctx.beginPath();
          ctx.arc(cx + x, cy + y, 0.42 + convergence * 0.28, 0, Math.PI * 2);
          ctx.fillStyle = color.white(0.18 + convergence * 0.55);
          ctx.fill();
        }

        ctx.restore();
      }

      const logoReveal = smoothstep(0.34, 0.92, convergence + settle * 0.2);
      if (logoReveal > 0) {
        const scale = 1 + (1 - logoReveal) * 0.035 + Math.sin(time * 1.9) * 0.002 * hold;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(scale, scale);
        ctx.font = `900 ${logoFontRef.current}px Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = color.cyan((0.16 + (1 - hold) * 0.12) * logoReveal);
        ctx.shadowBlur = 10 + (1 - logoReveal) * 16;
        ctx.fillStyle = color.white(easeOut3(logoReveal));
        ctx.fillText('NEO', 0, 0);
        ctx.restore();
      }

      if (settle > 0) {
        const breath = (0.04 + Math.sin(time * 1.7) * 0.015) * (0.45 + hold * 0.55);
        const halo = ctx.createRadialGradient(cx, cy, 8, cx, cy, 74);
        halo.addColorStop(0, color.cyan(breath));
        halo.addColorStop(1, color.black(0));
        ctx.fillStyle = halo;
        ctx.fillRect(cx - 74, cy - 74, 148, 148);
      }
    };

    const render = () => {
      if (!ctx) return;
      const time = (performance.now() - startRef.current) / 1000;
      const cx = width / 2;
      const cy = height / 2;
      const diag = Math.hypot(width, height);

      drawBackdrop(time, cx, cy, diag);
      drawTravel(time, cx, cy);
      drawCreation(time, cx, cy, diag);

      if (time < B.DONE + 0.2) {
        frameRef.current = requestAnimationFrame(render);
      } else if (!doneRef.current) {
        doneRef.current = true;
        setPhase('out');
        window.setTimeout(onComplete, 240);
      }
    };

    initScene();
    startRef.current = performance.now();
    frameRef.current = requestAnimationFrame(render);

    const handleResize = () => initScene();
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [onComplete, phase]);

  const handleStart = () => {
    const audio = new Audio('/audio/neo-intro.mp3');
    audio.volume = 0.7;
    audio.play().catch(() => {});
    audioRef.current = audio;
    setPhase('run');
  };

  return (
    <AnimatePresence>
      {phase !== 'out' ? (
        <motion.div
          className="fixed inset-0 z-[100] bg-background"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.24, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* Pre-screen */}
          <AnimatePresence>
            {phase === 'pre' && (
              <motion.div
                className="absolute inset-0 z-20 flex flex-col items-center justify-center"
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <motion.p
                  className="mb-10 text-[11px] font-medium uppercase tracking-[0.35em] text-foreground/25"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  Sube el volumen
                </motion.p>
                <motion.button
                  onClick={handleStart}
                  className="rounded-full border border-foreground/10 bg-foreground/[0.02] px-7 py-2.5 text-[12px] font-semibold uppercase tracking-[0.2em] text-foreground/70"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.25 }}
                  whileTap={{ scale: 0.96 }}
                >
                  Estoy listo
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
          <CopyOverlay visible={phase === 'run'} timings={timings} />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

function CopyOverlay({
  visible,
  timings,
}: {
  visible: boolean;
  timings: { subtitle: number; tagline: number };
}) {
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [showTagline, setShowTagline] = useState(false);

  useEffect(() => {
    setShowSubtitle(false);
    setShowTagline(false);
    if (!visible) return;

    const subtitleTimer = window.setTimeout(() => setShowSubtitle(true), timings.subtitle);
    const taglineTimer = window.setTimeout(() => setShowTagline(true), timings.tagline);

    return () => {
      window.clearTimeout(subtitleTimer);
      window.clearTimeout(taglineTimer);
    };
  }, [timings, visible]);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-end pb-[18%]">
      <AnimatePresence>
        {showSubtitle ? (
          <motion.p
            className="text-[13px] font-medium tracking-[0.08em] text-foreground/50"
            initial={{ opacity: 0, y: 5, filter: 'blur(3px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.48, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            El rendimiento, rediseñado.
          </motion.p>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {showTagline ? (
          <motion.p
            className="mt-3 text-[9px] font-medium uppercase tracking-[0.34em] text-foreground/20"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.52, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            Planificación · Ejecución · Evolución
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
