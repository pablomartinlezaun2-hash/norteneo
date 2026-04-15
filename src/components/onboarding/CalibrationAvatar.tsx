import { useRef, useEffect, useCallback } from 'react';

/* ═══════════════════════════════════════════
   ENERGY RIVER NETWORK — Branching Neural Streams
   Canvas-based organic energy river visualization
   ═══════════════════════════════════════════ */

interface CalibrationAvatarProps {
  buildStage: number; // -1=nothing, 0-7 progressive, 8=complete
}

/* ── Easing ── */
const easeInOutQuart = (t: number) =>
  t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;

/* ── Point on a river ── */
interface RiverPoint {
  x: number; // normalized 0-1
  y: number;
}

/* ── A single river branch ── */
interface RiverBranch {
  points: RiverPoint[];
  stage: number; // when this branch starts revealing
  depth: number; // 0=front, 1=deep background (affects opacity/width)
  width: number; // base stroke width
  hue: number; // color hue
  revealProgress: number; // 0-1 how much is drawn
  revealTarget: number; // target
  parentIdx: number; // -1 for root
  splitT: number; // where on parent this branches from (0-1)
  glowIntensity: number;
}

/* ── Pulse traveling and revealing ── */
interface RiverPulse {
  branchIdx: number;
  t: number; // 0-1 along branch
  speed: number;
  type: 'reveal' | 'slow' | 'fast';
  brightness: number;
  hue: number;
  active: boolean;
  trailLength: number;
}

/* ── Seeded random ── */
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/* ── Generate smooth organic curve points ── */
function generateCurve(
  startX: number, startY: number,
  endX: number, endY: number,
  segments: number,
  wobble: number,
  rng: () => number
): RiverPoint[] {
  const pts: RiverPoint[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = startX + (endX - startX) * t + (i > 0 && i < segments ? (rng() - 0.5) * wobble : 0);
    const y = startY + (endY - startY) * t + (i > 0 && i < segments ? (rng() - 0.5) * wobble * 0.5 : 0);
    pts.push({ x, y });
  }
  return pts;
}

