import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { pb } from '@/lib/pocketbase';

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
      pb.collection('profiles')
        .getFirstListItem(`user="${user.id}"`)
        .then((data) => {
          if (data) {
            if (data.target_language) setTargetLanguageState(data.target_language as Language);
            if (data.native_language) setNativeLanguageState(data.native_language);
            if (data.translation_preferences) {
              console.log('Loaded translation preferences from database:', data.translation_preferences);
              setTranslationPreferencesState(data.translation_preferences as TranslationPreferences);
            } else {
              console.log('No translation preferences found in database, using defaults');
            }
          }
        })
        .catch((error) => {
          console.log('No profile found or error:', error);
        });
    }
  }, [user]);

  const setTargetLanguage = async (lang: Language) => {
    setTargetLanguageState(lang);
    if (user) {
      try {
        const profile = await pb.collection('profiles').getFirstListItem(`user="${user.id}"`);
        await pb.collection('profiles').update(profile.id, { target_language: lang });
      } catch (error: any) {
        // If profile doesn't exist, create it
        if (error?.status === 404) {
          try {
            await pb.collection('profiles').create({
              user: user.id,
              target_language: lang,
              native_language: nativeLanguage,
              daily_lingq_goal: 20,
            });
          } catch (createError) {
            console.error('Failed to create profile:', createError);
          }
        } else {
          console.error('Failed to update target language:', error);
        }
      }
    }
  };

  const setNativeLanguage = async (lang: string) => {
    setNativeLanguageState(lang);
    if (user) {
      try {
        const profile = await pb.collection('profiles').getFirstListItem(`user="${user.id}"`);
        await pb.collection('profiles').update(profile.id, { native_language: lang });
      } catch (error: any) {
        // If profile doesn't exist, create it
        if (error?.status === 404) {
          try {
            await pb.collection('profiles').create({
              user: user.id,
              target_language: targetLanguage,
              native_language: lang,
              daily_lingq_goal: 20,
            });
          } catch (createError) {
            console.error('Failed to create profile:', createError);
          }
        } else {
          console.error('Failed to update native language:', error);
        }
      }
    }
  };

  const setTranslationLanguageForTarget = async (targetLang: Language, translationLang: string) => {
    const newPreferences = {
      ...translationPreferences,
      [targetLang]: translationLang,
    };
    
    console.log('Setting translation preference:', {
      targetLang,
      translationLang,
      newPreferences
    });
    
    setTranslationPreferencesState(newPreferences);
    
    if (user) {
      try {
        const profile = await pb.collection('profiles').getFirstListItem(`user="${user.id}"`);
        await pb.collection('profiles').update(profile.id, { translation_preferences: newPreferences });
        console.log('Translation preferences saved successfully');
      } catch (error: any) {
        // If profile doesn't exist, create it
        if (error?.status === 404) {
          try {
            await pb.collection('profiles').create({
              user: user.id,
              target_language: targetLanguage,
              native_language: nativeLanguage,
              daily_lingq_goal: 20,
              translation_preferences: newPreferences,
            });
            console.log('Profile created with translation preferences');
          } catch (createError) {
            console.error('Failed to create profile:', createError);
          }
        } else {
          console.error('Failed to save translation preferences:', error);
        }
      }
    }
  };

  const getTranslationLanguage = (targetLang: Language): string => {
    const translationLang = translationPreferences[targetLang] || 'en';
    console.log('getTranslationLanguage called:', {
      targetLang,
      translationLang,
      allPreferences: translationPreferences
    });
    return translationLang;
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
