import React from 'react';
import { cn } from '@/lib/utils';
import AvatarMascot from '@/components/AvatarMascot';
import { useAppSettings } from '@/contexts/AppSettingsContext';

interface ExerciseCharacterProps {
  mood?: 'happy' | 'excited' | 'sad' | 'thinking' | 'celebrating';
  size?: 'sm' | 'md';
  className?: string;
  isKidsMode?: boolean;
  questionId?: string;
}

const ExerciseCharacter: React.FC<ExerciseCharacterProps> = ({
  mood = 'happy',
  size = 'sm',
  className,
  isKidsMode = false,
  questionId,
}) => {
  const { settings } = useAppSettings();
  
  // Use the user's chosen avatar
  return (
    <AvatarMascot 
      mood={mood} 
      size={size === 'sm' ? 'sm' : 'md'} 
      animate 
      className={cn('drop-shadow-md', className)}
    />
  );
};

export default ExerciseCharacter;
