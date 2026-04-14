import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Waves, Clock, Flame, Target, CheckCircle2, Loader2, BarChart3, Plus, Gauge, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useActivityCompletions } from '@/hooks/useActivityCompletions';
import { useCardioLogs } from '@/hooks/useCardioLogs';
import { ActivityProgressChart } from './ActivityProgressChart';
import { CardioLogForm } from './CardioLogForm';
import { CardioProgressChart } from './CardioProgressChart';
import { SessionDetailView } from './cardio/SessionDetailView';
import { formatPace } from './cardio/paceUtils';
import { format } from 'date-fns';
import { es, enUS, fr, de, type Locale } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

const dateLocales: Record<string, Locale> = { es, en: enUS, fr, de };
const ease: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

export const SwimmingSection = () => {
  const { t, i18n } = useTranslation();
  const dateLoc = dateLocales[i18n.language] || es;
  const { completions, markComplete, getCompletionCount, getTotalCompletions, getLastCompletion } = useActivityCompletions('swimming');
  const { sessions, saveSession, deleteSession, updateSession } = useCardioLogs('swimming');
  const [selectedWorkout, setSelectedWorkout] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  const workouts = [
    { id: 'tecnica-crol', name: 'Técnica de Crol', duration: '45 min', calories: '400-500', description: 'Enfocado en mejorar la técnica de brazada y respiración bilateral.', sets: ['400m calentamiento variado', '4x100m crol técnico (descanso 20s)', '4x50m patada con tabla (descanso 15s)', '4x50m brazos con pull buoy (descanso 15s)', '200m vuelta a la calma'] },
    { id: 'resistencia', name: 'Resistencia', duration: '60 min', calories: '600-700', description: 'Entrenamiento de resistencia aeróbica en el agua.', sets: ['300m calentamiento', '5x200m ritmo constante (descanso 30s)', '4x100m progresivo (descanso 20s)', '300m vuelta a la calma'] },
    { id: 'intervalos', name: 'Intervalos', duration: '50 min', calories: '500-600', description: 'Series de alta intensidad para mejorar velocidad.', sets: ['400m calentamiento', '8x50m sprint (descanso 30s)', '4x100m ritmo fuerte (descanso 45s)', '4x25m máxima velocidad (descanso 20s)', '200m vuelta a la calma'] }
  ];

  const handleComplete = async () => {
    if (!isCompleted || !selectedWorkout) return;
    setCompleting(true);
    const result = await markComplete(selectedWorkout);
    setCompleting(false);
    if (!result.error) { setIsCompleted(false); setSelectedWorkout(null); setShowConfirmation(true); setTimeout(() => setShowConfirmation(false), 2000); }
  };

  const formatPaceLocal = (seconds: number) => formatPace(seconds);

  return (
    <motion.div
      className="space-y-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center">
            <Waves className="w-[18px] h-[18px] text-background" />
          </div>
          <div>
            <h2 className="text-[19px] font-bold text-foreground tracking-[-0.02em]">{t('swimmingSection.title')}</h2>
            <p className="text-[13px] text-muted-foreground">
              {t('swimmingSection.sessionsAndLogs', { sessions: getTotalCompletions(), logs: sessions.length })}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Action pills */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.3, ease }}
        className="flex gap-2"
      >
        <motion.button
          onClick={() => { setShowLogForm(!showLogForm); setShowStats(false); }}
          className={cn("neo-pill flex items-center gap-1.5", showLogForm && "bg-foreground text-background")}
          whileTap={{ scale: 0.96 }}
        >
          <Plus className="w-3.5 h-3.5" />{t('swimmingSection.register')}
        </motion.button>
        <motion.button
          onClick={() => { setShowStats(!showStats); setShowLogForm(false); }}
          className={cn("neo-pill flex items-center gap-1.5", showStats && "bg-foreground text-background")}
          whileTap={{ scale: 0.96 }}
        >
          <BarChart3 className="w-3.5 h-3.5" />Stats
        </motion.button>
      </motion.div>

      <AnimatePresence>{showLogForm && <CardioLogForm activityType="swimming" onSave={saveSession} onClose={() => setShowLogForm(false)} />}</AnimatePresence>

      <AnimatePresence>
        {showStats && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, ease }} className="space-y-4 overflow-hidden">
            <CardioProgressChart sessions={sessions} activityType="swimming" />
            <ActivityProgressChart completions={completions} activityType="swimming" workoutNames={workouts.map(w => w.id)} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedSession && sessions.find(s => s.id === selectedSession) && (
          <SessionDetailView session={sessions.find(s => s.id === selectedSession)!} activityType="swimming" onClose={() => setSelectedSession(null)} onDelete={deleteSession} onUpdate={updateSession} />
        )}
      </AnimatePresence>

      {/* Recent Logs */}
      {sessions.length > 0 && !showStats && !selectedSession && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.3, ease }}
          className="space-y-2"
        >
          <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-[0.04em] flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5" />{t('swimmingSection.recentLogs')}
          </h3>
          {sessions.slice(0, 3).map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.05, duration: 0.3, ease }}
              className="neo-module-card px-4 py-3 flex items-center justify-between cursor-pointer"
              onClick={() => setSelectedSession(s.id)}
            >
              <div>
                <p className="text-[14px] font-medium text-foreground">{s.session_name || t('swimmingSection.sessionDefault')}</p>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  {format(new Date(s.completed_at), "d MMM", { locale: dateLoc })} · {Number(s.total_distance_m).toFixed(0)} m
                  {s.avg_pace_seconds_per_unit ? ` · ${formatPaceLocal(Number(s.avg_pace_seconds_per_unit))}/100m` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {s.intervals && s.intervals.length > 0 && (
                  <span className="neo-pill text-[10px] px-2 py-0.5">{s.intervals.length} series</span>
                )}
                <Eye className="w-3.5 h-3.5 text-muted-foreground/40" />
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Workout cards */}
      {workouts.map((workout, index) => {
        const completionCount = getCompletionCount(workout.id);
        const lastCompletion = getLastCompletion(workout.id);
        const isSelected = selectedWorkout === workout.id;
        return (
          <motion.div
            key={workout.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + index * 0.06, duration: 0.35, ease }}
            onClick={() => setSelectedWorkout(isSelected ? null : workout.id)}
            className={cn(
              "cursor-pointer overflow-hidden transition-all duration-300",
              isSelected ? "neo-surface-elevated" : "neo-module-card"
            )}
          >
            <div className="px-4 py-3.5">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="text-[15px] font-semibold text-foreground tracking-[-0.01em]">{workout.name}</h4>
                  <p className="text-[12px] text-muted-foreground mt-0.5">{workout.description}</p>
                </div>
                {completionCount > 0 && (
                  <span className="neo-pill text-[10px] px-2 py-0.5 ml-3">{completionCount}x</span>
                )}
              </div>

              <div className="flex gap-3 mb-3">
                <div className="flex items-center gap-1 text-[12px] text-muted-foreground"><Clock className="w-3.5 h-3.5" />{workout.duration}</div>
                <div className="flex items-center gap-1 text-[12px] text-muted-foreground"><Flame className="w-3.5 h-3.5" />{workout.calories} kcal</div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.04em]">
                  <Target className="w-3 h-3" />{t('swimmingSection.seriesLabel')}
                </div>
                <ul className="space-y-1 pl-3.5">
                  {workout.sets.map((set, i) => (
                    <li key={i} className="text-[12px] text-muted-foreground/80 list-disc">{set}</li>
                  ))}
                </ul>
              </div>

              {lastCompletion && (
                <p className="text-[11px] text-muted-foreground/60 mt-2">
                  {t('swimmingSection.lastCompleted')}: {format(new Date(lastCompletion.completed_at), "d 'de' MMMM", { locale: dateLoc })}
                </p>
              )}
            </div>

            <AnimatePresence>
              {isSelected && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease }}
                  className="overflow-hidden"
                >
                  <div className="h-px mx-4" style={{ background: 'hsl(var(--border) / 0.3)' }} />
                  <div className="px-4 pb-4 pt-3">
                    <div className="flex items-center gap-3 mb-3">
                      <Checkbox id={`complete-${workout.id}`} checked={isCompleted} onCheckedChange={(checked) => setIsCompleted(checked === true)} onClick={(e) => e.stopPropagation()} className="border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                      <label htmlFor={`complete-${workout.id}`} className="text-[13px] font-medium text-foreground cursor-pointer" onClick={(e) => e.stopPropagation()}>
                        {t('swimmingSection.completedLabel')}
                      </label>
                    </div>
                    <motion.div whileTap={{ scale: 0.98 }}>
                      <Button onClick={(e) => { e.stopPropagation(); handleComplete(); }} disabled={!isCompleted || completing} className="w-full bg-foreground text-background font-semibold hover:bg-foreground/90 transition-all disabled:opacity-40 rounded-xl h-11 text-[14px]">
                        {completing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                        {t('swimmingSection.registerSession')}
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}

      <AnimatePresence>
        {showConfirmation && (
          <motion.div
            className="fixed bottom-24 left-4 right-4 p-4 neo-surface-elevated text-center z-50"
            style={{ border: '1px solid hsl(var(--success) / 0.3)' }}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease }}
          >
            <p className="text-[13px] text-[hsl(var(--success))] font-medium">{t('swimmingSection.swimmingRegistered')}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};