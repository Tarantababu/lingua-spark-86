import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSRS } from '@/hooks/useSRS';
import { VocabularyItem } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BookOpen, RotateCcw, Check, X, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

type ReviewMode = 'flashcard' | 'multiple_choice';

export default function Review() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { targetLanguage } = useLanguage();
  const { getDueCards, getNewCards, processReview } = useSRS();

  const [cards, setCards] = useState<VocabularyItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [stats, setStats] = useState({ correct: 0, incorrect: 0 });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const loadCards = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    
    // Get due cards first, then new cards
    const dueCards = await getDueCards(user.id, targetLanguage);
    const newCards = await getNewCards(user.id, targetLanguage, 10 - dueCards.length);
    
    const allCards = [...dueCards, ...newCards];
    
    // Shuffle cards
    const shuffled = allCards.sort(() => Math.random() - 0.5);
    
    setCards(shuffled);
    setCurrentIndex(0);
    setShowAnswer(false);
    setSessionComplete(false);
    setStats({ correct: 0, incorrect: 0 });
    setLoading(false);
  }, [user, targetLanguage, getDueCards, getNewCards]);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const currentCard = cards[currentIndex];
  const progress = cards.length > 0 ? ((currentIndex) / cards.length) * 100 : 0;

  const handleResponse = async (quality: number) => {
    if (!currentCard) return;

    const success = await processReview(currentCard, quality);
    
    if (quality >= 3) {
      setStats(prev => ({ ...prev, correct: prev.correct + 1 }));
    } else {
      setStats(prev => ({ ...prev, incorrect: prev.incorrect + 1 }));
    }

    // Move to next card
    if (currentIndex + 1 >= cards.length) {
      setSessionComplete(true);
    } else {
      setCurrentIndex(prev => prev + 1);
      setShowAnswer(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="container mx-auto px-4 py-6">
        <h1 className="font-serif text-2xl font-bold text-foreground mb-6">Review</h1>
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="font-serif text-xl font-bold mb-2">No cards to review</h2>
            <p className="text-muted-foreground mb-4">
              Add more words while reading to build your review queue!
            </p>
            <Button onClick={() => navigate('/')}>
              Go to Library
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (sessionComplete) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card className="text-center py-12">
          <CardContent>
            <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-success-foreground" />
            </div>
            <h2 className="font-serif text-2xl font-bold mb-2">Session Complete!</h2>
            <div className="flex justify-center gap-8 my-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-success">{stats.correct}</p>
                <p className="text-sm text-muted-foreground">Correct</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-destructive">{stats.incorrect}</p>
                <p className="text-sm text-muted-foreground">Needs Review</p>
              </div>
            </div>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={loadCards}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Review Again
              </Button>
              <Button onClick={() => navigate('/')}>
                Back to Library
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="font-serif text-2xl font-bold text-foreground">Review</h1>
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} / {cards.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Flashcard */}
      <Card 
        className="min-h-[300px] flex flex-col items-center justify-center cursor-pointer transition-all hover:shadow-lg"
        onClick={() => !showAnswer && setShowAnswer(true)}
      >
        <CardContent className="text-center p-8 w-full">
          {!showAnswer ? (
            <>
              <p className="font-serif text-3xl font-bold mb-4 capitalize">
                {currentCard.word}
              </p>
              <p className="text-muted-foreground">Tap to reveal translation</p>
            </>
          ) : (
            <>
              <p className="text-muted-foreground text-lg mb-2 capitalize">
                {currentCard.word}
              </p>
              <p className="font-serif text-2xl font-bold text-primary mb-2">
                {currentCard.translation || 'No translation'}
              </p>
              {currentCard.definition && (
                <p className="text-muted-foreground text-sm">
                  {currentCard.definition}
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Response Buttons */}
      {showAnswer && (
        <div className="mt-6 grid grid-cols-4 gap-2">
          <Button
            variant="outline"
            className="flex-col h-auto py-4 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => handleResponse(1)}
          >
            <X className="w-5 h-5 mb-1" />
            <span className="text-xs">Again</span>
          </Button>
          <Button
            variant="outline"
            className="flex-col h-auto py-4 border-warning text-warning hover:bg-warning hover:text-warning-foreground"
            onClick={() => handleResponse(2)}
          >
            <span className="text-lg mb-1">😕</span>
            <span className="text-xs">Hard</span>
          </Button>
          <Button
            variant="outline"
            className="flex-col h-auto py-4 border-info text-info hover:bg-info hover:text-info-foreground"
            onClick={() => handleResponse(4)}
          >
            <span className="text-lg mb-1">🙂</span>
            <span className="text-xs">Good</span>
          </Button>
          <Button
            variant="outline"
            className="flex-col h-auto py-4 border-success text-success hover:bg-success hover:text-success-foreground"
            onClick={() => handleResponse(5)}
          >
            <Check className="w-5 h-5 mb-1" />
            <span className="text-xs">Easy</span>
          </Button>
        </div>
      )}
    </div>
  );
}
