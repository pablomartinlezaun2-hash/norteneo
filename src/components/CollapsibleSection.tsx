import { useState, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const premiumEase = [0.25, 0.46, 0.45, 0.94] as const;

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
    transition={{ delay, duration: 0.4, ease: premiumEase }}
    className={cn(
      "rounded-2xl overflow-hidden transition-all duration-300",
      isOpen
        ? "neo-surface-elevated"
        : "neo-surface hover:border-border"
    )}
  >
    <motion.button
      onClick={onToggle}
      className="w-full px-5 py-4 flex items-center justify-between"
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-center gap-3.5">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
          isOpen ? "bg-foreground" : "bg-muted"
        )}>
          <Icon className={cn(
            "w-[18px] h-[18px] transition-colors duration-300",
            isOpen ? "text-background" : "text-muted-foreground"
          )} />
        </div>
        <div className="text-left">
          <h3 className="text-title text-foreground">{title}</h3>
          <p className="text-caption text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
      </div>
      <motion.div 
        animate={{ rotate: isOpen ? 90 : 0 }} 
        transition={{ duration: 0.2, ease: premiumEase }}
      >
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </motion.div>
    </motion.button>

    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: premiumEase }}
          className="overflow-hidden"
        >
          <div className="h-px bg-border/50 mx-5" />
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.08, ease: premiumEase }}
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
