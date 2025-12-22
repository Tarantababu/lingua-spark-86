import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLessons } from '@/hooks/useLessons';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Clock, FileText } from 'lucide-react';

export default function Library() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { lessons, loading } = useLessons();
  const { targetLanguage, languages } = useLanguage();

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
            <div key={i} className="h-32 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const currentLang = languages.find(l => l.code === targetLanguage);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold text-foreground">
          {currentLang?.flag} {currentLang?.name} Library
        </h1>
        <p className="text-muted-foreground mt-1">
          {lessons.length > 0 ? `${lessons.length} lessons available` : 'No lessons yet'}
        </p>
      </div>

      {lessons.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="font-serif text-xl font-bold mb-2">No lessons yet</h2>
            <p className="text-muted-foreground">
              Sample content will be added soon. Check back later!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {lessons.map(lesson => (
            <Card
              key={lesson.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/reader/${lesson.id}`)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="font-serif text-lg">{lesson.title}</CardTitle>
                    <CardDescription className="mt-1">{lesson.description}</CardDescription>
                  </div>
                  <Badge variant="secondary">{lesson.difficulty_level}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    {lesson.word_count || '—'} words
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {lesson.estimated_minutes || '—'} min
                  </span>
                  <Badge variant="outline" className="capitalize">
                    {lesson.content_type.replace('_', ' ')}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
