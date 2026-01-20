import { cn } from '@/lib/utils';
import { BrainCircuit } from 'lucide-react';

export function Logo({
  className,
  showIcon = true,
}: {
  className?: string;
  showIcon?: boolean;
}) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {showIcon && <BrainCircuit className="h-6 w-6 text-primary" />}
      <span className="font-semibold text-xl font-headline tracking-tight">
        TheraFlow
      </span>
    </div>
  );
}
