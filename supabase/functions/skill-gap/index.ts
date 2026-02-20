import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SYSTEM_PROMPT = `You are a senior career strategist and talent acquisition expert with 15+ years of experience.
Analyze the skill gap between the candidate's resume and the target job description.

Return a JSON object with this exact structure:
{
  "matchScore": <number 0-100>,
  "presentSkills": [{"skill": "<string>", "level": "beginner|intermediate|advanced", "relevance": "low|medium|high"}],
  "missingSkills": [{"skill": "<string>", "priority": "nice-to-have|important|critical", "timeToLearn": "<string>", "resources": ["<string>"]}],
  "transferableSkills": [<string>],
  "roadmap": [{"week": <number>, "focus": "<string>", "actions": [<string>]}],
  "summary": "<string, 3-4 sentences with actionable advice>"
}

Be specific, practical, and encouraging. Output ONLY valid JSON. No markdown. No explanation.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { resumeText, jobDescription, targetRole } = await req.json();
    if (!resumeText || !jobDescription) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Resume:\n${resumeText}\n\nTarget Role: ${targetRole || 'Not specified'}\n\nJob Description:\n${jobDescription}` },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again shortly.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (response.status === 402) return new Response(JSON.stringify({ error: 'AI credits exhausted.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      throw new Error('AI generation failed');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(cleaned);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Skill gap error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
