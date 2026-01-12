import React from 'react';
import { cn } from '@/lib/utils';
import { Flame } from 'lucide-react';

interface StreakFlameProps {
  streak: number;
  className?: string;
  animated?: boolean;
}

const StreakFlame: React.FC<StreakFlameProps> = ({ streak, className, animated = true }) => {
  // Flame intensity based on streak
  const intensity = Math.min(streak / 7, 1); // Max intensity at 7-day streak
  
  return (
    <div className={cn('relative inline-flex items-center gap-1', className)}>
      {/* Glow effect */}
      <div 
        className={cn(
          'absolute inset-0 rounded-full blur-lg transition-opacity',
          animated && 'animate-pulse'
        )}
        style={{
          background: `radial-gradient(circle, hsl(25 95% 55% / ${0.3 + intensity * 0.4}) 0%, transparent 70%)`,
        }}
      />
      
      {/* Flame icon with animation */}
      <div className={cn('relative', animated && 'animate-flame')}>
        <Flame 
          className={cn(
            'w-8 h-8 text-streak drop-shadow-lg',
            streak >= 7 && 'text-yellow-400',
            streak >= 30 && 'text-orange-500'
          )} 
          fill="currentColor"
        />
        {/* Spark effect for high streaks */}
        {streak >= 3 && (
          <span className="absolute -top-1 -right-1 text-xs animate-ping">✨</span>
        )}
      </div>
      
      {/* Streak count */}
      <span className={cn(
        'font-black text-xl text-streak relative',
        streak >= 7 && 'text-yellow-400',
        streak >= 30 && 'text-orange-500'
      )}>
        {streak}
      </span>
    </div>
  );
};

export default StreakFlame;
