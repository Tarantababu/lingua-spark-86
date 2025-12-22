import { useState, useCallback, useRef } from 'react';

interface UseTextToSpeechOptions {
  language?: string;
  rate?: number;
  pitch?: number;
}

export function useTextToSpeech(options: UseTextToSpeechOptions = {}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback((text: string, lang?: string) => {
    if (!('speechSynthesis' in window)) {
      console.warn('Text-to-speech not supported in this browser');
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang || options.language || 'en-US';
    utterance.rate = options.rate || 0.9;
    utterance.pitch = options.pitch || 1;

    // Map common language codes to speech synthesis language codes
    const langMap: Record<string, string> = {
      es: 'es-ES',
      fr: 'fr-FR',
      de: 'de-DE',
      it: 'it-IT',
      pt: 'pt-PT',
      en: 'en-US',
      ja: 'ja-JP',
      ko: 'ko-KR',
      zh: 'zh-CN',
      ru: 'ru-RU',
      ar: 'ar-SA',
      nl: 'nl-NL',
      pl: 'pl-PL',
      sv: 'sv-SE',
      tr: 'tr-TR',
    };

    const mappedLang = lang ? langMap[lang.toLowerCase()] || lang : utterance.lang;
    utterance.lang = mappedLang;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [options.language, options.rate, options.pitch]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return { speak, stop, isSpeaking };
}
