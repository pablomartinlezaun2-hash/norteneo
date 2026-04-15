import { useRef, useEffect, useCallback } from 'react';

/* ═══════════════════════════════════════════
   NEURAL RIVER NETWORK — Continuous Organic Growth
   Canvas-based neural network that grows continuously
   from center outward, never stopping, never jumping.
   Growth is TIME-BASED, not stage-gated.
   ═══════════════════════════════════════════ */

interface CalibrationAvatarProps {
  buildStage: number; // 0-8, controls target density
}

/* ── Point ── */
interface Pt { x: number; y: number; }

/* ── Branch ── */
interface Branch {
  points: Pt[];
  stage: number;
  depth: number;
  width: number;
  hue: number;
  revealProgress: number;
  revealStartTime: number; // seconds after mount when this branch starts growing
  revealDuration: number;  // seconds to fully reveal
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
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

/* ── Generate smooth curved path ── */
function curvePath(
  sx: number, sy: number, ex: number, ey: number,
  segs: number, wobble: number, rng: () => number
): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const st = t * t * (3 - 2 * t);
    const wx = i > 0 && i < segs ? (rng() - 0.5) * wobble : 0;
    const wy = i > 0 && i < segs ? (rng() - 0.5) * wobble : 0;
    pts.push({ x: sx + (ex - sx) * st + wx, y: sy + (ey - sy) * st + wy });
  }
  return pts;
}

