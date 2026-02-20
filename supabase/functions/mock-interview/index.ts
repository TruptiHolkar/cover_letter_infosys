import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const callAI = async (apiKey: string, messages: { role: string; content: string }[]) => {
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages,
    }),
  });

  if (!response.ok) {
    if (response.status === 429) throw new Error('Rate limit exceeded. Please try again shortly.');
    if (response.status === 402) throw new Error('AI credits exhausted.');
    const text = await response.text();
    throw new Error(`AI error: ${text}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content as string ?? '';
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { mode } = body;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    // ── Mode 1: Generate 10 interview questions ──
    if (mode === 'generate_questions') {
      const { domain, skills, interviewType, resumeText } = body;

      const prompt = `You are an expert interviewer. Generate exactly 10 interview questions for the following context:

Domain: ${domain}
Interview Type: ${interviewType}
Key Skills: ${skills || 'Not specified'}
Resume Summary: ${resumeText ? resumeText.substring(0, 800) : 'Not provided'}

Requirements:
- Questions should be specific, relevant, and progressively challenging
- Mix behavioral, situational, and technical questions as appropriate for the interview type
- Each question should be concise but thought-provoking
- For technical roles, include at least 3 technical/problem-solving questions

Return ONLY a valid JSON object with this exact format, no markdown, no extra text:
{"questions": ["question 1", "question 2", "question 3", "question 4", "question 5", "question 6", "question 7", "question 8", "question 9", "question 10"]}`;

      const content = await callAI(LOVABLE_API_KEY, [
        { role: 'user', content: prompt }
      ]);

      // Strip markdown code blocks if present
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      let parsed: { questions: string[] };
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        // Fallback: try to extract JSON from response
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (!match) throw new Error('Failed to parse questions from AI response');
        parsed = JSON.parse(match[0]);
      }

      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Mode 2: Evaluate a single answer ──
    if (mode === 'evaluate_answer') {
      const { question, answer, domain, interviewType } = body;

      const prompt = `You are an expert interviewer evaluating a candidate's answer.

Domain: ${domain}
Interview Type: ${interviewType}
Question: ${question}
Candidate's Answer: ${answer}

Evaluate the answer using the STAR method (Situation, Task, Action, Result) where applicable.
Provide:
1. A score from 0 to 100 (integer)
2. Concise, specific feedback (2-3 sentences max) highlighting strengths and areas for improvement

Return ONLY a valid JSON object with this exact format, no markdown, no extra text:
{"score": 75, "feedback": "Your feedback here."}`;

      const content = await callAI(LOVABLE_API_KEY, [
        { role: 'user', content: prompt }
      ]);

      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      let parsed: { score: number; feedback: string };
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (!match) throw new Error('Failed to parse evaluation from AI response');
        parsed = JSON.parse(match[0]);
      }

      // Ensure score is in valid range
      parsed.score = Math.max(0, Math.min(100, Math.round(parsed.score)));

      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error(`Unknown mode: ${mode}`);

  } catch (e) {
    console.error('Mock interview error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
