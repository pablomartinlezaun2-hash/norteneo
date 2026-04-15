import { useRef, useEffect, useCallback } from 'react';

/* ═══════════════════════════════════════════
   NEURAL RIVER NETWORK — Continuous Organic Growth
   Permanent central origin + outward branching growth.
   The core never disappears; only complexity expands.
   ═══════════════════════════════════════════ */

interface CalibrationAvatarProps {
  buildStage: number;
}

interface Pt {
  x: number;
  y: number;
}

interface Branch {
  points: Pt[];
  stage: number;
  depth: number;
  width: number;
  hue: number;
  revealProgress: number;
  revealStartTime: number;
  revealDuration: number;
  glowIntensity: number;
}

interface Pulse {
  branchIdx: number;
  t: number;
  speed: number;
  type: 'slow' | 'fast';
  brightness: number;
  hue: number;
  trailLen: number;
}

function sRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function curvePath(
  sx: number,
  sy: number,
  ex: number,
  ey: number,
  segs: number,
  wobble: number,
  rng: () => number,
): Pt[] {
  const pts: Pt[] = [];

  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const st = t * t * (3 - 2 * t);
    const wx = i > 0 && i < segs ? (rng() - 0.5) * wobble : 0;
    const wy = i > 0 && i < segs ? (rng() - 0.5) * wobble : 0;

    pts.push({
      x: sx + (ex - sx) * st + wx,
      y: sy + (ey - sy) * st + wy,
    });
  }

  return pts;
}

function ptOn(branch: Branch, t: number): Pt {
  const pts = branch.points;
  const idx = Math.min(t, 1) * (pts.length - 1);
  const i = Math.floor(idx);
  const f = idx - i;
  const a = pts[Math.min(i, pts.length - 1)];
  const b = pts[Math.min(i + 1, pts.length - 1)];

  return {
    x: a.x + (b.x - a.x) * f,
    y: a.y + (b.y - a.y) * f,
  };
}

