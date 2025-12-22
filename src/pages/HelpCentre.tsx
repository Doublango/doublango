import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ChevronDown, Search, MessageCircle, Book, Mic, Settings, CreditCard, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import BottomNavigation from '@/components/BottomNavigation';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  items: FAQItem[];
}

const HelpCentre: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const faqCategories: FAQCategory[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: <Book className="w-5 h-5" />,
      items: [
        {
          question: 'How do I start learning a new language?',
          answer: 'Go to the Languages page from Settings or use the language dropdown on the home screen. Select your target language and complete the onboarding to set your goals.'
        },
        {
          question: 'What is a streak and how do I maintain it?',
          answer: 'A streak counts consecutive days of practice. Complete at least one lesson per day to maintain your streak. Missing a day resets your streak to zero.'
        },
        {
          question: 'How does the XP system work?',
          answer: 'You earn XP (experience points) by completing lessons and exercises. Correct answers give more XP. Daily goals help you track your progress.'
        },
      ]
    },
    {
      id: 'speaking',
      title: 'Speaking & Listening',
      icon: <Mic className="w-5 h-5" />,
      items: [
        {
          question: 'How do I practice speaking?',
          answer: 'Use the Talk tab to practice pronunciation. Press the microphone button, speak the phrase shown, and get instant feedback on your accuracy.'
        },
        {
          question: 'The speech recognition is not working',
          answer: 'Make sure your browser has microphone permissions enabled. Try using Chrome or Safari for best results. Check your device microphone settings.'
        },
        {
          question: 'Can I change the voice used for audio?',
          answer: 'Yes! Go to Settings and find Voice Settings. You can choose between Cloud Voice (high quality) or Browser Voices with different accents.'
        },
      ]
    },
    {
      id: 'lessons',
      title: 'Lessons & Progress',
      icon: <MessageCircle className="w-5 h-5" />,
      items: [
        {
          question: 'How do I unlock new lessons?',
          answer: 'Complete the current lesson to unlock the next one. Lessons are organized in units, and you must complete all lessons in a unit before moving to the next.'
        },
        {
          question: 'What are the different exercise types?',
          answer: 'DoubLango offers multiple exercise types: translation, multiple choice, word bank, listening transcription, speaking practice, and matching pairs.'
        },
        {
          question: 'How do I review past lessons?',
          answer: 'Use the Review tab to practice vocabulary and grammar from completed lessons. This helps reinforce what you have learned.'
        },
      ]
    },
    {
      id: 'account',
      title: 'Account & Settings',
      icon: <Settings className="w-5 h-5" />,
      items: [
        {
          question: 'How do I change my display name or avatar?',
          answer: 'Go to Profile and tap the edit button. You can change your display name, username, and select from different avatar options.'
        },
        {
          question: 'What is Kids Mode?',
          answer: 'Kids Mode provides a simplified, child-friendly interface with appropriate content. Enable it in Settings to make the app suitable for younger learners.'
        },
        {
          question: 'How do I enable dark mode?',
          answer: 'Toggle Dark Mode in Settings. The app will switch to a darker color scheme that is easier on the eyes in low light conditions.'
        },
      ]
    },
    {
      id: 'premium',
      title: 'Premium Features',
      icon: <CreditCard className="w-5 h-5" />,
      items: [
        {
          question: 'What features are included in Premium?',
          answer: 'Premium includes unlimited lives, ad-free experience, offline access, advanced lessons, and exclusive content for fluency-level learning.'
        },
        {
          question: 'How do lives work?',
          answer: 'You start with 5 lives. Making mistakes costs lives. Lives regenerate over time, or you can get unlimited lives with Premium.'
        },
      ]
    },
  ];

  const toggleItem = (categoryId: string, index: number) => {
    const key = `${categoryId}-${index}`;
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedItems(newExpanded);
  };

  const filteredCategories = faqCategories.map(category => ({
    ...category,
    items: category.items.filter(
      item =>
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.items.length > 0);

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border z-40 px-4 py-3">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-bold text-lg">Help Centre</h1>
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for help..."
            className="w-full pl-12 pr-4 py-3 bg-card rounded-2xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* FAQ Categories */}
        <div className="space-y-4">
          {filteredCategories.map((category) => (
            <div key={category.id} className="bg-card rounded-2xl overflow-hidden shadow-sm">
              <div className="flex items-center gap-3 px-4 py-3 bg-muted/30 border-b border-border">
                <div className="text-primary">{category.icon}</div>
                <h2 className="font-semibold">{category.title}</h2>
              </div>
              <div className="divide-y divide-border">
                {category.items.map((item, index) => {
                  const isExpanded = expandedItems.has(`${category.id}-${index}`);
                  return (
                    <div key={index}>
                      <button
                        onClick={() => toggleItem(category.id, index)}
                        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/30 transition-colors"
                      >
                        <span className="font-medium text-sm pr-4">{item.question}</span>
                        <ChevronDown className={cn(
                          "w-5 h-5 text-muted-foreground shrink-0 transition-transform",
                          isExpanded && "rotate-180"
                        )} />
                      </button>
                      {isExpanded && (
                        <div className="px-4 pb-3">
                          <p className="text-sm text-muted-foreground">{item.answer}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Contact Support */}
        <div className="bg-primary/10 rounded-2xl p-6 text-center">
          <Users className="w-10 h-10 mx-auto mb-3 text-primary" />
          <h3 className="font-bold mb-2">Still need help?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Our support team is here to help you with any questions.
          </p>
          <Button variant="default" className="rounded-xl">
            Contact Support
          </Button>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default HelpCentre;
