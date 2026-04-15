import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useNeoProfile } from '@/contexts/NeoProfileContext';
import { activateVB2 } from '@/lib/activateVB2';
import { mapVB2AnswersToProfile, mapVB2AnswersToMetrics } from '@/lib/questionnaireMapper';
import { saveInitialMetrics } from '@/lib/saveInitialMetrics';

/* ─── Types ─── */

interface VB2QuestionnaireProps {
  onComplete: () => void;
  onBack: () => void;
}

type InputType = 'modules' | 'scale' | 'pills' | 'dial' | 'single' | 'intensity';

interface QuestionStep {
  question: string;
  type: InputType;
  options?: string[];
  unit?: string;
  placeholder?: string;
  hint?: string;
  accentHue: number;
  systemLabel: string;
  block: number;
}

const ease: [number, number, number, number] = [0.22, 0.68, 0.35, 1.0];
const springPop = { type: 'spring' as const, stiffness: 400, damping: 25 };

const BLOCKS = [
  { name: 'Perfil base', hue: 210, icon: '◈' },
  { name: 'Nivel real', hue: 260, icon: '◆' },
  { name: 'Recuperación', hue: 230, icon: '◎' },
  { name: 'Nutrición', hue: 150, icon: '▣' },
  { name: 'Compromiso', hue: 190, icon: '△' },
];

