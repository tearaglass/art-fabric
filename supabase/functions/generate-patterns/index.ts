import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { prompt, bpm } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are a Strudel/TidalCycles pattern generator for a 4-track DAW.
Generate EXACTLY 4 complementary musical patterns based on the user's description.
Use Strudel mini-notation syntax only.

Available sounds:
- Drums: bd (kick), sn (snare), hh (hihat), cp (clap), oh (open hihat), ch (closed hihat)
- Notes: c2, d2, e2, f2, g2, a2, b2 (bass) | c4, d4, e4, f4, g4, a4, b4 (melody)
- Rest: ~ (silence)

Rules:
- Each pattern should be 8-16 beats
- Track 1: Drums (rhythmic foundation)
- Track 2: Bass (low notes, c2-b2 range)
- Track 3: Melody (higher notes, c4-b4 range)
- Track 4: FX/Percussion (hi-hats, effects)
- Use ~ for rests to create groove
- Make patterns complementary, not repetitive

Output ONLY a JSON array of 4 strings, nothing else:
["bd ~ sn ~", "c2 ~ e2 g2", "c4 e4 g4 ~", "~ hh ~ hh"]`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate 4 patterns for: ${prompt} (BPM: ${bpm})` }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    console.log('AI response:', aiResponse);

    // Parse the JSON array from AI response
    let tracks: string[];
    try {
      tracks = JSON.parse(aiResponse);
      if (!Array.isArray(tracks) || tracks.length !== 4) {
        throw new Error('Invalid response format');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      // Fallback to default patterns
      tracks = [
        'bd ~ sn ~',
        'c2 ~ e2 ~',
        'c4 e4 g4 ~',
        '~ hh ~ hh'
      ];
    }

    return new Response(
      JSON.stringify({ tracks }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-patterns:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
