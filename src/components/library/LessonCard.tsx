import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Clock, FileText, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Lesson } from '@/types';

interface LessonCardProps {
  lesson: Lesson;
  onEdit: (lesson: Lesson) => void;
  onDelete: (lesson: Lesson) => void;
}

export default function LessonCard({ lesson, onEdit, onDelete }: LessonCardProps) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/reader/${lesson.id}`);
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="font-serif text-lg truncate">{lesson.title}</CardTitle>
            <CardDescription className="mt-1 line-clamp-2">{lesson.description}</CardDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <Badge variant="secondary">{lesson.difficulty_level}</Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={handleMenuClick}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(lesson);
                  }}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(lesson);
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
  );
}
