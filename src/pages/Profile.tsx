import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { useVocabulary } from '@/hooks/useVocabulary';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { LogOut, User, Languages, RotateCcw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Profile() {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const { targetLanguage, languages, translationPreferences, setTranslationLanguageForTarget } = useLanguage();
  const { resetLanguageProgress } = useVocabulary();
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [languageToReset, setLanguageToReset] = useState<Language | null>(null);
  const [resetting, setResetting] = useState(false);

  React.useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const currentLang = languages.find(l => l.code === targetLanguage);

  const handleTranslationLanguageChange = async (targetLang: Language, translationLang: string) => {
    await setTranslationLanguageForTarget(targetLang, translationLang);
    toast.success(`Translation language for ${languages.find(l => l.code === targetLang)?.name} updated`);
  };

  const handleResetClick = (lang: Language) => {
    setLanguageToReset(lang);
    setResetDialogOpen(true);
  };

  const handleResetConfirm = async () => {
    if (!languageToReset) return;

    setResetting(true);
    const result = await resetLanguageProgress(languageToReset);
    setResetting(false);
    setResetDialogOpen(false);

    if (result.success) {
      const langName = languages.find(l => l.code === languageToReset)?.name;
      toast.success(`All progress for ${langName} has been reset`);
    } else {
      toast.error(result.message || 'Failed to reset progress');
    }

    setLanguageToReset(null);
  };

  // Available translation languages (all languages in the app)
  const translationLanguages = languages.map(lang => ({
    code: lang.code,
    name: lang.name,
    flag: lang.flag,
  }));

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="font-serif text-2xl font-bold text-foreground mb-6">Profile</h1>
      
      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg">{user?.email}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Learning {currentLang?.flag} {currentLang?.name}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Languages className="w-5 h-5" />
            <CardTitle>Translation Settings</CardTitle>
          </div>
          <CardDescription>
            Choose your preferred translation language for each language you're learning
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {languages.map(lang => (
            <div key={lang.code} className="space-y-2">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-2xl">{lang.flag}</span>
                  <Label className="font-medium">{lang.name}</Label>
                </div>
                <Select
                  value={translationPreferences[lang.code]}
                  onValueChange={(value) => handleTranslationLanguageChange(lang.code, value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {translationLanguages.map(transLang => (
                      <SelectItem key={transLang.code} value={transLang.code}>
                        {transLang.flag} {transLang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-destructive hover:text-destructive"
                onClick={() => handleResetClick(lang.code)}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset Progress for {lang.name}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Button variant="destructive" onClick={handleSignOut} className="w-full">
        <LogOut className="w-4 h-4 mr-2" />
        Sign Out
      </Button>

      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Progress for {languages.find(l => l.code === languageToReset)?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>All vocabulary words and phrases</li>
                <li>All progress tracking data</li>
                <li>All reading session history</li>
              </ul>
              <p className="mt-2 font-semibold">Your lessons will not be deleted. This action cannot be undone.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resetting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetConfirm}
              disabled={resetting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {resetting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Resetting...
                </>
              ) : (
                'Reset Progress'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
