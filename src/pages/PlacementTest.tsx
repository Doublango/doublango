import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import MonkeyMascot from '@/components/MonkeyMascot';
import ProgressBar from '@/components/ProgressBar';
import Confetti from '@/components/Confetti';
import { X, Volume2, Mic, MicOff, Check, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

type LanguageCode = Database['public']['Enums']['language_code'];
type CefrLevel = Database['public']['Enums']['cefr_level'];

interface PlacementQuestion {
  id: string;
  level: CefrLevel;
  type: 'multiple_choice' | 'translation' | 'word_bank' | 'fill_blank';
  question: string;
  options?: string[];
  correctAnswer: string;
  hint?: string;
}

// Original Spanish placement questions organized by level
const SPANISH_PLACEMENT_QUESTIONS: PlacementQuestion[] = [
  // A1 - Beginner
  { id: '1', level: 'A1', type: 'multiple_choice', question: 'How do you say "Hello" in Spanish?', options: ['Hola', 'Adiós', 'Gracias', 'Por favor'], correctAnswer: 'Hola' },
  { id: '2', level: 'A1', type: 'multiple_choice', question: 'What does "Gracias" mean?', options: ['Hello', 'Goodbye', 'Thank you', 'Please'], correctAnswer: 'Thank you' },
  { id: '3', level: 'A1', type: 'translation', question: 'Translate: "Buenos días"', correctAnswer: 'good morning', hint: 'A morning greeting' },
  { id: '4', level: 'A1', type: 'multiple_choice', question: 'Which means "water"?', options: ['Agua', 'Leche', 'Pan', 'Café'], correctAnswer: 'Agua' },
  { id: '5', level: 'A1', type: 'word_bank', question: 'Arrange: "Yo soy estudiante" (I am a student)', options: ['estudiante', 'soy', 'Yo'], correctAnswer: 'Yo soy estudiante' },
  
  // A2 - Elementary
  { id: '6', level: 'A2', type: 'fill_blank', question: 'Ella ___ muy inteligente. (She is very intelligent)', correctAnswer: 'es', hint: 'Use the verb "ser"' },
  { id: '7', level: 'A2', type: 'multiple_choice', question: 'What is the past tense of "comer" (to eat) for "yo"?', options: ['comí', 'como', 'comeré', 'comía'], correctAnswer: 'comí' },
  { id: '8', level: 'A2', type: 'translation', question: 'Translate: "Where is the restaurant?"', correctAnswer: '¿Dónde está el restaurante?', hint: 'Use estar for location' },
  { id: '9', level: 'A2', type: 'multiple_choice', question: 'Complete: "Me gusta ___ música" (I like music)', options: ['la', 'el', 'un', 'los'], correctAnswer: 'la' },
  { id: '10', level: 'A2', type: 'word_bank', question: 'Form: "I want to go to the beach"', options: ['a', 'ir', 'Quiero', 'playa', 'la'], correctAnswer: 'Quiero ir a la playa' },
  
  // B1 - Intermediate
  { id: '11', level: 'B1', type: 'translation', question: 'Translate: "If I had money, I would travel"', correctAnswer: 'Si tuviera dinero, viajaría', hint: 'Conditional + subjunctive' },
  { id: '12', level: 'B1', type: 'multiple_choice', question: 'Which sentence uses the subjunctive correctly?', options: ['Espero que vengas', 'Espero que vienes', 'Espero que vendrás', 'Espero que viniste'], correctAnswer: 'Espero que vengas' },
  { id: '13', level: 'B1', type: 'fill_blank', question: 'Cuando ___ pequeño, jugaba en el parque. (When I was little...)', correctAnswer: 'era', hint: 'Imperfect tense' },
  { id: '14', level: 'B1', type: 'multiple_choice', question: '"Por" vs "Para": Viajo ___ España (I travel to Spain)', options: ['para', 'por', 'en', 'a'], correctAnswer: 'para' },
  { id: '15', level: 'B1', type: 'translation', question: 'Translate: "I have been studying Spanish for two years"', correctAnswer: 'Llevo dos años estudiando español', hint: 'Use llevar + gerund' },
  
  // B2 - Upper Intermediate
  { id: '16', level: 'B2', type: 'multiple_choice', question: 'Complete: "Ojalá que ___ buen tiempo mañana"', options: ['haga', 'hace', 'hará', 'hizo'], correctAnswer: 'haga' },
  { id: '17', level: 'B2', type: 'fill_blank', question: 'Aunque ___ lloviendo, saldré. (Even if it\'s raining...)', correctAnswer: 'esté', hint: 'Present subjunctive' },
  { id: '18', level: 'B2', type: 'translation', question: 'Translate: "If I had known, I would have come earlier"', correctAnswer: 'Si hubiera sabido, habría venido antes', hint: 'Pluperfect subjunctive + conditional perfect' },
  { id: '19', level: 'B2', type: 'multiple_choice', question: 'Which is correct? "El libro ___ leyendo es interesante"', options: ['que estoy', 'el cual estoy', 'quien estoy', 'lo que estoy'], correctAnswer: 'que estoy' },
  { id: '20', level: 'B2', type: 'translation', question: 'Translate: "I doubt that he has finished"', correctAnswer: 'Dudo que haya terminado', hint: 'Present subjunctive perfect' },
  
  // C1 - Advanced
  { id: '21', level: 'C1', type: 'multiple_choice', question: 'Which uses the future subjunctive correctly?', options: ['Si vinieres, te esperaré', 'Si vengas, te esperaré', 'Si vendrás, te esperaré', 'Si vienes, te esperaré'], correctAnswer: 'Si vinieres, te esperaré' },
  { id: '22', level: 'C1', type: 'translation', question: 'Translate using a passive construction: "The book was written by the author"', correctAnswer: 'El libro fue escrito por el autor', hint: 'Use ser + past participle' },
  { id: '23', level: 'C1', type: 'fill_blank', question: 'No es que no ___ venir, es que no puedo. (It\'s not that I don\'t want...)', correctAnswer: 'quiera', hint: 'Subjunctive after "no es que"' },
  { id: '24', level: 'C1', type: 'multiple_choice', question: '"Habiendo ___ la tarea, salió a jugar"', options: ['terminado', 'terminar', 'terminando', 'termine'], correctAnswer: 'terminado' },
  { id: '25', level: 'C1', type: 'translation', question: 'Translate: "Had it not been for you, I would have failed"', correctAnswer: 'De no ser por ti, habría fracasado', hint: 'Use "de no ser por"' },
];

const PlacementTest: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const languageCode = (location.state?.languageCode || 'es') as LanguageCode;
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [wordBankAnswer, setWordBankAnswer] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [consecutiveWrong, setConsecutiveWrong] = useState(0);
  const [monkeyMood, setMonkeyMood] = useState<'happy' | 'excited' | 'sad' | 'thinking'>('happy');
  const [showResult, setShowResult] = useState(false);
  const [recommendedLevel, setRecommendedLevel] = useState<CefrLevel>('A1');
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Adaptive question selection based on performance
  const [currentLevel, setCurrentLevel] = useState<CefrLevel>('A1');
  const questions = SPANISH_PLACEMENT_QUESTIONS.filter(q => {
    const levelOrder: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const currentIdx = levelOrder.indexOf(currentLevel);
    const qIdx = levelOrder.indexOf(q.level);
    return Math.abs(currentIdx - qIdx) <= 1;
  }).slice(0, 20);
  
  const currentQuestion = questions[currentIndex];
  
  useEffect(() => {
    if (currentQuestion?.type === 'word_bank' && currentQuestion.options) {
      setAvailableWords(shuffleArray([...currentQuestion.options]));
      setWordBankAnswer([]);
    }
  }, [currentIndex, currentQuestion]);
  
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };
  
  const calculateRecommendedLevel = useCallback((): CefrLevel => {
    const percentage = (correctCount / (currentIndex + 1)) * 100;
    if (percentage >= 80 && currentLevel === 'C1') return 'C1';
    if (percentage >= 80 && currentLevel === 'B2') return 'B2';
    if (percentage >= 70 && currentLevel === 'B1') return 'B1';
    if (percentage >= 60 && currentLevel === 'A2') return 'A2';
    return 'A1';
  }, [correctCount, currentIndex, currentLevel]);
  
  const checkAnswer = () => {
    if (!currentQuestion) return;
    
    let correct = false;
    const correctAnswer = currentQuestion.correctAnswer.toLowerCase().trim();
    
    switch (currentQuestion.type) {
      case 'multiple_choice':
        correct = selectedAnswer?.toLowerCase().trim() === correctAnswer;
        break;
      case 'translation':
      case 'fill_blank':
        correct = typedAnswer.toLowerCase().trim() === correctAnswer;
        break;
      case 'word_bank':
        correct = wordBankAnswer.join(' ').toLowerCase().trim() === correctAnswer;
        break;
    }
    
    setIsChecked(true);
    setIsCorrect(correct);
    
    if (correct) {
      setCorrectCount(prev => prev + 1);
      setConsecutiveWrong(0);
      setMonkeyMood('excited');
      
      // Level up if doing well
      const levelOrder: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
      const currentLevelIdx = levelOrder.indexOf(currentLevel);
      if (correctCount >= 3 && currentLevelIdx < levelOrder.length - 1) {
        setCurrentLevel(levelOrder[currentLevelIdx + 1]);
      }
    } else {
      setConsecutiveWrong(prev => prev + 1);
      setMonkeyMood('sad');
      
      // Level down if struggling
      if (consecutiveWrong >= 2) {
        const levelOrder: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
        const currentLevelIdx = levelOrder.indexOf(currentLevel);
        if (currentLevelIdx > 0) {
          setCurrentLevel(levelOrder[currentLevelIdx - 1]);
        }
      }
    }
  };
  
  const nextQuestion = () => {
    // End early if struggling too much or completed enough questions
    if (consecutiveWrong >= 3 || currentIndex >= questions.length - 1 || currentIndex >= 14) {
      const level = calculateRecommendedLevel();
      setRecommendedLevel(level);
      setShowResult(true);
      setShowConfetti(true);
      setMonkeyMood('excited');
    } else {
      setCurrentIndex(prev => prev + 1);
      resetState();
    }
  };
  
  const resetState = () => {
    setSelectedAnswer(null);
    setTypedAnswer('');
    setWordBankAnswer([]);
    setIsChecked(false);
    setIsCorrect(false);
    setMonkeyMood('happy');
  };
  
  const handleWordBankClick = (word: string, fromAnswer: boolean) => {
    if (fromAnswer) {
      setWordBankAnswer(prev => prev.filter(w => w !== word));
      setAvailableWords(prev => [...prev, word]);
    } else {
      setAvailableWords(prev => prev.filter(w => w !== word));
      setWordBankAnswer(prev => [...prev, word]);
    }
  };
  
  const handleComplete = async (startFromScratch: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const startLevel = startFromScratch ? 'A1' : recommendedLevel;
      const startUnit = startFromScratch ? 1 : (['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].indexOf(startLevel) + 1);
      
      // Update profile
      await supabase.from('profiles').update({
        onboarding_completed: true
      }).eq('id', user.id);
      
      // Set up course with recommended level
      await supabase.from('user_courses').upsert({
        user_id: user.id,
        language_code: languageCode,
        is_active: true,
        proficiency_level: startLevel as CefrLevel,
        current_unit: startUnit,
        current_lesson: 1,
      }, { onConflict: 'user_id,language_code' });
      
      navigate('/home');
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save progress', variant: 'destructive' });
    }
  };
  
  const speakText = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = languageCode === 'es' ? 'es-ES' : languageCode;
    speechSynthesis.speak(utterance);
  };
  
  if (showResult) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-banana/10 to-background flex flex-col items-center justify-center p-6">
        {showConfetti && <Confetti trigger={showConfetti} bananaTheme />}
        <MonkeyMascot mood="celebrating" size="xl" animate className="mb-6" />
        
        <h1 className="text-3xl font-bold mb-2 text-center">Placement Complete! 🍌</h1>
        <p className="text-muted-foreground mb-6 text-center">
          Based on your answers, we recommend starting at level:
        </p>
        
        <div className="bg-card rounded-2xl p-8 shadow-xl mb-8 text-center">
          <div className="text-6xl font-bold gradient-text mb-2">{recommendedLevel}</div>
          <p className="text-muted-foreground">
            {recommendedLevel === 'A1' && 'Complete Beginner'}
            {recommendedLevel === 'A2' && 'Elementary'}
            {recommendedLevel === 'B1' && 'Intermediate'}
            {recommendedLevel === 'B2' && 'Upper Intermediate'}
            {recommendedLevel === 'C1' && 'Advanced'}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            You got {correctCount} out of {currentIndex + 1} correct!
          </p>
        </div>
        
        <div className="w-full max-w-sm space-y-3">
          <Button
            onClick={() => handleComplete(false)}
            className="w-full h-14 text-lg font-bold rounded-2xl gradient-banana text-banana-foreground"
          >
            Start at {recommendedLevel} <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <Button
            onClick={() => handleComplete(true)}
            variant="outline"
            className="w-full h-14 text-lg font-bold rounded-2xl"
          >
            Start from scratch (A1)
          </Button>
        </div>
      </div>
    );
  }
  
  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <MonkeyMascot mood="thinking" size="lg" animate />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-banana/10 to-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border z-40 px-4 py-3">
        <div className="flex items-center gap-4 max-w-lg mx-auto">
          <button onClick={() => navigate('/onboarding')} className="p-2 hover:bg-muted rounded-full">
            <X className="w-5 h-5" />
          </button>
          <ProgressBar 
            value={currentIndex + 1} 
            max={Math.min(questions.length, 15)} 
            variant="primary" 
            size="md"
            className="flex-1"
          />
          <span className="text-sm font-medium text-banana">{currentLevel}</span>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full flex flex-col">
        <p className="text-sm text-muted-foreground mb-2">Question {currentIndex + 1}</p>
        
        <div className="mb-6">
          <div className="flex items-start gap-3">
            <MonkeyMascot mood={monkeyMood} size="sm" />
            <div className="bg-card rounded-2xl p-4 shadow-sm flex-1">
              <p className="text-lg font-semibold">{currentQuestion.question}</p>
              {currentQuestion.hint && !isChecked && (
                <p className="text-sm text-muted-foreground mt-1">💡 {currentQuestion.hint}</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Answer Area */}
        <div className="flex-1 space-y-3">
          {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
            <div className="space-y-3">
              {currentQuestion.options.map((option, i) => (
                <button
                  key={i}
                  onClick={() => !isChecked && setSelectedAnswer(option)}
                  disabled={isChecked}
                  className={cn(
                    'w-full p-4 rounded-2xl border-2 text-left transition-all',
                    selectedAnswer === option && !isChecked && 'border-banana bg-banana/10',
                    isChecked && option.toLowerCase() === currentQuestion.correctAnswer.toLowerCase() && 'border-success bg-success/10',
                    isChecked && selectedAnswer === option && !isCorrect && 'border-destructive bg-destructive/10',
                    !selectedAnswer && !isChecked && 'border-border hover:border-banana/50',
                    isChecked && selectedAnswer !== option && option.toLowerCase() !== currentQuestion.correctAnswer.toLowerCase() && 'opacity-50'
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
          
          {(currentQuestion.type === 'translation' || currentQuestion.type === 'fill_blank') && (
            <div>
              <input
                type="text"
                value={typedAnswer}
                onChange={(e) => setTypedAnswer(e.target.value)}
                disabled={isChecked}
                placeholder="Type your answer..."
                className={cn(
                  'w-full p-4 rounded-2xl border-2 bg-card text-lg',
                  isChecked && isCorrect && 'border-success bg-success/10',
                  isChecked && !isCorrect && 'border-destructive bg-destructive/10',
                  !isChecked && 'border-border focus:border-banana focus:ring-2 focus:ring-banana/20'
                )}
              />
              {isChecked && !isCorrect && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Correct answer: <span className="text-success font-medium">{currentQuestion.correctAnswer}</span>
                </p>
              )}
            </div>
          )}
          
          {currentQuestion.type === 'word_bank' && (
            <div className="space-y-6">
              <div className={cn(
                'min-h-16 p-4 rounded-2xl border-2 border-dashed flex flex-wrap gap-2',
                isChecked && isCorrect && 'border-success bg-success/10',
                isChecked && !isCorrect && 'border-destructive bg-destructive/10',
                !isChecked && 'border-border'
              )}>
                {wordBankAnswer.length === 0 && (
                  <span className="text-muted-foreground">Tap words to build your answer</span>
                )}
                {wordBankAnswer.map((word, i) => (
                  <button
                    key={i}
                    onClick={() => !isChecked && handleWordBankClick(word, true)}
                    disabled={isChecked}
                    className="px-3 py-2 bg-banana text-banana-foreground rounded-xl font-medium"
                  >
                    {word}
                  </button>
                ))}
              </div>
              
              <div className="flex flex-wrap gap-2 justify-center">
                {availableWords.map((word, i) => (
                  <button
                    key={i}
                    onClick={() => !isChecked && handleWordBankClick(word, false)}
                    disabled={isChecked}
                    className="px-3 py-2 bg-muted hover:bg-muted/80 rounded-xl font-medium transition-colors"
                  >
                    {word}
                  </button>
                ))}
              </div>
              
              {isChecked && !isCorrect && (
                <p className="text-sm text-muted-foreground text-center">
                  Correct answer: <span className="text-success font-medium">{currentQuestion.correctAnswer}</span>
                </p>
              )}
            </div>
          )}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="sticky bottom-0 bg-card border-t border-border p-4">
        <div className="max-w-lg mx-auto">
          {!isChecked ? (
            <Button
              onClick={checkAnswer}
              disabled={
                (currentQuestion.type === 'multiple_choice' && !selectedAnswer) ||
                ((currentQuestion.type === 'translation' || currentQuestion.type === 'fill_blank') && !typedAnswer) ||
                (currentQuestion.type === 'word_bank' && wordBankAnswer.length === 0)
              }
              className="w-full h-14 text-lg font-bold rounded-2xl gradient-banana text-banana-foreground"
            >
              Check
            </Button>
          ) : (
            <div className="space-y-3">
              <div className={cn(
                'p-4 rounded-2xl text-center',
                isCorrect ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
              )}>
                <p className="font-bold text-lg">
                  {isCorrect ? '🍌 Correct!' : '❌ Not quite right'}
                </p>
              </div>
              <Button
                onClick={nextQuestion}
                className={cn(
                  'w-full h-14 text-lg font-bold rounded-2xl',
                  isCorrect ? 'gradient-banana text-banana-foreground' : 'bg-destructive text-destructive-foreground'
                )}
              >
                Continue <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
};

export default PlacementTest;
