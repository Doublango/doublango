import * as React from 'react';
import { cn } from '@/lib/utils';

interface ParrotMascotProps extends React.HTMLAttributes<HTMLDivElement> {
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
  excited: 'parrot-bounce',
  sad: 'parrot-sad',
  thinking: '',
  celebrating: 'parrot-celebrate',
};

const ParrotMascot = React.forwardRef<HTMLDivElement, ParrotMascotProps>(
  ({ mood = 'happy', size = 'md', className, animate = true, ...props }, ref) => {
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
      <div 
        ref={ref} 
        className={cn(sizeClasses[size], animationClass, className)} 
        {...props}
      >
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Body - vibrant green gradient (like DoubLango logo) */}
          <ellipse cx="50" cy="60" rx="28" ry="32" fill="url(#bodyGradientGreen)" />
          
          {/* Belly - lighter green/yellow */}
          <ellipse cx="50" cy="68" rx="18" ry="20" fill="url(#bellyGradientGreen)" />
          
          {/* Left Wing */}
          <path
            d={expression.wingUp 
              ? "M20 50 Q5 35 15 25 Q25 30 30 45 Q25 55 20 50" 
              : "M22 55 Q8 55 12 70 Q20 75 28 65 Q25 55 22 55"
            }
            fill="url(#wingGradientGreen)"
            className="transition-all duration-300"
          />
          
          {/* Right Wing */}
          <path
            d={expression.wingUp 
              ? "M80 50 Q95 35 85 25 Q75 30 70 45 Q75 55 80 50" 
              : "M78 55 Q92 55 88 70 Q80 75 72 65 Q75 55 78 55"
            }
            fill="url(#wingGradientGreen)"
            className="transition-all duration-300"
          />
          
          {/* Head - green */}
          <circle cx="50" cy="32" r="22" fill="url(#headGradientGreen)" />
          
          {/* Crest/Feathers - red accent like logo */}
          <path d="M42 12 Q45 5 50 8 Q55 5 58 12 Q55 15 50 13 Q45 15 42 12" fill="#ef4444" />
          <path d="M46 8 Q50 2 54 8" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" fill="none" />
          
          {/* Face circle (white area) */}
          <circle cx="50" cy="35" r="14" fill="white" />
          
          {/* Eyes - larger and friendlier */}
          <circle 
            cx="43" 
            cy="32" 
            r={4.5 * expression.eyeScale} 
            fill="#1a1a2e"
            className="transition-all duration-200"
          />
          <circle 
            cx="57" 
            cy="32" 
            r={4.5 * expression.eyeScale} 
            fill="#1a1a2e"
            className="transition-all duration-200"
          />
          
          {/* Eye sparkles */}
          <circle cx="44.5" cy="30" r="2" fill="white" />
          <circle cx="58.5" cy="30" r="2" fill="white" />
          
          {/* Beak - orange/yellow */}
          <path
            d={expression.beakOpen 
              ? "M50 38 L44 42 L50 50 L56 42 Z" 
              : "M50 38 L44 42 L50 47 L56 42 Z"
            }
            fill="#f59e0b"
            className="transition-all duration-200"
          />
          <path d="M44 42 L56 42" stroke="#d97706" strokeWidth="1" />
          
          {/* Blush */}
          <circle cx="36" cy="38" r="3.5" fill="#fca5a5" opacity="0.5" />
          <circle cx="64" cy="38" r="3.5" fill="#fca5a5" opacity="0.5" />
          
          {/* Feet - orange */}
          <path d="M40 88 L38 95 M42 88 L42 96 M44 88 L46 95" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M56 88 L54 95 M58 88 L58 96 M60 88 L62 95" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
          
          {/* Tail feathers - green/yellow gradient */}
          <path d="M50 90 Q40 100 35 95" stroke="#16a34a" strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d="M50 90 Q50 102 50 98" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d="M50 90 Q60 100 65 95" stroke="#4ade80" strokeWidth="4" strokeLinecap="round" fill="none" />
          
          {/* Gradients - Green Theme */}
          <defs>
            <linearGradient id="bodyGradientGreen" x1="50" y1="28" x2="50" y2="92" gradientUnits="userSpaceOnUse">
              <stop stopColor="#22c55e" />
              <stop offset="1" stopColor="#16a34a" />
            </linearGradient>
            <linearGradient id="bellyGradientGreen" x1="50" y1="48" x2="50" y2="88" gradientUnits="userSpaceOnUse">
              <stop stopColor="#bbf7d0" />
              <stop offset="1" stopColor="#86efac" />
            </linearGradient>
            <linearGradient id="wingGradientGreen" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
              <stop stopColor="#15803d" />
              <stop offset="1" stopColor="#166534" />
            </linearGradient>
            <linearGradient id="headGradientGreen" x1="50" y1="10" x2="50" y2="54" gradientUnits="userSpaceOnUse">
              <stop stopColor="#4ade80" />
              <stop offset="1" stopColor="#22c55e" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }
);

ParrotMascot.displayName = 'ParrotMascot';

export { ParrotMascot };
export default ParrotMascot;
