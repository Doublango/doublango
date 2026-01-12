import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ParrotMascot } from '@/components/ParrotMascot';

interface AnimatedParrotProps {
  mood?: 'happy' | 'excited' | 'sad' | 'thinking' | 'celebrating';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showSpeechBubble?: boolean;
  speechText?: string;
  onClick?: () => void;
}

const IDLE_MESSAGES = [
  "Let's learn! 🎓",
  "You're doing great! 💪",
  "Ready for adventure? 🚀",
  "Keep going! ⭐",
  "Learning is fun! 🎉",
];

const AnimatedParrot: React.FC<AnimatedParrotProps> = ({
  mood = 'happy',
  size = 'lg',
  className,
  showSpeechBubble = false,
  speechText,
  onClick,
}) => {
  const [currentMood, setCurrentMood] = useState(mood);
  const [isInteracting, setIsInteracting] = useState(false);
  const [bubbleText, setBubbleText] = useState(speechText || IDLE_MESSAGES[0]);
  const [showBubble, setShowBubble] = useState(showSpeechBubble);

  // Cycle through random moods occasionally
  useEffect(() => {
    if (mood === 'happy') {
      const interval = setInterval(() => {
        const moods: Array<'happy' | 'excited' | 'thinking'> = ['happy', 'excited', 'thinking'];
        setCurrentMood(moods[Math.floor(Math.random() * moods.length)]);
        
        // Random speech bubble
        if (Math.random() > 0.6) {
          setBubbleText(IDLE_MESSAGES[Math.floor(Math.random() * IDLE_MESSAGES.length)]);
          setShowBubble(true);
          setTimeout(() => setShowBubble(false), 3000);
        }
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [mood]);

  const handleClick = () => {
    setIsInteracting(true);
    setCurrentMood('excited');
    setBubbleText("You tapped me! 🎉");
    setShowBubble(true);
    
    onClick?.();
    
    setTimeout(() => {
      setIsInteracting(false);
      setCurrentMood(mood);
      setShowBubble(showSpeechBubble);
    }, 2000);
  };

  return (
    <div 
      className={cn(
        'relative cursor-pointer transition-transform hover:scale-105 active:scale-95',
        isInteracting && 'animate-bounce',
        className
      )}
      onClick={handleClick}
    >
      {/* Speech Bubble */}
      {showBubble && (
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-10 animate-scale-in">
          <div className="bg-card px-4 py-2 rounded-2xl shadow-lg border border-border whitespace-nowrap">
            <p className="text-sm font-semibold">{bubbleText}</p>
          </div>
          {/* Bubble tail */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-card" />
        </div>
      )}
      
      {/* Glow effect */}
      <div className="absolute inset-0 rounded-full bg-banana/30 blur-xl animate-pulse-glow" />
      
      {/* The Parrot */}
      <ParrotMascot 
        mood={currentMood} 
        size={size} 
        animate 
        className="relative z-10 drop-shadow-xl"
      />
      
      {/* Sparkles around parrot */}
      <div className="absolute -top-2 -right-2 text-xl animate-pulse">✨</div>
      <div className="absolute -bottom-1 -left-2 text-lg animate-pulse" style={{ animationDelay: '0.5s' }}>⭐</div>
    </div>
  );
};

export default AnimatedParrot;
