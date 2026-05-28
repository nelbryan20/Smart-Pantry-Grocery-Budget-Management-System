"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, ShieldCheck, Sparkles, UserCog } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6 py-6">
      <header className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/20">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-cyan-300/80">Settings</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-50">Customize your admin workflow.</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">Update preference, notification settings, and account details for household management.</p>
          </div>
          <Button className="h-12 rounded-3xl bg-cyan-400 px-5 font-semibold text-slate-950 hover:bg-cyan-300">
            Save changes
          </Button>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-3">
        {[
          {
            title: "Account",
            description: "Manage household account, permissions, and sign-in preferences.",
            icon: UserCog,
          },
          {
            title: "Notifications",
            description: "Choose alerts for expiring items, low budget, and AI recommendations.",
            icon: ShieldCheck,
          },
          {
            title: "Theme",
            description: "Keep the dashboard sleek with dark mode visuals and accent highlights.",
            icon: Sparkles,
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/20">
              <div className="flex items-start gap-4">
                <div className="rounded-3xl bg-cyan-400/10 p-3 text-cyan-300">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-xl text-slate-50">{card.title}</CardTitle>
                  <p className="mt-2 text-sm text-slate-400">{card.description}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/20">
        <CardHeader className="items-start gap-4">
          <div className="rounded-3xl bg-slate-900/80 p-3 text-cyan-300">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-2xl text-slate-50">Household preferences</CardTitle>
            <p className="mt-2 text-sm text-slate-400">Update notification cadence, budget thresholds, and inventory sync options.</p>
          </div>
        </CardHeader>
        <CardContent className="mt-6 space-y-6">
          <div className="rounded-3xl bg-slate-900/80 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-400">Budget threshold</p>
                <p className="mt-1 text-lg font-semibold text-slate-100">₱6,000 / month</p>
              </div>
              <Badge className="rounded-full bg-cyan-400/10 text-cyan-300">Active</Badge>
            </div>
          </div>
          <div className="rounded-3xl bg-slate-900/80 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-400">Notification frequency</p>
                <p className="mt-1 text-lg font-semibold text-slate-100">Daily summary</p>
              </div>
              <Badge className="rounded-full bg-emerald-400/10 text-emerald-300">Best fit</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
