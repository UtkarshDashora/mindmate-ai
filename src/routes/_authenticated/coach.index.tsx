import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Sparkles } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { createThread } from "@/lib/threads.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/coach/")({
  component: CoachIndex,
});

const STARTERS = [
  "I'm feeling anxious about my exam.",
  "I can't focus today.",
  "I feel behind everyone.",
  "Help me build a calmer study routine.",
];

function CoachIndex() {
  const create = useServerFn(createThread);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: (title?: string) => create({ data: { title } }),
    onSuccess: (t, title) => {
      qc.invalidateQueries({ queryKey: ["threads"] });
      navigate({ to: "/coach/$threadId", params: { threadId: t.id }, search: { initial: title } as never });
    },
  });

  return (
    <div className="h-full grid place-items-center p-8">
      <div className="max-w-xl text-center">
        <div className="size-14 rounded-2xl bg-gradient-hero shadow-glow grid place-items-center mx-auto mb-4">
          <Sparkles className="size-6 text-white" />
        </div>
        <h1 className="font-display text-3xl font-bold">Your AI Wellness Coach</h1>
        <p className="text-muted-foreground mt-2">A supportive companion. Not a therapist. Always here.</p>
        <Button variant="hero" className="mt-6" onClick={() => mut.mutate(undefined)} disabled={mut.isPending}>
          <Plus className="size-4" /> Start a conversation
        </Button>
        <div className="mt-8 grid sm:grid-cols-2 gap-3 text-left">
          {STARTERS.map((s) => (
            <button
              key={s}
              onClick={() => mut.mutate(s)}
              disabled={mut.isPending}
              className="p-4 rounded-2xl border border-border bg-card hover:bg-accent transition-colors text-sm shadow-soft"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
