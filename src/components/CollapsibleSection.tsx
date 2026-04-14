import { useState, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const ease: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

interface CollapsibleSectionProps {
  isOpen: boolean;
  onToggle: () => void;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  gradient: string;
  delay?: number;
  children: React.ReactNode;
}

export const CollapsibleSection = forwardRef<HTMLDivElement, CollapsibleSectionProps>(({
  isOpen, onToggle, icon: Icon, title, subtitle, gradient, delay = 0, children
}, ref) => (
  <motion.div
    ref={ref}
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4, ease }}
    className={cn(
      "overflow-hidden transition-all duration-300",
      isOpen ? "neo-surface-elevated" : "neo-module-card"
    )}
  >
    <motion.button
      onClick={onToggle}
      className="w-full px-5 py-4 flex items-center justify-between"
      whileTap={{ scale: 0.995 }}
    >
      <div className="flex items-center gap-3.5">
        <div className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300",
          isOpen ? "bg-foreground" : "bg-surface-2"
        )}>
          <Icon className={cn(
            "w-[16px] h-[16px] transition-colors duration-300",
            isOpen ? "text-background" : "text-muted-foreground"
          )} />
        </div>
        <div className="text-left">
          <h3 className="text-[15px] font-semibold text-foreground tracking-[-0.01em]">{title}</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5 tracking-[-0.005em]">{subtitle}</p>
        </div>
      </div>
      <motion.div
        animate={{ rotate: isOpen ? 90 : 0 }}
        transition={{ duration: 0.25, ease }}
      >
        <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
      </motion.div>
    </motion.button>

    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.35, ease }}
          className="overflow-hidden"
        >
          <div className="h-px mx-5" style={{ background: 'hsl(var(--border) / 0.3)' }} />
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.08, ease }}
            className="p-5"
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
));

CollapsibleSection.displayName = 'CollapsibleSection';
