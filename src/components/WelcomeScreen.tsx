import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, User, ChevronDown, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NeoAssistant } from './onboarding';

interface WelcomeScreenProps {
  onStartWithAssistant: () => void;
  onStartAlone: () => void;
}

export const WelcomeScreen = ({ onStartWithAssistant, onStartAlone }: WelcomeScreenProps) => {
  const [showNeoAssistant, setShowNeoAssistant] = useState(false);
  const [expandedOption, setExpandedOption] = useState<'assistant' | 'alone' | null>(null);

  const toggleOption = (option: 'assistant' | 'alone') => {
    setExpandedOption(expandedOption === option ? null : option);
  };

  const handleStartWithAssistant = () => {
    setShowNeoAssistant(true);
  };

  const handleNeoComplete = () => {
    setShowNeoAssistant(false);
    onStartWithAssistant();
  };

  const handleNeoSkip = () => {
    setShowNeoAssistant(false);
    onStartAlone();
  };

  // Show Neo Assistant full screen
  if (showNeoAssistant) {
    return <NeoAssistant onComplete={handleNeoComplete} onSkip={handleNeoSkip} />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <motion.div 
        className="w-full max-w-md space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {/* Logo */}
        <motion.div 
          className="text-center space-y-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="inline-flex items-center justify-center">
            <motion.div 
              className="bg-foreground rounded-2xl px-6 py-3"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <span className="text-3xl font-bold tracking-tight text-background">NEO</span>
            </motion.div>
          </div>
        </motion.div>

        {/* Welcome Message */}
        <motion.div 
          className="text-center space-y-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h1 className="text-2xl font-bold text-foreground">
            Bienvenido al entrenamiento del futuro
          </h1>
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <p className="text-sm text-muted-foreground">
              Elige cómo quieres comenzar
            </p>
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
        </motion.div>

        {/* Options */}
        <motion.div 
          className="space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          {/* Option 1: Start with Assistant */}
          <motion.div
            className={cn(
              "rounded-xl border overflow-hidden transition-all duration-300",
              expandedOption === 'assistant'
                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                : "border-border bg-card hover:bg-muted/50"
            )}
          >
            <button
              onClick={() => toggleOption('assistant')}
              className="w-full p-4 min-h-[56px] flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                  <Bot className="w-6 h-6 text-primary-foreground" />
                </div>
                <span className="font-semibold text-foreground">
                  Empezar con el asistente de NEO
                </span>
              </div>
              <motion.div
                animate={{ rotate: expandedOption === 'assistant' ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              </motion.div>
            </button>
            
            <AnimatePresence>
              {expandedOption === 'assistant' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 space-y-3">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Neo te dará la bienvenida, te guiará por todas las funciones de la app y te enseñará cómo sacarle el máximo partido.
                    </p>
                    <motion.button
                      onClick={handleStartWithAssistant}
                      className="w-full py-3.5 min-h-[44px] rounded-xl gradient-primary text-primary-foreground font-semibold text-sm"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Comenzar con Neo
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Option 2: Start Alone */}
          <motion.div
            className={cn(
              "rounded-xl border overflow-hidden transition-all duration-300",
              expandedOption === 'alone'
                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                : "border-border bg-card hover:bg-muted/50"
            )}
          >
            <button
              onClick={() => toggleOption('alone')}
              className="w-full p-4 min-h-[56px] flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                  <User className="w-6 h-6 text-muted-foreground" />
                </div>
                <span className="font-semibold text-foreground">
                  Empezar yo mismo
                </span>
              </div>
              <motion.div
                animate={{ rotate: expandedOption === 'alone' ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              </motion.div>
            </button>
            
            <AnimatePresence>
              {expandedOption === 'alone' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 space-y-3">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Explora la app por tu cuenta y descubre todas las funcionalidades a tu ritmo.
                    </p>
                    <motion.button
                      onClick={onStartAlone}
                      className="w-full py-3.5 min-h-[44px] rounded-xl bg-muted text-foreground font-semibold text-sm hover:bg-muted/80"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Explorar por mi cuenta
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};
