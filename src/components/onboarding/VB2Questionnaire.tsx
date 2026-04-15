import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNeoProfile } from '@/contexts/NeoProfileContext';
import { activateVB2 } from '@/lib/activateVB2';
import { mapVB2AnswersToProfile, mapVB2AnswersToMetrics } from '@/lib/questionnaireMapper';
import { saveInitialMetrics } from '@/lib/saveInitialMetrics';
import {
  Dumbbell, Clock, Scale, Ruler, CalendarDays, Target,
  Brain, Moon, HeartPulse, Zap, Activity, TrendingUp,
  Utensils, Droplets, Pill, Shield, Flame, CheckCircle2,
} from 'lucide-react';

/* ─── Types ─── */

interface VB2QuestionnaireProps {
  onComplete: () => void;
  onBack: () => void;
}

interface QuestionStep {
  question: string;
  type: 'single' | 'numeric' | 'segmented';
  options?: string[];
  unit?: string;
  placeholder?: string;
  hint?: string;
  icon: React.ReactNode;
  accentHue?: number;
  block: number; // 0-4
}

const ease: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

const BLOCKS = [
  { name: 'Perfil base', hue: 210 },
  { name: 'Nivel real', hue: 260 },
  { name: 'Recuperación', hue: 230 },
  { name: 'Nutrición', hue: 150 },
  { name: 'Compromiso', hue: 190 },
];

