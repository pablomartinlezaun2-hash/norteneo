import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Waves, Clock, Flame, Target, CheckCircle2, Loader2, BarChart3, Plus, Gauge, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { es } from 'date-fns/locale';

export const SwimmingSection = () => {
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
    {
      id: 'tecnica-crol',
      name: 'Técnica de Crol',
      duration: '45 min',
      calories: '400-500',
      description: 'Enfocado en mejorar la técnica de brazada y respiración bilateral.',
      sets: [
        '400m calentamiento variado',
        '4x100m crol técnico (descanso 20s)',
        '4x50m patada con tabla (descanso 15s)',
        '4x50m brazos con pull buoy (descanso 15s)',
        '200m vuelta a la calma'
      ]
    },
    {
      id: 'resistencia',
      name: 'Resistencia',
      duration: '60 min',
      calories: '600-700',
      description: 'Entrenamiento de resistencia aeróbica en el agua.',
      sets: [
        '300m calentamiento',
        '5x200m ritmo constante (descanso 30s)',
        '4x100m progresivo (descanso 20s)',
        '300m vuelta a la calma'
      ]
    },
    {
      id: 'intervalos',
      name: 'Intervalos',
      duration: '50 min',
      calories: '500-600',
      description: 'Series de alta intensidad para mejorar velocidad.',
      sets: [
        '400m calentamiento',
        '8x50m sprint (descanso 30s)',
        '4x100m ritmo fuerte (descanso 45s)',
        '4x25m máxima velocidad (descanso 20s)',
        '200m vuelta a la calma'
      ]
    }
  ];

  const handleComplete = async () => {
    if (!isCompleted || !selectedWorkout) return;
    setCompleting(true);
    const result = await markComplete(selectedWorkout);
    setCompleting(false);
    if (!result.error) {
      setIsCompleted(false);
      setSelectedWorkout(null);
      setShowConfirmation(true);
      setTimeout(() => setShowConfirmation(false), 2000);
    }
  };

  const formatPaceLocal = (seconds: number) => formatPace(seconds);

  const itemVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="space-y-4"
      initial="initial"
      animate="animate"
      variants={{ animate: { transition: { staggerChildren: 0.1 } } }}
    >
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-cyan-500/10">
              <Waves className="w-6 h-6 text-cyan-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Natación</h2>
              <p className="text-sm text-muted-foreground">
                {getTotalCompletions()} sesiones · {sessions.length} registros
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setShowLogForm(!showLogForm); setShowStats(false); }}
              className={showLogForm ? 'bg-cyan-500 text-white hover:bg-cyan-600 border-cyan-500' : ''}
            >
              <Plus className="w-4 h-4 mr-1" />
              Registrar
            </Button>
            <Button
              variant={showStats ? "default" : "outline"}
              size="sm"
              onClick={() => { setShowStats(!showStats); setShowLogForm(false); }}
              className={showStats ? "bg-cyan-500 hover:bg-cyan-600" : ""}
            >
              <BarChart3 className="w-4 h-4 mr-1" />
              Stats
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Log Form */}
      <AnimatePresence>
        {showLogForm && (
          <CardioLogForm
            activityType="swimming"
            onSave={saveSession}
            onClose={() => setShowLogForm(false)}
          />
        )}
      </AnimatePresence>

      {/* Stats */}
      <AnimatePresence>
        {showStats && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <CardioProgressChart sessions={sessions} activityType="swimming" />
            <ActivityProgressChart
              completions={completions}
              activityType="swimming"
              workoutNames={workouts.map(w => w.id)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session Detail View */}
      <AnimatePresence>
        {selectedSession && sessions.find(s => s.id === selectedSession) && (
          <SessionDetailView
            session={sessions.find(s => s.id === selectedSession)!}
            activityType="swimming"
            onClose={() => setSelectedSession(null)}
            onDelete={deleteSession}
            onUpdate={updateSession}
          />
        )}
      </AnimatePresence>

      {/* Recent cardio logs */}
      {sessions.length > 0 && !showStats && !selectedSession && (
        <motion.div variants={itemVariants} className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-cyan-500" />
            Últimos registros
          </h3>
          {sessions.slice(0, 3).map(s => (
            <div
              key={s.id}
              className="gradient-card rounded-xl p-3 border border-border flex items-center justify-between cursor-pointer hover:border-cyan-500/30 transition-colors"
              onClick={() => setSelectedSession(s.id)}
            >
              <div>
                <p className="text-sm font-medium text-foreground">{s.session_name || 'Sesión'}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(s.completed_at), "d MMM", { locale: es })} · {Number(s.total_distance_m).toFixed(0)} m
                  {s.avg_pace_seconds_per_unit ? ` · ${formatPaceLocal(Number(s.avg_pace_seconds_per_unit))}/100m` : ''}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {s.intervals && s.intervals.length > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-500 font-medium">
                    {s.intervals.length} series
                  </span>
                )}
                <Eye className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {workouts.map((workout, index) => {
        const completionCount = getCompletionCount(workout.id);
        const lastCompletion = getLastCompletion(workout.id);
        const isSelected = selectedWorkout === workout.id;

        return (
          <motion.div key={workout.id} variants={itemVariants} transition={{ delay: index * 0.1 }}>
            <Card 
              className={`gradient-card border-border overflow-hidden transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setSelectedWorkout(isSelected ? null : workout.id)}
            >
              <CardHeader className="pb-2 cursor-pointer">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold text-foreground">{workout.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{workout.description}</p>
                  </div>
                  {completionCount > 0 && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">{completionCount}x</span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground"><Clock className="w-4 h-4" />{workout.duration}</div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground"><Flame className="w-4 h-4" />{workout.calories} kcal</div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Target className="w-4 h-4 text-primary" />Series
                  </div>
                  <ul className="space-y-1.5 pl-6">
                    {workout.sets.map((set, i) => (
                      <li key={i} className="text-sm text-muted-foreground list-disc">{set}</li>
                    ))}
                  </ul>
                </div>
                {lastCompletion && (
                  <p className="text-xs text-muted-foreground">
                    Último: {format(new Date(lastCompletion.completed_at), "d 'de' MMMM", { locale: es })}
                  </p>
                )}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pt-4 border-t border-border"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <Checkbox 
                          id={`complete-${workout.id}`}
                          checked={isCompleted}
                          onCheckedChange={(checked) => setIsCompleted(checked === true)}
                          onClick={(e) => e.stopPropagation()}
                          className="border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <label htmlFor={`complete-${workout.id}`} className="text-sm font-medium text-foreground cursor-pointer" onClick={(e) => e.stopPropagation()}>
                          He completado esta sesión
                        </label>
                      </div>
                      <Button 
                        onClick={(e) => { e.stopPropagation(); handleComplete(); }}
                        disabled={!isCompleted || completing}
                        className="w-full gradient-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        {completing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                        Registrar sesión
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}

      <AnimatePresence>
        {showConfirmation && (
          <motion.div 
            className="fixed bottom-24 left-4 right-4 p-4 bg-success/20 border border-success/30 rounded-xl text-center z-50"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
          >
            <p className="text-sm text-success font-medium">¡Sesión de natación registrada! 🏊‍♂️</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
