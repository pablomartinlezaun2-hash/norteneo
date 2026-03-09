import { useRef } from 'react';
import { motion } from 'framer-motion';

interface NeoAssistantProps {
  onComplete: () => void;
  onSkip: () => void;
}

export const NeoAssistant = ({ onComplete, onSkip }: NeoAssistantProps) => {
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
      transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
    },
  };

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
              className="w-full h-[48px] rounded-xl border border-[#2C2C2E] bg-transparent text-[#F5F5F7] text-[14px] font-medium tracking-[0.01em]"
            >
              Solicitar acceso a VB2
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};
