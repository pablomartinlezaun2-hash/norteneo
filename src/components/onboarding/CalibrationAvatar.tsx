import { useRef, useEffect, useCallback } from 'react';

/* ═══════════════════════════════════════════
   NEURAL RIVER NETWORK — Organic Neural Growth
   Canvas-based neural network that grows outward
   from center in all directions like dendrites
   ═══════════════════════════════════════════ */

interface CalibrationAvatarProps {
  buildStage: number; // -1=nothing, 0-7 progressive, 8=complete
}

/* ── Easing ── */
const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/* ── Point ── */
interface Pt {
  x: number;
  y: number;
}

/* ── Branch ── */
interface Branch {
  points: Pt[];
  stage: number;
  depth: number;
  width: number;
  hue: number;
  revealProgress: number;
  revealSpeed: number; // how fast it reveals (units per second)
  revealed: boolean; // has started revealing
  glowIntensity: number;
}

/* ── Pulse ── */
interface Pulse {
  branchIdx: number;
  t: number;
  speed: number;
  type: 'slow' | 'fast';
  brightness: number;
  hue: number;
  trailLen: number;
}

/* ── Seeded random ── */
function sRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/* ── Generate smooth curved path ── */
function curvePath(
  sx: number, sy: number, ex: number, ey: number,
  segs: number, wobble: number, rng: () => number
): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    // Smooth cubic interpolation with organic wobble
    const st = t * t * (3 - 2 * t); // smoothstep
    const wx = i > 0 && i < segs ? (rng() - 0.5) * wobble : 0;
    const wy = i > 0 && i < segs ? (rng() - 0.5) * wobble : 0;
    pts.push({
      x: sx + (ex - sx) * st + wx,
      y: sy + (ey - sy) * st + wy,
    });
  }
  return pts;
}

