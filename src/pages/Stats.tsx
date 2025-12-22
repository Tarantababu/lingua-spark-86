import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVocabulary } from '@/hooks/useVocabulary';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, BookOpen, Clock, Brain, Zap } from 'lucide-react';
import { DailyStats, Profile } from '@/types';

import { StreakCard } from '@/components/stats/StreakCard';
import { DailyGoalCard } from '@/components/stats/DailyGoalCard';
import { WeeklyChart } from '@/components/stats/WeeklyChart';
import { ActivityHeatmap } from '@/components/stats/ActivityHeatmap';
import { StatsCard } from '@/components/stats/StatsCard';
import { AnimatedCounter } from '@/components/stats/AnimatedCounter';

export default function Stats() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { targetLanguage, languages } = useLanguage();
  const { getKnownWordsCount, getLearningWordsCount } = useVocabulary();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<DailyStats[]>([]);
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

      // Fetch last 30 days of stats
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);

      const { data: statsData } = await supabase
        .from('daily_stats')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', monthAgo.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (statsData) {
        setMonthlyStats(statsData as DailyStats[]);
      }

      setLoading(false);
    }

    fetchData();
  }, [user]);

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
          table: 'daily_stats',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Stats updated:', payload);
          setLastUpdate(new Date());
          
          if (payload.eventType === 'INSERT') {
            setMonthlyStats(prev => [...prev, payload.new as DailyStats]);
          } else if (payload.eventType === 'UPDATE') {
            setMonthlyStats(prev => 
              prev.map(s => s.id === (payload.new as DailyStats).id ? payload.new as DailyStats : s)
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

  const knownWords = getKnownWordsCount();
  const learningWords = getLearningWordsCount();
  const totalWords = knownWords + learningWords;
  const streak = profile?.streak_count || 0;
  const dailyGoal = profile?.daily_lingq_goal || 20;

  // Calculate today's progress
  const today = new Date().toISOString().split('T')[0];
  const todayStats = monthlyStats.find(s => s.date === today);
  const todayLingQs = todayStats?.lingqs_created || 0;
  const todayReadingTime = todayStats?.reading_time_seconds || 0;
  const todayListeningTime = todayStats?.listening_time_seconds || 0;

  const currentLang = languages.find(l => l.code === targetLanguage);

  // Prepare weekly chart data (last 7 days)
  const weeklyChartData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toISOString().split('T')[0];
    const dayStats = monthlyStats.find(s => s.date === dateStr);
    return {
      date: dateStr,
      day: date.toLocaleDateString('en', { weekday: 'short' }),
      lingqs: dayStats?.lingqs_created || 0,
      goal: dailyGoal,
    };
  });

  // Prepare heatmap data
  const heatmapData = monthlyStats.map(s => ({
    date: s.date,
    count: s.lingqs_created || 0,
    dayOfWeek: new Date(s.date).getDay(),
  }));

  // Calculate total stats
  const totalReadingTime = monthlyStats.reduce((sum, s) => sum + (s.reading_time_seconds || 0), 0);
  const totalListeningTime = monthlyStats.reduce((sum, s) => sum + (s.listening_time_seconds || 0), 0);

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
      <StreakCard streak={streak} className="animate-slide-up" />

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
          subValue="This month"
          delay={300}
        />
        <StatsCard
          icon={Zap}
          iconColor="text-streak"
          label="Listening Time"
          value={Math.round(totalListeningTime / 60)}
          suffix="min"
          subValue="This month"
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
