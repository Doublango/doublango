import * as React from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max: number;
  variant?: 'primary' | 'xp' | 'success' | 'streak' | 'crystal' | 'heart';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const variantClasses = {
  primary: 'gradient-primary',
  xp: 'gradient-xp',
  success: 'gradient-success',
  streak: 'gradient-streak',
  crystal: 'gradient-crystal',
  heart: 'bg-heart',
};

const sizeClasses = {
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-4',
};

const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ value, max, variant = 'primary', size = 'md', showLabel = false, className, ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    return (
      <div ref={ref} className={cn('w-full', className)} {...props}>
        {showLabel && (
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold">{value}/{max}</span>
          </div>
        )}
        <div className={cn('progress-bar', sizeClasses[size])}>
          <div
            className={cn('progress-fill', variantClasses[variant])}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }
);

ProgressBar.displayName = 'ProgressBar';

export { ProgressBar };
export default ProgressBar;
