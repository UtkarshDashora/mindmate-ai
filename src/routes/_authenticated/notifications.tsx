import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, Droplet, Coffee, Moon, PenLine } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({ meta: [{ title: "Notifications — MindMate AI" }] }),
  component: NotificationsPage,
});

const OPTIONS = [
  { key: "daily_journal", icon: PenLine, title: "Daily journal reminder", desc: "A gentle nudge to check in each evening." },
  { key: "hydration", icon: Droplet, title: "Hydration reminder", desc: "Stay hydrated through long study sessions." },
  { key: "break_reminder", icon: Coffee, title: "Break reminder", desc: "Suggest short breaks every 50 minutes." },
  { key: "sleep_reminder", icon: Moon, title: "Sleep reminder", desc: "Wind-down prompt before your target bedtime." },
] as const;

type Settings = Record<(typeof OPTIONS)[number]["key"], boolean>;

function NotificationsPage() {
  const { user } = useRouteContext({ from: "/_authenticated" });
  const [settings, setSettings] = useState<Settings>({
    daily_journal: true, hydration: true, break_reminder: true, sleep_reminder: true,
  });

  useEffect(() => {
    supabase.from("notification_settings").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data) setSettings({
        daily_journal: data.daily_journal, hydration: data.hydration,
        break_reminder: data.break_reminder, sleep_reminder: data.sleep_reminder,
      });
    });
  }, [user.id]);

  const update = async (key: keyof Settings, value: boolean) => {
    setSettings((s) => ({ ...s, [key]: value }));
    const { error } = await supabase.from("notification_settings").upsert({ user_id: user.id, ...settings, [key]: value });
    if (error) toast.error("Couldn't save");
  };

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="size-10 rounded-xl bg-gradient-hero shadow-glow grid place-items-center"><Bell className="size-5 text-white" /></div>
        <div>
          <h1 className="font-display text-3xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground">Choose the reminders that help you stay grounded.</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-3xl shadow-soft divide-y divide-border">
        {OPTIONS.map((o) => {
          const Icon = o.icon;
          return (
            <div key={o.key} className="p-5 flex items-center gap-4">
              <div className="size-10 rounded-xl bg-accent grid place-items-center shrink-0"><Icon className="size-5 text-primary" /></div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold">{o.title}</div>
                <div className="text-sm text-muted-foreground">{o.desc}</div>
              </div>
              <Switch checked={settings[o.key]} onCheckedChange={(v) => update(o.key, v)} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
