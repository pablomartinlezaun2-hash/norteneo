import { useRef, useEffect, useCallback } from 'react';

/* ═══════════════════════════════════════════
   NEURAL CLOUD — Holographic Neural Mass
   Canvas-based abstract neural intelligence
   ═══════════════════════════════════════════ */

interface CalibrationAvatarProps {
  buildStage: number; // -1=nothing, 0-7 progressive, 8=complete
}

/* ── Easing ── */
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/* ── Node in the neural cloud ── */
interface NeuralNode {
  x: number; // normalized 0-1
  y: number;
  z: number; // depth layer 0-1
  radius: number;
  phase: number;
  driftX: number;
  driftY: number;
  stage: number; // reveal stage
  connections: number[]; // indices of connected nodes
}

/* ── Fast signal traveling along a connection ── */
interface Signal {
  fromIdx: number;
  toIdx: number;
  t: number; // 0-1 progress
  speed: number;
  hue: number;
}

/* ── Seed-based pseudo-random ── */
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/* ── Generate organic neural cloud ── */
function generateCloud(): NeuralNode[] {
  const rng = seededRandom(42);
  const nodes: NeuralNode[] = [];
  const stageNodeCounts = [8, 10, 12, 14, 14, 10, 8, 6]; // per stage

  for (let stage = 0; stage < 8; stage++) {
    const count = stageNodeCounts[stage];
    for (let i = 0; i < count; i++) {
      // Organic cloud distribution — elliptical with irregularity
      const angle = rng() * Math.PI * 2;
      const dist = (0.08 + rng() * 0.35) * (0.7 + stage * 0.04);
      const verticalBias = (stage / 7) * 0.7 + 0.15; // stages spread vertically
      
      nodes.push({
        x: 0.5 + Math.cos(angle) * dist * (0.8 + rng() * 0.4),
        y: verticalBias + (rng() - 0.5) * 0.18,
        z: rng(),
        radius: 1 + rng() * 2.5,
        phase: rng() * Math.PI * 2,
        driftX: (rng() - 0.5) * 0.003,
        driftY: (rng() - 0.5) * 0.002,
        stage,
        connections: [],
      });
    }
  }

  // Build connections — connect nearby nodes
  for (let i = 0; i < nodes.length; i++) {
    const ni = nodes[i];
    const dists: { idx: number; d: number }[] = [];
    for (let j = 0; j < nodes.length; j++) {
      if (i === j) continue;
      const nj = nodes[j];
      const dx = ni.x - nj.x;
      const dy = ni.y - nj.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < 0.25 && Math.abs(ni.stage - nj.stage) <= 2) {
        dists.push({ idx: j, d });
      }
    }
    dists.sort((a, b) => a.d - b.d);
    ni.connections = dists.slice(0, 2 + Math.floor(rng() * 3)).map(d => d.idx);
  }

  return nodes;
}

const NODES = generateCloud();

