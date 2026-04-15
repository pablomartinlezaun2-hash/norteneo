import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VB1Questionnaire } from './VB1Questionnaire';
import { VB2Questionnaire } from './VB2Questionnaire';

/* ─── Types ─── */
interface NeoAssistantProps {
  onComplete: () => void;
  onSkip: () => void;
}

type Phase = 'boot' | 'intro' | 'compare' | 'questionnaire';

const ease: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

/* ─── Boot messages ─── */
const BOOT_LINES = [
  'Inicializando NEO',
  'Detectando perfil',
  'Calibrando sistema',
  'Preparando modelos',
];

/* ─── Mini Dashboard Components ─── */

const VB1Dashboard = ({ animate }: { animate: boolean }) => (
  <div className="w-full space-y-2.5">
    {/* Simple metric row */}
    <div className="flex gap-2">
      {[65, 42, 78].map((v, i) => (
        <motion.div
          key={i}
          className="flex-1 rounded-lg bg-white/[0.04] border border-white/[0.06] p-2.5"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={animate ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 0.1 + i * 0.12, duration: 0.5, ease }}
        >
          <div className="text-[9px] tracking-[0.12em] uppercase text-white/25 mb-1">
            {['Sesiones', 'Volumen', 'Ritmo'][i]}
          </div>
          <motion.div
            className="text-[17px] font-semibold text-white/80 tabular-nums"
            initial={{ opacity: 0 }}
            animate={animate ? { opacity: 1 } : {}}
            transition={{ delay: 0.3 + i * 0.12, duration: 0.4 }}
          >
            {v}
          </motion.div>
        </motion.div>
      ))}
    </div>
    {/* Simple bar chart */}
    <motion.div
      className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-3"
      initial={{ opacity: 0, y: 6 }}
      animate={animate ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: 0.5, duration: 0.5, ease }}
    >
      <div className="flex items-end gap-1.5 h-[32px]">
        {[40, 60, 35, 70, 50, 65, 45].map((h, i) => (
          <motion.div
            key={i}
            className="flex-1 rounded-sm bg-white/10"
            initial={{ height: 0 }}
            animate={animate ? { height: `${h}%` } : {}}
            transition={{ delay: 0.6 + i * 0.05, duration: 0.4, ease }}
          />
        ))}
      </div>
    </motion.div>
  </div>
);

const VB2Dashboard = ({ animate }: { animate: boolean }) => (
  <div className="w-full space-y-2.5">
    {/* Dense metric grid */}
    <div className="grid grid-cols-3 gap-1.5">
      {[
        { label: 'RIR', value: '1.2' },
        { label: 'Fatiga', value: '34%' },
        { label: 'MRV', value: '18' },
        { label: 'Tendencia', value: '+4%' },
        { label: 'Readiness', value: '87' },
        { label: 'Carga', value: '2.4k' },
      ].map((m, i) => (
        <motion.div
          key={i}
          className="rounded-md bg-white/[0.04] border border-white/[0.06] p-2"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={animate ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 0.1 + i * 0.07, duration: 0.45, ease }}
        >
          <div className="text-[8px] tracking-[0.14em] uppercase text-white/20 mb-0.5">{m.label}</div>
          <motion.div
            className="text-[13px] font-semibold text-white/80 tabular-nums"
            initial={{ opacity: 0 }}
            animate={animate ? { opacity: 1 } : {}}
            transition={{ delay: 0.25 + i * 0.07, duration: 0.35 }}
          >
            {m.value}
          </motion.div>
        </motion.div>
      ))}
    </div>
    {/* Complex chart area */}
    <motion.div
      className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-3"
      initial={{ opacity: 0, y: 6 }}
      animate={animate ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: 0.55, duration: 0.5, ease }}
    >
      <div className="flex items-end gap-1 h-[28px] mb-2">
        {[30, 55, 45, 80, 60, 75, 50, 85, 65, 70].map((h, i) => (
          <motion.div
            key={i}
            className="flex-1 rounded-sm bg-white/15"
            initial={{ height: 0 }}
            animate={animate ? { height: `${h}%` } : {}}
            transition={{ delay: 0.65 + i * 0.04, duration: 0.35, ease }}
          />
        ))}
      </div>
      {/* Data trace line */}
      <svg viewBox="0 0 200 20" className="w-full h-3 overflow-visible">
        <motion.path
          d="M0,15 Q25,5 50,10 T100,8 T150,12 T200,6"
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="1"
          initial={{ pathLength: 0 }}
          animate={animate ? { pathLength: 1 } : {}}
          transition={{ delay: 0.8, duration: 0.8, ease }}
        />
        <motion.path
          d="M0,18 Q30,12 60,14 T120,10 T200,4"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="0.8"
          strokeDasharray="2 3"
          initial={{ pathLength: 0 }}
          animate={animate ? { pathLength: 1 } : {}}
          transition={{ delay: 1, duration: 0.7, ease }}
        />
      </svg>
    </motion.div>
  </div>
);

