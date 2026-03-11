import { CoachChatView } from '@/components/coach/CoachChatView';

/**
 * Athlete-side chat section. Renders the chat view with their assigned coach.
 * No counterpartProfileId needed — the hook resolves the coach automatically.
 */
export const AthleteChatSection = () => {
  return (
    <div className="px-4 pt-4">
      <CoachChatView
        counterpartProfileId={null}
        counterpartName="Tu Coach"
        onBack={() => {
          // Navigate back to workouts via custom event
          window.dispatchEvent(new CustomEvent('neo-nav', { detail: 'workouts' }));
        }}
      />
    </div>
  );
};
