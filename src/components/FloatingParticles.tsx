import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface Particle {
  id: number;
  emoji: string;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
}

interface FloatingParticlesProps {
  className?: string;
  count?: number;
  emojis?: string[];
}

const DEFAULT_EMOJIS = ['🍌', '⭐', '✨', '🎯', '🔥', '💎', '🌟'];

const FloatingParticles: React.FC<FloatingParticlesProps> = ({
  className,
  count = 12,
  emojis = DEFAULT_EMOJIS,
}) => {
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 12 + Math.random() * 16,
      delay: Math.random() * 5,
      duration: 4 + Math.random() * 4,
    }));
  }, [count, emojis]);

  return (
    <div className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}>
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute opacity-20 animate-float"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            fontSize: `${p.size}px`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        >
          {p.emoji}
        </div>
      ))}
    </div>
  );
};

export default FloatingParticles;
