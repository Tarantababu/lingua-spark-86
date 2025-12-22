import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVocabulary } from '@/hooks/useVocabulary';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Flame, ChevronDown, BookCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

interface VocabularyWithDate {
  id: string;
  created_at: string;
}

interface ReadingSessionData {
  id: string;
  reading_time_seconds: number | null;
  listening_time_seconds: number | null;
  created_at: string;
}

export default function TopHeader() {
  const { user } = useAuth();
  const { targetLanguage, setTargetLanguage, languages } = useLanguage();
  const { getKnownWordsCount } = useVocabulary();
  const [vocabularyData, setVocabularyData] = useState<VocabularyWithDate[]>([]);
  const [readingSessions, setReadingSessions] = useState<ReadingSessionData[]>([]);
  const [languageWordCounts, setLanguageWordCounts] = useState<Record<string, number>>({});

  const currentLanguage = languages.find(l => l.code === targetLanguage);
  const knownWordsCount = getKnownWordsCount();

  // Fetch known word counts for all languages
  useEffect(() => {
    async function fetchLanguageWordCounts() {
      if (!user) return;

      const counts: Record<string, number> = {};
      
      for (const lang of languages) {
        const { count } = await supabase
          .from('vocabulary')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('language', lang.code)
          .eq('status', 0); // Known words (status 0)

        counts[lang.code] = count || 0;
      }

      setLanguageWordCounts(counts);
    }

    fetchLanguageWordCounts();
  }, [user, languages]);

  // Fetch data for streak calculation
  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      const lookbackDays = 400;
      const lookbackDate = new Date();
      lookbackDate.setDate(lookbackDate.getDate() - lookbackDays);

      const { data: vocabData } = await supabase
        .from('vocabulary')
        .select('id, created_at')
        .eq('user_id', user.id)
        .eq('language', targetLanguage)
        .gte('created_at', lookbackDate.toISOString());

      if (vocabData) {
        setVocabularyData(vocabData);
      }

      const { data: sessionsData } = await supabase
        .from('reading_sessions')
        .select('id, reading_time_seconds, listening_time_seconds, created_at')
        .eq('user_id', user.id)
        .gte('created_at', lookbackDate.toISOString());

      if (sessionsData) {
        setReadingSessions(sessionsData);
      }
    }

    fetchData();
  }, [user, targetLanguage]);

  // Real-time subscription for immediate streak updates and word counts
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('header-streak-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'vocabulary',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newItem = payload.new as any;
          // Only update if it's for the current language
          if (newItem.language === targetLanguage) {
            setVocabularyData(prev => [...prev, newItem]);
          }
          
          // Update language word count if it's a known word
          if (newItem.status === 0) {
            setLanguageWordCounts(prev => ({
              ...prev,
              [newItem.language]: (prev[newItem.language] || 0) + 1
            }));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'vocabulary',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const oldItem = payload.old as any;
          const newItem = payload.new as any;
          
          // Update word counts if status changed to/from known
          if (oldItem.status !== 0 && newItem.status === 0) {
            // Changed to known
            setLanguageWordCounts(prev => ({
              ...prev,
              [newItem.language]: (prev[newItem.language] || 0) + 1
            }));
          } else if (oldItem.status === 0 && newItem.status !== 0) {
            // Changed from known
            setLanguageWordCounts(prev => ({
              ...prev,
              [newItem.language]: Math.max(0, (prev[newItem.language] || 0) - 1)
            }));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reading_sessions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setReadingSessions(prev => [...prev, payload.new as ReadingSessionData]);
          } else if (payload.eventType === 'UPDATE') {
            setReadingSessions(prev =>
              prev.map(s => s.id === (payload.new as ReadingSessionData).id ? payload.new as ReadingSessionData : s)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, targetLanguage]);

  // Calculate streak
  const currentStreak = useMemo(() => {
    const dailyVocabStats: Record<string, number> = {};
    vocabularyData.forEach(item => {
      const date = item.created_at.split('T')[0];
      dailyVocabStats[date] = (dailyVocabStats[date] || 0) + 1;
    });

    const timeStatsByDate: Record<string, { reading: number; listening: number }> = {};
    readingSessions.forEach(session => {
      const date = session.created_at.split('T')[0];
      if (!timeStatsByDate[date]) {
        timeStatsByDate[date] = { reading: 0, listening: 0 };
      }
      timeStatsByDate[date].reading += session.reading_time_seconds || 0;
      timeStatsByDate[date].listening += session.listening_time_seconds || 0;
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let streak = 0;
    let currentDate = new Date(today);
    
    const todayStr = currentDate.toISOString().split('T')[0];
    const todayTimeStats = timeStatsByDate[todayStr];
    const hasActivityToday = 
      (dailyVocabStats[todayStr] > 0) || 
      (todayTimeStats && (todayTimeStats.reading > 0 || todayTimeStats.listening > 0));
    
    if (!hasActivityToday) {
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    while (true) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const timeStats = timeStatsByDate[dateStr];
      const hasActivity = 
        (dailyVocabStats[dateStr] > 0) || 
        (timeStats && (timeStats.reading > 0 || timeStats.listening > 0));
      
      if (hasActivity) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
      
      if (streak > 365) break;
    }
    
    return streak;
  }, [vocabularyData, readingSessions]);

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">L</span>
          </div>
          <span className="font-serif font-bold text-xl text-foreground">LinguaFlow</span>
        </Link>

        <div className="flex items-center gap-3">
          {user && (
            <>
              {/* Streak Badge */}
              <div className="streak-badge">
                <Flame className="w-4 h-4" />
                <span>{currentStreak}</span>
              </div>

              {/* Known Words Count */}
              <div className="streak-badge bg-primary/10 text-primary">
                <BookCheck className="w-4 h-4" />
                <span>{knownWordsCount}</span>
              </div>

              {/* Language Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1">
                    <span className="text-lg">{currentLanguage?.flag}</span>
                    <span className="hidden sm:inline">{currentLanguage?.name}</span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[200px]">
                  {languages.map(lang => (
                    <DropdownMenuItem
                      key={lang.code}
                      onClick={() => setTargetLanguage(lang.code)}
                      className={targetLanguage === lang.code ? 'bg-accent' : ''}
                    >
                      <span className="mr-2">{lang.flag}</span>
                      <span className="flex-1">{lang.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({languageWordCounts[lang.code] || 0})
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
