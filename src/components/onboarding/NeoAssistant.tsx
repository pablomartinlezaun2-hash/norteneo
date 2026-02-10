import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, User, ChevronRight, Sparkles, Play, Compass,
  Dumbbell, TrendingUp, Apple, Settings, Zap, Heart,
  Target, Calendar, BarChart3, BookOpen, HelpCircle,
  CheckCircle2, ArrowRight, ArrowLeft, X, MessageCircle,
  Timer, ClipboardList, Search, Layers, Brain, Eye,
  Bone, Activity, LayoutGrid, Utensils, Pill, Bell,
  Globe, Palette, Download, Shield, Waves, Footprints,
  ListOrdered, GripVertical, Save, ChefHat, Scale,
  Repeat, CircleDot
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface NeoAssistantProps {
  onComplete: () => void;
  onSkip: () => void;
}

// Each section has multiple detailed pages
interface TutorialPage {
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  gradient: string;
  messages: Array<{
    text: string;
    isHighlight?: boolean;
  }>;
  features: Array<{
    icon: React.ElementType;
    title: string;
    description: string;
  }>;
  tip?: string;
}

interface TutorialSection {
  id: string;
  sectionTitle: string;
  sectionIcon: React.ElementType;
  sectionGradient: string;
  pages: TutorialPage[];
}

