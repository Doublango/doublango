import React from 'react';
import { cn } from '@/lib/utils';
import ChatAvatar from './ChatAvatar';
import { Button } from '@/components/ui/button';
import { Volume2 } from 'lucide-react';

interface ChatMessageProps {
  type: 'user' | 'ai';
  message: string;
  translation?: string;
  timestamp?: Date;
  speaking?: boolean;
  onPlayAudio?: () => void;
  isPlaying?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  type,
  message,
  translation,
  timestamp,
  speaking = false,
  onPlayAudio,
  isPlaying = false,
}) => {
  const isUser = type === 'user';

  return (
    <div className={cn(
      "flex gap-2 mb-3",
      isUser ? "flex-row-reverse" : "flex-row"
    )}>
      <ChatAvatar type={type} speaking={speaking} />
      
      <div className={cn(
        "max-w-[75%] space-y-1",
        isUser ? "items-end" : "items-start"
      )}>
        <div className={cn(
          "rounded-2xl px-4 py-2.5 shadow-sm",
          isUser 
            ? "bg-primary text-primary-foreground rounded-br-md" 
            : "bg-muted rounded-bl-md"
        )}>
          <p className="text-sm leading-relaxed">{message}</p>
        </div>
        
        {translation && (
          <div className={cn(
            "flex items-center gap-1",
            isUser ? "justify-end" : "justify-start"
          )}>
            <p className={cn(
              "text-xs text-muted-foreground italic px-2",
              isUser ? "text-right" : "text-left"
            )}>
              {translation}
            </p>
            {!isUser && onPlayAudio && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={onPlayAudio}
                disabled={isPlaying}
              >
                <Volume2 className={cn("w-3.5 h-3.5", isPlaying && "animate-pulse text-primary")} />
              </Button>
            )}
          </div>
        )}
        
        {timestamp && (
          <p className={cn(
            "text-[10px] text-muted-foreground/60 px-2",
            isUser ? "text-right" : "text-left"
          )}>
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
