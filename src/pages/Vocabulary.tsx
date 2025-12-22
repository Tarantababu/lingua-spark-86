import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useVocabulary } from '@/hooks/useVocabulary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Languages } from 'lucide-react';

const statusLabels: Record<number, string> = {
  0: 'Known',
  1: 'New',
  2: 'Learning 1',
  3: 'Learning 2',
  4: 'Learning 3',
  5: 'Learned',
};

const statusColors: Record<number, string> = {
  0: 'bg-muted text-muted-foreground',
  1: 'bg-word-new text-word-new-foreground',
  2: 'bg-word-learning-1 text-word-learning-foreground',
  3: 'bg-word-learning-2 text-word-learning-foreground',
  4: 'bg-word-learning-3 text-word-learning-foreground',
  5: 'bg-success text-success-foreground',
};

export default function Vocabulary() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { vocabulary, loading, getKnownWordsCount, getLearningWordsCount } = useVocabulary();

  React.useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold text-foreground">Vocabulary</h1>
        <div className="flex gap-4 mt-2 text-sm">
          <span className="text-success font-medium">{getKnownWordsCount()} known</span>
          <span className="text-warning font-medium">{getLearningWordsCount()} learning</span>
        </div>
      </div>

      {vocabulary.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Languages className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="font-serif text-xl font-bold mb-2">No words yet</h2>
            <p className="text-muted-foreground">
              Start reading to build your vocabulary!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {vocabulary.map(word => (
            <Card key={word.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-lg">{word.word}</span>
                  {word.translation && (
                    <span className="text-muted-foreground ml-2">— {word.translation}</span>
                  )}
                </div>
                <Badge className={statusColors[word.status]}>
                  {statusLabels[word.status]}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
