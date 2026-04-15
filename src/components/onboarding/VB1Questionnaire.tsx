import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNeoProfile } from '@/contexts/NeoProfileContext';
import { saveProfileToSupabase } from '@/lib/activateVB2';
import { saveInitialMetrics } from '@/lib/saveInitialMetrics';
import { mapVB1AnswersToProfile, mapVB1AnswersToMetrics } from '@/lib/questionnaireMapper';
import {
  Target, Clock, Dumbbell, CalendarDays, Moon, Brain, HeartPulse, Scale,
} from 'lucide-react';

/* ─── Types ─── */

interface VB1QuestionnaireProps {
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
  accentHue?: number; // for subtle color variation
}

const ease: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

const STEPS: QuestionStep[] = [
  {
    question: '¿Qué quieres conseguir ahora mismo?',
    type: 'single',
    options: ['Ganar masa muscular', 'Perder grasa', 'Mejorar mi forma física', 'Organizar mejor mi entrenamiento'],
    hint: 'Define la dirección inicial del sistema.',
    icon: <Target className="w-5 h-5" />,
    accentHue: 210,
  },
  {
    question: '¿Cuánto tiempo llevas entrenando?',
    type: 'single',
    options: ['Estoy empezando', 'Menos de 1 año', '1 a 3 años', 'Más de 3 años'],
    hint: 'Calibra la base de experiencia.',
    icon: <Clock className="w-5 h-5" />,
    accentHue: 220,
  },
  {
    question: '¿Qué haces actualmente?',
    type: 'single',
    options: ['Gimnasio', 'Running', 'Natación', 'Varias de las anteriores'],
    hint: 'Activa los módulos adecuados.',
    icon: <Dumbbell className="w-5 h-5" />,
    accentHue: 200,
  },
  {
    question: '¿Cuántos días entrenas por semana?',
    type: 'segmented',
    options: ['1–2', '3–4', '5–6', '7'],
    hint: 'Ajusta la frecuencia y la distribución del volumen.',
    icon: <CalendarDays className="w-5 h-5" />,
    accentHue: 190,
  },
  {
    question: '¿Cuántas horas duermes normalmente?',
    type: 'segmented',
    options: ['Menos de 6', '6–7', '7–8', 'Más de 8'],
    hint: 'Factor clave en tu capacidad de recuperación.',
    icon: <Moon className="w-5 h-5" />,
    accentHue: 250,
  },
  {
    question: '¿Cómo es tu nivel de estrés?',
    type: 'single',
    options: ['Bajo', 'Medio', 'Alto'],
    hint: 'Modula la carga inicial recomendada.',
    icon: <Brain className="w-5 h-5" />,
    accentHue: 280,
  },
  {
    question: '¿Tienes alguna molestia o lesión actual?',
    type: 'single',
    options: ['No', 'Sí, leve', 'Sí, importante'],
    hint: 'Protege zonas sensibles desde el inicio.',
    icon: <HeartPulse className="w-5 h-5" />,
    accentHue: 0,
  },
  {
    question: '¿Cuál es tu peso corporal actual?',
    type: 'numeric',
    unit: 'kg',
    placeholder: '70',
    hint: 'Referencia para métricas relativas.',
    icon: <Scale className="w-5 h-5" />,
    accentHue: 170,
  },
];

const TOTAL = STEPS.length;

/* ─── Ambient Particles ─── */

