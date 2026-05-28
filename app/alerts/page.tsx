"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Sparkles, AlertTriangle } from "lucide-react";

interface AlertItem {
  id: string;
  title: string;
  message: string;
  alert_type: string | null;
  is_read: boolean | null;
  created_at: string;
}

interface PantryItem {
  id: string;
  item_name: string;
  expiration_date: string | null;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);

  useEffect(() => {
    const fetchAlerts = async () => {
      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Alerts error:", error.message);
        return;
      }

      setAlerts(data || []);
    };

    const fetchPantryItems = async () => {
      const { data, error } = await supabase
        .from("pantry_items")
        .select("id, item_name, expiration_date")
        .order("expiration_date", { ascending: true });

      if (error) {
        console.error("Pantry items error:", error.message);
        return;
      }

      setPantryItems(data || []);
    };

    fetchAlerts();
    fetchPantryItems();
  }, []);

  const urgentItems = useMemo(() => {
    const today = new Date();

    return pantryItems
      .filter((item) => {
        if (!item.expiration_date) return false;

        const expiry = new Date(item.expiration_date);
        const diffDays =
          (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

        return diffDays <= 3;
      })
      .slice(0, 3);
  }, [pantryItems]);

  const handleMarkAllRead = async () => {
    const { error } = await supabase
      .from("alerts")
      .update({ is_read: true })
      .eq("is_read", false);

    if (error) {
      alert(error.message);
      return;
    }

    setAlerts((prev) =>
      prev.map((item) => ({
        ...item,
        is_read: true,
      }))
    );
  };

  return (
    <div className="space-y-6 py-6">
      <header className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/20">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-cyan-300/80">
              Alerts
            </p>

            <h1 className="mt-2 text-3xl font-semibold text-slate-50">
              Actionable insights for the household.
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Check the latest alerts for expiring items, budget pressure, and AI recommendations.
            </p>
          </div>

          <Button
            onClick={handleMarkAllRead}
            className="h-12 rounded-3xl bg-cyan-400 px-5 font-semibold text-slate-950 hover:bg-cyan-300"
          >
            Mark all read
          </Button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-4">
          {alerts.length === 0 ? (
            <Card className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/20">
              <p className="text-sm text-slate-500">No alerts found.</p>
            </Card>
          ) : (
            alerts.map((alert) => (
              <Card
                key={alert.id}
                className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/20"
              >
                <CardHeader className="items-start gap-4">
                  <div className="rounded-3xl bg-cyan-400/10 p-3 text-cyan-300">
                    {alert.alert_type === "Budget" ? (
                      <Bell className="h-5 w-5" />
                    ) : (
                      <AlertTriangle className="h-5 w-5" />
                    )}
                  </div>

                  <div>
                    <CardTitle className="text-xl text-slate-50">
                      {alert.title}
                    </CardTitle>

                    <p className="mt-2 text-sm text-slate-400">
                      {alert.message}
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="mt-4 flex items-center gap-3">
                  <Badge className="rounded-full bg-cyan-400/10 text-cyan-300">
                    {alert.alert_type || "Alert"}
                  </Badge>

                  <p className="text-sm text-slate-500">
                    {alert.is_read ? "Read" : "Unread"}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Card className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/20">
          <div className="flex items-center gap-3">
            <div className="rounded-3xl bg-slate-900/80 p-3 text-cyan-300">
              <Sparkles className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-slate-500">
                AI insights
              </p>

              <h2 className="mt-1 text-2xl font-semibold text-slate-50">
                Cook today suggestions
              </h2>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {urgentItems.length === 0 ? (
              <p className="text-sm text-slate-500">
                No urgent pantry items found.
              </p>
            ) : (
              urgentItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-3xl bg-slate-900/80 p-4"
                >
                  <p className="text-sm text-slate-400">
                    Use {item.item_name} soon before it expires.
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}