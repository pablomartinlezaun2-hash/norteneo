import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Loader2 } from 'lucide-react';
import { useAthleteChatInfo } from '@/hooks/useCoachChat';
import { ChatView } from './ChatView';

const premiumEase = [0.25, 0.46, 0.45, 0.94] as const;

/**
 * Athlete-side chat section. Shows in the athlete's profile or as a standalone section.
 * Resolves the coach automatically from the athlete's profile.
 */
export const AthleteChatSection = () => {
  const { coachId, myProfileId, loading, hasCoach } = useAthleteChatInfo();
  const [chatOpen, setChatOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (!hasCoach || !coachId || !myProfileId) {
    return (
      <div className="rounded-2xl border border-border/40 bg-card/30 p-6 text-center">
        <MessageCircle className="w-6 h-6 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Chat no disponible</p>
        <p className="text-[11px] text-muted-foreground/50 mt-1">
          Activa el modelo VB2 para acceder al chat con tu coach
        </p>
      </div>
    );
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
    <motion.button
      onClick={() => setChatOpen(true)}
      className="w-full rounded-2xl border border-border/40 bg-card/30 p-5 flex items-center gap-4 text-left transition-colors hover:bg-card/50 active:bg-card/60"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: premiumEase }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="w-10 h-10 rounded-full bg-foreground/10 flex items-center justify-center flex-shrink-0">
        <MessageCircle className="w-5 h-5 text-foreground/60" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">Chat con Coach</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Comunícate directamente con tu entrenador
        </p>
      </div>
    </motion.button>
  );
};
