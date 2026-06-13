import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const CheckinInput = z.object({
  mood: z.number().int().min(1).max(10),
  stress: z.number().int().min(1).max(10),
  energy: z.number().int().min(1).max(10),
  sleep_hours: z.number().min(0).max(24),
  study_hours: z.number().min(0).max(24),
  journal: z.string().max(8000).default(""),
});

const SYSTEM_PROMPT = `You are MindMate AI, a supportive mental wellness companion for students preparing for competitive exams (NEET, JEE, UPSC, CAT, GATE, CUET). You analyze a student's daily check-in and return STRICT JSON. Never diagnose medical conditions. Be warm, encouraging, practical. If you detect signs of self-harm or suicidal intent, set safety_alert=true and gently encourage reaching out to a trusted person or helpline.`;

const ANALYSIS_SCHEMA_HINT = `Return JSON with exactly this shape:
{
  "emotions": string[] (3-5 emotions detected),
  "stress_level": number (1-10),
  "motivation": number (1-10),
  "confidence": number (1-10),
  "burnout_risk": "Low" | "Medium" | "High",
  "triggers": string[] (2-5 hidden stress triggers like "Fear of Failure", "Peer Comparison"),
  "wellness_score": number (0-100, holistic mental wellness),
  "summary": string (2-3 sentences, empathetic emotional summary),
  "encouragement": string (1-2 personalized warm sentences),
  "recommendations": [{ "title": string, "description": string, "category": string }] (3-5 items),
  "mindfulness_exercise": { "title": string, "duration_minutes": number, "steps": string[] },
  "safety_alert": boolean
}`;

export const submitCheckin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => CheckinInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: checkin, error: cErr } = await supabase
      .from("daily_checkins")
      .insert({ user_id: userId, ...data })
      .select()
      .single();
    if (cErr || !checkin) throw new Error(cErr?.message ?? "Failed to save check-in");

    const { createLovableAiGatewayProvider, getGatewayKey } = await import("./ai-gateway.server");
    const { generateText } = await import("ai");
    const gateway = createLovableAiGatewayProvider(getGatewayKey());

    const userPrompt = `Student check-in:
- Mood (1-10): ${data.mood}
- Stress (1-10): ${data.stress}
- Energy (1-10): ${data.energy}
- Sleep hours: ${data.sleep_hours}
- Study hours: ${data.study_hours}
- Journal entry: """${data.journal || "(no journal text)"}"""

${ANALYSIS_SCHEMA_HINT}

Respond with ONLY valid JSON, no markdown fences.`;

    let parsed: Record<string, unknown> = {};
    try {
      const { text } = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        system: SYSTEM_PROMPT,
        prompt: userPrompt,
      });
      const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "").trim();
      parsed = JSON.parse(cleaned);
    } catch (e) {
      // Fallback heuristic
      const score = Math.max(0, Math.min(100, Math.round((data.mood + data.energy + (11 - data.stress)) * (100 / 30))));
      parsed = {
        emotions: ["mixed feelings"],
        stress_level: data.stress,
        motivation: data.mood,
        confidence: Math.max(1, data.mood - 1),
        burnout_risk: data.stress >= 8 ? "High" : data.stress >= 6 ? "Medium" : "Low",
        triggers: [],
        wellness_score: score,
        summary: "Thanks for checking in today. We saved your entry and will keep tracking your trends.",
        encouragement: "One step at a time — you're doing the work, and that matters.",
        recommendations: [
          { title: "Take a 5-minute walk", description: "Move your body to reset your mind.", category: "Wellness" },
          { title: "Box breathing", description: "Inhale 4s, hold 4s, exhale 4s, hold 4s. Repeat 4 rounds.", category: "Calm" },
        ],
        mindfulness_exercise: { title: "Quick reset", duration_minutes: 5, steps: ["Sit comfortably", "Breathe slowly for 5 minutes", "Notice 3 things you can hear"] },
        safety_alert: false,
      };
      console.error("AI analysis fallback", e);
    }

    const { data: analysis, error: aErr } = await supabase
      .from("ai_analysis")
      .insert({
        checkin_id: checkin.id,
        user_id: userId,
        emotions: (parsed.emotions as string[]) ?? [],
        stress_level: (parsed.stress_level as number) ?? data.stress,
        motivation: (parsed.motivation as number) ?? null,
        confidence: (parsed.confidence as number) ?? null,
        burnout_risk: (parsed.burnout_risk as string) ?? null,
        triggers: (parsed.triggers as string[]) ?? [],
        wellness_score: (parsed.wellness_score as number) ?? null,
        summary: (parsed.summary as string) ?? null,
        encouragement: (parsed.encouragement as string) ?? null,
        recommendations: parsed.recommendations ?? [],
        mindfulness_exercise: parsed.mindfulness_exercise ?? null,
        safety_alert: Boolean(parsed.safety_alert),
      })
      .select()
      .single();
    if (aErr) throw new Error(aErr.message);

    return { checkin, analysis };
  });

export const getDashboardData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: checkins }, { data: analyses }, { data: profile }] = await Promise.all([
      supabase.from("daily_checkins").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(30),
      supabase.from("ai_analysis").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(30),
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    ]);
    return {
      checkins: checkins ?? [],
      analyses: analyses ?? [],
      profile: profile ?? null,
    };
  });

export const getAnalysisById = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: analysis, error } = await context.supabase
      .from("ai_analysis")
      .select("*, daily_checkins(*)")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .single();
    if (error) throw new Error(error.message);
    return analysis;
  });
