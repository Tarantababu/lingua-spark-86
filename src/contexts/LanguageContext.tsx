import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

export type Language = 'es' | 'fr' | 'de' | 'it' | 'pt';

interface LanguageContextType {
  targetLanguage: Language;
  setTargetLanguage: (lang: Language) => void;
  nativeLanguage: string;
  setNativeLanguage: (lang: string) => void;
  languages: { code: Language; name: string; flag: string }[];
}

const languages = [
  { code: 'es' as Language, name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr' as Language, name: 'French', flag: '🇫🇷' },
  { code: 'de' as Language, name: 'German', flag: '🇩🇪' },
  { code: 'it' as Language, name: 'Italian', flag: '🇮🇹' },
  { code: 'pt' as Language, name: 'Portuguese', flag: '🇵🇹' },
];

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [targetLanguage, setTargetLanguageState] = useState<Language>('es');
  const [nativeLanguage, setNativeLanguageState] = useState('en');

  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('target_language, native_language')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            if (data.target_language) setTargetLanguageState(data.target_language as Language);
            if (data.native_language) setNativeLanguageState(data.native_language);
          }
        });
    }
  }, [user]);

  const setTargetLanguage = async (lang: Language) => {
    setTargetLanguageState(lang);
    if (user) {
      await supabase
        .from('profiles')
        .update({ target_language: lang })
        .eq('user_id', user.id);
    }
  };

  const setNativeLanguage = async (lang: string) => {
    setNativeLanguageState(lang);
    if (user) {
      await supabase
        .from('profiles')
        .update({ native_language: lang })
        .eq('user_id', user.id);
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        targetLanguage,
        setTargetLanguage,
        nativeLanguage,
        setNativeLanguage,
        languages,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