/* ── Build a sprawling neural network from center ── */
function buildNetwork(): Branch[] {
  const rng = sRng(123);
  const branches: Branch[] = [];

  const cx = 0.50;
  const cy = 0.48;

  // Add a branch from origin in a direction
  const add = (
    ox: number, oy: number,
    angle: number, len: number,
    stage: number, depth: number, width: number,
    hue: number, segs: number = 8, wobble: number = 0.04
  ): number => {
    const ex = ox + Math.cos(angle) * len;
    const ey = oy + Math.sin(angle) * len;
    const pts = curvePath(ox, oy, ex, ey, segs, wobble, rng);
    branches.push({
      points: pts,
      stage,
      depth,
      width,
      revealProgress: 0,
      revealSpeed: 0.12 + rng() * 0.08, // slow: takes ~5-8 seconds
      revealed: false,
      hue,
      glowIntensity: 0.6 + rng() * 0.4,
    });
    return branches.length - 1;
  };

  // Get endpoint of a branch
  const endOf = (idx: number): Pt => {
    const pts = branches[idx].points;
    return pts[pts.length - 1];
  };

  // Get midpoint of a branch
  const midOf = (idx: number, t: number = 0.5): Pt => {
    const pts = branches[idx].points;
    const fi = t * (pts.length - 1);
    const i = Math.floor(fi);
    const f = fi - i;
    const a = pts[Math.min(i, pts.length - 1)];
    const b = pts[Math.min(i + 1, pts.length - 1)];
    return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
  };

  // ═══ STAGE 0: Core star — 5 primary directions from center ═══
  const s0a = add(cx, cy, -Math.PI * 0.5, 0.18, 0, 0.1, 2.2, 210, 10, 0.035);  // up
  const s0b = add(cx, cy, -Math.PI * 0.8, 0.16, 0, 0.12, 2.0, 205, 9, 0.04);   // up-left
  const s0c = add(cx, cy, -Math.PI * 0.2, 0.17, 0, 0.12, 2.0, 215, 9, 0.04);   // up-right
  const s0d = add(cx, cy, Math.PI * 0.7, 0.14, 0, 0.15, 1.8, 200, 8, 0.03);    // down-left
  const s0e = add(cx, cy, Math.PI * 0.3, 0.15, 0, 0.15, 1.8, 220, 8, 0.03);    // down-right

  // ═══ STAGE 1: Each primary extends + first side branches ═══
  const e0a = endOf(s0a);
  const s1a = add(e0a.x, e0a.y, -1.3, 0.12, 1, 0.2, 1.5, 208, 7, 0.035);
  const s1b = add(e0a.x, e0a.y, -1.8, 0.10, 1, 0.22, 1.4, 202, 7, 0.03);
  const e0b = endOf(s0b);
  const s1c = add(e0b.x, e0b.y, -2.3, 0.13, 1, 0.2, 1.5, 200, 7, 0.04);
  const e0c = endOf(s0c);
  const s1d = add(e0c.x, e0c.y, -0.5, 0.11, 1, 0.2, 1.5, 218, 7, 0.035);
  // Side branches from mid-primary
  const m0d = midOf(s0d, 0.6);
  add(m0d.x, m0d.y, Math.PI * 0.95, 0.09, 1, 0.3, 1.2, 195, 6, 0.03);
  const m0e = midOf(s0e, 0.6);
  add(m0e.x, m0e.y, Math.PI * 0.05, 0.10, 1, 0.3, 1.2, 225, 6, 0.03);

  // ═══ STAGE 2: More ramification ═══
  const e1a = endOf(s1a);
  const s2a = add(e1a.x, e1a.y, -1.0, 0.10, 2, 0.3, 1.2, 212, 6, 0.035);
  add(e1a.x, e1a.y, -1.7, 0.08, 2, 0.35, 1.0, 205, 5, 0.03);
  const e1c = endOf(s1c);
  add(e1c.x, e1c.y, -2.6, 0.09, 2, 0.3, 1.1, 198, 6, 0.03);
  add(e1c.x, e1c.y, -1.9, 0.07, 2, 0.35, 0.9, 210, 5, 0.025);
  const e1d = endOf(s1d);
  add(e1d.x, e1d.y, -0.2, 0.10, 2, 0.28, 1.2, 220, 6, 0.035);
  add(e1d.x, e1d.y, 0.5, 0.08, 2, 0.32, 1.0, 225, 5, 0.03);
  // Downward growth
  const e0d = endOf(s0d);
  add(e0d.x, e0d.y, Math.PI * 0.8, 0.10, 2, 0.25, 1.3, 195, 6, 0.04);
  const e0e = endOf(s0e);
  add(e0e.x, e0e.y, Math.PI * 0.2, 0.11, 2, 0.25, 1.3, 228, 6, 0.04);

  // ═══ STAGE 3: Denser sub-branching ═══
  const stage3Sources = [s2a, s1b, s1c, s1d, s0d, s0e];
  stage3Sources.forEach(srcIdx => {
    const ep = endOf(srcIdx);
    const baseAngle = Math.atan2(ep.y - cy, ep.x - cx);
    add(ep.x, ep.y, baseAngle + (rng() - 0.5) * 1.2, 0.06 + rng() * 0.05, 3, 0.35 + rng() * 0.15, 0.8 + rng() * 0.3, 200 + rng() * 25, 5, 0.025);
    const mp = midOf(srcIdx, 0.4 + rng() * 0.3);
    add(mp.x, mp.y, baseAngle + (rng() - 0.5) * 2.0, 0.05 + rng() * 0.04, 3, 0.4 + rng() * 0.15, 0.6 + rng() * 0.3, 200 + rng() * 25, 4, 0.02);
  });

  // ═══ STAGE 4: Finer dendrites ═══
  for (let i = 0; i < 12; i++) {
    const src = branches[Math.floor(rng() * Math.min(branches.length, 25))];
    const ep = src.points[src.points.length - 1];
    const angle = Math.atan2(ep.y - cy, ep.x - cx) + (rng() - 0.5) * 1.5;
    add(ep.x, ep.y, angle, 0.04 + rng() * 0.04, 4, 0.4 + rng() * 0.2, 0.5 + rng() * 0.3, 200 + rng() * 30, 4, 0.02);
  }

  // ═══ STAGE 5: Even finer ═══
  for (let i = 0; i < 14; i++) {
    const pool = branches.filter(b => b.stage <= 3);
    const src = pool[Math.floor(rng() * pool.length)];
    const t = 0.3 + rng() * 0.6;
    const mp = midOf(branches.indexOf(src), t);
    const angle = Math.atan2(mp.y - cy, mp.x - cx) + (rng() - 0.5) * 2.0;
    add(mp.x, mp.y, angle, 0.03 + rng() * 0.04, 5, 0.5 + rng() * 0.2, 0.35 + rng() * 0.2, 205 + rng() * 25, 3, 0.018);
  }

  // ═══ STAGE 6: Micro-dendrites ═══
  for (let i = 0; i < 16; i++) {
    const pool = branches.filter(b => b.stage <= 4);
    const src = pool[Math.floor(rng() * pool.length)];
    const t = 0.2 + rng() * 0.7;
    const mp = midOf(branches.indexOf(src), t);
    const angle = (rng()) * Math.PI * 2;
    add(mp.x, mp.y, angle, 0.02 + rng() * 0.03, 6, 0.6 + rng() * 0.2, 0.2 + rng() * 0.15, 208 + rng() * 20, 3, 0.015);
  }

  // ═══ STAGE 7: Ultra-fine final layer ═══
  for (let i = 0; i < 18; i++) {
    const pool = branches.filter(b => b.stage <= 5);
    const src = pool[Math.floor(rng() * pool.length)];
    const t = 0.15 + rng() * 0.75;
    const mp = midOf(branches.indexOf(src), t);
    const angle = (rng()) * Math.PI * 2;
    add(mp.x, mp.y, angle, 0.015 + rng() * 0.025, 7, 0.7 + rng() * 0.2, 0.12 + rng() * 0.12, 210 + rng() * 15, 2, 0.012);
  }

  return branches;
}

