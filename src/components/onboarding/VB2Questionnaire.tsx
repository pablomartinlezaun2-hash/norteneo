import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNeoProfile } from '@/contexts/NeoProfileContext';
import { activateVB2 } from '@/lib/activateVB2';

interface VB2QuestionnaireProps {
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
  // BLOCK 1 — Perfil base
  { question: '¿Qué disciplinas practicas actualmente?', type: 'single', options: ['Solo gimnasio', 'Gimnasio + running', 'Gimnasio + natación', 'Gimnasio + running + natación'] },
  { question: '¿Cuántos años tienes?', type: 'numeric', placeholder: '25' },
  { question: '¿Cuál es tu peso corporal actual?', type: 'numeric', unit: 'kg', placeholder: '75' },
  { question: '¿Cuál es tu altura?', type: 'numeric', unit: 'cm', placeholder: '175' },
  { question: '¿Cuántos años llevas entrenando de verdad?', type: 'single', options: ['Menos de 1', '1–3', '3–5', 'Más de 5'] },
  { question: '¿Cuántos días entrenas por semana?', type: 'single', options: ['2–3', '4–5', '6', '7+'] },
  // BLOCK 2 — Nivel real
  { question: '¿Sabes entrenar con RIR o cercanía al fallo?', type: 'single', options: ['No', 'Lo básico', 'Sí, bastante bien', 'Sí, con mucha precisión'] },
  { question: '¿Has seguido alguna vez una planificación seria durante varias semanas?', type: 'single', options: ['No', 'Sí, pero sin mucha constancia', 'Sí, bastante bien', 'Sí, con mucha precisión'] },
  { question: '¿Qué tipo de esfuerzo se te da mejor de forma natural?', type: 'single', options: ['Resistencia larga', 'Explosividad / potencia', 'Me adapto bien a ambos'] },
  { question: 'Cuando entrenas fuerte, ¿qué falla antes?', type: 'single', options: ['La respiración o la energía', 'El músculo pierde fuerza rápido', 'Depende mucho del tipo de sesión'] },
  { question: '¿Qué has practicado más tiempo en tu vida?', type: 'single', options: ['Resistencia', 'Fuerza / potencia', 'Mezcla de ambas'] },
  { question: 'Cuando levantas pesado, ¿qué suele pasar?', type: 'single', options: ['Muevo bien cargas moderadas, pero me cuesta el máximo', 'Soy bueno moviendo cargas altas, aunque me fatigue rápido', 'Depende del momento y del entrenamiento'] },
  // BLOCK 3 — Recuperación y estrés
  { question: '¿Cuántas horas duermes normalmente?', type: 'single', options: ['Menos de 6', '6–7', '7–8', '8+'] },
  { question: '¿Cómo es la calidad de tu sueño?', type: 'single', options: ['Mala', 'Regular', 'Buena', 'Muy buena'] },
  { question: '¿Cómo es tu nivel de estrés diario?', type: 'single', options: ['Bajo', 'Medio', 'Alto', 'Muy alto'] },
  { question: '¿Sueles tener ansiedad o mucha carga mental?', type: 'single', options: ['No', 'A veces', 'Bastante', 'Mucho'] },
  { question: '¿Tu trabajo o tu rutina diaria te desgastan físicamente?', type: 'single', options: ['No demasiado', 'Un poco', 'Bastante', 'Muchísimo'] },
  // BLOCK 4 — Nutrición y adherencia
  { question: '¿Cómo es tu adherencia nutricional real?', type: 'single', options: ['Mala', 'Media', 'Buena', 'Muy buena'] },
  { question: '¿Cuántas comidas haces al día normalmente?', type: 'single', options: ['2 o menos', '3', '4', '5 o más'] },
  { question: '¿Sueles comer cerca del entrenamiento?', type: 'single', options: ['No', 'A veces', 'Casi siempre', 'Siempre'] },
  { question: '¿Usas suplementación?', type: 'single', options: ['No', 'Básica', 'Bastante estructurada', 'Muy controlada'] },
  { question: '¿Cómo dirías que es tu hidratación diaria?', type: 'single', options: ['Mala', 'Regular', 'Buena', 'Muy buena'] },
  // BLOCK 5 — Historial, tolerancia y compromiso
  { question: '¿Has tenido lesiones o recaídas recientes?', type: 'single', options: ['No', 'Sí, leves', 'Sí, moderadas', 'Sí, importantes'] },
  { question: '¿Con qué frecuencia notas que te pasas de carga o de fatiga?', type: 'single', options: ['Casi nunca', 'A veces', 'Bastante', 'Muy a menudo'] },
  { question: '¿Cómo recuperas normalmente entre sesiones duras?', type: 'single', options: ['Muy bien', 'Bien', 'Regular', 'Mal'] },
  { question: '¿Estás dispuesto a seguir un sistema mucho más preciso y exigente?', type: 'single', options: ['No del todo', 'Más o menos', 'Sí', 'Sí, al 100 %'] },
  { question: '¿Aceptarías revisión manual y feedback directo del equipo?', type: 'single', options: ['No', 'Sí'] },
];

