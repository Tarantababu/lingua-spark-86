import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVocabulary } from '@/hooks/useVocabulary';
import { useTranslation } from '@/hooks/useTranslation';
import { useLessons } from '@/hooks/useLessons';
import { Lesson, WordStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings, Volume2, Loader2, Play, Pause } from 'lucide-react';
import WordPopover from '@/components/reader/WordPopover';
import PhrasePopover from '@/components/reader/PhrasePopover';
import ReaderSettings from '@/components/reader/ReaderSettings';
import { toast } from 'sonner';

interface TokenData {
  token: string;
  index: number;
  isWord: boolean;
  cleanWord?: string;
  status?: WordStatus | 'new' | null;
}

export default function Reader() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { targetLanguage, nativeLanguage } = useLanguage();
  const { getWordStatus, getWordData, addWord, updateWordStatus, updateWordTranslation } = useVocabulary();
  const { translate, loading: translating } = useTranslation();
  const { getLesson, generateLessonAudio } = useLessons();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Single word selection
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedWordData, setSelectedWordData] = useState<{
    translation?: string;
    definition?: string;
    examples?: string[];
    pronunciation?: string;
  } | null>(null);
  
  // Phrase selection
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null);
  const [selectedPhrase, setSelectedPhrase] = useState<string | null>(null);
  const [phraseTranslation, setPhraseTranslation] = useState<string | null>(null);
  const [isPhraseSaved, setIsPhraseSaved] = useState(false);
  
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });
  const [showSettings, setShowSettings] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const [lineHeight, setLineHeight] = useState(1.8);
  
  // Track if shift key is held
  const shiftHeldRef = useRef(false);
  const lastClickedIndexRef = useRef<number | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') shiftHeldRef.current = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') shiftHeldRef.current = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

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

  const tokens = useMemo((): TokenData[] => {
    if (!lesson?.content) return [];
    
    // Split content into tokens while preserving punctuation and spaces
    const rawTokens = lesson.content.split(/(\s+|(?=[.,!?;:"""''()[\]{}])|(?<=[.,!?;:"""''()[\]{}]))/);
    
    return rawTokens.map((token, index) => {
      const cleanWord = token.replace(/[.,!?;:"""''()[\]{}]/g, '').toLowerCase().trim();
      
      if (!cleanWord || /^\s*$/.test(token)) {
        return { token, index, isWord: false };
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

  // Build phrase from selected token range
  const buildPhraseFromSelection = useCallback((start: number, end: number): string => {
    const minIdx = Math.min(start, end);
    const maxIdx = Math.max(start, end);
    
    return tokens
      .slice(minIdx, maxIdx + 1)
      .map(t => t.token)
      .join('')
      .trim();
  }, [tokens]);

  const handleWordClick = useCallback(async (tokenData: TokenData, event: React.MouseEvent) => {
    const { token, index, cleanWord } = tokenData;
    if (!cleanWord) return;

    // Handle shift+click for phrase selection
    if (shiftHeldRef.current && lastClickedIndexRef.current !== null) {
      const startIdx = lastClickedIndexRef.current;
      const endIdx = index;
      
      // Build phrase from selection
      const phrase = buildPhraseFromSelection(startIdx, endIdx);
      
      if (phrase.split(/\s+/).length > 1) {
        // Multi-word phrase selected
        setSelectionStart(Math.min(startIdx, endIdx));
        setSelectionEnd(Math.max(startIdx, endIdx));
        setSelectedPhrase(phrase);
        setPhraseTranslation(null);
        setIsPhraseSaved(false);
        
        // Clear single word selection
        setSelectedWord(null);
        setSelectedWordData(null);
        
        const rect = (event.target as HTMLElement).getBoundingClientRect();
        setPopoverPosition({
          x: rect.left + rect.width / 2,
          y: rect.bottom + 8,
        });
        
        // Fetch phrase translation
        const result = await translate(phrase, targetLanguage, nativeLanguage);
        if (result) {
          setPhraseTranslation(result.translation);
        }
        
        return;
      }
    }
    
    // Single word click - reset phrase selection
    setSelectionStart(null);
    setSelectionEnd(null);
    setSelectedPhrase(null);
    setPhraseTranslation(null);
    lastClickedIndexRef.current = index;

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
  }, [targetLanguage, nativeLanguage, translate, getWordData, addWord, updateWordTranslation, id, buildPhraseFromSelection]);

  const handleSavePhrase = useCallback(async () => {
    if (!selectedPhrase || !user) return;
    
    const wordData = await addWord(
      selectedPhrase, 
      phraseTranslation || undefined, 
      undefined, 
      id
    );
    
    if (wordData) {
      setIsPhraseSaved(true);
      toast.success('Phrase saved to vocabulary!');
    }
  }, [selectedPhrase, phraseTranslation, addWord, id, user]);

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
    setSelectedPhrase(null);
    setPhraseTranslation(null);
    setSelectionStart(null);
    setSelectionEnd(null);
  }, []);

  const handleAudioClick = useCallback(async () => {
    if (!lesson || !id) return;

    // If audio exists, toggle play/pause
    if (lesson.audio_url) {
      if (!audioRef.current) {
        audioRef.current = new Audio(lesson.audio_url);
        audioRef.current.onended = () => setIsPlaying(false);
        audioRef.current.onerror = () => {
          toast.error('Failed to play audio');
          setIsPlaying(false);
        };
      }

      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
      return;
    }

    // Generate new audio
    setGeneratingAudio(true);
    const audioUrl = await generateLessonAudio(id, lesson.content, lesson.language);
    setGeneratingAudio(false);
    
    if (audioUrl) {
      setLesson({ ...lesson, audio_url: audioUrl });
      // Start playing the new audio
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => setIsPlaying(false);
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [lesson, id, isPlaying, generateLessonAudio]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const getWordClassName = (status: WordStatus | 'new' | null, index: number): string => {
    // Check if this token is part of phrase selection
    if (selectionStart !== null && selectionEnd !== null) {
      const minIdx = Math.min(selectionStart, selectionEnd);
      const maxIdx = Math.max(selectionStart, selectionEnd);
      if (index >= minIdx && index <= maxIdx) {
        return 'word-phrase';
      }
    }
    
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
          <div className="text-center">
            <h1 className="font-serif font-bold text-lg truncate max-w-[200px]">
              {lesson.title}
            </h1>
            <p className="text-xs text-muted-foreground">Hold Shift + click to select phrases</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleAudioClick}
              disabled={generatingAudio}
              title={lesson.audio_url ? (isPlaying ? 'Pause audio' : 'Play audio') : 'Generate audio'}
            >
              {generatingAudio ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : lesson.audio_url ? (
                isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
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
          className="reader-text select-none"
          style={{ fontSize: `${fontSize}px`, lineHeight: lineHeight }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closePopover();
          }}
        >
          {tokens.map((tokenData) => {
            const { token, index, isWord, status } = tokenData;
            
            if (!isWord) {
              return <span key={index}>{token}</span>;
            }

            return (
              <span
                key={index}
                className={`${getWordClassName(status as WordStatus | 'new' | null, index)} cursor-pointer`}
                onClick={(e) => handleWordClick(tokenData, e)}
              >
                {token}
              </span>
            );
          })}
        </div>
      </main>

      {/* Word Popover (single word) */}
      {selectedWord && !selectedPhrase && (
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
          language={lesson?.language}
        />
      )}

      {/* Phrase Popover (multiple words) */}
      {selectedPhrase && (
        <PhrasePopover
          phrase={selectedPhrase}
          position={popoverPosition}
          translation={phraseTranslation || undefined}
          loading={translating}
          onClose={closePopover}
          onSavePhrase={handleSavePhrase}
          isSaved={isPhraseSaved}
          language={lesson?.language}
        />
      )}
    </div>
  );
}
