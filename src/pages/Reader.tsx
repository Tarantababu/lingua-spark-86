import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { useVocabulary } from '@/hooks/useVocabulary';
import { useTranslation } from '@/hooks/useTranslation';
import { useLessons } from '@/hooks/useLessons';
import { supabase } from '@/integrations/supabase/client';
import { Lesson, WordStatus } from '@/types';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Settings, Volume2, Loader2, CheckCircle2, Link2 } from 'lucide-react';
import WordPopover from '@/components/reader/WordPopover';
import PhrasePopover from '@/components/reader/PhrasePopover';
import ReaderSettings from '@/components/reader/ReaderSettings';
import AudioPlayer from '@/components/reader/AudioPlayer';
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
  const { targetLanguage, getTranslationLanguage } = useLanguage();
  const { getWordStatus, getWordData, addWord, updateWordStatus, updateWordTranslation, ignoreWord, markAllWordsAsKnown } = useVocabulary();
  const { translate, loading: translating } = useTranslation();
  const { getLesson, generateLessonAudio } = useLessons();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  
  // Reading session tracking
  const sessionIdRef = useRef<string | null>(null);
  const readingStartTimeRef = useRef<number | null>(null);
  const isAudioPlayingRef = useRef(false);
  
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
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [completingLesson, setCompletingLesson] = useState(false);
  
  // Track if shift key is held
  const shiftHeldRef = useRef(false);
  const lastClickedIndexRef = useRef<number | null>(null);
  const [selectedWordIndices, setSelectedWordIndices] = useState<number[]>([]);
  const [showMultiWordBadge, setShowMultiWordBadge] = useState(false);
  const [isSelectionModeActive, setIsSelectionModeActive] = useState(false);

  // Start reading session when component mounts
  useEffect(() => {
    if (!user || !id) return;

    const startSession = async () => {
      readingStartTimeRef.current = Date.now();
      
      // Create a new reading session
      const { data, error } = await supabase
        .from('reading_sessions')
        .insert({
          user_id: user.id,
          lesson_id: id,
          reading_time_seconds: 0,
          listening_time_seconds: 0,
          words_read: 0,
          lingqs_created: 0,
        })
        .select('id')
        .single();
      
      if (data && !error) {
        sessionIdRef.current = data.id;
      }
    };

    startSession();

    // Save session on unmount
    return () => {
      if (sessionIdRef.current && readingStartTimeRef.current) {
        const readingSeconds = Math.round((Date.now() - readingStartTimeRef.current) / 1000);
        
        supabase
          .from('reading_sessions')
          .update({
            reading_time_seconds: readingSeconds,
            completed_at: new Date().toISOString(),
          })
          .eq('id', sessionIdRef.current)
          .then(() => {
            console.log('Reading session saved:', readingSeconds, 'seconds');
          });
      }
    };
  }, [user, id]);

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

  // Auto-show audio player if lesson has existing audio
  useEffect(() => {
    if (lesson?.audio_url) {
      setShowAudioPlayer(true);
    }
  }, [lesson?.audio_url]);

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

    // Handle selection mode - single click adds/removes words
    if (isSelectionModeActive) {
      const newIndices = selectedWordIndices.includes(index)
        ? selectedWordIndices.filter(i => i !== index)
        : [...selectedWordIndices, index].sort((a, b) => a - b);
      
      setSelectedWordIndices(newIndices);
      setShowMultiWordBadge(newIndices.length > 0);
      
      // Clear any open popovers
      setSelectedWord(null);
      setSelectedWordData(null);
      setSelectedPhrase(null);
      setPhraseTranslation(null);
      
      return;
    }

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
        
        // Fetch phrase translation - use lesson language, not target language
        const lessonLang = (lesson?.language || targetLanguage) as Language;
        const translationLang = getTranslationLanguage(lessonLang);
        
        console.log('Phrase Translation Debug:', {
          phrase,
          lessonLanguage: lessonLang,
          translationLanguage: translationLang
        });
        
        const result = await translate(phrase, lessonLang, translationLang);
        if (result) {
          setPhraseTranslation(result.translation);
        }
        
        return;
      }
    }
    
    // Single word click - reset phrase and multi-word selection
    setSelectionStart(null);
    setSelectionEnd(null);
    setSelectedPhrase(null);
    setPhraseTranslation(null);
    setSelectedWordIndices([]);
    lastClickedIndexRef.current = index;

    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setPopoverPosition({
      x: rect.left + rect.width / 2,
      y: rect.bottom + 8,
    });
    setSelectedWord(cleanWord);

    // Always fetch fresh translation based on current preferences
    // This ensures translation preferences are always respected
    setSelectedWordData(null);
    const lessonLang = (lesson?.language || targetLanguage) as Language;
    const translationLang = getTranslationLanguage(lessonLang);
    
    // Debug logging to verify translation preferences
    console.log('Translation Debug:', {
      word: cleanWord,
      lessonLanguage: lessonLang,
      translationLanguage: translationLang,
      lesson: lesson?.language,
      targetLanguage: targetLanguage
    });
    
    const result = await translate(cleanWord, lessonLang, translationLang);
    if (result) {
      setSelectedWordData({
        translation: result.translation,
        definition: result.definition || undefined,
        examples: result.examples,
        pronunciation: result.pronunciation || undefined,
      });

      // Prepare examples for storage
      const examplesForStorage = result.examples?.map(ex => ({
        target: ex,
        translation: '' // Will be populated later or via another translation call
      })) || [];

      // Add word to vocabulary if it doesn't exist, or update with new translation
      const existingData = getWordData(cleanWord);
      if (existingData) {
        // Update existing word with new translation and examples
        await supabase
          .from('vocabulary')
          .update({
            translation: result.translation,
            definition: result.definition || null,
            examples: examplesForStorage,
          })
          .eq('id', existingData.id);
      } else {
        // Add new word with examples
        await supabase
          .from('vocabulary')
          .insert({
            user_id: user?.id,
            word: cleanWord,
            language: lessonLang,
            translation: result.translation,
            definition: result.definition || null,
            status: 1,
            is_phrase: false,
            source_lesson_id: id,
            examples: examplesForStorage,
            audio_cache: {},
          });
      }
    }
  }, [isSelectionModeActive, selectedWordIndices, targetLanguage, getTranslationLanguage, translate, getWordData, addWord, updateWordTranslation, id, buildPhraseFromSelection, lesson]);

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

  const handleIgnore = useCallback(async () => {
    if (!selectedWord) return;
    await ignoreWord(selectedWord);
    setSelectedWord(null);
    setSelectedWordData(null);
  }, [selectedWord, ignoreWord]);

  const closePopover = useCallback(() => {
    setSelectedWord(null);
    setSelectedWordData(null);
    setSelectedPhrase(null);
    setPhraseTranslation(null);
    setSelectionStart(null);
    setSelectionEnd(null);
    setSelectedWordIndices([]);
    setShowMultiWordBadge(false);
    setIsSelectionModeActive(false);
  }, []);

  const toggleSelectionMode = useCallback(() => {
    const newModeState = !isSelectionModeActive;
    setIsSelectionModeActive(newModeState);
    
    // Clear selection when toggling off
    if (!newModeState) {
      setSelectedWordIndices([]);
      setShowMultiWordBadge(false);
    }
  }, [isSelectionModeActive]);

  const exitSelectionMode = useCallback(() => {
    setIsSelectionModeActive(false);
    setSelectedWordIndices([]);
    setShowMultiWordBadge(false);
  }, []);

  const handleShowMultiWordTranslation = useCallback(async () => {
    if (selectedWordIndices.length < 2) return;
    
    // Build phrase from selected indices with "..." separator
    const selectedTokens = selectedWordIndices.map(i => tokens[i]);
    const phrase = selectedTokens
      .map((t, idx) => {
        const word = t.cleanWord || t.token;
        return idx === selectedTokens.length - 1 ? word : word + '...';
      })
      .join('');
    
    setSelectionStart(selectedWordIndices[0]);
    setSelectionEnd(selectedWordIndices[selectedWordIndices.length - 1]);
    setSelectedPhrase(phrase);
    setPhraseTranslation(null);
    setIsPhraseSaved(false);
    setShowMultiWordBadge(false);
    
    // Exit selection mode after showing translation
    setIsSelectionModeActive(false);
    
    // Position popover at first selected word
    const firstWordElement = document.querySelector(`[data-index="${selectedWordIndices[0]}"]`);
    if (firstWordElement) {
      const rect = firstWordElement.getBoundingClientRect();
      setPopoverPosition({
        x: rect.left + rect.width / 2,
        y: rect.bottom + 8,
      });
    }
    
    // Fetch phrase translation
    const lessonLang = (lesson?.language || targetLanguage) as Language;
    const translationLang = getTranslationLanguage(lessonLang);
    
    console.log('Multi-word Translation Debug:', {
      phrase,
      lessonLanguage: lessonLang,
      translationLanguage: translationLang
    });
    
    const result = await translate(phrase, lessonLang, translationLang);
    if (result) {
      setPhraseTranslation(result.translation);
    }
  }, [selectedWordIndices, tokens, lesson, targetLanguage, getTranslationLanguage, translate]);

  const handleAudioClick = useCallback(async () => {
    if (!lesson || !id) return;

    // If audio exists, show the player
    if (lesson.audio_url) {
      setShowAudioPlayer(true);
      return;
    }

    // Generate new audio
    setGeneratingAudio(true);
    const audioUrl = await generateLessonAudio(id, lesson.content, lesson.language);
    setGeneratingAudio(false);
    
    if (audioUrl) {
      setLesson({ ...lesson, audio_url: audioUrl });
      setShowAudioPlayer(true);
    }
  }, [lesson, id, generateLessonAudio]);

  const handleCompleteLesson = useCallback(async () => {
    if (!lesson || completingLesson) return;

    setCompletingLesson(true);
    
    try {
      // Extract all unique words from the lesson
      const words = lesson.content
        .split(/\s+/)
        .map(word => word.replace(/[.,!?;:"""''()[\]{}]/g, '').toLowerCase().trim())
        .filter(word => word.length > 0);

      const result = await markAllWordsAsKnown(words);
      
      if (result.success) {
        toast.success(`Lesson completed! ${result.markedCount} words marked as known.`);
        setShowCompleteDialog(false);
        
        // Mark the reading session as completed
        if (sessionIdRef.current) {
          const readingSeconds = readingStartTimeRef.current 
            ? Math.round((Date.now() - readingStartTimeRef.current) / 1000)
            : 0;
          
          await supabase
            .from('reading_sessions')
            .update({
              reading_time_seconds: readingSeconds,
              completed_at: new Date().toISOString(),
            })
            .eq('id', sessionIdRef.current);
        }
      } else {
        toast.error('Failed to complete lesson. Please try again.');
      }
    } catch (error) {
      console.error('Error completing lesson:', error);
      toast.error('An error occurred while completing the lesson.');
    } finally {
      setCompletingLesson(false);
    }
  }, [lesson, markAllWordsAsKnown, completingLesson]);

  const getWordClassName = (status: WordStatus | 'new' | null, index: number): string => {
    // Check if this token is part of multi-word selection (CTRL+click) - use green highlight
    if (selectedWordIndices.includes(index) && !selectedPhrase) {
      return 'word-multi-select';
    }
    
    // Check if this token is part of an active phrase (after clicking "Show Translation")
    if (selectedWordIndices.includes(index) && selectedPhrase) {
      return 'word-phrase';
    }
    
    // Check if this token is part of phrase selection (Shift+click)
    if (selectionStart !== null && selectionEnd !== null) {
      const minIdx = Math.min(selectionStart, selectionEnd);
      const maxIdx = Math.max(selectionStart, selectionEnd);
      if (index >= minIdx && index <= maxIdx) {
        return 'word-phrase';
      }
    }
    
    if (status === null) return '';
    if (status === -1) return 'word-known'; // Ignored - no highlight, same as known
    if (status === 'new') return 'word-new';
    if (status === 0) return 'word-known';
    if (status === 1) return 'word-new'; // Status 1 = new (blue)
    if (status === 2) return 'word-learning-1'; // Status 2 = learning level 1 (dark yellow)
    if (status === 3) return 'word-learning-2'; // Status 3 = learning level 2 (medium yellow)
    if (status === 4) return 'word-learning-3'; // Status 4 = learning level 3 (light yellow)
    if (status === 5) return 'word-known'; // Learned - no highlight
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
            <p className="text-xs text-muted-foreground">
              {isSelectionModeActive ? '🟢 Selection Mode: Click words to link' : 'Shift+click: consecutive phrases'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleAudioClick}
              disabled={generatingAudio}
              title={lesson.audio_url ? 'Open audio player' : 'Generate audio'}
            >
              {generatingAudio ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleSelectionMode}
              title="Link words (separable verbs)"
              className={isSelectionModeActive ? 'bg-success/20 text-success hover:bg-success/30' : ''}
            >
              <Link2 className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowCompleteDialog(true)}
              title="Complete lesson"
            >
              <CheckCircle2 className="w-5 h-5" />
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
      <main className={`container mx-auto px-4 py-6 max-w-3xl ${showAudioPlayer ? 'pb-24' : ''}`}>
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
                data-index={index}
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
          onIgnore={handleIgnore}
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

      {/* Multi-word Selection Badge */}
      {showMultiWordBadge && selectedWordIndices.length > 0 && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-card border-2 border-success rounded-full shadow-lg px-4 py-2 flex items-center gap-3 animate-slide-up">
          <span className="text-sm font-medium text-success">
            {selectedWordIndices.length} word{selectedWordIndices.length !== 1 ? 's' : ''} linked
          </span>
          {selectedWordIndices.length >= 2 && (
            <Button 
              size="sm" 
              onClick={handleShowMultiWordTranslation}
              className="h-7 bg-success hover:bg-success/90"
            >
              Show Translation
            </Button>
          )}
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={exitSelectionMode}
            className="h-7"
          >
            Exit Mode
          </Button>
        </div>
      )}

      {/* Audio Player */}
      {showAudioPlayer && lesson.audio_url && (
        <AudioPlayer
          audioUrl={lesson.audio_url}
          onClose={() => setShowAudioPlayer(false)}
        />
      )}

      {/* Complete Lesson Dialog */}
      <AlertDialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete Lesson?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark all unmarked words in this lesson as "known" in your vocabulary. 
              Words you've already marked (Ignored, Learning Status 1-4, or Known) will remain unchanged.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={completingLesson}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCompleteLesson}
              disabled={completingLesson}
            >
              {completingLesson ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Completing...
                </>
              ) : (
                'Complete Lesson'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
