import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { Activity, Moon, Brain, BookOpen, Smile, ArrowRight, AlertTriangle, Sparkles } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Line, LineChart } from "recharts";
import { getDashboardData } from "@/lib/checkins.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — MindMate AI" }] }),
  component: Dashboard,
});

function scoreColor(score: number | null | undefined) {
  if (score == null) return "text-muted-foreground";
  if (score >= 70) return "text-success";
  if (score >= 45) return "text-warning";
  return "text-destructive";
}
function scoreLabel(score: number | null | undefined) {
  if (score == null) return "—";
  if (score >= 70) return "Healthy";
  if (score >= 45) return "Moderate";
  return "Needs attention";
}

function Dashboard() {
  const { user } = useRouteContext({ from: "/_authenticated" });
  const fetchData = useServerFn(getDashboardData);
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", user.id],
    queryFn: () => fetchData(),
  });

  const latest = data?.analyses?.[0];
  const latestCheckin = data?.checkins?.[0];

  const chartData = useMemo(() => {
    const checkins = (data?.checkins ?? []).slice().reverse();
    const analyses = data?.analyses ?? [];
    return checkins.map((c) => {
      const a = analyses.find((x) => x.checkin_id === c.id);
      return {
        date: format(parseISO(c.created_at), "MMM d"),
        mood: c.mood,
        stress: c.stress,
        sleep: Number(c.sleep_hours),
        motivation: a?.motivation ?? null,
      };
    });
  }, [data]);

  if (isLoading) {
    return <div className="p-8 text-muted-foreground">Loading your dashboard…</div>;
  }

  const greeting = data?.profile?.name ? `Hi ${data.profile.name.split(" ")[0]}` : "Hi there";

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold">{greeting} 👋</h1>
          <p className="text-muted-foreground mt-1">Here's how you've been doing lately.</p>
        </div>
        <Button variant="hero" asChild><Link to="/checkin">New check-in <ArrowRight className="size-4" /></Link></Button>
      </header>

      {/* Wellness score */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1 rounded-3xl bg-gradient-card border border-border p-7 shadow-soft">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Mental wellness score</div>
          <div className={`font-display font-bold text-6xl mt-2 ${scoreColor(latest?.wellness_score)}`}>
            {latest?.wellness_score ?? "—"}
            <span className="text-base text-muted-foreground ml-2">/100</span>
          </div>
          <div className={`mt-2 font-medium ${scoreColor(latest?.wellness_score)}`}>{scoreLabel(latest?.wellness_score)}</div>
          {latest?.summary && <p className="text-sm text-muted-foreground mt-4 leading-relaxed">{latest.summary}</p>}
          {latest?.safety_alert && (
            <div className="mt-4 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-sm text-destructive flex gap-2">
              <AlertTriangle className="size-4 mt-0.5 shrink-0" />
              <div>You're not alone. Please consider reaching out to someone you trust or a helpline like iCall +91 9152987821.</div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-3">
          <Stat icon={Smile} label="Mood today" value={latestCheckin?.mood ?? "—"} suffix="/10" />
          <Stat icon={Activity} label="Stress" value={latestCheckin?.stress ?? "—"} suffix="/10" />
          <Stat icon={Brain} label="Energy" value={latestCheckin?.energy ?? "—"} suffix="/10" />
          <Stat icon={Moon} label="Sleep" value={latestCheckin?.sleep_hours ?? "—"} suffix="h" />
          <Stat icon={BookOpen} label="Study" value={latestCheckin?.study_hours ?? "—"} suffix="h" />
          <Stat icon={Sparkles} label="Journal entries" value={data?.checkins?.length ?? 0} />
        </div>
      </div>

      {/* Trends */}
      <div className="grid lg:grid-cols-2 gap-5">
        <ChartCard title="Mood & Stress trend">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.60 0.20 270)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="oklch(0.60 0.20 270)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.68 0.20 25)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="oklch(0.68 0.20 25)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0 0 0 / 0.06)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Area type="monotone" dataKey="mood" stroke="oklch(0.60 0.20 270)" fill="url(#g1)" strokeWidth={2} />
              <Area type="monotone" dataKey="stress" stroke="oklch(0.68 0.20 25)" fill="url(#g2)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Sleep & Motivation">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0 0 0 / 0.06)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Line type="monotone" dataKey="sleep" stroke="oklch(0.70 0.16 230)" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="motivation" stroke="oklch(0.65 0.18 310)" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Recommendations */}
      {latest?.recommendations && Array.isArray(latest.recommendations) && (latest.recommendations as Array<{title: string; description: string; category?: string}>).length > 0 && (
        <div>
          <h2 className="font-display text-xl font-bold mb-3">Personalized for you</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(latest.recommendations as Array<{title: string; description: string; category?: string}>).map((r, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-5 shadow-soft">
                {r.category && <div className="text-xs text-primary font-medium mb-1">{r.category}</div>}
                <div className="font-semibold">{r.title}</div>
                <p className="text-sm text-muted-foreground mt-1">{r.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {(!data?.checkins || data.checkins.length === 0) && (
        <div className="rounded-3xl border-2 border-dashed border-border p-10 text-center">
          <Sparkles className="size-8 mx-auto text-primary mb-3" />
          <h3 className="font-display text-xl font-bold">Your journey starts with one check-in</h3>
          <p className="text-muted-foreground mt-2">Spend 2 minutes telling MindMate how today went.</p>
          <Button variant="hero" asChild className="mt-5"><Link to="/checkin">Start check-in</Link></Button>
        </div>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value, suffix }: { icon: typeof Activity; label: string; value: number | string; suffix?: string }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-soft">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-xs">{label}</span>
        <Icon className="size-4 text-primary" />
      </div>
      <div className="mt-2 font-display text-2xl font-bold">{value}<span className="text-sm text-muted-foreground ml-0.5">{suffix}</span></div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-soft">
      <div className="font-semibold mb-3">{title}</div>
      {children}
    </div>
  );
}