const STEPS: QuestionStep[] = [
  // BLOCK 0 — Perfil base
  { question: '¿Qué disciplinas practicas?', type: 'modules', options: ['Solo gimnasio', 'Gimnasio + running', 'Gimnasio + natación', 'Gimnasio + running + natación'], hint: 'Activa los módulos del sistema.', accentHue: 210, systemLabel: 'MÓDULOS', block: 0 },
  { question: '¿Cuántos años tienes?', type: 'dial', placeholder: '25', hint: 'Ajusta parámetros fisiológicos.', accentHue: 215, systemLabel: 'EDAD', block: 0 },
  { question: '¿Tu peso corporal actual?', type: 'dial', unit: 'kg', placeholder: '75', hint: 'Referencia para métricas relativas.', accentHue: 200, systemLabel: 'PESO', block: 0 },
  { question: '¿Tu altura?', type: 'dial', unit: 'cm', placeholder: '175', hint: 'Perfil antropométrico.', accentHue: 195, systemLabel: 'ALTURA', block: 0 },
  { question: '¿Años entrenando de verdad?', type: 'pills', options: ['<1', '1–3', '3–5', '5+'], hint: 'Calibra el nivel de adaptación.', accentHue: 220, systemLabel: 'AÑOS', block: 0 },
  { question: '¿Días de entrenamiento por semana?', type: 'pills', options: ['2–3', '4–5', '6', '7+'], hint: 'Frecuencia y distribución.', accentHue: 205, systemLabel: 'FRECUENCIA', block: 0 },

  // BLOCK 1 — Nivel real
  { question: '¿Sabes entrenar con RIR?', type: 'intensity', options: ['No', 'Lo básico', 'Sí, bastante bien', 'Sí, con mucha precisión'], hint: 'Calibra la precisión del modelo de intensidad.', accentHue: 260, systemLabel: 'RIR', block: 1 },
  { question: '¿Has seguido planificación seria?', type: 'scale', options: ['No', 'Sin constancia', 'Bastante bien', 'Con precisión'], hint: 'Evalúa adherencia estructural.', accentHue: 265, systemLabel: 'PLANIFICACIÓN', block: 1 },
  { question: '¿Qué esfuerzo se te da mejor?', type: 'modules', options: ['Resistencia larga', 'Explosividad / potencia', 'Ambos'], hint: 'Perfila tu fibra dominante.', accentHue: 270, systemLabel: 'FIBRA', block: 1 },
  { question: '¿Qué falla antes al entrenar fuerte?', type: 'single', options: ['Respiración / energía', 'Músculo pierde fuerza', 'Depende de la sesión'], hint: 'Identifica tu limitante principal.', accentHue: 255, systemLabel: 'LIMITANTE', block: 1 },
  { question: '¿Qué has practicado más tiempo?', type: 'single', options: ['Resistencia', 'Fuerza / potencia', 'Mezcla de ambas'], hint: 'Historial motor.', accentHue: 250, systemLabel: 'HISTORIAL', block: 1 },
  { question: '¿Qué pasa cuando levantas pesado?', type: 'single', options: ['Bien con moderadas, cuesta el máximo', 'Bueno con altas, fatigo rápido', 'Depende del momento'], hint: 'Afina perfil fuerza-resistencia.', accentHue: 245, systemLabel: 'FUERZA', block: 1 },

  // BLOCK 2 — Recuperación
  { question: '¿Horas de sueño habituales?', type: 'pills', options: ['<6', '6–7', '7–8', '8+'], hint: 'Factor clave en recuperación.', accentHue: 230, systemLabel: 'SUEÑO', block: 2 },
  { question: '¿Calidad de tu sueño?', type: 'scale', options: ['Mala', 'Regular', 'Buena', 'Muy buena'], hint: 'Capacidad regenerativa.', accentHue: 235, systemLabel: 'CALIDAD', block: 2 },
  { question: '¿Nivel de estrés diario?', type: 'intensity', options: ['Bajo', 'Medio', 'Alto', 'Muy alto'], hint: 'Tolerancia al volumen.', accentHue: 280, systemLabel: 'ESTRÉS', block: 2 },
  { question: '¿Ansiedad o carga mental?', type: 'scale', options: ['No', 'A veces', 'Bastante', 'Mucho'], hint: 'Fatiga no-física.', accentHue: 275, systemLabel: 'MENTAL', block: 2 },
  { question: '¿Tu rutina diaria te desgasta?', type: 'scale', options: ['No demasiado', 'Un poco', 'Bastante', 'Muchísimo'], hint: 'Fatiga acumulada externa.', accentHue: 225, systemLabel: 'DESGASTE', block: 2 },

  // BLOCK 3 — Nutrición
  { question: '¿Adherencia nutricional real?', type: 'intensity', options: ['Mala', 'Media', 'Buena', 'Muy buena'], hint: 'Expectativas del modelo.', accentHue: 150, systemLabel: 'ADHERENCIA', block: 3 },
  { question: '¿Comidas al día?', type: 'pills', options: ['≤2', '3', '4', '5+'], hint: 'Distribución calórica.', accentHue: 145, systemLabel: 'COMIDAS', block: 3 },
  { question: '¿Comes cerca del entrenamiento?', type: 'scale', options: ['No', 'A veces', 'Casi siempre', 'Siempre'], hint: 'Timing nutricional.', accentHue: 155, systemLabel: 'TIMING', block: 3 },
  { question: '¿Usas suplementación?', type: 'scale', options: ['No', 'Básica', 'Estructurada', 'Muy controlada'], hint: 'Activa recomendaciones.', accentHue: 160, systemLabel: 'SUPLEMENTOS', block: 3 },
  { question: '¿Hidratación diaria?', type: 'scale', options: ['Mala', 'Regular', 'Buena', 'Muy buena'], hint: 'Rendimiento básico.', accentHue: 180, systemLabel: 'HIDRATACIÓN', block: 3 },

  // BLOCK 4 — Compromiso
  { question: '¿Lesiones o recaídas recientes?', type: 'single', options: ['No', 'Sí, leves', 'Sí, moderadas', 'Sí, importantes'], hint: 'Zonas de riesgo.', accentHue: 190, systemLabel: 'LESIONES', block: 4 },
  { question: '¿Te pasas de carga o fatiga?', type: 'scale', options: ['Casi nunca', 'A veces', 'Bastante', 'Muy a menudo'], hint: 'Autorregulación natural.', accentHue: 185, systemLabel: 'SOBRECARGA', block: 4 },
  { question: '¿Cómo recuperas entre sesiones?', type: 'scale', options: ['Muy bien', 'Bien', 'Regular', 'Mal'], hint: 'Días de descanso.', accentHue: 195, systemLabel: 'RECUPERACIÓN', block: 4 },
  { question: '¿Seguirías un sistema preciso?', type: 'intensity', options: ['No del todo', 'Más o menos', 'Sí', 'Sí, al 100 %'], hint: 'Nivel de exigencia.', accentHue: 200, systemLabel: 'COMPROMISO', block: 4 },
  { question: '¿Aceptarías feedback directo?', type: 'modules', options: ['No', 'Sí'], hint: 'Seguimiento manual.', accentHue: 210, systemLabel: 'FEEDBACK', block: 4 },
];

