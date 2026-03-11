import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronRight, X } from 'lucide-react';
import { activateVB2 } from '@/lib/activateVB2';
import { useVB2FollowUp } from '@/hooks/useVB2FollowUp';
import { VB2Questionnaire } from '@/components/onboarding/VB2Questionnaire';

const BULLETS = [
  'Análisis más profundo de métricas',
  'Seguimiento 1:1 con Pablo',
  'Ajustes de mayor precisión',
  'Revisión manual de tu perfil',
];

export const VB2ActivationCTA = () => {
  const { data, loading } = useVB2FollowUp();
  const [showWarning, setShowWarning] = useState(false);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [activating, setActivating] = useState(false);
  const [activated, setActivated] = useState(false);

  // Don't render if loading or VB2 already enabled
  if (loading || data?.vb2_enabled) return null;

  // Full-screen VB2 questionnaire flow
  if (showQuestionnaire) {
    return (
      <VB2Questionnaire
        onComplete={() => {
          setShowQuestionnaire(false);
          setActivated(true);
        }}
        onBack={() => setShowQuestionnaire(false)}
      />
    );
  }

  // Success state after activation
  if (activated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-[#1C1C1E] bg-[#0A0A0A] p-5 space-y-3"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#F5F5F7]" />
          <span className="text-[14px] font-semibold text-[#F5F5F7]">VB2 activado</span>
        </div>
        <p className="text-[13px] font-medium text-[#8E8E93]">Seguimiento asignado</p>
        <p className="text-[12px] font-light text-[#636366] leading-relaxed">
          Tu perfil VB2 está activo. Asesoría 1:1 con Pablo asignada automáticamente. La sección de seguimiento aparecerá tras recargar.
        </p>
      </motion.div>
    );
  }

  return (
    <>
      {/* CTA Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-[#1C1C1E] bg-[#0A0A0A] overflow-hidden"
      >
        <button
          onClick={() => setShowWarning(true)}
          className="w-full p-5 flex items-center gap-4 text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-[#F5F5F7] flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-black" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-[#F5F5F7]">Activar NEO VB2</p>
            <p className="text-[12px] font-light text-[#636366] mt-0.5">
              Máxima precisión · Asesoría 1:1
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-[#48484A] flex-shrink-0" />
        </button>
      </motion.div>

      {/* Warning / Explanation Modal */}
      <AnimatePresence>
        {showWarning && (
          <>
            <motion.div
              className="fixed inset-0 z-[60]"
              style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setShowWarning(false)}
            />
            <motion.div
              className="fixed inset-0 z-[70] flex items-center justify-center px-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setShowWarning(false)}
            >
              <motion.div
                className="w-full max-w-[360px] bg-[#0C0C0C] border border-[#1C1C1E] rounded-3xl p-7 overflow-y-auto max-h-[85vh]"
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                onClick={e => e.stopPropagation()}
              >
                <div className="space-y-5">
                  {/* Close */}
                  <div className="flex justify-end -mt-1 -mr-1">
                    <button onClick={() => setShowWarning(false)} className="text-[#3A3A3C] hover:text-[#8E8E93] transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Title */}
                  <div>
                    <h2 className="text-[22px] font-semibold text-[#F5F5F7] tracking-[-0.01em]">
                      NEO VB2
                    </h2>
                    <p className="text-[13px] font-medium text-[#8E8E93] mt-1">
                      Máxima precisión. Máxima exigencia.
                    </p>
                  </div>

                  {/* Description */}
                  <p className="text-[13px] font-light leading-[1.7] text-[#A1A1A6]">
                    VB2 está diseñado para atletas que buscan un análisis más profundo, más variables y un seguimiento 1:1 con Pablo. Incluye revisión manual y ajustes de mayor precisión.
                  </p>

                  {/* Advisory note */}
                  <div className="rounded-xl border border-[#1C1C1E] bg-[#111111] p-4">
                    <p className="text-[12px] font-light leading-[1.7] text-[#8E8E93]">
                      VB2 funciona como una asesoría 1:1 con Pablo. NEO será la herramienta principal para medir métricas, ajustar decisiones y trabajar con mayor precisión.
                    </p>
                  </div>

                  {/* Bullets */}
                  <ul className="space-y-2.5">
                    {BULLETS.map((b, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="mt-[7px] w-[5px] h-[5px] rounded-full bg-[#48484A] flex-shrink-0" />
                        <span className="text-[13px] font-light text-[#A1A1A6] leading-snug">{b}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Actions */}
                  <div className="space-y-3 pt-1">
                    <motion.button
                      whileTap={{ scale: 0.985 }}
                      onClick={() => {
                        setShowWarning(false);
                        setShowQuestionnaire(true);
                      }}
                      className="w-full h-[48px] rounded-xl bg-[#F5F5F7] text-black text-[14px] font-medium tracking-[0.01em]"
                    >
                      Comenzar activación VB2
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.985 }}
                      onClick={() => setShowWarning(false)}
                      className="w-full h-[44px] rounded-xl text-[#636366] text-[13px] font-medium tracking-[0.01em]"
                    >
                      Ahora no
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
