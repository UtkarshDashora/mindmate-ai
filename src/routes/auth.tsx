import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — MindMate AI" }, { name: "description", content: "Sign in or create your MindMate AI account." }] }),
  component: AuthPage,
});

const EXAMS = ["JEE", "NEET", "UPSC", "CAT", "GATE", "CUET", "Other"] as const;

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [examType, setExamType] = useState<string>("JEE");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/dashboard`, data: { name, exam_type: examType } },
        });
        if (error) throw error;
        toast.success("Welcome to MindMate! Check your email if confirmation is required.");
        navigate({ to: "/dashboard" });
      } else if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/dashboard" });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        toast.success("Password reset email sent.");
        setMode("signin");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/dashboard` });
      if (result.error) throw result.error;
      if (result.redirected) return;
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-6">
          <div className="size-10 rounded-xl bg-gradient-hero shadow-glow grid place-items-center">
            <Heart className="size-5 text-white" />
          </div>
          <span className="font-display font-bold text-xl">MindMate AI</span>
        </Link>

        <div className="bg-card border border-border rounded-3xl shadow-soft p-7">
          {mode !== "forgot" ? (
            <>
              <Tabs value={mode} onValueChange={(v) => setMode(v as "signin" | "signup")}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="signin">Sign in</TabsTrigger>
                  <TabsTrigger value="signup">Create account</TabsTrigger>
                </TabsList>
                <TabsContent value="signin" className="space-y-4">
                  <h2 className="font-display text-xl font-bold">Welcome back</h2>
                  <p className="text-sm text-muted-foreground">Continue your wellness journey.</p>
                </TabsContent>
                <TabsContent value="signup" className="space-y-4">
                  <h2 className="font-display text-xl font-bold">Start feeling better</h2>
                  <p className="text-sm text-muted-foreground">A kinder way to prep for exams.</p>
                </TabsContent>
              </Tabs>

              <Button type="button" variant="outline" className="w-full mb-4" onClick={handleGoogle} disabled={loading}>
                <svg viewBox="0 0 48 48" className="size-4"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.5-5.9 7.7-11.3 7.7-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 5.1 29.3 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.2-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 5.1 29.3 3 24 3 16.3 3 9.6 7.6 6.3 14.7z"/><path fill="#4CAF50" d="M24 45c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2.1 1.5-4.7 2.4-7.2 2.4-5.4 0-9.7-3.2-11.3-7.7l-6.5 5C9.5 40.3 16.2 45 24 45z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.2 5.2c-.4.4 6.6-4.8 6.6-14.7 0-1.2-.1-2.3-.4-3.5z"/></svg>
                Continue with Google
              </Button>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                <div className="h-px bg-border flex-1" /> or <div className="h-px bg-border flex-1" />
              </div>

              <form onSubmit={handleEmail} className="space-y-3">
                {mode === "signup" && (
                  <>
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                    <div>
                      <Label>Exam type</Label>
                      <Select value={examType} onValueChange={setExamType}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{EXAMS.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </>
                )}
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                </div>
                <Button type="submit" variant="hero" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="size-4 animate-spin" />}
                  {mode === "signup" ? "Create account" : "Sign in"}
                </Button>
                {mode === "signin" && (
                  <button type="button" onClick={() => setMode("forgot")} className="text-sm text-primary hover:underline w-full text-center">
                    Forgot password?
                  </button>
                )}
              </form>
            </>
          ) : (
            <>
              <h2 className="font-display text-xl font-bold">Reset password</h2>
              <p className="text-sm text-muted-foreground mt-1 mb-4">Enter your email — we'll send a reset link.</p>
              <form onSubmit={handleEmail} className="space-y-3">
                <div>
                  <Label htmlFor="email2">Email</Label>
                  <Input id="email2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <Button type="submit" variant="hero" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="size-4 animate-spin" />} Send reset link
                </Button>
                <button type="button" onClick={() => setMode("signin")} className="text-sm text-primary hover:underline w-full text-center">
                  Back to sign in
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
