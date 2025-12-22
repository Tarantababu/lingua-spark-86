import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Flame, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TopHeader() {
  const { user } = useAuth();
  const { targetLanguage, setTargetLanguage, languages } = useLanguage();

  const currentLanguage = languages.find(l => l.code === targetLanguage);

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">L</span>
          </div>
          <span className="font-serif font-bold text-xl text-foreground">LinguaFlow</span>
        </Link>

        <div className="flex items-center gap-3">
          {user && (
            <>
              {/* Streak Badge */}
              <div className="streak-badge">
                <Flame className="w-4 h-4" />
                <span>0</span>
              </div>

              {/* Language Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1">
                    <span className="text-lg">{currentLanguage?.flag}</span>
                    <span className="hidden sm:inline">{currentLanguage?.name}</span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {languages.map(lang => (
                    <DropdownMenuItem
                      key={lang.code}
                      onClick={() => setTargetLanguage(lang.code)}
                      className={targetLanguage === lang.code ? 'bg-accent' : ''}
                    >
                      <span className="mr-2">{lang.flag}</span>
                      {lang.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
