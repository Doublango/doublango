import React, { useEffect, useState } from 'react';

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  delay: number;
  duration: number;
  emoji?: string;
}

interface ConfettiProps {
  trigger: boolean;
  onComplete?: () => void;
  bananaTheme?: boolean;
}

const COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#f97316', // orange
  '#22c55e', // green
  '#eab308', // yellow
  '#ec4899', // pink
  '#06b6d4', // cyan
];

const BANANA_COLORS = [
  '#FFE135', // bright yellow
  '#FFC107', // golden
  '#FFEB3B', // light yellow
  '#FF9800', // orange
  '#8BC34A', // green (unripe banana)
];

export const Confetti: React.FC<ConfettiProps> = ({ trigger, onComplete, bananaTheme = false }) => {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (trigger) {
      const colors = bananaTheme ? BANANA_COLORS : COLORS;
      const newPieces: ConfettiPiece[] = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.5,
        duration: 2 + Math.random() * 2,
        emoji: bananaTheme && Math.random() > 0.7 ? '🍌' : undefined,
      }));
      setPieces(newPieces);

      const timer = setTimeout(() => {
        setPieces([]);
        onComplete?.();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [trigger, onComplete, bananaTheme]);

  if (pieces.length === 0) return null;

  return (
    <div className="confetti-container">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute"
          style={{
            left: `${piece.x}%`,
            top: '-20px',
            width: piece.emoji ? '24px' : '12px',
            height: piece.emoji ? '24px' : '12px',
            backgroundColor: piece.emoji ? 'transparent' : piece.color,
            borderRadius: !piece.emoji && Math.random() > 0.5 ? '50%' : '0',
            animation: `confetti-fall ${piece.duration}s ease-in-out ${piece.delay}s forwards`,
            fontSize: piece.emoji ? '20px' : undefined,
          }}
        >
          {piece.emoji}
        </div>
      ))}
    </div>
  );
};

export default Confetti;