function buildNetwork(): Branch[] {
  const rng = sRng(777);
  const branches: Branch[] = [];
  const cx = 0.5;
  const cy = 0.48;

  const add = (
    ox: number,
    oy: number,
    angle: number,
    len: number,
    stage: number,
    depth: number,
    width: number,
    hue: number,
    segs = 8,
    wobble = 0.04,
  ): number => {
    const ex = ox + Math.cos(angle) * len;
    const ey = oy + Math.sin(angle) * len;
    const pts = curvePath(ox, oy, ex, ey, segs, wobble, rng);

    const stageDelay = stage === 0 ? 0 : 6 + (stage - 1) * 5.5;
    const intraStagger = stage === 0 ? rng() * 0.9 : rng() * 4.5;
    const startTime = stageDelay + intraStagger;
    const duration = stage === 0 ? 2.8 + rng() * 1.8 : 4 + rng() * 5;

    branches.push({
      points: pts,
      stage,
      depth,
      width,
      hue,
      revealProgress: 0,
      revealStartTime: startTime,
      revealDuration: duration,
      glowIntensity: 0.6 + rng() * 0.4,
    });

    return branches.length - 1;
  };

  const endOf = (idx: number): Pt => branches[idx].points[branches[idx].points.length - 1];

  const midOf = (idx: number, t = 0.5): Pt => {
    const pts = branches[idx].points;
    const fi = t * (pts.length - 1);
    const i = Math.floor(fi);
    const f = fi - i;
    const a = pts[Math.min(i, pts.length - 1)];
    const b = pts[Math.min(i + 1, pts.length - 1)];

    return {
      x: a.x + (b.x - a.x) * f,
      y: a.y + (b.y - a.y) * f,
    };
  };

  const s0a = add(cx, cy, -Math.PI * 0.5, 0.18, 0, 0.08, 2.5, 210, 12, 0.03);
  const s0b = add(cx, cy, -Math.PI * 0.78, 0.16, 0, 0.1, 2.2, 205, 10, 0.035);
  const s0c = add(cx, cy, -Math.PI * 0.22, 0.17, 0, 0.1, 2.2, 215, 10, 0.035);
  const s0d = add(cx, cy, Math.PI * 0.65, 0.15, 0, 0.12, 2.0, 200, 9, 0.03);
  const s0e = add(cx, cy, Math.PI * 0.35, 0.16, 0, 0.12, 2.0, 220, 9, 0.03);
  const s0f = add(cx, cy, Math.PI, 0.12, 0, 0.14, 1.8, 208, 8, 0.025);

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
  add(m0d.x, m0d.y, Math.PI * 0.9, 0.1, 1, 0.28, 1.2, 195, 6, 0.03);
  const m0e = midOf(s0e, 0.55);
  add(m0e.x, m0e.y, Math.PI * 0.1, 0.11, 1, 0.28, 1.2, 225, 6, 0.03);

  const e1a = endOf(s1a);
  const s2a = add(e1a.x, e1a.y, -1.0, 0.11, 2, 0.28, 1.3, 212, 7, 0.035);
  add(e1a.x, e1a.y, -1.6, 0.08, 2, 0.32, 1.0, 205, 5, 0.03);
  const e1c = endOf(s1c);
  add(e1c.x, e1c.y, -2.6, 0.1, 2, 0.28, 1.2, 198, 7, 0.03);
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
  add(e0f.x, e0f.y, Math.PI * 1.15, 0.1, 2, 0.3, 1.0, 212, 6, 0.03);

  const stage3Sources = [s2a, s1b, s1c, s1d, s0d, s0e, s0f];
  stage3Sources.forEach((srcIdx) => {
    const ep = endOf(srcIdx);
    const ba = Math.atan2(ep.y - cy, ep.x - cx);
    add(ep.x, ep.y, ba + (rng() - 0.5) * 1.2, 0.06 + rng() * 0.06, 3, 0.33 + rng() * 0.15, 0.8 + rng() * 0.4, 200 + rng() * 25, 6, 0.025);
    const mp = midOf(srcIdx, 0.35 + rng() * 0.3);
    add(mp.x, mp.y, ba + (rng() - 0.5) * 2.0, 0.05 + rng() * 0.05, 3, 0.38 + rng() * 0.15, 0.6 + rng() * 0.3, 200 + rng() * 25, 5, 0.02);
  });

  for (let i = 0; i < 14; i++) {
    const src = branches[Math.floor(rng() * Math.min(branches.length, 30))];
    const ep = src.points[src.points.length - 1];
    const a = Math.atan2(ep.y - cy, ep.x - cx) + (rng() - 0.5) * 1.5;
    add(ep.x, ep.y, a, 0.04 + rng() * 0.05, 4, 0.38 + rng() * 0.2, 0.5 + rng() * 0.35, 200 + rng() * 30, 5, 0.02);
  }

  for (let i = 0; i < 16; i++) {
    const pool = branches.filter((b) => b.stage <= 3);
    const src = pool[Math.floor(rng() * pool.length)];
    const t = 0.25 + rng() * 0.6;
    const mp = midOf(branches.indexOf(src), t);
    const a = Math.atan2(mp.y - cy, mp.x - cx) + (rng() - 0.5) * 2.0;
    add(mp.x, mp.y, a, 0.03 + rng() * 0.045, 5, 0.45 + rng() * 0.2, 0.35 + rng() * 0.25, 205 + rng() * 25, 4, 0.018);
  }

  for (let i = 0; i < 18; i++) {
    const pool = branches.filter((b) => b.stage <= 4);
    const src = pool[Math.floor(rng() * pool.length)];
    const t = 0.2 + rng() * 0.7;
    const mp = midOf(branches.indexOf(src), t);
    const a = rng() * Math.PI * 2;
    add(mp.x, mp.y, a, 0.02 + rng() * 0.035, 6, 0.55 + rng() * 0.2, 0.2 + rng() * 0.18, 208 + rng() * 20, 3, 0.015);
  }

  for (let i = 0; i < 20; i++) {
    const pool = branches.filter((b) => b.stage <= 5);
    const src = pool[Math.floor(rng() * pool.length)];
    const t = 0.15 + rng() * 0.75;
    const mp = midOf(branches.indexOf(src), t);
    const a = rng() * Math.PI * 2;
    add(mp.x, mp.y, a, 0.015 + rng() * 0.028, 7, 0.65 + rng() * 0.2, 0.12 + rng() * 0.14, 210 + rng() * 15, 2, 0.012);
  }

  return branches;
}

