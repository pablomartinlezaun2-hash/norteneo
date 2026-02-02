import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Loader2, X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { NeoLogo } from './NeoLogo';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  workout?: ParsedWorkout | null;
}

interface ParsedExercise {
  name: string;
  series: number;
  reps: string;
  rest: string;
}

interface ParsedWorkout {
  name: string;
  exercises: ParsedExercise[];
}

interface AIWorkoutAssistantProps {
  workoutType: 'gym' | 'swimming' | 'running';
  onSuggestion?: (suggestion: string) => void;
  onClose: () => void;
  onWorkoutSaved?: () => void;
}

export const AIWorkoutAssistant = ({ workoutType, onSuggestion, onClose, onWorkoutSaved }: AIWorkoutAssistantProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [savingWorkoutId, setSavingWorkoutId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Welcome message
    const typeLabel = workoutType === 'gym' ? 'gimnasio' : workoutType === 'swimming' ? 'natación' : 'running';
    setMessages([{
      role: 'assistant',
      content: `¡Hola! Soy **Pablo**, CEO y asistente de NEO 💪\n\nEstoy aquí para ayudarte a diseñar tu rutina de **${typeLabel}** perfecta. Cuéntame:\n\n- ¿Cuáles son tus objetivos? (fuerza, hipertrofia, resistencia...)\n- ¿Cuántos días a la semana puedes entrenar?\n- ¿Tienes alguna lesión o limitación?\n\n¡Empecemos a crear algo increíble!`,
      workout: null
    }]);
  }, [workoutType]);

  // Parse workout from AI response
  const parseWorkoutFromResponse = (content: string): ParsedWorkout | null => {
    try {
      // Look for JSON workout block in the response
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed.name && Array.isArray(parsed.exercises)) {
          return parsed as ParsedWorkout;
        }
      }
      
      // Alternative: look for structured workout format
      const workoutNameMatch = content.match(/(?:Rutina|Workout|Programa):\s*(.+)/i);
      if (workoutNameMatch) {
        const exercises: ParsedExercise[] = [];
        const exerciseRegex = /(?:\d+\.\s*)?([^-\n]+)\s*[-–]\s*(\d+)\s*(?:series|x)\s*(?:de\s*)?(\d+[-–]?\d*)\s*(?:reps?|repeticiones)?(?:\s*[-–]\s*(\d+\s*(?:seg|s|segundos?)?)?)?/gi;
        let match;
        while ((match = exerciseRegex.exec(content)) !== null) {
          exercises.push({
            name: match[1].trim(),
            series: parseInt(match[2]) || 3,
            reps: match[3] || '8-12',
            rest: match[4] || '90s'
          });
        }
        if (exercises.length > 0) {
          return {
            name: workoutNameMatch[1].trim(),
            exercises
          };
        }
      }
      
      return null;
    } catch (e) {
      console.error('Error parsing workout:', e);
      return null;
    }
  };

  const saveWorkout = async (workout: ParsedWorkout, messageIndex: number) => {
    if (!user) {
      toast.error('Debes iniciar sesión para guardar');
      return;
    }

    setSavingWorkoutId(messageIndex);
    try {
      // Create training program
      const { data: program, error: programError } = await supabase
        .from('training_programs')
        .insert({
          user_id: user.id,
          name: workout.name,
          description: `Rutina generada por IA con ${workout.exercises.length} ejercicios`,
          is_active: false
        })
        .select()
        .single();

      if (programError) throw programError;

      // Create workout session
      const { data: session, error: sessionError } = await supabase
        .from('workout_sessions')
        .insert({
          program_id: program.id,
          name: workout.name,
          short_name: workout.name.substring(0, 10),
          order_index: 0
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Add exercises
      const exercisesToInsert = workout.exercises.map((ex, index) => ({
        session_id: session.id,
        name: ex.name,
        series: ex.series,
        reps: ex.reps,
        rest: ex.rest,
        order_index: index
      }));

      const { error: exercisesError } = await supabase
        .from('exercises')
        .insert(exercisesToInsert);

      if (exercisesError) throw exercisesError;

      toast.success('¡Rutina guardada con éxito!');
      onWorkoutSaved?.();
    } catch (error) {
      console.error('Error saving workout:', error);
      toast.error('Error al guardar la rutina');
    } finally {
      setSavingWorkoutId(null);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input, workout: null };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('workout-ai-assistant', {
        body: {
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
          workoutType,
          requestWorkoutStructure: true
        }
      });

      if (error) throw error;

      const content = data.response;
      const workout = data.workout || parseWorkoutFromResponse(content);

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content,
        workout
      }]);

      // Check if the response contains exercise suggestions
      if (data.exercises && onSuggestion) {
        onSuggestion(JSON.stringify(data.exercises));
      }
    } catch (error) {
      console.error('Error calling AI assistant:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Lo siento, ha ocurrido un error. Por favor, inténtalo de nuevo.',
        workout: null
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="bg-card border border-border rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black text-white">
        <div className="flex items-center gap-2">
          <NeoLogo size="sm" className="bg-white text-black" />
          <div>
            <h3 className="font-semibold text-sm">Pablo</h3>
            <p className="text-[10px] text-white/70">CEO & Asistente NEO</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-white hover:bg-white/20 h-8 w-8"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="h-64 overflow-y-auto p-4 space-y-4 bg-muted/30">
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <NeoLogo size="sm" className="flex-shrink-0" />
              )}
              <div className="max-w-[80%] space-y-2">
                <div
                  className={`rounded-xl px-3 py-2 text-sm ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card border border-border'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  ) : (
                    message.content
                  )}
                </div>
                
                {/* Save Workout Button */}
                {message.role === 'assistant' && message.workout && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <Button
                      size="sm"
                      onClick={() => saveWorkout(message.workout!, index)}
                      disabled={savingWorkoutId === index}
                      className="bg-gradient-to-r from-primary to-primary/80 text-white text-xs"
                    >
                      {savingWorkoutId === index ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="w-3 h-3 mr-1.5" />
                          ¿Guardar esta rutina?
                        </>
                      )}
                    </Button>
                  </motion.div>
                )}
              </div>
              {message.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-2 items-start"
          >
            <NeoLogo size="sm" />
            <div className="bg-card border border-border rounded-xl px-3 py-2 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border bg-card">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Cuéntame sobre tu entrenamiento ideal..."
            className="flex-1 text-sm"
            disabled={isLoading}
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="gradient-primary"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
