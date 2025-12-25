import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVocabulary } from '@/hooks/useVocabulary';
import { pb } from '@/lib/pocketbase';
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
      
      try {
        for (const lang of languages) {
          const records = await pb.collection('vocabulary').getList(1, 1, {
            filter: `user="${user.id}" && language="${lang.code}" && status=0`,
          });
          counts[lang.code] = records.totalItems || 0;
        }
        setLanguageWordCounts(counts);
      } catch (error) {
        console.error('Error fetching word counts:', error);
      }
    }

    fetchLanguageWordCounts();
  }, [user, languages, targetLanguage]); // Refresh when targetLanguage changes

  // Fetch data for streak calculation
  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      const lookbackDays = 400;
      const lookbackDate = new Date();
      lookbackDate.setDate(lookbackDate.getDate() - lookbackDays);

      try {
        const vocabData = await pb.collection('vocabulary').getFullList({
          filter: `user="${user.id}" && language="${targetLanguage}" && created>="${lookbackDate.toISOString()}"`,
          fields: 'id,created',
        });

        if (vocabData) {
          setVocabularyData(vocabData.map(v => ({ id: v.id, created_at: v.created })));
        }

        const sessionsData = await pb.collection('reading_sessions').getFullList({
          filter: `user="${user.id}" && created>="${lookbackDate.toISOString()}"`,
          fields: 'id,reading_time_seconds,listening_time_seconds,created',
        });

        if (sessionsData) {
          setReadingSessions(sessionsData.map(s => ({
            id: s.id,
            reading_time_seconds: s.reading_time_seconds,
            listening_time_seconds: s.listening_time_seconds,
            created_at: s.created
          })));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }

    fetchData();
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