const NETWORK = buildNetwork();

/* ── Interpolate point on branch ── */
function ptOn(b: Branch, t: number): Pt {
  const pts = b.points;
  const idx = Math.min(t, 1) * (pts.length - 1);
  const i = Math.floor(idx);
  const f = idx - i;
  const a = pts[Math.min(i, pts.length - 1)];
  const bb = pts[Math.min(i + 1, pts.length - 1)];
  return { x: a.x + (bb.x - a.x) * f, y: a.y + (bb.y - a.y) * f };
}

export const CalibrationAvatar = ({ buildStage }: CalibrationAvatarProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);
  const startTime = useRef(0);
  const branchesRef = useRef<Branch[]>([]);
  const pulsesRef = useRef<Pulse[]>([]);
  const prevStage = useRef(-2);
  const flashRef = useRef(0);

  // Init branches on mount
  useEffect(() => {
    branchesRef.current = NETWORK.map(b => ({
      ...b,
      revealProgress: 0,
      revealed: false,
    }));
  }, []);

  // Stage change: mark branches to start revealing (slowly, continuously)
  useEffect(() => {
    if (buildStage === prevStage.current) return;

    const branches = branchesRef.current;
    if (!branches.length) return;

    if (buildStage > prevStage.current) {
      flashRef.current = 0.8;
    }

    // Mark all branches up to current stage to start revealing
    branches.forEach(branch => {
      if (branch.stage <= buildStage && !branch.revealed) {
        branch.revealed = true;
        // Stagger start slightly for organic feel — already-passed stages reveal faster
        if (branch.stage < buildStage) {
          branch.revealSpeed = 0.5 + Math.random() * 0.3; // fast catch-up
        }
        // Current stage: slow beautiful reveal
        // revealSpeed already set in buildNetwork
      }
    });

    // Spawn some fast pulses on already-revealed branches for excitement
    if (buildStage > 0) {
      branches.forEach((branch, i) => {
        if (branch.stage < buildStage && branch.revealProgress > 0.5 && Math.random() < 0.3) {
          pulsesRef.current.push({
            branchIdx: i,
            t: 0,
            speed: 1.5 + Math.random() * 2,
            type: 'fast',
            brightness: 0.7 + Math.random() * 0.3,
            hue: branch.hue + (Math.random() - 0.5) * 15,
            trailLen: 0.07,
          });
        }
      });
    }

    prevStage.current = buildStage;
  }, [buildStage]);

  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => {
    const dt = 1 / 60;
    ctx.clearRect(0, 0, w, h);

    const branches = branchesRef.current;
    if (!branches.length) return;

    const breath = Math.sin(time * 0.5) * 0.5 + 0.5;
    const breathSlow = Math.sin(time * 0.25) * 0.5 + 0.5;

    flashRef.current = Math.max(0, flashRef.current - dt * 1.2);

    // ── Background atmosphere ──
    const bgGrad = ctx.createRadialGradient(w * 0.5, h * 0.48, 0, w * 0.5, h * 0.48, h * 0.65);
    bgGrad.addColorStop(0, `rgba(10,30,70,${0.07 + breathSlow * 0.03})`);
    bgGrad.addColorStop(0.6, `rgba(5,15,45,${0.03})`);
    bgGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // ── Update reveal progress (smooth continuous growth) ──
    branches.forEach(branch => {
      if (branch.revealed && branch.revealProgress < 1) {
        branch.revealProgress = Math.min(1, branch.revealProgress + dt * branch.revealSpeed);
      }
    });

    // ── Draw helper: path up to revealProgress ──
    const drawPath = (branch: Branch, maxT?: number) => {
      const pts = branch.points;
      const rp = maxT !== undefined ? Math.min(maxT, branch.revealProgress) : branch.revealProgress;
      if (rp < 0.005) return;

      const totalPts = pts.length - 1;
      const drawEnd = rp * totalPts;
      const drawIdx = Math.floor(drawEnd);
      const frac = drawEnd - drawIdx;

      ctx.beginPath();
      ctx.moveTo(pts[0].x * w, pts[0].y * h);
      for (let i = 1; i <= drawIdx && i < pts.length; i++) {
        ctx.lineTo(pts[i].x * w, pts[i].y * h);
      }
      // Fractional last segment
      if (drawIdx < totalPts) {
        const a = pts[drawIdx];
        const b = pts[drawIdx + 1];
        ctx.lineTo(
          (a.x + (b.x - a.x) * frac) * w,
          (a.y + (b.y - a.y) * frac) * h
        );
      }
    };

    // ── Sort by depth for painter's order ──
    const sortedIndices = branches
      .map((_, i) => i)
      .sort((a, b) => branches[b].depth - branches[a].depth);

    // ── Draw branches ──
    sortedIndices.forEach(bi => {
      const branch = branches[bi];
      if (branch.revealProgress < 0.005) return;

      const dAlpha = 1 - branch.depth * 0.55;
      const rp = branch.revealProgress;
      const breathMod = 1 + breath * 0.12 * branch.glowIntensity;

      // Wide glow
      drawPath(branch);
      ctx.strokeStyle = `hsla(${branch.hue},70%,50%,${0.05 * dAlpha * rp})`;
      ctx.lineWidth = (branch.width * 8 + 6) * breathMod;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Medium glow
      drawPath(branch);
      ctx.strokeStyle = `hsla(${branch.hue},65%,58%,${0.14 * dAlpha * rp})`;
      ctx.lineWidth = (branch.width * 3 + 2) * breathMod;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Core
      drawPath(branch);
      ctx.strokeStyle = `hsla(${branch.hue},55%,75%,${(0.35 + breath * 0.1) * dAlpha * rp})`;
      ctx.lineWidth = branch.width * breathMod;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Hot center for thick branches
      if (branch.width > 1.0) {
        drawPath(branch);
        ctx.strokeStyle = `hsla(${branch.hue},35%,92%,${0.2 * dAlpha * rp})`;
        ctx.lineWidth = Math.max(0.5, branch.width * 0.25) * breathMod;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      // ── Reveal head glow (bright dot at the growing tip) ──
      if (branch.revealProgress > 0.01 && branch.revealProgress < 0.98) {
        const tip = ptOn(branch, branch.revealProgress);
        const tx = tip.x * w;
        const ty = tip.y * h;
        const headSize = branch.width * 2.5;

        // Glow
        const hg = ctx.createRadialGradient(tx, ty, 0, tx, ty, headSize * 4);
        hg.addColorStop(0, `hsla(${branch.hue},60%,80%,${0.5 * dAlpha})`);
        hg.addColorStop(0.4, `hsla(${branch.hue},65%,65%,${0.15 * dAlpha})`);
        hg.addColorStop(1, 'transparent');
        ctx.fillStyle = hg;
        ctx.fillRect(tx - headSize * 4, ty - headSize * 4, headSize * 8, headSize * 8);

        // Bright core
        ctx.beginPath();
        ctx.arc(tx, ty, headSize * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${branch.hue},40%,95%,${0.7 * dAlpha})`;
        ctx.fill();
      }
    });

    // ── Junction nodes ──
    branches.forEach(branch => {
      if (branch.revealProgress < 0.15) return;
      const pt = branch.points[0];
      const px = pt.x * w;
      const py = pt.y * h;
      const dAlpha = 1 - branch.depth * 0.45;
      const ns = branch.width * 1.0;
      const pulse = 1 + Math.sin(time * 1.0 + branch.hue * 0.15) * 0.25;

      const ng = ctx.createRadialGradient(px, py, 0, px, py, ns * 4 * pulse);
      ng.addColorStop(0, `hsla(${branch.hue},55%,78%,${0.25 * dAlpha * branch.revealProgress})`);
      ng.addColorStop(0.4, `hsla(${branch.hue},60%,60%,${0.08 * dAlpha * branch.revealProgress})`);
      ng.addColorStop(1, 'transparent');
      ctx.fillStyle = ng;
      ctx.fillRect(px - ns * 4 * pulse, py - ns * 4 * pulse, ns * 8 * pulse, ns * 8 * pulse);

      ctx.beginPath();
      ctx.arc(px, py, ns * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${branch.hue},40%,88%,${0.4 * dAlpha * branch.revealProgress * (0.75 + breath * 0.25)})`;
      ctx.fill();
    });

    // ── Pulses ──
    const activePulses: Pulse[] = [];
    pulsesRef.current.forEach(pulse => {
      pulse.t += dt * pulse.speed;
      if (pulse.t > 1) {
        // Chain to next branch
        if (pulse.type === 'fast' && Math.random() < 0.25) {
          const revealed = branches.filter((b, i) => b.revealProgress > 0.5 && i !== pulse.branchIdx);
          if (revealed.length > 0) {
            const nb = revealed[Math.floor(Math.random() * revealed.length)];
            const ni = branches.indexOf(nb);
            activePulses.push({
              branchIdx: ni, t: 0,
              speed: 1.8 + Math.random() * 2.5,
              type: 'fast',
              brightness: 0.5 + Math.random() * 0.3,
              hue: nb.hue + (Math.random() - 0.5) * 15,
              trailLen: 0.06,
            });
          }
        }
        return;
      }
      activePulses.push(pulse);

      const branch = branches[pulse.branchIdx];
      if (!branch || branch.revealProgress < 0.05) return;

      const drawT = Math.min(pulse.t, branch.revealProgress);
      const pt = ptOn(branch, drawT);
      const px = pt.x * w;
      const py = pt.y * h;

      const fade = Math.sin(Math.min(pulse.t / Math.max(branch.revealProgress, 0.01), 1) * Math.PI);
      const sz = pulse.type === 'fast' ? 2.5 : 3.5;

      // Glow
      const pg = ctx.createRadialGradient(px, py, 0, px, py, sz * 5);
      pg.addColorStop(0, `hsla(${pulse.hue},65%,78%,${fade * pulse.brightness * 0.55})`);
      pg.addColorStop(0.5, `hsla(${pulse.hue},60%,65%,${fade * pulse.brightness * 0.12})`);
      pg.addColorStop(1, 'transparent');
      ctx.fillStyle = pg;
      ctx.fillRect(px - sz * 5, py - sz * 5, sz * 10, sz * 10);

      // Core
      ctx.beginPath();
      ctx.arc(px, py, sz * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${pulse.hue},45%,92%,${fade * pulse.brightness * 0.9})`;
      ctx.fill();

      // Trail
      const ts = Math.max(0, drawT - pulse.trailLen);
      const tp = ptOn(branch, ts);
      const tg = ctx.createLinearGradient(tp.x * w, tp.y * h, px, py);
      tg.addColorStop(0, 'transparent');
      tg.addColorStop(1, `hsla(${pulse.hue},60%,75%,${fade * pulse.brightness * 0.45})`);
      ctx.beginPath();
      ctx.moveTo(tp.x * w, tp.y * h);
      const steps = 5;
      for (let s = 1; s <= steps; s++) {
        const sp = ptOn(branch, ts + (drawT - ts) * (s / steps));
        ctx.lineTo(sp.x * w, sp.y * h);
      }
      ctx.strokeStyle = tg;
      ctx.lineWidth = pulse.type === 'fast' ? 0.8 : 1.5;
      ctx.lineCap = 'round';
      ctx.stroke();
    });
    pulsesRef.current = activePulses;

    // ── Ambient pulses ──
    if (buildStage >= 2) {
      // Slow
      if (Math.random() < 0.015) {
        const pool = branches.filter(b => b.revealProgress > 0.8);
        if (pool.length > 0) {
          const b = pool[Math.floor(Math.random() * pool.length)];
          const bi = branches.indexOf(b);
          pulsesRef.current.push({
            branchIdx: bi, t: 0,
            speed: 0.15 + Math.random() * 0.15,
            type: 'slow',
            brightness: 0.35 + Math.random() * 0.25,
            hue: b.hue + (Math.random() - 0.5) * 10,
            trailLen: 0.2,
          });
        }
      }
      // Fast
      if (Math.random() < (buildStage >= 5 ? 0.05 : 0.025)) {
        const pool = branches.filter(b => b.revealProgress > 0.8);
        if (pool.length > 0) {
          const b = pool[Math.floor(Math.random() * pool.length)];
          const bi = branches.indexOf(b);
          pulsesRef.current.push({
            branchIdx: bi, t: 0,
            speed: 2 + Math.random() * 3,
            type: 'fast',
            brightness: 0.6 + Math.random() * 0.4,
            hue: b.hue + (Math.random() - 0.5) * 20,
            trailLen: 0.05 + Math.random() * 0.04,
          });
        }
      }
    }

    // ── Central core glow ──
    if (buildStage >= 0) {
      const coreAlpha = Math.min(1, branches.filter(b => b.stage === 0).reduce((a, b) => a + b.revealProgress, 0) / 3);
      const cg = ctx.createRadialGradient(w * 0.5, h * 0.48, 0, w * 0.5, h * 0.48, 25 + breath * 8);
      cg.addColorStop(0, `hsla(210,50%,80%,${0.25 * coreAlpha})`);
      cg.addColorStop(0.3, `hsla(210,60%,65%,${0.1 * coreAlpha})`);
      cg.addColorStop(1, 'transparent');
      ctx.fillStyle = cg;
      ctx.fillRect(w * 0.5 - 40, h * 0.48 - 40, 80, 80);

      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.48, 2 + breath * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(210,40%,92%,${0.5 * coreAlpha})`;
      ctx.fill();
    }

    // ── Flash ──
    if (flashRef.current > 0.01) {
      const fg = ctx.createRadialGradient(w * 0.5, h * 0.48, 0, w * 0.5, h * 0.48, h * 0.45);
      fg.addColorStop(0, `rgba(80,160,255,${flashRef.current * 0.06})`);
      fg.addColorStop(1, 'transparent');
      ctx.fillStyle = fg;
      ctx.fillRect(0, 0, w, h);
    }

    // ── Vignette ──
    const vig = ctx.createRadialGradient(w * 0.5, h * 0.48, h * 0.15, w * 0.5, h * 0.48, h * 0.6);
    vig.addColorStop(0, 'transparent');
    vig.addColorStop(1, `rgba(0,0,0,${0.25 + breathSlow * 0.05})`);
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);

  }, [buildStage]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    startTime.current = performance.now() / 1000;

    // Re-init branches
    branchesRef.current = NETWORK.map(b => ({ ...b, revealProgress: 0, revealed: false }));
    pulsesRef.current = [];

    // Instant reveal for already-passed stages
    if (buildStage >= 0) {
      branchesRef.current.forEach(branch => {
        if (branch.stage <= buildStage) {
          branch.revealed = true;
          branch.revealProgress = 1;
        }
      });
    }

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
