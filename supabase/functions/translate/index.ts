import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { word, targetLanguage, nativeLanguage } = await req.json();
    
    if (!word || !targetLanguage) {
      return new Response(
        JSON.stringify({ error: 'Word and target language are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const languageNames: Record<string, string> = {
      es: 'Spanish',
      fr: 'French',
      de: 'German',
      it: 'Italian',
      pt: 'Portuguese',
      en: 'English',
      tr: 'Turkish',
    };

    const targetLangName = languageNames[targetLanguage] || targetLanguage;
    const nativeLangName = languageNames[nativeLanguage || 'en'] || 'English';

    const systemPrompt = `You are a language learning assistant. Provide translations and definitions for words/phrases.

CRITICAL: You MUST translate to ${nativeLangName}. The translation, definition, and all explanatory text MUST be in ${nativeLangName}.

Always respond in this exact JSON format:
{
  "translation": "the translation in ${nativeLangName}",
  "definition": "a brief definition or explanation in ${nativeLangName}",
  "examples": ["example sentence 1 in ${targetLangName}", "example sentence 2 in ${targetLangName}"],
  "pronunciation": "phonetic pronunciation guide"
}

IMPORTANT: 
- The "translation" field MUST be in ${nativeLangName}
- The "definition" field MUST be in ${nativeLangName}
- The "examples" should be in ${targetLangName}
- If translating to Turkish, use proper Turkish characters (ç, ğ, ı, ö, ş, ü)

Be concise but helpful. Focus on the most common meaning first.`;

    const userPrompt = `Translate and define this ${targetLangName} word/phrase: "${word}"`;

    console.log(`Translating: "${word}" from ${targetLangName} to ${nativeLangName}`);
    console.log(`Target language code: ${targetLanguage}, Native language code: ${nativeLanguage}`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error('OpenAI API error');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    console.log(`Raw AI response for "${word}":`, content);

    // Parse the JSON from the AI response
    let parsedContent;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                       content.match(/```\s*([\s\S]*?)\s*```/) ||
                       [null, content];
      parsedContent = JSON.parse(jsonMatch[1] || content);
    } catch (e) {
      console.error('Failed to parse AI response:', content);
      // Fallback: use the raw content as translation
      parsedContent = {
        translation: content.trim(),
        definition: null,
        examples: [],
        pronunciation: null,
      };
    }

    console.log(`Parsed translation result for "${word}" (${targetLangName} → ${nativeLangName}):`, parsedContent);

    return new Response(
      JSON.stringify(parsedContent),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Translation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Translation failed';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
