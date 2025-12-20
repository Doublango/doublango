import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  max: number;
  variant?: 'primary' | 'xp' | 'success' | 'streak' | 'crystal' | 'heart';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
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

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max,
  variant = 'primary',
  size = 'md',
  showLabel = false,
  className,
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn('w-full', className)}>
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
};

export default ProgressBar;