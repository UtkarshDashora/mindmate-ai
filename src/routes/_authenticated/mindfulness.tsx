import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Wind, Brain, Moon, Heart, Zap, Play, Pause, RotateCcw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

export const Route = createFileRoute("/_authenticated/mindfulness")({
  head: () => ({ meta: [{ title: "Mindfulness Center — MindMate AI" }] }),
  component: Mindfulness,
});

type Exercise = {
  id: string;
  category: string;
  title: string;
  duration: 2 | 5 | 10;
  icon: typeof Wind;
  steps: string[];
};

const EXERCISES: Exercise[] = [
  { id: "1", category: "Anxiety Relief", icon: Wind, title: "Box breathing", duration: 2, steps: ["Sit comfortably and close your eyes", "Inhale through nose for 4 counts", "Hold for 4 counts", "Exhale slowly for 4 counts", "Hold empty for 4 counts", "Repeat for 2 minutes"] },
  { id: "2", category: "Anxiety Relief", icon: Wind, title: "5-4-3-2-1 grounding", duration: 5, steps: ["Notice 5 things you can see", "4 things you can touch", "3 things you can hear", "2 things you can smell", "1 thing you can taste"] },
  { id: "3", category: "Focus Boost", icon: Brain, title: "Pomodoro intent reset", duration: 2, steps: ["Close all browser tabs", "Write your next 25-minute goal", "Take 3 slow breaths", "Begin without distraction"] },
  { id: "4", category: "Focus Boost", icon: Brain, title: "Focused attention", duration: 10, steps: ["Sit upright", "Choose one object to focus on", "When mind wanders, gently return", "Notice without judgment", "Continue for the full 10 minutes"] },
  { id: "5", category: "Sleep Relaxation", icon: Moon, title: "Body scan for sleep", duration: 10, steps: ["Lie down comfortably", "Relax your forehead, jaw, shoulders", "Move attention down your body", "Release each area as you exhale", "Allow yourself to drift"] },
  { id: "6", category: "Sleep Relaxation", icon: Moon, title: "4-7-8 breathing", duration: 5, steps: ["Inhale for 4 counts", "Hold for 7 counts", "Exhale for 8 counts", "Repeat 4 cycles"] },
  { id: "7", category: "Exam Calmness", icon: Heart, title: "Pre-exam centering", duration: 5, steps: ["Place hand on chest", "Breathe slowly into your hand", "Remind yourself: 'I have prepared'", "Visualize calm focus during the exam", "Smile gently"] },
  { id: "8", category: "Exam Calmness", icon: Heart, title: "Confidence anchor", duration: 2, steps: ["Recall a time you succeeded", "Feel the confidence in your body", "Squeeze your thumb and finger together", "Anchor that feeling", "Use the anchor before your exam"] },
  { id: "9", category: "Quick Motivation", icon: Zap, title: "Future-self letter", duration: 5, steps: ["Imagine yourself one year from now", "Picture your success", "What would they tell you?", "Write 3 sentences from them", "Read them aloud"] },
  { id: "10", category: "Quick Motivation", icon: Zap, title: "Power pose", duration: 2, steps: ["Stand tall, feet apart", "Hands on hips like a superhero", "Hold for 2 minutes", "Breathe deeply", "Notice your energy"] },
];

const CATEGORIES = ["All", "Anxiety Relief", "Focus Boost", "Sleep Relaxation", "Exam Calmness", "Quick Motivation"] as const;

function Mindfulness() {
  const [filter, setFilter] = useState<(typeof CATEGORIES)[number]>("All");
  const [active, setActive] = useState<Exercise | null>(null);
  const list = EXERCISES.filter((e) => filter === "All" || e.category === filter);

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="size-10 rounded-xl bg-gradient-hero shadow-glow grid place-items-center"><Sparkles className="size-5 text-white" /></div>
        <div>
          <h1 className="font-display text-3xl font-bold">Mindfulness Center</h1>
          <p className="text-sm text-muted-foreground">Short, calming practices for the moments that need them.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => setFilter(c)} className={cn("px-4 py-1.5 rounded-full text-sm border transition-colors", filter === c ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:bg-accent")}>{c}</button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map((e) => {
          const Icon = e.icon;
          return (
            <button key={e.id} onClick={() => setActive(e)} className="text-left bg-gradient-card border border-border rounded-2xl p-5 shadow-soft hover:shadow-glow transition-shadow">
              <div className="flex justify-between">
                <div className="size-10 rounded-xl bg-accent grid place-items-center"><Icon className="size-5 text-primary" /></div>
                <span className="text-xs px-2 py-1 rounded-full bg-muted flex items-center gap-1"><Clock className="size-3" />{e.duration} min</span>
              </div>
              <div className="text-xs text-primary font-medium mt-3">{e.category}</div>
              <div className="font-semibold mt-1">{e.title}</div>
            </button>
          );
        })}
      </div>

      {active && <ExerciseModal ex={active} onClose={() => setActive(null)} />}
    </div>
  );
}

function ExerciseModal({ ex, onClose }: { ex: Exercise; onClose: () => void }) {
  const [seconds, setSeconds] = useState(ex.duration * 60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [running]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const pct = 1 - seconds / (ex.duration * 60);

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur grid place-items-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-3xl p-7 max-w-md w-full shadow-glow" onClick={(e) => e.stopPropagation()}>
        <div className="text-xs text-primary font-medium">{ex.category}</div>
        <h2 className="font-display text-2xl font-bold mt-1">{ex.title}</h2>
        <div className="my-6 relative mx-auto size-40">
          <svg viewBox="0 0 100 100" className="size-full -rotate-90">
            <circle cx="50" cy="50" r="45" fill="none" stroke="oklch(0.93 0.06 275)" strokeWidth="6" />
            <circle cx="50" cy="50" r="45" fill="none" stroke="oklch(0.60 0.20 270)" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${pct * 283} 283`} className="transition-all duration-1000" />
          </svg>
          <div className="absolute inset-0 grid place-items-center font-display text-3xl font-bold">{mm}:{ss}</div>
        </div>
        <ol className="space-y-2 text-sm list-decimal list-inside text-muted-foreground">
          {ex.steps.map((s, i) => <li key={i}>{s}</li>)}
        </ol>
        <div className="flex gap-2 mt-6">
          <Button variant="hero" className="flex-1" onClick={() => setRunning((v) => !v)}>
            {running ? <><Pause className="size-4" /> Pause</> : <><Play className="size-4" /> Start</>}
          </Button>
          <Button variant="outline" onClick={() => { setSeconds(ex.duration * 60); setRunning(false); }}><RotateCcw className="size-4" /></Button>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}
