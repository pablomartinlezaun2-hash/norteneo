import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Plus } from 'lucide-react';

interface SetFormProps {
  setNumber: number;
  onSubmit: (data: {
    weight: number;
    reps: number;
    partialReps: number;
    rir: number | null;
    isWarmup: boolean;
  }) => Promise<{ error: string | null }>;
  lastLog?: {
    weight: number;
    reps: number;
    rir: number | null;
  } | null;
}

export const SetForm = ({ setNumber, onSubmit, lastLog }: SetFormProps) => {
  const [weight, setWeight] = useState(lastLog?.weight?.toString() || '');
  const [reps, setReps] = useState(lastLog?.reps?.toString() || '');
  const [partialReps, setPartialReps] = useState('0');
  const [rir, setRir] = useState(lastLog?.rir?.toString() || '2');
  const [isWarmup, setIsWarmup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!weight || !reps) {
      setError('Peso y repeticiones son obligatorios');
      return;
    }

    const weightNum = parseFloat(weight);
    const repsNum = parseInt(reps);
    const partialRepsNum = parseInt(partialReps) || 0;
    const rirNum = rir ? parseInt(rir) : null;

    if (isNaN(weightNum) || weightNum <= 0) {
      setError('Peso inválido');
      return;
    }
    if (isNaN(repsNum) || repsNum <= 0) {
      setError('Repeticiones inválidas');
      return;
    }

    setLoading(true);
    const result = await onSubmit({
      weight: weightNum,
      reps: repsNum,
      partialReps: partialRepsNum,
      rir: rirNum,
      isWarmup,
    });

    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border">
      <div className="flex items-center gap-2 mb-2">
        <Checkbox
          id={`warmup-${setNumber}`}
          checked={isWarmup}
          onCheckedChange={(checked) => setIsWarmup(checked === true)}
        />
        <Label htmlFor={`warmup-${setNumber}`} className="text-xs text-muted-foreground cursor-pointer">
          Serie de calentamiento
        </Label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor={`weight-${setNumber}`} className="text-xs font-medium">
            Peso (kg)
          </Label>
          <Input
            id={`weight-${setNumber}`}
            type="number"
            step="0.5"
            placeholder="80"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`reps-${setNumber}`} className="text-xs font-medium">
            Reps
          </Label>
          <Input
            id={`reps-${setNumber}`}
            type="number"
            placeholder="10"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            className="h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`partial-${setNumber}`} className="text-xs font-medium">
            Reps parciales
          </Label>
          <Input
            id={`partial-${setNumber}`}
            type="number"
            placeholder="0"
            value={partialReps}
            onChange={(e) => setPartialReps(e.target.value)}
            className="h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`rir-${setNumber}`} className="text-xs font-medium">
            RIR
          </Label>
          <Input
            id={`rir-${setNumber}`}
            type="number"
            min="0"
            max="5"
            placeholder="2"
            value={rir}
            onChange={(e) => setRir(e.target.value)}
            className="h-9"
          />
        </div>
      </div>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {success && (
        <div className="p-2 bg-success/10 border border-success/20 rounded-lg">
          <p className="text-xs text-success font-medium text-center">
            ¡Registro guardado! 💪
          </p>
        </div>
      )}

      <Button
        type="submit"
        size="sm"
        disabled={loading}
        className="w-full gradient-primary text-primary-foreground"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : (
          <Plus className="w-4 h-4 mr-2" />
        )}
        Guardar serie
      </Button>
    </form>
  );
};
