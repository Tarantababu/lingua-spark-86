import React, { createContext, useState, ReactNode } from 'react';

type Language = 'es' | 'fr' | 'de' | 'zh' | 'ja' | 'ko' | 'pt' | 'ru' | 'ar' | 'en';

interface LanguageContextType {
  sourceLanguage: Language;
  targetLanguage: Language;
  setSourceLanguage: (language: Language) => void;
  setTargetLanguage: (language: Language) => void;
}

const languages: Language[] = ['es', 'fr', 'de', 'zh', 'ja', 'ko', 'pt', 'ru', 'ar', 'en'];

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sourceLanguage, setSourceLanguage] = useState<Language>('en');
  const [targetLanguage, setTargetLanguage] = useState<Language>('es');

  return (
    <LanguageContext.Provider value={{ sourceLanguage, targetLanguage, setSourceLanguage, setTargetLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = React.useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};