const STEPS: QuestionStep[] = [
  // BLOCK 0 — Perfil base
  { question: '¿Qué disciplinas practicas actualmente?', type: 'single', options: ['Solo gimnasio', 'Gimnasio + running', 'Gimnasio + natación', 'Gimnasio + running + natación'], hint: 'Activa los módulos adecuados.', icon: <Dumbbell className="w-5 h-5" />, accentHue: 210, block: 0 },
  { question: '¿Cuántos años tienes?', type: 'numeric', placeholder: '25', hint: 'Ajusta parámetros fisiológicos base.', icon: <Clock className="w-5 h-5" />, accentHue: 215, block: 0 },
  { question: '¿Cuál es tu peso corporal actual?', type: 'numeric', unit: 'kg', placeholder: '75', hint: 'Referencia para métricas relativas.', icon: <Scale className="w-5 h-5" />, accentHue: 200, block: 0 },
  { question: '¿Cuál es tu altura?', type: 'numeric', unit: 'cm', placeholder: '175', hint: 'Completa el perfil antropométrico.', icon: <Ruler className="w-5 h-5" />, accentHue: 195, block: 0 },
  { question: '¿Cuántos años llevas entrenando de verdad?', type: 'segmented', options: ['<1', '1–3', '3–5', '5+'], hint: 'Calibra el nivel de adaptación.', icon: <TrendingUp className="w-5 h-5" />, accentHue: 220, block: 0 },
  { question: '¿Cuántos días entrenas por semana?', type: 'segmented', options: ['2–3', '4–5', '6', '7+'], hint: 'Define la frecuencia y distribución.', icon: <CalendarDays className="w-5 h-5" />, accentHue: 205, block: 0 },

  // BLOCK 1 — Nivel real
  { question: '¿Sabes entrenar con RIR o cercanía al fallo?', type: 'single', options: ['No', 'Lo básico', 'Sí, bastante bien', 'Sí, con mucha precisión'], hint: 'Calibra la precisión del modelo de intensidad.', icon: <Target className="w-5 h-5" />, accentHue: 260, block: 1 },
  { question: '¿Has seguido una planificación seria varias semanas?', type: 'single', options: ['No', 'Sí, sin mucha constancia', 'Sí, bastante bien', 'Sí, con mucha precisión'], hint: 'Evalúa tu capacidad de adherencia estructural.', icon: <Activity className="w-5 h-5" />, accentHue: 265, block: 1 },
  { question: '¿Qué tipo de esfuerzo se te da mejor?', type: 'single', options: ['Resistencia larga', 'Explosividad / potencia', 'Me adapto bien a ambos'], hint: 'Perfila tu fibra dominante.', icon: <Zap className="w-5 h-5" />, accentHue: 270, block: 1 },
  { question: 'Cuando entrenas fuerte, ¿qué falla antes?', type: 'single', options: ['La respiración o la energía', 'El músculo pierde fuerza rápido', 'Depende del tipo de sesión'], hint: 'Identifica tu limitante principal.', icon: <Flame className="w-5 h-5" />, accentHue: 255, block: 1 },
  { question: '¿Qué has practicado más tiempo en tu vida?', type: 'single', options: ['Resistencia', 'Fuerza / potencia', 'Mezcla de ambas'], hint: 'Completa el historial motor.', icon: <TrendingUp className="w-5 h-5" />, accentHue: 250, block: 1 },
  { question: 'Cuando levantas pesado, ¿qué suele pasar?', type: 'single', options: ['Muevo bien cargas moderadas, me cuesta el máximo', 'Bueno con cargas altas, me fatigo rápido', 'Depende del momento'], hint: 'Afina el perfil fuerza-resistencia.', icon: <Dumbbell className="w-5 h-5" />, accentHue: 245, block: 1 },

  // BLOCK 2 — Recuperación y estrés
  { question: '¿Cuántas horas duermes normalmente?', type: 'segmented', options: ['<6', '6–7', '7–8', '8+'], hint: 'Factor clave en la recuperación.', icon: <Moon className="w-5 h-5" />, accentHue: 230, block: 2 },
  { question: '¿Cómo es la calidad de tu sueño?', type: 'single', options: ['Mala', 'Regular', 'Buena', 'Muy buena'], hint: 'Modula la capacidad regenerativa.', icon: <Moon className="w-5 h-5" />, accentHue: 235, block: 2 },
  { question: '¿Cómo es tu nivel de estrés diario?', type: 'single', options: ['Bajo', 'Medio', 'Alto', 'Muy alto'], hint: 'Afecta la tolerancia al volumen.', icon: <Brain className="w-5 h-5" />, accentHue: 280, block: 2 },
  { question: '¿Sueles tener ansiedad o mucha carga mental?', type: 'single', options: ['No', 'A veces', 'Bastante', 'Mucho'], hint: 'Variable de fatiga no-física.', icon: <Brain className="w-5 h-5" />, accentHue: 275, block: 2 },
  { question: '¿Tu rutina diaria te desgasta físicamente?', type: 'single', options: ['No demasiado', 'Un poco', 'Bastante', 'Muchísimo'], hint: 'Estima la fatiga acumulada externa.', icon: <HeartPulse className="w-5 h-5" />, accentHue: 225, block: 2 },

  // BLOCK 3 — Nutrición y adherencia
  { question: '¿Cómo es tu adherencia nutricional real?', type: 'single', options: ['Mala', 'Media', 'Buena', 'Muy buena'], hint: 'Ajusta las expectativas del modelo.', icon: <Utensils className="w-5 h-5" />, accentHue: 150, block: 3 },
  { question: '¿Cuántas comidas haces al día?', type: 'segmented', options: ['≤2', '3', '4', '5+'], hint: 'Estructura la distribución calórica.', icon: <Utensils className="w-5 h-5" />, accentHue: 145, block: 3 },
  { question: '¿Sueles comer cerca del entrenamiento?', type: 'single', options: ['No', 'A veces', 'Casi siempre', 'Siempre'], hint: 'Optimiza el timing nutricional.', icon: <Utensils className="w-5 h-5" />, accentHue: 155, block: 3 },
  { question: '¿Usas suplementación?', type: 'single', options: ['No', 'Básica', 'Bastante estructurada', 'Muy controlada'], hint: 'Activa recomendaciones específicas.', icon: <Pill className="w-5 h-5" />, accentHue: 160, block: 3 },
  { question: '¿Cómo es tu hidratación diaria?', type: 'single', options: ['Mala', 'Regular', 'Buena', 'Muy buena'], hint: 'Factor de rendimiento básico.', icon: <Droplets className="w-5 h-5" />, accentHue: 180, block: 3 },

  // BLOCK 4 — Historial, tolerancia y compromiso
  { question: '¿Has tenido lesiones o recaídas recientes?', type: 'single', options: ['No', 'Sí, leves', 'Sí, moderadas', 'Sí, importantes'], hint: 'Protege zonas de riesgo.', icon: <Shield className="w-5 h-5" />, accentHue: 190, block: 4 },
  { question: '¿Con qué frecuencia te pasas de carga o fatiga?', type: 'single', options: ['Casi nunca', 'A veces', 'Bastante', 'Muy a menudo'], hint: 'Evalúa la autorregulación natural.', icon: <Activity className="w-5 h-5" />, accentHue: 185, block: 4 },
  { question: '¿Cómo recuperas entre sesiones duras?', type: 'single', options: ['Muy bien', 'Bien', 'Regular', 'Mal'], hint: 'Calibra los días de descanso.', icon: <HeartPulse className="w-5 h-5" />, accentHue: 195, block: 4 },
  { question: '¿Estás dispuesto a seguir un sistema más preciso?', type: 'single', options: ['No del todo', 'Más o menos', 'Sí', 'Sí, al 100 %'], hint: 'Define el nivel de exigencia.', icon: <Target className="w-5 h-5" />, accentHue: 200, block: 4 },
  { question: '¿Aceptarías feedback directo del equipo?', type: 'single', options: ['No', 'Sí'], hint: 'Activa la vía de seguimiento manual.', icon: <CheckCircle2 className="w-5 h-5" />, accentHue: 210, block: 4 },
];

