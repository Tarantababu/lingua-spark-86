import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useVocabulary } from '@/hooks/useVocabulary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, BookOpen, Clock, Target } from 'lucide-react';

export default function Stats() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { getKnownWordsCount, getLearningWordsCount } = useVocabulary();

  React.useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const stats = [
    { label: 'Known Words', value: getKnownWordsCount(), icon: Target, color: 'text-success' },
    { label: 'Learning', value: getLearningWordsCount(), icon: BookOpen, color: 'text-warning' },
    { label: 'Reading Time', value: '0m', icon: Clock, color: 'text-info' },
    { label: 'Streak', value: '0 days', icon: BarChart3, color: 'text-streak' },
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="font-serif text-2xl font-bold text-foreground mb-6">Statistics</h1>
      
      <div className="grid grid-cols-2 gap-4">
        {stats.map(stat => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
