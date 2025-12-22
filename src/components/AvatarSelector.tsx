import React from 'react';
import { cn } from '@/lib/utils';
import { AvatarType } from '@/contexts/AppSettingsContext';
import { Check } from 'lucide-react';

interface AvatarSelectorProps {
  selected: AvatarType;
  onSelect: (avatar: AvatarType) => void;
  className?: string;
}

const AVATARS: { type: AvatarType; emoji: string; name: string; description: string }[] = [
  { type: 'monkey', emoji: '🐵', name: 'Mango', description: 'Playful & fun' },
  { type: 'robot', emoji: '🤖', name: 'Beep', description: 'Smart & efficient' },
  { type: 'alien', emoji: '👽', name: 'Zyx', description: 'Out of this world' },
  { type: 'dragon', emoji: '🐉', name: 'Blaze', description: 'Fierce & brave' },
  { type: 'owl', emoji: '🦉', name: 'Sage', description: 'Wise & patient' },
  { type: 'cat', emoji: '🐱', name: 'Whiskers', description: 'Curious & clever' },
];

const AvatarSelector: React.FC<AvatarSelectorProps> = ({ selected, onSelect, className }) => {
  return (
    <div className={cn('grid grid-cols-3 gap-3', className)}>
      {AVATARS.map((avatar) => (
        <button
          key={avatar.type}
          onClick={() => onSelect(avatar.type)}
          className={cn(
            'relative p-4 rounded-2xl border-2 transition-all text-center group',
            selected === avatar.type
              ? 'border-banana bg-banana/10 shadow-banana scale-105'
              : 'border-border hover:border-banana/50 hover:bg-muted/50'
          )}
        >
          {selected === avatar.type && (
            <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-banana flex items-center justify-center">
              <Check className="w-4 h-4 text-banana-foreground" />
            </div>
          )}
          <span className="text-4xl block mb-2 group-hover:scale-110 transition-transform">
            {avatar.emoji}
          </span>
          <p className="font-bold text-sm">{avatar.name}</p>
          <p className="text-xs text-muted-foreground">{avatar.description}</p>
        </button>
      ))}
    </div>
  );
};

export default AvatarSelector;
