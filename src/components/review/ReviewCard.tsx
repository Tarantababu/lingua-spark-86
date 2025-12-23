import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Volume2, Loader2 } from 'lucide-react';
import { ReviewCard as ReviewCardType } from '@/types';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';

interface ReviewCardProps {
  card: ReviewCardType;
  showAnswer: boolean;
  onCardClick: () => void;
}

export default function ReviewCard({ card, showAnswer, onCardClick }: ReviewCardProps) {
  const { speak, isSpeaking } = useTextToSpeech();
  const [generatingAudio, setGeneratingAudio] = useState(false);

  const handleSpeak = (e: React.MouseEvent, text: string, language: string) => {
    e.stopPropagation();
    speak(text, language);
  };

  const isTargetToNative = card.cardType === 'target_to_native';
  const example = card.example;

  // If no example, fall back to showing word
  const frontText = isTargetToNative 
    ? (example?.target || card.word)
    : (example?.translation || card.translation || 'No translation');
    
  const backText = isTargetToNative
    ? (example?.translation || card.translation || 'No translation')
    : (example?.target || card.word);

  const frontLanguage = isTargetToNative ? card.language : 'en';
  const backLanguage = isTargetToNative ? 'en' : card.language;

  return (
    <Card 
      className="min-h-[300px] flex flex-col items-center justify-center cursor-pointer transition-all hover:shadow-lg"
      onClick={onCardClick}
    >
      <CardContent className="text-center p-8 w-full">
        {!showAnswer ? (
          // Front of card
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2">
              <p className="font-serif text-2xl font-bold">
                {frontText}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => handleSpeak(e, frontText, frontLanguage)}
                disabled={isSpeaking}
              >
                {isSpeaking ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-muted-foreground text-sm">Tap to reveal translation</p>
            {!example && (
              <p className="text-xs text-muted-foreground italic">
                (No example sentence - showing word only)
              </p>
            )}
          </div>
        ) : (
          // Back of card
          <div className="space-y-4">
            {/* Front text (smaller, at top) */}
            <div className="flex items-center justify-center gap-2 pb-4 border-b">
              <p className="text-lg text-muted-foreground">
                {frontText}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => handleSpeak(e, frontText, frontLanguage)}
                disabled={isSpeaking}
              >
                {isSpeaking ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Volume2 className="w-3 h-3" />
                )}
              </Button>
            </div>

            {/* Back text (larger, main focus) */}
            <div className="flex items-center justify-center gap-2">
              <p className="font-serif text-2xl font-bold text-primary">
                {backText}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => handleSpeak(e, backText, backLanguage)}
                disabled={isSpeaking}
              >
                {isSpeaking ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Show word if we have an example */}
            {example && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Word: <span className="font-semibold">{card.word}</span>
                </p>
                {card.definition && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {card.definition}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
