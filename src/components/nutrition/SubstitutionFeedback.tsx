import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';

interface SubstitutionFeedbackProps {
  isVisible: boolean;
  oldFood: string;
  newFood: string;
  calorieChange: number;
  onComplete: () => void;
}

export const SubstitutionFeedback = ({
  isVisible,
  oldFood,
  newFood,
  calorieChange,
  onComplete
}: SubstitutionFeedbackProps) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onComplete, 2500);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50"
        >
          <motion.div
            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3"
            initial={{ boxShadow: '0 0 0 0 rgba(34, 197, 94, 0.4)' }}
            animate={{ 
              boxShadow: [
                '0 0 0 0 rgba(34, 197, 94, 0.4)',
                '0 0 0 20px rgba(34, 197, 94, 0)',
                '0 0 0 0 rgba(34, 197, 94, 0)'
              ]
            }}
            transition={{ duration: 1.5, repeat: 1 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
            >
              <Check className="w-6 h-6" />
            </motion.div>
            
            <div>
              <motion.div 
                className="font-bold text-sm flex items-center gap-1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Sparkles className="w-4 h-4" />
                ¡Dieta ajustada!
              </motion.div>
              
              <motion.div 
                className="text-xs opacity-90"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {oldFood} → {newFood}
              </motion.div>
              
              {Math.abs(calorieChange) > 5 && (
                <motion.div 
                  className="text-[10px] opacity-80 mt-0.5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {calorieChange > 0 ? '+' : ''}{calorieChange} kcal ajustados
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