/* ── Build the entire river tree ── */
function buildRiverNetwork(): RiverBranch[] {
  const rng = seededRandom(77);
  const branches: RiverBranch[] = [];

  // Root trunk — flows from bottom-center upward with organic curve
  const trunk = generateCurve(0.50, 0.92, 0.48, 0.08, 12, 0.06, rng);
  branches.push({
    points: trunk,
    stage: 0,
    depth: 0.1,
    width: 2.5,
    hue: 210,
    revealProgress: 0,
    revealTarget: 0,
    parentIdx: -1,
    splitT: 0,
    glowIntensity: 1,
  });

  // Helper to branch off from a parent
  const addBranch = (
    parentIdx: number,
    splitT: number, // where on parent
    angle: number, // relative direction
    length: number,
    stage: number,
    depth: number,
    width: number,
    hue: number,
    segments: number = 6
  ) => {
    const parent = branches[parentIdx];
    const pLen = parent.points.length - 1;
    const pi = Math.min(Math.floor(splitT * pLen), pLen);
    const origin = parent.points[pi];
    
    const endX = origin.x + Math.cos(angle) * length;
    const endY = origin.y + Math.sin(angle) * length;
    const pts = generateCurve(origin.x, origin.y, endX, endY, segments, 0.03 + rng() * 0.02, rng);
    
    branches.push({
      points: pts,
      stage,
      depth,
      width,
      hue,
      revealProgress: 0,
      revealTarget: 0,
      parentIdx,
      splitT,
      glowIntensity: 0.7 + rng() * 0.3,
    });
    return branches.length - 1;
  };

  // ── Stage 0: Root trunk only (already added) ──

  // ── Stage 1: First major branches ──
  const b1a = addBranch(0, 0.3, -1.2, 0.18, 1, 0.2, 1.8, 205);
  const b1b = addBranch(0, 0.35, 0.8, 0.15, 1, 0.15, 1.6, 215);
  const b1c = addBranch(0, 0.55, -0.9, 0.20, 1, 0.3, 1.5, 200);

  // ── Stage 2: Secondary branches ──
  const b2a = addBranch(0, 0.5, 1.1, 0.17, 2, 0.25, 1.4, 220);
  addBranch(b1a, 0.6, -1.5, 0.12, 2, 0.4, 1.0, 200);
  addBranch(b1b, 0.5, 0.4, 0.10, 2, 0.35, 1.1, 225);
  addBranch(0, 0.7, -0.6, 0.14, 2, 0.3, 1.3, 210);

  // ── Stage 3: More complexity ──
  addBranch(b1c, 0.4, -1.8, 0.10, 3, 0.5, 0.9, 195);
  addBranch(b1c, 0.7, -0.4, 0.12, 3, 0.45, 0.8, 210);
  addBranch(b2a, 0.5, 1.5, 0.11, 3, 0.4, 0.9, 230);
  addBranch(b2a, 0.8, 0.7, 0.09, 3, 0.5, 0.8, 215);
  addBranch(0, 0.2, 1.3, 0.13, 3, 0.35, 1.2, 205);
  addBranch(0, 0.8, 0.9, 0.16, 3, 0.2, 1.4, 210);

  // ── Stage 4: Finer branches ──
  for (let i = 0; i < 8; i++) {
    const parentPool = branches.filter(b => b.stage <= 2);
    const parent = parentPool[Math.floor(rng() * parentPool.length)];
    const pIdx = branches.indexOf(parent);
    const angle = (rng() - 0.5) * 3.0;
    addBranch(pIdx, 0.3 + rng() * 0.5, angle, 0.06 + rng() * 0.08, 4, 0.4 + rng() * 0.3, 0.6 + rng() * 0.4, 195 + rng() * 40, 4);
  }

  // ── Stage 5: Even finer ──
  for (let i = 0; i < 10; i++) {
    const parentPool = branches.filter(b => b.stage <= 3);
    const parent = parentPool[Math.floor(rng() * parentPool.length)];
    const pIdx = branches.indexOf(parent);
    const angle = (rng() - 0.5) * 3.5;
    addBranch(pIdx, 0.2 + rng() * 0.6, angle, 0.04 + rng() * 0.06, 5, 0.5 + rng() * 0.3, 0.4 + rng() * 0.3, 200 + rng() * 35, 3);
  }

  // ── Stage 6: Ultra-fine dendrites ──
  for (let i = 0; i < 12; i++) {
    const parentPool = branches.filter(b => b.stage <= 4);
    const parent = parentPool[Math.floor(rng() * parentPool.length)];
    const pIdx = branches.indexOf(parent);
    const angle = (rng() - 0.5) * 4.0;
    addBranch(pIdx, 0.15 + rng() * 0.7, angle, 0.03 + rng() * 0.05, 6, 0.6 + rng() * 0.3, 0.25 + rng() * 0.25, 205 + rng() * 30, 3);
  }

  // ── Stage 7: Final micro-dendrites ──
  for (let i = 0; i < 14; i++) {
    const parentPool = branches.filter(b => b.stage <= 5);
    const parent = parentPool[Math.floor(rng() * parentPool.length)];
    const pIdx = branches.indexOf(parent);
    const angle = (rng() - 0.5) * 4.5;
    addBranch(pIdx, 0.1 + rng() * 0.8, angle, 0.02 + rng() * 0.04, 7, 0.7 + rng() * 0.25, 0.15 + rng() * 0.2, 210 + rng() * 25, 2);
  }

  return branches;
}

const BRANCHES = buildRiverNetwork();

/* ── Get interpolated point on branch path ── */
function getPointOnBranch(branch: RiverBranch, t: number): { x: number; y: number } {
  const pts = branch.points;
  const idx = t * (pts.length - 1);
  const i = Math.floor(idx);
  const frac = idx - i;
  const a = pts[Math.min(i, pts.length - 1)];
  const b = pts[Math.min(i + 1, pts.length - 1)];
  return { x: a.x + (b.x - a.x) * frac, y: a.y + (b.y - a.y) * frac };
}

