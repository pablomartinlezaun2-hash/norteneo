import { cn } from '@/lib/utils';

interface NeoLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const NeoLogo = ({ size = 'md', className }: NeoLogoProps) => {
  const sizeClasses = {
    sm: 'h-6 px-2 text-[9px]',
    md: 'h-8 px-3 text-[11px]',
    lg: 'h-10 px-4 text-xs'
  };

  return (
    <div 
      className={cn(
        "rounded-lg bg-foreground flex items-center justify-center font-bold text-background tracking-[0.08em] uppercase",
        sizeClasses[size],
        className
      )}
    >
      NEO
    </div>
  );
};
