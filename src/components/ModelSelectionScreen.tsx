import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Zap, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModelSelectionScreenProps {
  onSelectVB1: () => void;
  onSelectVB2: () => void;
}

export const ModelSelectionScreen = ({ onSelectVB1, onSelectVB2 }: ModelSelectionScreenProps) => {
  const [expandedCard, setExpandedCard] = useState<'vb1' | 'vb2' | null>(null);

  const toggleCard = (card: 'vb1' | 'vb2') => {
    setExpandedCard(expandedCard === card ? null : card);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center px-6 py-12 overflow-auto">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.2 }}
        className="mb-16"
      >
        <div className="bg-white/95 rounded-[14px] px-5 py-2">
          <span className="text-xl font-bold tracking-[0.2em] text-black">NEO</span>
        </div>
      </motion.div>

      {/* Title & Subtitle */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.4 }}
        className="text-center mb-14 max-w-md"
      >
        <h1 className="text-[32px] font-semibold tracking-[-0.02em] text-white mb-4">
          Elige tu modelo
        </h1>
        <p className="text-[15px] leading-relaxed text-white/50 font-light">
          Dos formas de entrar en NEO. Una pensada para empezar bien. Otra diseñada para llevar el rendimiento al máximo nivel.
        </p>
      </motion.div>

      {/* Cards Container */}
      <div className="w-full max-w-md space-y-4">
        {/* VB1 Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.6 }}
        >
          <ModelCard
            id="vb1"
            title="NEO VB1"
            subtitle="Simple. Preciso. Sostenible."
            icon={<Target className="w-5 h-5" />}
            isExpanded={expandedCard === 'vb1'}
            onToggle={() => toggleCard('vb1')}
            onSelect={onSelectVB1}
            buttonText="Acceder a VB1"
            description="Pensado para personas que están empezando, llevan poco tiempo entrenando o simplemente quieren una experiencia más simple, clara y eficaz. NEO VB1 organiza el entrenamiento, la nutrición y el seguimiento sin exigir un nivel avanzado de control."
            bullets={[
              "Entrenamiento estructurado",
              "Nutrición clara y sencilla",
              "Seguimiento limpio y útil",
              "Menos preguntas, menos fricción"
            ]}
            variant="standard"
          />
        </motion.div>

        {/* VB2 Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.75 }}
        >
          <ModelCard
            id="vb2"
            title="NEO VB2"
            subtitle="Máxima precisión. Máxima exigencia."
            icon={<Zap className="w-5 h-5" />}
            isExpanded={expandedCard === 'vb2'}
            onToggle={() => toggleCard('vb2')}
            onSelect={onSelectVB2}
            buttonText="Solicitar acceso a VB2"
            description="Diseñado para atletas avanzados o usuarios que quieren llevar su rendimiento al máximo nivel. NEO VB2 analiza más variables, predice fatiga, detecta patrones de rendimiento y puede reajustar automáticamente entrenamiento y nutrición."
            bullets={[
              "Predicción de fatiga",
              "Ajustes automáticos del plan",
              "Recomendaciones activas",
              "Mayor precisión y análisis más profundo"
            ]}
            variant="advanced"
          />
        </motion.div>
      </div>

      {/* Bottom spacer */}
      <div className="h-8" />
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   MODEL CARD COMPONENT
   ═══════════════════════════════════════════════════════ */

interface ModelCardProps {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  onSelect: () => void;
  buttonText: string;
  description: string;
  bullets: string[];
  variant: 'standard' | 'advanced';
}

const ModelCard = ({
  title,
  subtitle,
  icon,
  isExpanded,
  onToggle,
  onSelect,
  buttonText,
  description,
  bullets,
  variant
}: ModelCardProps) => {
  const isAdvanced = variant === 'advanced';

  return (
    <motion.div
      className={cn(
        "relative rounded-2xl border overflow-hidden transition-colors duration-300",
        isExpanded 
          ? "border-white/20 bg-white/[0.03]" 
          : "border-white/8 bg-white/[0.02] hover:border-white/12 hover:bg-white/[0.025]"
      )}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
    >
      {/* Subtle glow effect for advanced variant */}
      {isAdvanced && (
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        </div>
      )}

      {/* Header - Always visible */}
      <button
        onClick={onToggle}
        className="w-full p-6 flex items-start justify-between text-left"
      >
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
            isAdvanced 
              ? "bg-white/10 text-white" 
              : "bg-white/6 text-white/70"
          )}>
            {icon}
          </div>

          {/* Title & Subtitle */}
          <div>
            <h2 className={cn(
              "text-lg font-semibold tracking-[-0.01em] mb-1",
              isAdvanced ? "text-white" : "text-white/90"
            )}>
              {title}
            </h2>
            <p className="text-[13px] text-white/40 font-light">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Chevron */}
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-white/30 mt-1"
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </button>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ 
              height: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
              opacity: { duration: 0.25, delay: 0.1 }
            }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-0">
              {/* Separator */}
              <div className="h-px bg-white/6 mb-5" />

              {/* Description */}
              <p className="text-[14px] leading-[1.7] text-white/45 font-light mb-5">
                {description}
              </p>

              {/* Bullets */}
              <ul className="space-y-2.5 mb-6">
                {bullets.map((bullet, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ 
                      duration: 0.3, 
                      delay: 0.15 + index * 0.05,
                      ease: [0.25, 0.46, 0.45, 0.94]
                    }}
                    className="flex items-center gap-3"
                  >
                    <div className={cn(
                      "w-1 h-1 rounded-full",
                      isAdvanced ? "bg-white/50" : "bg-white/30"
                    )} />
                    <span className="text-[13px] text-white/55 font-light">
                      {bullet}
                    </span>
                  </motion.li>
                ))}
              </ul>

              {/* CTA Button */}
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect();
                }}
                className={cn(
                  "w-full h-[52px] rounded-xl font-medium text-[14px] tracking-[0.01em] transition-all duration-200",
                  isAdvanced
                    ? "bg-white text-black hover:bg-white/90"
                    : "bg-white/10 text-white hover:bg-white/15 border border-white/10"
                )}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.1 }}
              >
                {buttonText}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