/* ─── Boot Sequence Canvas ─── */
const BootCanvas = ({ progress }: { progress: number }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.scale(dpr, dpr);

    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;

    ctx.clearRect(0, 0, w, h);

    // Subtle grid
    ctx.strokeStyle = `rgba(255,255,255,${0.02 * Math.min(progress * 2, 1)})`;
    ctx.lineWidth = 0.5;
    const gridSize = 40;
    for (let x = 0; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Center crosshair
    const cx = w / 2;
    const cy = h / 2;
    const crossSize = 20 * progress;
    ctx.strokeStyle = `rgba(255,255,255,${0.08 * progress})`;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(cx - crossSize, cy);
    ctx.lineTo(cx + crossSize, cy);
    ctx.moveTo(cx, cy - crossSize);
    ctx.lineTo(cx, cy + crossSize);
    ctx.stroke();

    // Scanning circle
    const radius = 60 * progress;
    ctx.strokeStyle = `rgba(255,255,255,${0.04 * progress})`;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2 * progress);
    ctx.stroke();
  }, [progress]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.6 }}
    />
  );
};

/* ─── Main Component ─── */
export const NeoAssistant = ({ onComplete, onSkip }: NeoAssistantProps) => {
  const [phase, setPhase] = useState<Phase>('boot');
  const [bootLine, setBootLine] = useState(0);
  const [bootProgress, setBootProgress] = useState(0);
  const [selectedModel, setSelectedModel] = useState<'vb1' | 'vb2' | null>(null);
  const [compareReady, setCompareReady] = useState(false);

  // Boot sequence
  useEffect(() => {
    if (phase !== 'boot') return;

    let frame = 0;
    const totalFrames = 120; // ~2s at 60fps
    const lineInterval = totalFrames / BOOT_LINES.length;

    const tick = () => {
      frame++;
      setBootProgress(frame / totalFrames);
      const newLine = Math.min(Math.floor(frame / lineInterval), BOOT_LINES.length - 1);
      setBootLine(newLine);

      if (frame < totalFrames) {
        requestAnimationFrame(tick);
      } else {
        setTimeout(() => setPhase('intro'), 400);
      }
    };
    requestAnimationFrame(tick);
  }, [phase]);

  // Auto-advance from intro
  useEffect(() => {
    if (phase !== 'intro') return;
    const timer = setTimeout(() => {
      setPhase('compare');
      setTimeout(() => setCompareReady(true), 200);
    }, 2400);
    return () => clearTimeout(timer);
  }, [phase]);

  // Questionnaire flows
  if (phase === 'questionnaire' && selectedModel === 'vb1') {
    return <VB1Questionnaire onComplete={onComplete} onBack={() => { setPhase('compare'); setSelectedModel(null); }} />;
  }
  if (phase === 'questionnaire' && selectedModel === 'vb2') {
    return <VB2Questionnaire onComplete={onComplete} onBack={() => { setPhase('compare'); setSelectedModel(null); }} />;
  }

  const selectModel = (model: 'vb1' | 'vb2') => {
    setSelectedModel(model);
    setPhase('questionnaire');
  };

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-hidden">
      {/* Skip button */}
      <motion.button
        onClick={onSkip}
        className="absolute top-6 right-6 z-20 text-[11px] tracking-[0.16em] uppercase font-medium text-white/15 hover:text-white/40 transition-colors duration-300"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        Saltar
      </motion.button>

      <AnimatePresence mode="wait">
        {/* ════════ PHASE 1: BOOT ════════ */}
        {phase === 'boot' && (
          <motion.div
            key="boot"
            className="absolute inset-0 flex flex-col items-center justify-center"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease }}
          >
            <BootCanvas progress={bootProgress} />

            {/* Logo */}
            <motion.div
              className="relative z-10 mb-12"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease }}
            >
              <span
                className="text-[2.2rem] font-bold tracking-[0.1em] text-white/90 select-none"
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              >
                NEO
              </span>
            </motion.div>

            {/* Boot lines */}
            <div className="relative z-10 flex flex-col items-center gap-3">
              <AnimatePresence mode="wait">
                <motion.p
                  key={bootLine}
                  className="text-[11px] tracking-[0.2em] uppercase text-white/25 font-medium"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.25, ease }}
                >
                  {BOOT_LINES[bootLine]}
                </motion.p>
              </AnimatePresence>

              {/* Progress bar */}
              <div className="w-[120px] h-[1px] bg-white/[0.06] rounded-full overflow-hidden mt-2">
                <motion.div
                  className="h-full bg-white/20 rounded-full"
                  style={{ width: `${bootProgress * 100}%` }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* ════════ PHASE 2: INTRO ════════ */}
        {phase === 'intro' && (
          <motion.div
            key="intro"
            className="absolute inset-0 flex flex-col items-center justify-center px-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.5, ease }}
          >
            {/* Scanning line */}
            <motion.div
              className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"
              initial={{ top: '30%' }}
              animate={{ top: '70%' }}
              transition={{ duration: 2, ease: 'linear', repeat: Infinity, repeatType: 'reverse' }}
            />

            <motion.div
              className="relative z-10 flex flex-col items-center text-center max-w-[300px]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7, ease }}
            >
              {/* Small system label */}
              <motion.div
                className="text-[10px] tracking-[0.25em] uppercase text-white/20 font-medium mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                Sistema adaptativo
              </motion.div>

              {/* Main headline – each word reveals */}
              <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-white/90 leading-[1.2] mb-4">
                <motion.span
                  className="block"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.6, ease }}
                >
                  NEO se adapta
                </motion.span>
                <motion.span
                  className="block text-white/40"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.6, ease }}
                >
                  a tu nivel
                </motion.span>
              </h1>

              <motion.p
                className="text-[13px] font-light leading-relaxed text-white/25"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.6 }}
              >
                Dos niveles de profundidad.
                <br />
                Una decisión que define tu experiencia.
              </motion.p>
            </motion.div>
          </motion.div>
        )}

        {/* ════════ PHASE 3: COMPARE ════════ */}
        {phase === 'compare' && (
          <motion.div
            key="compare"
            className="absolute inset-0 flex flex-col overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease }}
          >
            {/* Header */}
            <div className="flex-shrink-0 pt-14 pb-6 px-6 text-center">
              <motion.div
                className="text-[10px] tracking-[0.25em] uppercase text-white/15 font-medium mb-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                Selección de modelo
              </motion.div>
              <motion.h1
                className="text-[24px] font-semibold tracking-[-0.02em] text-white/90"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6, ease }}
              >
                Elige tu nivel
              </motion.h1>
            </div>

            {/* Cards container */}
            <div className="flex-1 px-5 pb-10 space-y-4">

              {/* ── VB1 Card ── */}
              <motion.div
                className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={compareReady ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.1, duration: 0.6, ease }}
              >
                <div className="p-5 pb-4">
                  {/* Tag + title */}
                  <div className="flex items-center gap-2.5 mb-1">
                    <div className="h-5 px-2 rounded bg-white/[0.06] flex items-center">
                      <span className="text-[9px] tracking-[0.14em] uppercase font-medium text-white/30">Esencial</span>
                    </div>
                  </div>
                  <h2 className="text-[22px] font-semibold text-white/90 tracking-[-0.01em] mt-2">
                    NEO VB1
                  </h2>
                  <p className="text-[13px] font-light text-white/30 mt-1 leading-snug">
                    Empieza más rápido. Menos configuración, más claridad.
                  </p>
                </div>

                {/* Mini dashboard */}
                <div className="px-5 pb-4">
                  <VB1Dashboard animate={compareReady} />
                </div>

                {/* Features */}
                <div className="px-5 pb-4">
                  <div className="flex flex-wrap gap-1.5">
                    {['Seguimiento', 'Progreso', 'Nutrición básica'].map((f, i) => (
                      <motion.span
                        key={f}
                        className="h-6 px-2.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-[10px] font-medium text-white/30 flex items-center"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={compareReady ? { opacity: 1, scale: 1 } : {}}
                        transition={{ delay: 0.7 + i * 0.08, duration: 0.4, ease }}
                      >
                        {f}
                      </motion.span>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <div className="px-5 pb-5">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => selectModel('vb1')}
                    className="w-full h-[48px] rounded-xl bg-white/90 text-black text-[14px] font-semibold tracking-[0.01em] transition-colors hover:bg-white"
                    initial={{ opacity: 0 }}
                    animate={compareReady ? { opacity: 1 } : {}}
                    transition={{ delay: 0.9, duration: 0.5 }}
                  >
                    Empezar con VB1
                  </motion.button>
                </div>
              </motion.div>

              {/* ── VB2 Card ── */}
              <motion.div
                className="rounded-2xl border border-white/[0.08] overflow-hidden relative"
                style={{
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={compareReady ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.3, duration: 0.6, ease }}
              >
                {/* Subtle top glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                <div className="p-5 pb-4">
                  <div className="flex items-center gap-2.5 mb-1">
                    <div className="h-5 px-2 rounded bg-white/[0.08] flex items-center">
                      <span className="text-[9px] tracking-[0.14em] uppercase font-medium text-white/40">Avanzado</span>
                    </div>
                    <div className="h-5 px-2 rounded bg-white/[0.05] flex items-center">
                      <span className="text-[9px] tracking-[0.12em] uppercase font-medium text-white/20">1:1</span>
                    </div>
                  </div>
                  <h2 className="text-[22px] font-semibold text-white/90 tracking-[-0.01em] mt-2">
                    NEO VB2
                  </h2>
                  <p className="text-[13px] font-light text-white/30 mt-1 leading-snug">
                    Máxima precisión. Análisis profundo. Asesoría 1:1.
                  </p>
                </div>

                {/* Dense dashboard */}
                <div className="px-5 pb-4">
                  <VB2Dashboard animate={compareReady} />
                </div>

                {/* Features */}
                <div className="px-5 pb-4">
                  <div className="flex flex-wrap gap-1.5">
                    {['RIR Tracking', 'Autorregulación', 'Fatiga AI', 'Periodización', 'Asesoría 1:1'].map((f, i) => (
                      <motion.span
                        key={f}
                        className="h-6 px-2.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-[10px] font-medium text-white/30 flex items-center"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={compareReady ? { opacity: 1, scale: 1 } : {}}
                        transition={{ delay: 0.8 + i * 0.06, duration: 0.4, ease }}
                      >
                        {f}
                      </motion.span>
                    ))}
                  </div>
                </div>

                {/* Advisory note */}
                <motion.div
                  className="mx-5 mb-4 rounded-xl bg-white/[0.03] border border-white/[0.05] p-3"
                  initial={{ opacity: 0 }}
                  animate={compareReady ? { opacity: 1 } : {}}
                  transition={{ delay: 1.1, duration: 0.5 }}
                >
                  <p className="text-[11px] font-light leading-relaxed text-white/20">
                    VB2 requiere más tiempo de configuración y compromiso. Incluye revisión manual y asesoría directa con Pablo.
                  </p>
                </motion.div>

                {/* CTA */}
                <div className="px-5 pb-5">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => selectModel('vb2')}
                    className="w-full h-[48px] rounded-xl border border-white/[0.12] bg-white/[0.04] text-white/90 text-[14px] font-semibold tracking-[0.01em] transition-all hover:bg-white/[0.08] hover:border-white/[0.18]"
                    initial={{ opacity: 0 }}
                    animate={compareReady ? { opacity: 1 } : {}}
                    transition={{ delay: 1.2, duration: 0.5 }}
                  >
                    Activar máxima precisión
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
