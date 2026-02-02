import { cn } from '@/lib/utils';

interface NeoLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const NeoLogo = ({ size = 'md', className }: NeoLogoProps) => {
  const sizeClasses = {
    sm: 'w-6 h-6 text-[8px]',
    md: 'w-8 h-8 text-[10px]',
    lg: 'w-12 h-12 text-sm'
  };

  return (
    <div 
      className={cn(
        "rounded-full bg-black flex items-center justify-center font-bold text-white tracking-tight",
        sizeClasses[size],
        className
      )}
    >
      NEO
    </div>
  );
};