const TUTORIAL_SECTIONS: TutorialSection[] = [
  // ==================== ENTRENAMIENTOS ====================
  {
    id: 'workouts',
    sectionTitle: 'Entrenamientos',
    sectionIcon: Dumbbell,
    sectionGradient: 'from-orange-500 to-red-500',
    pages: [
      {
        title: '💪 Entrenamientos',
        subtitle: 'Tu centro de control para cada sesión',
        icon: Dumbbell,
        gradient: 'from-orange-500 to-red-500',
        messages: [
          { text: '¡Esta es tu sección principal! Aquí es donde vas a vivir el día a día de tus entrenamientos.' },
          { text: 'Piensa en ella como tu diario de entrenamiento digital: todo lo que haces en el gimnasio queda registrado aquí.', isHighlight: true },
        ],
        features: [
          { icon: ClipboardList, title: 'Mis Rutinas', description: 'Todas tus rutinas organizadas por programa. Cada programa puede tener varias sesiones (Día A, Día B, etc.) y cada sesión tiene sus ejercicios con series, repeticiones y descansos.' },
          { icon: Layers, title: 'Múltiples disciplinas', description: 'No solo gimnasio: también puedes gestionar entrenamientos de natación (series de piscina, estilos, distancias) y running (intervalos, ritmos, distancias).' },
        ],
        tip: 'Toca en el nombre de cualquier programa para ver todas sus sesiones de entrenamiento.',
      },
      {
        title: '📋 Registrar tu entrenamiento',
        subtitle: 'Cómo funciona cada sesión',
        icon: ClipboardList,
        gradient: 'from-orange-500 to-red-500',
        messages: [
          { text: 'Cuando abres una sesión de entrenamiento, verás la lista de ejercicios con sus series planificadas.' },
          { text: 'Para cada ejercicio puedes registrar: el peso que usas, las repeticiones que haces, e incluso las repeticiones parciales y el RIR (Repeticiones en Reserva).', isHighlight: true },
        ],
        features: [
          { icon: ListOrdered, title: 'Series detalladas', description: 'Cada serie se registra individualmente: peso (kg), repeticiones completadas, RIR, y puedes marcar si es serie de calentamiento. Todo se guarda automáticamente.' },
          { icon: Timer, title: 'Cronómetro de descanso', description: 'Cronómetro integrado que puedes iniciar al terminar cada serie. Te avisa cuando ha pasado el tiempo de descanso programado para ese ejercicio.' },
          { icon: Save, title: 'Historial automático', description: 'Cada vez que registras una serie, queda guardada con fecha y hora. Así puedes ver tu progresión: cuánto peso levantabas hace un mes vs. ahora.' },
          { icon: MessageCircle, title: 'Notas por ejercicio', description: 'Puedes añadir notas personales a cada ejercicio: "agarre supino más cómodo", "bajar más lento", etc. Se guardan para que las veas la próxima vez.' },
        ],
        tip: 'Después de registrar una serie, el formulario se auto-rellena con los datos anteriores para ir más rápido.',
      },
      {
        title: '✅ Completar sesiones',
        subtitle: 'Seguimiento de tu constancia',
        icon: CheckCircle2,
        gradient: 'from-orange-500 to-red-500',
        messages: [
          { text: 'Cuando terminas todos los ejercicios de una sesión, puedes marcarla como completada.' },
          { text: 'Esto alimenta tu historial de actividad y las gráficas de progreso. ¡La constancia es la clave! 🔑', isHighlight: true },
        ],
        features: [
          { icon: Calendar, title: 'Historial de sesiones', description: 'Puedes ver qué días has entrenado, cuántas sesiones llevas esta semana/mes, y tu racha actual de días consecutivos.' },
          { icon: BarChart3, title: 'Volumen por sesión', description: 'Automáticamente se calcula el volumen total de cada sesión (series × reps × peso), permitiéndote comparar el trabajo realizado entre sesiones.' },
        ],
        tip: 'Intenta mantener una racha: ¡completar sesiones consecutivas te motiva a no fallar!',
      },
    ],
  },

  // ==================== DISEÑAR ====================
  {
    id: 'design',
    sectionTitle: 'Diseñar',
    sectionIcon: Zap,
    sectionGradient: 'from-amber-500 to-orange-500',
    pages: [
      {
        title: '⚡ Diseñar Entrenamiento',
        subtitle: 'Tu taller de rutinas personalizadas',
        icon: Zap,
        gradient: 'from-amber-500 to-orange-500',
        messages: [
          { text: 'Esta es la sección más potente de la app. Aquí puedes crear rutinas completamente personalizadas para tres disciplinas: Gimnasio, Natación y Running.' },
          { text: 'Todo está organizado dentro de un desplegable principal "Diseñar Entrenamiento", y dentro encontrarás cada disciplina.', isHighlight: true },
        ],
        features: [
          { icon: Dumbbell, title: 'Gimnasio', description: 'Crea rutinas de fuerza/hipertrofia con ejercicios, series, repeticiones, descansos, técnicas avanzadas (drop sets, rest-pause) y notas de ejecución.' },
          { icon: Waves, title: 'Natación', description: 'Diseña sesiones de piscina con bloques de series por estilo (crol, espalda, braza, mariposa), distancias y tiempos de descanso.' },
          { icon: Footprints, title: 'Running', description: 'Planifica entrenamientos de carrera con intervalos, ritmos objetivo, distancias y tiempos de recuperación.' },
        ],
        tip: 'Cada disciplina te ofrece dos opciones: diseñar con el asistente NEO (IA) o crear tú mismo manualmente.',
      },
      {
        title: '🤖 Asistente NEO (IA)',
        subtitle: 'Tu entrenador personal inteligente',
        icon: Brain,
        gradient: 'from-amber-500 to-orange-500',
        messages: [
          { text: 'Dentro de cada disciplina puedes elegir "Diseñar con NEO". Soy yo, tu asistente de IA. 😄' },
          { text: 'Te haré unas preguntas rápidas: tu nivel (principiante, intermedio, avanzado), tu objetivo (fuerza, hipertrofia, resistencia) y algunos datos opcionales como lesiones o equipamiento disponible.', isHighlight: true },
        ],
        features: [
          { icon: MessageCircle, title: 'Chat inteligente', description: 'Me cuentas lo que necesitas y te genero una rutina completa adaptada. Puedes pedirme cambios: "quita el peso muerto", "añade más pecho", "hazla más corta"...' },
          { icon: Target, title: 'Rutinas visuales', description: 'Los ejercicios se muestran como tarjetas interactivas con animaciones GIF, músculos trabajados resaltados en un modelo 3D, series/reps y tips de ejecución.' },
          { icon: Save, title: 'Guardar rutinas', description: 'Una vez satisfecho con la rutina generada, puedes guardarla directamente en tu biblioteca de programas y empezar a usarla inmediatamente.' },
        ],
        tip: 'Cuantos más detalles me des (lesiones, equipo, días por semana), más precisa será la rutina que te diseñe.',
      },
      {
        title: '🛠️ Diseño manual + Ejercicios',
        subtitle: 'Constructor drag-and-drop y catálogo completo',
        icon: GripVertical,
        gradient: 'from-amber-500 to-orange-500',
        messages: [
          { text: 'Si prefieres crear tu rutina a mano, el constructor manual te permite añadir ejercicios, definir series/reps/descanso, y reordenarlos arrastrando.' },
          { text: 'Además, en la sección "Ejercicios" tienes un catálogo completo con buscador y filtros por grupo muscular.', isHighlight: true },
        ],
        features: [
          { icon: GripVertical, title: 'Drag & Drop', description: 'Arrastra los ejercicios para reordenarlos dentro de tu rutina. Puedes editar series, repeticiones, descanso y técnicas avanzadas de cada uno.' },
          { icon: Search, title: 'Buscador de ejercicios', description: 'Busca cualquier ejercicio por nombre. El catálogo incluye descripción, músculos trabajados, equipamiento necesario, dificultad y tips de ejecución.' },
          { icon: LayoutGrid, title: 'Filtros por músculo', description: 'Filtra ejercicios por grupo muscular (pecho, espalda, piernas, etc.) para encontrar rápidamente lo que necesitas.' },
          { icon: BookOpen, title: 'Teoría y Fundamentación', description: 'Artículos especializados sobre biomecánica, técnicas de entrenamiento, periodización, nutrición deportiva y recuperación. Todo respaldado por ciencia.' },
        ],
        tip: 'Puedes combinar ambos métodos: genera una base con NEO y después edítala manualmente a tu gusto.',
      },
    ],
  },

  // ==================== PROGRESO ====================
  {
    id: 'progress',
    sectionTitle: 'Progreso',
    sectionIcon: TrendingUp,
    sectionGradient: 'from-emerald-500 to-teal-500',
    pages: [
      {
        title: '📈 Tu progreso en datos',
        subtitle: 'Gráficas y estadísticas detalladas',
        icon: TrendingUp,
        gradient: 'from-emerald-500 to-teal-500',
        messages: [
          { text: 'Aquí es donde ves los resultados de tu esfuerzo. Todas las series que registras se transforman en gráficas y estadísticas.' },
          { text: 'Puedes ver tu progresión por ejercicio (cuánto peso levantas en press banca a lo largo del tiempo), por grupo muscular, o un resumen general.', isHighlight: true },
        ],
        features: [
          { icon: BarChart3, title: 'Gráficas de progresión', description: 'Visualiza cómo evoluciona tu peso levantado, volumen total y número de series semana a semana. Puedes filtrar por ejercicio específico o ver el resumen global.' },
          { icon: Calendar, title: 'Vista semanal/mensual', description: 'Compara tu rendimiento entre semanas y meses. ¿Estás levantando más que el mes pasado? ¿Mantienes la constancia? Las gráficas te lo dicen.' },
          { icon: Target, title: 'Resumen por ejercicio clave', description: 'Selecciona tus ejercicios principales (press banca, sentadilla, peso muerto) y sigue su evolución con gráficas dedicadas de peso máximo y volumen.' },
        ],
        tip: 'Las gráficas se actualizan automáticamente cada vez que registras una serie en tus entrenamientos.',
      },
      {
        title: '🧬 Modelo Anatómico 3D "Neo"',
        subtitle: 'Tu cuerpo en 3D interactivo',
        icon: Activity,
        gradient: 'from-emerald-500 to-teal-500',
        messages: [
          { text: '¡Esta es una de las funciones más impresionantes! Un modelo anatómico 3D ultra-realista con más de 50 músculos individuales.' },
          { text: 'Puedes rotar el modelo en 360°, hacer zoom, y tocar cualquier músculo para ver información detallada.', isHighlight: true },
        ],
        features: [
          { icon: Eye, title: 'Tres capas visuales', description: 'Puedes alternar entre tres vistas: Músculos (ve cada grupo muscular coloreado), Esqueleto (estructura ósea completa) y Piel (silueta exterior). Cada una con detalle anatómico.' },
          { icon: Activity, title: 'Mapa de calor muscular', description: 'Los músculos que más has trabajado aparecen más intensos. Si llevas 20 series de pecho esta semana, el pectoral brillará más que un músculo que no has entrenado.' },
          { icon: CircleDot, title: 'Detalle por músculo', description: 'Toca cualquier músculo y verás: nombre científico (latín), origen e inserción, función principal, inervación, sinergistas/antagonistas, y tus estadísticas de entrenamiento para ese músculo.' },
          { icon: Repeat, title: 'Animación de contracción', description: 'Para cada músculo puedes ver una animación 3D de cómo se contrae y estira, ayudándote a entender la biomecánica del movimiento.' },
        ],
        tip: 'Usa el botón de rotación automática para ver el modelo desde todos los ángulos, o desactívalo para explorar tú mismo.',
      },
    ],
  },

  // ==================== NUTRICIÓN ====================
  {
    id: 'nutrition',
    sectionTitle: 'Nutrición',
    sectionIcon: Apple,
    sectionGradient: 'from-green-500 to-lime-500',
    pages: [
      {
        title: '🍎 Tu plan nutricional',
        subtitle: 'Alimentación inteligente para tus objetivos',
        icon: Apple,
        gradient: 'from-green-500 to-lime-500',
        messages: [
          { text: 'La nutrición es el 70% de tus resultados. Esta sección te ayuda a planificar exactamente qué comer para alcanzar tus metas.' },
          { text: 'Incluye un diseñador de dietas, registro de comidas, cálculo automático de macros y mucho más.', isHighlight: true },
        ],
        features: [
          { icon: ChefHat, title: 'Diseñador de dietas', description: 'Genera planes nutricionales completos según tu objetivo (volumen, definición, mantenimiento). Incluye desayuno, comida, merienda y cena con gramos exactos.' },
          { icon: Scale, title: 'Cálculo de macros', description: 'Configura tus objetivos diarios de calorías, proteínas, carbohidratos y grasas. La app calcula automáticamente según tu peso, altura, actividad y objetivo.' },
          { icon: Utensils, title: 'Registro de comidas', description: 'Registra todo lo que comes a lo largo del día. Busca alimentos en el catálogo, indica la cantidad y se calculan automáticamente las calorías y macros.' },
        ],
        tip: 'Los anillos de progreso te muestran visualmente cuánto llevas consumido vs. tu objetivo diario.',
      },
      {
        title: '🔄 Sustituciones y recetas',
        subtitle: 'Flexibilidad total en tu dieta',
        icon: Repeat,
        gradient: 'from-green-500 to-lime-500',
        messages: [
          { text: '¿No te gusta un alimento del plan? ¡Sin problema! La sustitución inteligente te sugiere alternativas con macros similares.' },
          { text: 'Además tienes una sección de recetas saludables categorizadas por tipo de comida y objetivo.', isHighlight: true },
        ],
        features: [
          { icon: Repeat, title: 'Sustitución inteligente', description: 'Si no te gusta el pollo, te sugiero pavo, tofu o pescado con macros equivalentes. Los gramos se ajustan automáticamente para que cuadren las calorías.' },
          { icon: ChefHat, title: 'Recetas', description: 'Biblioteca de recetas con ingredientes, instrucciones paso a paso, tiempo de preparación y desglose nutricional completo por ración.' },
          { icon: BarChart3, title: 'Resumen semanal', description: 'Vista panorámica de tu semana nutricional: media de calorías, distribución de macros, días que cumpliste objetivos y tendencias.' },
        ],
        tip: 'Pulsa en cualquier alimento del plan para ver opciones de sustitución al instante.',
      },
      {
        title: '💊 Suplementación',
        subtitle: 'Gestión completa de suplementos',
        icon: Pill,
        gradient: 'from-green-500 to-lime-500',
        messages: [
          { text: 'Si tomas suplementos (creatina, proteína, vitaminas...), esta sección te ayuda a no olvidarte nunca.' },
        ],
        features: [
          { icon: Pill, title: 'Catálogo de suplementos', description: 'Añade los suplementos que tomas con su dosificación, momento del día (pre-entreno, post-entreno, con comidas) y notas específicas.' },
          { icon: Bell, title: 'Recordatorios', description: 'Configura recordatorios para cada suplemento con horarios personalizados. La app te avisará cuando sea hora de tomarlo.' },
          { icon: CheckCircle2, title: 'Registro de tomas', description: 'Lleva un registro de cuándo has tomado cada suplemento para mantener la adherencia y ver tu constancia.' },
        ],
        tip: 'Los recordatorios funcionan incluso con la app cerrada si tienes las notificaciones activadas.',
      },
    ],
  },

  // ==================== PERFIL ====================
  {
    id: 'profile',
    sectionTitle: 'Perfil',
    sectionIcon: User,
    sectionGradient: 'from-cyan-500 to-blue-500',
    pages: [
      {
        title: '👤 Tu perfil y ajustes',
        subtitle: 'Personaliza toda la experiencia',
        icon: User,
        gradient: 'from-cyan-500 to-blue-500',
        messages: [
          { text: 'Aquí configuras todo lo relacionado contigo y con cómo funciona la app. Desde tus datos personales hasta el aspecto visual.' },
        ],
        features: [
          { icon: User, title: 'Datos personales', description: 'Nombre, foto de perfil, y datos de salud opcionales (peso, altura, edad, condiciones médicas, lesiones). Estos datos se usan para personalizar las recomendaciones de entrenamiento y nutrición.' },
          { icon: Heart, title: 'Perfil de salud', description: 'Registra información médica relevante: alergias alimentarias, lesiones activas, limitaciones de movilidad. Esto permite que las rutinas generadas por IA eviten ejercicios contraindicados.' },
          { icon: Palette, title: 'Tema y apariencia', description: 'Elige entre modo Claro, Oscuro o Automático (según tu sistema). También puedes activar Night Shift para reducir la luz azul por la noche.' },
          { icon: Globe, title: 'Idioma', description: 'La app está disponible en 10 idiomas: español, inglés, francés, alemán, italiano, portugués, árabe, japonés, coreano y chino.' },
        ],
        tip: 'Mantener tu peso actualizado mejora la precisión del cálculo de calorías y macros.',
      },
      {
        title: '📦 Datos y más',
        subtitle: 'Exportación, suscripción y soporte',
        icon: Download,
        gradient: 'from-cyan-500 to-blue-500',
        messages: [
          { text: 'Tus datos son tuyos. Puedes exportarlos cuando quieras, y siempre tendrás acceso a soporte si necesitas ayuda.' },
        ],
        features: [
          { icon: Download, title: 'Exportar datos', description: 'Descarga todo tu historial de entrenamientos, logs de series, planes nutricionales y registros de suplementos en formato estructurado. Tus datos siempre te pertenecen.' },
          { icon: Shield, title: 'Suscripción', description: 'Consulta el estado de tu plan, las funciones incluidas y las opciones de mejora disponibles.' },
          { icon: HelpCircle, title: 'Soporte', description: 'Enlace directo al soporte técnico por si necesitas ayuda con cualquier función de la app o tienes sugerencias.' },
        ],
        tip: 'Revisa tu perfil de vez en cuando para mantener tus datos actualizados.',
      },
    ],
  },
];

