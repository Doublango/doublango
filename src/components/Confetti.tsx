import React, { useEffect, useState } from 'react';

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  delay: number;
  duration: number;
}

interface ConfettiProps {
  trigger: boolean;
  onComplete?: () => void;
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

export const Confetti: React.FC<ConfettiProps> = ({ trigger, onComplete }) => {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (trigger) {
      const newPieces: ConfettiPiece[] = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        delay: Math.random() * 0.5,
        duration: 2 + Math.random() * 2,
      }));
      setPieces(newPieces);

      const timer = setTimeout(() => {
        setPieces([]);
        onComplete?.();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [trigger, onComplete]);

  if (pieces.length === 0) return null;

  return (
    <div className="confetti-container">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute w-3 h-3"
          style={{
            left: `${piece.x}%`,
            top: '-20px',
            backgroundColor: piece.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '0',
            animation: `confetti-fall ${piece.duration}s ease-in-out ${piece.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
};

export default Confetti;