export const CalibrationAvatar = ({ buildStage }: CalibrationAvatarProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);
  const startTime = useRef(0);
  const stageReveal = useRef<number[]>(new Array(8).fill(0));
  const signalsRef = useRef<Signal[]>([]);
  const flashRef = useRef(0);
  const prevStage = useRef(buildStage);

  // Trigger signals on stage change
  useEffect(() => {
    if (buildStage > prevStage.current) {
      flashRef.current = 1;
      // Burst of fast signals on newly revealed nodes
      const newSignals: Signal[] = [];
      NODES.forEach((node, i) => {
        if (node.stage === buildStage && node.connections.length > 0) {
          const target = node.connections[Math.floor(Math.random() * node.connections.length)];
          newSignals.push({
            fromIdx: i,
            toIdx: target,
            t: 0,
            speed: 1.5 + Math.random() * 2,
            hue: 200 + Math.random() * 40,
          });
        }
      });
      signalsRef.current = [...signalsRef.current, ...newSignals];
    }
    prevStage.current = buildStage;
  }, [buildStage]);

  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => {
    const dt = 1 / 60;
    ctx.clearRect(0, 0, w, h);

    // Update stage reveals with smooth interpolation
    for (let i = 0; i < 8; i++) {
      const target = buildStage >= i ? 1 : 0;
      stageReveal.current[i] += (target - stageReveal.current[i]) * 0.035;
    }
    flashRef.current = Math.max(0, flashRef.current - dt * 2);

    // Slow breathing
    const breath = Math.sin(time * 0.8) * 0.5 + 0.5;
    const breathSlow = Math.sin(time * 0.4) * 0.5 + 0.5;

    // ── Background atmosphere ──
    const bgGrad = ctx.createRadialGradient(w * 0.5, h * 0.45, 0, w * 0.5, h * 0.45, h * 0.6);
    bgGrad.addColorStop(0, `rgba(15,40,80,${0.04 + breathSlow * 0.02})`);
    bgGrad.addColorStop(0.5, `rgba(10,25,60,${0.02})`);
    bgGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // ── Draw connections (filaments) ──
    NODES.forEach((node, i) => {
      const reveal = stageReveal.current[node.stage];
      if (reveal < 0.01) return;

      const nx = node.x * w + Math.sin(time * 0.7 + node.phase) * 3 * node.z;
      const ny = node.y * h + Math.cos(time * 0.5 + node.phase * 1.3) * 2;

      node.connections.forEach(ci => {
        const cn = NODES[ci];
        const cReveal = stageReveal.current[cn.stage];
        if (cReveal < 0.01) return;

        const cx2 = cn.x * w + Math.sin(time * 0.7 + cn.phase) * 3 * cn.z;
        const cy2 = cn.y * h + Math.cos(time * 0.5 + cn.phase * 1.3) * 2;

        const connReveal = Math.min(reveal, cReveal);
        const depthAlpha = (1 - Math.abs(node.z - 0.5) * 0.6) * (1 - Math.abs(cn.z - 0.5) * 0.6);
        const alpha = connReveal * depthAlpha * (0.06 + breath * 0.02);

        // Filament
        ctx.beginPath();
        ctx.moveTo(nx, ny);
        // Slight curve for organic feel
        const midX = (nx + cx2) / 2 + Math.sin(time * 0.3 + i) * 4;
        const midY = (ny + cy2) / 2 + Math.cos(time * 0.25 + i) * 3;
        ctx.quadraticCurveTo(midX, midY, cx2, cy2);
        ctx.strokeStyle = `rgba(100,180,240,${alpha})`;
        ctx.lineWidth = 0.4 + connReveal * 0.3;
        ctx.stroke();

        // Glow filament
        ctx.beginPath();
        ctx.moveTo(nx, ny);
        ctx.quadraticCurveTo(midX, midY, cx2, cy2);
        ctx.strokeStyle = `rgba(80,160,230,${alpha * 0.3})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    });

    // ── Draw nodes ──
    NODES.forEach(node => {
      const reveal = stageReveal.current[node.stage];
      if (reveal < 0.01) return;

      const nx = node.x * w + Math.sin(time * 0.7 + node.phase) * 3 * node.z;
      const ny = node.y * h + Math.cos(time * 0.5 + node.phase * 1.3) * 2;
      const depthFactor = 0.4 + node.z * 0.6;
      const pulseSize = 1 + Math.sin(time * 1.5 + node.phase * 2) * 0.3;
      const r = node.radius * reveal * depthFactor * pulseSize;

      // Outer glow
      const glow = ctx.createRadialGradient(nx, ny, 0, nx, ny, r * 5);
      glow.addColorStop(0, `rgba(120,200,255,${reveal * depthFactor * 0.08})`);
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.fillRect(nx - r * 5, ny - r * 5, r * 10, r * 10);

      // Core
      ctx.beginPath();
      ctx.arc(nx, ny, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(160,220,255,${reveal * depthFactor * (0.3 + breath * 0.1)})`;
      ctx.fill();

      // Bright center
      if (reveal > 0.5) {
        ctx.beginPath();
        ctx.arc(nx, ny, r * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220,240,255,${reveal * depthFactor * 0.5})`;
        ctx.fill();
      }
    });

    // ── Fast signals (shooting stars) ──
    const activeSignals: Signal[] = [];
    signalsRef.current.forEach(sig => {
      sig.t += dt * sig.speed;
      if (sig.t > 1) return;
      activeSignals.push(sig);

      const fromNode = NODES[sig.fromIdx];
      const toNode = NODES[sig.toIdx];
      if (!fromNode || !toNode) return;

      const fromReveal = stageReveal.current[fromNode.stage];
      const toReveal = stageReveal.current[toNode.stage];
      if (fromReveal < 0.3 || toReveal < 0.3) return;

      const fx = fromNode.x * w + Math.sin(time * 0.7 + fromNode.phase) * 3 * fromNode.z;
      const fy = fromNode.y * h + Math.cos(time * 0.5 + fromNode.phase * 1.3) * 2;
      const tx = toNode.x * w + Math.sin(time * 0.7 + toNode.phase) * 3 * toNode.z;
      const ty = toNode.y * h + Math.cos(time * 0.5 + toNode.phase * 1.3) * 2;

      const t = easeOutCubic(sig.t);
      const px = fx + (tx - fx) * t;
      const py = fy + (ty - fy) * t;
      const fade = Math.sin(sig.t * Math.PI);

      // Signal glow
      const sg = ctx.createRadialGradient(px, py, 0, px, py, 10);
      sg.addColorStop(0, `hsla(${sig.hue},70%,75%,${fade * 0.6})`);
      sg.addColorStop(1, 'transparent');
      ctx.fillStyle = sg;
      ctx.fillRect(px - 10, py - 10, 20, 20);

      // Signal core
      ctx.beginPath();
      ctx.arc(px, py, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${sig.hue},60%,85%,${fade * 0.9})`;
      ctx.fill();

      // Trail
      const trailLen = 0.08;
      const tt = Math.max(0, sig.t - trailLen);
      const tPrev = easeOutCubic(tt);
      const trailX = fx + (tx - fx) * tPrev;
      const trailY = fy + (ty - fy) * tPrev;
      ctx.beginPath();
      ctx.moveTo(trailX, trailY);
      ctx.lineTo(px, py);
      ctx.strokeStyle = `hsla(${sig.hue},60%,70%,${fade * 0.3})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    });
    signalsRef.current = activeSignals;

    // ── Ambient signals when fully built ──
    if (buildStage >= 7) {
      // Spawn random fast signals
      if (Math.random() < 0.06) {
        const fromIdx = Math.floor(Math.random() * NODES.length);
        const node = NODES[fromIdx];
        if (node.connections.length > 0) {
          const toIdx = node.connections[Math.floor(Math.random() * node.connections.length)];
          signalsRef.current.push({
            fromIdx,
            toIdx,
            t: 0,
            speed: 1.2 + Math.random() * 2.5,
            hue: 195 + Math.random() * 50,
          });
        }
      }

      // Chain reactions — signal arrival spawns new signal
      if (Math.random() < 0.03) {
        const fromIdx = Math.floor(Math.random() * NODES.length);
        const node = NODES[fromIdx];
        node.connections.forEach(ci => {
          const cn = NODES[ci];
          if (cn.connections.length > 0 && Math.random() < 0.3) {
            const next = cn.connections[Math.floor(Math.random() * cn.connections.length)];
            signalsRef.current.push({
              fromIdx: ci,
              toIdx: next,
              t: 0,
              speed: 2 + Math.random() * 2,
              hue: 210 + Math.random() * 30,
            });
          }
        });
      }
    }

    // ── Flash on new stage ──
    if (flashRef.current > 0.01) {
      const fg = ctx.createRadialGradient(w * 0.5, h * 0.45, 0, w * 0.5, h * 0.45, h * 0.5);
      fg.addColorStop(0, `rgba(100,180,255,${flashRef.current * 0.06})`);
      fg.addColorStop(1, 'transparent');
      ctx.fillStyle = fg;
      ctx.fillRect(0, 0, w, h);
    }

    // ── Depth haze layers ──
    // Front haze
    const frontHaze = ctx.createRadialGradient(w * 0.5, h * 0.5, h * 0.1, w * 0.5, h * 0.5, h * 0.55);
    frontHaze.addColorStop(0, 'transparent');
    frontHaze.addColorStop(1, `rgba(0,0,0,${0.15 + breathSlow * 0.05})`);
    ctx.fillStyle = frontHaze;
    ctx.fillRect(0, 0, w, h);

  }, [buildStage]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    startTime.current = performance.now() / 1000;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = () => {
      const rect = canvas.getBoundingClientRect();
      const time = performance.now() / 1000 - startTime.current;
      draw(ctx, rect.width, rect.height, time);
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [draw]);

  return (
    <div className="w-full h-full relative">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ background: 'transparent' }}
      />
    </div>
  );
};
