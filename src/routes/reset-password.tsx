import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset password — MindMate AI" }] }),
  component: ResetPassword,
});

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated.");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-soft grid place-items-center p-6">
      <form onSubmit={handle} className="w-full max-w-sm bg-card border border-border rounded-3xl p-7 shadow-soft space-y-4">
        <h1 className="font-display text-xl font-bold">Set a new password</h1>
        <div>
          <Label htmlFor="np">New password</Label>
          <Input id="np" type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <Button type="submit" variant="hero" className="w-full" disabled={loading}>
          {loading && <Loader2 className="size-4 animate-spin" />} Update password
        </Button>
      </form>
    </div>
  );
}
