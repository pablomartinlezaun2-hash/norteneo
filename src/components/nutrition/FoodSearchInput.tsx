import { useState, useRef, useEffect } from 'react';
import { Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { FoodItem } from '@/hooks/useNutritionData';

interface FoodSearchInputProps {
  foods: FoodItem[];
  onSelect: (food: FoodItem, quantity: number) => void;
  placeholder?: string;
}

export const FoodSearchInput = ({ foods, onSelect, placeholder = 'Buscar alimento...' }: FoodSearchInputProps) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quantity, setQuantity] = useState(100);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredFoods = query.length > 0
    ? foods.filter(food => 
        food.name.toLowerCase().includes(query.toLowerCase()) ||
        food.brand?.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : [];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSelectedFood(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectFood = (food: FoodItem) => {
    setSelectedFood(food);
    setQuery(food.name);
    setIsOpen(false);
  };

  const handleAdd = () => {
    if (selectedFood && quantity > 0) {
      onSelect(selectedFood, quantity);
      setQuery('');
      setSelectedFood(null);
      setQuantity(100);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
              setSelectedFood(null);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className="pl-10"
          />
        </div>
        
        {selectedFood && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex gap-2 items-center"
          >
            <Input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-20 text-center"
              min={1}
            />
            <span className="text-sm text-muted-foreground">g</span>
            <Button onClick={handleAdd} size="icon" className="shrink-0">
              <Plus className="w-4 h-4" />
            </Button>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {isOpen && filteredFoods.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden"
          >
            {filteredFoods.map((food, index) => (
              <motion.button
                key={food.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => handleSelectFood(food)}
                className="w-full px-4 py-3 text-left hover:bg-muted transition-colors border-b border-border last:border-b-0"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-foreground text-sm">{food.name}</p>
                    {food.brand && (
                      <p className="text-xs text-muted-foreground">{food.brand}</p>
                    )}
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>{food.calories_per_100g} kcal</p>
                    <p>P: {food.protein_per_100g}g</p>
                  </div>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