const TOTAL = STEPS.length;

/* ─── Ambient Particles ─── */

const AmbientDots = ({ hue }: { hue: number }) => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
    {Array.from({ length: 10 }).map((_, i) => (
      <motion.div
        key={i}
        className="absolute rounded-full"
        style={{
          width: 2 + Math.random() * 3,
          height: 2 + Math.random() * 3,
          left: `${10 + Math.random() * 80}%`,
          top: `${10 + Math.random() * 80}%`,
          background: `hsla(${hue}, 60%, 70%, 0.06)`,
        }}
        animate={{
          opacity: [0, 0.4, 0],
          y: [0, -8, -16],
        }}
        transition={{
          duration: 3 + Math.random() * 2,
          repeat: Infinity,
          delay: Math.random() * 3,
          ease: 'easeInOut',
        }}
      />
    ))}
  </div>
);

/* ─── Block Transition Screen ─── */

const BlockTransition = ({ block, onDone }: { block: number; onDone: () => void }) => {
  const b = BLOCKS[block];

  useEffect(() => {
    const t = setTimeout(onDone, 1800);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease }}
    >
      <motion.div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
        style={{
          background: `hsla(${b.hue}, 50%, 60%, 0.08)`,
          border: `1px solid hsla(${b.hue}, 50%, 60%, 0.12)`,
        }}
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease }}
      >
        <motion.div
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: `hsla(${b.hue}, 60%, 70%, 0.7)` }}
          animate={{ scale: [1, 1.5, 1], opacity: [0.7, 0.3, 0.7] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
      <motion.p
        className="text-[10px] tracking-[0.22em] uppercase font-semibold mb-2"
        style={{ color: `hsla(${b.hue}, 50%, 65%, 0.5)` }}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4, ease }}
      >
        Fase {block + 1} de {BLOCKS.length}
      </motion.p>
      <motion.h2
        className="text-[20px] font-semibold text-white/80 tracking-[-0.01em]"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.45, ease }}
      >
        {b.name}
      </motion.h2>
    </motion.div>
  );
};

/* ─── Component ─── */

