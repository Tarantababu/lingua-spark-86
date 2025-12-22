import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVocabulary } from '@/hooks/useVocabulary';
import { useTranslation } from '@/hooks/useTranslation';
import { useLessons } from '@/hooks/useLessons';
import { Lesson, WordStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings, Volume2 } from 'lucide-react';
import WordPopover from '@/components/reader/WordPopover';
import ReaderSettings from '@/components/reader/ReaderSettings';

interface WordData {
  word: string;
  status: WordStatus | 'new';
  isPhrase: boolean;
}

export default function Reader() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { targetLanguage, nativeLanguage } = useLanguage();
  const { getWordStatus, getWordData, addWord, updateWordStatus, updateWordTranslation } = useVocabulary();
  const { translate, loading: translating } = useTranslation();
  const { getLesson } = useLessons();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedWordData, setSelectedWordData] = useState<{
    translation?: string;
    definition?: string;
    examples?: string[];
    pronunciation?: string;
  } | null>(null);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });
  const [showSettings, setShowSettings] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const [lineHeight, setLineHeight] = useState(1.8);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    async function loadLesson() {
      if (!id) return;
      setLoading(true);
      const lessonData = await getLesson(id);
      setLesson(lessonData);
      setLoading(false);
    }
    loadLesson();
  }, [id, getLesson]);

  const words = useMemo(() => {
    if (!lesson?.content) return [];
    
    // Split content into words while preserving punctuation
    const tokens = lesson.content.split(/(\s+|(?=[.,!?;:"""''()[\]{}])|(?<=[.,!?;:"""''()[\]{}]))/);
    
    return tokens.map((token, index) => {
      const cleanWord = token.replace(/[.,!?;:"""''()[\]{}]/g, '').toLowerCase().trim();
      
      if (!cleanWord || /^\s*$/.test(token)) {
        return { token, index, isWord: false, status: null };
      }
      
      const status = getWordStatus(cleanWord);
      return { 
        token, 
        index, 
        isWord: true, 
        cleanWord,
        status: status === null ? 'new' : status,
      };
    });
  }, [lesson?.content, getWordStatus]);

  const handleWordClick = useCallback(async (word: string, event: React.MouseEvent) => {
    const cleanWord = word.replace(/[.,!?;:"""''()[\]{}]/g, '').toLowerCase().trim();
    if (!cleanWord) return;

    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setPopoverPosition({
      x: rect.left + rect.width / 2,
      y: rect.bottom + 8,
    });
    setSelectedWord(cleanWord);

    // Check if we already have translation data
    const existingData = getWordData(cleanWord);
    if (existingData?.translation) {
      setSelectedWordData({
        translation: existingData.translation,
        definition: existingData.definition || undefined,
      });
    } else {
      // Fetch translation
      setSelectedWordData(null);
      const result = await translate(cleanWord, targetLanguage, nativeLanguage);
      if (result) {
        setSelectedWordData({
          translation: result.translation,
          definition: result.definition || undefined,
          examples: result.examples,
          pronunciation: result.pronunciation || undefined,
        });

        // Add word to vocabulary if it doesn't exist
        const wordData = await addWord(cleanWord, result.translation, result.definition || undefined, id);
        if (wordData && result.translation) {
          await updateWordTranslation(wordData.id, result.translation, result.definition || undefined);
        }
      }
    }
  }, [targetLanguage, nativeLanguage, translate, getWordData, addWord, updateWordTranslation, id]);

  const handleStatusChange = useCallback(async (status: WordStatus) => {
    if (!selectedWord) return;
    const wordData = getWordData(selectedWord);
    if (wordData) {
      await updateWordStatus(wordData.id, status);
    }
    setSelectedWord(null);
    setSelectedWordData(null);
  }, [selectedWord, getWordData, updateWordStatus]);

  const handleMarkKnown = useCallback(async () => {
    await handleStatusChange(0);
  }, [handleStatusChange]);

  const closePopover = useCallback(() => {
    setSelectedWord(null);
    setSelectedWordData(null);
  }, []);

  const getWordClassName = (status: WordStatus | 'new' | null): string => {
    if (status === null) return '';
    if (status === 'new') return 'word-new';
    if (status === 0) return 'word-known';
    if (status === 1) return 'word-learning-1';
    if (status === 2) return 'word-learning-2';
    if (status === 3) return 'word-learning-3';
    if (status === 4) return 'word-learning-4';
    return '';
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse-soft text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <h1 className="font-serif text-xl font-bold mb-4">Lesson not found</h1>
        <Button onClick={() => navigate('/')}>Back to Library</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-serif font-bold text-lg truncate max-w-[200px]">
            {lesson.title}
          </h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Volume2 className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setShowSettings(!showSettings)}>
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <ReaderSettings
          fontSize={fontSize}
          setFontSize={setFontSize}
          lineHeight={lineHeight}
          setLineHeight={setLineHeight}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Reading Area */}
      <main className="container mx-auto px-4 py-6 max-w-3xl">
        <div 
          className="reader-text"
          style={{ fontSize: `${fontSize}px`, lineHeight: lineHeight }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closePopover();
          }}
        >
          {words.map(({ token, index, isWord, cleanWord, status }) => {
            if (!isWord) {
              return <span key={index}>{token}</span>;
            }

            return (
              <span
                key={index}
                className={getWordClassName(status as WordStatus | 'new' | null)}
                onClick={(e) => handleWordClick(token, e)}
              >
                {token}
              </span>
            );
          })}
        </div>
      </main>

      {/* Word Popover */}
      {selectedWord && (
        <WordPopover
          word={selectedWord}
          position={popoverPosition}
          translation={selectedWordData?.translation}
          definition={selectedWordData?.definition}
          examples={selectedWordData?.examples}
          pronunciation={selectedWordData?.pronunciation}
          loading={translating}
          onClose={closePopover}
          onStatusChange={handleStatusChange}
          onMarkKnown={handleMarkKnown}
          currentStatus={getWordStatus(selectedWord)}
        />
      )}
    </div>
  );
}
