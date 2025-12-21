import * as React from 'react';
import { cn } from '@/lib/utils';

interface MonkeyMascotProps extends React.HTMLAttributes<HTMLDivElement> {
  mood?: 'happy' | 'excited' | 'sad' | 'thinking' | 'celebrating';
  size?: 'sm' | 'md' | 'lg' | 'xl';
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
  excited: 'monkey-bounce',
  sad: 'monkey-sad',
  thinking: '',
  celebrating: 'monkey-celebrate',
};

const MonkeyMascot = React.forwardRef<HTMLDivElement, MonkeyMascotProps>(
  ({ mood = 'happy', size = 'md', className, animate = true, ...props }, ref) => {
    const getMoodExpression = () => {
      switch (mood) {
        case 'excited':
        case 'celebrating':
          return { eyeScale: 1.2, mouthOpen: true, armUp: true };
        case 'sad':
          return { eyeScale: 0.8, mouthOpen: false, armUp: false };
        case 'thinking':
          return { eyeScale: 1, mouthOpen: false, armUp: false };
        default:
          return { eyeScale: 1, mouthOpen: false, armUp: false };
      }
    };

    const expression = getMoodExpression();
    const animationClass = animate ? moodAnimations[mood] : '';

    return (
      <div 
        ref={ref} 
        className={cn(sizeClasses[size], animationClass, className)} 
        {...props}
      >
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Body - warm brown */}
          <ellipse cx="50" cy="65" rx="25" ry="28" fill="url(#bodyGradient)" />
          
          {/* Belly - lighter tan */}
          <ellipse cx="50" cy="70" rx="16" ry="18" fill="url(#bellyGradient)" />
          
          {/* Left Arm */}
          <path
            d={expression.armUp 
              ? "M22 55 Q10 40 18 30 Q25 35 30 50 Q26 58 22 55" 
              : "M24 58 Q12 62 15 75 Q22 78 28 68 Q26 58 24 58"
            }
            fill="url(#armGradient)"
            className="transition-all duration-300"
          />
          
          {/* Right Arm */}
          <path
            d={expression.armUp 
              ? "M78 55 Q90 40 82 30 Q75 35 70 50 Q74 58 78 55" 
              : "M76 58 Q88 62 85 75 Q78 78 72 68 Q74 58 76 58"
            }
            fill="url(#armGradient)"
            className="transition-all duration-300"
          />
          
          {/* Ears - outer */}
          <circle cx="22" cy="32" r="12" fill="#8B5A2B" />
          <circle cx="78" cy="32" r="12" fill="#8B5A2B" />
          
          {/* Ears - inner pink */}
          <circle cx="22" cy="32" r="7" fill="#FFCBA4" />
          <circle cx="78" cy="32" r="7" fill="#FFCBA4" />
          
          {/* Head */}
          <ellipse cx="50" cy="35" rx="24" ry="22" fill="url(#headGradient)" />
          
          {/* Face area (lighter) */}
          <ellipse cx="50" cy="40" rx="16" ry="14" fill="#FFCBA4" />
          
          {/* Eyes - white */}
          <ellipse cx="42" cy="34" rx={5 * expression.eyeScale} ry={6 * expression.eyeScale} fill="white" />
          <ellipse cx="58" cy="34" rx={5 * expression.eyeScale} ry={6 * expression.eyeScale} fill="white" />
          
          {/* Eyes - pupils */}
          <circle 
            cx="43" 
            cy="35" 
            r={3 * expression.eyeScale} 
            fill="#2d3748"
            className="transition-all duration-200"
          />
          <circle 
            cx="59" 
            cy="35" 
            r={3 * expression.eyeScale} 
            fill="#2d3748"
            className="transition-all duration-200"
          />
          
          {/* Eye sparkles */}
          <circle cx="44.5" cy="33.5" r="1.2" fill="white" />
          <circle cx="60.5" cy="33.5" r="1.2" fill="white" />
          
          {/* Nose */}
          <ellipse cx="50" cy="43" rx="3" ry="2" fill="#6B4423" />
          
          {/* Mouth */}
          <path
            d={expression.mouthOpen 
              ? "M44 48 Q50 55 56 48" 
              : "M45 48 Q50 52 55 48"
            }
            stroke="#6B4423"
            strokeWidth="2"
            strokeLinecap="round"
            fill={expression.mouthOpen ? "#FF6B6B" : "none"}
            className="transition-all duration-200"
          />
          
          {/* Glasses frame */}
          <circle cx="42" cy="34" r="9" stroke="#4A5568" strokeWidth="2" fill="none" />
          <circle cx="58" cy="34" r="9" stroke="#4A5568" strokeWidth="2" fill="none" />
          <path d="M51 34 L49 34" stroke="#4A5568" strokeWidth="2" />
          <path d="M33 33 L28 30" stroke="#4A5568" strokeWidth="2" />
          <path d="M67 33 L72 30" stroke="#4A5568" strokeWidth="2" />
          
          {/* Hair tuft */}
          <path d="M45 15 Q48 10 50 14 Q52 10 55 15" fill="#8B5A2B" />
          <path d="M47 12 Q50 6 53 12" stroke="#8B5A2B" strokeWidth="2" strokeLinecap="round" fill="none" />
          
          {/* Feet */}
          <ellipse cx="38" cy="92" rx="8" ry="4" fill="#8B5A2B" />
          <ellipse cx="62" cy="92" rx="8" ry="4" fill="#8B5A2B" />
          
          {/* Tail */}
          <path 
            d="M75 75 Q90 70 88 55 Q85 45 80 50" 
            stroke="#8B5A2B" 
            strokeWidth="5" 
            strokeLinecap="round" 
            fill="none"
          />
          
          {/* Gradients */}
          <defs>
            <linearGradient id="bodyGradient" x1="50" y1="37" x2="50" y2="93" gradientUnits="userSpaceOnUse">
              <stop stopColor="#A0522D" />
              <stop offset="1" stopColor="#8B4513" />
            </linearGradient>
            <linearGradient id="bellyGradient" x1="50" y1="52" x2="50" y2="88" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFCBA4" />
              <stop offset="1" stopColor="#DEB887" />
            </linearGradient>
            <linearGradient id="armGradient" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
              <stop stopColor="#A0522D" />
              <stop offset="1" stopColor="#8B4513" />
            </linearGradient>
            <linearGradient id="headGradient" x1="50" y1="13" x2="50" y2="57" gradientUnits="userSpaceOnUse">
              <stop stopColor="#CD853F" />
              <stop offset="1" stopColor="#A0522D" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }
);

MonkeyMascot.displayName = 'MonkeyMascot';

export { MonkeyMascot };
export default MonkeyMascot;