const TOTAL = STEPS.length;

/* ─── Scan Line ─── */
const ScanLine = ({ hue }: { hue: number }) => (
  <motion.div
    className="absolute left-0 right-0 h-[1px] pointer-events-none z-0"
    style={{
      background: `linear-gradient(90deg, transparent, hsla(${hue},60%,65%,0.12), transparent)`,
    }}
    initial={{ top: '30%', opacity: 0 }}
    animate={{ top: ['30%', '70%', '30%'], opacity: [0, 0.4, 0] }}
    transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
  />
);

/* ─── Calibration Pulse ─── */
const CalibrationPulse = ({ hue, onDone }: { hue: number; onDone: () => void }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 550);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <motion.div
        className="rounded-full"
        style={{
          width: 60, height: 60,
          background: `radial-gradient(circle, hsla(${hue},60%,60%,0.15) 0%, transparent 70%)`,
        }}
        initial={{ scale: 0.3 }}
        animate={{ scale: 3, opacity: [0, 0.8, 0] }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
      />
      <motion.span
        className="absolute text-[8px] tracking-[0.35em] uppercase font-bold"
        style={{ color: `hsla(${hue},50%,70%,0.5)` }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: [0, 1, 0], scale: 1 }}
        transition={{ duration: 0.55 }}
      >
        REGISTRADO
      </motion.span>
    </motion.div>
  );
};

/* ─── Block Transition ─── */
const BlockTransition = ({ block, onDone }: { block: number; onDone: () => void }) => {
  const b = BLOCKS[block];
  useEffect(() => {
    const t = setTimeout(onDone, 1600);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Phase ring */}
      <motion.div
        className="relative mb-6"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease }}
      >
        <motion.div
          className="absolute inset-[-12px] rounded-full"
          style={{ border: `1px solid hsla(${b.hue},50%,60%,0.08)` }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.15, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{
            background: `hsla(${b.hue},50%,60%,0.06)`,
            border: `1px solid hsla(${b.hue},50%,60%,0.1)`,
          }}
        >
          <span className="text-[20px]" style={{ color: `hsla(${b.hue},50%,70%,0.5)` }}>
            {b.icon}
          </span>
        </div>
      </motion.div>

      <motion.p
        className="text-[8px] tracking-[0.35em] uppercase font-bold mb-2"
        style={{ color: `hsla(${b.hue},50%,65%,0.35)` }}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        FASE {block + 1} DE {BLOCKS.length}
      </motion.p>
      <motion.h2
        className="text-[22px] font-bold text-white/80 tracking-[-0.02em]"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.45, ease }}
      >
        {b.name}
      </motion.h2>
    </motion.div>
  );
};

/* ═══ Input Components ═══ */

