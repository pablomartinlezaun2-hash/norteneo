import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Plus, 
  Pill, 
  Check,
  X,
  Clock,
  ChevronRight
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Catálogo de suplementos populares
const SUPPLEMENT_CATALOG = [
  { id: 'creatine', name: 'Creatina', category: 'Rendimiento', dosage: '5g', icon: '💪' },
  { id: 'vitamin_d', name: 'Vitamina D3', category: 'Vitaminas', dosage: '2000 UI', icon: '☀️' },
  { id: 'omega3', name: 'Omega-3', category: 'Salud', dosage: '1000mg', icon: '🐟' },
  { id: 'protein', name: 'Proteína Whey', category: 'Proteínas', dosage: '30g', icon: '🥛' },
  { id: 'magnesium', name: 'Magnesio', category: 'Minerales', dosage: '400mg', icon: '⚡' },
  { id: 'zinc', name: 'Zinc', category: 'Minerales', dosage: '15mg', icon: '🛡️' },
  { id: 'vitamin_c', name: 'Vitamina C', category: 'Vitaminas', dosage: '1000mg', icon: '🍊' },
  { id: 'vitamin_b12', name: 'Vitamina B12', category: 'Vitaminas', dosage: '1000mcg', icon: '🔋' },
  { id: 'iron', name: 'Hierro', category: 'Minerales', dosage: '18mg', icon: '🩸' },
  { id: 'calcium', name: 'Calcio', category: 'Minerales', dosage: '1000mg', icon: '🦴' },
  { id: 'bcaa', name: 'BCAAs', category: 'Rendimiento', dosage: '5g', icon: '🏋️' },
  { id: 'glutamine', name: 'Glutamina', category: 'Rendimiento', dosage: '5g', icon: '💊' },
  { id: 'preworkout', name: 'Pre-entreno', category: 'Rendimiento', dosage: '1 dosis', icon: '🚀' },
  { id: 'collagen', name: 'Colágeno', category: 'Salud', dosage: '10g', icon: '✨' },
  { id: 'melatonin', name: 'Melatonina', category: 'Sueño', dosage: '3mg', icon: '🌙' },
  { id: 'ashwagandha', name: 'Ashwagandha', category: 'Adaptógenos', dosage: '600mg', icon: '🌿' },
  { id: 'caffeine', name: 'Cafeína', category: 'Rendimiento', dosage: '200mg', icon: '☕' },
  { id: 'multivitamin', name: 'Multivitamínico', category: 'Vitaminas', dosage: '1 cápsula', icon: '💊' },
];

const CATEGORIES = ['Todos', 'Rendimiento', 'Vitaminas', 'Minerales', 'Proteínas', 'Salud', 'Sueño', 'Adaptógenos'];

interface SupplementCatalogProps {
  existingSupplements: string[];
  onSelectSupplement: (supplement: { name: string; dosage: string }) => void;
  onClose: () => void;
}

export const SupplementCatalog = ({ 
  existingSupplements, 
  onSelectSupplement,
  onClose 
}: SupplementCatalogProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [customName, setCustomName] = useState('');
  const [customDosage, setCustomDosage] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);

  const filteredSupplements = useMemo(() => {
    return SUPPLEMENT_CATALOG.filter(supplement => {
      const matchesSearch = supplement.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'Todos' || supplement.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const isAlreadyAdded = (name: string) => {
    return existingSupplements.some(s => s.toLowerCase() === name.toLowerCase());
  };

  const handleSelectFromCatalog = (supplement: { name: string; dosage: string }) => {
    if (!isAlreadyAdded(supplement.name)) {
      onSelectSupplement(supplement);
    }
  };

  const handleAddCustom = () => {
    if (customName.trim()) {
      onSelectSupplement({ name: customName.trim(), dosage: customDosage.trim() });
      setCustomName('');
      setCustomDosage('');
      setShowCustomForm(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-background border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-background z-10 p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">Añadir Suplemento</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar suplemento..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Categories */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                className={cn(
                  "cursor-pointer whitespace-nowrap transition-all",
                  selectedCategory === category 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-primary/10"
                )}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[50vh] p-4 space-y-2">
          {/* Custom supplement option */}
          <AnimatePresence>
            {showCustomForm ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-3"
              >
                <Input
                  placeholder="Nombre del suplemento"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  autoFocus
                />
                <Input
                  placeholder="Dosis (ej: 5g, 2 cápsulas)"
                  value={customDosage}
                  onChange={(e) => setCustomDosage(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button onClick={handleAddCustom} disabled={!customName.trim()} className="flex-1">
                    <Plus className="w-4 h-4 mr-2" />
                    Añadir
                  </Button>
                  <Button variant="outline" onClick={() => setShowCustomForm(false)}>
                    Cancelar
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full p-4 rounded-xl border-2 border-dashed border-primary/30 text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
                onClick={() => setShowCustomForm(true)}
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium">Añadir suplemento personalizado</span>
              </motion.button>
            )}
          </AnimatePresence>

          {/* Catalog list */}
          {filteredSupplements.map((supplement, index) => {
            const alreadyAdded = isAlreadyAdded(supplement.name);
            
            return (
              <motion.button
                key={supplement.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                disabled={alreadyAdded}
                onClick={() => handleSelectFromCatalog({ name: supplement.name, dosage: supplement.dosage })}
                className={cn(
                  "w-full p-4 rounded-xl border text-left transition-all flex items-center gap-3",
                  alreadyAdded 
                    ? "bg-muted/50 border-border opacity-60 cursor-not-allowed"
                    : "bg-background border-border hover:border-primary/50 hover:bg-primary/5"
                )}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl">
                  {supplement.icon}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{supplement.name}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="secondary" className="text-xs">{supplement.category}</Badge>
                    <span>•</span>
                    <span>{supplement.dosage}</span>
                  </div>
                </div>
                {alreadyAdded ? (
                  <Check className="w-5 h-5 text-primary" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                )}
              </motion.button>
            );
          })}

          {filteredSupplements.length === 0 && !showCustomForm && (
            <div className="text-center py-8 text-muted-foreground">
              <Pill className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No se encontraron suplementos</p>
              <Button variant="link" onClick={() => setShowCustomForm(true)}>
                Añadir uno personalizado
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