// Flatten all pages with section context for navigation
const getAllPages = () => {
  const pages: Array<{ sectionId: string; sectionTitle: string; pageIndex: number; page: TutorialPage; totalSectionPages: number }> = [];
  TUTORIAL_SECTIONS.forEach((section) => {
    section.pages.forEach((page, idx) => {
      pages.push({
        sectionId: section.id,
        sectionTitle: section.sectionTitle,
        pageIndex: idx,
        page,
        totalSectionPages: section.pages.length,
      });
    });
  });
  return pages;
};

const ALL_PAGES = getAllPages();
const TOTAL_PAGES = ALL_PAGES.length;

export const NeoAssistant = ({ onComplete, onSkip }: NeoAssistantProps) => {
  const [phase, setPhase] = useState<'welcome' | 'choice' | 'tutorial' | 'tips' | 'complete'>('welcome');
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);

  const progress = phase === 'tutorial'
    ? ((currentPageIndex + 1) / TOTAL_PAGES) * 100
    : phase === 'tips' || phase === 'complete' ? 100 : 0;

  useEffect(() => {
    setIsTyping(true);
    const timer = setTimeout(() => setIsTyping(false), 600);
    return () => clearTimeout(timer);
  }, [phase, currentPageIndex]);

  const goNext = useCallback(() => {
    if (phase === 'tutorial') {
      if (currentPageIndex < TOTAL_PAGES - 1) {
        setCurrentPageIndex(currentPageIndex + 1);
      } else {
        setPhase('tips');
      }
    }
  }, [phase, currentPageIndex]);

  const goBack = useCallback(() => {
    if (phase === 'tutorial' && currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  }, [phase, currentPageIndex]);

  const renderNeoAvatar = (size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = { sm: 'w-8 h-8', md: 'w-12 h-12', lg: 'w-16 h-16' };
    return (
      <motion.div
        className={cn("rounded-2xl bg-foreground flex items-center justify-center shadow-lg", sizeClasses[size])}
        animate={{ scale: isTyping ? [1, 1.05, 1] : 1 }}
        transition={{ duration: 0.6, repeat: isTyping ? Infinity : 0 }}
      >
        <span className={cn("font-bold text-background tracking-tight", size === 'sm' ? 'text-[8px]' : size === 'md' ? 'text-xs' : 'text-sm')}>NEO</span>
      </motion.div>
    );
  };

  const renderTypingIndicator = () => (
    <motion.div className="flex items-center gap-1 px-4 py-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {[0, 1, 2].map((i) => (
        <motion.div key={i} className="w-2 h-2 bg-muted-foreground/50 rounded-full"
          animate={{ y: [0, -4, 0] }} transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }} />
      ))}
    </motion.div>
  );

  const renderMessageBubble = (content: React.ReactNode) => (
    <motion.div className="flex gap-3 items-start" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      {renderNeoAvatar('sm')}
      <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-muted text-foreground rounded-tl-sm">
        {content}
      </div>
    </motion.div>
  );

  // ==================== WELCOME ====================
  const renderWelcome = () => (
    <div className="space-y-6">
      <motion.div className="text-center" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
        {renderNeoAvatar('lg')}
      </motion.div>
      {renderMessageBubble(
        <div className="space-y-2">
          <p className="text-base font-medium">¡Hola! 👋 Soy <span className="font-bold">Neo</span>, tu asistente personal de fitness.</p>
          <p className="text-sm text-muted-foreground">Estoy aquí para enseñarte absolutamente todo lo que puedes hacer en esta app. ¡Vamos a recorrer cada sección juntos!</p>
        </div>
      )}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
        {renderMessageBubble(<p className="text-sm">¿Listo para el tour más completo? 💪🚀</p>)}
      </motion.div>
      <motion.div className="pt-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}>
        <Button onClick={() => setPhase('choice')} className="w-full gradient-primary text-primary-foreground" size="lg">
          ¡Vamos! <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </motion.div>
    </div>
  );

  // ==================== CHOICE ====================
  const renderChoice = () => (
    <div className="space-y-6">
      {renderMessageBubble(
        <div className="space-y-2">
          <p className="text-base font-medium">¿Cómo te gustaría empezar?</p>
          <p className="text-sm text-muted-foreground">Te recomiendo el tour guiado: te enseño cada rincón de la app con todo detalle.</p>
        </div>
      )}
      <motion.div className="space-y-3 pt-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
        <motion.button onClick={() => { setPhase('tutorial'); setCurrentPageIndex(0); }}
          className="w-full p-4 rounded-xl border-2 border-primary bg-primary/5 hover:bg-primary/10 transition-all text-left group"
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
              <Play className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">Tutorial guiado completo</p>
              <p className="text-xs text-muted-foreground">Te explico cada función al detalle (~5 min)</p>
            </div>
            <ChevronRight className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </motion.button>

        <motion.button onClick={onSkip}
          className="w-full p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-all text-left group"
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
              <Compass className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">Explorar por mi cuenta</p>
              <p className="text-xs text-muted-foreground">Descubre la app a tu ritmo</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </motion.button>
      </motion.div>
    </div>
  );

  // ==================== TUTORIAL PAGE ====================
  const renderTutorialPage = () => {
    const pageData = ALL_PAGES[currentPageIndex];
    if (!pageData) return null;
    const { page, sectionTitle, pageIndex, totalSectionPages } = pageData;
    const Icon = page.icon;

    return (
      <div className="space-y-4">
        {/* Section badge */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-medium">
            {sectionTitle} · Página {pageIndex + 1}/{totalSectionPages}
          </span>
          <span className="text-xs text-muted-foreground">
            {currentPageIndex + 1}/{TOTAL_PAGES}
          </span>
        </div>

        {/* Hero banner */}
        <motion.div
          className={cn("w-full h-28 rounded-2xl bg-gradient-to-br flex items-center justify-center gap-3", page.gradient)}
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        >
          <Icon className="w-12 h-12 text-white/90" />
          <div>
            <h2 className="text-lg font-bold text-white">{page.title}</h2>
            {page.subtitle && <p className="text-xs text-white/70">{page.subtitle}</p>}
          </div>
        </motion.div>

        {/* Messages from Neo */}
        <div className="space-y-3">
          {page.messages.map((msg, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + idx * 0.2 }}>
              {renderMessageBubble(
                <p className={cn("text-sm", msg.isHighlight ? "font-medium text-foreground" : "text-muted-foreground")}>
                  {msg.text}
                </p>
              )}
            </motion.div>
          ))}
        </div>

        {/* Features list */}
        <motion.div className="space-y-2.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          {page.features.map((feature, idx) => {
            const FeatureIcon = feature.icon;
            return (
              <motion.div key={idx}
                className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 border border-border/50"
                initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + idx * 0.12 }}>
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FeatureIcon className="w-4.5 h-4.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{feature.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{feature.description}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Tip */}
        {page.tip && (
          <motion.div className="bg-primary/5 border border-primary/20 rounded-xl p-3"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Pro tip:</span> {page.tip}
              </p>
            </div>
          </motion.div>
        )}

        {/* Navigation buttons */}
        <motion.div className="flex gap-3 pt-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}>
          {currentPageIndex > 0 && (
            <Button variant="outline" onClick={goBack} className="flex-shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <Button variant="outline" onClick={onSkip} className="flex-1">Saltar</Button>
          <Button onClick={goNext} className="flex-1 gradient-primary text-primary-foreground">
            {currentPageIndex === TOTAL_PAGES - 1 ? 'Finalizar' : 'Siguiente'} <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </motion.div>
      </div>
    );
  };

  // ==================== TIPS ====================
  const renderTips = () => (
    <div className="space-y-6">
      {renderMessageBubble(
        <div className="space-y-2">
          <p className="text-base font-medium">¡Tour completado! 🎉</p>
          <p className="text-sm text-muted-foreground">Ya conoces todas las funciones de la app. Antes de empezar, unos últimos consejos:</p>
        </div>
      )}
      <motion.div className="space-y-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        {[
          { icon: MessageCircle, text: "Puedes pedirme ayuda en cualquier momento desde 'Diseñar'. Soy tu entrenador 24/7." },
          { icon: Target, text: "Empieza definiendo tu objetivo (fuerza, hipertrofia o resistencia) y diseña tu primera rutina." },
          { icon: Calendar, text: "Registra cada entrenamiento: la constancia en los datos es lo que te dará resultados reales." },
          { icon: Apple, text: "Configura tu plan nutricional: el entreno sin buena alimentación es como un coche sin gasolina." },
          { icon: Heart, text: "La consistencia supera a la perfección. Es mejor entrenar 3 días seguidos que 6 días una semana y 0 la siguiente." },
        ].map((tip, idx) => (
          <motion.div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-muted/50"
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + idx * 0.12 }}>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <tip.icon className="w-4 h-4 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground pt-1">{tip.text}</p>
          </motion.div>
        ))}
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
        {renderMessageBubble(<p className="text-sm">¿Listo para empezar a construir tu mejor versión? ¡Vamos a por ello! 🚀💪</p>)}
      </motion.div>
      <motion.div className="pt-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5 }}>
        <Button onClick={onComplete} className="w-full gradient-primary text-primary-foreground" size="lg">
          ¡Comenzar a entrenar! <Sparkles className="w-4 h-4 ml-2" />
        </Button>
      </motion.div>
    </div>
  );

  // ==================== RENDER ====================
  const renderCurrentPhase = () => {
    switch (phase) {
      case 'welcome': return renderWelcome();
      case 'choice': return renderChoice();
      case 'tutorial': return renderTutorialPage();
      case 'tips': return renderTips();
      default: return renderWelcome();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with progress */}
      {phase === 'tutorial' && (
        <motion.header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3"
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {renderNeoAvatar('sm')}
              <div>
                <span className="text-sm font-medium text-foreground">Neo</span>
                <span className="text-xs text-muted-foreground ml-2">Tour guiado</span>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onSkip} className="text-muted-foreground">
              <X className="w-4 h-4" />
            </Button>
          </div>
          <Progress value={progress} className="h-1.5" />
          {/* Section indicators */}
          <div className="flex gap-1 mt-2">
            {TUTORIAL_SECTIONS.map((section) => {
              const sectionPages = ALL_PAGES.filter(p => p.sectionId === section.id);
              const firstPageIdx = ALL_PAGES.indexOf(sectionPages[0]);
              const lastPageIdx = ALL_PAGES.indexOf(sectionPages[sectionPages.length - 1]);
              const isActive = currentPageIndex >= firstPageIdx && currentPageIndex <= lastPageIdx;
              const isCompleted = currentPageIndex > lastPageIdx;
              const SectionIcon = section.sectionIcon;
              return (
                <div key={section.id} className={cn(
                  "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-all",
                  isActive ? "bg-primary/15 text-primary" : isCompleted ? "bg-muted text-muted-foreground" : "text-muted-foreground/50"
                )}>
                  <SectionIcon className="w-3 h-3" />
                  <span className="hidden sm:inline">{section.sectionTitle}</span>
                </div>
              );
            })}
          </div>
        </motion.header>
      )}

      {phase === 'tips' && (
        <motion.header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3"
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {renderNeoAvatar('sm')}
              <span className="text-sm font-medium text-foreground">Neo · Consejos finales</span>
            </div>
          </div>
          <Progress value={100} className="h-1.5 mt-2" />
        </motion.header>
      )}

      {/* Main content */}
      <main className="flex-1 px-4 py-6 overflow-y-auto">
        <div className="max-w-md mx-auto">
          <AnimatePresence mode="wait">
            <motion.div key={`${phase}-${currentPageIndex}`}
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              {isTyping && phase !== 'welcome' ? (
                <div className="flex items-start gap-3">
                  {renderNeoAvatar('sm')}
                  {renderTypingIndicator()}
                </div>
              ) : (
                renderCurrentPhase()
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};
