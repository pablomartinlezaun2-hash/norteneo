import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  X, 
  Activity, 
  Target, 
  Zap, 
  ArrowRight, 
  Heart, 
  Brain,
  TrendingUp,
  Calendar,
  Layers,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ANATOMICAL_MUSCLES, AnatomicalMuscle } from '@/data/anatomyData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AnatomicalDetailModalProps {
  muscleId: string;
  isOpen: boolean;
  onClose: () => void;
  onView3D: () => void;
  seriesData: {
    weekly: number;
    monthly: number;
    last30: number;
    session: number;
  };
}

export const AnatomicalDetailModal = ({
  muscleId,
  isOpen,
  onClose,
  onView3D,
  seriesData,
}: AnatomicalDetailModalProps) => {
  const { t } = useTranslation();
  
  // Find muscle by base ID
  const muscle = ANATOMICAL_MUSCLES.find(m => 
    m.id === muscleId || m.id.replace(/-left$/, '') === muscleId
  );
  
  if (!muscle) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-h-[90vh] bg-background rounded-t-3xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="flex justify-center py-3">
              <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
            </div>
            
            {/* Header */}
            <div className="px-5 pb-4 border-b border-border">
              <div className="flex items-start justify-between">
                <div>
                  <div 
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-2"
                    style={{ backgroundColor: `${muscle.color}20` }}
                  >
                    <div 
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: muscle.color }}
                    />
                    <span 
                      className="text-xs font-semibold"
                      style={{ color: muscle.color }}
                    >
                      {muscle.category === 'upper' ? 'Tren Superior' : 
                       muscle.category === 'lower' ? 'Tren Inferior' : 'Core'}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-foreground">
                    {muscle.name}
                  </h2>
                  <p className="text-sm text-muted-foreground italic">
                    {muscle.latinName}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
            
            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-180px)] px-5 py-4 space-y-5">
              {/* Stats Cards */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Semana', value: seriesData.weekly, icon: Calendar },
                  { label: 'Mes', value: seriesData.monthly, icon: TrendingUp },
                  { label: '30 días', value: seriesData.last30, icon: Activity },
                  { label: 'Total', value: seriesData.session, icon: Target },
                ].map((stat, i) => (
                  <div 
                    key={i}
                    className="gradient-card rounded-xl p-3 text-center border border-border"
                  >
                    <stat.icon className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-lg font-bold text-foreground">{stat.value}</p>
                    <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Tabs for different info sections */}
              <Tabs defaultValue="anatomy" className="w-full">
                <TabsList className="w-full grid grid-cols-3">
                  <TabsTrigger value="anatomy" className="text-xs">Anatomía</TabsTrigger>
                  <TabsTrigger value="function" className="text-xs">Función</TabsTrigger>
                  <TabsTrigger value="relations" className="text-xs">Relaciones</TabsTrigger>
                </TabsList>
                
                <TabsContent value="anatomy" className="mt-4 space-y-4">
                  {/* Origin & Insertion */}
                  <div className="space-y-3">
                    <div className="gradient-card rounded-xl p-4 border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Target className="w-4 h-4 text-primary" />
                        </div>
                        <h4 className="font-semibold text-foreground">Origen</h4>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {muscle.origin}
                      </p>
                    </div>
                    
                    <div className="flex justify-center">
                      <ArrowRight className="w-5 h-5 text-muted-foreground rotate-90" />
                    </div>
                    
                    <div className="gradient-card rounded-xl p-4 border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Zap className="w-4 h-4 text-primary" />
                        </div>
                        <h4 className="font-semibold text-foreground">Inserción</h4>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {muscle.insertion}
                      </p>
                    </div>
                  </div>
                  
                  {/* Innervation & Blood Supply */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="gradient-card rounded-xl p-3 border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs font-semibold text-muted-foreground">Inervación</span>
                      </div>
                      <p className="text-xs text-foreground leading-relaxed">
                        {muscle.innervation}
                      </p>
                    </div>
                    <div className="gradient-card rounded-xl p-3 border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <Heart className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs font-semibold text-muted-foreground">Irrigación</span>
                      </div>
                      <p className="text-xs text-foreground leading-relaxed">
                        {muscle.bloodSupply}
                      </p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="function" className="mt-4 space-y-4">
                  {/* Primary Function */}
                  <div className="gradient-card rounded-xl p-4 border border-primary/30 bg-primary/5">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-5 h-5 text-primary" />
                      <h4 className="font-semibold text-foreground">Función Principal</h4>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">
                      {muscle.primaryFunction}
                    </p>
                  </div>
                  
                  {/* Secondary Functions */}
                  <div className="gradient-card rounded-xl p-4 border border-border">
                    <h4 className="font-semibold text-foreground mb-3">Funciones Secundarias</h4>
                    <ul className="space-y-2">
                      {muscle.secondaryFunctions.map((func, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <ChevronRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          {func}
                        </li>
                      ))}
                    </ul>
                  </div>
                </TabsContent>
                
                <TabsContent value="relations" className="mt-4 space-y-4">
                  {/* Synergists */}
                  <div className="gradient-card rounded-xl p-4 border border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <Layers className="w-4 h-4 text-green-500" />
                      <h4 className="font-semibold text-foreground">Sinergistas</h4>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Músculos que colaboran en el movimiento
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {muscle.synergists.map((syn, i) => (
                        <span 
                          key={i}
                          className="px-2 py-1 text-xs rounded-full bg-green-500/10 text-green-600 border border-green-500/20"
                        >
                          {syn}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {/* Antagonists */}
                  <div className="gradient-card rounded-xl p-4 border border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <Layers className="w-4 h-4 text-orange-500" />
                      <h4 className="font-semibold text-foreground">Antagonistas</h4>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Músculos que realizan la acción opuesta
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {muscle.antagonists.map((ant, i) => (
                        <span 
                          key={i}
                          className="px-2 py-1 text-xs rounded-full bg-orange-500/10 text-orange-600 border border-orange-500/20"
                        >
                          {ant}
                        </span>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            
            {/* Footer Actions */}
            <div className="p-5 border-t border-border bg-card">
              <Button
                onClick={onView3D}
                className="w-full h-12 gradient-primary text-primary-foreground glow-primary"
              >
                <Activity className="w-5 h-5 mr-2" />
                Ver animación de contracción
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