/* ── Build network ── */
function buildNetwork(): Branch[] {
  const rng = sRng(777);
  const branches: Branch[] = [];
  const cx = 0.50, cy = 0.48;

  const add = (
    ox: number, oy: number, angle: number, len: number,
    stage: number, depth: number, width: number, hue: number,
    segs = 8, wobble = 0.04
  ): number => {
    const ex = ox + Math.cos(angle) * len;
    const ey = oy + Math.sin(angle) * len;
    const pts = curvePath(ox, oy, ex, ey, segs, wobble, rng);

    // Time-based: each stage starts ~5s later, spread over entire questionnaire (~60s total)
    const stageDelay = stage * 5.5;
    const intraStagger = rng() * 4.5;
    const startTime = stageDelay + intraStagger;
    const duration = 4.0 + rng() * 5.0; // 4-9 seconds to fully draw

    branches.push({
      points: pts, stage, depth, width, hue,
      revealProgress: 0,
      revealStartTime: startTime,
      revealDuration: duration,
      glowIntensity: 0.6 + rng() * 0.4,
    });
    return branches.length - 1;
  };

  const endOf = (idx: number): Pt => {
    const pts = branches[idx].points;
    return pts[pts.length - 1];
  };
  const midOf = (idx: number, t = 0.5): Pt => {
    const pts = branches[idx].points;
    const fi = t * (pts.length - 1);
    const i = Math.floor(fi); const f = fi - i;
    const a = pts[Math.min(i, pts.length - 1)];
    const b = pts[Math.min(i + 1, pts.length - 1)];
    return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
  };

  // ═══ STAGE 0: 6 primary directions ═══
  const s0a = add(cx, cy, -Math.PI * 0.5, 0.18, 0, 0.08, 2.5, 210, 12, 0.03);
  const s0b = add(cx, cy, -Math.PI * 0.78, 0.16, 0, 0.1, 2.2, 205, 10, 0.035);
  const s0c = add(cx, cy, -Math.PI * 0.22, 0.17, 0, 0.1, 2.2, 215, 10, 0.035);
  const s0d = add(cx, cy, Math.PI * 0.65, 0.15, 0, 0.12, 2.0, 200, 9, 0.03);
  const s0e = add(cx, cy, Math.PI * 0.35, 0.16, 0, 0.12, 2.0, 220, 9, 0.03);
  const s0f = add(cx, cy, Math.PI, 0.12, 0, 0.14, 1.8, 208, 8, 0.025);

  // ═══ STAGE 1: Extensions + side branches ═══
  const e0a = endOf(s0a);
  const s1a = add(e0a.x, e0a.y, -1.3, 0.13, 1, 0.18, 1.6, 208, 8, 0.035);
  const s1b = add(e0a.x, e0a.y, -1.85, 0.11, 1, 0.2, 1.4, 202, 7, 0.03);
  const e0b = endOf(s0b);
  const s1c = add(e0b.x, e0b.y, -2.4, 0.14, 1, 0.18, 1.6, 200, 8, 0.04);
  add(e0b.x, e0b.y, -2.9, 0.09, 1, 0.25, 1.1, 198, 6, 0.025);
  const e0c = endOf(s0c);
  const s1d = add(e0c.x, e0c.y, -0.4, 0.12, 1, 0.18, 1.6, 218, 8, 0.035);
  add(e0c.x, e0c.y, 0.1, 0.08, 1, 0.25, 1.1, 222, 6, 0.025);
  const m0d = midOf(s0d, 0.55);
  add(m0d.x, m0d.y, Math.PI * 0.9, 0.10, 1, 0.28, 1.2, 195, 6, 0.03);
  const m0e = midOf(s0e, 0.55);
  add(m0e.x, m0e.y, Math.PI * 0.1, 0.11, 1, 0.28, 1.2, 225, 6, 0.03);

  // ═══ STAGE 2 ═══
  const e1a = endOf(s1a);
  const s2a = add(e1a.x, e1a.y, -1.0, 0.11, 2, 0.28, 1.3, 212, 7, 0.035);
  add(e1a.x, e1a.y, -1.6, 0.08, 2, 0.32, 1.0, 205, 5, 0.03);
  const e1c = endOf(s1c);
  add(e1c.x, e1c.y, -2.6, 0.10, 2, 0.28, 1.2, 198, 7, 0.03);
  add(e1c.x, e1c.y, -2.0, 0.07, 2, 0.33, 0.9, 210, 5, 0.025);
  const e1d = endOf(s1d);
  add(e1d.x, e1d.y, -0.15, 0.11, 2, 0.26, 1.3, 220, 7, 0.035);
  add(e1d.x, e1d.y, 0.6, 0.08, 2, 0.3, 1.0, 225, 5, 0.03);
  const e0d = endOf(s0d);
  add(e0d.x, e0d.y, Math.PI * 0.75, 0.11, 2, 0.22, 1.4, 195, 7, 0.04);
  const e0e = endOf(s0e);
  add(e0e.x, e0e.y, Math.PI * 0.25, 0.12, 2, 0.22, 1.4, 228, 7, 0.04);
  const e0f = endOf(s0f);
  add(e0f.x, e0f.y, Math.PI * 0.85, 0.09, 2, 0.3, 1.0, 203, 6, 0.03);
  add(e0f.x, e0f.y, Math.PI * 1.15, 0.10, 2, 0.3, 1.0, 212, 6, 0.03);

  // ═══ STAGE 3: Denser sub-branching ═══
  const stage3Sources = [s2a, s1b, s1c, s1d, s0d, s0e, s0f];
  stage3Sources.forEach(srcIdx => {
    const ep = endOf(srcIdx);
    const ba = Math.atan2(ep.y - cy, ep.x - cx);
    add(ep.x, ep.y, ba + (rng() - 0.5) * 1.2, 0.06 + rng() * 0.06, 3, 0.33 + rng() * 0.15, 0.8 + rng() * 0.4, 200 + rng() * 25, 6, 0.025);
    const mp = midOf(srcIdx, 0.35 + rng() * 0.3);
    add(mp.x, mp.y, ba + (rng() - 0.5) * 2.0, 0.05 + rng() * 0.05, 3, 0.38 + rng() * 0.15, 0.6 + rng() * 0.3, 200 + rng() * 25, 5, 0.02);
  });

  // ═══ STAGE 4 ═══
  for (let i = 0; i < 14; i++) {
    const src = branches[Math.floor(rng() * Math.min(branches.length, 30))];
    const ep = src.points[src.points.length - 1];
    const a = Math.atan2(ep.y - cy, ep.x - cx) + (rng() - 0.5) * 1.5;
    add(ep.x, ep.y, a, 0.04 + rng() * 0.05, 4, 0.38 + rng() * 0.2, 0.5 + rng() * 0.35, 200 + rng() * 30, 5, 0.02);
  }

  // ═══ STAGE 5 ═══
  for (let i = 0; i < 16; i++) {
    const pool = branches.filter(b => b.stage <= 3);
    const src = pool[Math.floor(rng() * pool.length)];
    const t = 0.25 + rng() * 0.6;
    const mp = midOf(branches.indexOf(src), t);
    const a = Math.atan2(mp.y - cy, mp.x - cx) + (rng() - 0.5) * 2.0;
    add(mp.x, mp.y, a, 0.03 + rng() * 0.045, 5, 0.45 + rng() * 0.2, 0.35 + rng() * 0.25, 205 + rng() * 25, 4, 0.018);
  }

  // ═══ STAGE 6 ═══
  for (let i = 0; i < 18; i++) {
    const pool = branches.filter(b => b.stage <= 4);
    const src = pool[Math.floor(rng() * pool.length)];
    const t = 0.2 + rng() * 0.7;
    const mp = midOf(branches.indexOf(src), t);
    const a = rng() * Math.PI * 2;
    add(mp.x, mp.y, a, 0.02 + rng() * 0.035, 6, 0.55 + rng() * 0.2, 0.2 + rng() * 0.18, 208 + rng() * 20, 3, 0.015);
  }

  // ═══ STAGE 7 ═══
  for (let i = 0; i < 20; i++) {
    const pool = branches.filter(b => b.stage <= 5);
    const src = pool[Math.floor(rng() * pool.length)];
    const t = 0.15 + rng() * 0.75;
    const mp = midOf(branches.indexOf(src), t);
    const a = rng() * Math.PI * 2;
    add(mp.x, mp.y, a, 0.015 + rng() * 0.028, 7, 0.65 + rng() * 0.2, 0.12 + rng() * 0.14, 210 + rng() * 15, 2, 0.012);
  }

  return branches;
}

