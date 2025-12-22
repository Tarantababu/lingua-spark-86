import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVocabulary } from '@/hooks/useVocabulary';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Target, BookOpen, Clock, Flame, TrendingUp, Calendar } from 'lucide-react';
import { DailyStats, Profile } from '@/types';

export default function Stats() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { targetLanguage, languages } = useLanguage();
  const { getKnownWordsCount, getLearningWordsCount, vocabulary } = useVocabulary();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

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

      // Fetch weekly stats
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data: statsData } = await supabase
        .from('daily_stats')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', weekAgo.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (statsData) {
        setWeeklyStats(statsData as DailyStats[]);
      }

      setLoading(false);
    }

    fetchData();
  }, [user]);

  const knownWords = getKnownWordsCount();
  const learningWords = getLearningWordsCount();
  const totalWords = knownWords + learningWords;
  const streak = profile?.streak_count || 0;
  const dailyGoal = profile?.daily_lingq_goal || 20;

  // Calculate today's progress
  const today = new Date().toISOString().split('T')[0];
  const todayStats = weeklyStats.find(s => s.date === today);
  const todayLingQs = todayStats?.lingqs_created || 0;
  const goalProgress = Math.min((todayLingQs / dailyGoal) * 100, 100);

  const currentLang = languages.find(l => l.code === targetLanguage);

  // Generate activity calendar for last 7 days
  const activityDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toISOString().split('T')[0];
    const dayStats = weeklyStats.find(s => s.date === dateStr);
    return {
      date: dateStr,
      day: date.toLocaleDateString('en', { weekday: 'short' }),
      count: dayStats?.lingqs_created || 0,
    };
  });

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold text-foreground">Statistics</h1>
        <p className="text-muted-foreground">
          {currentLang?.flag} {currentLang?.name} Progress
        </p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="col-span-2 bg-gradient-to-br from-primary/10 to-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="w-4 h-4" />
              Known Words
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-primary">{knownWords.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground mt-1">
              +{learningWords} learning
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <Flame className="w-5 h-5 text-streak" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{streak}</p>
            <p className="text-sm text-muted-foreground">Day Streak</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <BookOpen className="w-5 h-5 text-info" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalWords}</p>
            <p className="text-sm text-muted-foreground">Total LingQs</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Goal Progress */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Today's Goal</span>
            <span className="text-sm font-normal text-muted-foreground">
              {todayLingQs} / {dailyGoal} LingQs
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={goalProgress} className="h-3" />
          <p className="text-sm text-muted-foreground mt-2">
            {goalProgress >= 100 
              ? '🎉 Goal achieved!' 
              : `${dailyGoal - todayLingQs} more to reach your goal`}
          </p>
        </CardContent>
      </Card>

      {/* Weekly Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            This Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between">
            {activityDays.map(day => (
              <div key={day.date} className="flex flex-col items-center gap-1">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium ${
                    day.count > 0
                      ? day.count >= dailyGoal
                        ? 'bg-success text-success-foreground'
                        : 'bg-warning/50 text-warning-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {day.count}
                </div>
                <span className="text-xs text-muted-foreground">{day.day}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
