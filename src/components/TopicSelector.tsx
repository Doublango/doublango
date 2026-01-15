import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface Topic {
  id: string;
  name: string;
  emoji: string;
  description: string;
}

const TOPICS: Topic[] = [
  { id: 'greetings', name: 'Greetings', emoji: '👋', description: 'Hello, how are you?' },
  { id: 'food', name: 'Food & Dining', emoji: '🍽️', description: 'Restaurants & cooking' },
  { id: 'travel', name: 'Travel', emoji: '✈️', description: 'Trips & destinations' },
  { id: 'hobbies', name: 'Hobbies', emoji: '🎨', description: 'Free time activities' },
  { id: 'daily', name: 'Daily Life', emoji: '🌅', description: 'Routines & schedules' },
  { id: 'shopping', name: 'Shopping', emoji: '🛍️', description: 'Stores & purchases' },
  { id: 'weather', name: 'Weather', emoji: '☀️', description: 'Climate & seasons' },
  { id: 'family', name: 'Family', emoji: '👨‍👩‍👧', description: 'Relatives & pets' },
];

interface TopicSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTopic: (topicId: string) => void;
  selectedTopic?: string;
}

const TopicSelector: React.FC<TopicSelectorProps> = ({
  open,
  onOpenChange,
  onSelectTopic,
  selectedTopic,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            💬 Choose a Topic
          </DialogTitle>
          <DialogDescription>
            Pick a conversation topic to practice
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-2 mt-2">
          {TOPICS.map((topic) => (
            <Button
              key={topic.id}
              variant="outline"
              className={cn(
                "h-auto flex-col py-3 gap-1 hover:bg-primary/10",
                selectedTopic === topic.id && "border-primary bg-primary/5"
              )}
              onClick={() => {
                onSelectTopic(topic.id);
                onOpenChange(false);
              }}
            >
              <span className="text-2xl">{topic.emoji}</span>
              <span className="text-sm font-medium">{topic.name}</span>
              <span className="text-[10px] text-muted-foreground">{topic.description}</span>
            </Button>
          ))}
        </div>
        
        <Button
          variant="secondary"
          className="mt-2"
          onClick={() => {
            onSelectTopic('random');
            onOpenChange(false);
          }}
        >
          🎲 Random Topic
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default TopicSelector;
