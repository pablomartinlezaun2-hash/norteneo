import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNeoProfile } from '@/contexts/NeoProfileContext';

/* ─── Types ─── */

interface VB1QuestionnaireProps {
  onComplete: () => void;
  onBack: () => void;
}

interface QuestionStep {
  question: string;
  type: 'single' | 'numeric';
  options?: string[];
  unit?: string;
  placeholder?: string;
}

const STEPS: QuestionStep[] = [
  {
    question: '¿Qué quieres conseguir ahora mismo?',
    type: 'single',
    options: ['Ganar masa muscular', 'Perder grasa', 'Mejorar mi forma física', 'Organizar mejor mi entrenamiento'],
  },
  {
    question: '¿Cuánto tiempo llevas entrenando?',
    type: 'single',
    options: ['Estoy empezando', 'Menos de 1 año', '1 a 3 años', 'Más de 3 años'],
  },
  {
    question: '¿Qué haces actualmente?',
    type: 'single',
    options: ['Gimnasio', 'Running', 'Natación', 'Varias de las anteriores'],
  },
  {
    question: '¿Cuántos días entrenas por semana?',
    type: 'single',
    options: ['1–2', '3–4', '5–6', '7'],
  },
  {
    question: '¿Cuántas horas duermes normalmente?',
    type: 'single',
    options: ['Menos de 6', '6–7', '7–8', 'Más de 8'],
  },
  {
    question: '¿Cómo es tu nivel de estrés?',
    type: 'single',
    options: ['Bajo', 'Medio', 'Alto'],
  },
  {
    question: '¿Tienes alguna molestia o lesión actual?',
    type: 'single',
    options: ['No', 'Sí, leve', 'Sí, importante'],
  },
  {
    question: '¿Cuál es tu peso corporal actual?',
    type: 'numeric',
    unit: 'kg',
    placeholder: '70',
  },
];

const TOTAL_SCREENS = STEPS.length + 2; // intro + steps + completion

const transition = { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const };

/* ─── Component ─── */

