import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, BarChart3, Sparkles, MessageCircle, ShieldCheck, BrainCircuit, Activity, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MindMate AI — Mental Wellness for Exam Students" },
      { name: "description", content: "AI-powered mental wellness companion for students preparing for NEET, JEE, UPSC, CAT, GATE, CUET. Track stress, mood, and burnout with personalized support." },
      { property: "og:title", content: "MindMate AI — Mental Wellness for Exam Students" },
      { property: "og:description", content: "Track stress, uncover emotional patterns, and receive personalized support during your exam journey." },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: BrainCircuit, title: "AI Journal Analysis", desc: "Get gentle insights from your daily journal entries." },
  { icon: Activity, title: "Mood Tracking", desc: "Visualize mood patterns and what shifts them." },
  { icon: Flame, title: "Burnout Detection", desc: "Early warning before exam fatigue becomes a wall." },
  { icon: Sparkles, title: "Personalized Wellness Plans", desc: "Plans that adapt to your stress and study load." },
  { icon: Heart, title: "Mindfulness Exercises", desc: "2, 5, or 10-minute resets for any moment." },
  { icon: BarChart3, title: "Progress Dashboard", desc: "Beautiful charts that show how you're really doing." },
];

const testimonials = [
  { quote: "MindMate helped me notice I was running on 4 hours of sleep for a week. I rested and my mocks improved.", name: "Aarav", exam: "JEE Aspirant" },
  { quote: "The AI coach is like a friend who actually listens. I journal every night now.", name: "Ishita", exam: "NEET Aspirant" },
  { quote: "I finally have language for what I feel during UPSC prep. The recommendations are practical.", name: "Rohan", exam: "UPSC Aspirant" },
];

function Landing() {
  return (
    <div className="min-h-screen bg-gradient-soft">
      <header className="container mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-9 rounded-xl bg-gradient-hero shadow-glow grid place-items-center">
            <Heart className="size-5 text-white" />
          </div>
          <span className="font-display font-bold text-lg">MindMate AI</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild><Link to="/auth">Sign in</Link></Button>
          <Button variant="hero" asChild><Link to="/auth">Get Started</Link></Button>
        </div>
      </header>

      <section className="container mx-auto px-6 pt-12 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-medium mb-6">
          <Sparkles className="size-3.5" /> Built for NEET, JEE, UPSC, CAT, GATE & CUET aspirants
        </div>
        <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight max-w-4xl mx-auto leading-[1.05]">
          Your AI Mental Wellness <br className="hidden md:block" />
          <span className="bg-gradient-hero bg-clip-text text-transparent">Companion for Exam Success</span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
          Track stress, uncover emotional patterns, and receive personalized support during your exam journey — without judgment.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" variant="hero" asChild><Link to="/auth">Get Started Free</Link></Button>
          <Button size="lg" variant="outline" asChild><Link to="/auth">Try Demo</Link></Button>
        </div>
        <div className="mt-12 mx-auto max-w-4xl rounded-3xl bg-gradient-card border border-border shadow-soft p-6 md:p-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { v: "82", l: "Avg wellness score" },
              { v: "14d", l: "Mood streaks" },
              { v: "5min", l: "Daily check-in" },
              { v: "24/7", l: "AI coach" },
            ].map((s) => (
              <div key={s.l}>
                <div className="font-display text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">{s.v}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6 py-16">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-center">Everything you need to stay grounded</h2>
        <p className="text-center text-muted-foreground mt-3 max-w-xl mx-auto">Powered by Gemini, designed by people who've felt exam stress.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-12">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="bg-card border border-border rounded-2xl p-6 shadow-soft hover:shadow-glow transition-shadow">
                <div className="size-11 rounded-xl bg-accent grid place-items-center mb-4">
                  <Icon className="size-5 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg">{f.title}</h3>
                <p className="text-sm text-muted-foreground mt-2">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="container mx-auto px-6 py-16">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-center">Students who feel seen</h2>
        <div className="grid md:grid-cols-3 gap-5 mt-10">
          {testimonials.map((t) => (
            <div key={t.name} className="bg-gradient-card border border-border rounded-2xl p-6 shadow-soft">
              <MessageCircle className="size-5 text-primary mb-3" />
              <p className="text-sm leading-relaxed">"{t.quote}"</p>
              <div className="mt-4 text-sm">
                <div className="font-semibold">{t.name}</div>
                <div className="text-muted-foreground text-xs">{t.exam}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-6 py-20">
        <div className="rounded-3xl bg-gradient-hero p-10 md:p-16 text-center shadow-glow text-white">
          <ShieldCheck className="size-10 mx-auto mb-4 opacity-90" />
          <h2 className="font-display text-3xl md:text-4xl font-bold">Your data stays yours.</h2>
          <p className="mt-3 max-w-xl mx-auto opacity-90">Private journal entries, end-to-end encrypted at rest. We never share, never sell.</p>
          <Button size="lg" variant="secondary" asChild className="mt-6"><Link to="/auth">Start your wellness journey</Link></Button>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="container mx-auto px-6 py-10 flex flex-col md:flex-row justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-gradient-hero grid place-items-center"><Heart className="size-3.5 text-white" /></div>
            <span>© {new Date().getFullYear()} MindMate AI</span>
          </div>
          <div className="flex gap-6">
            <a href="#about" className="hover:text-foreground">About</a>
            <a href="#privacy" className="hover:text-foreground">Privacy Policy</a>
            <a href="#contact" className="hover:text-foreground">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
