import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, User, ChevronRight, Sparkles, Play, Compass,
  Dumbbell, TrendingUp, Apple, Settings, Zap, Heart,
  Target, Calendar, BarChart3, BookOpen, HelpCircle,
  CheckCircle2, ArrowRight, X, MessageCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface NeoAssistantProps {
  onComplete: () => void;
  onSkip: () => void;
}

type TutorialStep = 
  | 'welcome'
  | 'choice'
  | 'workouts'
  | 'progress'
  | 'nutrition'
  | 'theory'
  | 'exercises'
  | 'design'
  | 'profile'
  | 'tips'
  | 'complete';

const TUTORIAL_SECTIONS = [
  { id: 'workouts', icon: Dumbbell, title: 'Entrenamientos', color: 'from-orange-500 to-red-500' },
  { id: 'progress', icon: TrendingUp, title: 'Progreso', color: 'from-emerald-500 to-teal-500' },
  { id: 'nutrition', icon: Apple, title: 'Nutrición', color: 'from-green-500 to-lime-500' },
  { id: 'theory', icon: BookOpen, title: 'Teoría', color: 'from-blue-500 to-indigo-500' },
  { id: 'exercises', icon: Target, title: 'Ejercicios', color: 'from-purple-500 to-pink-500' },
  { id: 'design', icon: Zap, title: 'Diseñar', color: 'from-amber-500 to-orange-500' },
  { id: 'profile', icon: User, title: 'Perfil', color: 'from-cyan-500 to-blue-500' },
];

