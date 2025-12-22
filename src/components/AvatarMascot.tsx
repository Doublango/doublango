import React from 'react';
import { cn } from '@/lib/utils';
import { useAppSettings, AvatarType } from '@/contexts/AppSettingsContext';

// Import avatar images
import monkeyImg from '@/assets/doublango-logo.png';

interface AvatarMascotProps {
  mood?: 'happy' | 'excited' | 'sad' | 'thinking' | 'celebrating';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animate?: boolean;
  overrideAvatar?: AvatarType;
}

// Emoji fallbacks for avatars that don't have images
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

// Map avatar types to their image sources (if available)
const AVATAR_IMAGES: Partial<Record<AvatarType, string>> = {
  monkey: monkeyImg,
};

const sizeClasses = {
  sm: 'w-10 h-10',
  md: 'w-14 h-14',
  lg: 'w-20 h-20',
  xl: 'w-28 h-28',
};

const emojiSizeClasses = {
  sm: 'text-2xl',
  md: 'text-3xl',
  lg: 'text-4xl',
  xl: 'text-6xl',
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
  
  const hasImage = !!AVATAR_IMAGES[avatarType];
  const imageUrl = AVATAR_IMAGES[avatarType];
  const emoji = AVATAR_EMOJIS[avatarType]?.[mood] || AVATAR_EMOJIS[avatarType]?.happy || '🐵';

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
        'flex items-center justify-center rounded-full bg-gradient-to-br from-banana/30 to-primary/20 overflow-hidden',
        sizeClasses[size],
        animationClass,
        className
      )}
      role="img"
      aria-label={`${avatarType} avatar - ${mood}`}
    >
      {hasImage ? (
        <img 
          src={imageUrl} 
          alt={`${avatarType} avatar`}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className={cn('select-none', emojiSizeClasses[size])}>{emoji}</span>
      )}
    </div>
  );
};

export default AvatarMascot;
