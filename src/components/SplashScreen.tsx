import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

const statusMessages = [
  'Initializing system',
  'Calibrating performance',
  'Preparing NEO',
];

export const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => {
        if (prev >= statusMessages.length - 1) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 600);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: '#000' }}
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0.6, delay: 1.8, ease: [0.25, 0.46, 0.45, 0.94] }}
      onAnimationComplete={onComplete}
    >
      <div className="flex flex-col items-center gap-6">
        {/* NEO logo */}
        <motion.span
          className="text-[2.8rem] font-bold tracking-[0.08em] text-white select-none"
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{
            opacity: [0, 1, 1, 0.85, 1],
            scale: [0.96, 1, 1, 1, 1],
          }}
          transition={{
            duration: 1.8,
            times: [0, 0.25, 0.5, 0.75, 1],
            ease: 'easeOut',
          }}
        >
          NEO
        </motion.span>

        {/* Status text */}
        <div className="h-5 relative flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={messageIndex}
              className="text-[11px] tracking-[0.2em] uppercase text-white/40 font-medium"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              {statusMessages[messageIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};