const TOTAL_SCREENS = STEPS.length + 2; // intro + steps + completion
const transition = { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const };

export const VB2Questionnaire = ({ onComplete, onBack }: VB2QuestionnaireProps) => {
  const { saveProfile } = useNeoProfile();
  const [screen, setScreen] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [direction, setDirection] = useState(1);
  const [activating, setActivating] = useState(false);
  const [activated, setActivated] = useState(false);
  const [activationError, setActivationError] = useState<string | null>(null);

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

      {/* Back on intro */}
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
              key="vb2-intro"
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
                NEO VB2
              </h1>
              <p className="text-[14px] font-medium text-[#8E8E93] mb-6">
                Máxima precisión. Máxima exigencia.
              </p>
              <p className="text-[13px] font-light leading-[1.7] text-[#636366] mb-4 max-w-[300px]">
                VB2 está diseñado para usuarios que quieren un análisis mucho más profundo. Aquí configuraremos más variables para que NEO pueda trabajar con mayor precisión sobre entrenamiento, recuperación, nutrición y rendimiento.
              </p>
              <p className="text-[12px] font-light text-[#48484A] mb-10 max-w-[280px]">
                Este proceso es más largo que VB1, pero también mucho más preciso.
              </p>
              <motion.button
                whileTap={{ scale: 0.985 }}
                onClick={() => go(1)}
                className="w-full max-w-[280px] h-[48px] rounded-xl bg-[#F5F5F7] text-black text-[14px] font-medium tracking-[0.01em]"
              >
                Empezar VB2
              </motion.button>
            </motion.div>
          )}

          {/* QUESTION SCREENS */}
          {currentStep && (
            <motion.div
              key={`vb2-step-${stepIndex}`}
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
                    {currentStep.unit && (
                      <span className="text-[14px] font-medium text-[#636366]">{currentStep.unit}</span>
                    )}
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.985 }}
                    onClick={() => { if (answers[stepIndex]) go(1); }}
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

          {/* COMPLETION — auto-activate on mount */}
          {isCompletion && (
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

/* ── Completion sub-component that auto-triggers activation ── */

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
      const result = await activateVB2(profileData);
      if (result.success) {
        saveProfile('vb2', answers);
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
  }, []); // runs once on mount

  return (
    <motion.div
      key="vb2-completion"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="w-full max-w-[340px] flex flex-col items-center text-center"
    >
      <div className="bg-[#F5F5F7] rounded-2xl px-5 py-2.5 mb-10">
        <span className="text-xl font-bold tracking-[0.25em] text-black">NEO</span>
      </div>

      {activating && (
        <>
          <h1 className="text-[24px] font-semibold text-[#F5F5F7] tracking-[-0.01em] mb-4">
            Activando VB2…
          </h1>
          <div className="w-8 h-8 border-2 border-[#F5F5F7] border-t-transparent rounded-full animate-spin" />
        </>
      )}

      {activated && (
        <>
          <h1 className="text-[24px] font-semibold text-[#F5F5F7] tracking-[-0.01em] mb-2">
            VB2 activado
          </h1>
          <p className="text-[13px] font-medium text-[#8E8E93] mb-6">
            Seguimiento asignado
          </p>
          <div className="rounded-xl border border-[#1C1C1E] bg-[#111111] px-5 py-4 mb-10 w-full">
            <p className="text-[12px] font-light leading-[1.7] text-[#8E8E93]">
              Tu perfil VB2 está activo. Asesoría 1:1 con Pablo asignada automáticamente.
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.985 }}
            onClick={onComplete}
            className="w-full max-w-[280px] h-[48px] rounded-xl bg-[#F5F5F7] text-black text-[14px] font-medium tracking-[0.01em]"
          >
            Continuar
          </motion.button>
        </>
      )}

      {!activating && !activated && activationError && (
        <>
          <h1 className="text-[24px] font-semibold text-[#F5F5F7] tracking-[-0.01em] mb-4">
            Error al activar
          </h1>
          <p className="text-[12px] font-medium text-red-400 mb-6">
            {activationError}
          </p>
          <motion.button
            whileTap={{ scale: 0.985 }}
            onClick={handleRetry}
            className="w-full max-w-[280px] h-[48px] rounded-xl bg-[#F5F5F7] text-black text-[14px] font-medium tracking-[0.01em]"
          >
            Reintentar
          </motion.button>
        </>
      )}
    </motion.div>
  );
};
