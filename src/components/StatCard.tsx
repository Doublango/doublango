import React from 'react';
import { Flame, Heart, Gem, Zap, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  type: 'streak' | 'lives' | 'crystals' | 'xp' | 'league';
  value: number | string;
  label?: string;
  maxValue?: number;
  onClick?: () => void;
  className?: string;
}

const statConfig = {
  streak: {
    icon: Flame,
    bgClass: 'bg-streak/10',
    iconClass: 'text-streak',
    valueClass: 'text-streak',
  },
  lives: {
    icon: Heart,
    bgClass: 'bg-heart/10',
    iconClass: 'text-heart',
    valueClass: 'text-heart',
  },
  crystals: {
    icon: Gem,
    bgClass: 'bg-crystal/10',
    iconClass: 'text-crystal',
    valueClass: 'text-crystal',
  },
  xp: {
    icon: Zap,
    bgClass: 'bg-xp/10',
    iconClass: 'text-xp',
    valueClass: 'text-xp',
  },
  league: {
    icon: Trophy,
    bgClass: 'bg-warning/10',
    iconClass: 'text-warning',
    valueClass: 'text-warning',
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  type,
  value,
  label,
  maxValue,
  onClick,
  className,
}) => {
  const config = statConfig[type];
  const Icon = config.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        'stat-card',
        config.bgClass,
        onClick && 'cursor-pointer hover:shadow-md',
        !onClick && 'cursor-default',
        className
      )}
    >
      <Icon className={cn('w-5 h-5', config.iconClass)} />
      <div className="flex items-baseline gap-1">
        <span className={cn('font-bold text-lg', config.valueClass)}>{value}</span>
        {maxValue !== undefined && (
          <span className="text-muted-foreground text-sm">/{maxValue}</span>
        )}
      </div>
      {label && <span className="text-xs text-muted-foreground hidden sm:inline">{label}</span>}
    </button>
  );
};

export default StatCard;