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

// Emoji expressions for each avatar type
const AVATAR_EMOJIS: Record<AvatarType, Record<string, string>> = {
  parrot: {
    happy: '🦜',
    excited: '🦜',
    sad: '🦜',
    thinking: '🦜',
    celebrating: '🦜',
  },
  fox: {
    happy: '🦊',
    excited: '🦊',
    sad: '🦊',
    thinking: '🦊',
    celebrating: '🦊',
  },
  panda: {
    happy: '🐼',
    excited: '🐼',
    sad: '🐼',
    thinking: '🐼',
    celebrating: '🐼',
  },
  unicorn: {
    happy: '🦄',
    excited: '🦄',
    sad: '🦄',
    thinking: '🦄',
    celebrating: '🦄',
  },
  penguin: {
    happy: '🐧',
    excited: '🐧',
    sad: '🐧',
    thinking: '🐧',
    celebrating: '🐧',
  },
  lion: {
    happy: '🦁',
    excited: '🦁',
    sad: '🦁',
    thinking: '🦁',
    celebrating: '🦁',
  },
  bunny: {
    happy: '🐰',
    excited: '🐰',
    sad: '🐰',
    thinking: '🐰',
    celebrating: '🐰',
  },
  koala: {
    happy: '🐨',
    excited: '🐨',
    sad: '🐨',
    thinking: '🐨',
    celebrating: '🐨',
  },
  tiger: {
    happy: '🐯',
    excited: '🐯',
    sad: '🐯',
    thinking: '🐯',
    celebrating: '🐯',
  },
  monkey: {
    happy: '🐵',
    excited: '🙈',
    sad: '🙊',
    thinking: '🐒',
    celebrating: '🐵',
  },
};

// Avatar gradient colors for visual appeal
const AVATAR_COLORS: Record<AvatarType, string> = {
  parrot: 'from-green-400 to-emerald-500',
  fox: 'from-orange-400 to-amber-500',
  panda: 'from-slate-300 to-slate-400',
  unicorn: 'from-pink-400 to-purple-500',
  penguin: 'from-sky-400 to-blue-500',
  lion: 'from-yellow-400 to-orange-500',
  bunny: 'from-pink-300 to-rose-400',
  koala: 'from-gray-400 to-slate-500',
  tiger: 'from-orange-500 to-red-500',
  monkey: 'from-amber-400 to-yellow-500',
};

// Map avatar types to their image sources (if available)
const AVATAR_IMAGES: Partial<Record<AvatarType, string>> = {
  // Currently using emojis for all - can add custom images later
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

  const gradientColor = AVATAR_COLORS[avatarType] || 'from-banana/30 to-primary/20';

  return (
    <div
      className={cn(
        'relative flex items-center justify-center rounded-full overflow-hidden',
        sizeClasses[size],
        animationClass,
        className
      )}
      role="img"
      aria-label={`${avatarType} avatar - ${mood}`}
    >
      {/* Gradient background */}
      <div className={cn(
        'absolute inset-0 bg-gradient-to-br opacity-30',
        gradientColor
      )} />
      
      {/* Glow effect */}
      <div className={cn(
        'absolute inset-0 bg-gradient-to-br blur-md opacity-40',
        gradientColor
      )} />
      
      {hasImage ? (
        <img 
          src={imageUrl} 
          alt={`${avatarType} avatar`}
          className="relative z-10 w-full h-full object-cover"
        />
      ) : (
        <span className={cn('relative z-10 select-none drop-shadow-lg', emojiSizeClasses[size])}>{emoji}</span>
      )}
    </div>
  );
};

export default AvatarMascot;
