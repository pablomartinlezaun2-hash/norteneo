import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VB1Questionnaire } from './VB1Questionnaire';
import { VB2Questionnaire } from './VB2Questionnaire';

interface NeoAssistantProps {
  onComplete: () => void;
  onSkip: () => void;
}

const BULLETS = [
  'Más variables analizadas',
  'Más precisión en las recomendaciones',
  'Más tiempo de configuración inicial',
  'Posible revisión manual por parte del equipo',
];

export const NeoAssistant = ({ onComplete, onSkip }: NeoAssistantProps) => {
  const [showVB2Modal, setShowVB2Modal] = useState(false);
  const [showVB1Flow, setShowVB1Flow] = useState(false);
  const [showVB2Flow, setShowVB2Flow] = useState(false);

  const containerVariants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.12, delayChildren: 0.15 },
    },
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 14 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const },
    },
  };

  if (showVB1Flow) {
    return (
      <VB1Questionnaire
        onComplete={onComplete}
        onBack={() => setShowVB1Flow(false)}
      />
    );
  }

  if (showVB2Flow) {
    return (
      <VB2Questionnaire
        onComplete={onComplete}
        onBack={() => setShowVB2Flow(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-50 overflow-y-auto">
      {/* Skip */}
      <div className="flex justify-end px-6 pt-6 relative z-10">
        <button
          onClick={onSkip}
          className="text-[12px] tracking-[0.14em] uppercase font-medium transition-colors duration-300"
          style={{ color: '#3A3A3C' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#8E8E93')}
          onMouseLeave={e => (e.currentTarget.style.color = '#3A3A3C')}
        >
          Saltar
        </button>
      </div>

      <motion.div
        className="flex-1 flex flex-col items-center px-6 pb-12 pt-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Logo */}
        <motion.div variants={fadeUp} className="mb-10">
          <div className="bg-[#F5F5F7] rounded-2xl px-5 py-2.5">
            <span className="text-xl font-bold tracking-[0.25em] text-black">NEO</span>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          variants={fadeUp}
          className="text-[26px] font-semibold tracking-[-0.01em] text-[#F5F5F7] text-center mb-3"
        >
          Elige tu modelo
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={fadeUp}
          className="text-[14px] font-light leading-relaxed text-[#8E8E93] text-center max-w-[320px] mb-10"
        >
          Dos formas de entrar en NEO. Una pensada para empezar bien. Otra diseñada para llevar el rendimiento al máximo nivel.
        </motion.p>

        {/* Cards */}
        <div className="w-full max-w-[360px] space-y-4">
          {/* VB1 */}
          <motion.div
            variants={fadeUp}
            className="rounded-2xl border border-[#1C1C1E] bg-[#0A0A0A] p-6 space-y-4"
          >
            <div>
              <h2 className="text-[20px] font-semibold text-[#F5F5F7] tracking-[-0.01em]">NEO VB1</h2>
              <p className="text-[13px] font-medium text-[#8E8E93] mt-1">Simple. Preciso. Sostenible.</p>
            </div>
            <p className="text-[13px] font-light leading-relaxed text-[#636366]">
              Pensado para personas que están empezando o que buscan una experiencia más simple y clara.
            </p>
            <motion.button
              whileTap={{ scale: 0.985 }}
              onClick={() => setShowVB1Flow(true)}
              className="w-full h-[48px] rounded-xl bg-[#F5F5F7] text-black text-[14px] font-medium tracking-[0.01em]"
            >
              Acceder a VB1
            </motion.button>
          </motion.div>

          {/* VB2 */}
          <motion.div
            variants={fadeUp}
            className="rounded-2xl border border-[#1C1C1E] bg-[#0A0A0A] p-6 space-y-4"
          >
            <div>
              <h2 className="text-[20px] font-semibold text-[#F5F5F7] tracking-[-0.01em]">NEO VB2</h2>
              <p className="text-[13px] font-medium text-[#8E8E93] mt-1">Máxima precisión. Máxima exigencia.</p>
            </div>
            <p className="text-[13px] font-light leading-relaxed text-[#636366]">
              Diseñado para usuarios que quieren un análisis más profundo, más variables y un nivel superior de precisión.
            </p>
            <motion.button
              whileTap={{ scale: 0.985 }}
              onClick={() => setShowVB2Modal(true)}
              className="w-full h-[48px] rounded-xl border border-[#2C2C2E] bg-transparent text-[#F5F5F7] text-[14px] font-medium tracking-[0.01em]"
            >
              Solicitar acceso a VB2
            </motion.button>
          </motion.div>
        </div>
      </motion.div>

      {/* VB2 Warning Modal */}
      <AnimatePresence>
        {showVB2Modal && (
          <VB2WarningModal
            onContinueVB2={() => { setShowVB2Modal(false); setShowVB2Flow(true); }}
            onGoToVB1={() => { setShowVB2Modal(false); setShowVB1Flow(true); }}
            onClose={() => setShowVB2Modal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─── VB2 Warning Modal ─── */

interface VB2WarningModalProps {
  onContinueVB2: () => void;
  onGoToVB1: () => void;
  onClose: () => void;
}

const modalContentVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.2 },
  },
  exit: {},
};

const modalItemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const bulletVariants = {
  hidden: { opacity: 0, x: -6 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const VB2WarningModal = ({ onContinueVB2, onGoToVB1, onClose }: VB2WarningModalProps) => {
  return (
    <>
      {/* Overlay */}
      <motion.div
        className="fixed inset-0 z-[60]"
        style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        className="fixed inset-0 z-[70] flex items-center justify-center px-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={onClose}
      >
        <motion.div
          className="w-full max-w-[360px] bg-[#0C0C0C] border border-[#1C1C1E] rounded-3xl p-7 overflow-y-auto max-h-[85vh]"
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          onClick={e => e.stopPropagation()}
        >
          <motion.div
            variants={modalContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-6"
          >
            {/* Title */}
            <motion.h2
              variants={modalItemVariants}
              className="text-[22px] font-semibold text-[#F5F5F7] tracking-[-0.01em]"
            >
              VB2 requiere más de ti
            </motion.h2>

            {/* Subtitle */}
            <motion.p
              variants={modalItemVariants}
              className="text-[14px] font-medium text-[#8E8E93] -mt-2"
            >
              Más precisión. Más análisis. Más exigencia.
            </motion.p>

            {/* Body */}
            <motion.div variants={modalItemVariants} className="space-y-4">
              <p className="text-[13px] font-light leading-[1.7] text-[#A1A1A6]">
                NEO VB2 está diseñado para atletas avanzados o para personas que quieren trabajar con un nivel de precisión mucho mayor. Incluye un análisis más exhaustivo, más preguntas y posible revisión manual por parte del equipo.
              </p>
              <p className="text-[13px] font-light leading-[1.7] text-[#A1A1A6]">
                Para aprovecharlo de verdad, necesitas tomarte en serio el entrenamiento, la nutrición, la recuperación y el seguimiento diario.
              </p>
              <p className="text-[13px] font-light leading-[1.7] text-[#A1A1A6]">
                Si buscas una experiencia más simple, VB1 probablemente sea tu mejor opción.
              </p>
            </motion.div>

            {/* 1:1 Advisory note */}
            <motion.div variants={modalItemVariants} className="rounded-xl border border-[#1C1C1E] bg-[#111111] p-4">
              <p className="text-[12px] font-light leading-[1.7] text-[#8E8E93]">
                VB2 funciona como una asesoría 1:1 con Pablo. NEO será la herramienta principal para medir métricas, ajustar decisiones y trabajar con un nivel de precisión superior al de un seguimiento 1:1 tradicional.
              </p>
            </motion.div>

            {/* Bullets */}
            <motion.ul variants={modalItemVariants} className="space-y-3 py-1">
              {BULLETS.map((bullet, i) => (
                <motion.li
                  key={i}
                  variants={bulletVariants}
                  className="flex items-start gap-3"
                >
                  <span className="mt-[7px] w-[5px] h-[5px] rounded-full bg-[#48484A] flex-shrink-0" />
                  <span className="text-[13px] font-light text-[#A1A1A6] leading-snug">{bullet}</span>
                </motion.li>
              ))}
            </motion.ul>

            {/* Buttons */}
            <motion.div variants={modalItemVariants} className="space-y-3 pt-2">
              <motion.button
                whileTap={{ scale: 0.985 }}
                onClick={onContinueVB2}
                className="w-full h-[48px] rounded-xl bg-[#F5F5F7] text-black text-[14px] font-medium tracking-[0.01em]"
              >
                Continuar a VB2
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.985 }}
                onClick={onGoToVB1}
                className="w-full h-[44px] rounded-xl text-[#636366] text-[13px] font-medium tracking-[0.01em]"
              >
                Ir a VB1
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </>
  );
};
