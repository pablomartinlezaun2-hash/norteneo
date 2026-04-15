import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useNeoProfile } from '@/contexts/NeoProfileContext';
import { saveProfileToSupabase } from '@/lib/activateVB2';
import { saveInitialMetrics } from '@/lib/saveInitialMetrics';
import { mapVB1AnswersToProfile, mapVB1AnswersToMetrics } from '@/lib/questionnaireMapper';

import { CalibrationAvatar } from './CalibrationAvatar';

/* ─── Types ─── */

interface VB1QuestionnaireProps {
  onComplete: () => void;
  onBack: () => void;
}

type InputType = 'modules' | 'scale' | 'pills' | 'dial' | 'single';

interface QuestionStep {
  question: string;
  type: InputType;
  options?: string[];
  unit?: string;
  placeholder?: string;
  hint?: string;
  accentHue: number;
  systemLabel: string;
}

const ease: [number, number, number, number] = [0.22, 0.68, 0.35, 1.0];
const springPop = { type: 'spring' as const, stiffness: 400, damping: 25 };

const STEPS: QuestionStep[] = [
  {
    question: '¿Qué quieres conseguir?',
    type: 'modules',
    options: ['Ganar masa muscular', 'Perder grasa', 'Mejorar forma física', 'Organizar entrenamiento'],
    hint: 'Define la dirección del sistema.',
    accentHue: 210,
    systemLabel: 'OBJETIVO',
  },
  {
    question: '¿Cuánto tiempo llevas entrenando?',
    type: 'scale',
    options: ['Empezando', '< 1 año', '1–3 años', '3+ años'],
    hint: 'Calibra la base de experiencia.',
    accentHue: 220,
    systemLabel: 'EXPERIENCIA',
  },
  {
    question: '¿Qué disciplinas practicas?',
    type: 'modules',
    options: ['Gimnasio', 'Running', 'Natación', 'Varias'],
    hint: 'Activa los módulos del sistema.',
    accentHue: 200,
    systemLabel: 'MÓDULOS',
  },
  {
    question: '¿Cuántos días entrenas por semana?',
    type: 'pills',
    options: ['1–2', '3–4', '5–6', '7'],
    hint: 'Ajusta frecuencia y distribución.',
    accentHue: 190,
    systemLabel: 'FRECUENCIA',
  },
  {
    question: '¿Cuántas horas duermes?',
    type: 'pills',
    options: ['< 6h', '6–7h', '7–8h', '8+h'],
    hint: 'Factor clave en recuperación.',
    accentHue: 250,
    systemLabel: 'SUEÑO',
  },
  {
    question: '¿Tu nivel de estrés diario?',
    type: 'scale',
    options: ['Bajo', 'Medio', 'Alto'],
    hint: 'Modula la carga inicial.',
    accentHue: 280,
    systemLabel: 'ESTRÉS',
  },
  {
    question: '¿Alguna molestia o lesión actual?',
    type: 'single',
    options: ['No', 'Sí, leve', 'Sí, importante'],
    hint: 'Protege zonas sensibles.',
    accentHue: 0,
    systemLabel: 'INTEGRIDAD',
  },
  {
    question: '¿Tu peso corporal actual?',
    type: 'dial',
    unit: 'kg',
    placeholder: '70',
    hint: 'Referencia para métricas relativas.',
    accentHue: 170,
    systemLabel: 'PESO',
  },
];

const TOTAL = STEPS.length;

const MODULE_ICONS: Record<string, string> = {
  'Ganar masa muscular': '◆',
  'Perder grasa': '▽',
  'Mejorar forma física': '◇',
  'Organizar entrenamiento': '⬡',
  'Gimnasio': '▣',
  'Running': '△',
  'Natación': '◎',
  'Varias': '⊞',
};

/* ─── Scan Line ─── */
const ScanLine = ({ hue }: { hue: number }) => (
  <motion.div
    className="absolute left-0 right-0 h-[1px] pointer-events-none z-0"
    style={{
      background: `linear-gradient(90deg, transparent, hsla(${hue},60%,65%,0.15), transparent)`,
    }}
    initial={{ top: '30%', opacity: 0 }}
    animate={{ top: ['30%', '70%', '30%'], opacity: [0, 0.5, 0] }}
    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
  />
);

