import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createClient } from "@supabase/supabase-js";
import { createLovableAiGatewayProvider, getGatewayKey } from "@/lib/ai-gateway.server";

const COACH_SYSTEM = `You are MindMate AI, a warm, supportive mental wellness coach for students preparing for competitive exams (NEET, JEE, UPSC, CAT, GATE, CUET).

Your role:
- Listen with empathy, validate feelings, and offer practical, science-backed coping strategies.
- Suggest study-life balance tips, focus techniques, sleep and breathing exercises, and motivation reframes.
- Keep responses concise, kind, and actionable. Use markdown formatting with short paragraphs and bullet points.

Boundaries:
- You are NOT a therapist or doctor. Never diagnose mental health conditions or recommend medication.
- If the user expresses self-harm, suicidal thoughts, or being in crisis: gently encourage them to reach out to a trusted person, a mental health professional, or a local helpline (e.g. iCall +91 9152987821 in India, or their local emergency number). Prioritize their safety above all else.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
          return new Response("Unauthorized", { status: 401 });
        }
        const token = authHeader.slice(7);

        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_PUBLISHABLE_KEY!,
          {
            global: { headers: { Authorization: `Bearer ${token}` } },
            auth: { persistSession: false, autoRefreshToken: false },
          },
        );
        const { data: userData, error: uErr } = await supabase.auth.getUser(token);
        if (uErr || !userData.user) return new Response("Unauthorized", { status: 401 });
        const userId = userData.user.id;

        const body = (await request.json()) as { messages?: UIMessage[]; threadId?: string };
        const messages = body.messages;
        const threadId = body.threadId;
        if (!Array.isArray(messages) || !threadId) {
          return new Response("Invalid body", { status: 400 });
        }

        // verify thread belongs to user
        const { data: thread } = await supabase
          .from("chat_threads")
          .select("id")
          .eq("id", threadId)
          .eq("user_id", userId)
          .maybeSingle();
        if (!thread) return new Response("Thread not found", { status: 404 });

        const gateway = createLovableAiGatewayProvider(getGatewayKey());
        const result = streamText({
          model: gateway("google/gemini-3-flash-preview"),
          system: COACH_SYSTEM,
          messages: await convertToModelMessages(messages),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages,
          onFinish: async ({ messages: finalMessages }) => {
            try {
              const lastUser = [...messages].reverse().find((m) => m.role === "user");
              const lastAssistant = [...finalMessages].reverse().find((m) => m.role === "assistant");
              const rows: Array<{
                thread_id: string;
                user_id: string;
                role: string;
                content: string;
                parts: unknown;
              }> = [];
              if (lastUser) {
                const text = lastUser.parts
                  .map((p) => (p.type === "text" ? p.text : ""))
                  .join("");
                rows.push({
                  thread_id: threadId,
                  user_id: userId,
                  role: "user",
                  content: text,
                  parts: lastUser.parts,
                });
              }
              if (lastAssistant) {
                const text = lastAssistant.parts
                  .map((p) => (p.type === "text" ? p.text : ""))
                  .join("");
                rows.push({
                  thread_id: threadId,
                  user_id: userId,
                  role: "assistant",
                  content: text,
                  parts: lastAssistant.parts,
                });
              }
              if (rows.length) {
                await supabase.from("chat_messages").insert(rows);
                await supabase
                  .from("chat_threads")
                  .update({ updated_at: new Date().toISOString() })
                  .eq("id", threadId);
              }
            } catch (err) {
              console.error("persist chat failed", err);
            }
          },
        });
      },
    },
  },
});
