"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, CalendarDays } from "lucide-react";

interface PantryItem {
  id: string;
  item_name: string;
  category: string | null;
  expiration_date: string | null;
}

interface WasteReport {
  id: string;
  item_name: string;
  quantity_wasted: number | null;
}

interface GroceryExpense {
  id: string;
  price: number;
}

export default function InsightsPage() {
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [wasteReports, setWasteReports] = useState<WasteReport[]>([]);
  const [expenses, setExpenses] = useState<GroceryExpense[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: pantryData } = await supabase
        .from("pantry_items")
        .select("*");

      const { data: wasteData } = await supabase
        .from("waste_reports")
        .select("*");

      const { data: expenseData } = await supabase
        .from("grocery_expenses")
        .select("*");

      setPantryItems(pantryData || []);
      setWasteReports(wasteData || []);
      setExpenses(expenseData || []);
    };

    fetchData();
  }, []);

  const topWaste = useMemo(() => {
    const grouped: Record<string, number> = {};

    wasteReports.forEach((item) => {
      grouped[item.item_name] =
        (grouped[item.item_name] || 0) + Number(item.quantity_wasted || 1);
    });

    return Object.entries(grouped)
      .map(([item, percent]) => ({
        item,
        percent,
      }))
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 4);
  }, [wasteReports]);

  const weeklyBudget = useMemo(() => {
    const total = expenses.reduce(
      (sum, item) => sum + Number(item.price || 0),
      0
    );

    return Math.round(total / 4);
  }, [expenses]);

  const expiringItems = useMemo(() => {
    const today = new Date();

    return pantryItems
      .filter((item) => {
        if (!item.expiration_date) return false;

        const expiry = new Date(item.expiration_date);
        const diff =
          (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

        return diff <= 3;
      })
      .slice(0, 4);
  }, [pantryItems]);

  const suggestions = useMemo(() => {
    return expiringItems.map(
      (item) => `Use ${item.item_name} before it expires soon.`
    );
  }, [expiringItems]);

  return (
    <div className="space-y-6 py-6">
      <header className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/20">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-cyan-300/80">
              AI Insights
            </p>

            <h1 className="mt-2 text-3xl font-semibold text-slate-50">
              Smart recommendations for your pantry.
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Actionable advice for reducing waste, staying on budget, and planning meals.
            </p>
          </div>

          <Button className="h-12 rounded-3xl bg-cyan-400 px-5 font-semibold text-slate-950 hover:bg-cyan-300">
            Refresh insights
          </Button>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/20">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl text-slate-50">
                Top wasted items
              </CardTitle>

              <p className="mt-1 text-sm text-slate-400">
                The highest contributors to pantry waste.
              </p>
            </div>

            <Badge className="rounded-full bg-cyan-400/10 text-cyan-300">
              Priority
            </Badge>
          </div>

          <div className="mt-6 space-y-4">
            {topWaste.length === 0 ? (
              <p className="text-sm text-slate-500">No waste data found.</p>
            ) : (
              topWaste.map((item) => (
                <div key={item.item} className="rounded-3xl bg-slate-900/80 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-slate-400">{item.item}</p>
                      <p className="mt-1 text-lg font-semibold text-slate-100">
                        {item.percent}
                      </p>
                    </div>

                    <Badge className="rounded-full bg-amber-400/10 text-amber-300">
                      Waste
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
                Best budget plan
              </CardTitle>

              <p className="mt-1 text-sm text-slate-400">
                AI-driven recommendation for next shopping trip.
              </p>
            </div>

            <Sparkles className="h-6 w-6 text-cyan-300" />
          </div>

          <div className="mt-6 rounded-3xl bg-slate-900/80 p-5">
            <p className="text-sm text-slate-400">
              Keep the weekly grocery target to
            </p>

            <p className="mt-2 text-4xl font-semibold text-slate-50">
              ₱{weeklyBudget.toLocaleString()}
            </p>

            <p className="mt-3 text-sm text-slate-400">
              Based on actual grocery spending from your users.
            </p>
          </div>
        </Card>

        <Card className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/20">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl text-slate-50">
                Expiry prediction
              </CardTitle>

              <p className="mt-1 text-sm text-slate-400">
                Anticipated items that need action next.
              </p>
            </div>

            <CalendarDays className="h-6 w-6 text-cyan-300" />
          </div>

          <div className="mt-6 space-y-4">
            {expiringItems.length === 0 ? (
              <p className="text-sm text-slate-500">
                No expiring items found.
              </p>
            ) : (
              expiringItems.map((item) => (
                <div key={item.id} className="rounded-3xl bg-slate-900/80 p-4">
                  <p className="text-sm text-slate-300">
                    {item.item_name} will expire soon.
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Card className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/20">
        <CardHeader className="items-start gap-4">
          <div className="rounded-3xl bg-slate-900/80 p-3 text-cyan-300">
            <TrendingUp className="h-5 w-5" />
          </div>

          <div>
            <CardTitle className="text-2xl text-slate-50">
              Cook today suggestions
            </CardTitle>

            <p className="mt-2 text-sm text-slate-400">
              Recommendations that use urgent inventory items.
            </p>
          </div>
        </CardHeader>

        <CardContent className="mt-4 space-y-4">
          {suggestions.length === 0 ? (
            <p className="text-sm text-slate-500">
              No suggestions available.
            </p>
          ) : (
            suggestions.map((suggestion) => (
              <div
                key={suggestion}
                className="rounded-3xl bg-slate-900/80 p-4 text-slate-300"
              >
                {suggestion}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}