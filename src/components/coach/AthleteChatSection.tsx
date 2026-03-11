import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Loader2, ChevronRight } from 'lucide-react';
import { useAthleteChatInfo } from '@/hooks/useCoachChat';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { ChatView } from './ChatView';
import { cn } from '@/lib/utils';

const premiumEase = [0.25, 0.46, 0.45, 0.94] as const;

/**
 * Athlete-side chat section.
 * Only renders if the athlete has an assigned coach.
 */
export const AthleteChatSection = () => {
  const { coachId, myProfileId, loading, hasCoach } = useAthleteChatInfo();
  const [chatOpen, setChatOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-4 h-4 text-muted-foreground/40 animate-spin" />
      </div>
    );
  }

  // Hide entirely if no coach
  if (!hasCoach || !coachId || !myProfileId) {
    return null;
  }

  if (chatOpen) {
    return (
      <ChatView
        athleteProfileId={myProfileId}
        coachProfileId={coachId}
        athleteName="Mi Coach"
        onBack={() => setChatOpen(false)}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: premiumEase, delay: 0.06 }}
    >
      <motion.button
        onClick={() => setChatOpen(true)}
        className="w-full rounded-2xl border border-border/30 bg-card/30 p-4 flex items-center gap-4 text-left transition-colors hover:bg-card/50 active:bg-card/60 group"
        whileTap={{ scale: 0.985 }}
      >
        <div className="w-11 h-11 rounded-2xl bg-foreground/[0.06] border border-border/20 flex items-center justify-center flex-shrink-0 transition-colors group-hover:bg-foreground/[0.1]">
          <MessageCircle className="w-5 h-5 text-foreground/50" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Seguimiento</p>
          <p className="text-[11px] text-muted-foreground/60 mt-0.5 leading-relaxed">
            Chat directo con tu coach
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground/30 flex-shrink-0 transition-transform group-hover:translate-x-0.5" />
      </motion.button>
    </motion.div>
  );
};
