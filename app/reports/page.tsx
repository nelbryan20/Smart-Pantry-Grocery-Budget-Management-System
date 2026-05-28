"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface WasteReport {
  id: string;
  item_name: string;
  category: string | null;
  quantity_wasted: number | null;
  reason: string | null;
  wasted_date: string;
}

const colors = ["#06b6d4", "#22c55e", "#38bdf8", "#0ea5e9", "#34d399"];

export default function ReportsPage() {
  const [wasteReports, setWasteReports] = useState<WasteReport[]>([]);

  useEffect(() => {
    const fetchWasteReports = async () => {
      const { data, error } = await supabase
        .from("waste_reports")
        .select("*")
        .order("wasted_date", { ascending: false });

      if (error) {
        console.error("Waste reports error:", error.message);
        return;
      }

      setWasteReports(data || []);
    };

    fetchWasteReports();
  }, []);

  const weeklyWaste = useMemo(() => {
    const weeks = ["W1", "W2", "W3", "W4"];
    const grouped: Record<string, number> = {
      W1: 0,
      W2: 0,
      W3: 0,
      W4: 0,
    };

    wasteReports.forEach((item) => {
      const date = new Date(item.wasted_date);
      const day = date.getDate();

      let week = "W1";
      if (day > 7 && day <= 14) week = "W2";
      else if (day > 14 && day <= 21) week = "W3";
      else if (day > 21) week = "W4";

      grouped[week] += Number(item.quantity_wasted || 1);
    });

    return weeks.map((week) => ({
      week,
      waste: grouped[week],
    }));
  }, [wasteReports]);

  const wastedCategories = useMemo(() => {
    const grouped: Record<string, number> = {};

    wasteReports.forEach((item) => {
      const category = item.category || "Uncategorized";
      grouped[category] =
        (grouped[category] || 0) + Number(item.quantity_wasted || 1);
    });

    return Object.entries(grouped).map(([name, value]) => ({
      name,
      value,
    }));
  }, [wasteReports]);

  const recentWarnings = wasteReports.slice(0, 3);

  return (
    <div className="space-y-6 py-6">
      <header className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/20">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-cyan-300/80">
              Waste Reports
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-50">
              Understand where food is lost.
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Deep dive into weekly waste trends and category drivers for smarter planning.
            </p>
          </div>

          <Button className="h-12 rounded-3xl bg-cyan-400 px-5 font-semibold text-slate-950 hover:bg-cyan-300">
            <Download className="mr-2 h-4 w-4" />
            Export waste data
          </Button>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
        <Card className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/20">
          <CardTitle className="text-2xl text-slate-50">
            Weekly waste trend
          </CardTitle>
          <p className="mt-1 text-sm text-slate-400">
            Food waste quantity grouped by week.
          </p>

          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyWaste}>
                <XAxis dataKey="week" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="waste" fill="#22d3ee" radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/20">
          <CardTitle className="text-2xl text-slate-50">
            Category waste mix
          </CardTitle>
          <p className="mt-1 text-sm text-slate-400">
            Categories that contribute most to food waste.
          </p>

          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={wastedCategories}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={90}
                  label
                >
                  {wastedCategories.map((entry, index) => (
                    <Cell key={entry.name} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/20 xl:col-span-2">
          <CardTitle className="text-2xl text-slate-50">
            Waste reduction actions
          </CardTitle>

          <div className="mt-6 space-y-4">
            {wasteReports.length === 0 ? (
              <p className="text-sm text-slate-500">
                No waste reports found.
              </p>
            ) : (
              wasteReports.slice(0, 2).map((item) => (
                <div key={item.id} className="rounded-3xl bg-slate-900/80 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-100">
                        Reduce waste from {item.item_name}
                      </h3>
                      <p className="mt-2 text-sm text-slate-400">
                        Category: {item.category || "Uncategorized"} • Reason:{" "}
                        {item.reason || "No reason added"}
                      </p>
                    </div>
                    <Badge className="rounded-full bg-cyan-400/10 text-cyan-300">
                      Live
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/20">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl text-slate-50">
                Alert summary
              </CardTitle>
              <p className="mt-1 text-sm text-slate-400">
                Recent alerts generated by waste analytics.
              </p>
            </div>
            <Badge className="rounded-full bg-amber-400/10 text-amber-300">
              Important
            </Badge>
          </div>

          <div className="mt-6 space-y-4">
            {recentWarnings.length === 0 ? (
              <p className="text-sm text-slate-500">
                No recent waste alerts.
              </p>
            ) : (
              recentWarnings.map((item) => (
                <div
                  key={item.id}
                  className="rounded-3xl bg-slate-900/80 p-4 text-sm text-slate-300"
                >
                  {item.item_name} wasted — {item.quantity_wasted || 1} item(s)
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}