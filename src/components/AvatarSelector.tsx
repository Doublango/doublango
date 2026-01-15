import React from 'react';
import { cn } from '@/lib/utils';
import { AvatarType } from '@/contexts/AppSettingsContext';
import { Check } from 'lucide-react';

interface AvatarSelectorProps {
  selected: AvatarType;
  onSelect: (avatar: AvatarType) => void;
  className?: string;
}

const AVATARS: { type: AvatarType; emoji: string; name: string; description: string; color: string }[] = [
  { type: 'parrot', emoji: '🦜', name: 'Rio', description: 'Colorful & chatty', color: 'from-green-400 to-emerald-500' },
  { type: 'fox', emoji: '🦊', name: 'Foxy', description: 'Clever & quick', color: 'from-orange-400 to-amber-500' },
  { type: 'panda', emoji: '🐼', name: 'Bao', description: 'Calm & cuddly', color: 'from-slate-300 to-slate-400' },
  { type: 'unicorn', emoji: '🦄', name: 'Sparkle', description: 'Magical & dreamy', color: 'from-pink-400 to-purple-500' },
  { type: 'penguin', emoji: '🐧', name: 'Waddle', description: 'Cool & funny', color: 'from-sky-400 to-blue-500' },
  { type: 'lion', emoji: '🦁', name: 'Leo', description: 'Brave & bold', color: 'from-yellow-400 to-orange-500' },
  { type: 'bunny', emoji: '🐰', name: 'Hoppy', description: 'Sweet & speedy', color: 'from-pink-300 to-rose-400' },
  { type: 'koala', emoji: '🐨', name: 'Koko', description: 'Chill & cozy', color: 'from-gray-400 to-slate-500' },
  { type: 'tiger', emoji: '🐯', name: 'Stripes', description: 'Strong & fierce', color: 'from-orange-500 to-red-500' },
  { type: 'monkey', emoji: '🐵', name: 'Mango', description: 'Playful & fun', color: 'from-amber-400 to-yellow-500' },
];

const AvatarSelector: React.FC<AvatarSelectorProps> = ({ selected, onSelect, className }) => {
  return (
    <div className={cn('grid grid-cols-2 sm:grid-cols-5 gap-3', className)}>
      {AVATARS.map((avatar) => (
        <button
          key={avatar.type}
          onClick={() => onSelect(avatar.type)}
          className={cn(
            'relative p-3 rounded-2xl border-2 transition-all text-center group overflow-hidden',
            selected === avatar.type
              ? 'border-primary bg-primary/10 shadow-lg scale-105 ring-2 ring-primary/30'
              : 'border-border hover:border-primary/50 hover:bg-muted/50 hover:scale-102'
          )}
        >
          {/* Gradient background glow */}
          <div className={cn(
            'absolute inset-0 bg-gradient-to-br opacity-20 group-hover:opacity-30 transition-opacity',
            avatar.color
          )} />
          
          {selected === avatar.type && (
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center z-10 shadow-md">
              <Check className="w-4 h-4 text-primary-foreground" />
            </div>
          )}
          
          <div className="relative z-10">
            <div className={cn(
              'text-4xl mb-2 group-hover:scale-125 transition-transform duration-300',
              selected === avatar.type && 'animate-bounce'
            )}>
              {avatar.emoji}
            </div>
            <p className="font-bold text-sm">{avatar.name}</p>
            <p className="text-xs text-muted-foreground line-clamp-1">{avatar.description}</p>
          </div>
        </button>
      ))}
    </div>
  );
};

export default AvatarSelector;
