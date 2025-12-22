import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Check, Volume2, Loader2 } from 'lucide-react';
import { WordStatus } from '@/types';

interface WordPopoverProps {
  word: string;
  position: { x: number; y: number };
  translation?: string;
  definition?: string;
  examples?: string[];
  pronunciation?: string;
  loading: boolean;
  onClose: () => void;
  onStatusChange: (status: WordStatus) => void;
  onMarkKnown: () => void;
  currentStatus: WordStatus | null;
}

const statusOptions = [
  { value: 1, label: '1', color: 'bg-word-learning-1' },
  { value: 2, label: '2', color: 'bg-word-learning-2' },
  { value: 3, label: '3', color: 'bg-word-learning-3' },
  { value: 4, label: '4', color: 'bg-word-learning-4' },
];

export default function WordPopover({
  word,
  position,
  translation,
  definition,
  examples,
  pronunciation,
  loading,
  onClose,
  onStatusChange,
  onMarkKnown,
  currentStatus,
}: WordPopoverProps) {
  // Calculate position to keep popover on screen
  const popoverStyle: React.CSSProperties = {
    position: 'fixed',
    left: Math.max(16, Math.min(position.x - 150, window.innerWidth - 316)),
    top: Math.min(position.y, window.innerHeight - 300),
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
      <Card style={popoverStyle} className="shadow-lg animate-fade-in z-[100]">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-serif font-bold text-lg capitalize">{word}</h3>
              {pronunciation && (
                <p className="text-sm text-muted-foreground">{pronunciation}</p>
              )}
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Translation */}
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Translating...</span>
            </div>
          ) : (
            <>
              {translation && (
                <div className="mb-3">
                  <p className="font-medium text-foreground">{translation}</p>
                </div>
              )}

              {definition && (
                <div className="mb-3">
                  <p className="text-sm text-muted-foreground">{definition}</p>
                </div>
              )}

              {examples && examples.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground mb-1">Examples:</p>
                  <ul className="text-sm space-y-1">
                    {examples.slice(0, 2).map((ex, i) => (
                      <li key={i} className="text-muted-foreground italic">"{ex}"</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {/* Status Controls */}
          <div className="border-t border-border pt-3 mt-3">
            <p className="text-xs text-muted-foreground mb-2">Learning Status:</p>
            <div className="flex items-center gap-2">
              {statusOptions.map(opt => (
                <Button
                  key={opt.value}
                  size="sm"
                  variant={currentStatus === opt.value ? 'default' : 'outline'}
                  className={`w-8 h-8 p-0 ${currentStatus === opt.value ? opt.color : ''}`}
                  onClick={() => onStatusChange(opt.value as WordStatus)}
                >
                  {opt.label}
                </Button>
              ))}
              <div className="flex-1" />
              <Button
                size="sm"
                variant="outline"
                className="text-success border-success hover:bg-success hover:text-success-foreground"
                onClick={onMarkKnown}
              >
                <Check className="w-4 h-4 mr-1" />
                Known
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
