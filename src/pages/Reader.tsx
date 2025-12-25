import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { useVocabulary } from '@/hooks/useVocabulary';
import { useTranslation } from '@/hooks/useTranslation';
import { useLessons } from '@/hooks/useLessons';
import { pb } from '@/lib/pocketbase';
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
import {
  ArrowLeft,
  Settings,
  Volume2,
  Loader2,
  CheckCircle2,
  Link2,
} from 'lucide-react';
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
  const { translate, loading: translating } = useTranslation();
  const { getLesson, generateLessonAudio } = useLessons();

  const [lesson, setLesson] = useState<Lesson | null>(null);

  const {
    getWordStatus,
    getWordData,
    addWord,
    updateWordStatus,
    updateWordTranslation,
    ignoreWord,
    markAllWordsAsKnown,
    refetch,
    loading: vocabLoading,
    vocabulary,
  } = useVocabulary(lesson?.language);

  const [loading, setLoading] = useState(true);
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);

  /** 🔑 OPTIMISTIC STATUS OVERRIDES */
  const [localStatusOverrides, setLocalStatusOverrides] = useState<
    Record<string, WordStatus | 'new' | -1>
  >({});

  // Reading session
  const sessionIdRef = useRef<string | null>(null);
  const readingStartTimeRef = useRef<number | null>(null);

  // Selection
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedWordData, setSelectedWordData] = useState<any>(null);

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

  const shiftHeldRef = useRef(false);
  const lastClickedIndexRef = useRef<number | null>(null);

  // ------------------ EFFECTS ------------------

  useEffect(() => {
    if (!user || !id) return;

    readingStartTimeRef.current = Date.now();

    pb.collection('reading_sessions')
      .create({
        user: user.id,
        lesson: id,
        reading_time_seconds: 0,
        listening_time_seconds: 0,
        words_read: 0,
        lingqs_created: 0,
      })
      .then(r => (sessionIdRef.current = r.id))
      .catch(console.error);

    return () => {
      if (!sessionIdRef.current || !readingStartTimeRef.current) return;
      pb.collection('reading_sessions').update(sessionIdRef.current, {
        reading_time_seconds: Math.round(
          (Date.now() - readingStartTimeRef.current) / 1000
        ),
        completed_at: new Date().toISOString(),
      });
    };
  }, [user, id]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => e.key === 'Shift' && (shiftHeldRef.current = true);
    const up = (e: KeyboardEvent) => e.key === 'Shift' && (shiftHeldRef.current = false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [authLoading, user, navigate]);

  useEffect(() => {
    (async () => {
      if (!id) return;
      setLoading(true);
      setLesson(await getLesson(id));
      setLoading(false);
    })();
  }, [id, getLesson]);

  useEffect(() => {
    if (lesson?.audio_url) setShowAudioPlayer(true);
  }, [lesson?.audio_url]);

  // ------------------ TOKENS ------------------

  const tokens = useMemo((): TokenData[] => {
    if (!lesson?.content || vocabLoading) return [];

    return lesson.content
      .split(/(\s+|(?=[.,!?;:"()[\]{}])|(?<=[.,!?;:"()[\]{}]))/)
      .map((token, index) => {
        const cleanWord = token
          .replace(/[.,!?;:"()[\]{}]/g, '')
          .toLowerCase()
          .trim();

        if (!cleanWord || /^\s+$/.test(token)) {
          return { token, index, isWord: false };
        }

        const backendStatus = getWordStatus(cleanWord);
        const status =
          localStatusOverrides[cleanWord] ??
          (backendStatus === null ? 'new' : backendStatus);

        return { token, index, isWord: true, cleanWord, status };
      });
  }, [lesson?.content, vocabLoading, vocabulary, localStatusOverrides, getWordStatus]);

  // ------------------ HANDLERS ------------------

  const handleWordClick = async (t: TokenData, e: React.MouseEvent) => {
    if (!t.cleanWord) return;

    lastClickedIndexRef.current = t.index;

    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setPopoverPosition({ x: rect.left + rect.width / 2, y: rect.bottom + 8 });

    setSelectedWord(t.cleanWord);
    setSelectedWordData(null);

    const lessonLang = lesson?.language as Language;
    const translationLang = getTranslationLanguage(lessonLang);

    const result = await translate(t.cleanWord, lessonLang, translationLang);
    if (result) setSelectedWordData(result);
  };

  const handleStatusChange = useCallback(
    async (status: WordStatus) => {
      if (!selectedWord || !lesson || !user) return;

      const word = selectedWord.toLowerCase().trim();
      const language = lesson.language as Language;

      /** OPTIMISTIC */
      setLocalStatusOverrides(prev => ({ ...prev, [word]: status }));

      try {
        const existing = getWordData(word);
        if (existing?.id) {
          await updateWordStatus(existing.id, status);
        } else {
          const created = await addWord(
            word,
            language,
            selectedWordData?.translation,
            selectedWordData?.definition,
            id
          );
          if (created && status !== 1) {
            await updateWordStatus(created.id, status);
          }
        }

        await refetch();

        setLocalStatusOverrides(prev => {
          const copy = { ...prev };
          delete copy[word];
          return copy;
        });

        toast.success('Word updated');
      } catch {
        toast.error('Failed to update word');
      } finally {
        setSelectedWord(null);
        setSelectedWordData(null);
      }
    },
    [
      selectedWord,
      lesson,
      user,
      getWordData,
      updateWordStatus,
      addWord,
      selectedWordData,
      id,
      refetch,
    ]
  );

  const handleIgnore = useCallback(async () => {
    if (!selectedWord || !lesson) return;

    const word = selectedWord.toLowerCase().trim();
    const language = lesson.language as Language;

    setLocalStatusOverrides(prev => ({ ...prev, [word]: -1 }));

    await ignoreWord(word, language);
    await refetch();

    setLocalStatusOverrides(prev => {
      const copy = { ...prev };
      delete copy[word];
      return copy;
    });

    setSelectedWord(null);
    setSelectedWordData(null);
    toast.success('Word ignored');
  }, [selectedWord, lesson, ignoreWord, refetch]);

  const getWordClassName = (status: WordStatus | 'new' | null) => {
    if (status === 'new') return 'word-new';
    if (status === -1 || status === 0 || status === 5) return 'word-known';
    if (status === 1) return 'word-learning-1';
    if (status === 2) return 'word-learning-2';
    if (status === 3) return 'word-learning-3';
    if (status === 4) return 'word-learning-4';
    return '';
  };

  // ------------------ RENDER ------------------

  if (loading || authLoading || vocabLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading…
      </div>
    );
  }

  if (!lesson) {
    return <div className="p-8 text-center">Lesson not found</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-6 max-w-3xl">
        <div
          className="reader-text select-none"
          style={{ fontSize, lineHeight }}
        >
          {tokens.map(t =>
            t.isWord ? (
              <span
                key={t.index}
                className={`${getWordClassName(t.status!)} cursor-pointer`}
                onClick={e => handleWordClick(t, e)}
              >
                {t.token}
              </span>
            ) : (
              <span key={t.index}>{t.token}</span>
            )
          )}
        </div>
      </main>

      {selectedWord && (
        <WordPopover
          word={selectedWord}
          position={popoverPosition}
          translation={selectedWordData?.translation}
          definition={selectedWordData?.definition}
          examples={selectedWordData?.examples}
          pronunciation={selectedWordData?.pronunciation}
          loading={translating}
          onClose={() => setSelectedWord(null)}
          onStatusChange={handleStatusChange}
          onIgnore={handleIgnore}
          currentStatus={getWordStatus(selectedWord)}
          language={lesson.language}
        />
      )}
    </div>
  );
}
