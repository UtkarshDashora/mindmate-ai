import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { Send, Loader2, Heart } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { z } from "zod";
import { getThreadMessages } from "@/lib/threads.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/coach/$threadId")({
  validateSearch: (s: Record<string, unknown>) => z.object({ initial: z.string().optional() }).parse(s),
  component: ThreadPage,
});

function ThreadPage() {
  const { threadId } = Route.useParams();
  const { initial } = useSearch({ from: "/_authenticated/coach/$threadId" });
  const fetchMessages = useServerFn(getThreadMessages);

  const { data, isLoading } = useQuery({
    queryKey: ["thread", threadId],
    queryFn: () => fetchMessages({ data: { threadId } }),
  });

  if (isLoading) return <div className="p-8 text-muted-foreground">Loading…</div>;
  if (!data?.thread) return <div className="p-8 text-muted-foreground">Conversation not found.</div>;

  return <ChatView key={threadId} threadId={threadId} initialMessages={data.messages} initialPrompt={initial} />;
}

type Row = { id: string; role: string; content: string; parts: unknown };

function rowsToUIMessages(rows: Row[]): UIMessage[] {
  return rows
    .filter((r) => r.role === "user" || r.role === "assistant")
    .map((r) => ({
      id: r.id,
      role: r.role as "user" | "assistant",
      parts: (Array.isArray(r.parts) && r.parts.length
        ? r.parts
        : [{ type: "text", text: r.content }]) as UIMessage["parts"],
    }));
}

function ChatView({ threadId, initialMessages, initialPrompt }: { threadId: string; initialMessages: Row[]; initialPrompt?: string }) {
  const [input, setInput] = useState("");
  const sentInitial = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { threadId },
        fetch: async (url, init) => {
          const { data } = await supabase.auth.getSession();
          const headers = new Headers(init?.headers);
          if (data.session?.access_token) headers.set("Authorization", `Bearer ${data.session.access_token}`);
          return fetch(url, { ...init, headers });
        },
      }),
    [threadId],
  );

  const { messages, sendMessage, status } = useChat({
    id: threadId,
    messages: rowsToUIMessages(initialMessages),
    transport,
    onError: (e) => console.error(e),
  });

  useEffect(() => {
    if (initialPrompt && !sentInitial.current && initialMessages.length === 0) {
      sentInitial.current = true;
      sendMessage({ text: initialPrompt });
    }
  }, [initialPrompt, initialMessages.length, sendMessage]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput("");
    sendMessage({ text });
  };

  const isLoading = status === "submitted" || status === "streaming";

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-6 py-6">
        <div className="max-w-3xl mx-auto space-y-5">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-12">
              <Heart className="size-8 mx-auto mb-2 text-primary" />
              Tell me what's on your mind.
            </div>
          )}
          {messages.map((m) => {
            const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
            const isUser = m.role === "user";
            return (
              <div key={m.id} className={cn("flex", isUser ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    isUser ? "bg-primary text-primary-foreground" : "text-foreground",
                  )}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap">{text}</p>
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2">
                      <ReactMarkdown>{text}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {status === "submitted" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Thinking…
            </div>
          )}
        </div>
      </div>

      <form onSubmit={submit} className="border-t border-border bg-card/80 backdrop-blur p-3 md:p-4">
        <div className="max-w-3xl mx-auto flex gap-2 items-end">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(e as unknown as React.FormEvent); }
            }}
            placeholder="Share what you're feeling… (Enter to send, Shift+Enter for newline)"
            rows={1}
            className="resize-none min-h-[44px] max-h-40"
            autoFocus
          />
          <Button type="submit" variant="hero" size="icon" disabled={isLoading || !input.trim()} className="h-11 w-11 shrink-0">
            {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </Button>
        </div>
      </form>
    </div>
  );
}
