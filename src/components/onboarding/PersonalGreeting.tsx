import { useEffect } from 'react';
import { motion } from 'framer-motion';

interface PersonalGreetingProps {
  firstName: string;
  onComplete: () => void;
}

/**
 * Pre-roll fase 2: microescena premium personalizada.
 * "Bienvenido, {firstName}." Dura ~2.6s y luego cede paso
 * a la intro principal (SplashScreen) sin modificarla.
 */
export const PersonalGreeting = ({ firstName, onComplete }: PersonalGreetingProps) => {
  useEffect(() => {
    const t = setTimeout(onComplete, 2600);
    return () => clearTimeout(t);
  }, [onComplete]);

  const ease: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

  return (
    <div className="fixed inset-0 z-[300] bg-black flex items-center justify-center px-7 overflow-hidden">
      {/* Halo ambiente — coherente con el universo de la intro */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease }}
        style={{
          background:
            'radial-gradient(ellipse 55% 40% at 50% 48%, rgba(255,255,255,0.05) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-3 text-center">
        <motion.span
          initial={{ opacity: 0, y: 8, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease }}
          className="text-[11px] tracking-[0.32em] uppercase font-medium"
          style={{ color: 'rgba(255,255,255,0.42)' }}
        >
          Bienvenido
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 14, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 1.0, delay: 0.35, ease }}
          className="text-[36px] md:text-[44px] font-semibold tracking-[-0.03em] leading-[1.1]"
          style={{ color: '#fff' }}
        >
          {firstName}
        </motion.h1>

        {/* línea de acento sutil */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.9, ease }}
          className="mt-3 h-px w-16 origin-center"
          style={{ background: 'rgba(255,255,255,0.4)' }}
        />
      </div>

      {/* Fade-out al final para empalmar suavemente con el SplashScreen */}
      <motion.div
        className="absolute inset-0 bg-black pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 1] }}
        transition={{ duration: 2.6, times: [0, 0.82, 1], ease: 'easeIn' }}
      />
    </div>
  );
};