export const VB1Questionnaire = ({ onComplete, onBack }: VB1QuestionnaireProps) => {
  // screen: 0 = intro, 1..STEPS.length = questions, STEPS.length+1 = completion
  const [screen, setScreen] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [direction, setDirection] = useState(1); // 1 forward, -1 back

  const isIntro = screen === 0;
  const isCompletion = screen === STEPS.length + 1;
  const stepIndex = screen - 1;
  const currentStep = !isIntro && !isCompletion ? STEPS[stepIndex] : null;

  const progress = screen / (TOTAL_SCREENS - 1);

  const go = (delta: number) => {
    setDirection(delta);
    setScreen(s => s + delta);
  };

  const selectOption = (value: string) => {
    setAnswers(prev => ({ ...prev, [stepIndex]: value }));
    // Auto-advance after short delay
    setTimeout(() => go(1), 280);
  };

  const setNumeric = (value: string) => {
    setAnswers(prev => ({ ...prev, [stepIndex]: value }));
  };

  const slideVariants = {
    enter: (d: number) => ({ opacity: 0, x: d > 0 ? 40 : -40 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: d > 0 ? -40 : 40 }),
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-50 overflow-hidden">
      {/* Progress bar */}
      {!isIntro && (
        <div className="px-6 pt-6">
          <div className="w-full h-[2px] bg-[#1C1C1E] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#48484A] rounded-full"
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            />
          </div>
        </div>
      )}

      {/* Back button */}
      {screen > 0 && !isCompletion && (
        <div className="flex justify-start px-6 pt-5">
          <button
            onClick={() => go(-1)}
            className="text-[12px] tracking-[0.14em] uppercase font-medium transition-colors duration-300"
            style={{ color: '#3A3A3C' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#8E8E93')}
            onMouseLeave={e => (e.currentTarget.style.color = '#3A3A3C')}
          >
            Atrás
          </button>
        </div>
      )}

      {/* Skip on intro */}
      {isIntro && (
        <div className="flex justify-start px-6 pt-6">
          <button
            onClick={onBack}
            className="text-[12px] tracking-[0.14em] uppercase font-medium transition-colors duration-300"
            style={{ color: '#3A3A3C' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#8E8E93')}
            onMouseLeave={e => (e.currentTarget.style.color = '#3A3A3C')}
          >
            Atrás
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6">
        <AnimatePresence mode="wait" custom={direction}>
          {/* INTRO */}
          {isIntro && (
            <motion.div
              key="intro"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={transition}
              className="w-full max-w-[340px] flex flex-col items-center text-center"
            >
              <div className="bg-[#F5F5F7] rounded-2xl px-5 py-2.5 mb-10">
                <span className="text-xl font-bold tracking-[0.25em] text-black">NEO</span>
              </div>
              <h1 className="text-[24px] font-semibold text-[#F5F5F7] tracking-[-0.01em] mb-2">
                NEO VB1
              </h1>
              <p className="text-[14px] font-medium text-[#8E8E93] mb-6">
                Una configuración más simple, clara y eficaz.
              </p>
              <p className="text-[13px] font-light leading-[1.7] text-[#636366] mb-10 max-w-[300px]">
                VB1 está pensado para ayudarte a organizar tu entrenamiento y tu nutrición de forma limpia y útil, sin necesidad de un análisis tan exhaustivo.
              </p>
              <motion.button
                whileTap={{ scale: 0.985 }}
                onClick={() => go(1)}
                className="w-full max-w-[280px] h-[48px] rounded-xl bg-[#F5F5F7] text-black text-[14px] font-medium tracking-[0.01em]"
              >
                Empezar
              </motion.button>
            </motion.div>
          )}

          {/* QUESTION SCREENS */}
          {currentStep && (
            <motion.div
              key={`step-${stepIndex}`}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={transition}
              className="w-full max-w-[340px]"
            >
              <h2 className="text-[22px] font-semibold text-[#F5F5F7] tracking-[-0.01em] leading-tight mb-8">
                {currentStep.question}
              </h2>

              {currentStep.type === 'single' && currentStep.options && (
                <div className="space-y-3">
                  {currentStep.options.map(option => {
                    const selected = answers[stepIndex] === option;
                    return (
                      <motion.button
                        key={option}
                        whileTap={{ scale: 0.985 }}
                        onClick={() => selectOption(option)}
                        className="w-full text-left px-5 py-4 rounded-xl border transition-colors duration-200"
                        style={{
                          backgroundColor: selected ? '#F5F5F7' : '#0A0A0A',
                          borderColor: selected ? '#F5F5F7' : '#1C1C1E',
                          color: selected ? '#000000' : '#A1A1A6',
                        }}
                      >
                        <span className="text-[14px] font-medium">{option}</span>
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {currentStep.type === 'numeric' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      inputMode="decimal"
                      placeholder={currentStep.placeholder}
                      value={answers[stepIndex] || ''}
                      onChange={e => setNumeric(e.target.value)}
                      className="flex-1 h-[52px] rounded-xl border border-[#1C1C1E] bg-[#0A0A0A] px-5 text-[18px] font-medium text-[#F5F5F7] placeholder-[#3A3A3C] outline-none focus:border-[#48484A] transition-colors duration-200"
                      style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' } as React.CSSProperties}
                    />
                    <span className="text-[14px] font-medium text-[#636366]">{currentStep.unit}</span>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.985 }}
                    onClick={() => {
                      if (answers[stepIndex]) go(1);
                    }}
                    className="w-full h-[48px] rounded-xl text-[14px] font-medium tracking-[0.01em] transition-colors duration-200"
                    style={{
                      backgroundColor: answers[stepIndex] ? '#F5F5F7' : '#1C1C1E',
                      color: answers[stepIndex] ? '#000000' : '#3A3A3C',
                    }}
                  >
                    Siguiente
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}

          {/* COMPLETION */}
          {isCompletion && (
            <motion.div
              key="completion"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={transition}
              className="w-full max-w-[340px] flex flex-col items-center text-center"
            >
              <div className="bg-[#F5F5F7] rounded-2xl px-5 py-2.5 mb-10">
                <span className="text-xl font-bold tracking-[0.25em] text-black">NEO</span>
              </div>
              <h1 className="text-[24px] font-semibold text-[#F5F5F7] tracking-[-0.01em] mb-4">
                VB1 listo
              </h1>
              <p className="text-[13px] font-light leading-[1.7] text-[#636366] mb-10 max-w-[300px]">
                Ya tenemos una base suficiente para empezar con una experiencia más simple, clara y útil dentro de NEO.
              </p>
              <motion.button
                whileTap={{ scale: 0.985 }}
                onClick={onComplete}
                className="w-full max-w-[280px] h-[48px] rounded-xl bg-[#F5F5F7] text-black text-[14px] font-medium tracking-[0.01em]"
              >
                Continuar
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
