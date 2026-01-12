import React from 'react';
import { cn } from '@/lib/utils';
import { ParrotMascot } from '@/components/ParrotMascot';

interface ExerciseCharacterProps {
  mood?: 'happy' | 'excited' | 'sad' | 'thinking' | 'celebrating';
  type?: 'parrot' | 'animal';
  size?: 'sm' | 'md';
  className?: string;
  isKidsMode?: boolean;
}

// Random animals for kids mode variety
const KIDS_ANIMALS = ['🐶', '🐱', '🐰', '🦊', '🐻', '🐼', '🐨', '🦁', '🐯', '🐸', '🐵', '🐔', '🦄', '🐝', '🦋'];

// Get a consistent animal for a given question (based on hash)
const getAnimalForQuestion = (seed?: string): string => {
  if (!seed) return KIDS_ANIMALS[Math.floor(Math.random() * KIDS_ANIMALS.length)];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  return KIDS_ANIMALS[Math.abs(hash) % KIDS_ANIMALS.length];
};

const ExerciseCharacter: React.FC<ExerciseCharacterProps & { questionId?: string }> = ({
  mood = 'happy',
  type = 'parrot',
  size = 'sm',
  className,
  isKidsMode = false,
  questionId,
}) => {
  // In kids mode, randomly show cute animals
  if (isKidsMode && Math.random() > 0.5) {
    const animal = getAnimalForQuestion(questionId);
    return (
      <div 
        className={cn(
          'inline-flex items-center justify-center rounded-full bg-primary/10 animate-float',
          size === 'sm' ? 'w-10 h-10 text-xl' : 'w-14 h-14 text-2xl',
          className
        )}
      >
        {animal}
      </div>
    );
  }

  return (
    <ParrotMascot 
      mood={mood} 
      size={size === 'sm' ? 'sm' : 'md'} 
      animate 
      className={cn('drop-shadow-md', className)}
    />
  );
};

export default ExerciseCharacter;