/* ─── Calibration Confirm Overlay ─── */
const CalibrationPulse = ({ hue, onDone }: { hue: number; onDone: () => void }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 600);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="rounded-full"
        style={{
          width: 80,
          height: 80,
          background: `radial-gradient(circle, hsla(${hue},60%,60%,0.12) 0%, transparent 70%)`,
        }}
        initial={{ scale: 0.3, opacity: 0 }}
        animate={{ scale: 2.5, opacity: [0, 0.8, 0] }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
      <motion.div
        className="absolute text-[9px] tracking-[0.3em] uppercase font-bold"
        style={{ color: `hsla(${hue},50%,70%,0.6)` }}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 0.6, ease }}
      >
        CAPTURADO
      </motion.div>
    </motion.div>
  );
};

/* ─── Module Selection (visual blocks) ─── */
const ModuleInput = ({
  options, selected, onSelect, hue,
}: { options: string[]; selected: string | undefined; onSelect: (v: string) => void; hue: number }) => (
  <div className="grid grid-cols-2 gap-3">
    {options.map((opt, i) => {
      const isActive = selected === opt;
      const icon = MODULE_ICONS[opt] || '◈';
      return (
        <motion.button
          key={opt}
          onClick={() => onSelect(opt)}
          className="relative rounded-2xl border overflow-hidden text-left p-4 transition-all duration-300"
          style={{
            borderColor: isActive ? `hsla(${hue},50%,65%,0.35)` : 'rgba(255,255,255,0.04)',
            background: isActive
              ? `linear-gradient(135deg, hsla(${hue},50%,60%,0.12), hsla(${hue},50%,60%,0.04))`
              : 'rgba(255,255,255,0.015)',
          }}
          initial={{ opacity: 0, y: 16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.15 + i * 0.07, ease }}
          whileTap={{ scale: 0.96 }}
        >
          {/* Module icon */}
          <motion.div
            className="text-[22px] mb-3 leading-none"
            style={{
              color: isActive ? `hsla(${hue},50%,75%,0.8)` : 'rgba(255,255,255,0.12)',
              filter: isActive ? `drop-shadow(0 0 6px hsla(${hue},50%,60%,0.3))` : 'none',
            }}
            animate={isActive ? { scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 0.4 }}
          >
            {icon}
          </motion.div>
          <span
            className="text-[13px] font-medium leading-tight block"
            style={{ color: isActive ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.35)' }}
          >
            {opt}
          </span>
          {/* Active indicator line */}
          {isActive && (
            <motion.div
              className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full"
              style={{ background: `hsla(${hue},50%,65%,0.5)` }}
              layoutId="vb1-module-indicator"
              transition={springPop}
            />
          )}
          {/* Glow */}
          {isActive && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(ellipse at 30% 30%, hsla(${hue},50%,60%,0.08) 0%, transparent 60%)`,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            />
          )}
        </motion.button>
      );
    })}
  </div>
);

/* ─── Scale Selection (visual progression) ─── */
const ScaleInput = ({
  options, selected, onSelect, hue,
}: { options: string[]; selected: string | undefined; onSelect: (v: string) => void; hue: number }) => {
  const selectedIdx = options.indexOf(selected || '');
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2, ease }}
    >
      {/* Visual scale bar */}
      <div className="relative mb-6">
        <div className="h-[3px] rounded-full bg-white/[0.04] relative overflow-hidden">
          <motion.div
            className="absolute left-0 top-0 h-full rounded-full"
            style={{ background: `hsla(${hue},50%,65%,0.5)` }}
            animate={{ width: selectedIdx >= 0 ? `${((selectedIdx + 1) / options.length) * 100}%` : '0%' }}
            transition={{ duration: 0.5, ease }}
          />
        </div>
        {/* Node dots */}
        <div className="flex justify-between absolute inset-x-0 -top-[5px]">
          {options.map((_, i) => (
            <motion.div
              key={i}
              className="w-[13px] h-[13px] rounded-full border-2 flex items-center justify-center"
              style={{
                borderColor: i <= selectedIdx
                  ? `hsla(${hue},50%,65%,0.6)`
                  : 'rgba(255,255,255,0.08)',
                background: i <= selectedIdx
                  ? `hsla(${hue},50%,60%,0.15)`
                  : 'rgba(0,0,0,0.8)',
              }}
              animate={i === selectedIdx ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 0.4 }}
            >
              {i <= selectedIdx && (
                <motion.div
                  className="w-[5px] h-[5px] rounded-full"
                  style={{ background: `hsla(${hue},50%,70%,0.8)` }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={springPop}
                />
              )}
            </motion.div>
          ))}
        </div>
      </div>
      {/* Option labels */}
      <div className="flex justify-between gap-1">
        {options.map((opt, i) => {
          const isActive = selected === opt;
          return (
            <motion.button
              key={opt}
              onClick={() => onSelect(opt)}
              className="flex-1 py-3 rounded-xl text-center transition-all relative"
              whileTap={{ scale: 0.95 }}
            >
              <span
                className="text-[12px] font-semibold transition-colors duration-200"
                style={{
                  color: isActive ? `hsla(${hue},50%,80%,0.9)` : 'rgba(255,255,255,0.3)',
                }}
              >
                {opt}
              </span>
              {isActive && (
                <motion.div
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{ background: `hsla(${hue},50%,70%,0.6)` }}
                  layoutId="vb1-scale-dot"
                  transition={springPop}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

/* ─── Pill Selection ─── */
const PillInput = ({
  options, selected, onSelect, hue,
}: { options: string[]; selected: string | undefined; onSelect: (v: string) => void; hue: number }) => (
  <motion.div
    className="flex gap-2.5 justify-center"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: 0.2, ease }}
  >
    {options.map((opt, i) => {
      const isActive = selected === opt;
      return (
        <motion.button
          key={opt}
          onClick={() => onSelect(opt)}
          className="relative rounded-2xl border overflow-hidden transition-all duration-300"
          style={{
            width: 72,
            height: 72,
            borderColor: isActive ? `hsla(${hue},50%,65%,0.35)` : 'rgba(255,255,255,0.04)',
            background: isActive
              ? `radial-gradient(circle at 50% 40%, hsla(${hue},50%,60%,0.15), transparent)`
              : 'rgba(255,255,255,0.015)',
          }}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, delay: 0.2 + i * 0.06, ease }}
          whileTap={{ scale: 0.92 }}
        >
          <div className="flex flex-col items-center justify-center h-full gap-0.5">
            <span
              className="text-[16px] font-bold tabular-nums transition-colors duration-200"
              style={{ color: isActive ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.3)' }}
            >
              {opt.replace('h', '')}
            </span>
          </div>
          {isActive && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                boxShadow: `inset 0 0 20px hsla(${hue},50%,60%,0.1), 0 0 15px hsla(${hue},50%,60%,0.05)`,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
          )}
        </motion.button>
      );
    })}
  </motion.div>
);

/* ─── Dial Numeric Input ─── */
const DialInput = ({
  value, onChange, unit, placeholder, hue, onConfirm,
}: {
  value: string; onChange: (v: string) => void;
  unit?: string; placeholder?: string; hue: number; onConfirm: () => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const numVal = parseFloat(value) || 0;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <motion.div
      className="flex flex-col items-center"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease }}
    >
      {/* Dial visual */}
      <div className="relative w-48 h-48 mb-6">
        {/* Arc background */}
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <circle
            cx="100" cy="100" r="85"
            fill="none"
            stroke="rgba(255,255,255,0.03)"
            strokeWidth="3"
            strokeDasharray="4 6"
          />
          <motion.circle
            cx="100" cy="100" r="85"
            fill="none"
            stroke={`hsla(${hue},50%,65%,0.3)`}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${Math.min(numVal / 150, 1) * 534} 534`}
            transform="rotate(-90 100 100)"
            animate={{ strokeDasharray: `${Math.min(numVal / 150, 1) * 534} 534` }}
            transition={{ duration: 0.5, ease }}
          />
          {numVal > 0 && (
            <motion.circle
              cx="100" cy="100" r="85"
              fill="none"
              stroke={`hsla(${hue},60%,70%,0.15)`}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${Math.min(numVal / 150, 1) * 534} 534`}
              transform="rotate(-90 100 100)"
              style={{ filter: `blur(4px)` }}
              animate={{ strokeDasharray: `${Math.min(numVal / 150, 1) * 534} 534` }}
              transition={{ duration: 0.5, ease }}
            />
          )}
        </svg>
        {/* Center input */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <input
            ref={inputRef}
            type="text"
            inputMode="decimal"
            placeholder={placeholder}
            value={value}
            onChange={e => onChange(e.target.value.replace(/[^0-9.]/g, ''))}
            className="w-24 text-center bg-transparent border-none outline-none text-[36px] font-bold text-white/90 placeholder-white/10"
            style={{ caretColor: `hsla(${hue},50%,65%,0.6)` }}
          />
          {unit && (
            <span
              className="text-[12px] font-medium mt-0.5"
              style={{ color: `hsla(${hue},50%,65%,0.4)` }}
            >
              {unit}
            </span>
          )}
        </div>
      </div>

      <motion.button
        onClick={onConfirm}
        className="w-full max-w-[240px] h-[48px] rounded-xl text-[13px] font-semibold tracking-[0.04em] transition-all duration-300 active:scale-[0.97]"
        style={{
          background: value
            ? `linear-gradient(135deg, hsla(${hue},45%,50%,0.25), hsla(${hue},45%,50%,0.1))`
            : 'rgba(255,255,255,0.02)',
          border: `1px solid ${value
            ? `hsla(${hue},50%,60%,0.25)`
            : 'rgba(255,255,255,0.04)'}`,
          color: value ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.12)',
        }}
        whileTap={{ scale: 0.97 }}
      >
        CONFIRMAR
      </motion.button>
    </motion.div>
  );
};

/* ─── Single Cards (with visual weight) ─── */
const SingleInput = ({
  options, selected, onSelect, hue,
}: { options: string[]; selected: string | undefined; onSelect: (v: string) => void; hue: number }) => (
  <div className="space-y-2">
    {options.map((opt, i) => {
      const isActive = selected === opt;
      // Visual weight: first option strongest, descends
      const weight = 1 - (i / (options.length - 1)) * 0.3;
      return (
        <motion.button
          key={opt}
          onClick={() => onSelect(opt)}
          className="w-full text-left rounded-xl border overflow-hidden transition-all duration-300 relative group"
          style={{
            padding: '14px 18px',
            borderColor: isActive
              ? `hsla(${hue},50%,65%,0.3)`
              : `rgba(255,255,255,${0.03 + weight * 0.02})`,
            background: isActive
              ? `linear-gradient(135deg, hsla(${hue},50%,60%,0.12), hsla(${hue},50%,60%,0.03))`
              : `rgba(255,255,255,${0.01 + weight * 0.01})`,
          }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, delay: 0.15 + i * 0.08, ease }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center gap-3">
            {/* Status indicator */}
            <div className="relative flex-shrink-0">
              <motion.div
                className="w-[14px] h-[14px] rounded-full border-[1.5px]"
                style={{
                  borderColor: isActive
                    ? `hsla(${hue},50%,65%,0.7)`
                    : 'rgba(255,255,255,0.08)',
                }}
              />
              {isActive && (
                <motion.div
                  className="absolute inset-[3px] rounded-full"
                  style={{
                    background: `hsla(${hue},50%,70%,0.8)`,
                    boxShadow: `0 0 8px hsla(${hue},50%,60%,0.4)`,
                  }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={springPop}
                />
              )}
            </div>
            <span
              className="text-[14px] font-medium"
              style={{ color: isActive ? 'rgba(255,255,255,0.9)' : `rgba(255,255,255,${0.3 + weight * 0.15})` }}
            >
              {opt}
            </span>
          </div>
          {/* Active edge glow */}
          {isActive && (
            <motion.div
              className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full"
              style={{ background: `hsla(${hue},50%,65%,0.5)` }}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.3, ease }}
            />
          )}
        </motion.button>
      );
    })}
  </div>
);

/* ═══════════════════════════════════════════════════════ */
/* ─── Main Component ─── */
/* ═══════════════════════════════════════════════════════ */

export const VB1Questionnaire = ({ onComplete, onBack }: VB1QuestionnaireProps) => {
  const { saveProfile } = useNeoProfile();
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [direction, setDirection] = useState(1);
  const [completing, setCompleting] = useState(false);
  const [showPulse, setShowPulse] = useState(false);

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
    setShowPulse(true);
  }, [currentIdx]);

  const handlePulseDone = useCallback(() => {
    setShowPulse(false);
    go(1);
  }, [go]);

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
      x: d > 0 ? 50 : -50,
      scale: 0.94,
      filter: 'blur(6px)',
    }),
    center: {
      opacity: 1,
      x: 0,
      scale: 1,
      filter: 'blur(0px)',
      transition: { duration: 0.55, ease },
    },
    exit: (d: number) => ({
      opacity: 0,
      x: d > 0 ? -30 : 30,
      scale: 0.97,
      filter: 'blur(4px)',
      transition: { duration: 0.3, ease },
    }),
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-50 overflow-hidden">
      {/* 3D Calibration Avatar — visible during questions */}
      {!isIntro && !isComplete && (
        <div className="flex-shrink-0 relative" style={{ height: '38vh', minHeight: 220, maxHeight: 320 }}>
          <CalibrationAvatar buildStage={currentIdx} />
          {/* Stage label overlay */}
          <motion.div
            className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10"
            key={currentIdx}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <span
              className="text-[7px] tracking-[0.35em] uppercase font-bold px-3 py-1 rounded-full"
              style={{
                color: `hsla(${step?.accentHue ?? 210},50%,70%,0.4)`,
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              CALIBRANDO · {step?.systemLabel}
            </span>
          </motion.div>
        </div>
      )}

      {/* Calibration pulse overlay */}
      <AnimatePresence>
        {showPulse && step && (
          <CalibrationPulse hue={step.accentHue} onDone={handlePulseDone} />
        )}
      </AnimatePresence>

      {/* ─── Progress System ─── */}
      {!isIntro && !isComplete && (
        <div className="flex-shrink-0 px-6 pt-2">
          <div className="flex items-center justify-between mb-2">
            <motion.span
              key={step?.systemLabel}
              className="text-[8px] tracking-[0.3em] uppercase font-bold"
              style={{ color: `hsla(${step?.accentHue ?? 210},50%,70%,0.4)` }}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
            >
              {step?.systemLabel}
            </motion.span>
            <span className="text-[9px] tabular-nums font-mono text-white/15">
              {currentIdx + 1}/{TOTAL}
            </span>
          </div>
          {/* Pipeline progress */}
          <div className="flex gap-[3px]">
            {STEPS.map((s, i) => (
              <motion.div
                key={i}
                className="flex-1 h-[2px] rounded-full overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.03)' }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: i < currentIdx
                      ? `hsla(${s.accentHue},50%,65%,0.5)`
                      : i === currentIdx
                        ? `hsla(${s.accentHue},50%,65%,0.7)`
                        : 'transparent',
                  }}
                  animate={{
                    width: i < currentIdx ? '100%' : i === currentIdx ? '100%' : '0%',
                  }}
                  transition={{ duration: 0.5, ease }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Back ─── */}
      {(currentIdx > -1 && !isComplete) && (
        <div className="flex-shrink-0 flex justify-start px-6 pt-4">
          <button
            onClick={() => currentIdx === 0 ? (setDirection(-1), setCurrentIdx(-1)) : go(-1)}
            className="text-[9px] tracking-[0.2em] uppercase font-medium text-white/12 hover:text-white/30 active:text-white/50 transition-colors"
          >
            ← ATRÁS
          </button>
        </div>
      )}
      {isIntro && (
        <div className="flex-shrink-0 flex justify-start px-6 pt-[max(env(safe-area-inset-top),20px)] mt-2">
          <button onClick={onBack} className="text-[9px] tracking-[0.2em] uppercase font-medium text-white/12 hover:text-white/30 transition-colors">
            ← ATRÁS
          </button>
        </div>
      )}

      {/* ─── Content ─── */}
      <div className="flex-1 flex items-center justify-center px-6 relative">
        <ScanLine hue={step?.accentHue ?? 210} />

        <LayoutGroup>
          <AnimatePresence mode="wait" custom={direction}>
            {/* ═══ INTRO ═══ */}
            {isIntro && (
              <motion.div
                key="intro"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="w-full max-w-[340px] flex flex-col items-center text-center"
              >
                {/* Neural spine preview — empty state */}
                <div className="relative w-full mb-6" style={{ height: 200 }}>
                  <CalibrationAvatar buildStage={-1} />
                </div>

                <motion.p
                  className="text-[9px] tracking-[0.3em] uppercase font-bold text-white/20 mb-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  NEO · LECTURA FISIOLÓGICA
                </motion.p>

                <motion.h1
                  className="text-[22px] font-bold tracking-[-0.03em] text-white/90 mb-3 leading-tight"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5, ease }}
                >
                  Calibrando tu sistema
                </motion.h1>
                <motion.p
                  className="text-[13px] text-white/25 font-light leading-relaxed mb-8 max-w-[260px]"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55, duration: 0.5, ease }}
                >
                  Cada respuesta activa una capa de tu modelo fisiológico.
                </motion.p>

                <motion.button
                  onClick={() => go(1)}
                  className="relative w-full max-w-[240px] h-[48px] rounded-xl text-[13px] font-semibold tracking-[0.06em] text-black overflow-hidden active:scale-[0.97] transition-transform"
                  style={{ background: '#F5F5F7' }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.5, ease }}
                  whileTap={{ scale: 0.97 }}
                >
                  INICIAR CALIBRACIÓN
                </motion.button>
              </motion.div>
            )}

            {/* ═══ QUESTION SCREENS ═══ */}
            {step && !showPulse && (
              <motion.div
                key={`step-${currentIdx}`}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="w-full max-w-[360px] relative"
              >
                {/* Question */}
                <motion.h2
                  className="text-[22px] font-bold text-white/90 tracking-[-0.02em] leading-[1.15] mb-2"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.05, ease }}
                >
                  {step.question}
                </motion.h2>

                {/* Hint */}
                {step.hint && (
                  <motion.p
                    className="text-[11px] font-light mb-8"
                    style={{ color: `hsla(${step.accentHue},40%,65%,0.35)` }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.12, ease }}
                  >
                    {step.hint}
                  </motion.p>
                )}

                {/* Input — varies by type */}
                {step.type === 'modules' && step.options && (
                  <ModuleInput
                    options={step.options}
                    selected={answers[currentIdx]}
                    onSelect={selectOption}
                    hue={step.accentHue}
                  />
                )}
                {step.type === 'scale' && step.options && (
                  <ScaleInput
                    options={step.options}
                    selected={answers[currentIdx]}
                    onSelect={selectOption}
                    hue={step.accentHue}
                  />
                )}
                {step.type === 'pills' && step.options && (
                  <PillInput
                    options={step.options}
                    selected={answers[currentIdx]}
                    onSelect={selectOption}
                    hue={step.accentHue}
                  />
                )}
                {step.type === 'single' && step.options && (
                  <SingleInput
                    options={step.options}
                    selected={answers[currentIdx]}
                    onSelect={selectOption}
                    hue={step.accentHue}
                  />
                )}
                {step.type === 'dial' && (
                  <DialInput
                    value={answers[currentIdx] || ''}
                    onChange={v => setNumeric(v)}
                    unit={step.unit}
                    placeholder={step.placeholder}
                    hue={step.accentHue}
                    onConfirm={() => { if (answers[currentIdx]) go(1); }}
                  />
                )}
              </motion.div>
            )}

            {/* ═══ COMPLETION ═══ */}
            {isComplete && (
              <motion.div
                key="completion"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="w-full max-w-[340px] flex flex-col items-center text-center"
              >
                {/* Fully calibrated neural system */}
                <div className="relative w-full mb-4" style={{ height: 280 }}>
                  <CalibrationAvatar buildStage={8} />
                </div>

                <motion.p
                  className="text-[8px] tracking-[0.3em] uppercase font-bold text-white/15 mb-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  CALIBRACIÓN COMPLETADA
                </motion.p>

                <motion.h1
                  className="text-[24px] font-bold text-white/90 tracking-[-0.02em] mb-3"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.5, ease }}
                >
                  Señales activas
                </motion.h1>
                <motion.p
                  className="text-[13px] text-white/25 font-light mb-8 max-w-[260px]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  NEO ha calibrado tu modelo fisiológico.
                </motion.p>

                <motion.button
                  onClick={handleComplete}
                  disabled={completing}
                  className="w-full max-w-[240px] h-[48px] rounded-xl text-[13px] font-semibold tracking-[0.06em] text-black active:scale-[0.97] transition-transform disabled:opacity-50"
                  style={{ background: '#F5F5F7' }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55, duration: 0.5, ease }}
                  whileTap={{ scale: 0.97 }}
                >
                  {completing ? 'GUARDANDO…' : 'CONTINUAR'}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </div>
  );
};
