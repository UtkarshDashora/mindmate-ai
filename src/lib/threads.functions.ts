import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const listThreads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("chat_threads")
      .select("*")
      .eq("user_id", context.userId)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ title: z.string().max(120).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("chat_threads")
      .insert({ user_id: context.userId, title: data.title ?? "New conversation" })
      .select()
      .single();
    if (error || !row) throw new Error(error?.message ?? "Failed to create thread");
    return row;
  });

export const deleteThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("chat_threads")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const renameThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), title: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("chat_threads")
      .update({ title: data.title, updated_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getThreadMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ threadId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: thread, error: tErr } = await context.supabase
      .from("chat_threads")
      .select("*")
      .eq("id", data.threadId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (tErr) throw new Error(tErr.message);
    if (!thread) return { thread: null, messages: [] };

    const { data: messages, error } = await context.supabase
      .from("chat_messages")
      .select("*")
      .eq("thread_id", data.threadId)
      .eq("user_id", context.userId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return { thread, messages: messages ?? [] };
  });
