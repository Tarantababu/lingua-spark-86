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
    const { text, language, voice } = await req.json();
    
    if (!text || !language) {
      return new Response(
        JSON.stringify({ error: 'Text and language are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // Map language codes to voice options
    const voiceMap: Record<string, string> = {
      es: 'es-ES-Standard-A',
      fr: 'fr-FR-Standard-A',
      de: 'de-DE-Standard-A',
      it: 'it-IT-Standard-A',
      pt: 'pt-PT-Standard-A',
      en: 'en-US-Standard-A',
    };

    // For now, we'll use the AI to generate a phonetic pronunciation guide
    // Full TTS would require additional API integration
    const systemPrompt = `You are a pronunciation guide. Generate an IPA phonetic transcription for the given text in the specified language. Only respond with the IPA transcription, nothing else.`;

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
          { role: 'user', content: `Language: ${language}\nText: ${text}` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error('OpenAI API error');
    }

    const data = await response.json();
    const pronunciation = data.choices?.[0]?.message?.content?.trim() || '';

    return new Response(
      JSON.stringify({ 
        pronunciation,
        voice: voiceMap[language] || 'en-US-Standard-A',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('TTS error:', error);
    const errorMessage = error instanceof Error ? error.message : 'TTS failed';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
