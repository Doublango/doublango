import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface XPBurstProps {
  amount: number;
  trigger: boolean;
  onComplete?: () => void;
}

const XPBurst: React.FC<XPBurstProps> = ({ amount, trigger, onComplete }) => {
  const [visible, setVisible] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; rotation: number }>>([]);

  useEffect(() => {
    if (trigger && amount > 0) {
      setVisible(true);
      setParticles(
        Array.from({ length: 8 }, (_, i) => ({
          id: i,
          x: (Math.random() - 0.5) * 100,
          y: (Math.random() - 0.5) * 60 - 40,
          rotation: (Math.random() - 0.5) * 60,
        }))
      );
      
      const timer = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [trigger, amount, onComplete]);

  if (!visible) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible z-50">
      {/* Main XP text */}
      <div 
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-xp-burst"
      >
        <span className="text-3xl font-black text-xp drop-shadow-lg">
          +{amount} XP
        </span>
      </div>
      
      {/* Burst particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute left-1/2 top-1/2 animate-particle-burst"
          style={{
            '--burst-x': `${p.x}px`,
            '--burst-y': `${p.y}px`,
            '--burst-rotate': `${p.rotation}deg`,
          } as React.CSSProperties}
        >
          <span className="text-lg">✨</span>
        </div>
      ))}
    </div>
  );
};

export default XPBurst;
