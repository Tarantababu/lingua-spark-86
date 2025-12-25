import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVocabulary } from '@/hooks/useVocabulary';
import { pb, Profile as PBProfile } from '@/lib/pocketbase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Target, BookOpen, Clock, Brain, Zap, Settings2 } from 'lucide-react';
import { Profile } from '@/types';
import { toast } from 'sonner';

import { StreakCard } from '@/components/stats/StreakCard';
import { DailyGoalCard } from '@/components/stats/DailyGoalCard';
import { WeeklyChart } from '@/components/stats/WeeklyChart';
import { ActivityHeatmap } from '@/components/stats/ActivityHeatmap';
import { StatsCard } from '@/components/stats/StatsCard';
import { AnimatedCounter } from '@/components/stats/AnimatedCounter';

interface VocabularyWithDate {
  id: string;
  created: string;
  status: number;
  is_phrase: boolean;
}

interface ReadingSessionData {
  id: string;
  reading_time_seconds: number | null;
  listening_time_seconds: number | null;
  created: string;
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
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [newGoal, setNewGoal] = useState<number>(20);
  const [recentUpdate, setRecentUpdate] = useState(false);
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

      try {
        // Fetch profile
        const profileRecords = await pb.collection('profiles').getFullList({
          filter: `user="${user.id}"`,
        });

        if (profileRecords.length > 0) {
          const pbProfile = profileRecords[0] as any;
          setProfile({
            id: pbProfile.id,
            user_id: pbProfile.user,
            display_name: pbProfile.display_name,
            native_language: pbProfile.native_language,
            target_language: pbProfile.target_language,
            daily_lingq_goal: pbProfile.daily_lingq_goal,
            daily_reading_goal: pbProfile.daily_reading_goal,
            streak_count: pbProfile.streak_count,
            last_activity_date: pbProfile.last_activity_date,
            is_premium: pbProfile.is_premium,
            created_at: pbProfile.created,
            updated_at: pbProfile.updated,
          } as Profile);
        }

        // Fetch vocabulary data for the last 400 days (to support streaks over 1 year)
        const lookbackDays = 400;
        const lookbackDate = new Date();
        lookbackDate.setDate(lookbackDate.getDate() - lookbackDays);

        const vocabData = await pb.collection('vocabulary').getFullList({
          filter: `user="${user.id}" && language="${targetLanguage}" && created>="${lookbackDate.toISOString()}"`,
          sort: 'created',
          fields: 'id,created,status,is_phrase',
        });

        if (vocabData) {
          setVocabularyData(vocabData as any);
        }

        // Fetch reading sessions for the same period
        const sessionsData = await pb.collection('reading_sessions').getFullList({
          filter: `user="${user.id}" && created>="${lookbackDate.toISOString()}"`,
          sort: 'created',
          fields: 'id,reading_time_seconds,listening_time_seconds,created',
        });

        if (sessionsData) {
          setReadingSessions(sessionsData as any);
        }
      } catch (error) {
        console.error('Error fetching stats data:', error);
      }

