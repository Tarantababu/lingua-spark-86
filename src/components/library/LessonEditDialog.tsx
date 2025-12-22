import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Lesson } from '@/types';
import { Loader2 } from 'lucide-react';

interface LessonEditDialogProps {
  lesson: Lesson | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, data: {
    title: string;
    description: string;
    difficulty_level: string;
    content_type: string;
  }) => Promise<boolean>;
}

const difficultyOptions = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const contentTypeOptions = [
  { value: 'article', label: 'Article' },
  { value: 'story', label: 'Story' },
  { value: 'news', label: 'News' },
  { value: 'dialogue', label: 'Dialogue' },
  { value: 'other', label: 'Other' },
];

export default function LessonEditDialog({
  lesson,
  open,
  onOpenChange,
  onSave,
}: LessonEditDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficultyLevel, setDifficultyLevel] = useState('beginner');
  const [contentType, setContentType] = useState('article');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (lesson) {
      setTitle(lesson.title);
      setDescription(lesson.description || '');
      setDifficultyLevel(lesson.difficulty_level);
      setContentType(lesson.content_type);
    }
  }, [lesson]);

  const handleSave = async () => {
    if (!lesson || !title.trim()) return;
    
    setSaving(true);
    const success = await onSave(lesson.id, {
      title: title.trim(),
      description: description.trim(),
      difficulty_level: difficultyLevel,
      content_type: contentType,
    });
    setSaving(false);
    
    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Lesson</DialogTitle>
          <DialogDescription>
            Make changes to your lesson here.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Lesson title"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the lesson"
              rows={3}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="difficulty">Difficulty Level</Label>
            <Select value={difficultyLevel} onValueChange={setDifficultyLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                {difficultyOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="contentType">Content Type</Label>
            <Select value={contentType} onValueChange={setContentType}>
              <SelectTrigger>
                <SelectValue placeholder="Select content type" />
              </SelectTrigger>
              <SelectContent>
                {contentTypeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !title.trim()}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
