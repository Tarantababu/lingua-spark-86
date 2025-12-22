import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVocabulary } from '@/hooks/useVocabulary';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Target, BookOpen, Clock, Brain, Zap } from 'lucide-react';
import { DailyStats, Profile } from '@/types';

import { StreakCard } from '@/components/stats/StreakCard';
import { DailyGoalCard } from '@/components/stats/DailyGoalCard';
import { WeeklyChart } from '@/components/stats/WeeklyChart';
import { ActivityHeatmap } from '@/components/stats/ActivityHeatmap';
import { StatsCard } from '@/components/stats/StatsCard';
import { AnimatedCounter } from '@/components/stats/AnimatedCounter';

interface VocabularyWithDate {
  id: string;
  created_at: string;
  status: number;
  is_phrase: boolean;
}

interface ReadingSessionData {
  id: string;
  reading_time_seconds: number | null;
  listening_time_seconds: number | null;
  created_at: string;
}

export default function Stats() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { targetLanguage, languages } = useLanguage();
  const { getKnownWordsCount, getLearningWordsCount } = useVocabulary();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [vocabularyData, setVocabularyData] = useState<VocabularyWithDate[]>([]);
  const [readingSessions, setReadingSessions] = useState<ReadingSessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Fetch initial data
  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      setLoading(true);

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData as Profile);
      }

      // Fetch vocabulary data for the last 30 days
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);

      const { data: vocabData } = await supabase
        .from('vocabulary')
        .select('id, created_at, status, is_phrase')
        .eq('user_id', user.id)
        .eq('language', targetLanguage)
        .gte('created_at', monthAgo.toISOString())
        .order('created_at', { ascending: true });

      if (vocabData) {
        setVocabularyData(vocabData);
      }

      // Fetch reading sessions
      const { data: sessionsData } = await supabase
        .from('reading_sessions')
        .select('id, reading_time_seconds, listening_time_seconds, created_at')
        .eq('user_id', user.id)
        .gte('created_at', monthAgo.toISOString())
        .order('created_at', { ascending: true });

      if (sessionsData) {
        setReadingSessions(sessionsData);
      }

      setLoading(false);
    }

    fetchData();
  }, [user, targetLanguage]);

  // Real-time subscription for live updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('stats-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vocabulary',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Vocabulary updated:', payload);
          setLastUpdate(new Date());
          
          if (payload.eventType === 'INSERT') {
            const newItem = payload.new as VocabularyWithDate;
            setVocabularyData(prev => [...prev, newItem]);
          } else if (payload.eventType === 'UPDATE') {
            setVocabularyData(prev => 
              prev.map(v => v.id === (payload.new as VocabularyWithDate).id ? payload.new as VocabularyWithDate : v)
            );
          } else if (payload.eventType === 'DELETE') {
            setVocabularyData(prev => 
              prev.filter(v => v.id !== (payload.old as VocabularyWithDate).id)
            );
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
          console.log('Reading session updated:', payload);
          setLastUpdate(new Date());
          
          if (payload.eventType === 'INSERT') {
            setReadingSessions(prev => [...prev, payload.new as ReadingSessionData]);
          } else if (payload.eventType === 'UPDATE') {
            setReadingSessions(prev => 
              prev.map(s => s.id === (payload.new as ReadingSessionData).id ? payload.new as ReadingSessionData : s)
            );
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Profile updated:', payload);
          setProfile(payload.new as Profile);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Calculate daily stats from vocabulary data
  const dailyVocabStats = useMemo(() => {
    const statsByDate: Record<string, { lingqs: number; date: string }> = {};
    
    vocabularyData.forEach(item => {
      const date = item.created_at.split('T')[0];
      if (!statsByDate[date]) {
        statsByDate[date] = { lingqs: 0, date };
      }
      statsByDate[date].lingqs += 1;
    });
    
    return statsByDate;
  }, [vocabularyData]);

  // Calculate reading/listening time by date
  const timeStatsByDate = useMemo(() => {
    const statsByDate: Record<string, { reading: number; listening: number }> = {};
    
    readingSessions.forEach(session => {
      const date = session.created_at.split('T')[0];
      if (!statsByDate[date]) {
        statsByDate[date] = { reading: 0, listening: 0 };
      }
      statsByDate[date].reading += session.reading_time_seconds || 0;
      statsByDate[date].listening += session.listening_time_seconds || 0;
    });
    
    return statsByDate;
  }, [readingSessions]);

  // Calculate streak from vocabulary activity
  const calculatedStreak = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let streak = 0;
    let currentDate = new Date(today);
    
    // Check today first
    const todayStr = currentDate.toISOString().split('T')[0];
    const hasActivityToday = dailyVocabStats[todayStr]?.lingqs > 0 || timeStatsByDate[todayStr];
    
    if (!hasActivityToday) {
      // Check yesterday - if no activity today, streak can still be valid from yesterday
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    // Count consecutive days with activity
    while (true) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const hasActivity = dailyVocabStats[dateStr]?.lingqs > 0 || timeStatsByDate[dateStr];
      
      if (hasActivity) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
      
      // Safety limit
      if (streak > 365) break;
    }
    
    return streak;
  }, [dailyVocabStats, timeStatsByDate]);

  const knownWords = getKnownWordsCount();
  const learningWords = getLearningWordsCount();
  const totalWords = knownWords + learningWords;
  const dailyGoal = profile?.daily_lingq_goal || 20;

  // Calculate today's progress
  const today = new Date().toISOString().split('T')[0];
  const todayLingQs = dailyVocabStats[today]?.lingqs || 0;
  const todayTimeStats = timeStatsByDate[today] || { reading: 0, listening: 0 };
  const todayReadingTime = todayTimeStats.reading;
  const todayListeningTime = todayTimeStats.listening;

  const currentLang = languages.find(l => l.code === targetLanguage);

  // Prepare weekly chart data (last 7 days)
  const weeklyChartData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dateStr = date.toISOString().split('T')[0];
      const dayStats = dailyVocabStats[dateStr];
      return {
        date: dateStr,
        day: date.toLocaleDateString('en', { weekday: 'short' }),
        lingqs: dayStats?.lingqs || 0,
        goal: dailyGoal,
      };
    });
  }, [dailyVocabStats, dailyGoal]);

  // Prepare heatmap data (last 28 days)
  const heatmapData = useMemo(() => {
    return Array.from({ length: 28 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (27 - i));
      const dateStr = date.toISOString().split('T')[0];
      const dayStats = dailyVocabStats[dateStr];
      return {
        date: dateStr,
        count: dayStats?.lingqs || 0,
        dayOfWeek: date.getDay(),
      };
    });
  }, [dailyVocabStats]);

  // Calculate total time stats
  const totalReadingTime = useMemo(() => {
    return readingSessions.reduce((sum, s) => sum + (s.reading_time_seconds || 0), 0);
  }, [readingSessions]);

  const totalListeningTime = useMemo(() => {
    return readingSessions.reduce((sum, s) => sum + (s.listening_time_seconds || 0), 0);
  }, [readingSessions]);

  // Use calculated streak or profile streak (whichever is higher)
  const displayStreak = Math.max(calculatedStreak, profile?.streak_count || 0);

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 shimmer rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Statistics</h1>
          <p className="text-muted-foreground">
            {currentLang?.flag} {currentLang?.name} Progress
          </p>
        </div>
        <div className="text-xs text-muted-foreground">
          Live • Updated {lastUpdate.toLocaleTimeString()}
        </div>
      </div>

      {/* Streak Card - Hero */}
      <StreakCard streak={displayStreak} className="animate-slide-up" />

      {/* Known Words - Big Number */}
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent animate-slide-up" style={{ animationDelay: '100ms' }}>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Target className="w-5 h-5" />
            <span className="text-sm font-medium">Known Words</span>
          </div>
          <div className="flex items-baseline gap-3">
            <AnimatedCounter 
              value={knownWords} 
              className="text-5xl font-bold text-primary"
              duration={2000}
            />
            <div className="text-muted-foreground">
              <span className="text-success">+{learningWords}</span> learning
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Today's Goal */}
      <DailyGoalCard 
        current={todayLingQs} 
        goal={dailyGoal}
        className="animate-slide-up"
      />

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <StatsCard
          icon={BookOpen}
          iconColor="text-info"
          label="Total LingQs"
          value={totalWords}
          delay={200}
        />
        <StatsCard
          icon={Brain}
          iconColor="text-success"
          label="Words Mastered"
          value={knownWords}
          delay={250}
        />
        <StatsCard
          icon={Clock}
          iconColor="text-warning"
          label="Reading Time"
          value={Math.round(totalReadingTime / 60)}
          suffix="min"
          subValue={todayReadingTime > 0 ? `${Math.round(todayReadingTime / 60)}min today` : "This month"}
          delay={300}
        />
        <StatsCard
          icon={Zap}
          iconColor="text-streak"
          label="Listening Time"
          value={Math.round(totalListeningTime / 60)}
          suffix="min"
          subValue={todayListeningTime > 0 ? `${Math.round(todayListeningTime / 60)}min today` : "This month"}
          delay={350}
        />
      </div>

      {/* Weekly Activity Chart */}
      <WeeklyChart data={weeklyChartData} dailyGoal={dailyGoal} />

      {/* Activity Heatmap */}
      <ActivityHeatmap data={heatmapData} dailyGoal={dailyGoal} days={28} />
    </div>
  );
}