const AmbientDots = ({ hue }: { hue: number }) => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
    {Array.from({ length: 12 }).map((_, i) => (
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

/* ─── Component ─── */

export const VB1Questionnaire = ({ onComplete, onBack }: VB1QuestionnaireProps) => {
  const { saveProfile } = useNeoProfile();
  const [currentIdx, setCurrentIdx] = useState(-1); // -1=intro
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [direction, setDirection] = useState(1);
  const [completing, setCompleting] = useState(false);

  const isIntro = currentIdx === -1;
  const isComplete = currentIdx === TOTAL;
  const step = !isIntro && !isComplete ? STEPS[currentIdx] : null;
  const progress = isIntro ? 0 : isComplete ? 1 : (currentIdx + 1) / TOTAL;

  const go = useCallback((delta: number) => {
    setDirection(delta);
    setCurrentIdx(s => s + delta);
  }, []);

  const selectOption = useCallback((value: string) => {
    setAnswers(prev => ({ ...prev, [currentIdx]: value }));
    setTimeout(() => go(1), 320);
  }, [currentIdx, go]);

  const setNumeric = useCallback((value: string) => {
    setAnswers(prev => ({ ...prev, [currentIdx]: value }));
  }, [currentIdx]);

  const handleComplete = async () => {
    setCompleting(true);
    try {
      saveProfile('vb1', answers);
      const profileData = mapVB1AnswersToProfile(answers);
      const metricsData = mapVB1AnswersToMetrics(answers);
      await saveProfileToSupabase('VB1', profileData);
      await saveInitialMetrics(metricsData);
      onComplete();
    } catch {
      setCompleting(false);
    }
  };

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
      {/* Progress system */}
      {!isIntro && (
        <div className="flex-shrink-0 px-6 pt-[max(env(safe-area-inset-top),16px)]">
          {/* Phase indicator */}
          <div className="flex items-center justify-between mb-3 mt-2">
            <motion.span
              className="text-[9px] tracking-[0.22em] uppercase font-semibold"
              style={{ color: `hsla(${step?.accentHue ?? 210}, 50%, 65%, 0.5)` }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              Calibración
            </motion.span>
            <span className="text-[10px] tabular-nums font-medium text-white/20">
              {isComplete ? TOTAL : currentIdx + 1}/{TOTAL}
            </span>
          </div>
          {/* Progress bar with glow */}
          <div className="relative w-full h-[2px] rounded-full overflow-visible">
            <div className="absolute inset-0 bg-white/[0.04] rounded-full" />
            <motion.div
              className="absolute top-0 left-0 h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, hsla(${step?.accentHue ?? 210}, 50%, 60%, 0.3), hsla(${step?.accentHue ?? 210}, 50%, 70%, 0.7))`,
              }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.6, ease }}
            />
            {/* Leading dot */}
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 w-[6px] h-[6px] rounded-full"
              style={{
                background: `hsla(${step?.accentHue ?? 210}, 60%, 75%, 0.8)`,
                boxShadow: `0 0 8px hsla(${step?.accentHue ?? 210}, 60%, 65%, 0.4)`,
              }}
              animate={{ left: `calc(${progress * 100}% - 3px)` }}
              transition={{ duration: 0.6, ease }}
            />
          </div>
        </div>
      )}

      {/* Back */}
      {(currentIdx > -1 && !isComplete) && (
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
          {isIntro && (
            <motion.div
              key="intro"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full max-w-[360px] flex flex-col items-center text-center"
            >
              <AmbientDots hue={210} />

              {/* NEO badge */}
              <motion.div
                className="relative mb-10"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, ease }}
              >
                <div className="absolute inset-[-8px] rounded-2xl bg-white/[0.03] blur-[12px]" />
                <div className="relative bg-white/[0.08] border border-white/[0.08] rounded-2xl px-6 py-2.5 backdrop-blur-sm">
                  <span className="text-lg font-bold tracking-[0.2em] text-white/90">NEO</span>
                  <span className="ml-2 text-[11px] font-semibold tracking-[0.06em] text-white/35">VB1</span>
                </div>
              </motion.div>

              <motion.h1
                className="text-[26px] font-bold tracking-[-0.02em] text-white/90 mb-3 leading-tight"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5, ease }}
              >
                Configuración rápida
              </motion.h1>
              <motion.p
                className="text-[13px] text-white/30 font-light leading-relaxed mb-10 max-w-[280px]"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.5, ease }}
              >
                8 preguntas para que NEO calibre tu punto de partida.
              </motion.p>

              <motion.button
                onClick={() => go(1)}
                className="relative w-full max-w-[260px] h-[48px] rounded-xl text-[14px] font-semibold tracking-[0.01em] text-black overflow-hidden active:scale-[0.97] transition-transform"
                style={{ background: '#F5F5F7' }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5, ease }}
                whileTap={{ scale: 0.97 }}
              >
                Iniciar calibración
              </motion.button>
            </motion.div>
          )}

          {/* ════ QUESTION SCREENS ════ */}
          {step && (
            <motion.div
              key={`step-${currentIdx}`}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full max-w-[360px] relative"
            >
              <AmbientDots hue={step.accentHue ?? 210} />

              {/* Icon + category label */}
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
                className="text-[22px] font-semibold text-white/90 tracking-[-0.02em] leading-[1.2] mb-2"
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

              {/* ── Single options (cards) ── */}
              {step.type === 'single' && step.options && (
                <div className="space-y-2.5">
                  {step.options.map((option, i) => {
                    const selected = answers[currentIdx] === option;
                    return (
                      <motion.button
                        key={option}
                        onClick={() => selectOption(option)}
                        className="w-full text-left px-5 py-[14px] rounded-xl border transition-all duration-200 relative overflow-hidden group"
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
                        {/* Selection indicator */}
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

                        {/* Hover/active glow */}
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

              {/* ── Segmented options ── */}
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
                            layoutId="segmented-indicator"
                            transition={{ duration: 0.3, ease }}
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </motion.div>
              )}

              {/* ── Numeric input ── */}
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
                      {/* Focus glow */}
                      <div
                        className="absolute inset-0 rounded-xl pointer-events-none transition-opacity duration-300"
                        style={{
                          opacity: answers[currentIdx] ? 1 : 0,
                          boxShadow: `inset 0 0 20px hsla(${step.accentHue}, 50%, 60%, 0.04)`,
                        }}
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
          {isComplete && (
            <motion.div
              key="completion"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full max-w-[360px] flex flex-col items-center text-center"
            >
              <AmbientDots hue={140} />

              {/* Success pulse */}
              <motion.div
                className="relative mb-8"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease }}
              >
                <motion.div
                  className="absolute inset-[-12px] rounded-full"
                  style={{ background: 'radial-gradient(circle, hsla(140,50%,60%,0.08) 0%, transparent 70%)' }}
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                />
                <div className="w-14 h-14 rounded-full border border-white/[0.08] bg-white/[0.04] flex items-center justify-center">
                  <motion.svg
                    width="24" height="24" viewBox="0 0 24 24" fill="none"
                    stroke="hsla(140,50%,70%,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
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
                VB1 calibrado
              </motion.h1>
              <motion.p
                className="text-[13px] text-white/25 font-light mb-10 max-w-[260px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35, duration: 0.5 }}
              >
                NEO tiene tu perfil base. La experiencia se adapta a partir de aquí.
              </motion.p>

              <motion.button
                onClick={handleComplete}
                disabled={completing}
                className="w-full max-w-[260px] h-[48px] rounded-xl text-[14px] font-semibold tracking-[0.01em] text-black active:scale-[0.97] transition-transform disabled:opacity-50"
                style={{ background: '#F5F5F7' }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5, ease }}
                whileTap={{ scale: 0.97 }}
              >
                {completing ? 'Guardando…' : 'Continuar'}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
