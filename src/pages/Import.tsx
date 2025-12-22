import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Upload, FileText, Wand2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const difficultyLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const contentTypes = [
  { value: 'article', label: 'Article' },
  { value: 'story', label: 'Story' },
  { value: 'news', label: 'News' },
  { value: 'podcast', label: 'Podcast Transcript' },
];

export default function Import() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { targetLanguage, languages } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [language, setLanguage] = useState<Language>(targetLanguage);
  const [difficulty, setDifficulty] = useState('A2');
  const [contentType, setContentType] = useState('article');
  const [detecting, setDetecting] = useState(false);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const detectLanguage = async () => {
    if (content.trim().length < 20) {
      toast.error('Please enter at least 20 characters to detect language');
      return;
    }

    setDetecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('detect-language', {
        body: { text: content },
      });

      if (error) throw error;

      if (data.language && data.language !== 'unknown') {
        const supportedLang = languages.find(l => l.code === data.language);
        if (supportedLang) {
          setLanguage(data.language as Language);
          toast.success(`Detected: ${data.languageName} (${Math.round(data.confidence * 100)}% confident)`);
        } else {
          toast.warning(`Detected ${data.languageName}, but it's not in your supported languages`);
        }
      } else {
        toast.warning('Could not detect language. Please select manually.');
      }
    } catch (err) {
      console.error('Language detection error:', err);
      toast.error('Language detection failed');
    } finally {
      setDetecting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    const validTypes = ['text/plain', 'text/markdown', 'application/pdf'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.txt') && !file.name.endsWith('.md')) {
      toast.error('Please upload a .txt or .md file');
      return;
    }

    // Check file size (max 1MB for text files)
    if (file.size > 1024 * 1024) {
      toast.error('File too large. Maximum size is 1MB.');
      return;
    }

    try {
      const text = await file.text();
      setContent(text);
      
      // Use filename as title if empty
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
      
      toast.success('File loaded successfully');
    } catch (err) {
      console.error('File read error:', err);
      toast.error('Could not read file');
    }
  };

  const calculateWordCount = (text: string): number => {
    return text.trim().split(/\s+/).filter(w => w.length > 0).length;
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please sign in to import content');
      return;
    }

    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (content.trim().length < 50) {
      toast.error('Content must be at least 50 characters');
      return;
    }

    setSaving(true);
    try {
      const wordCount = calculateWordCount(content);
      const estimatedMinutes = Math.max(1, Math.ceil(wordCount / 150));

      const { data, error } = await supabase
        .from('lessons')
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          content: content.trim(),
          language,
          difficulty_level: difficulty,
          content_type: contentType,
          word_count: wordCount,
          estimated_minutes: estimatedMinutes,
          created_by: user.id,
          is_premium: false,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Content imported successfully!');
      navigate(`/reader/${data.id}`);
    } catch (err) {
      console.error('Import error:', err);
      toast.error('Failed to import content');
    } finally {
      setSaving(false);
    }
  };

  const wordCount = calculateWordCount(content);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="container mx-auto px-4 h-14 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-serif font-bold text-lg">Import Content</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Add Your Own Content</CardTitle>
            <CardDescription>
              Paste text or upload a file to create a new lesson
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="My Spanish Article"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                placeholder="A brief description of this content"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
              />
            </div>

            {/* Content Input */}
            <Tabs defaultValue="paste" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="paste">
                  <FileText className="w-4 h-4 mr-2" />
                  Paste Text
                </TabsTrigger>
                <TabsTrigger value="upload">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload File
                </TabsTrigger>
              </TabsList>

              <TabsContent value="paste" className="mt-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="content">Content *</Label>
                    <span className="text-xs text-muted-foreground">{wordCount} words</span>
                  </div>
                  <Textarea
                    id="content"
                    placeholder="Paste your text here..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[200px] font-serif"
                  />
                </div>
              </TabsContent>

              <TabsContent value="upload" className="mt-4">
                <div 
                  className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground mb-1">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    .txt or .md files (max 1MB)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.md,text/plain,text/markdown"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
                {content && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium">File loaded: {wordCount} words</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {content.substring(0, 150)}...
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Language Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Language *</Label>
                <div className="flex gap-2">
                  <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map(lang => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.flag} {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={detectLanguage}
                    disabled={detecting || content.length < 20}
                    title="Auto-detect language"
                  >
                    {detecting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Wand2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {difficultyLevels.map(level => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Content Type */}
            <div className="space-y-2">
              <Label>Content Type</Label>
              <Select value={contentType} onValueChange={setContentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {contentTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Submit Button */}
            <Button
              className="w-full"
              size="lg"
              onClick={handleSubmit}
              disabled={saving || !title.trim() || content.trim().length < 50}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                'Import & Start Reading'
              )}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
