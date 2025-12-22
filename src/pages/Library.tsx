import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLessons } from '@/hooks/useLessons';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Plus } from 'lucide-react';
import { Lesson } from '@/types';
import LessonCard from '@/components/library/LessonCard';
import LessonEditDialog from '@/components/library/LessonEditDialog';
import LessonDeleteDialog from '@/components/library/LessonDeleteDialog';

export default function Library() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { lessons, loading, updateLesson, deleteLesson } = useLessons();
  const { targetLanguage, languages } = useLanguage();

  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [deletingLesson, setDeletingLesson] = useState<Lesson | null>(null);

  React.useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const handleEdit = (lesson: Lesson) => {
    setEditingLesson(lesson);
  };

  const handleDelete = (lesson: Lesson) => {
    setDeletingLesson(lesson);
  };

  const handleSaveEdit = async (id: string, data: {
    title: string;
    description: string;
    difficulty_level: string;
    content_type: string;
  }) => {
    return await updateLesson(id, data);
  };

  const handleConfirmDelete = async () => {
    if (!deletingLesson) return false;
    return await deleteLesson(deletingLesson.id);
  };

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
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">
            {currentLang?.flag} {currentLang?.name} Library
          </h1>
          <p className="text-muted-foreground mt-1">
            {lessons.length > 0 ? `${lessons.length} lessons available` : 'No lessons yet'}
          </p>
        </div>
        <Button onClick={() => navigate('/import')} className="gap-2">
          <Plus className="w-4 h-4" />
          Import
        </Button>
      </div>

      {lessons.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="font-serif text-xl font-bold mb-2">No lessons yet</h2>
            <p className="text-muted-foreground mb-4">
              Import your own content or check back later for sample lessons!
            </p>
            <Button onClick={() => navigate('/import')}>
              <Plus className="w-4 h-4 mr-2" />
              Import Content
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {lessons.map(lesson => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <LessonEditDialog
        lesson={editingLesson}
        open={!!editingLesson}
        onOpenChange={(open) => !open && setEditingLesson(null)}
        onSave={handleSaveEdit}
      />

      {/* Delete Confirmation Dialog */}
      <LessonDeleteDialog
        lessonTitle={deletingLesson?.title || ''}
        open={!!deletingLesson}
        onOpenChange={(open) => !open && setDeletingLesson(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
