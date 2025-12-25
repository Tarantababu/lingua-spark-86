// OpenAI API wrappers to replace Supabase Edge Functions

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

interface TranslationResult {
  translation: string;
  definition?: string;
  examples?: string[];
  pronunciation?: string;
}

export async function translateWord(
  word: string,
  targetLanguage: string,
  nativeLanguage: string
): Promise<TranslationResult> {
  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a language learning assistant. Translate words and phrases from ${targetLanguage} to ${nativeLanguage}. Provide: 1) translation, 2) brief definition, 3) 2-3 example sentences in ${targetLanguage} with ${nativeLanguage} translations. Format as JSON.`
          },
          {
            role: 'user',
            content: `Translate "${word}" from ${targetLanguage} to ${nativeLanguage}. Return JSON with: translation, definition, examples (array of objects with 'sentence' and 'translation' keys)`
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Strip markdown code blocks if present
    let cleanContent = content.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    // Try to parse JSON response
    try {
      const parsed = JSON.parse(cleanContent);
      return {
        translation: parsed.translation || word,
        definition: parsed.definition,
        examples: parsed.examples?.map((ex: any) => `${ex.sentence} - ${ex.translation}`) || [],
      };
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Content:', cleanContent);
      // Fallback: extract translation from text
      return {
        translation: cleanContent.split('\n')[0] || word,
        definition: cleanContent,
        examples: [],
      };
    }
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
}

interface LanguageDetectionResult {
  language: string;
  languageName: string;
  confidence: number;
}

const languageNames: Record<string, string> = {
  'en': 'English',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
  'pt': 'Portuguese',
  'ru': 'Russian',
  'ja': 'Japanese',
  'ko': 'Korean',
  'zh': 'Chinese',
  'ar': 'Arabic',
  'hi': 'Hindi',
};

export async function detectLanguage(text: string): Promise<LanguageDetectionResult> {
  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Detect the language of the given text. Respond with only the ISO 639-1 language code (2 letters, lowercase).'
          },
          {
            role: 'user',
            content: text.substring(0, 200) // First 200 chars should be enough
          }
        ],
        temperature: 0,
        max_tokens: 10,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const langCode = data.choices[0]?.message?.content?.trim().toLowerCase();
    
    return {
      language: langCode || 'en',
      languageName: languageNames[langCode || 'en'] || 'Unknown',
      confidence: 0.95, // OpenAI doesn't provide confidence, so we assume high confidence
    };
  } catch (error) {
    console.error('Language detection error:', error);
    return {
      language: 'en',
      languageName: 'English',
      confidence: 0.5,
    };
  }
}

export async function generateLessonAudio(text: string): Promise<Blob> {
  try {
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        voice: 'alloy',
        input: text.substring(0, 4096), // TTS has a limit
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI TTS API error: ${response.statusText}`);
    }

    return await response.blob();
  } catch (error) {
    console.error('Audio generation error:', error);
    throw error;
  }
}