const NETWORK = buildNetwork();

/* ── Interpolate point on branch ── */
function ptOn(b: Branch, t: number): Pt {
  const pts = b.points;
  const idx = Math.min(t, 1) * (pts.length - 1);
  const i = Math.floor(idx); const f = idx - i;
  const a = pts[Math.min(i, pts.length - 1)];
  const bb = pts[Math.min(i + 1, pts.length - 1)];
  return { x: a.x + (bb.x - a.x) * f, y: a.y + (bb.y - a.y) * f };
}

export const CalibrationAvatar = ({ buildStage }: CalibrationAvatarProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);
  const branchesRef = useRef<Branch[]>([]);
  const pulsesRef = useRef<Pulse[]>([]);
  const mountTime = useRef(0);

  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, elapsed: number) => {
    const dt = 1 / 60;
    ctx.clearRect(0, 0, w, h);

    const branches = branchesRef.current;
    if (!branches.length) return;

    const breath = Math.sin(elapsed * 0.5) * 0.5 + 0.5;
    const breathSlow = Math.sin(elapsed * 0.25) * 0.5 + 0.5;

    // ── Background atmosphere ──
    const bgGrad = ctx.createRadialGradient(w * 0.5, h * 0.48, 0, w * 0.5, h * 0.48, h * 0.65);
    bgGrad.addColorStop(0, `rgba(8,25,65,${0.08 + breathSlow * 0.03})`);
    bgGrad.addColorStop(0.6, `rgba(4,12,40,${0.03})`);
    bgGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // ── Update reveal: PURELY TIME-BASED, continuous ──
    branches.forEach(branch => {
      if (elapsed < branch.revealStartTime) {
        branch.revealProgress = 0;
        return;
      }
      const t = (elapsed - branch.revealStartTime) / branch.revealDuration;
      // Smooth ease-in-out
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      branch.revealProgress = Math.min(1, Math.max(0, eased));
    });

    // ── Draw path helper ──
    const drawPath = (branch: Branch) => {
      const pts = branch.points;
      const rp = branch.revealProgress;
      if (rp < 0.003) return;
      const totalPts = pts.length - 1;
      const drawEnd = rp * totalPts;
      const drawIdx = Math.floor(drawEnd);
      const frac = drawEnd - drawIdx;

      ctx.beginPath();
      ctx.moveTo(pts[0].x * w, pts[0].y * h);
      for (let i = 1; i <= drawIdx && i < pts.length; i++) {
        ctx.lineTo(pts[i].x * w, pts[i].y * h);
      }
      if (drawIdx < totalPts) {
        const a = pts[drawIdx], b = pts[drawIdx + 1];
        ctx.lineTo((a.x + (b.x - a.x) * frac) * w, (a.y + (b.y - a.y) * frac) * h);
      }
    };

    // ── Sort by depth ──
    const sorted = branches.map((_, i) => i).sort((a, b) => branches[b].depth - branches[a].depth);

    // ── Draw branches with triple-layer glow ──
    sorted.forEach(bi => {
      const branch = branches[bi];
      if (branch.revealProgress < 0.003) return;

      const da = 1 - branch.depth * 0.5;
      const rp = branch.revealProgress;
      const bm = 1 + breath * 0.15 * branch.glowIntensity;

      // Wide diffuse glow
      drawPath(branch);
      ctx.strokeStyle = `hsla(${branch.hue},75%,55%,${0.07 * da * rp})`;
      ctx.lineWidth = (branch.width * 10 + 8) * bm;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();

      // Medium glow
      drawPath(branch);
      ctx.strokeStyle = `hsla(${branch.hue},70%,62%,${0.18 * da * rp})`;
      ctx.lineWidth = (branch.width * 3.5 + 2.5) * bm;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();

      // Core line
      drawPath(branch);
      ctx.strokeStyle = `hsla(${branch.hue},60%,80%,${(0.45 + breath * 0.12) * da * rp})`;
      ctx.lineWidth = branch.width * 1.1 * bm;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();

      // Hot center for thick branches
      if (branch.width > 1.2) {
        drawPath(branch);
        ctx.strokeStyle = `hsla(${branch.hue},35%,94%,${0.25 * da * rp})`;
        ctx.lineWidth = Math.max(0.4, branch.width * 0.22) * bm;
        ctx.lineCap = 'round'; ctx.stroke();
      }

      // ── Growing tip glow ──
      if (branch.revealProgress > 0.01 && branch.revealProgress < 0.97) {
        const tip = ptOn(branch, branch.revealProgress);
        const tx = tip.x * w, ty = tip.y * h;
        const hs = branch.width * 3;

        const hg = ctx.createRadialGradient(tx, ty, 0, tx, ty, hs * 5);
        hg.addColorStop(0, `hsla(${branch.hue},65%,85%,${0.6 * da})`);
        hg.addColorStop(0.3, `hsla(${branch.hue},70%,70%,${0.2 * da})`);
        hg.addColorStop(1, 'transparent');
        ctx.fillStyle = hg;
        ctx.fillRect(tx - hs * 5, ty - hs * 5, hs * 10, hs * 10);

        ctx.beginPath();
        ctx.arc(tx, ty, hs * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${branch.hue},45%,96%,${0.8 * da})`;
        ctx.fill();
      }
    });

    // ── Junction nodes ──
    branches.forEach(branch => {
      if (branch.revealProgress < 0.12) return;
      const pt = branch.points[0];
      const px = pt.x * w, py = pt.y * h;
      const da = 1 - branch.depth * 0.4;
      const ns = branch.width * 1.2;
      const pulse = 1 + Math.sin(elapsed * 1.2 + branch.hue * 0.15) * 0.3;

      const ng = ctx.createRadialGradient(px, py, 0, px, py, ns * 5 * pulse);
      ng.addColorStop(0, `hsla(${branch.hue},60%,82%,${0.3 * da * branch.revealProgress})`);
      ng.addColorStop(0.35, `hsla(${branch.hue},65%,65%,${0.1 * da * branch.revealProgress})`);
      ng.addColorStop(1, 'transparent');
      ctx.fillStyle = ng;
      ctx.fillRect(px - ns * 5 * pulse, py - ns * 5 * pulse, ns * 10 * pulse, ns * 10 * pulse);

      ctx.beginPath();
      ctx.arc(px, py, ns * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${branch.hue},42%,90%,${0.45 * da * branch.revealProgress * (0.7 + breath * 0.3)})`;
      ctx.fill();
    });

    // ── Pulses ──
    const activePulses: Pulse[] = [];
    pulsesRef.current.forEach(pulse => {
      pulse.t += dt * pulse.speed;
      if (pulse.t > 1) {
        if (pulse.type === 'fast' && Math.random() < 0.2) {
          const pool = branches.filter((b, i) => b.revealProgress > 0.6 && i !== pulse.branchIdx);
          if (pool.length) {
            const nb = pool[Math.floor(Math.random() * pool.length)];
            activePulses.push({
              branchIdx: branches.indexOf(nb), t: 0,
              speed: 2 + Math.random() * 3, type: 'fast',
              brightness: 0.5 + Math.random() * 0.3,
              hue: nb.hue + (Math.random() - 0.5) * 15, trailLen: 0.06,
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
      const px = pt.x * w, py = pt.y * h;
      const fade = Math.sin(Math.min(pulse.t / Math.max(branch.revealProgress, 0.01), 1) * Math.PI);
      const sz = pulse.type === 'fast' ? 2.8 : 4;

      const pg = ctx.createRadialGradient(px, py, 0, px, py, sz * 6);
      pg.addColorStop(0, `hsla(${pulse.hue},70%,82%,${fade * pulse.brightness * 0.6})`);
      pg.addColorStop(0.45, `hsla(${pulse.hue},65%,68%,${fade * pulse.brightness * 0.15})`);
      pg.addColorStop(1, 'transparent');
      ctx.fillStyle = pg;
      ctx.fillRect(px - sz * 6, py - sz * 6, sz * 12, sz * 12);

      ctx.beginPath();
      ctx.arc(px, py, sz * 0.55, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${pulse.hue},50%,95%,${fade * pulse.brightness * 0.9})`;
      ctx.fill();

      // Trail
      const ts = Math.max(0, drawT - pulse.trailLen);
      const tp = ptOn(branch, ts);
      const tg = ctx.createLinearGradient(tp.x * w, tp.y * h, px, py);
      tg.addColorStop(0, 'transparent');
      tg.addColorStop(1, `hsla(${pulse.hue},65%,78%,${fade * pulse.brightness * 0.5})`);
      ctx.beginPath();
      ctx.moveTo(tp.x * w, tp.y * h);
      for (let s = 1; s <= 5; s++) {
        const sp = ptOn(branch, ts + (drawT - ts) * (s / 5));
        ctx.lineTo(sp.x * w, sp.y * h);
      }
      ctx.strokeStyle = tg;
      ctx.lineWidth = pulse.type === 'fast' ? 1.0 : 1.8;
      ctx.lineCap = 'round'; ctx.stroke();
    });
    pulsesRef.current = activePulses;

    // ── Spawn ambient pulses ──
    const revealedPool = branches.filter(b => b.revealProgress > 0.7);
    if (revealedPool.length > 2) {
      // Slow
      if (Math.random() < 0.018) {
        const b = revealedPool[Math.floor(Math.random() * revealedPool.length)];
        pulsesRef.current.push({
          branchIdx: branches.indexOf(b), t: 0,
          speed: 0.12 + Math.random() * 0.15, type: 'slow',
          brightness: 0.35 + Math.random() * 0.25,
          hue: b.hue + (Math.random() - 0.5) * 10, trailLen: 0.22,
        });
      }
      // Fast
      if (Math.random() < (revealedPool.length > 40 ? 0.06 : 0.03)) {
        const b = revealedPool[Math.floor(Math.random() * revealedPool.length)];
        pulsesRef.current.push({
          branchIdx: branches.indexOf(b), t: 0,
          speed: 2.5 + Math.random() * 3.5, type: 'fast',
          brightness: 0.6 + Math.random() * 0.4,
          hue: b.hue + (Math.random() - 0.5) * 20, trailLen: 0.05 + Math.random() * 0.04,
        });
      }
    }

    // ── Central core ──
    const coreAlpha = Math.min(1, branches.filter(b => b.stage === 0).reduce((acc, b) => acc + b.revealProgress, 0) / 3);
    if (coreAlpha > 0.01) {
      const cg = ctx.createRadialGradient(w * 0.5, h * 0.48, 0, w * 0.5, h * 0.48, 30 + breath * 10);
      cg.addColorStop(0, `hsla(210,55%,85%,${0.3 * coreAlpha})`);
      cg.addColorStop(0.25, `hsla(210,65%,68%,${0.12 * coreAlpha})`);
      cg.addColorStop(1, 'transparent');
      ctx.fillStyle = cg;
      ctx.fillRect(w * 0.5 - 45, h * 0.48 - 45, 90, 90);

      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.48, 2.5 + breath * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(210,45%,95%,${0.55 * coreAlpha})`;
      ctx.fill();
    }

    // ── Vignette ──
    const vig = ctx.createRadialGradient(w * 0.5, h * 0.48, h * 0.18, w * 0.5, h * 0.48, h * 0.6);
    vig.addColorStop(0, 'transparent');
    vig.addColorStop(1, `rgba(0,0,0,${0.22 + breathSlow * 0.05})`);
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    mountTime.current = performance.now() / 1000;
    branchesRef.current = NETWORK.map(b => ({ ...b, revealProgress: 0 }));
    pulsesRef.current = [];

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
      const elapsed = performance.now() / 1000 - mountTime.current;
      draw(ctx, rect.width, rect.height, elapsed);
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
      <canvas ref={canvasRef} className="w-full h-full" style={{ background: 'transparent' }} />
    </div>
  );
};