export const NeoAssistant = ({ onComplete, onSkip }: NeoAssistantProps) => {
  const [step, setStep] = useState<TutorialStep>('welcome');
  const [isTyping, setIsTyping] = useState(true);
  const [showTips, setShowTips] = useState(false);

  const currentSectionIndex = TUTORIAL_SECTIONS.findIndex(s => s.id === step);
  const progress = step === 'welcome' || step === 'choice' 
    ? 0 
    : step === 'tips' || step === 'complete'
    ? 100
    : ((currentSectionIndex + 1) / TUTORIAL_SECTIONS.length) * 100;

  useEffect(() => {
    setIsTyping(true);
    const timer = setTimeout(() => setIsTyping(false), 800);
    return () => clearTimeout(timer);
  }, [step]);

  const goToNextStep = () => {
    const steps: TutorialStep[] = ['welcome', 'choice', 'workouts', 'progress', 'nutrition', 'theory', 'exercises', 'design', 'profile', 'tips', 'complete'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  const handleStartTutorial = () => {
    setStep('workouts');
  };

  const handleExploreAlone = () => {
    setStep('tips');
    setShowTips(true);
  };

  const renderNeoAvatar = (size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'w-8 h-8',
      md: 'w-12 h-12',
      lg: 'w-16 h-16'
    };
    
    return (
      <motion.div 
        className={cn(
          "rounded-2xl bg-foreground flex items-center justify-center shadow-lg",
          sizeClasses[size]
        )}
        animate={{ 
          scale: isTyping ? [1, 1.05, 1] : 1,
        }}
        transition={{ 
          duration: 0.6, 
          repeat: isTyping ? Infinity : 0 
        }}
      >
        <span className={cn(
          "font-bold text-background tracking-tight",
          size === 'sm' ? 'text-[8px]' : size === 'md' ? 'text-xs' : 'text-sm'
        )}>NEO</span>
      </motion.div>
    );
  };

  const renderTypingIndicator = () => (
    <motion.div 
      className="flex items-center gap-1 px-4 py-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-muted-foreground/50 rounded-full"
          animate={{ y: [0, -4, 0] }}
          transition={{ 
            duration: 0.5, 
            repeat: Infinity, 
            delay: i * 0.15 
          }}
        />
      ))}
    </motion.div>
  );

  const renderMessageBubble = (content: React.ReactNode, isNeo: boolean = true) => (
    <motion.div
      className={cn(
        "flex gap-3 items-start",
        !isNeo && "flex-row-reverse"
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {isNeo && renderNeoAvatar('sm')}
      <div className={cn(
        "max-w-[85%] rounded-2xl px-4 py-3",
        isNeo 
          ? "bg-muted text-foreground rounded-tl-sm" 
          : "bg-primary text-primary-foreground rounded-tr-sm"
      )}>
        {content}
      </div>
    </motion.div>
  );

  const renderWelcomeStep = () => (
    <div className="space-y-6">
      <motion.div
        className="text-center space-y-4"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {renderNeoAvatar('lg')}
      </motion.div>

      <div className="space-y-4">
        {renderMessageBubble(
          <div className="space-y-2">
            <p className="text-base font-medium">
              ¡Hola! 👋 Soy <span className="font-bold">Neo</span>, tu asistente personal de fitness.
            </p>
            <p className="text-sm text-muted-foreground">
              Estoy aquí para ayudarte a alcanzar tus metas de entrenamiento y nutrición. 
              ¡Juntos vamos a lograr grandes cosas!
            </p>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {renderMessageBubble(
            <p className="text-sm">
              ¿Listo para comenzar tu transformación? 💪
            </p>
          )}
        </motion.div>
      </div>

      <motion.div
        className="pt-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
      >
        <Button 
          onClick={() => setStep('choice')} 
          className="w-full gradient-primary text-primary-foreground"
          size="lg"
        >
          ¡Vamos! <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </motion.div>
    </div>
  );

  const renderChoiceStep = () => (
    <div className="space-y-6">
      {renderMessageBubble(
        <div className="space-y-2">
          <p className="text-base font-medium">
            ¿Cómo te gustaría empezar?
          </p>
          <p className="text-sm text-muted-foreground">
            Puedo darte un tour completo por la app o dejarte explorar a tu ritmo.
          </p>
        </div>
      )}

      <motion.div
        className="space-y-3 pt-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <motion.button
          onClick={handleStartTutorial}
          className="w-full p-4 rounded-xl border-2 border-primary bg-primary/5 hover:bg-primary/10 transition-all duration-200 text-left group"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
              <Play className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">Tutorial guiado</p>
              <p className="text-xs text-muted-foreground">
                Te explico cada sección paso a paso (~3 min)
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </motion.button>

        <motion.button
          onClick={handleExploreAlone}
          className="w-full p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-all duration-200 text-left group"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
              <Compass className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">Explorar por mi cuenta</p>
              <p className="text-xs text-muted-foreground">
                Descubre la app a tu ritmo
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </motion.button>
      </motion.div>
    </div>
  );

  const renderSectionStep = (
    sectionId: string,
    title: string,
    Icon: React.ElementType,
    gradient: string,
    description: string,
    features: string[],
    tip: string
  ) => (
    <div className="space-y-5">
      <motion.div
        className={cn(
          "w-full h-32 rounded-2xl bg-gradient-to-br flex items-center justify-center",
          gradient
        )}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Icon className="w-16 h-16 text-white/90" />
      </motion.div>

      {renderMessageBubble(
        <div className="space-y-3">
          <p className="text-base font-semibold">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
          
          <div className="space-y-2 pt-2">
            {features.map((feature, idx) => (
              <motion.div 
                key={idx}
                className="flex items-center gap-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
              >
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-xs">{feature}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <motion.div
        className="bg-primary/5 border border-primary/20 rounded-xl p-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <div className="flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Tip:</span> {tip}
          </p>
        </div>
      </motion.div>

      <motion.div
        className="flex gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <Button 
          variant="outline" 
          onClick={onSkip}
          className="flex-1"
        >
          Saltar
        </Button>
        <Button 
          onClick={goToNextStep}
          className="flex-1 gradient-primary text-primary-foreground"
        >
          Siguiente <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </motion.div>
    </div>
  );

  const renderTipsStep = () => (
    <div className="space-y-6">
      {renderMessageBubble(
        <div className="space-y-2">
          <p className="text-base font-medium">
            ¡Perfecto! Aquí van algunos tips rápidos:
          </p>
        </div>
      )}

      <motion.div
        className="space-y-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {[
          { icon: MessageCircle, text: "Puedes pedirme ayuda en cualquier momento desde la sección 'Diseñar'" },
          { icon: Target, text: "Empieza definiendo tu objetivo: fuerza, hipertrofia o resistencia" },
          { icon: Calendar, text: "Registra tus entrenos para ver tu progreso real" },
          { icon: Heart, text: "La consistencia es más importante que la perfección" },
        ].map((tip, idx) => (
          <motion.div
            key={idx}
            className="flex items-start gap-3 p-3 rounded-xl bg-muted/50"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + idx * 0.15 }}
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <tip.icon className="w-4 h-4 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground pt-1">{tip.text}</p>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        {renderMessageBubble(
          <p className="text-sm">
            ¿Listo para empezar? ¡Vamos a por ello! 🚀
          </p>
        )}
      </motion.div>

      <motion.div
        className="pt-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
      >
        <Button 
          onClick={onComplete}
          className="w-full gradient-primary text-primary-foreground"
          size="lg"
        >
          ¡Comenzar! <Sparkles className="w-4 h-4 ml-2" />
        </Button>
      </motion.div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="space-y-6 text-center">
      <motion.div
        className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", duration: 0.6 }}
      >
        <CheckCircle2 className="w-10 h-10 text-primary-foreground" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-xl font-bold text-foreground">¡Tutorial completado!</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Ya conoces todas las funciones de NEO. Ahora es momento de entrenar.
        </p>
      </motion.div>

      {renderMessageBubble(
        <p className="text-sm">
          Recuerda: estoy aquí para ayudarte cuando lo necesites. 
          ¡Vamos a conseguir tus objetivos juntos! 💪
        </p>
      )}

      <motion.div
        className="pt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <Button 
          onClick={onComplete}
          className="w-full gradient-primary text-primary-foreground"
          size="lg"
        >
          Empezar a entrenar <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </motion.div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (step) {
      case 'welcome':
        return renderWelcomeStep();
      case 'choice':
        return renderChoiceStep();
      case 'workouts':
        return renderSectionStep(
          'workouts',
          '💪 Entrenamientos',
          Dumbbell,
          'from-orange-500 to-red-500',
          'Aquí encontrarás todos tus entrenamientos organizados: gimnasio, natación, running y más.',
          [
            'Accede a tus rutinas personalizadas',
            'Registra cada sesión con pesos y repeticiones',
            'Cronómetro integrado para descansos',
            'Historial completo de entrenamientos'
          ],
          'Toca en cualquier ejercicio durante tu entreno para registrar tus series'
        );
      case 'progress':
        return renderSectionStep(
          'progress',
          '📈 Progreso',
          TrendingUp,
          'from-emerald-500 to-teal-500',
          'Visualiza tu evolución con gráficas detalladas y el modelo anatómico 3D interactivo.',
          [
            'Gráficas de volumen y rendimiento',
            'Modelo 3D con músculos trabajados',
            'Estadísticas por grupo muscular',
            'Comparativas semanales y mensuales'
          ],
          'Toca cualquier músculo del modelo 3D para ver estadísticas específicas'
        );
      case 'nutrition':
        return renderSectionStep(
          'nutrition',
          '🍎 Nutrición',
          Apple,
          'from-green-500 to-lime-500',
          'Diseña tu plan nutricional personalizado con el asistente inteligente.',
          [
            'Generador de dietas según tu objetivo',
            'Cálculo automático de macros y calorías',
            'Sustitución inteligente de alimentos',
            'Recetas y suplementación'
          ],
          'El asistente ajusta automáticamente los gramos cuando cambias un alimento'
        );
      case 'theory':
        return renderSectionStep(
          'theory',
          '📚 Teoría',
          BookOpen,
          'from-blue-500 to-indigo-500',
          'Aprende sobre entrenamiento y nutrición con artículos especializados.',
          [
            'Artículos de hipertrofia y fuerza',
            'Guías de técnica y biomecánica',
            'Nutrición deportiva avanzada',
            'Optimización del descanso y recuperación'
          ],
          'Cada artículo está escrito por expertos y validado científicamente'
        );
      case 'exercises':
        return renderSectionStep(
          'exercises',
          '🎯 Catálogo de Ejercicios',
          Target,
          'from-purple-500 to-pink-500',
          'Explora más de 100 ejercicios con videos, instrucciones y variantes.',
          [
            'Filtros por grupo muscular y equipamiento',
            'Videos demostrativos de técnica',
            'Tips de ejecución correcta',
            'Variantes y alternativas'
          ],
          'Busca ejercicios por nombre o filtra por el equipo disponible en tu gimnasio'
        );
      case 'design':
        return renderSectionStep(
          'design',
          '⚡ Diseñar',
          Zap,
          'from-amber-500 to-orange-500',
          'Crea tus propias rutinas con la ayuda del asistente IA o desde cero.',
          [
            'Asistente IA para generar rutinas',
            'Personalización total del programa',
            'Importar plantillas prediseñadas',
            'Exportar y compartir rutinas'
          ],
          'Cuéntame tu objetivo y nivel, y diseñaré una rutina perfecta para ti'
        );
      case 'profile':
        return renderSectionStep(
          'profile',
          '👤 Perfil',
          User,
          'from-cyan-500 to-blue-500',
          'Configura tu perfil, preferencias y datos de salud.',
          [
            'Datos personales y objetivos',
            'Configuración de idioma y tema',
            'Integraciones con wearables',
            'Exportación de datos'
          ],
          'Mantén tu perfil actualizado para recomendaciones más precisas'
        );
      case 'tips':
        return renderTipsStep();
      case 'complete':
        return renderCompleteStep();
      default:
        return renderWelcomeStep();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with progress */}
      {step !== 'welcome' && step !== 'choice' && (
        <motion.header 
          className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {renderNeoAvatar('sm')}
              <span className="text-sm font-medium text-foreground">Neo</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onSkip}
              className="text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <Progress value={progress} className="h-1" />
        </motion.header>
      )}

      {/* Main content */}
      <main className="flex-1 px-4 py-6 overflow-y-auto">
        <div className="max-w-md mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {isTyping && step !== 'welcome' && step !== 'complete' ? (
                <div className="flex items-start gap-3">
                  {renderNeoAvatar('sm')}
                  {renderTypingIndicator()}
                </div>
              ) : (
                renderCurrentStep()
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Help button */}
      {step !== 'welcome' && step !== 'choice' && (
        <motion.div
          className="fixed bottom-6 right-6"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            size="icon"
            variant="outline"
            className="rounded-full w-12 h-12 shadow-lg"
            onClick={() => {}}
          >
            <HelpCircle className="w-5 h-5" />
          </Button>
        </motion.div>
      )}
    </div>
  );
};
