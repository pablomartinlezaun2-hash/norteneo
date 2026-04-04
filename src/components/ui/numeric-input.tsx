import * as React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface NumericInputProps extends Omit<React.ComponentProps<'input'>, 'value' | 'onChange' | 'type'> {
  value: number | '' ;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  allowEmpty?: boolean;
  onEmptyValue?: () => void;
}

/**
 * A numeric input that allows free text editing and only validates/commits on blur.
 * Solves the common React issue where `parseInt(e.target.value) || fallback`
 * prevents typing single-digit numbers.
 */
const NumericInput = React.forwardRef<HTMLInputElement, NumericInputProps>(
  ({ value, onValueChange, min = 0, max, allowEmpty = false, onEmptyValue, className, ...props }, ref) => {
    const [raw, setRaw] = React.useState(value === '' ? '' : value.toString());

    React.useEffect(() => {
      setRaw(value === '' ? '' : value.toString());
    }, [value]);

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="numeric"
        value={raw}
        onChange={e => {
          // Allow digits and optionally a single decimal point
          const v = e.target.value.replace(/[^0-9.]/g, '');
          setRaw(v);
        }}
        onBlur={() => {
          if (raw === '' && allowEmpty) {
            onEmptyValue?.();
            return;
          }
          const n = parseFloat(raw);
          if (isNaN(n) || n < min) {
            const clamped = min;
            setRaw(clamped.toString());
            onValueChange(clamped);
          } else if (max !== undefined && n > max) {
            setRaw(max.toString());
            onValueChange(max);
          } else {
            setRaw(n.toString());
            onValueChange(n);
          }
        }}
        className={cn(className)}
        {...props}
      />
    );
  }
);
NumericInput.displayName = 'NumericInput';

export { NumericInput };
