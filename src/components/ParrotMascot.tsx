import React from 'react';

interface ParrotMascotProps {
  mood?: 'happy' | 'excited' | 'sad' | 'thinking' | 'celebrating';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animate?: boolean;
}

const sizeClasses = {
  sm: 'w-12 h-12',
  md: 'w-20 h-20',
  lg: 'w-32 h-32',
  xl: 'w-48 h-48',
};

const moodAnimations = {
  happy: 'animate-float',
  excited: 'parrot-bounce',
  sad: 'parrot-sad',
  thinking: '',
  celebrating: 'parrot-celebrate',
};

export const ParrotMascot: React.FC<ParrotMascotProps> = ({
  mood = 'happy',
  size = 'md',
  className = '',
  animate = true,
}) => {
  const getMoodExpression = () => {
    switch (mood) {
      case 'excited':
      case 'celebrating':
        return { eyeScale: 1.2, beakOpen: true, wingUp: true };
      case 'sad':
        return { eyeScale: 0.8, beakOpen: false, wingUp: false };
      case 'thinking':
        return { eyeScale: 1, beakOpen: false, wingUp: false };
      default:
        return { eyeScale: 1, beakOpen: false, wingUp: false };
    }
  };

  const expression = getMoodExpression();
  const animationClass = animate ? moodAnimations[mood] : '';

  return (
    <div className={`${sizeClasses[size]} ${animationClass} ${className}`}>
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Body - vibrant blue gradient */}
        <ellipse cx="50" cy="60" rx="28" ry="32" fill="url(#bodyGradient)" />
        
        {/* Belly */}
        <ellipse cx="50" cy="68" rx="18" ry="20" fill="url(#bellyGradient)" />
        
        {/* Left Wing */}
        <path
          d={expression.wingUp 
            ? "M20 50 Q5 35 15 25 Q25 30 30 45 Q25 55 20 50" 
            : "M22 55 Q8 55 12 70 Q20 75 28 65 Q25 55 22 55"
          }
          fill="url(#wingGradient)"
          className="transition-all duration-300"
        />
        
        {/* Right Wing */}
        <path
          d={expression.wingUp 
            ? "M80 50 Q95 35 85 25 Q75 30 70 45 Q75 55 80 50" 
            : "M78 55 Q92 55 88 70 Q80 75 72 65 Q75 55 78 55"
          }
          fill="url(#wingGradient)"
          className="transition-all duration-300"
        />
        
        {/* Head */}
        <circle cx="50" cy="32" r="22" fill="url(#headGradient)" />
        
        {/* Crest/Feathers */}
        <path d="M42 12 Q45 5 50 8 Q55 5 58 12 Q55 15 50 13 Q45 15 42 12" fill="#ff6b6b" />
        <path d="M46 8 Q50 2 54 8" stroke="#ff6b6b" strokeWidth="3" strokeLinecap="round" fill="none" />
        
        {/* Face circle (white area) */}
        <circle cx="50" cy="35" r="14" fill="white" />
        
        {/* Eyes */}
        <circle 
          cx="43" 
          cy="32" 
          r={4 * expression.eyeScale} 
          fill="#2d3748"
          className="transition-all duration-200"
        />
        <circle 
          cx="57" 
          cy="32" 
          r={4 * expression.eyeScale} 
          fill="#2d3748"
          className="transition-all duration-200"
        />
        
        {/* Eye sparkles */}
        <circle cx="44.5" cy="30.5" r="1.5" fill="white" />
        <circle cx="58.5" cy="30.5" r="1.5" fill="white" />
        
        {/* Beak */}
        <path
          d={expression.beakOpen 
            ? "M50 38 L45 42 L50 48 L55 42 Z" 
            : "M50 38 L45 42 L50 46 L55 42 Z"
          }
          fill="#ffa726"
          className="transition-all duration-200"
        />
        <path d="M45 42 L55 42" stroke="#ff8c00" strokeWidth="1" />
        
        {/* Blush */}
        <circle cx="38" cy="38" r="3" fill="#ffb3ba" opacity="0.6" />
        <circle cx="62" cy="38" r="3" fill="#ffb3ba" opacity="0.6" />
        
        {/* Feet */}
        <path d="M40 88 L38 95 M42 88 L42 96 M44 88 L46 95" stroke="#ffa726" strokeWidth="2" strokeLinecap="round" />
        <path d="M56 88 L54 95 M58 88 L58 96 M60 88 L62 95" stroke="#ffa726" strokeWidth="2" strokeLinecap="round" />
        
        {/* Tail feathers */}
        <path d="M50 90 Q40 100 35 95" stroke="#8b5cf6" strokeWidth="4" strokeLinecap="round" fill="none" />
        <path d="M50 90 Q50 102 50 98" stroke="#3b82f6" strokeWidth="4" strokeLinecap="round" fill="none" />
        <path d="M50 90 Q60 100 65 95" stroke="#06b6d4" strokeWidth="4" strokeLinecap="round" fill="none" />
        
        {/* Gradients */}
        <defs>
          <linearGradient id="bodyGradient" x1="50" y1="28" x2="50" y2="92" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3b82f6" />
            <stop offset="1" stopColor="#8b5cf6" />
          </linearGradient>
          <linearGradient id="bellyGradient" x1="50" y1="48" x2="50" y2="88" gradientUnits="userSpaceOnUse">
            <stop stopColor="#93c5fd" />
            <stop offset="1" stopColor="#c4b5fd" />
          </linearGradient>
          <linearGradient id="wingGradient" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2563eb" />
            <stop offset="1" stopColor="#7c3aed" />
          </linearGradient>
          <linearGradient id="headGradient" x1="50" y1="10" x2="50" y2="54" gradientUnits="userSpaceOnUse">
            <stop stopColor="#60a5fa" />
            <stop offset="1" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

export default ParrotMascot;