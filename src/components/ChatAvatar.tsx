import React from 'react';
import { cn } from '@/lib/utils';

interface ChatAvatarProps {
  type: 'user' | 'ai';
  speaking?: boolean;
  className?: string;
}

const ChatAvatar: React.FC<ChatAvatarProps> = ({ type, speaking = false, className }) => {
  if (type === 'user') {
    return (
      <div className={cn(
        "w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-lg",
        className
      )}>
        👤
      </div>
    );
  }

  // AI Avatar - friendly parrot character
  return (
    <div className={cn(
      "relative w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center overflow-hidden",
      speaking && "ring-2 ring-primary ring-offset-2 ring-offset-background",
      className
    )}>
      <div className={cn(
        "text-2xl",
        speaking && "animate-bounce"
      )}>
        🦜
      </div>
      {speaking && (
        <div className="absolute inset-0 bg-white/20 animate-pulse" />
      )}
    </div>
  );
};

export default ChatAvatar;
