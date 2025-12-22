import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Loader2, BookmarkPlus, Volume2, VolumeX } from 'lucide-react';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';

interface PhrasePopoverProps {
  phrase: string;
  position: { x: number; y: number };
  translation?: string;
  loading: boolean;
  onClose: () => void;
  onSavePhrase: () => void;
  isSaved: boolean;
  language?: string;
}

export default function PhrasePopover({
  phrase,
  position,
  translation,
  loading,
  onClose,
  onSavePhrase,
  isSaved,
  language,
}: PhrasePopoverProps) {
  const { speak, stop, isSpeaking } = useTextToSpeech();

  const handleSpeak = () => {
    if (isSpeaking) {
      stop();
    } else {
      speak(phrase, language);
    }
  };
  // Calculate position to keep popover on screen
  const popoverStyle: React.CSSProperties = {
    position: 'fixed',
    left: Math.max(16, Math.min(position.x - 150, window.innerWidth - 316)),
    top: Math.min(position.y, window.innerHeight - 200),
    zIndex: 100,
    width: 300,
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-50" 
        onClick={onClose}
      />
      
      {/* Popover */}
      <Card style={popoverStyle} className="shadow-lg animate-fade-in z-[100] border-word-phrase">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start gap-2 flex-1">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Selected Phrase</p>
                <h3 className="font-serif font-bold text-base leading-snug">{phrase}</h3>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-primary hover:text-primary/80 shrink-0"
                onClick={handleSpeak}
                title="Listen to pronunciation"
              >
                {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Translation */}
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Translating phrase...</span>
            </div>
          ) : (
            <>
              {translation && (
                <div className="mb-4 p-3 bg-muted rounded-lg">
                  <p className="font-medium text-foreground">{translation}</p>
                </div>
              )}
            </>
          )}

          {/* Save Button */}
          <Button
            className="w-full gap-2"
            variant={isSaved ? 'secondary' : 'default'}
            onClick={onSavePhrase}
            disabled={loading || isSaved}
          >
            <BookmarkPlus className="w-4 h-4" />
            {isSaved ? 'Phrase Saved' : 'Save as LingQ'}
          </Button>
        </CardContent>
      </Card>
    </>
  );
}

