import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VB1Questionnaire } from './VB1Questionnaire';
import { VB2Questionnaire } from './VB2Questionnaire';

/* ─── Types ─── */
interface NeoAssistantProps {
  onComplete: () => void;
  onSkip: () => void;
}

type Phase = 'boot' | 'flow' | 'choose' | 'questionnaire';

const ease: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

/* ═══════════════════════════════════════════════════════════════
   BIFURCATION CANVAS — energy stream that splits into two paths
   ═══════════════════════════════════════════════════════════════ */

interface StreamParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  branch: 'trunk' | 'left' | 'right';
  brightness: number;
}

const BifurcationCanvas = ({
  progress,
  phase,
}: {
  progress: number; // 0→1 overall animation progress
  phase: 'boot' | 'flow' | 'choose';
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<StreamParticle[]>([]);
  const frameRef = useRef(0);
  const progressRef = useRef(progress);
  const phaseRef = useRef(phase);
  progressRef.current = progress;
  phaseRef.current = phase;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;

    const resize = () => {
      w = canvas.offsetWidth;
      h = canvas.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    // Path definitions
    const trunkPath = (t: number, _w: number, _h: number) => {
      const startY = _h * 0.82;
      const endY = _h * 0.42;
      const y = startY + (endY - startY) * t;
      const x = _w / 2 + Math.sin(t * Math.PI * 1.2) * 3;
      return { x, y };
    };

    const leftPath = (t: number, _w: number, _h: number) => {
      const startY = _h * 0.42;
      const endY = _h * 0.22;
      const y = startY + (endY - startY) * t;
      const x = _w / 2 - t * (_w * 0.28) - Math.sin(t * Math.PI) * 8;
      return { x, y };
    };

    const rightPath = (t: number, _w: number, _h: number) => {
      const startY = _h * 0.42;
      const endY = _h * 0.22;
      const y = startY + (endY - startY) * t;
      const x = _w / 2 + t * (_w * 0.28) + Math.sin(t * Math.PI) * 8;
      return { x, y };
    };

    let animId: number;

    const spawnParticle = (branch: 'trunk' | 'left' | 'right') => {
      const t = Math.random();
      let pos: { x: number; y: number };
      if (branch === 'trunk') pos = trunkPath(t, w, h);
      else if (branch === 'left') pos = leftPath(t, w, h);
      else pos = rightPath(t, w, h);

      particlesRef.current.push({
        x: pos.x + (Math.random() - 0.5) * 6,
        y: pos.y + (Math.random() - 0.5) * 4,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -0.2 - Math.random() * 0.4,
        life: 0,
        maxLife: 40 + Math.random() * 60,
        size: 0.5 + Math.random() * 1.6,
        branch,
        brightness: 0.5 + Math.random() * 0.5,
      });
    };

    const animate = () => {
      frameRef.current++;
      const p = progressRef.current;
      const ph = phaseRef.current;

      ctx.clearRect(0, 0, w, h);
      if (w === 0) { animId = requestAnimationFrame(animate); return; }

      // ── CAMERA ZOOM ──
      // Starts zoomed in on the trunk base, pulls back as progress increases
      const zoomStart = 2.2;
      const zoomEnd = 1.0;
      // Ease-out cubic for smooth deceleration
      const zoomT = Math.min(p / 0.85, 1);
      const easedZoomT = 1 - Math.pow(1 - zoomT, 3);
      const currentZoom = zoomStart + (zoomEnd - zoomStart) * easedZoomT;

      // Focus point moves from trunk base up to center
      const focusX = w / 2;
      const focusStartY = h * 0.75;
      const focusEndY = h * 0.45;
      const focusY = focusStartY + (focusEndY - focusStartY) * easedZoomT;

      ctx.save();
      ctx.translate(focusX, focusY);
      ctx.scale(currentZoom, currentZoom);
      ctx.translate(-focusX, -focusY);

      // ── Draw paths ──
      const drawTrunk = p > 0;
      const drawBranches = p > 0.35;
      const trunkLen = Math.min(p / 0.4, 1);
      const branchLen = Math.max(0, (p - 0.35) / 0.5);

      if (drawTrunk) {
        // Trunk core — bright
        ctx.beginPath();
        for (let t = 0; t <= trunkLen; t += 0.004) {
          const pt = trunkPath(t, w, h);
          if (t === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        const trunkAlpha = Math.min(p * 2.5, 0.8);
        ctx.strokeStyle = `rgba(255,255,255,${trunkAlpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Inner glow
        ctx.beginPath();
        for (let t = 0; t <= trunkLen; t += 0.004) {
          const pt = trunkPath(t, w, h);
          if (t === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.strokeStyle = `rgba(255,255,255,${trunkAlpha * 0.35})`;
        ctx.lineWidth = 8;
        ctx.stroke();

        // Outer glow
        ctx.beginPath();
        for (let t = 0; t <= trunkLen; t += 0.004) {
          const pt = trunkPath(t, w, h);
          if (t === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.strokeStyle = `rgba(200,220,255,${trunkAlpha * 0.12})`;
        ctx.lineWidth = 20;
        ctx.stroke();
      }

      if (drawBranches) {
        const bl = Math.min(branchLen, 1);

        // Left branch — silver/white
        ctx.beginPath();
        for (let t = 0; t <= bl; t += 0.004) {
          const pt = leftPath(t, w, h);
          if (t === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        const lAlpha = bl * 0.65;
        ctx.strokeStyle = `rgba(200,215,235,${lAlpha})`;
        ctx.lineWidth = 1.8;
        ctx.stroke();
        // glow
        ctx.strokeStyle = `rgba(200,215,235,${lAlpha * 0.25})`;
        ctx.lineWidth = 8;
        ctx.stroke();
        // outer glow
        ctx.strokeStyle = `rgba(180,200,220,${lAlpha * 0.08})`;
        ctx.lineWidth = 18;
        ctx.stroke();

        // Right branch — cyan/electric
        ctx.beginPath();
        for (let t = 0; t <= bl; t += 0.004) {
          const pt = rightPath(t, w, h);
          if (t === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        const rAlpha = bl * 0.7;
        ctx.strokeStyle = `rgba(100,220,255,${rAlpha})`;
        ctx.lineWidth = 1.8;
        ctx.stroke();
        // glow
        ctx.strokeStyle = `rgba(100,220,255,${rAlpha * 0.3})`;
        ctx.lineWidth = 8;
        ctx.stroke();
        // outer glow
        ctx.strokeStyle = `rgba(80,200,255,${rAlpha * 0.1})`;
        ctx.lineWidth = 20;
        ctx.stroke();
      }

      // ── Bifurcation point glow — intensified ──
      if (p > 0.3) {
        const forkPt = trunkPath(1, w, h);
        const forkAlpha = Math.min((p - 0.3) / 0.25, 1) * 0.35;
        const pulse = 1 + Math.sin(frameRef.current * 0.04) * 0.2;
        // Core glow
        const grad = ctx.createRadialGradient(forkPt.x, forkPt.y, 0, forkPt.x, forkPt.y, 18 * pulse);
        grad.addColorStop(0, `rgba(255,255,255,${forkAlpha})`);
        grad.addColorStop(0.5, `rgba(200,230,255,${forkAlpha * 0.3})`);
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(forkPt.x - 40, forkPt.y - 40, 80, 80);
        // Outer halo
        const halo = ctx.createRadialGradient(forkPt.x, forkPt.y, 0, forkPt.x, forkPt.y, 50 * pulse);
        halo.addColorStop(0, `rgba(180,220,255,${forkAlpha * 0.15})`);
        halo.addColorStop(1, 'rgba(180,220,255,0)');
        ctx.fillStyle = halo;
        ctx.fillRect(forkPt.x - 60, forkPt.y - 60, 120, 120);
      }

      // ── Particles ──
      if (ph !== 'boot') {
        const spawnRate = ph === 'choose' ? 3 : 4;
        for (let i = 0; i < spawnRate; i++) {
          if (drawTrunk) spawnParticle('trunk');
          if (drawBranches && branchLen > 0.1) {
            spawnParticle('left');
            spawnParticle('right');
          }
        }
      }

      const alive: StreamParticle[] = [];
      for (const pt of particlesRef.current) {
        pt.life++;
        pt.x += pt.vx;
        pt.y += pt.vy;
        if (pt.life < pt.maxLife) {
          alive.push(pt);
          const lifeRatio = pt.life / pt.maxLife;
          const fade = lifeRatio < 0.15 ? lifeRatio / 0.15 : lifeRatio > 0.6 ? (1 - lifeRatio) / 0.4 : 1;
          const alpha = fade * pt.brightness * 0.7;

          let r = 255, g = 255, b = 255;
          if (pt.branch === 'left') { r = 200; g = 215; b = 235; }
          if (pt.branch === 'right') { r = 100; g = 220; b = 255; }

          // Particle glow
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.size * 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r},${g},${b},${alpha * 0.1})`;
          ctx.fill();

          // Particle core
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
          ctx.fill();
        }
      }
      particlesRef.current = alive;

      // ── Leading pulse — brighter ──
      if (drawTrunk && trunkLen < 1) {
        const headPt = trunkPath(trunkLen, w, h);
        // Bright core
        const hGrad = ctx.createRadialGradient(headPt.x, headPt.y, 0, headPt.x, headPt.y, 6);
        hGrad.addColorStop(0, 'rgba(255,255,255,0.95)');
        hGrad.addColorStop(0.5, 'rgba(255,255,255,0.4)');
        hGrad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = hGrad;
        ctx.fillRect(headPt.x - 10, headPt.y - 10, 20, 20);
        // Outer bloom
        const bloom = ctx.createRadialGradient(headPt.x, headPt.y, 0, headPt.x, headPt.y, 25);
        bloom.addColorStop(0, 'rgba(200,230,255,0.2)');
        bloom.addColorStop(1, 'rgba(200,230,255,0)');
        ctx.fillStyle = bloom;
        ctx.fillRect(headPt.x - 30, headPt.y - 30, 60, 60);
      }

      // ── Branch leading pulses ──
      if (drawBranches && branchLen > 0 && branchLen < 1) {
        const bl = Math.min(branchLen, 1);
        // Left head
        const lHead = leftPath(bl, w, h);
        const lhGrad = ctx.createRadialGradient(lHead.x, lHead.y, 0, lHead.x, lHead.y, 5);
        lhGrad.addColorStop(0, 'rgba(200,215,235,0.8)');
        lhGrad.addColorStop(1, 'rgba(200,215,235,0)');
        ctx.fillStyle = lhGrad;
        ctx.fillRect(lHead.x - 8, lHead.y - 8, 16, 16);

        // Right head
        const rHead = rightPath(bl, w, h);
        const rhGrad = ctx.createRadialGradient(rHead.x, rHead.y, 0, rHead.x, rHead.y, 5);
        rhGrad.addColorStop(0, 'rgba(100,220,255,0.85)');
        rhGrad.addColorStop(1, 'rgba(100,220,255,0)');
        ctx.fillStyle = rhGrad;
        ctx.fillRect(rHead.x - 8, rHead.y - 8, 16, 16);
      }

      // ── Endpoint indicators (choose phase) ──
      if (ph === 'choose') {
        const chooseAlpha = Math.min((p - 0.85) / 0.15, 1);
        if (chooseAlpha > 0) {
          const lEnd = leftPath(1, w, h);
          const lGrad = ctx.createRadialGradient(lEnd.x, lEnd.y, 0, lEnd.x, lEnd.y, 25);
          lGrad.addColorStop(0, `rgba(200,215,235,${chooseAlpha * 0.15})`);
          lGrad.addColorStop(1, 'rgba(200,215,235,0)');
          ctx.fillStyle = lGrad;
          ctx.fillRect(lEnd.x - 35, lEnd.y - 35, 70, 70);

          const rEnd = rightPath(1, w, h);
          const rGrad = ctx.createRadialGradient(rEnd.x, rEnd.y, 0, rEnd.x, rEnd.y, 25);
          rGrad.addColorStop(0, `rgba(100,220,255,${chooseAlpha * 0.2})`);
          rGrad.addColorStop(1, 'rgba(100,220,255,0)');
          ctx.fillStyle = rGrad;
          ctx.fillRect(rEnd.x - 35, rEnd.y - 35, 70, 70);
        }
      }

      ctx.restore();

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-[1]"
    />
  );
};

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export const NeoAssistant = ({ onComplete, onSkip }: NeoAssistantProps) => {
  const [phase, setPhase] = useState<Phase>('boot');
  const [flowProgress, setFlowProgress] = useState(0);
  const [selectedModel, setSelectedModel] = useState<'vb1' | 'vb2' | null>(null);
  const [bootText, setBootText] = useState(0);

  const BOOT_TEXTS = ['Inicializando NEO', 'Analizando perfil', 'Preparando sistema'];

  // Boot → flow transition
  useEffect(() => {
    if (phase !== 'boot') return;
    const intervals = BOOT_TEXTS.map((_, i) =>
      setTimeout(() => setBootText(i), i * 700)
    );
    const toFlow = setTimeout(() => setPhase('flow'), BOOT_TEXTS.length * 700 + 300);
    return () => {
      intervals.forEach(clearTimeout);
      clearTimeout(toFlow);
    };
  }, [phase]);

  // Flow animation → choose
  useEffect(() => {
    if (phase !== 'flow') return;
    let frame = 0;
    const total = 200; // ~3.3s for zoom effect
    let id: number;
    const tick = () => {
      frame++;
      setFlowProgress(frame / total);
      if (frame < total) {
        id = requestAnimationFrame(tick);
      } else {
        setTimeout(() => setPhase('choose'), 200);
      }
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [phase]);

  // Keep progress at 1 during choose
  useEffect(() => {
    if (phase === 'choose') setFlowProgress(1);
  }, [phase]);

  // Questionnaire routing
  if (phase === 'questionnaire' && selectedModel === 'vb1') {
    return <VB1Questionnaire onComplete={onComplete} onBack={() => { setPhase('choose'); setSelectedModel(null); }} />;
  }
  if (phase === 'questionnaire' && selectedModel === 'vb2') {
    return <VB2Questionnaire onComplete={onComplete} onBack={() => { setPhase('choose'); setSelectedModel(null); }} />;
  }

  const selectModel = (model: 'vb1' | 'vb2') => {
    setSelectedModel(model);
    setPhase('questionnaire');
  };

  const canvasPhase = phase === 'questionnaire' ? 'choose' : (phase as 'boot' | 'flow' | 'choose');

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-hidden flex flex-col">
      {/* Canvas — always present */}
      <BifurcationCanvas progress={flowProgress} phase={canvasPhase} />

      {/* Skip */}
      <motion.button
        onClick={onSkip}
        className="absolute top-5 right-5 z-20 text-[10px] tracking-[0.18em] uppercase font-medium text-white/15 hover:text-white/40 transition-colors"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.5 }}
      >
        Omitir
      </motion.button>

      <AnimatePresence mode="wait">
        {/* ════ BOOT ════ */}
        {phase === 'boot' && (
          <motion.div
            key="boot"
            className="absolute inset-0 flex flex-col items-center justify-center z-10"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease }}
          >
            <motion.span
              className="text-[28px] font-bold tracking-[0.12em] text-white/90 mb-8 select-none"
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease }}
            >
              NEO
            </motion.span>
            <AnimatePresence mode="wait">
              <motion.p
                key={bootText}
                className="text-[11px] tracking-[0.2em] uppercase text-white/20 font-medium"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease }}
              >
                {BOOT_TEXTS[bootText]}
              </motion.p>
            </AnimatePresence>
          </motion.div>
        )}

        {/* ════ FLOW (watching the bifurcation animate) ════ */}
        {phase === 'flow' && (
          <motion.div
            key="flow"
            className="absolute inset-0 flex flex-col items-center z-10 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease }}
          >
            {/* Top text — appears during flow */}
            <motion.div
              className="mt-[15vh] text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: flowProgress > 0.15 ? 1 : 0, y: flowProgress > 0.15 ? 0 : 10 }}
              transition={{ duration: 0.6, ease }}
            >
              <p className="text-[10px] tracking-[0.25em] uppercase text-white/15 font-medium mb-3">
                Sistema adaptativo
              </p>
              <h1 className="text-[24px] font-semibold tracking-[-0.02em] text-white/85 leading-tight">
                Dos caminos.
                <br />
                <span className="text-white/40">Una decisión.</span>
              </h1>
            </motion.div>
          </motion.div>
        )}

        {/* ════ CHOOSE — final state, no scroll ════ */}
        {phase === 'choose' && (
          <motion.div
            key="choose"
            className="absolute inset-0 flex flex-col z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease }}
          >
            {/* Header */}
            <div className="flex-shrink-0 pt-[max(env(safe-area-inset-top),20px)] px-6">
              <motion.p
                className="text-[10px] tracking-[0.2em] uppercase text-white/15 font-medium text-center mb-1.5 mt-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                Nivel de profundidad
              </motion.p>
              <motion.h1
                className="text-[22px] font-semibold tracking-[-0.02em] text-white/90 text-center"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5, ease }}
              >
                Elige tu camino
              </motion.h1>
            </div>

            {/* Spacer — canvas shows the bifurcation in this area */}
            <div className="flex-1 min-h-0" />

            {/* Bottom selection — two compact cards side by side */}
            <div className="flex-shrink-0 px-4 pb-[max(env(safe-area-inset-bottom),24px)]">
              <div className="flex gap-3">
                {/* VB1 */}
                <motion.button
                  onClick={() => selectModel('vb1')}
                  className="flex-1 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 text-left active:scale-[0.97] transition-transform relative overflow-hidden"
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.5, duration: 0.6, ease }}
                  whileTap={{ scale: 0.97 }}
                >
                  {/* Subtle identity — silver accent line */}
                  <div className="absolute top-0 left-3 right-3 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                  {/* Mini visual — simple bars */}
                  <div className="flex items-end gap-[3px] h-[28px] mb-3">
                    {[35, 55, 40, 60, 45].map((barH, i) => (
                      <motion.div
                        key={i}
                        className="flex-1 rounded-[2px] bg-white/[0.08]"
                        initial={{ height: 0 }}
                        animate={{ height: `${barH}%` }}
                        transition={{ delay: 0.8 + i * 0.06, duration: 0.4, ease }}
                      />
                    ))}
                  </div>

                  <div className="text-[18px] font-semibold text-white/85 tracking-[-0.01em] mb-1">
                    VB1
                  </div>
                  <p className="text-[11px] text-white/30 leading-snug font-light">
                    Más simple.
                    <br />
                    Más directo.
                  </p>

                  {/* CTA bar */}
                  <div className="mt-3 h-[36px] rounded-xl bg-white/[0.06] border border-white/[0.06] flex items-center justify-center">
                    <span className="text-[11px] font-semibold text-white/50 tracking-[0.02em]">
                      Entrar con VB1
                    </span>
                  </div>
                </motion.button>

                {/* VB2 */}
                <motion.button
                  onClick={() => selectModel('vb2')}
                  className="flex-1 rounded-2xl border border-white/[0.1] bg-white/[0.035] p-4 text-left active:scale-[0.97] transition-transform relative overflow-hidden"
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.65, duration: 0.6, ease }}
                  whileTap={{ scale: 0.97 }}
                >
                  {/* Accent line — cyan tint */}
                  <div className="absolute top-0 left-3 right-3 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />

                  {/* Mini visual — dense grid */}
                  <div className="grid grid-cols-3 gap-[3px] mb-3">
                    {[65, 42, 78, 55, 80, 48].map((v, i) => (
                      <motion.div
                        key={i}
                        className="h-[12px] rounded-[2px] bg-white/[0.06]"
                        initial={{ opacity: 0, scaleX: 0 }}
                        animate={{ opacity: 1, scaleX: 1 }}
                        transition={{ delay: 0.9 + i * 0.05, duration: 0.35, ease }}
                        style={{ transformOrigin: 'left' }}
                      >
                        <motion.div
                          className="h-full rounded-[2px] bg-cyan-400/15"
                          initial={{ width: 0 }}
                          animate={{ width: `${v}%` }}
                          transition={{ delay: 1.0 + i * 0.05, duration: 0.4, ease }}
                        />
                      </motion.div>
                    ))}
                  </div>

                  <div className="text-[18px] font-semibold text-white/90 tracking-[-0.01em] mb-1">
                    VB2
                  </div>
                  <p className="text-[11px] text-white/35 leading-snug font-light">
                    Más precisión.
                    <br />
                    Más análisis.
                  </p>

                  {/* CTA bar — slightly more prominent */}
                  <div className="mt-3 h-[36px] rounded-xl bg-white/[0.08] border border-cyan-400/10 flex items-center justify-center">
                    <span className="text-[11px] font-semibold text-white/60 tracking-[0.02em]">
                      Empezar VB2
                    </span>
                  </div>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
