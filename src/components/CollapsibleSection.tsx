import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

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

export const CollapsibleSection = ({
  isOpen, onToggle, icon: Icon, title, subtitle, gradient, delay = 0, children
}: CollapsibleSectionProps) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay }}
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
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg", isOpen ? "bg-white/20" : "bg-primary/10")}>
          <Icon className={cn("w-5 h-5", isOpen ? "text-white" : "text-primary")} />
        </div>
        <div className="text-left">
          <h3 className={cn("font-semibold", isOpen ? "text-white" : "text-foreground")}>
            {title}
          </h3>
          <p className={cn("text-xs", isOpen ? "text-white/80" : "text-muted-foreground")}>
            {subtitle}
          </p>
        </div>
      </div>
      <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
        <ChevronDown className={cn("w-5 h-5", isOpen ? "text-white" : "text-muted-foreground")} />
      </motion.div>
    </motion.button>

    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="overflow-hidden"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
);
