import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SYSTEM_PROMPT = `You are a professional resume writer with 15+ years of experience crafting ATS-optimized, impactful resumes.

Given the user's background information, generate a complete, polished resume in clean plain text format.

Rules:
- Use strong action verbs
- Include measurable achievements (numbers, percentages, results)
- Format with clear sections: Summary, Experience, Skills, Education, (Certifications if applicable)
- Make it ATS-friendly with relevant keywords
- Keep it concise but impactful (1-2 pages worth)
- Tailor to the target role if provided
- Do NOT use markdown symbols like **, ##, or bullets with *. Use plain text with clear spacing and section headers in ALL CAPS.

Output ONLY the resume text. No explanations.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { name, email, phone, location, targetRole, experience, education, skills, certifications } = await req.json();
    if (!name || !experience) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const userPrompt = `Generate a professional resume for:
Name: ${name}
Email: ${email || 'N/A'}
Phone: ${phone || 'N/A'}
Location: ${location || 'N/A'}
Target Role: ${targetRole || 'Not specified'}

Work Experience:
${experience}

Education:
${education || 'Not provided'}

Skills:
${skills || 'Not provided'}

Certifications:
${certifications || 'None'}

Generate the complete resume now.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again shortly.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (response.status === 402) return new Response(JSON.stringify({ error: 'AI credits exhausted.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      throw new Error('AI generation failed');
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (e) {
    console.error('Resume generator error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
