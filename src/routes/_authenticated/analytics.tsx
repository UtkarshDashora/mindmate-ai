import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { format, parseISO, subDays } from "date-fns";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend } from "recharts";
import { BarChart3, TrendingUp, TrendingDown } from "lucide-react";
import { getDashboardData } from "@/lib/checkins.functions";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({ meta: [{ title: "Progress Analytics — MindMate AI" }] }),
  component: Analytics,
});

function Analytics() {
  const { user } = useRouteContext({ from: "/_authenticated" });
  const fn = useServerFn(getDashboardData);
  const { data, isLoading } = useQuery({ queryKey: ["dashboard", user.id], queryFn: () => fn() });

  const series = useMemo(() => {
    const checkins = (data?.checkins ?? []).slice().reverse();
    const analyses = data?.analyses ?? [];
    return checkins.map((c) => {
      const a = analyses.find((x) => x.checkin_id === c.id);
      return {
        date: format(parseISO(c.created_at), "MMM d"),
        mood: c.mood, stress: c.stress, sleep: Number(c.sleep_hours),
        motivation: a?.motivation ?? null, wellness: a?.wellness_score ?? null,
      };
    });
  }, [data]);

  const summary = useMemo(() => {
    const week = (data?.checkins ?? []).filter((c) => parseISO(c.created_at) > subDays(new Date(), 7));
    const prev = (data?.checkins ?? []).filter((c) => {
      const d = parseISO(c.created_at);
      return d > subDays(new Date(), 14) && d <= subDays(new Date(), 7);
    });
    const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    const wAvg = (k: "mood" | "stress" | "sleep_hours") => avg(week.map((c) => Number(c[k])));
    const pAvg = (k: "mood" | "stress" | "sleep_hours") => avg(prev.map((c) => Number(c[k])));
    return {
      moodDelta: wAvg("mood") - pAvg("mood"),
      stressDelta: wAvg("stress") - pAvg("stress"),
      sleepDelta: wAvg("sleep_hours") - pAvg("sleep_hours"),
      week, prev,
    };
  }, [data]);

  if (isLoading) return <div className="p-8 text-muted-foreground">Loading…</div>;

  const insight = (() => {
    if ((data?.checkins?.length ?? 0) < 3) return "Keep checking in daily — patterns emerge after about a week.";
    if (summary.stressDelta > 1 && summary.sleepDelta < -0.5) return "Your stress levels increased this week, likely tied to reduced sleep. Try protecting an extra hour tonight.";
    if (summary.moodDelta > 0.5) return "Your mood has been trending up. Whatever you're doing — keep it up.";
    if (summary.stressDelta < -1) return "Your stress is coming down nicely. The work you're putting in is paying off.";
    return "You're showing up consistently. Small steady steps compound.";
  })();

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-gradient-hero shadow-glow grid place-items-center"><BarChart3 className="size-5 text-white" /></div>
        <div>
          <h1 className="font-display text-3xl font-bold">Progress Analytics</h1>
          <p className="text-sm text-muted-foreground">Your patterns, made visible.</p>
        </div>
      </div>

      <div className="rounded-2xl bg-gradient-card border border-border p-6 shadow-soft">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">AI insight</div>
        <p className="mt-2 leading-relaxed">{insight}</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <DeltaCard label="Mood (7d)" delta={summary.moodDelta} suffix="" />
        <DeltaCard label="Stress (7d)" delta={summary.stressDelta} suffix="" invert />
        <DeltaCard label="Sleep (7d)" delta={summary.sleepDelta} suffix="h" />
      </div>

      <Section title="Weekly trends">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={series}>
            <defs>
              <linearGradient id="w1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="oklch(0.60 0.20 270)" stopOpacity={0.4} /><stop offset="100%" stopColor="oklch(0.60 0.20 270)" stopOpacity={0} /></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0 0 0 / 0.06)" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
            <Area type="monotone" dataKey="wellness" name="Wellness" stroke="oklch(0.60 0.20 270)" fill="url(#w1)" strokeWidth={2.5} />
          </AreaChart>
        </ResponsiveContainer>
      </Section>

      <Section title="Mood, Stress & Motivation">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={series}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0 0 0 / 0.06)" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
            <Legend />
            <Bar dataKey="mood" fill="oklch(0.60 0.20 270)" radius={[6, 6, 0, 0]} />
            <Bar dataKey="stress" fill="oklch(0.68 0.20 25)" radius={[6, 6, 0, 0]} />
            <Bar dataKey="motivation" fill="oklch(0.65 0.18 310)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Section>
    </div>
  );
}

function DeltaCard({ label, delta, suffix, invert }: { label: string; delta: number; suffix: string; invert?: boolean }) {
  const positive = invert ? delta < 0 : delta > 0;
  const Arrow = delta === 0 ? TrendingUp : positive ? TrendingUp : TrendingDown;
  const color = delta === 0 ? "text-muted-foreground" : positive ? "text-success" : "text-destructive";
  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-soft">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-2 flex items-center gap-1 font-display text-2xl font-bold ${color}`}>
        <Arrow className="size-5" />
        {delta >= 0 ? "+" : ""}{delta.toFixed(1)}{suffix}
      </div>
    </div>
  );
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-soft">
      <div className="font-semibold mb-3">{title}</div>
      {children}
    </div>
  );
}
