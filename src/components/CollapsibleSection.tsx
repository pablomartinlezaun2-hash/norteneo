import { useState, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
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
    initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
    transition={{ delay, duration: 0.5, ease: premiumEase }}
    className="rounded-xl border border-border overflow-hidden"
  >
    <motion.button
      onClick={onToggle}
      className={cn(
        "w-full p-4 flex items-center justify-between transition-all duration-300",
        isOpen
          ? `bg-gradient-to-r ${gradient} text-white`
          : "bg-card hover:border-primary/50"
      )}
      whileTap={{ scale: 0.985 }}
    >
      <div className="flex items-center gap-3">
        <motion.div
          className={cn("p-2 rounded-lg", isOpen ? "bg-white/20" : "bg-primary/10")}
          animate={isOpen ? { scale: [1, 1.08, 1] } : {}}
          transition={{ duration: 0.4, ease: premiumEase }}
        >
          <Icon className={cn("w-5 h-5", isOpen ? "text-white" : "text-primary")} />
        </motion.div>
        <div className="text-left">
          <h3 className={cn("font-semibold", isOpen ? "text-white" : "text-foreground")}>
            {title}
          </h3>
          <p className={cn("text-xs", isOpen ? "text-white/80" : "text-muted-foreground")}>
            {subtitle}
          </p>
        </div>
      </div>
      <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.24, ease: premiumEase }}>
        <ChevronDown className={cn("w-5 h-5", isOpen ? "text-white" : "text-muted-foreground")} />
      </motion.div>
    </motion.button>

    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.36, ease: premiumEase }}
          className="overflow-hidden"
        >
          <motion.div
            initial={{ y: 10, opacity: 0, filter: 'blur(3px)' }}
            animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.32, delay: 0.1, ease: premiumEase }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
));

CollapsibleSection.displayName = 'CollapsibleSection';