const NETWORK = buildNetwork();
let globalStartTime = 0;
let globalBranches: Branch[] | null = null;

export const CalibrationAvatar = ({ buildStage }: CalibrationAvatarProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);
  const branchesRef = useRef<Branch[]>([]);
  const pulsesRef = useRef<Pulse[]>([]);

  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, elapsed: number) => {
    const dt = 1 / 60;
    const activityLevel = 0.7 + Math.min(buildStage, 8) / 8 * 0.6;

    ctx.clearRect(0, 0, w, h);

    const branches = branchesRef.current;
    if (!branches.length) return;

    const breath = Math.sin(elapsed * 0.5) * 0.5 + 0.5;
    const breathSlow = Math.sin(elapsed * 0.25) * 0.5 + 0.5;

    const bgGrad = ctx.createRadialGradient(w * 0.5, h * 0.48, 0, w * 0.5, h * 0.48, h * 0.65);
    bgGrad.addColorStop(0, `rgba(8,25,65,${0.08 + breathSlow * 0.03})`);
    bgGrad.addColorStop(0.6, 'rgba(4,12,40,0.03)');
    bgGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    branches.forEach((branch) => {
      if (elapsed < branch.revealStartTime) {
        branch.revealProgress = 0;
        return;
      }

      const t = (elapsed - branch.revealStartTime) / branch.revealDuration;
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      branch.revealProgress = Math.min(1, Math.max(0, eased));
    });

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
        const a = pts[drawIdx];
        const b = pts[drawIdx + 1];
        ctx.lineTo((a.x + (b.x - a.x) * frac) * w, (a.y + (b.y - a.y) * frac) * h);
      }
    };

    const drawGlowNode = (x: number, y: number, radius: number, hue: number, alpha: number, sharpness = 1) => {
      const glow = ctx.createRadialGradient(x, y, 0, x, y, radius * (5.5 + sharpness));
      glow.addColorStop(0, `hsla(${hue},70%,90%,${0.65 * alpha})`);
      glow.addColorStop(0.28, `hsla(${hue},72%,72%,${0.24 * alpha})`);
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.fillRect(x - radius * 8, y - radius * 8, radius * 16, radius * 16);

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${hue},48%,97%,${0.9 * alpha})`;
      ctx.fill();
    };

    const sortedIndices = branches
      .map((_, i) => i)
      .sort((a, b) => branches[b].depth - branches[a].depth);

    sortedIndices.forEach((bi) => {
      const branch = branches[bi];
      if (branch.revealProgress < 0.003) return;

      const depthAlpha = 1 - branch.depth * 0.5;
      const rp = branch.revealProgress;
      const breathMod = 1 + breath * 0.15 * branch.glowIntensity;

      drawPath(branch);
      ctx.strokeStyle = `hsla(${branch.hue},75%,55%,${0.07 * depthAlpha * rp})`;
      ctx.lineWidth = (branch.width * 10 + 8) * breathMod;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      drawPath(branch);
      ctx.strokeStyle = `hsla(${branch.hue},70%,62%,${0.18 * depthAlpha * rp})`;
      ctx.lineWidth = (branch.width * 3.5 + 2.5) * breathMod;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      drawPath(branch);
      ctx.strokeStyle = `hsla(${branch.hue},60%,80%,${(0.45 + breath * 0.12) * depthAlpha * rp})`;
      ctx.lineWidth = branch.width * 1.1 * breathMod;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      if (branch.width > 1.2) {
        drawPath(branch);
        ctx.strokeStyle = `hsla(${branch.hue},35%,94%,${0.25 * depthAlpha * rp})`;
        ctx.lineWidth = Math.max(0.4, branch.width * 0.22) * breathMod;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      if (branch.stage > 2 && branch.revealProgress > 0.01 && branch.revealProgress < 0.97) {
        const tip = ptOn(branch, branch.revealProgress);
        const tx = tip.x * w;
        const ty = tip.y * h;
        const headSize = branch.width * 2.8;
        const tipGlow = ctx.createRadialGradient(tx, ty, 0, tx, ty, headSize * 4.5);
        tipGlow.addColorStop(0, `hsla(${branch.hue},65%,85%,${0.55 * depthAlpha})`);
        tipGlow.addColorStop(0.35, `hsla(${branch.hue},70%,70%,${0.18 * depthAlpha})`);
        tipGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = tipGlow;
        ctx.fillRect(tx - headSize * 5, ty - headSize * 5, headSize * 10, headSize * 10);
      }
    });

    const stageZeroBranches = branches.filter((branch) => branch.stage === 0);
    const coreAlpha = Math.min(
      1,
      stageZeroBranches.reduce((acc, branch) => acc + Math.max(branch.revealProgress, 0), 0) / 2.8,
    );

    if (coreAlpha > 0.01) {
      const cx = w * 0.5;
      const cy = h * 0.48;
      const coreGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 36 + breath * 12);
      coreGlow.addColorStop(0, `hsla(210,60%,88%,${0.42 * coreAlpha})`);
      coreGlow.addColorStop(0.2, `hsla(208,72%,72%,${0.2 * coreAlpha})`);
      coreGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = coreGlow;
      ctx.fillRect(cx - 56, cy - 56, 112, 112);

      ctx.beginPath();
      ctx.arc(cx, cy, 3.2 + breath * 0.8, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(210,50%,97%,${0.92 * coreAlpha})`;
      ctx.fill();
    }

    stageZeroBranches.forEach((branch) => {
      if (branch.revealProgress < 0.08) return;
      const terminal = ptOn(branch, branch.revealProgress);
      const x = terminal.x * w;
      const y = terminal.y * h;
      const radius = 2.3 + branch.width * 0.9 + breath * 0.35;
      drawGlowNode(x, y, radius, branch.hue, 0.5 + branch.revealProgress * 0.4, 1.2);
    });

    branches.forEach((branch) => {
      if (branch.stage === 0 || branch.stage > 2 || branch.revealProgress < 0.16) return;
      const origin = branch.points[0];
      const radius = 1.25 + branch.width * 0.55 + breath * 0.12;
      drawGlowNode(origin.x * w, origin.y * h, radius, branch.hue, 0.22 + branch.revealProgress * 0.22, 0.55);
    });

    branches.forEach((branch) => {
      const shouldPersist = branch.stage <= 2 || branch.width >= 1.15;
      if (!shouldPersist || branch.revealProgress < 0.32) return;
      const terminal = ptOn(branch, branch.revealProgress);
      const settledAlpha = branch.stage === 0 ? 0 : branch.revealProgress > 0.985 ? 0.42 : 0.18;
      if (settledAlpha <= 0) return;
      const radius = 1 + branch.width * 0.42;
      drawGlowNode(terminal.x * w, terminal.y * h, radius, branch.hue, settledAlpha, 0.4);
    });

    const activePulses: Pulse[] = [];
    pulsesRef.current.forEach((pulse) => {
      pulse.t += dt * pulse.speed;

      if (pulse.t > 1) {
        if (pulse.type === 'fast' && Math.random() < 0.2) {
          const pool = branches.filter((b, i) => b.revealProgress > 0.6 && b.stage <= 5 && i !== pulse.branchIdx);
          if (pool.length > 0) {
            const nextBranch = pool[Math.floor(Math.random() * pool.length)];
            activePulses.push({
              branchIdx: branches.indexOf(nextBranch),
              t: 0,
              speed: 2 + Math.random() * 3,
              type: 'fast',
              brightness: 0.5 + Math.random() * 0.3,
              hue: nextBranch.hue + (Math.random() - 0.5) * 15,
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
      const size = pulse.type === 'fast' ? 2.8 : 4;

      const pulseGlow = ctx.createRadialGradient(px, py, 0, px, py, size * 6);
      pulseGlow.addColorStop(0, `hsla(${pulse.hue},70%,82%,${fade * pulse.brightness * 0.6})`);
      pulseGlow.addColorStop(0.45, `hsla(${pulse.hue},65%,68%,${fade * pulse.brightness * 0.15})`);
      pulseGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = pulseGlow;
      ctx.fillRect(px - size * 6, py - size * 6, size * 12, size * 12);

      ctx.beginPath();
      ctx.arc(px, py, size * 0.55, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${pulse.hue},50%,95%,${fade * pulse.brightness * 0.9})`;
      ctx.fill();

      const trailStart = Math.max(0, drawT - pulse.trailLen);
      const trailPoint = ptOn(branch, trailStart);
      const trailGradient = ctx.createLinearGradient(trailPoint.x * w, trailPoint.y * h, px, py);
      trailGradient.addColorStop(0, 'transparent');
      trailGradient.addColorStop(1, `hsla(${pulse.hue},65%,78%,${fade * pulse.brightness * 0.5})`);

      ctx.beginPath();
      ctx.moveTo(trailPoint.x * w, trailPoint.y * h);
      for (let s = 1; s <= 5; s++) {
        const stepPoint = ptOn(branch, trailStart + (drawT - trailStart) * (s / 5));
        ctx.lineTo(stepPoint.x * w, stepPoint.y * h);
      }
      ctx.strokeStyle = trailGradient;
      ctx.lineWidth = pulse.type === 'fast' ? 1 : 1.8;
      ctx.lineCap = 'round';
      ctx.stroke();
    });
    pulsesRef.current = activePulses;

    const revealedPool = branches.filter((branch) => branch.revealProgress > 0.72 && branch.stage <= 5);
    if (revealedPool.length > 6) {
      if (Math.random() < 0.012 * activityLevel) {
        const branch = revealedPool[Math.floor(Math.random() * revealedPool.length)];
        pulsesRef.current.push({
          branchIdx: branches.indexOf(branch),
          t: 0,
          speed: 0.12 + Math.random() * 0.15,
          type: 'slow',
          brightness: 0.35 + Math.random() * 0.25,
          hue: branch.hue + (Math.random() - 0.5) * 10,
          trailLen: 0.22,
        });
      }

      if (Math.random() < (revealedPool.length > 40 ? 0.03 : 0.018) * activityLevel) {
        const branch = revealedPool[Math.floor(Math.random() * revealedPool.length)];
        pulsesRef.current.push({
          branchIdx: branches.indexOf(branch),
          t: 0,
          speed: 2.5 + Math.random() * 3.5,
          type: 'fast',
          brightness: 0.6 + Math.random() * 0.4,
          hue: branch.hue + (Math.random() - 0.5) * 20,
          trailLen: 0.05 + Math.random() * 0.04,
        });
      }
    }

    const vig = ctx.createRadialGradient(w * 0.5, h * 0.48, h * 0.18, w * 0.5, h * 0.48, h * 0.6);
    vig.addColorStop(0, 'transparent');
    vig.addColorStop(1, `rgba(0,0,0,${0.22 + breathSlow * 0.05})`);
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);
  }, [buildStage]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!globalStartTime) {
      globalStartTime = performance.now() / 1000;
    }

    if (!globalBranches) {
      globalBranches = NETWORK.map((branch) => ({ ...branch, revealProgress: 0 }));
    }

    branchesRef.current = globalBranches;
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
      const elapsed = performance.now() / 1000 - globalStartTime;
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
    <div className="relative h-full w-full">
      <canvas ref={canvasRef} className="h-full w-full" style={{ background: 'transparent' }} />
    </div>
  );
};