export const VB2Questionnaire = ({ onComplete, onBack }: VB2QuestionnaireProps) => {
  const { saveProfile } = useNeoProfile();
  const [currentIdx, setCurrentIdx] = useState(-1); // -1=intro
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [direction, setDirection] = useState(1);
  const [activating, setActivating] = useState(false);
  const [activated, setActivated] = useState(false);
  const [activationError, setActivationError] = useState<string | null>(null);
  const [blockTransition, setBlockTransition] = useState<number | null>(null);
  const prevBlockRef = useRef(-1);

  const isIntro = currentIdx === -1;
  const isComplete = currentIdx === TOTAL;
  const step = !isIntro && !isComplete ? STEPS[currentIdx] : null;
  const currentBlock = step?.block ?? 0;
  const blockInfo = BLOCKS[currentBlock];
  const progress = isIntro ? 0 : isComplete ? 1 : (currentIdx + 1) / TOTAL;

  const go = useCallback((delta: number) => {
    const nextIdx = currentIdx + delta;
    if (nextIdx >= 0 && nextIdx < TOTAL && delta > 0) {
      const nextBlock = STEPS[nextIdx].block;
      const currentBlockNum = currentIdx >= 0 && currentIdx < TOTAL ? STEPS[currentIdx].block : -1;
      if (nextBlock !== currentBlockNum && currentBlockNum !== -1) {
        // Show block transition
        setBlockTransition(nextBlock);
        setDirection(delta);
        return;
      }
    }
    setDirection(delta);
    setCurrentIdx(s => s + delta);
  }, [currentIdx]);

  // After block transition, advance
  const handleBlockTransitionDone = useCallback(() => {
    if (blockTransition !== null) {
      const nextIdx = currentIdx + 1;
      setBlockTransition(null);
      setCurrentIdx(nextIdx);
    }
  }, [blockTransition, currentIdx]);

  const selectOption = useCallback((value: string) => {
    setAnswers(prev => ({ ...prev, [currentIdx]: value }));
    setTimeout(() => go(1), 320);
  }, [currentIdx, go]);

  const setNumeric = useCallback((value: string) => {
    setAnswers(prev => ({ ...prev, [currentIdx]: value }));
  }, [currentIdx]);

  const slideVariants = {
    enter: (d: number) => ({
      opacity: 0,
      x: d > 0 ? 60 : -60,
      scale: 0.96,
      filter: 'blur(4px)',
    }),
    center: {
      opacity: 1,
      x: 0,
      scale: 1,
      filter: 'blur(0px)',
      transition: { duration: 0.5, ease },
    },
    exit: (d: number) => ({
      opacity: 0,
      x: d > 0 ? -40 : 40,
      scale: 0.98,
      filter: 'blur(3px)',
      transition: { duration: 0.35, ease },
    }),
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-50 overflow-hidden">
      {/* Block transition overlay */}
      <AnimatePresence>
        {blockTransition !== null && (
          <BlockTransition block={blockTransition} onDone={handleBlockTransitionDone} />
        )}
      </AnimatePresence>

      {/* Progress system */}
      {!isIntro && blockTransition === null && (
        <div className="flex-shrink-0 px-6 pt-[max(env(safe-area-inset-top),16px)]">
          <div className="flex items-center justify-between mb-3 mt-2">
            <motion.span
              key={currentBlock}
              className="text-[9px] tracking-[0.22em] uppercase font-semibold"
              style={{ color: `hsla(${blockInfo?.hue ?? 210}, 50%, 65%, 0.5)` }}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {blockInfo?.name ?? 'Calibración'}
            </motion.span>
            <span className="text-[10px] tabular-nums font-medium text-white/20">
              {isComplete ? TOTAL : currentIdx + 1}/{TOTAL}
            </span>
          </div>
          {/* Segmented progress */}
          <div className="flex gap-1">
            {BLOCKS.map((b, bIdx) => {
              const blockSteps = STEPS.filter(s => s.block === bIdx);
              const firstIdx = STEPS.indexOf(blockSteps[0]);
              const lastIdx = STEPS.indexOf(blockSteps[blockSteps.length - 1]);
              const blockProgress = currentIdx < firstIdx ? 0 : currentIdx > lastIdx ? 1 : (currentIdx - firstIdx + 1) / blockSteps.length;
              return (
                <div key={bIdx} className="flex-1 h-[2px] rounded-full overflow-hidden bg-white/[0.04] relative">
                  <motion.div
                    className="absolute top-0 left-0 h-full rounded-full"
                    style={{
                      background: `hsla(${b.hue}, 50%, 65%, ${blockProgress > 0 ? 0.6 : 0})`,
                    }}
                    animate={{ width: `${blockProgress * 100}%` }}
                    transition={{ duration: 0.5, ease }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Back */}
      {(currentIdx > -1 && !isComplete && blockTransition === null) && (
        <div className="flex-shrink-0 flex justify-start px-6 pt-4">
          <button
            onClick={() => currentIdx === 0 ? (setDirection(-1), setCurrentIdx(-1)) : go(-1)}
            className="text-[10px] tracking-[0.16em] uppercase font-medium text-white/15 hover:text-white/35 active:text-white/50 transition-colors"
          >
            ← Atrás
          </button>
        </div>
      )}

      {isIntro && (
        <div className="flex-shrink-0 flex justify-start px-6 pt-[max(env(safe-area-inset-top),20px)] mt-2">
          <button
            onClick={onBack}
            className="text-[10px] tracking-[0.16em] uppercase font-medium text-white/15 hover:text-white/35 transition-colors"
          >
            ← Atrás
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 relative">
        <AnimatePresence mode="wait" custom={direction}>
          {/* ════ INTRO ════ */}
          {isIntro && blockTransition === null && (
            <motion.div
              key="vb2-intro"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full max-w-[360px] flex flex-col items-center text-center"
            >
              <AmbientDots hue={260} />

              <motion.div
                className="relative mb-10"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, ease }}
              >
                <div className="absolute inset-[-10px] rounded-2xl blur-[14px]"
                  style={{ background: 'radial-gradient(circle, hsla(260,50%,60%,0.06) 0%, transparent 70%)' }}
                />
                <div className="relative bg-white/[0.08] border border-white/[0.08] rounded-2xl px-6 py-2.5 backdrop-blur-sm">
                  <span className="text-lg font-bold tracking-[0.2em] text-white/90">NEO</span>
                  <span className="ml-2 text-[11px] font-semibold tracking-[0.06em] text-cyan-400/50">VB2</span>
                </div>
              </motion.div>

              <motion.h1
                className="text-[26px] font-bold tracking-[-0.02em] text-white/90 mb-3 leading-tight"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5, ease }}
              >
                Calibración profunda
              </motion.h1>
              <motion.p
                className="text-[13px] text-white/30 font-light leading-relaxed mb-4 max-w-[280px]"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.5, ease }}
              >
                {TOTAL} variables en {BLOCKS.length} fases para máxima precisión.
              </motion.p>

              {/* Block preview chips */}
              <motion.div
                className="flex flex-wrap justify-center gap-2 mb-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                {BLOCKS.map((b, i) => (
                  <motion.span
                    key={i}
                    className="px-3 py-1 rounded-full text-[10px] tracking-[0.1em] uppercase font-medium"
                    style={{
                      color: `hsla(${b.hue}, 50%, 65%, 0.5)`,
                      border: `1px solid hsla(${b.hue}, 50%, 60%, 0.1)`,
                      background: `hsla(${b.hue}, 50%, 60%, 0.04)`,
                    }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.55 + i * 0.06, duration: 0.3, ease }}
                  >
                    {b.name}
                  </motion.span>
                ))}
              </motion.div>

              <motion.button
                onClick={() => go(1)}
                className="relative w-full max-w-[260px] h-[48px] rounded-xl text-[14px] font-semibold tracking-[0.01em] text-black overflow-hidden active:scale-[0.97] transition-transform"
                style={{ background: '#F5F5F7' }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.5, ease }}
                whileTap={{ scale: 0.97 }}
              >
                Iniciar calibración
              </motion.button>
            </motion.div>
          )}

          {/* ════ QUESTION SCREENS ════ */}
          {step && blockTransition === null && (
            <motion.div
              key={`vb2-step-${currentIdx}`}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full max-w-[360px] relative"
            >
              <AmbientDots hue={step.accentHue ?? 210} />

              {/* Icon */}
              <motion.div
                className="flex items-center gap-2.5 mb-5"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1, ease }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    background: `hsla(${step.accentHue}, 50%, 60%, 0.08)`,
                    border: `1px solid hsla(${step.accentHue}, 50%, 60%, 0.1)`,
                    color: `hsla(${step.accentHue}, 50%, 70%, 0.6)`,
                  }}
                >
                  {step.icon}
                </div>
              </motion.div>

              {/* Question */}
              <motion.h2
                className="text-[21px] font-semibold text-white/90 tracking-[-0.02em] leading-[1.2] mb-2"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15, ease }}
              >
                {step.question}
              </motion.h2>

              {/* Hint */}
              {step.hint && (
                <motion.p
                  className="text-[12px] text-white/20 font-light mb-7"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.25, ease }}
                >
                  {step.hint}
                </motion.p>
              )}

              {/* ── Single options ── */}
              {step.type === 'single' && step.options && (
                <div className="space-y-2.5">
                  {step.options.map((option, i) => {
                    const selected = answers[currentIdx] === option;
                    return (
                      <motion.button
                        key={option}
                        onClick={() => selectOption(option)}
                        className="w-full text-left px-5 py-[14px] rounded-xl border transition-all duration-200 relative overflow-hidden"
                        style={{
                          backgroundColor: selected
                            ? `hsla(${step.accentHue}, 50%, 65%, 0.12)`
                            : 'rgba(255,255,255,0.02)',
                          borderColor: selected
                            ? `hsla(${step.accentHue}, 50%, 65%, 0.25)`
                            : 'rgba(255,255,255,0.05)',
                        }}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: 0.2 + i * 0.06, ease }}
                        whileTap={{ scale: 0.985 }}
                      >
                        <div className="flex items-center gap-3.5">
                          <div
                            className="w-[18px] h-[18px] rounded-full border-[1.5px] flex items-center justify-center flex-shrink-0 transition-all duration-200"
                            style={{
                              borderColor: selected
                                ? `hsla(${step.accentHue}, 50%, 65%, 0.6)`
                                : 'rgba(255,255,255,0.1)',
                            }}
                          >
                            {selected && (
                              <motion.div
                                className="w-[8px] h-[8px] rounded-full"
                                style={{ background: `hsla(${step.accentHue}, 50%, 70%, 0.8)` }}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.2, ease }}
                              />
                            )}
                          </div>
                          <span
                            className="text-[14px] font-medium transition-colors duration-200"
                            style={{ color: selected ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.45)' }}
                          >
                            {option}
                          </span>
                        </div>

                        {selected && (
                          <motion.div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                              background: `radial-gradient(ellipse at 20% 50%, hsla(${step.accentHue}, 50%, 60%, 0.06) 0%, transparent 70%)`,
                            }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {/* ── Segmented ── */}
              {step.type === 'segmented' && step.options && (
                <motion.div
                  className="flex gap-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2, ease }}
                >
                  {step.options.map((option, i) => {
                    const selected = answers[currentIdx] === option;
                    return (
                      <motion.button
                        key={option}
                        onClick={() => selectOption(option)}
                        className="flex-1 py-4 rounded-xl border text-center transition-all duration-200 relative overflow-hidden"
                        style={{
                          backgroundColor: selected
                            ? `hsla(${step.accentHue}, 50%, 65%, 0.12)`
                            : 'rgba(255,255,255,0.02)',
                          borderColor: selected
                            ? `hsla(${step.accentHue}, 50%, 65%, 0.25)`
                            : 'rgba(255,255,255,0.05)',
                        }}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.25 + i * 0.05, ease }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span
                          className="text-[14px] font-semibold transition-colors duration-200"
                          style={{ color: selected ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.35)' }}
                        >
                          {option}
                        </span>
                        {selected && (
                          <motion.div
                            className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full"
                            style={{ background: `hsla(${step.accentHue}, 50%, 65%, 0.5)` }}
                            layoutId="vb2-seg-indicator"
                            transition={{ duration: 0.3, ease }}
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </motion.div>
              )}

              {/* ── Numeric ── */}
              {step.type === 'numeric' && (
                <motion.div
                  className="space-y-5"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2, ease }}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder={step.placeholder}
                        value={answers[currentIdx] || ''}
                        onChange={e => setNumeric(e.target.value)}
                        className="w-full h-[56px] rounded-xl border bg-transparent px-5 text-[24px] font-semibold text-white/90 placeholder-white/10 outline-none transition-all duration-200"
                        style={{
                          borderColor: answers[currentIdx]
                            ? `hsla(${step.accentHue}, 50%, 65%, 0.2)`
                            : 'rgba(255,255,255,0.05)',
                          WebkitAppearance: 'none',
                          MozAppearance: 'textfield',
                        } as React.CSSProperties}
                      />
                    </div>
                    {step.unit && (
                      <span className="text-[15px] font-medium text-white/25">{step.unit}</span>
                    )}
                  </div>
                  <motion.button
                    onClick={() => { if (answers[currentIdx]) go(1); }}
                    className="w-full h-[48px] rounded-xl text-[14px] font-semibold tracking-[0.01em] transition-all duration-300 active:scale-[0.97]"
                    style={{
                      background: answers[currentIdx]
                        ? `linear-gradient(135deg, hsla(${step.accentHue}, 40%, 55%, 0.2), hsla(${step.accentHue}, 40%, 55%, 0.1))`
                        : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${answers[currentIdx]
                        ? `hsla(${step.accentHue}, 50%, 60%, 0.2)`
                        : 'rgba(255,255,255,0.04)'}`,
                      color: answers[currentIdx] ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.15)',
                    }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Siguiente
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ════ COMPLETION ════ */}
          {isComplete && blockTransition === null && (
            <CompletionScreen
              direction={direction}
              slideVariants={slideVariants}
              answers={answers}
              saveProfile={saveProfile}
              onComplete={onComplete}
              activating={activating}
              setActivating={setActivating}
              activated={activated}
              setActivated={setActivated}
              activationError={activationError}
              setActivationError={setActivationError}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

/* ── Completion sub-component ── */

interface CompletionScreenProps {
  direction: number;
  slideVariants: any;
  answers: Record<number, string>;
  saveProfile: (model: 'vb1' | 'vb2', answers: Record<number, string>) => void;
  onComplete: () => void;
  activating: boolean;
  setActivating: (v: boolean) => void;
  activated: boolean;
  setActivated: (v: boolean) => void;
  activationError: string | null;
  setActivationError: (v: string | null) => void;
}

const CompletionScreen = ({
  direction, slideVariants, answers, saveProfile, onComplete,
  activating, setActivating, activated, setActivated,
  activationError, setActivationError,
}: CompletionScreenProps) => {
  const didRun = useRef(false);

  const doActivation = async () => {
    setActivating(true);
    setActivationError(null);
    try {
      const profileData = mapVB2AnswersToProfile(answers);
      const metricsData = mapVB2AnswersToMetrics(answers);
      const result = await activateVB2(profileData);
      if (result.success) {
        saveProfile('vb2', answers);
        await saveInitialMetrics(metricsData);
        setActivated(true);
      } else {
        setActivationError(result.error || 'Error al activar VB2');
      }
    } catch (err: any) {
      setActivationError(err?.message || 'Error inesperado');
    } finally {
      setActivating(false);
    }
  };

  useEffect(() => {
    if (didRun.current || activated || activating) return;
    didRun.current = true;
    doActivation();
  }, []);

  return (
    <motion.div
      key="vb2-completion"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      className="w-full max-w-[360px] flex flex-col items-center text-center"
    >
      <AmbientDots hue={260} />

      {activating && (
        <>
          <motion.div
            className="w-14 h-14 rounded-full border border-white/[0.08] bg-white/[0.04] flex items-center justify-center mb-6"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <motion.div
              className="w-5 h-5 border-2 rounded-full"
              style={{ borderColor: 'hsla(260,50%,70%,0.5)', borderTopColor: 'transparent' }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          </motion.div>
          <motion.h1
            className="text-[22px] font-semibold text-white/85 tracking-[-0.01em] mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Activando VB2…
          </motion.h1>
          <p className="text-[12px] text-white/20 font-light">Configurando tu perfil avanzado</p>
        </>
      )}

      {activated && (
        <>
          <motion.div
            className="relative mb-8"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease }}
          >
            <motion.div
              className="absolute inset-[-12px] rounded-full"
              style={{ background: 'radial-gradient(circle, hsla(260,50%,60%,0.08) 0%, transparent 70%)' }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="w-14 h-14 rounded-full border border-white/[0.08] bg-white/[0.04] flex items-center justify-center">
              <motion.svg
                width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="hsla(260,50%,70%,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              >
                <motion.path
                  d="M5 13l4 4L19 7"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.6, delay: 0.3, ease }}
                />
              </motion.svg>
            </div>
          </motion.div>

          <motion.h1
            className="text-[24px] font-bold text-white/90 tracking-[-0.02em] mb-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5, ease }}
          >
            VB2 activado
          </motion.h1>
          <motion.p
            className="text-[13px] text-white/25 font-light mb-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.5 }}
          >
            Seguimiento 1:1 asignado automáticamente.
          </motion.p>
          <motion.div
            className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-3 mb-10 w-full max-w-[280px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <p className="text-[11px] text-white/20 font-light">
              Tu perfil VB2 está activo con asesoría de Pablo.
            </p>
          </motion.div>

          <motion.button
            onClick={onComplete}
            className="w-full max-w-[260px] h-[48px] rounded-xl text-[14px] font-semibold tracking-[0.01em] text-black active:scale-[0.97] transition-transform"
            style={{ background: '#F5F5F7' }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5, ease }}
            whileTap={{ scale: 0.97 }}
          >
            Continuar
          </motion.button>
        </>
      )}

      {!activating && !activated && activationError && (
        <>
          <h1 className="text-[22px] font-semibold text-white/85 tracking-[-0.01em] mb-4">
            Error al activar
          </h1>
          <p className="text-[12px] font-medium text-red-400/70 mb-6">{activationError}</p>
          <motion.button
            onClick={doActivation}
            className="w-full max-w-[260px] h-[48px] rounded-xl text-[14px] font-semibold text-black active:scale-[0.97] transition-transform"
            style={{ background: '#F5F5F7' }}
            whileTap={{ scale: 0.97 }}
          >
            Reintentar
          </motion.button>
        </>
      )}
    </motion.div>
  );
};
