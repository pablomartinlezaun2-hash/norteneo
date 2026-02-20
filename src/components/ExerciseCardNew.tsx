import { useState, useEffect } from 'react';
import { Exercise } from '@/types/database';
import { useSetLogs } from '@/hooks/useSetLogs';
import { useExerciseNotes } from '@/hooks/useExerciseNotes';
import { SetProgressChart } from './SetProgressChart';
import { SetForm } from './SetForm';
import { SetLogList } from './SetLogList';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { 
  Dumbbell, Clock, Target, ChevronDown, ChevronUp, 
  MessageSquare, Save, Loader2, TrendingUp, Award
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface ExerciseCardNewProps {
  exercise: Exercise;
  index: number;
}

export const ExerciseCardNew = ({ exercise, index }: ExerciseCardNewProps) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeSetTab, setActiveSetTab] = useState(1);
  const [showNotes, setShowNotes] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const { logs, addLog, deleteLog, getLogsBySetNumber, getLastLogForSet, getBestWeightForSet } = useSetLogs(exercise.id);
  const { note, saveNote } = useExerciseNotes(exercise.id);

  useEffect(() => {
    if (note) setNoteText(note.note);
  }, [note]);

  const handleAddLog = async (setNumber: number, data: {
    weight: number; reps: number; partialReps: number; rir: number | null; isWarmup: boolean;
  }) => {
    const result = await addLog(setNumber, data.weight, data.reps, data.partialReps, data.rir, data.isWarmup);
    return { error: result.error };
  };

  const handleSaveNote = async () => {
    setSavingNote(true);
    await saveNote(noteText);
    setSavingNote(false);
  };

  const getSummaryForSets = () => {
    const summaries = [];
    for (let i = 1; i <= exercise.series; i++) {
      const lastLog = getLastLogForSet(i);
      if (lastLog) summaries.push({ set: i, weight: lastLog.weight, reps: lastLog.reps, rir: lastLog.rir });
    }
    return summaries;
  };

  const summaries = getSummaryForSets();
  const hasLogs = (setNumber: number) => getLogsBySetNumber(setNumber).length > 0;

  return (
    <div 
      className="gradient-card rounded-xl border border-border overflow-hidden card-hover animate-slide-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <button onClick={() => setIsExpanded(!isExpanded)} className="w-full p-4 flex items-start gap-3 text-left">
        <div className="gradient-primary rounded-lg p-2.5 shrink-0">
          <Dumbbell className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-sm leading-tight mb-2">{exercise.name}</h3>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Target className="w-3 h-3 text-primary" />
              {t('exerciseCard.series', { count: exercise.series })}
            </span>
            <span>{exercise.reps}</span>
            {exercise.rest && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-primary" />
                {exercise.rest}
              </span>
            )}
          </div>
          {summaries.length > 0 && (
            <div className="mt-2 pt-2 border-t border-border">
              <div className="space-y-0.5">
                {summaries.map((s) => (
                  <p key={s.set} className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {s.set}ª: {s.weight} kg × {s.reps}
                    </span>
                    {s.rir !== null && <span className="ml-1">(RIR {s.rir})</span>}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="shrink-0 text-muted-foreground">
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-border">
          {exercise.video_url && (
            <div className="p-4 border-b border-border">
              <iframe width="100%" height="300" src={exercise.video_url} frameBorder="0" allowFullScreen className="rounded-lg" />
            </div>
          )}

          {exercise.execution && (
            <div className="px-4 py-3 bg-muted/30 border-b border-border">
              <p className="text-xs text-muted-foreground leading-relaxed">{exercise.execution}</p>
            </div>
          )}

          <div className="px-4 pt-4">
            <div className="flex border-b border-border">
              {Array.from({ length: exercise.series }, (_, i) => i + 1).map((setNum) => (
                <button
                  key={setNum}
                  onClick={() => setActiveSetTab(setNum)}
                  className={cn(
                    "flex-1 py-2 text-xs font-medium transition-all relative",
                    activeSetTab === setNum ? "text-primary"
                      : hasLogs(setNum) ? "text-foreground" : "text-muted-foreground/60",
                  )}
                >
                  {t('exerciseCard.setNumber', { num: setNum })}
                  {activeSetTab === setNum && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 space-y-4">
            <div className="flex gap-4 text-xs">
              {getLastLogForSet(activeSetTab) && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <TrendingUp className="w-3.5 h-3.5 text-primary" />
                  <span>
                    {t('exerciseCard.last')}: {getLastLogForSet(activeSetTab)!.weight} kg × {getLastLogForSet(activeSetTab)!.reps}
                    {getLastLogForSet(activeSetTab)!.rir !== null && ` · RIR ${getLastLogForSet(activeSetTab)!.rir}`}
                  </span>
                </div>
              )}
              {getBestWeightForSet(activeSetTab) > 0 && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Award className="w-3.5 h-3.5 text-primary" />
                  <span>{t('exerciseCard.best')}: {getBestWeightForSet(activeSetTab)} kg</span>
                </div>
              )}
            </div>

            <SetForm setNumber={activeSetTab} onSubmit={(data) => handleAddLog(activeSetTab, data)} lastLog={getLastLogForSet(activeSetTab)} />
            <div className="pt-2"><SetProgressChart logs={logs} setNumber={activeSetTab} /></div>
            <SetLogList logs={getLogsBySetNumber(activeSetTab)} onDelete={deleteLog} />
          </div>

          <div className="border-t border-border">
            <button onClick={() => setShowNotes(!showNotes)} className="w-full px-4 py-3 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <MessageSquare className="w-4 h-4" />
              <span>{t('exerciseCard.exerciseNotes')}</span>
              {note && <span className="text-xs text-primary">•</span>}
            </button>
            
            {showNotes && (
              <div className="px-4 pb-4 space-y-3">
                <Textarea placeholder={t('exerciseCard.notesPlaceholder')} value={noteText} onChange={(e) => setNoteText(e.target.value)} className="min-h-[80px] text-sm" />
                <Button size="sm" onClick={handleSaveNote} disabled={savingNote} className="w-full">
                  {savingNote ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  {t('exerciseCard.saveNote')}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};