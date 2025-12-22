import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, User } from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const { targetLanguage, languages } = useLanguage();

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

      <Button variant="destructive" onClick={handleSignOut} className="w-full">
        <LogOut className="w-4 h-4 mr-2" />
        Sign Out
      </Button>
    </div>
  );
}
