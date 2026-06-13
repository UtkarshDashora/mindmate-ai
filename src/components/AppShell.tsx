import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Heart, LayoutDashboard, PenLine, MessageCircle, Sparkles, BarChart3, Bell, Moon, Sun, LogOut, Menu, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/checkin", label: "Daily Check-in", icon: PenLine },
  { to: "/coach", label: "AI Coach", icon: MessageCircle },
  { to: "/mindfulness", label: "Mindfulness", icon: Sparkles },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/notifications", label: "Notifications", icon: Bell },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.navigate({ to: "/auth" });
  };

  return (
    <div className="min-h-screen bg-gradient-soft flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-sidebar-border bg-sidebar p-4 gap-1">
        <Link to="/dashboard" className="flex items-center gap-2 px-2 py-3 mb-2">
          <div className="size-9 rounded-xl bg-gradient-hero shadow-glow grid place-items-center">
            <Heart className="size-5 text-white" />
          </div>
          <div>
            <div className="font-display font-bold text-base leading-tight">MindMate AI</div>
            <div className="text-xs text-muted-foreground">Wellness companion</div>
          </div>
        </Link>
        {NAV.map((n) => {
          const Icon = n.icon;
          const active = pathname.startsWith(n.to);
          return (
            <Link
              key={n.to}
              to={n.to}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60",
              )}
            >
              <Icon className="size-4" /> {n.label}
            </Link>
          );
        })}
        <div className="mt-auto flex flex-col gap-2 pt-4">
          <Button variant="ghost" size="sm" onClick={toggle} className="justify-start">
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={signOut} className="justify-start text-destructive">
            <LogOut className="size-4" /> Sign out
          </Button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 flex items-center justify-between px-4 h-14 bg-background/80 backdrop-blur border-b border-border">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-gradient-hero grid place-items-center">
            <Heart className="size-4 text-white" />
          </div>
          <span className="font-display font-bold">MindMate</span>
        </Link>
        <Button variant="ghost" size="icon" onClick={() => setOpen((v) => !v)}>
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
      </div>

      {open && (
        <div className="lg:hidden fixed inset-0 top-14 z-30 bg-background/95 backdrop-blur p-4 flex flex-col gap-1">
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg text-base",
                  active ? "bg-accent text-accent-foreground" : "hover:bg-accent/50",
                )}
              >
                <Icon className="size-5" /> {n.label}
              </Link>
            );
          })}
          <div className="mt-4 flex gap-2">
            <Button variant="outline" className="flex-1" onClick={toggle}>
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
              {theme === "dark" ? "Light" : "Dark"}
            </Button>
            <Button variant="outline" className="flex-1" onClick={signOut}>
              <LogOut className="size-4" /> Sign out
            </Button>
          </div>
        </div>
      )}

      <main className="flex-1 min-w-0 pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
