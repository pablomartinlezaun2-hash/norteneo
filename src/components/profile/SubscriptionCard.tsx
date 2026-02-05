import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Crown, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Subscription } from '@/hooks/useUserSettings';
import { cn } from '@/lib/utils';

interface SubscriptionCardProps {
  currentSubscription: Subscription;
  onSubscribe: (type: 'pro' | 'ultra') => void;
}

export const SubscriptionCard = ({ currentSubscription, onSubscribe }: SubscriptionCardProps) => {
  const { t } = useTranslation();

  const plans = [
    {
      type: 'pro' as const,
      name: 'PRO',
      price: '4,99 €/mes',
      color: 'from-amber-500 to-yellow-500',
      textColor: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      glowColor: 'shadow-amber-500/20',
      features: [
        'Exportar planes de entrenamiento',
        'Importar planes de entrenamiento',
        'Exportar dietas',
        'Importar dietas',
        'Sin publicidad',
      ],
    },
    {
      type: 'ultra' as const,
      name: 'ULTRA',
      price: '9,99 €/mes',
      color: 'from-purple-500 to-violet-500',
      textColor: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30',
      glowColor: 'shadow-purple-500/20',
      features: [
        'Todo lo de PRO',
        'Asistente IA ilimitado',
        'Análisis avanzado',
        'Soporte prioritario',
        'Acceso anticipado a novedades',
      ],
    },
  ];

  return (
    <div className="space-y-4">
      {plans.map((plan, index) => {
        const isCurrentPlan = currentSubscription.type === plan.type;
        
        return (
          <motion.div
            key={plan.type}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              "relative rounded-2xl border overflow-hidden",
              plan.borderColor,
              isCurrentPlan && `shadow-lg ${plan.glowColor}`
            )}
          >
            {/* Header */}
            <div className={cn(
              "bg-gradient-to-r p-4",
              plan.color
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {plan.type === 'pro' ? (
                    <Crown className="w-6 h-6 text-white" />
                  ) : (
                    <Sparkles className="w-6 h-6 text-white" />
                  )}
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                </div>
                <span className="text-lg font-bold text-white">{plan.price}</span>
              </div>
            </div>

            {/* Features */}
            <div className="p-4 bg-background">
              <ul className="space-y-2 mb-4">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center gap-2">
                    <div className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center",
                      plan.bgColor
                    )}>
                      <Check className={cn("w-3 h-3", plan.textColor)} />
                    </div>
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              {isCurrentPlan ? (
                <div className={cn(
                  "w-full h-10 rounded-xl flex items-center justify-center font-medium",
                  plan.bgColor,
                  plan.textColor
                )}>
                  {t('subscription.current')}
                </div>
              ) : (
                <Button
                  onClick={() => onSubscribe(plan.type)}
                  className={cn(
                    "w-full h-10 bg-gradient-to-r text-white font-medium",
                    plan.color
                  )}
                >
                  {currentSubscription.type === 'free' 
                    ? t('subscription.subscribe')
                    : t('subscription.upgrade')
                  }
                </Button>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