      setLoading(false);
    }

    fetchData();
  }, [user, targetLanguage]);

  // Real-time subscription for live updates using PocketBase
  useEffect(() => {
    if (!user) return;

    // Subscribe to vocabulary changes
    pb.collection('vocabulary').subscribe('*', (e) => {
      console.log('Vocabulary updated:', e.action);
      setLastUpdate(new Date());
      setRecentUpdate(true);
      setTimeout(() => setRecentUpdate(false), 2000);
      
      if (e.action === 'create') {
        setVocabularyData(prev => [...prev, e.record as any]);
      } else if (e.action === 'update') {
        setVocabularyData(prev => 
          prev.map(v => v.id === e.record.id ? e.record as any : v)
        );
      } else if (e.action === 'delete') {
        setVocabularyData(prev => 
          prev.filter(v => v.id !== e.record.id)
        );
      }
    });

    // Subscribe to reading sessions changes
    pb.collection('reading_sessions').subscribe('*', (e) => {
      console.log('Reading session updated:', e.action);
      setLastUpdate(new Date());
      setRecentUpdate(true);
      setTimeout(() => setRecentUpdate(false), 2000);
      
      if (e.action === 'create') {
        setReadingSessions(prev => [...prev, e.record as any]);
      } else if (e.action === 'update') {
        setReadingSessions(prev => 
          prev.map(s => s.id === e.record.id ? e.record as any : s)
        );
      }
    });

    // Subscribe to profile changes
    pb.collection('profiles').subscribe('*', (e) => {
      console.log('Profile updated:', e.action);
      if (e.action === 'update' && e.record.user === user.id) {
        const pbProfile = e.record as any;
        setProfile({
          id: pbProfile.id,
          user_id: pbProfile.user,
          display_name: pbProfile.display_name,
          native_language: pbProfile.native_language,
          target_language: pbProfile.target_language,
          daily_lingq_goal: pbProfile.daily_lingq_goal,
          daily_reading_goal: pbProfile.daily_reading_goal,
          streak_count: pbProfile.streak_count,
          last_activity_date: pbProfile.last_activity_date,
          is_premium: pbProfile.is_premium,
          created_at: pbProfile.created,
          updated_at: pbProfile.updated,
        } as Profile);
      }
    });

    return () => {
      // Unsubscribe from all collections
      pb.collection('vocabulary').unsubscribe('*');
      pb.collection('reading_sessions').unsubscribe('*');
      pb.collection('profiles').unsubscribe('*');
    };
  }, [user]);

  // Calculate daily stats from vocabulary data
  const dailyVocabStats = useMemo(() => {
    const statsByDate: Record<string, { lingqs: number; date: string }> = {};
    
    vocabularyData.forEach(item => {
      const date = item.created.split('T')[0];
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
      const date = session.created.split('T')[0];
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
    const todayTimeStats = timeStatsByDate[todayStr];
    const hasActivityToday = 
      (dailyVocabStats[todayStr]?.lingqs > 0) || 
      (todayTimeStats && (todayTimeStats.reading > 0 || todayTimeStats.listening > 0));
    
    if (!hasActivityToday) {
      // Check yesterday - if no activity today, streak can still be valid from yesterday
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    // Count consecutive days with activity
    while (true) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const timeStats = timeStatsByDate[dateStr];
      const hasActivity = 
        (dailyVocabStats[dateStr]?.lingqs > 0) || 
        (timeStats && (timeStats.reading > 0 || timeStats.listening > 0));
      
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

  // Sync newGoal state with profile
  useEffect(() => {
    if (profile?.daily_lingq_goal) {
      setNewGoal(profile.daily_lingq_goal);
    }
  }, [profile?.daily_lingq_goal]);

  // Handle updating daily goal
  const handleUpdateGoal = async () => {
    if (!user || !profile) return;
    
    const goalValue = Math.max(1, Math.min(100, newGoal));
    
    try {
      // Find the profile record
      const profileRecords = await pb.collection('profiles').getFullList({
        filter: `user="${user.id}"`,
      });

      if (profileRecords.length > 0) {
        await pb.collection('profiles').update(profileRecords[0].id, { 
          daily_lingq_goal: goalValue 
        });
        
        setProfile({ ...profile, daily_lingq_goal: goalValue });
        setShowGoalDialog(false);
        toast.success(`Daily goal set to ${goalValue} LingQs!`);
      }
    } catch (error) {
      console.error('Error updating goal:', error);
      toast.error('Failed to update goal');
    }
  };

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
      {/* Header with Known Words */}
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground">Statistics</h1>
            <p className="text-sm text-muted-foreground">
              {currentLang?.flag} {currentLang?.name} Progress
            </p>
          </div>
          <div className="text-right">
            <div className={`flex items-center gap-2 justify-end transition-all ${recentUpdate ? 'scale-110' : 'scale-100'}`}>
              <Target className="w-5 h-5 text-primary" />
              <span className="text-3xl font-bold text-primary">
                <AnimatedCounter value={knownWords} />
              </span>
            </div>
            <p className="text-sm font-medium text-muted-foreground">Known Words</p>
          </div>
        </div>
        <div className={`text-xs font-medium transition-colors ${recentUpdate ? 'text-success' : 'text-muted-foreground'}`}>
          {recentUpdate ? '✓ Updated now' : `Live • Updated ${lastUpdate.toLocaleTimeString()}`}
        </div>
      </div>

      {/* Streak Card - Hero with live update indicator */}
      <div className={`transition-all duration-300 ${recentUpdate ? 'ring-2 ring-success ring-offset-2' : ''}`}>
        <StreakCard streak={displayStreak} className="animate-slide-up" />
      </div>

      {/* Today's Goal with Settings */}
      <Card className="animate-slide-up">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              <span className="font-medium">Today's Goal</span>
            </div>
            <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  <Settings2 className="w-4 h-4 mr-1" />
                  Set Goal
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[320px]">
                <DialogHeader>
                  <DialogTitle>Set Daily Goal</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Daily LingQs Target</label>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={newGoal}
                      onChange={(e) => setNewGoal(parseInt(e.target.value) || 1)}
                      className="text-center text-lg font-bold"
                    />
                    <p className="text-xs text-muted-foreground text-center">
                      Set a goal between 1-100 LingQs per day
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {[10, 20, 30, 50].map((preset) => (
                      <Button
                        key={preset}
                        variant={newGoal === preset ? "default" : "outline"}
                        size="sm"
                        className="flex-1"
                        onClick={() => setNewGoal(preset)}
                      >
                        {preset}
                      </Button>
                    ))}
                  </div>
                  <Button onClick={handleUpdateGoal} className="w-full">
                    Save Goal
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <DailyGoalCard 
            current={todayLingQs} 
            goal={dailyGoal}
            className="border-0 shadow-none p-0"
            hideHeader
          />
        </CardContent>
      </Card>

      {/* Today's Progress Section */}
      <div className="space-y-3">
        <h2 className="font-semibold text-lg text-foreground">Today's Activity</h2>
        <div className="grid grid-cols-2 gap-3">
          <Card className={`transition-all ${recentUpdate ? 'ring-2 ring-success ring-offset-1' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-4 h-4 text-info" />
                <span className="text-sm font-medium text-muted-foreground">LingQs Today</span>
              </div>
              <div className="text-3xl font-bold text-info">
                <AnimatedCounter value={todayLingQs} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {todayLingQs >= dailyGoal ? '🎉 Goal reached!' : `${dailyGoal - todayLingQs} more to reach goal`}
              </p>
            </CardContent>
          </Card>
          
          <Card className={`transition-all ${recentUpdate ? 'ring-2 ring-success ring-offset-1' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-warning" />
                <span className="text-sm font-medium text-muted-foreground">Time Today</span>
              </div>
              <div className="text-3xl font-bold text-warning">
                <AnimatedCounter value={Math.round((todayReadingTime + todayListeningTime) / 60)} />
                <span className="text-lg">min</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round(todayReadingTime / 60)}min read • {Math.round(todayListeningTime / 60)}min listen
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Overall Stats Grid */}
      <div className="space-y-3">
        <h2 className="font-semibold text-lg text-foreground">Overall Progress</h2>
        <div className="grid grid-cols-2 gap-3">
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
            label="Total Reading"
            value={Math.round(totalReadingTime / 60)}
            suffix="min"
            subValue="All time"
            delay={300}
          />
          <StatsCard
            icon={Zap}
            iconColor="text-streak"
            label="Total Listening"
            value={Math.round(totalListeningTime / 60)}
            suffix="min"
            subValue="All time"
            delay={350}
          />
        </div>
      </div>

      {/* Weekly Activity Chart */}
      <WeeklyChart data={weeklyChartData} dailyGoal={dailyGoal} />

      {/* Activity Heatmap */}
      <ActivityHeatmap data={heatmapData} dailyGoal={dailyGoal} days={28} />
    </div>
  );
}
