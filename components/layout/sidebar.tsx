"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Package,
  Wallet,
  BarChart3,
  Sparkles,
  Bell,
  Settings,
  LogOut,
} from "lucide-react";
import { Button } from "../ui/button";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Create Household", href: "/household/create", icon: Package },
  { label: "Pantry Inventory", href: "/inventory", icon: Package },
  { label: "Budget Analytics", href: "/analytics", icon: Wallet },
  { label: "Waste Reports", href: "/reports", icon: BarChart3 },
  { label: "AI Insights", href: "/insights", icon: Sparkles },
  { label: "Alerts", href: "/alerts", icon: Bell },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname() || "/";
  const router = useRouter();

  const [aiRecommendation, setAiRecommendation] = useState(
    "Loading AI recommendation..."
  );

  const getAIRecommendation = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setAiRecommendation(
          "Please login first to generate synced AI recommendations."
        );
        return;
      }

      const res = await fetch("/api/ai-recommendation", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        cache: "no-store",
      });

      const data = await res.json();

      if (data.recommendation) {
        setAiRecommendation(data.recommendation);
      } else {
        setAiRecommendation("Unable to load recommendation.");
      }
    } catch (error) {
      setAiRecommendation("AI recommendation unavailable.");
    }
  };

  useEffect(() => {
    getAIRecommendation();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      getAIRecommendation();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    const confirmLogout = window.confirm("Are you sure you want to log out?");

    if (!confirmLogout) return;

    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <aside className="hidden xl:flex min-h-screen w-80 flex-col border-r border-slate-800 bg-slate-950/90 px-6 py-8">
      <div className="mb-8 flex items-center gap-3 rounded-3xl bg-slate-900/80 px-4 py-4 shadow-[0_20px_70px_-35px_rgba(15,23,42,0.8)] ring-1 ring-slate-700/70">
        <div className="grid h-11 w-11 place-items-center rounded-3xl bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20">
          <Package className="h-6 w-6" />
        </div>

        <div>
          <h1 className="text-lg font-bold text-slate-50">
            Smart Pantry Grocery Budget
          </h1>
        </div>
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-3xl px-4 py-3 text-sm font-medium transition",
                active
                  ? "bg-cyan-500/15 text-cyan-300 shadow-inner shadow-cyan-500/10"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto">
        <div className="rounded-[2rem] bg-slate-900/90 p-5 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.8)] ring-1 ring-slate-700/70">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            AI Recommendation
          </p>

          <h2 className="mt-3 text-lg font-semibold text-slate-100">
            Smart Pantry Tip
          </h2>

          <p className="mt-2 text-sm text-slate-400">{aiRecommendation}</p>

          <Badge className="mt-4 inline-flex rounded-full bg-cyan-400/10 text-cyan-300">
            AI Powered
          </Badge>
        </div>

        <Button
          onClick={handleLogout}
          variant="outline"
          className="mt-4 h-12 w-full rounded-3xl border-red-500/20 bg-red-500/10 text-red-300 hover:bg-red-500/20 hover:text-red-200"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log Out
        </Button>
      </div>
    </aside>
  );
}