import { cn } from '@/lib/utils';

interface NeoLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const NeoLogo = ({ size = 'md', className }: NeoLogoProps) => {
  const sizeClasses = {
    sm: 'h-7 px-2.5 text-[10px]',
    md: 'h-9 px-3.5 text-[13px]',
    lg: 'h-11 px-5 text-sm'
  };

  return (
    <div 
      className={cn(
        "rounded-lg bg-foreground flex items-center justify-center font-bold text-background tracking-[0.12em] uppercase",
        sizeClasses[size],
        className
      )}
    >
      NEO
    </div>
  );
};
