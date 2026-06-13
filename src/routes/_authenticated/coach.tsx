import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { listThreads, createThread, deleteThread } from "@/lib/threads.functions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/coach")({
  head: () => ({ meta: [{ title: "AI Wellness Coach — MindMate AI" }] }),
  component: CoachLayout,
});

function CoachLayout() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const fetchThreads = useServerFn(listThreads);
  const create = useServerFn(createThread);
  const del = useServerFn(deleteThread);

  const { data: threads = [] } = useQuery({ queryKey: ["threads"], queryFn: () => fetchThreads() });

  const createMut = useMutation({
    mutationFn: () => create({ data: {} }),
    onSuccess: (t) => {
      qc.invalidateQueries({ queryKey: ["threads"] });
      navigate({ to: "/coach/$threadId", params: { threadId: t.id } });
    },
  });

  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: ["threads"] });
      if (pathname.endsWith(id)) navigate({ to: "/coach" });
      toast.success("Conversation deleted");
    },
  });

  return (
    <div className="h-[calc(100vh-3.5rem)] lg:h-screen flex">
      <div className="w-64 hidden md:flex flex-col border-r border-border bg-card">
        <div className="p-3">
          <Button variant="hero" className="w-full" onClick={() => createMut.mutate()} disabled={createMut.isPending}>
            <Plus className="size-4" /> New conversation
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1">
          {threads.length === 0 && (
            <div className="text-xs text-muted-foreground p-3">No conversations yet.</div>
          )}
          {threads.map((t) => {
            const active = pathname.includes(t.id);
            return (
              <div key={t.id} className={cn("group flex items-center gap-1 rounded-lg", active && "bg-accent")}>
                <Link
                  to="/coach/$threadId"
                  params={{ threadId: t.id }}
                  className="flex-1 flex items-center gap-2 px-3 py-2 text-sm truncate hover:bg-accent/60 rounded-lg"
                >
                  <MessageCircle className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{t.title}</span>
                </Link>
                <button
                  onClick={() => delMut.mutate(t.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 mr-1 text-muted-foreground hover:text-destructive"
                  aria-label="Delete"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <Outlet />
      </div>
    </div>
  );
}
