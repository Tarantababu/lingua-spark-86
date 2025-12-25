import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Library, BookOpen, Languages, BarChart3, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: Library, label: 'Library' },
  { to: '/vocabulary', icon: Languages, label: 'Vocabulary' },
  { to: '/review', icon: BookOpen, label: 'Review' },
  { to: '/stats', icon: BarChart3, label: 'Stats' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-around h-16">
          {navItems.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to || 
              (to !== '/' && location.pathname.startsWith(to));

            return (
              <NavLink
                key={to}
                to={to}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}



import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Library, BookOpen, Languages, BarChart3, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSRS } from '@/hooks/useSRS';
import { pb } from '@/lib/pocketbase';

const navItems = [
  { to: '/', icon: Library, label: 'Library' },
  { to: '/vocabulary', icon: Languages, label: 'Vocabulary' },
  { to: '/review', icon: BookOpen, label: 'Review' },
  { to: '/stats', icon: BarChart3, label: 'Stats' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();
  const { targetLanguage } = useLanguage();
  const { getDueCards, getNewCards } = useSRS();
  const [reviewCount, setReviewCount] = useState(0);

  const fetchReviewCount = useCallback(async () => {
    if (!user || !targetLanguage) {
      setReviewCount(0);
      return;
    }

    try {
      const dueCards = await getDueCards(user.id, targetLanguage);
      const newCards = await getNewCards(user.id, targetLanguage, 10);
      const total = dueCards.length + newCards.length;
      setReviewCount(total);
    } catch (error) {
      console.error('Error fetching review count:', error);
      setReviewCount(0);
    }
  }, [user, targetLanguage, getDueCards, getNewCards]);

  useEffect(() => {
    fetchReviewCount();
  }, [fetchReviewCount]);

  useEffect(() => {
    if (!user || !targetLanguage) return;

    pb.collection('vocabulary').subscribe('*', (e) => {
      const record = e.record as any;
      const normalizedLang = (record.language || '').toLowerCase().trim();
      const normalizedTarget = (targetLanguage || '').toLowerCase().trim();
      
      if (record.user === user.id && normalizedLang === normalizedTarget) {
        fetchReviewCount();
      }
    });

    return () => {
      pb.collection('vocabulary').unsubscribe('*');
    };
  }, [user, targetLanguage, fetchReviewCount]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-around h-16">
          {navItems.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to || 
              (to !== '/' && location.pathname.startsWith(to));
            const showBadge = to === '/review' && reviewCount > 0;

            return (
              <NavLink
                key={to}
                to={to}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors relative',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {showBadge && (
                    <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center min-w-[16px] px-0.5">
                      {reviewCount > 99 ? '99+' : reviewCount}
                    </span>
                  )}
                </div>
                <span className="text-xs font-medium">{label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}



import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Library, BookOpen, Languages, BarChart3, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSRS } from '@/hooks/useSRS';
import { pb } from '@/lib/pocketbase';

const navItems = [
  { to: '/', icon: Library, label: 'Library' },
  { to: '/vocabulary', icon: Languages, label: 'Vocabulary' },
  { to: '/review', icon: BookOpen, label: 'Review' },
  { to: '/stats', icon: BarChart3, label: 'Stats' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();
  const { targetLanguage } = useLanguage();
  const { getDueCards, getNewCards } = useSRS();
  const [reviewCount, setReviewCount] = useState(0);

  const fetchReviewCount = useCallback(async () => {
    if (!user || !targetLanguage) {
      setReviewCount(0);
      return;
    }

    try {
      const dueCards = await getDueCards(user.id, targetLanguage);
      const newCards = await getNewCards(user.id, targetLanguage, 10);
      const total = dueCards.length + newCards.length;
      setReviewCount(total);
    } catch (error) {
      console.error('Error fetching review count:', error);
      setReviewCount(0);
    }
  }, [user, targetLanguage, getDueCards, getNewCards]);

  useEffect(() => {
    fetchReviewCount();
  }, [fetchReviewCount]);

  useEffect(() => {
    if (!user || !targetLanguage) return;

    pb.collection('vocabulary').subscribe('*', (e) => {
      const record = e.record as any;
      const normalizedLang = (record.language || '').toLowerCase().trim();
      const normalizedTarget = (targetLanguage || '').toLowerCase().trim();
      
      if (record.user === user.id && normalizedLang === normalizedTarget) {
        fetchReviewCount();
      }
    });

    return () => {
      pb.collection('vocabulary').unsubscribe('*');
    };
  }, [user, targetLanguage, fetchReviewCount]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t border-border z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center h-14">
          {navItems.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to || 
              (to !== '/' && location.pathname.startsWith(to));
            const showBadge = to === '/review' && reviewCount > 0;

            return (
              <NavLink
                key={to}
                to={to}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-1.5 rounded-md transition-colors relative',
                  isActive
                    ? 'text-foreground bg-muted'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {showBadge && (
                    <span className="absolute -top-0.5 -right-0.5 bg-foreground text-background text-[10px] font-semibold rounded-full h-4 w-4 flex items-center justify-center min-w-[16px] px-0.5">
                      {reviewCount > 99 ? '99+' : reviewCount}
                    </span>
                  )}
                </div>
                <span className="text-xs font-medium">{label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}


import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Library, BookOpen, Languages, BarChart3, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSRS } from '@/hooks/useSRS';
import { pb } from '@/lib/pocketbase';

const navItems = [
  { to: '/', icon: Library, label: 'Library' },
  { to: '/vocabulary', icon: Languages, label: 'Vocabulary' },
  { to: '/review', icon: BookOpen, label: 'Review' },
  { to: '/stats', icon: BarChart3, label: 'Stats' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();
  const { targetLanguage } = useLanguage();
  const { getDueCards, getNewCards } = useSRS();
  const [reviewCount, setReviewCount] = useState(0);

  const fetchReviewCount = useCallback(async () => {
    if (!user || !targetLanguage) {
      setReviewCount(0);
      return;
    }

    try {
      const dueCards = await getDueCards(user.id, targetLanguage);
      const newCards = await getNewCards(user.id, targetLanguage, 10);
      const total = dueCards.length + newCards.length;
      setReviewCount(total);
    } catch (error) {
      console.error('Error fetching review count:', error);
      setReviewCount(0);
    }
  }, [user, targetLanguage, getDueCards, getNewCards]);

  useEffect(() => {
    fetchReviewCount();
  }, [fetchReviewCount]);

  useEffect(() => {
    if (!user || !targetLanguage) return;

    pb.collection('vocabulary').subscribe('*', (e) => {
      const record = e.record as any;
      const normalizedLang = (record.language || '').toLowerCase().trim();
      const normalizedTarget = (targetLanguage || '').toLowerCase().trim();
      
      if (record.user === user.id && normalizedLang === normalizedTarget) {
        fetchReviewCount();
      }
    });

    return () => {
      pb.collection('vocabulary').unsubscribe('*');
    };
  }, [user, targetLanguage, fetchReviewCount]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t border-border z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center h-14">
          {navItems.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to || 
              (to !== '/' && location.pathname.startsWith(to));
            const showBadge = to === '/review' && reviewCount > 0;

            return (
              <NavLink
                key={to}
                to={to}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-1.5 rounded-md transition-colors relative',
                  isActive
                    ? 'text-foreground bg-muted'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {showBadge && (
                    <span className="absolute -top-0.5 -right-0.5 bg-foreground text-background text-[10px] font-semibold rounded-full h-4 w-4 flex items-center justify-center min-w-[16px] px-0.5">
                      {reviewCount > 99 ? '99+' : reviewCount}
                    </span>
                  )}
                </div>
                <span className="text-xs font-medium">{label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

