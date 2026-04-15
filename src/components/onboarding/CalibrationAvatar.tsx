import { useRef, useEffect, useCallback } from 'react';

/* ═══════════════════════════════════════════
   CALIBRATION SPINE — Premium Neural Axis
   Canvas-based physiological calibration visual
   ═══════════════════════════════════════════ */

interface CalibrationAvatarProps {
  buildStage: number; // -1=nothing, 0-7 progressive reveal, 8=complete
}

/* ── Easing ── */
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOutQuart = (t: number) =>
  t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;

/* ── Branch definitions ── */
interface Branch {
  /** Y position along spine (0=bottom, 1=top) */
  yNorm: number;
  /** Direction: -1=left, 1=right */
  dir: number;
  /** Length factor */
  len: number;
  /** Curvature */
  curve: number;
  /** Stage at which this branch appears */
  stage: number;
  /** Sub-branches */
  subs?: { angle: number; len: number }[];
}

const BRANCHES: Branch[] = [
  // Stage 0 — lower spine base
  { yNorm: 0.08, dir: -1, len: 0.12, curve: 0.3, stage: 0 },
  { yNorm: 0.08, dir: 1, len: 0.12, curve: 0.3, stage: 0 },
  { yNorm: 0.14, dir: -1, len: 0.16, curve: 0.2, stage: 0, subs: [{ angle: -0.4, len: 0.5 }] },
  { yNorm: 0.14, dir: 1, len: 0.16, curve: 0.2, stage: 0, subs: [{ angle: 0.4, len: 0.5 }] },
  // Stage 1 — pelvis / lower legs
  { yNorm: 0.05, dir: -1, len: 0.22, curve: 0.6, stage: 1 },
  { yNorm: 0.05, dir: 1, len: 0.22, curve: 0.6, stage: 1 },
  { yNorm: 0.18, dir: -1, len: 0.14, curve: -0.15, stage: 1 },
  { yNorm: 0.18, dir: 1, len: 0.14, curve: -0.15, stage: 1 },
  // Stage 2 — lower torso
  { yNorm: 0.28, dir: -1, len: 0.2, curve: 0.1, stage: 2, subs: [{ angle: -0.3, len: 0.4 }, { angle: 0.2, len: 0.3 }] },
  { yNorm: 0.28, dir: 1, len: 0.2, curve: 0.1, stage: 2, subs: [{ angle: 0.3, len: 0.4 }, { angle: -0.2, len: 0.3 }] },
  { yNorm: 0.34, dir: -1, len: 0.15, curve: 0.25, stage: 2 },
  { yNorm: 0.34, dir: 1, len: 0.15, curve: 0.25, stage: 2 },
  // Stage 3 — mid torso
  { yNorm: 0.42, dir: -1, len: 0.24, curve: 0.05, stage: 3, subs: [{ angle: -0.5, len: 0.35 }, { angle: -0.15, len: 0.5 }] },
  { yNorm: 0.42, dir: 1, len: 0.24, curve: 0.05, stage: 3, subs: [{ angle: 0.5, len: 0.35 }, { angle: 0.15, len: 0.5 }] },
  { yNorm: 0.50, dir: -1, len: 0.18, curve: -0.1, stage: 3, subs: [{ angle: -0.3, len: 0.4 }] },
  { yNorm: 0.50, dir: 1, len: 0.18, curve: -0.1, stage: 3, subs: [{ angle: 0.3, len: 0.4 }] },
  // Stage 4 — arms / upper torso
  { yNorm: 0.56, dir: -1, len: 0.30, curve: 0.2, stage: 4, subs: [{ angle: -0.6, len: 0.45 }, { angle: -0.2, len: 0.55 }, { angle: 0.1, len: 0.3 }] },
  { yNorm: 0.56, dir: 1, len: 0.30, curve: 0.2, stage: 4, subs: [{ angle: 0.6, len: 0.45 }, { angle: 0.2, len: 0.55 }, { angle: -0.1, len: 0.3 }] },
  { yNorm: 0.64, dir: -1, len: 0.22, curve: 0.15, stage: 4, subs: [{ angle: -0.4, len: 0.4 }] },
  { yNorm: 0.64, dir: 1, len: 0.22, curve: 0.15, stage: 4, subs: [{ angle: 0.4, len: 0.4 }] },
  // Stage 5 — neck
  { yNorm: 0.74, dir: -1, len: 0.10, curve: 0.3, stage: 5 },
  { yNorm: 0.74, dir: 1, len: 0.10, curve: 0.3, stage: 5 },
  { yNorm: 0.78, dir: -1, len: 0.08, curve: -0.2, stage: 5 },
  { yNorm: 0.78, dir: 1, len: 0.08, curve: -0.2, stage: 5 },
  // Stage 6 — head
  { yNorm: 0.84, dir: -1, len: 0.16, curve: 0.4, stage: 6, subs: [{ angle: -0.5, len: 0.35 }, { angle: -0.1, len: 0.45 }] },
  { yNorm: 0.84, dir: 1, len: 0.16, curve: 0.4, stage: 6, subs: [{ angle: 0.5, len: 0.35 }, { angle: 0.1, len: 0.45 }] },
  { yNorm: 0.90, dir: -1, len: 0.12, curve: 0.5, stage: 6, subs: [{ angle: -0.3, len: 0.3 }] },
  { yNorm: 0.90, dir: 1, len: 0.12, curve: 0.5, stage: 6, subs: [{ angle: 0.3, len: 0.3 }] },
  { yNorm: 0.95, dir: -1, len: 0.07, curve: 0.6, stage: 6 },
  { yNorm: 0.95, dir: 1, len: 0.07, curve: 0.6, stage: 6 },
];

