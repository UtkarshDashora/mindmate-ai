import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Sparkles, AlertTriangle, Heart } from "lucide-react";
import { toast } from "sonner";
import { submitCheckin } from "@/lib/checkins.functions";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/checkin")({
  head: () => ({ meta: [{ title: "Daily Check-in — MindMate AI" }] }),
  component: CheckinPage,
});

function CheckinPage() {
  const [mood, setMood] = useState(6);
  const [stress, setStress] = useState(5);
  const [energy, setEnergy] = useState(6);
  const [sleep, setSleep] = useState(7);
  const [study, setStudy] = useState(4);
  const [journal, setJournal] = useState("");
  const [result, setResult] = useState<{ analysis: AnalysisShape } | null>(null);

  const fn = useServerFn(submitCheckin);
  const navigate = useNavigate();
  const mutation = useMutation({
    mutationFn: (input: Parameters<typeof fn>[0]) => fn(input),
    onSuccess: (data) => {
      toast.success("Analysis ready.");
      setResult({ analysis: data.analysis as unknown as AnalysisShape });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ data: { mood, stress, energy, sleep_hours: sleep, study_hours: study, journal } });
  };

  if (result) {
    return <AnalysisResult analysis={result.analysis} onNew={() => { setResult(null); setJournal(""); }} onDashboard={() => navigate({ to: "/dashboard" })} />;
  }

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <div className="size-10 rounded-xl bg-gradient-hero shadow-glow grid place-items-center">
          <Heart className="size-5 text-white" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold">How was your day?</h1>
          <p className="text-sm text-muted-foreground">Just a few sliders and a note — takes 2 minutes.</p>
        </div>
      </div>

      <form onSubmit={submit} className="mt-8 space-y-6 bg-card border border-border rounded-3xl p-6 md:p-8 shadow-soft">
        <Range label="Mood" value={mood} onChange={setMood} hint="😟 1 — 10 😄" />
        <Range label="Stress" value={stress} onChange={setStress} hint="🧘 1 — 10 🔥" />
        <Range label="Energy" value={energy} onChange={setEnergy} hint="🪫 1 — 10 ⚡" />

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Sleep hours</Label>
            <Input type="number" min={0} max={24} step={0.5} value={sleep} onChange={(e) => setSleep(parseFloat(e.target.value) || 0)} />
          </div>
          <div>
            <Label>Study hours</Label>
            <Input type="number" min={0} max={24} step={0.5} value={study} onChange={(e) => setStudy(parseFloat(e.target.value) || 0)} />
          </div>
        </div>

        <div>
          <Label htmlFor="j">Journal</Label>
          <Textarea id="j" rows={6} placeholder="How was your day? Tell me what happened." value={journal} onChange={(e) => setJournal(e.target.value)} />
        </div>

        <Button type="submit" variant="hero" className="w-full" size="lg" disabled={mutation.isPending}>
          {mutation.isPending ? <><Loader2 className="size-4 animate-spin" /> Analyzing…</> : <><Sparkles className="size-4" /> Analyze My Day</>}
        </Button>
      </form>
    </div>
  );
}

function Range({ label, value, onChange, hint }: { label: string; value: number; onChange: (n: number) => void; hint: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <Label>{label}</Label>
        <div className="font-display text-xl font-bold text-primary">{value}<span className="text-xs text-muted-foreground">/10</span></div>
      </div>
      <Slider min={1} max={10} step={1} value={[value]} onValueChange={(v) => onChange(v[0])} />
      <div className="text-xs text-muted-foreground mt-1.5">{hint}</div>
    </div>
  );
}

type AnalysisShape = {
  wellness_score: number | null;
  summary: string | null;
  encouragement: string | null;
  emotions: string[];
  stress_level: number | null;
  motivation: number | null;
  confidence: number | null;
  burnout_risk: string | null;
  triggers: string[];
  recommendations: Array<{ title: string; description: string; category?: string }> | unknown;
  mindfulness_exercise: { title: string; duration_minutes: number; steps: string[] } | null | unknown;
  safety_alert: boolean;
};

function AnalysisResult({ analysis, onNew, onDashboard }: { analysis: AnalysisShape; onNew: () => void; onDashboard: () => void }) {
  const recs = (Array.isArray(analysis.recommendations) ? analysis.recommendations : []) as Array<{ title: string; description: string; category?: string }>;
  const ex = analysis.mindfulness_exercise as { title: string; duration_minutes: number; steps: string[] } | null;

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-6">
      <div className="rounded-3xl bg-gradient-hero text-white p-7 shadow-glow">
        <div className="text-sm opacity-90">Today's wellness score</div>
        <div className="font-display text-6xl font-bold mt-1">{analysis.wellness_score ?? "—"}<span className="text-xl opacity-80">/100</span></div>
        <p className="mt-3 opacity-95 leading-relaxed">{analysis.summary}</p>
      </div>

      {analysis.safety_alert && (
        <div className="rounded-2xl bg-destructive/10 border border-destructive/30 p-5 flex gap-3">
          <AlertTriangle className="size-5 text-destructive shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="font-semibold text-destructive">You matter, and you don't have to face this alone.</div>
            <p className="mt-1 text-muted-foreground">Please reach out to someone you trust, or contact a helpline like iCall (+91 9152987821) or your local emergency number.</p>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        <Pill label="Stress level" value={`${analysis.stress_level ?? "—"}/10`} />
        <Pill label="Motivation" value={`${analysis.motivation ?? "—"}/10`} />
        <Pill label="Confidence" value={`${analysis.confidence ?? "—"}/10`} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card title="Emotional summary">
          <div className="flex flex-wrap gap-2 mt-2">
            {analysis.emotions.map((e) => (
              <span key={e} className="px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium">{e}</span>
            ))}
          </div>
        </Card>
        <Card title={`Burnout risk: ${analysis.burnout_risk ?? "—"}`}>
          <div className="flex flex-wrap gap-2 mt-2">
            {analysis.triggers.map((t) => (
              <span key={t} className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs">{t}</span>
            ))}
          </div>
        </Card>
      </div>

      {analysis.encouragement && (
        <div className="rounded-2xl bg-accent border border-border p-5 italic text-accent-foreground">"{analysis.encouragement}"</div>
      )}

      <div>
        <h3 className="font-display text-xl font-bold mb-3">Recommendations</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recs.map((r, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-5 shadow-soft">
              {r.category && <div className="text-xs text-primary font-medium mb-1">{r.category}</div>}
              <div className="font-semibold">{r.title}</div>
              <p className="text-sm text-muted-foreground mt-1">{r.description}</p>
            </div>
          ))}
        </div>
      </div>

      {ex && (
        <div className="rounded-2xl bg-gradient-card border border-border p-6 shadow-soft">
          <div className="text-xs text-primary font-medium">Mindfulness · {ex.duration_minutes} min</div>
          <div className="font-display text-lg font-bold mt-1">{ex.title}</div>
          <ol className="mt-3 space-y-2 text-sm text-muted-foreground list-decimal list-inside">
            {ex.steps.map((s, i) => <li key={i}>{s}</li>)}
          </ol>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onNew}>New check-in</Button>
        <Button variant="hero" onClick={onDashboard}>Back to dashboard</Button>
      </div>
    </div>
  );
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 text-center shadow-soft">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-display text-2xl font-bold mt-1 text-primary">{value}</div>
    </div>
  );
}
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-soft">
      <div className="font-semibold">{title}</div>
      {children}
    </div>
  );
}