export const CalibrationAvatar = ({ buildStage }: CalibrationAvatarProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);
  const startTime = useRef(0);
  const branchesRef = useRef<RiverBranch[]>(BRANCHES.map(b => ({ ...b })));
  const pulsesRef = useRef<RiverPulse[]>([]);
  const prevStage = useRef(buildStage);
  const flashRef = useRef(0);

  // Spawn reveal pulses when stage changes
  useEffect(() => {
    if (buildStage > prevStage.current) {
      flashRef.current = 1;
      const newPulses: RiverPulse[] = [];

      branchesRef.current.forEach((branch, i) => {
        if (branch.stage === buildStage) {
          branch.revealTarget = 1;
          // Reveal pulse — draws the branch
          newPulses.push({
            branchIdx: i,
            t: 0,
            speed: 0.15 + Math.random() * 0.15,
            type: 'reveal',
            brightness: 1,
            hue: branch.hue,
            active: true,
            trailLength: 0.25,
          });
        }
      });

      // Also add some fast signals on already-revealed branches
      branchesRef.current.forEach((branch, i) => {
        if (branch.stage < buildStage && branch.revealProgress > 0.5 && Math.random() < 0.4) {
          newPulses.push({
            branchIdx: i,
            t: 0,
            speed: 1.5 + Math.random() * 2.5,
            type: 'fast',
            brightness: 0.8 + Math.random() * 0.2,
            hue: branch.hue + (Math.random() - 0.5) * 20,
            active: true,
            trailLength: 0.08,
          });
        }
      });

      pulsesRef.current = [...pulsesRef.current, ...newPulses];
    }

    // Handle initial stage (stage 0)
    if (buildStage >= 0 && prevStage.current < 0) {
      branchesRef.current.forEach((branch, i) => {
        if (branch.stage === 0) {
          branch.revealTarget = 1;
          pulsesRef.current.push({
            branchIdx: i,
            t: 0,
            speed: 0.12,
            type: 'reveal',
            brightness: 1,
            hue: branch.hue,
            active: true,
            trailLength: 0.3,
          });
        }
      });
    }

    // Reveal all for stages <= buildStage that might have been missed
    branchesRef.current.forEach(branch => {
      if (branch.stage <= buildStage) {
        branch.revealTarget = 1;
      }
    });

    prevStage.current = buildStage;
  }, [buildStage]);

  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => {
    const dt = 1 / 60;
    ctx.clearRect(0, 0, w, h);

    const branches = branchesRef.current;
    const breath = Math.sin(time * 0.6) * 0.5 + 0.5;
    const breathSlow = Math.sin(time * 0.3) * 0.5 + 0.5;

    // Update flash
    flashRef.current = Math.max(0, flashRef.current - dt * 1.5);

    // ── Background atmosphere ──
    const bgGrad = ctx.createRadialGradient(w * 0.48, h * 0.4, 0, w * 0.48, h * 0.4, h * 0.7);
    bgGrad.addColorStop(0, `rgba(8,25,60,${0.06 + breathSlow * 0.03})`);
    bgGrad.addColorStop(0.5, `rgba(5,15,40,${0.03})`);
    bgGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // ── Update branch reveal progress (smooth follow for non-pulse-revealed) ──
    branches.forEach(branch => {
      if (branch.revealTarget > branch.revealProgress) {
        // Slowly catch up if no reveal pulse is actively drawing
        const hasRevealPulse = pulsesRef.current.some(
          p => p.branchIdx === branches.indexOf(branch) && p.type === 'reveal' && p.active
        );
        if (!hasRevealPulse && branch.revealTarget > 0) {
          branch.revealProgress += (branch.revealTarget - branch.revealProgress) * 0.03;
        }
      }
    });

    // ── Draw revealed branches ──
    branches.forEach(branch => {
      if (branch.revealProgress < 0.005) return;

      const depthAlpha = 1 - branch.depth * 0.6;
      const pts = branch.points;
      const drawTo = Math.floor(branch.revealProgress * (pts.length - 1));
      const frac = (branch.revealProgress * (pts.length - 1)) - drawTo;

      // Breathing glow width modulation
      const breathMod = 1 + breath * 0.15 * branch.glowIntensity;

      // Draw wide glow layer
      ctx.beginPath();
      ctx.moveTo(pts[0].x * w, pts[0].y * h);
      for (let i = 1; i <= drawTo; i++) {
        ctx.lineTo(pts[i].x * w, pts[i].y * h);
      }
      if (drawTo < pts.length - 1) {
        const a = pts[drawTo];
        const b = pts[drawTo + 1];
        ctx.lineTo((a.x + (b.x - a.x) * frac) * w, (a.y + (b.y - a.y) * frac) * h);
      }
      ctx.strokeStyle = `hsla(${branch.hue},65%,55%,${0.04 * depthAlpha * branch.revealProgress})`;
      ctx.lineWidth = (branch.width * 6 + 4) * breathMod;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Medium glow
      ctx.beginPath();
      ctx.moveTo(pts[0].x * w, pts[0].y * h);
      for (let i = 1; i <= drawTo; i++) {
        ctx.lineTo(pts[i].x * w, pts[i].y * h);
      }
      if (drawTo < pts.length - 1) {
        const a = pts[drawTo];
        const b = pts[drawTo + 1];
        ctx.lineTo((a.x + (b.x - a.x) * frac) * w, (a.y + (b.y - a.y) * frac) * h);
      }
      ctx.strokeStyle = `hsla(${branch.hue},60%,60%,${0.12 * depthAlpha * branch.revealProgress})`;
      ctx.lineWidth = (branch.width * 2.5 + 1) * breathMod;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Core line
      ctx.beginPath();
      ctx.moveTo(pts[0].x * w, pts[0].y * h);
      for (let i = 1; i <= drawTo; i++) {
        ctx.lineTo(pts[i].x * w, pts[i].y * h);
      }
      if (drawTo < pts.length - 1) {
        const a = pts[drawTo];
        const b = pts[drawTo + 1];
        ctx.lineTo((a.x + (b.x - a.x) * frac) * w, (a.y + (b.y - a.y) * frac) * h);
      }
      ctx.strokeStyle = `hsla(${branch.hue},55%,75%,${(0.25 + breath * 0.08) * depthAlpha * branch.revealProgress})`;
      ctx.lineWidth = branch.width * breathMod;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Bright inner core for thick branches
      if (branch.width > 1.2) {
        ctx.beginPath();
        ctx.moveTo(pts[0].x * w, pts[0].y * h);
        for (let i = 1; i <= drawTo; i++) {
          ctx.lineTo(pts[i].x * w, pts[i].y * h);
        }
        if (drawTo < pts.length - 1) {
          const a = pts[drawTo];
          const b = pts[drawTo + 1];
          ctx.lineTo((a.x + (b.x - a.x) * frac) * w, (a.y + (b.y - a.y) * frac) * h);
        }
        ctx.strokeStyle = `hsla(${branch.hue},40%,90%,${0.15 * depthAlpha * branch.revealProgress})`;
        ctx.lineWidth = branch.width * 0.3 * breathMod;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
    });

    // ── Draw & update pulses ──
    const activePulses: RiverPulse[] = [];
    pulsesRef.current.forEach(pulse => {
      if (!pulse.active) return;

      const branch = branches[pulse.branchIdx];
      if (!branch) return;

      // Advance pulse
      pulse.t += dt * pulse.speed;

      if (pulse.type === 'reveal') {
        // Reveal pulse draws the branch as it travels
        branch.revealProgress = Math.max(branch.revealProgress, easeInOutQuart(Math.min(pulse.t, 1)));
        
        if (pulse.t >= 1) {
          branch.revealProgress = 1;
          pulse.active = false;

          // Chain reaction: spawn slow pulses on child branches
          branches.forEach((child, ci) => {
            if (child.parentIdx === pulse.branchIdx && child.revealTarget > 0 && child.revealProgress < 0.5) {
              activePulses.push({
                branchIdx: ci,
                t: 0,
                speed: 0.18 + Math.random() * 0.12,
                type: 'reveal',
                brightness: 0.9,
                hue: child.hue,
                active: true,
                trailLength: 0.2,
              });
            }
          });
          return;
        }
      } else if (pulse.t >= 1) {
        pulse.active = false;

        // Fast pulses can chain to connected branches
        if (pulse.type === 'fast' && Math.random() < 0.3) {
          const children = branches.filter((b, i) => b.parentIdx === pulse.branchIdx && b.revealProgress > 0.5);
          if (children.length > 0) {
            const child = children[Math.floor(Math.random() * children.length)];
            const ci = branches.indexOf(child);
            activePulses.push({
              branchIdx: ci,
              t: 0,
              speed: 2 + Math.random() * 2,
              type: 'fast',
              brightness: 0.6 + Math.random() * 0.3,
              hue: child.hue + (Math.random() - 0.5) * 15,
              active: true,
              trailLength: 0.06,
            });
          }
        }
        return;
      }

      activePulses.push(pulse);

      // Only draw if branch is partially revealed
      if (branch.revealProgress < 0.01) return;

      const drawT = Math.min(pulse.t, branch.revealProgress);
      const pt = getPointOnBranch(branch, drawT);
      const px = pt.x * w;
      const py = pt.y * h;

      const fadeFactor = pulse.type === 'reveal'
        ? Math.sin(Math.min(pulse.t, 1) * Math.PI)
        : Math.sin(Math.min(pulse.t, 1) * Math.PI) * 0.9;

      const size = pulse.type === 'fast' ? 3 : pulse.type === 'reveal' ? 5 : 4;

      // Pulse glow
      const pg = ctx.createRadialGradient(px, py, 0, px, py, size * 5);
      pg.addColorStop(0, `hsla(${pulse.hue},65%,75%,${fadeFactor * pulse.brightness * 0.5})`);
      pg.addColorStop(0.5, `hsla(${pulse.hue},60%,65%,${fadeFactor * pulse.brightness * 0.15})`);
      pg.addColorStop(1, 'transparent');
      ctx.fillStyle = pg;
      ctx.fillRect(px - size * 5, py - size * 5, size * 10, size * 10);

      // Pulse core
      ctx.beginPath();
      ctx.arc(px, py, size * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${pulse.hue},50%,90%,${fadeFactor * pulse.brightness * 0.9})`;
      ctx.fill();

      // Trail
      const trailStart = Math.max(0, drawT - pulse.trailLength);
      const trailPt = getPointOnBranch(branch, trailStart);
      ctx.beginPath();
      ctx.moveTo(trailPt.x * w, trailPt.y * h);

      const trailSteps = 6;
      for (let s = 1; s <= trailSteps; s++) {
        const st = trailStart + (drawT - trailStart) * (s / trailSteps);
        const sp = getPointOnBranch(branch, st);
        ctx.lineTo(sp.x * w, sp.y * h);
      }

      const trailGrad = ctx.createLinearGradient(trailPt.x * w, trailPt.y * h, px, py);
      trailGrad.addColorStop(0, 'transparent');
      trailGrad.addColorStop(1, `hsla(${pulse.hue},60%,75%,${fadeFactor * pulse.brightness * 0.5})`);
      ctx.strokeStyle = trailGrad;
      ctx.lineWidth = pulse.type === 'fast' ? 1 : 2;
      ctx.lineCap = 'round';
      ctx.stroke();
    });

    pulsesRef.current = activePulses;

    // ── Ambient activity on fully revealed network ──
    if (buildStage >= 3) {
      // Slow contemplative pulses
      if (Math.random() < 0.02) {
        const revealed = branches.filter(b => b.revealProgress > 0.8);
        if (revealed.length > 0) {
          const branch = revealed[Math.floor(Math.random() * revealed.length)];
          const bi = branches.indexOf(branch);
          pulsesRef.current.push({
            branchIdx: bi,
            t: 0,
            speed: 0.2 + Math.random() * 0.2,
            type: 'slow',
            brightness: 0.4 + Math.random() * 0.3,
            hue: branch.hue + (Math.random() - 0.5) * 15,
            active: true,
            trailLength: 0.2,
          });
        }
      }

      // Fast shooting star pulses
      if (Math.random() < (buildStage >= 6 ? 0.06 : 0.03)) {
        const revealed = branches.filter(b => b.revealProgress > 0.8);
        if (revealed.length > 0) {
          const branch = revealed[Math.floor(Math.random() * revealed.length)];
          const bi = branches.indexOf(branch);
          pulsesRef.current.push({
            branchIdx: bi,
            t: 0,
            speed: 2 + Math.random() * 3,
            type: 'fast',
            brightness: 0.7 + Math.random() * 0.3,
            hue: branch.hue + (Math.random() - 0.5) * 20,
            active: true,
            trailLength: 0.06 + Math.random() * 0.04,
          });
        }
      }
    }

    // ── Junction nodes (glow at branch origins) ──
    branches.forEach(branch => {
      if (branch.revealProgress < 0.3) return;
      const pt = branch.points[0];
      const px = pt.x * w;
      const py = pt.y * h;
      const depthAlpha = 1 - branch.depth * 0.5;
      const nodeSize = branch.width * 1.2;
      const pulse = 1 + Math.sin(time * 1.2 + branch.hue * 0.1) * 0.3;

      const ng = ctx.createRadialGradient(px, py, 0, px, py, nodeSize * 3 * pulse);
      ng.addColorStop(0, `hsla(${branch.hue},55%,75%,${0.2 * depthAlpha * branch.revealProgress})`);
      ng.addColorStop(0.5, `hsla(${branch.hue},60%,60%,${0.06 * depthAlpha * branch.revealProgress})`);
      ng.addColorStop(1, 'transparent');
      ctx.fillStyle = ng;
      ctx.fillRect(px - nodeSize * 3 * pulse, py - nodeSize * 3 * pulse, nodeSize * 6 * pulse, nodeSize * 6 * pulse);

      // Bright dot
      ctx.beginPath();
      ctx.arc(px, py, nodeSize * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${branch.hue},45%,85%,${0.35 * depthAlpha * branch.revealProgress * (0.8 + breath * 0.2)})`;
      ctx.fill();
    });

    // ── Flash on new stage ──
    if (flashRef.current > 0.01) {
      const fg = ctx.createRadialGradient(w * 0.48, h * 0.4, 0, w * 0.48, h * 0.4, h * 0.5);
      fg.addColorStop(0, `rgba(80,160,255,${flashRef.current * 0.08})`);
      fg.addColorStop(1, 'transparent');
      ctx.fillStyle = fg;
      ctx.fillRect(0, 0, w, h);
    }

    // ── Vignette ──
    const vig = ctx.createRadialGradient(w * 0.5, h * 0.45, h * 0.2, w * 0.5, h * 0.45, h * 0.65);
    vig.addColorStop(0, 'transparent');
    vig.addColorStop(1, `rgba(0,0,0,${0.2 + breathSlow * 0.05})`);
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);

  }, [buildStage]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    startTime.current = performance.now() / 1000;

    // Reset branches state
    branchesRef.current = BRANCHES.map(b => ({ ...b, revealProgress: 0, revealTarget: 0 }));
    pulsesRef.current = [];

    // If buildStage is already > -1, reveal appropriate branches
    if (buildStage >= 0) {
      branchesRef.current.forEach(branch => {
        if (branch.stage <= buildStage) {
          branch.revealTarget = 1;
          branch.revealProgress = 1; // instant for already-passed stages
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
