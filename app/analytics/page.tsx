"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, Wallet, BarChart3 } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface GroceryExpense {
  id: string;
  item_name: string;
  category: string | null;
  price: number;
  purchase_date: string;
}

interface WasteReport {
  id: string;
  item_name: string;
  category: string | null;
  quantity_wasted: number | null;
  wasted_date: string;
}

const colors = ["#06b6d4", "#0ea5e9", "#22c55e", "#38bdf8", "#5eead4"];

export default function AnalyticsPage() {
  const [expenses, setExpenses] = useState<GroceryExpense[]>([]);
  const [wasteReports, setWasteReports] = useState<WasteReport[]>([]);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      const { data: expenseData, error: expenseError } = await supabase
        .from("grocery_expenses")
        .select("*")
        .order("purchase_date", { ascending: true });

      if (expenseError) {
        console.error("Expense error:", expenseError.message);
      }

      const { data: wasteData, error: wasteError } = await supabase
        .from("waste_reports")
        .select("*")
        .order("wasted_date", { ascending: true });

      if (wasteError) {
        console.error("Waste error:", wasteError.message);
      }

      setExpenses(expenseData || []);
      setWasteReports(wasteData || []);
    };

    fetchAnalyticsData();
  }, []);

  const totalSpend = useMemo(() => {
    return expenses.reduce((sum, item) => sum + Number(item.price || 0), 0);
  }, [expenses]);

  const totalWaste = useMemo(() => {
    return wasteReports.reduce(
      (sum, item) => sum + Number(item.quantity_wasted || 0),
      0
    );
  }, [wasteReports]);

  const categoryData = useMemo(() => {
    const grouped: Record<string, number> = {};

    expenses.forEach((item) => {
      const category = item.category || "Uncategorized";
      grouped[category] = (grouped[category] || 0) + Number(item.price || 0);
    });

    return Object.entries(grouped).map(([name, value]) => ({
      name,
      value,
    }));
  }, [expenses]);

  const wasteItems = useMemo(() => {
    const grouped: Record<string, number> = {};

    wasteReports.forEach((item) => {
      const label = item.item_name || "Unknown";
      grouped[label] = grouped[label] + Number(item.quantity_wasted || 0) || Number(item.quantity_wasted || 0);
    });

    return Object.entries(grouped)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 4);
  }, [wasteReports]);

  const spendTrend = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    const grouped: Record<string, number> = {};

    months.forEach((month) => {
      grouped[month] = 0;
    });

    expenses.forEach((item) => {
      const date = new Date(item.purchase_date);
      const month = date.toLocaleString("en-US", { month: "short" });

      grouped[month] = (grouped[month] || 0) + Number(item.price || 0);
    });

    return months.map((month) => ({
      month,
      spend: grouped[month] || 0,
    }));
  }, [expenses]);

  const wasteRatio =
    expenses.length > 0
      ? Math.round((wasteReports.length / expenses.length) * 100)
      : 0;

  return (
    <div className="space-y-6 py-6">
      <header className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/20">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-cyan-300/80">
              Budget Analytics
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-50">
              Measure spending and waste trends.
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Explore category breakdowns, predicted costs, and the highest waste drivers.
            </p>
          </div>

          <Button className="h-12 rounded-3xl bg-cyan-400 px-5 font-semibold text-slate-950 hover:bg-cyan-300">
            <Download className="mr-2 h-4 w-4" />
            Export report
          </Button>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-3">
        {[
          {
            title: "Monthly spend",
            value: `₱${totalSpend.toLocaleString()}`,
            badge: "Live from expenses",
            icon: Wallet,
          },
          {
            title: "Waste ratio",
            value: `${wasteRatio}%`,
            badge: "Based on waste reports",
            icon: TrendingUp,
          },
          {
            title: "Forecast",
            value: `₱${Math.round(totalSpend * 1.08).toLocaleString()}`,
            badge: "Estimated next cycle",
            icon: BarChart3,
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <Card
              key={item.title}
              className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/20"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
                    {item.title}
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold text-slate-50">
                    {item.value}
                  </h2>
                  <p className="mt-2 text-sm text-slate-400">{item.badge}</p>
                </div>

                <div className="rounded-3xl bg-slate-900/80 p-3 text-cyan-300">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle className="text-2xl text-slate-50">
                Spending trend
              </CardTitle>
              <p className="mt-1 text-sm text-slate-400">
                Track monthly grocery spend from real expense records.
              </p>
            </div>
            <Badge className="rounded-full bg-cyan-400/10 text-cyan-300">
              Live
            </Badge>
          </div>

          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={spendTrend}>
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid rgba(255,255,255,.1)",
                    borderRadius: "16px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="spend"
                  stroke="#22d3ee"
                  strokeWidth={4}
                  dot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/20">
          <CardTitle className="text-2xl text-slate-50">
            Category breakdown
          </CardTitle>
          <p className="mt-1 text-sm text-slate-400">
            Category distribution based on grocery expenses.
          </p>

          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={95}
                  label
                >
                  {categoryData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={colors[index % colors.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid rgba(255,255,255,.1)",
                    borderRadius: "16px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/20 xl:col-span-2">
          <CardTitle className="text-2xl text-slate-50">
            Most wasted items
          </CardTitle>
          <p className="mt-1 text-sm text-slate-400">
            Items with the highest waste contribution.
          </p>

          <div className="mt-6 space-y-4">
            {wasteItems.length === 0 ? (
              <p className="text-sm text-slate-500">No waste reports found.</p>
            ) : (
              wasteItems.map((item) => (
                <div key={item.label} className="rounded-3xl bg-slate-900/80 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-slate-400">{item.label}</p>
                      <p className="mt-1 text-lg font-semibold text-slate-100">
                        {item.value}
                      </p>
                    </div>
                    <div className="rounded-3xl bg-slate-950/80 px-3 py-2 text-sm text-cyan-300">
                      Live
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/20">
          <CardTitle className="text-2xl text-slate-50">
            Prediction pulse
          </CardTitle>
          <p className="mt-1 text-sm text-slate-400">
            Weekly forecast for grocery spend and waste adjustment.
          </p>

          <div className="mt-6 space-y-5">
            <div className="rounded-3xl bg-slate-900/80 p-4">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-slate-400">Weekly budget</p>
                <p className="text-lg font-semibold text-slate-50">
                  ₱{Math.round(totalSpend / 4 || 0).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="rounded-3xl bg-slate-900/80 p-4">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-slate-400">Food waste count</p>
                <p className="text-lg font-semibold text-slate-50">
                  {totalWaste}
                </p>
              </div>
            </div>

            <div className="rounded-3xl bg-slate-900/80 p-4">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-slate-400">Budget health</p>
                <Badge className="rounded-full bg-cyan-400/10 text-cyan-300">
                  Live
                </Badge>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}