/* ─── Module Selection ─── */
const ModuleInput = ({
  options, selected, onSelect, hue,
}: { options: string[]; selected: string | undefined; onSelect: (v: string) => void; hue: number }) => {
  const cols = options.length <= 3 ? options.length : 2;
  return (
    <div className={`grid gap-3`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {options.map((opt, i) => {
        const isActive = selected === opt;
        return (
          <motion.button
            key={opt}
            onClick={() => onSelect(opt)}
            className="relative rounded-2xl border overflow-hidden text-left p-4 transition-all duration-300"
            style={{
              borderColor: isActive ? `hsla(${hue},50%,65%,0.35)` : 'rgba(255,255,255,0.04)',
              background: isActive
                ? `linear-gradient(135deg, hsla(${hue},50%,60%,0.14), hsla(${hue},50%,60%,0.04))`
                : 'rgba(255,255,255,0.015)',
            }}
            initial={{ opacity: 0, y: 14, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.12 + i * 0.06, ease }}
            whileTap={{ scale: 0.96 }}
          >
            <span
              className="text-[13px] font-medium leading-tight block"
              style={{ color: isActive ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.35)' }}
            >
              {opt}
            </span>
            {isActive && (
              <motion.div
                className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full"
                style={{ background: `hsla(${hue},50%,65%,0.5)` }}
                layoutId="vb2-module-ind"
                transition={springPop}
              />
            )}
            {isActive && (
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{ background: `radial-gradient(ellipse at 30% 30%, hsla(${hue},50%,60%,0.08), transparent 60%)` }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
};

/* ─── Scale (visual progression bar + labels) ─── */
const ScaleInput = ({
  options, selected, onSelect, hue,
}: { options: string[]; selected: string | undefined; onSelect: (v: string) => void; hue: number }) => {
  const selectedIdx = options.indexOf(selected || '');
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15, ease }}
    >
      <div className="relative mb-6">
        <div className="h-[3px] rounded-full bg-white/[0.04] relative overflow-hidden">
          <motion.div
            className="absolute left-0 top-0 h-full rounded-full"
            style={{ background: `hsla(${hue},50%,65%,0.5)` }}
            animate={{ width: selectedIdx >= 0 ? `${((selectedIdx + 1) / options.length) * 100}%` : '0%' }}
            transition={{ duration: 0.5, ease }}
          />
        </div>
        <div className="flex justify-between absolute inset-x-0 -top-[5px]">
          {options.map((_, i) => (
            <motion.div
              key={i}
              className="w-[13px] h-[13px] rounded-full border-2 flex items-center justify-center"
              style={{
                borderColor: i <= selectedIdx ? `hsla(${hue},50%,65%,0.6)` : 'rgba(255,255,255,0.06)',
                background: i <= selectedIdx ? `hsla(${hue},50%,60%,0.12)` : 'rgba(0,0,0,0.9)',
              }}
              animate={i === selectedIdx ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 0.35 }}
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
      <div className="flex justify-between gap-1">
        {options.map((opt, i) => {
          const isActive = selected === opt;
          return (
            <motion.button key={opt} onClick={() => onSelect(opt)} className="flex-1 py-3 rounded-xl text-center" whileTap={{ scale: 0.95 }}>
              <span className="text-[11px] font-semibold" style={{ color: isActive ? `hsla(${hue},50%,80%,0.9)` : 'rgba(255,255,255,0.25)' }}>
                {opt}
              </span>
              {isActive && (
                <motion.div
                  className="mx-auto mt-1.5 w-1 h-1 rounded-full"
                  style={{ background: `hsla(${hue},50%,70%,0.6)` }}
                  layoutId="vb2-scale-dot"
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
    transition={{ duration: 0.4, delay: 0.15, ease }}
  >
    {options.map((opt, i) => {
      const isActive = selected === opt;
      return (
        <motion.button
          key={opt}
          onClick={() => onSelect(opt)}
          className="relative rounded-2xl border overflow-hidden transition-all duration-300"
          style={{
            width: 72, height: 72,
            borderColor: isActive ? `hsla(${hue},50%,65%,0.35)` : 'rgba(255,255,255,0.04)',
            background: isActive
              ? `radial-gradient(circle at 50% 40%, hsla(${hue},50%,60%,0.15), transparent)`
              : 'rgba(255,255,255,0.015)',
          }}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, delay: 0.15 + i * 0.06, ease }}
          whileTap={{ scale: 0.92 }}
        >
          <span className="text-[15px] font-bold tabular-nums" style={{ color: isActive ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.25)' }}>
            {opt}
          </span>
          {isActive && (
            <motion.div className="absolute inset-0 pointer-events-none" style={{ boxShadow: `inset 0 0 20px hsla(${hue},50%,60%,0.1)` }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
          )}
        </motion.button>
      );
    })}
  </motion.div>
);

/* ─── Intensity Meter (vertical bars) ─── */
const IntensityInput = ({
  options, selected, onSelect, hue,
}: { options: string[]; selected: string | undefined; onSelect: (v: string) => void; hue: number }) => {
  const selectedIdx = options.indexOf(selected || '');
  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15, ease }}
    >
      {/* Visual intensity bars */}
      <div className="flex items-end gap-3 justify-center h-20 mb-4">
        {options.map((_, i) => {
          const height = 30 + (i / (options.length - 1)) * 50;
          const isActive = i <= selectedIdx;
          return (
            <motion.button
              key={i}
              onClick={() => onSelect(options[i])}
              className="rounded-lg transition-all duration-300 relative overflow-hidden"
              style={{
                width: 32,
                height: `${height}%`,
                background: isActive
                  ? `linear-gradient(180deg, hsla(${hue},50%,65%,0.4), hsla(${hue},50%,60%,0.15))`
                  : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isActive ? `hsla(${hue},50%,65%,0.25)` : 'rgba(255,255,255,0.04)'}`,
              }}
              animate={{
                height: `${height}%`,
              }}
              whileTap={{ scale: 0.95 }}
            >
              {isActive && i === selectedIdx && (
                <motion.div
                  className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                  style={{
                    background: `hsla(${hue},50%,75%,0.8)`,
                    boxShadow: `0 0 6px hsla(${hue},50%,60%,0.4)`,
                  }}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
      {/* Labels */}
      <div className="flex justify-between gap-1 px-1">
        {options.map((opt, i) => {
          const isActive = selected === opt;
          return (
            <motion.button key={opt} onClick={() => onSelect(opt)} className="flex-1 text-center py-1" whileTap={{ scale: 0.95 }}>
              <span className="text-[10px] font-semibold" style={{ color: isActive ? `hsla(${hue},50%,80%,0.9)` : 'rgba(255,255,255,0.2)' }}>
                {opt}
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

/* ─── Dial Numeric ─── */
const DialInput = ({
  value, onChange, unit, placeholder, hue, onConfirm,
}: {
  value: string; onChange: (v: string) => void;
  unit?: string; placeholder?: string; hue: number; onConfirm: () => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const numVal = parseFloat(value) || 0;
  const maxVal = unit === 'cm' ? 220 : unit === 'kg' ? 150 : 100;

  useEffect(() => { inputRef.current?.focus(); }, []);

  return (
    <motion.div
      className="flex flex-col items-center"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15, ease }}
    >
      <div className="relative w-44 h-44 mb-6">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <circle cx="100" cy="100" r="85" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="3" strokeDasharray="4 6" />
          <motion.circle
            cx="100" cy="100" r="85" fill="none"
            stroke={`hsla(${hue},50%,65%,0.3)`}
            strokeWidth="3" strokeLinecap="round"
            strokeDasharray={`${Math.min(numVal / maxVal, 1) * 534} 534`}
            transform="rotate(-90 100 100)"
            transition={{ duration: 0.5, ease }}
          />
          {numVal > 0 && (
            <motion.circle
              cx="100" cy="100" r="85" fill="none"
              stroke={`hsla(${hue},60%,70%,0.12)`}
              strokeWidth="8" strokeLinecap="round"
              strokeDasharray={`${Math.min(numVal / maxVal, 1) * 534} 534`}
              transform="rotate(-90 100 100)"
              style={{ filter: 'blur(4px)' }}
              transition={{ duration: 0.5, ease }}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <input
            ref={inputRef}
            type="text" inputMode="decimal" placeholder={placeholder}
            value={value}
            onChange={e => onChange(e.target.value.replace(/[^0-9.]/g, ''))}
            className="w-20 text-center bg-transparent border-none outline-none text-[34px] font-bold text-white/90 placeholder-white/10"
            style={{ caretColor: `hsla(${hue},50%,65%,0.6)` }}
          />
          {unit && <span className="text-[11px] font-medium mt-0.5" style={{ color: `hsla(${hue},50%,65%,0.35)` }}>{unit}</span>}
        </div>
      </div>
      <motion.button
        onClick={onConfirm}
        className="w-full max-w-[220px] h-[46px] rounded-xl text-[12px] font-semibold tracking-[0.06em] transition-all duration-300 active:scale-[0.97]"
        style={{
          background: value
            ? `linear-gradient(135deg, hsla(${hue},45%,50%,0.25), hsla(${hue},45%,50%,0.1))`
            : 'rgba(255,255,255,0.02)',
          border: `1px solid ${value ? `hsla(${hue},50%,60%,0.25)` : 'rgba(255,255,255,0.04)'}`,
          color: value ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.12)',
        }}
        whileTap={{ scale: 0.97 }}
      >
        CONFIRMAR
      </motion.button>
    </motion.div>
  );
};

/* ─── Single Cards ─── */
const SingleInput = ({
  options, selected, onSelect, hue,
}: { options: string[]; selected: string | undefined; onSelect: (v: string) => void; hue: number }) => (
  <div className="space-y-2">
    {options.map((opt, i) => {
      const isActive = selected === opt;
      return (
        <motion.button
          key={opt}
          onClick={() => onSelect(opt)}
          className="w-full text-left rounded-xl border overflow-hidden transition-all duration-300 relative"
          style={{
            padding: '13px 16px',
            borderColor: isActive ? `hsla(${hue},50%,65%,0.3)` : 'rgba(255,255,255,0.04)',
            background: isActive
              ? `linear-gradient(135deg, hsla(${hue},50%,60%,0.12), hsla(${hue},50%,60%,0.03))`
              : 'rgba(255,255,255,0.015)',
          }}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, delay: 0.12 + i * 0.07, ease }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <div className="w-[14px] h-[14px] rounded-full border-[1.5px]" style={{ borderColor: isActive ? `hsla(${hue},50%,65%,0.7)` : 'rgba(255,255,255,0.08)' }} />
              {isActive && (
                <motion.div className="absolute inset-[3px] rounded-full" style={{ background: `hsla(${hue},50%,70%,0.8)`, boxShadow: `0 0 8px hsla(${hue},50%,60%,0.4)` }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={springPop} />
              )}
            </div>
            <span className="text-[13px] font-medium" style={{ color: isActive ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.35)' }}>{opt}</span>
          </div>
          {isActive && (
            <motion.div className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full" style={{ background: `hsla(${hue},50%,65%,0.5)` }} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.3, ease }} />
          )}
        </motion.button>
      );
    })}
  </div>
);


/* ═══════════════════════════════════════════════════════ */
/* ─── Main Component ─── */
/* ═══════════════════════════════════════════════════════ */

export const VB2Questionnaire = ({ onComplete, onBack }: VB2QuestionnaireProps) => {
  const { saveProfile } = useNeoProfile();
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [direction, setDirection] = useState(1);
  const [activating, setActivating] = useState(false);
  const [activated, setActivated] = useState(false);
  const [activationError, setActivationError] = useState<string | null>(null);
  const [blockTransition, setBlockTransition] = useState<number | null>(null);
  const [showPulse, setShowPulse] = useState(false);

  const isIntro = currentIdx === -1;
  const isComplete = currentIdx === TOTAL;
  const step = !isIntro && !isComplete ? STEPS[currentIdx] : null;
  const currentBlock = step?.block ?? 0;
  const blockInfo = BLOCKS[currentBlock];

  const go = useCallback((delta: number) => {
    const nextIdx = currentIdx + delta;
    if (nextIdx >= 0 && nextIdx < TOTAL && delta > 0) {
      const nextBlock = STEPS[nextIdx].block;
      const curBlock = currentIdx >= 0 && currentIdx < TOTAL ? STEPS[currentIdx].block : -1;
      if (nextBlock !== curBlock && curBlock !== -1) {
        setBlockTransition(nextBlock);
        setDirection(delta);
        return;
      }
    }
    setDirection(delta);
    setCurrentIdx(s => s + delta);
  }, [currentIdx]);

  const handleBlockDone = useCallback(() => {
    if (blockTransition !== null) {
      const nextIdx = currentIdx + 1;
      setBlockTransition(null);
      setCurrentIdx(nextIdx);
    }
  }, [blockTransition, currentIdx]);

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

  const slideVariants = {
    enter: (d: number) => ({ opacity: 0, x: d > 0 ? 50 : -50, scale: 0.94, filter: 'blur(6px)' }),
    center: { opacity: 1, x: 0, scale: 1, filter: 'blur(0px)', transition: { duration: 0.55, ease } },
    exit: (d: number) => ({ opacity: 0, x: d > 0 ? -30 : 30, scale: 0.97, filter: 'blur(4px)', transition: { duration: 0.3, ease } }),
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-50 overflow-hidden">
      {/* Block transition */}
      <AnimatePresence>
        {blockTransition !== null && <BlockTransition block={blockTransition} onDone={handleBlockDone} />}
      </AnimatePresence>

      {/* Calibration pulse */}
      <AnimatePresence>
        {showPulse && step && <CalibrationPulse hue={step.accentHue} onDone={handlePulseDone} />}
      </AnimatePresence>

      {/* ─── Progress ─── */}
      {!isIntro && blockTransition === null && (
        <div className="flex-shrink-0 px-6 pt-[max(env(safe-area-inset-top),16px)]">
          <div className="flex items-center justify-between mb-3 mt-2">
            <motion.span
              key={currentBlock}
              className="text-[8px] tracking-[0.3em] uppercase font-bold"
              style={{ color: `hsla(${blockInfo?.hue ?? 210},50%,70%,0.4)` }}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
            >
              {step?.systemLabel ?? blockInfo?.name}
            </motion.span>
            <span className="text-[9px] tabular-nums font-mono text-white/15">
              {isComplete ? TOTAL : currentIdx + 1}/{TOTAL}
            </span>
          </div>
          {/* Segmented block progress */}
          <div className="flex gap-1.5">
            {BLOCKS.map((b, bIdx) => {
              const blockSteps = STEPS.filter(s => s.block === bIdx);
              const firstIdx = STEPS.indexOf(blockSteps[0]);
              const lastIdx = STEPS.indexOf(blockSteps[blockSteps.length - 1]);
              const bProgress = currentIdx < firstIdx ? 0 : currentIdx > lastIdx ? 1 : (currentIdx - firstIdx + 1) / blockSteps.length;
              return (
                <div key={bIdx} className="flex-1 h-[2px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: bProgress > 0 ? `hsla(${b.hue},50%,65%,${bProgress === 1 ? 0.5 : 0.7})` : 'transparent' }}
                    animate={{ width: `${bProgress * 100}%` }}
                    transition={{ duration: 0.5, ease }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Back ─── */}
      {(currentIdx > -1 && !isComplete && blockTransition === null) && (
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
            {isIntro && blockTransition === null && (
              <motion.div
                key="vb2-intro"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="w-full max-w-[340px] flex flex-col items-center text-center"
              >
                <motion.div
                  className="relative mb-10"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, ease }}
                >
                  <motion.div
                    className="absolute inset-[-20px] rounded-full"
                    style={{ border: '1px solid rgba(255,255,255,0.03)' }}
                    animate={{ scale: [1, 1.12, 1], opacity: [0.4, 0.12, 0.4] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                    <span className="text-[18px] font-bold tracking-[0.15em] text-white/80">N</span>
                  </div>
                </motion.div>

                <motion.p
                  className="text-[8px] tracking-[0.3em] uppercase font-bold text-cyan-400/30 mb-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  NEO · VB2 · CALIBRACIÓN PROFUNDA
                </motion.p>

                <motion.h1
                  className="text-[24px] font-bold tracking-[-0.03em] text-white/90 mb-3"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5, ease }}
                >
                  {TOTAL} variables · {BLOCKS.length} fases
                </motion.h1>

                <motion.p
                  className="text-[13px] text-white/25 font-light leading-relaxed mb-6 max-w-[260px]"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55, duration: 0.5, ease }}
                >
                  Calibración completa para máxima precisión del sistema.
                </motion.p>

                {/* Block chips */}
                <motion.div
                  className="flex flex-wrap justify-center gap-2 mb-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.65 }}
                >
                  {BLOCKS.map((b, i) => (
                    <motion.span
                      key={i}
                      className="px-3 py-1 rounded-full text-[9px] tracking-[0.12em] uppercase font-bold"
                      style={{
                        color: `hsla(${b.hue},50%,65%,0.4)`,
                        border: `1px solid hsla(${b.hue},50%,60%,0.08)`,
                        background: `hsla(${b.hue},50%,60%,0.03)`,
                      }}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.7 + i * 0.06, duration: 0.3, ease }}
                    >
                      {b.name}
                    </motion.span>
                  ))}
                </motion.div>

                <motion.button
                  onClick={() => go(1)}
                  className="relative w-full max-w-[240px] h-[48px] rounded-xl text-[13px] font-semibold tracking-[0.06em] text-black overflow-hidden active:scale-[0.97] transition-transform"
                  style={{ background: '#F5F5F7' }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.85, duration: 0.5, ease }}
                  whileTap={{ scale: 0.97 }}
                >
                  INICIAR CALIBRACIÓN
                </motion.button>
              </motion.div>
            )}

            {/* ═══ QUESTION SCREENS ═══ */}
            {step && blockTransition === null && !showPulse && (
              <motion.div
                key={`vb2-step-${currentIdx}`}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="w-full max-w-[360px] relative"
              >
                <motion.h2
                  className="text-[21px] font-bold text-white/90 tracking-[-0.02em] leading-[1.15] mb-2"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.05, ease }}
                >
                  {step.question}
                </motion.h2>

                {step.hint && (
                  <motion.p
                    className="text-[11px] font-light mb-8"
                    style={{ color: `hsla(${step.accentHue},40%,65%,0.3)` }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.1, ease }}
                  >
                    {step.hint}
                  </motion.p>
                )}

                {step.type === 'modules' && step.options && <ModuleInput options={step.options} selected={answers[currentIdx]} onSelect={selectOption} hue={step.accentHue} />}
                {step.type === 'scale' && step.options && <ScaleInput options={step.options} selected={answers[currentIdx]} onSelect={selectOption} hue={step.accentHue} />}
                {step.type === 'pills' && step.options && <PillInput options={step.options} selected={answers[currentIdx]} onSelect={selectOption} hue={step.accentHue} />}
                {step.type === 'intensity' && step.options && <IntensityInput options={step.options} selected={answers[currentIdx]} onSelect={selectOption} hue={step.accentHue} />}
                {step.type === 'single' && step.options && <SingleInput options={step.options} selected={answers[currentIdx]} onSelect={selectOption} hue={step.accentHue} />}
                {step.type === 'dial' && (
                  <DialInput
                    value={answers[currentIdx] || ''}
                    onChange={v => setNumeric(v)}
                    unit={step.unit} placeholder={step.placeholder}
                    hue={step.accentHue}
                    onConfirm={() => { if (answers[currentIdx]) go(1); }}
                  />
                )}
              </motion.div>
            )}

            {/* ═══ COMPLETION ═══ */}
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
        </LayoutGroup>
      </div>
    </div>
  );
};

/* ─── Completion ─── */

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
      className="w-full max-w-[340px] flex flex-col items-center text-center"
    >
      {activating && (
        <>
          <motion.div
            className="w-14 h-14 rounded-2xl border border-white/[0.06] bg-white/[0.03] flex items-center justify-center mb-6"
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
          <motion.h1 className="text-[22px] font-bold text-white/85 tracking-[-0.01em] mb-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            Activando VB2…
          </motion.h1>
          <p className="text-[11px] text-white/20 font-light">Configurando perfil avanzado</p>
        </>
      )}

      {activated && (
        <>
          <motion.div
            className="relative mb-8"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease }}
          >
            <motion.div
              className="absolute inset-[-16px] rounded-full"
              style={{ background: 'radial-gradient(circle, hsla(260,50%,60%,0.1) 0%, transparent 70%)' }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0.15, 0.6] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="w-14 h-14 rounded-2xl border border-white/[0.06] bg-white/[0.03] flex items-center justify-center">
              <motion.svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke="hsla(260,50%,70%,0.7)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              >
                <motion.path d="M5 13l4 4L19 7" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, delay: 0.3, ease }} />
              </motion.svg>
            </div>
          </motion.div>

          <motion.p className="text-[8px] tracking-[0.3em] uppercase font-bold text-white/15 mb-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
            CALIBRACIÓN COMPLETADA
          </motion.p>
          <motion.h1 className="text-[24px] font-bold text-white/90 tracking-[-0.02em] mb-2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5, ease }}>
            VB2 activado
          </motion.h1>
          <motion.p className="text-[12px] text-white/25 font-light mb-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
            Seguimiento 1:1 asignado automáticamente.
          </motion.p>
          <motion.div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-3 mb-10 w-full max-w-[280px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <p className="text-[10px] text-white/20 font-light">Tu perfil VB2 está activo con asesoría de Pablo.</p>
          </motion.div>

          <motion.button
            onClick={onComplete}
            className="w-full max-w-[240px] h-[48px] rounded-xl text-[13px] font-semibold tracking-[0.06em] text-black active:scale-[0.97] transition-transform"
            style={{ background: '#F5F5F7' }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5, ease }}
            whileTap={{ scale: 0.97 }}
          >
            CONTINUAR
          </motion.button>
        </>
      )}

      {!activating && !activated && activationError && (
        <>
          <h1 className="text-[22px] font-bold text-white/85 tracking-[-0.01em] mb-4">Error al activar</h1>
          <p className="text-[11px] font-medium text-red-400/70 mb-6">{activationError}</p>
          <motion.button
            onClick={doActivation}
            className="w-full max-w-[240px] h-[48px] rounded-xl text-[13px] font-semibold text-black active:scale-[0.97] transition-transform"
            style={{ background: '#F5F5F7' }}
            whileTap={{ scale: 0.97 }}
          >
            REINTENTAR
          </motion.button>
        </>
      )}
    </motion.div>
  );
};
