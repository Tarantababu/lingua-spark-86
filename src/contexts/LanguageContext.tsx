import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

export type Language = 'es' | 'fr' | 'de' | 'it' | 'pt' | 'en' | 'tr';

type TranslationPreferences = {
  [key in Language]: string;
};

interface LanguageContextType {
  targetLanguage: Language;
  setTargetLanguage: (lang: Language) => void;
  nativeLanguage: string;
  setNativeLanguage: (lang: string) => void;
  translationPreferences: TranslationPreferences;
  setTranslationLanguageForTarget: (targetLang: Language, translationLang: string) => Promise<void>;
  getTranslationLanguage: (targetLang: Language) => string;
  languages: { code: Language; name: string; flag: string }[];
}

const languages = [
  { code: 'es' as Language, name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr' as Language, name: 'French', flag: '🇫🇷' },
  { code: 'de' as Language, name: 'German', flag: '🇩🇪' },
  { code: 'it' as Language, name: 'Italian', flag: '🇮🇹' },
  { code: 'pt' as Language, name: 'Portuguese', flag: '🇵🇹' },
  { code: 'en' as Language, name: 'English', flag: '🇬🇧' },
  { code: 'tr' as Language, name: 'Turkish', flag: '🇹🇷' },
];

const defaultTranslationPreferences: TranslationPreferences = {
  es: 'en',
  fr: 'en',
  de: 'en',
  it: 'en',
  pt: 'en',
  en: 'en',
  tr: 'en',
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [targetLanguage, setTargetLanguageState] = useState<Language>('es');
  const [nativeLanguage, setNativeLanguageState] = useState('en');
  const [translationPreferences, setTranslationPreferencesState] = useState<TranslationPreferences>(defaultTranslationPreferences);

  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('target_language, native_language, translation_preferences')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            if (data.target_language) setTargetLanguageState(data.target_language as Language);
            if (data.native_language) setNativeLanguageState(data.native_language);
            if (data.translation_preferences) {
              setTranslationPreferencesState(data.translation_preferences as TranslationPreferences);
            }
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

  const setTranslationLanguageForTarget = async (targetLang: Language, translationLang: string) => {
    const newPreferences = {
      ...translationPreferences,
      [targetLang]: translationLang,
    };
    
    setTranslationPreferencesState(newPreferences);
    
    if (user) {
      await supabase
        .from('profiles')
        .update({ translation_preferences: newPreferences })
        .eq('user_id', user.id);
    }
  };

  const getTranslationLanguage = (targetLang: Language): string => {
    return translationPreferences[targetLang] || 'en';
  };

  return (
    <LanguageContext.Provider
      value={{
        targetLanguage,
        setTargetLanguage,
        nativeLanguage,
        setNativeLanguage,
        translationPreferences,
        setTranslationLanguageForTarget,
        getTranslationLanguage,
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