/* ── Spine nodes (vertebrae-like markers along the axis) ── */
const SPINE_NODES = [0.04, 0.1, 0.16, 0.22, 0.28, 0.34, 0.40, 0.46, 0.52, 0.58, 0.64, 0.70, 0.76, 0.82, 0.88, 0.94];

/* ── Signal pulse state ── */
interface Pulse {
  branchIdx: number;
  t: number; // 0..1 progress along branch
  speed: number;
  isSub: boolean;
  subIdx: number;
}

export const CalibrationAvatar = ({ buildStage }: CalibrationAvatarProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);
  const startTime = useRef(0);
  const prevStage = useRef(buildStage);
  const stageReveal = useRef<number[]>(new Array(8).fill(0));
  const pulsesRef = useRef<Pulse[]>([]);
  const flashRef = useRef(0);

  // Generate new pulses when stage changes
  useEffect(() => {
    if (buildStage > prevStage.current) {
      flashRef.current = 1;
      // Add new signal pulses for newly revealed branches
      const newPulses: Pulse[] = [];
      BRANCHES.forEach((b, i) => {
        if (b.stage === buildStage) {
          newPulses.push({ branchIdx: i, t: 0, speed: 0.4 + Math.random() * 0.3, isSub: false, subIdx: 0 });
          if (b.subs) {
            b.subs.forEach((_, si) => {
              newPulses.push({ branchIdx: i, t: 0, speed: 0.3 + Math.random() * 0.25, isSub: true, subIdx: si });
            });
          }
        }
      });
      pulsesRef.current = [...pulsesRef.current, ...newPulses];
    }
    prevStage.current = buildStage;
  }, [buildStage]);

  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => {
    const dt = 1 / 60;
    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const padY = h * 0.06;
    const spineTop = padY;
    const spineBot = h - padY;
    const spineH = spineBot - spineTop;
    const maxBranchPx = w * 0.38;

    // Update stage reveals
    for (let i = 0; i < 8; i++) {
      const target = buildStage >= i ? 1 : 0;
      stageReveal.current[i] += (target - stageReveal.current[i]) * 0.04;
    }
    flashRef.current = Math.max(0, flashRef.current - dt * 2.5);

    // Breathing
    const breath = Math.sin(time * 1.2) * 0.5 + 0.5;

    // ── Background atmosphere ──
    const bgGrad = ctx.createRadialGradient(cx, h * 0.5, 0, cx, h * 0.5, h * 0.7);
    bgGrad.addColorStop(0, `rgba(20,60,100,${0.03 + breath * 0.01})`);
    bgGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // ── Spine axis ──
    // Calculate how much of the spine to show
    let maxRevealY = 0;
    for (let i = 0; i <= 7; i++) {
      if (stageReveal.current[i] > 0.01) {
        const stageMaxY = BRANCHES.filter(b => b.stage === i).reduce((mx, b) => Math.max(mx, b.yNorm), 0);
        maxRevealY = Math.max(maxRevealY, stageMaxY * stageReveal.current[i]);
      }
    }
    // Full spine visible at stage 7+
    if (buildStage >= 7) maxRevealY = 1;
    const revealPx = spineTop + spineH * (1 - maxRevealY);

    // Spine glow
    const spineGlow = ctx.createLinearGradient(cx, spineBot, cx, revealPx);
    spineGlow.addColorStop(0, `rgba(80,160,220,${0.03 + breath * 0.02})`);
    spineGlow.addColorStop(0.5, `rgba(80,160,220,${0.06 + breath * 0.02})`);
    spineGlow.addColorStop(1, `rgba(100,180,240,${0.02})`);
    ctx.beginPath();
    ctx.moveTo(cx, spineBot);
    ctx.lineTo(cx, Math.max(revealPx, spineTop));
    ctx.strokeStyle = spineGlow;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Spine core line
    ctx.beginPath();
    ctx.moveTo(cx, spineBot);
    ctx.lineTo(cx, Math.max(revealPx, spineTop));
    ctx.strokeStyle = `rgba(120,190,240,${0.25 + breath * 0.08})`;
    ctx.lineWidth = 1;
    ctx.stroke();

    // ── Spine nodes ──
    SPINE_NODES.forEach(yN => {
      const y = spineTop + spineH * (1 - yN);
      if (y < revealPx - 5) return;
      const nodeReveal = Math.min(1, Math.max(0, (spineBot - y) / (spineBot - revealPx)));
      const alpha = nodeReveal * (0.15 + breath * 0.05);
      ctx.beginPath();
      ctx.arc(cx, y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(120,190,240,${alpha})`;
      ctx.fill();
      // Tiny horizontal tick
      ctx.beginPath();
      ctx.moveTo(cx - 5, y);
      ctx.lineTo(cx + 5, y);
      ctx.strokeStyle = `rgba(120,190,240,${alpha * 0.5})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    });

    // ── Branches ──
    BRANCHES.forEach((branch, bIdx) => {
      const reveal = stageReveal.current[branch.stage];
      if (reveal < 0.01) return;

      const rootY = spineTop + spineH * (1 - branch.yNorm);
      const branchLen = maxBranchPx * branch.len;
      const endX = cx + branch.dir * branchLen * easeOutCubic(reveal);
      const endY = rootY - branch.curve * branchLen * reveal;
      const cpX = cx + branch.dir * branchLen * 0.5 * reveal;
      const cpY = rootY - branch.curve * branchLen * 0.3 * reveal;

      const alpha = reveal * (0.2 + (buildStage >= 7 ? breath * 0.08 : 0));

      // Branch glow
      ctx.beginPath();
      ctx.moveTo(cx, rootY);
      ctx.quadraticCurveTo(cpX, cpY, endX, endY);
      ctx.strokeStyle = `rgba(80,180,230,${alpha * 0.3})`;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Branch line
      ctx.beginPath();
      ctx.moveTo(cx, rootY);
      ctx.quadraticCurveTo(cpX, cpY, endX, endY);
      ctx.strokeStyle = `rgba(100,190,240,${alpha})`;
      ctx.lineWidth = 0.7;
      ctx.stroke();

      // End node
      if (reveal > 0.3) {
        ctx.beginPath();
        ctx.arc(endX, endY, 1.5 * reveal, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(140,210,255,${alpha * 0.6})`;
        ctx.fill();
      }

      // Sub-branches
      if (branch.subs && reveal > 0.4) {
        branch.subs.forEach(sub => {
          const subReveal = Math.max(0, (reveal - 0.4) / 0.6);
          const subLen = branchLen * sub.len * easeOutCubic(subReveal);
          const subEndX = endX + Math.cos(sub.angle + (branch.dir > 0 ? 0 : Math.PI)) * subLen;
          const subEndY = endY + Math.sin(sub.angle) * subLen;
          const subAlpha = subReveal * alpha * 0.7;

          ctx.beginPath();
          ctx.moveTo(endX, endY);
          ctx.lineTo(subEndX, subEndY);
          ctx.strokeStyle = `rgba(100,190,240,${subAlpha})`;
          ctx.lineWidth = 0.4;
          ctx.stroke();

          if (subReveal > 0.5) {
            ctx.beginPath();
            ctx.arc(subEndX, subEndY, 1 * subReveal, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(140,210,255,${subAlpha * 0.5})`;
            ctx.fill();
          }
        });
      }
    });

    // ── Signal pulses ──
    const activePulses: Pulse[] = [];
    pulsesRef.current.forEach(p => {
      p.t += dt * p.speed;
      if (p.t > 1.2) return; // expired
      activePulses.push(p);

      const branch = BRANCHES[p.branchIdx];
      if (!branch) return;
      const reveal = stageReveal.current[branch.stage];
      if (reveal < 0.3) return;

      const rootY = spineTop + spineH * (1 - branch.yNorm);
      const branchLen = maxBranchPx * branch.len;
      const endX = cx + branch.dir * branchLen * easeOutCubic(reveal);
      const endY = rootY - branch.curve * branchLen * reveal;

      const tt = Math.min(1, p.t);
      let px: number, py: number;

      if (!p.isSub) {
        // Along main branch
        px = cx + (endX - cx) * easeInOutQuart(tt);
        py = rootY + (endY - rootY) * easeInOutQuart(tt);
      } else {
        // Along sub-branch (starts at end of main)
        const sub = branch.subs?.[p.subIdx];
        if (!sub) return;
        const subLen = branchLen * sub.len * easeOutCubic(Math.max(0, (reveal - 0.4) / 0.6));
        const subEndX = endX + Math.cos(sub.angle + (branch.dir > 0 ? 0 : Math.PI)) * subLen;
        const subEndY = endY + Math.sin(sub.angle) * subLen;
        px = endX + (subEndX - endX) * easeInOutQuart(tt);
        py = endY + (subEndY - endY) * easeInOutQuart(tt);
      }

      const fadeEdge = Math.sin(Math.min(1, p.t) * Math.PI);
      const pulseAlpha = fadeEdge * 0.9 * reveal;

      // Pulse glow
      const pg = ctx.createRadialGradient(px, py, 0, px, py, 8);
      pg.addColorStop(0, `rgba(160,220,255,${pulseAlpha * 0.5})`);
      pg.addColorStop(1, 'transparent');
      ctx.fillStyle = pg;
      ctx.fillRect(px - 8, py - 8, 16, 16);

      // Pulse core
      ctx.beginPath();
      ctx.arc(px, py, 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,235,255,${pulseAlpha})`;
      ctx.fill();
    });
    pulsesRef.current = activePulses;

    // ── Continuous ambient pulses (stage 7+) ──
    if (buildStage >= 7) {
      const pulseInterval = 1.5;
      const phase = time % pulseInterval;
      // Spine pulse traveling upward
      const spineT = (phase / pulseInterval);
      const pulseY = spineBot - spineH * easeInOutQuart(spineT);
      const pAlpha = Math.sin(spineT * Math.PI) * 0.6;
      
      const spg = ctx.createRadialGradient(cx, pulseY, 0, cx, pulseY, 12);
      spg.addColorStop(0, `rgba(160,220,255,${pAlpha * 0.4})`);
      spg.addColorStop(1, 'transparent');
      ctx.fillStyle = spg;
      ctx.fillRect(cx - 12, pulseY - 12, 24, 24);

      ctx.beginPath();
      ctx.arc(cx, pulseY, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,235,255,${pAlpha})`;
      ctx.fill();

      // Random branch pulses
      if (Math.random() < 0.02) {
        const rIdx = Math.floor(Math.random() * BRANCHES.length);
        pulsesRef.current.push({ branchIdx: rIdx, t: 0, speed: 0.5 + Math.random() * 0.3, isSub: false, subIdx: 0 });
        if (BRANCHES[rIdx].subs && Math.random() > 0.5) {
          const si = Math.floor(Math.random() * (BRANCHES[rIdx].subs?.length || 1));
          pulsesRef.current.push({ branchIdx: rIdx, t: 0, speed: 0.35 + Math.random() * 0.2, isSub: true, subIdx: si });
        }
      }
    }

    // ── Flash on new stage ──
    if (flashRef.current > 0.01) {
      const fg = ctx.createRadialGradient(cx, h * 0.5, 0, cx, h * 0.5, h * 0.5);
      fg.addColorStop(0, `rgba(120,200,255,${flashRef.current * 0.08})`);
      fg.addColorStop(1, 'transparent');
      ctx.fillStyle = fg;
      ctx.fillRect(0, 0, w, h);
    }

    // ── Top/bottom crown markers when fully calibrated ──
    if (buildStage >= 7) {
      const crownAlpha = stageReveal.current[7] * (0.15 + breath * 0.05);
      // Top cross-hair
      const ty = spineTop + 4;
      ctx.beginPath();
      ctx.moveTo(cx - 8, ty);
      ctx.lineTo(cx + 8, ty);
      ctx.strokeStyle = `rgba(140,210,255,${crownAlpha})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
      // Bottom mark
      const by = spineBot - 4;
      ctx.beginPath();
      ctx.moveTo(cx - 6, by);
      ctx.lineTo(cx + 6, by);
      ctx.strokeStyle = `rgba(140,210,255,${crownAlpha * 0.7})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
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
