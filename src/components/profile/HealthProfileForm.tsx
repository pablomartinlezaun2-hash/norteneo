import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Scale, Ruler, Calendar, AlertTriangle, Pill, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HealthProfile } from '@/hooks/useUserSettings';
import { cn } from '@/lib/utils';

interface HealthProfileFormProps {
  profile: HealthProfile;
  onSave: (profile: HealthProfile) => void;
}

export const HealthProfileForm = ({ profile, onSave }: HealthProfileFormProps) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<HealthProfile>(profile);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (field: keyof HealthProfile, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSubmit = () => {
    onSave(formData);
    setHasChanges(false);
  };

  const toggleUnit = () => {
    const newUnit = formData.unit === 'kg' ? 'lbs' : 'kg';
    let newWeight = formData.weight;
    
    if (newUnit === 'lbs') {
      newWeight = Math.round(formData.weight * 2.205);
    } else {
      newWeight = Math.round(formData.weight / 2.205);
    }
    
    setFormData(prev => ({ ...prev, unit: newUnit, weight: newWeight }));
    setHasChanges(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Weight */}
      <div className="gradient-card rounded-xl p-4 border border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Scale className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <Label className="text-sm font-medium">{t('health.weight')}</Label>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleUnit}
            className="text-xs"
          >
            {formData.unit}
          </Button>
        </div>
        <Input
          type="number"
          value={formData.weight}
          onChange={(e) => handleChange('weight', parseFloat(e.target.value) || 0)}
          className="text-lg font-semibold"
        />
      </div>

      {/* Height */}
      <div className="gradient-card rounded-xl p-4 border border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
            <Ruler className="w-5 h-5 text-cyan-500" />
          </div>
          <Label className="text-sm font-medium">{t('health.height')} (cm)</Label>
        </div>
        <Input
          type="number"
          value={formData.height}
          onChange={(e) => handleChange('height', parseFloat(e.target.value) || 0)}
          className="text-lg font-semibold"
        />
      </div>

      {/* Age */}
      <div className="gradient-card rounded-xl p-4 border border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-green-500" />
          </div>
          <Label className="text-sm font-medium">{t('health.age')}</Label>
        </div>
        <Input
          type="number"
          value={formData.age}
          onChange={(e) => handleChange('age', parseInt(e.target.value) || 0)}
          className="text-lg font-semibold"
        />
      </div>

      {/* Injuries */}
      <div className="gradient-card rounded-xl p-4 border border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
          </div>
          <Label className="text-sm font-medium">{t('health.injuries')}</Label>
        </div>
        <Input
          type="text"
          value={formData.injuries}
          onChange={(e) => handleChange('injuries', e.target.value)}
          placeholder="Ej: Tendinitis hombro derecho"
          className="text-sm"
        />
      </div>

      {/* Allergies */}
      <div className="gradient-card rounded-xl p-4 border border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
            <Pill className="w-5 h-5 text-red-500" />
          </div>
          <Label className="text-sm font-medium">{t('health.allergies')}</Label>
        </div>
        <Input
          type="text"
          value={formData.allergies}
          onChange={(e) => handleChange('allergies', e.target.value)}
          placeholder="Ej: Lactosa, gluten"
          className="text-sm"
        />
      </div>

      {/* Save Button */}
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button
            onClick={handleSubmit}
            className="w-full h-12 gradient-primary text-primary-foreground glow-primary"
          >
            <Save className="w-5 h-5 mr-2" />
            {t('health.save')}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};
