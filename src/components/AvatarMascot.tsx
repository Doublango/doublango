import React from 'react';
import { cn } from '@/lib/utils';
import { useAppSettings, AvatarType } from '@/contexts/AppSettingsContext';

interface AvatarMascotProps {
  mood?: 'happy' | 'excited' | 'sad' | 'thinking' | 'celebrating';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animate?: boolean;
  overrideAvatar?: AvatarType;
}

const AVATAR_EMOJIS: Record<AvatarType, Record<string, string>> = {
  monkey: {
    happy: '🐵',
    excited: '🙈',
    sad: '🙊',
    thinking: '🐒',
    celebrating: '🎉',
  },
  robot: {
    happy: '🤖',
    excited: '⚡',
    sad: '🔋',
    thinking: '💭',
    celebrating: '🚀',
  },
  alien: {
    happy: '👽',
    excited: '🛸',
    sad: '💫',
    thinking: '🌌',
    celebrating: '✨',
  },
  dragon: {
    happy: '🐉',
    excited: '🔥',
    sad: '💨',
    thinking: '🌙',
    celebrating: '🎊',
  },
  owl: {
    happy: '🦉',
    excited: '📚',
    sad: '😴',
    thinking: '🎓',
    celebrating: '🌟',
  },
  cat: {
    happy: '🐱',
    excited: '😸',
    sad: '😿',
    thinking: '🐈',
    celebrating: '🎀',
  },
};

const sizeClasses = {
  sm: 'w-10 h-10 text-2xl',
  md: 'w-14 h-14 text-3xl',
  lg: 'w-20 h-20 text-4xl',
  xl: 'w-28 h-28 text-6xl',
};

const AvatarMascot: React.FC<AvatarMascotProps> = ({
  mood = 'happy',
  size = 'md',
  className,
  animate = false,
  overrideAvatar,
}) => {
  const { settings } = useAppSettings();
  const avatarType = overrideAvatar || settings.avatar;
  const emoji = AVATAR_EMOJIS[avatarType][mood] || AVATAR_EMOJIS[avatarType].happy;

  const animationClass = animate
    ? mood === 'celebrating'
      ? 'animate-bounce'
      : mood === 'sad'
      ? 'animate-pulse'
      : 'animate-float'
    : '';

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-gradient-to-br from-banana/30 to-primary/20',
        sizeClasses[size],
        animationClass,
        className
      )}
      role="img"
      aria-label={`${avatarType} avatar - ${mood}`}
    >
      <span className="select-none">{emoji}</span>
    </div>
  );
};

export default AvatarMascot;
