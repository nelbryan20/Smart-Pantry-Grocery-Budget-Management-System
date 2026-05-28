"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle,
  Download,
  Package,
  Plus,
  TrendingUp,
  Wallet,
} from "lucide-react";
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

interface PantryItem {
  id: string;
  item_name: string;
  category: string | null;
  expiration_date: string | null;
  price: number | null;
  created_at: string | null;
  household_id?: string | null;
}

interface GroceryExpense {
  id: string;
  category: string | null;
  price: number | null;
  purchase_date: string | null;
}

interface WasteReport {
  id: string;
  item_name: string;
  quantity_wasted: number | null;
  wasted_date: string | null;
}

const colors = ["#0f766e", "#14b8a6", "#5eead4", "#99f6e4", "#ccfbf1"];

export default function DashboardPage() {
  const router = useRouter();

  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [expenses, setExpenses] = useState<GroceryExpense[]>([]);
  const [wasteReports, setWasteReports] = useState<WasteReport[]>([]);

  const createExpiryAlerts = async (items: PantryItem[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const item of items) {
      if (!item.expiration_date || !item.household_id) continue;

      const expiry = new Date(item.expiration_date);
      expiry.setHours(0, 0, 0, 0);

      const diffDays =
        (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

      if (diffDays > 3) continue;

      const title = diffDays < 0 ? "Expired Item" : "Expiring Soon";
      const message =
        diffDays < 0
          ? `${item.item_name} has expired. Consider marking it as wasted.`
          : `${item.item_name} expires in ${diffDays} day(s).`;

      const { data: existingAlert } = await supabase
        .from("alerts")
        .select("id")
        .eq("household_id", item.household_id)
        .eq("title", title)
        .eq("message", message)
        .limit(1)
        .maybeSingle();

      if (!existingAlert) {
        await supabase.from("alerts").insert({
          household_id: item.household_id,
          title,
          message,
          alert_type: "expiry",
          is_read: false,
        });
      }
    }
  };

  const fetchDashboardData = async () => {
    const { data: pantryData } = await supabase
      .from("pantry_items")
      .select(
        "id, item_name, category, expiration_date, price, created_at, household_id"
      );

    const { data: expenseData } = await supabase
      .from("grocery_expenses")
      .select("id, category, price, purchase_date");

    const { data: wasteData } = await supabase
      .from("waste_reports")
      .select("id, item_name, quantity_wasted, wasted_date");

    const items = pantryData || [];

    setPantryItems(items);
    setExpenses(expenseData || []);
    setWasteReports(wasteData || []);

    await createExpiryAlerts(items);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleMarkAsWasted = async (item: PantryItem) => {
    const confirmWaste = window.confirm(
      `Mark ${item.item_name} as wasted? This will move it to Waste Reports.`
    );

    if (!confirmWaste) return;

    const today = new Date().toISOString().split("T")[0];

    const { error: wasteError } = await supabase.from("waste_reports").insert({
      household_id: item.household_id,
      item_name: item.item_name,
      category: item.category,
      quantity_wasted: 1,
      reason: "Expired item",
      wasted_date: today,
    });

    if (wasteError) {
      alert(wasteError.message);
      return;
    }

    const { error: deleteError } = await supabase
      .from("pantry_items")
      .delete()
      .eq("id", item.id);

    if (deleteError) {
      alert(deleteError.message);
      return;
    }

    alert(`${item.item_name} marked as wasted.`);
    fetchDashboardData();
  };

  const totalItems = pantryItems.length;

  const urgentExpiryItems = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return pantryItems.filter((item) => {
      if (!item.expiration_date) return false;

      const expiry = new Date(item.expiration_date);
      expiry.setHours(0, 0, 0, 0);

      const diffDays =
        (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

      return diffDays <= 3;
    });
  }, [pantryItems]);

  const monthlySpend = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const expenseSpend = expenses
      .filter((expense) => {
        if (!expense.purchase_date) return false;
        const date = new Date(expense.purchase_date);
        return (
          date.getMonth() === currentMonth &&
          date.getFullYear() === currentYear
        );
      })
      .reduce((sum, expense) => sum + Number(expense.price || 0), 0);

    if (expenseSpend > 0) return expenseSpend;

    return pantryItems
      .filter((item) => {
        if (!item.created_at) return true;
        const date = new Date(item.created_at);
        return (
          date.getMonth() === currentMonth &&
          date.getFullYear() === currentYear
        );
      })
      .reduce((sum, item) => sum + Number(item.price || 0), 0);
  }, [expenses, pantryItems]);

  const wasteScore = useMemo(() => {
    const denominator = pantryItems.length + wasteReports.length;
    if (denominator === 0) return 0;

    const totalWasted = wasteReports.reduce(
      (sum, item) => sum + Number(item.quantity_wasted || 1),
      0
    );

    return Math.round((totalWasted / denominator) * 100);
  }, [wasteReports, pantryItems]);

  const spendData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    const grouped: Record<string, number> = {};

    months.forEach((month) => {
      grouped[month] = 0;
    });

    if (expenses.length > 0) {
      expenses.forEach((expense) => {
        if (!expense.purchase_date) return;

        const date = new Date(expense.purchase_date);
        const month = date.toLocaleString("en-US", { month: "short" });

        if (grouped[month] !== undefined) {
          grouped[month] += Number(expense.price || 0);
        }
      });
    } else {
      pantryItems.forEach((item) => {
        if (!item.created_at) return;

        const date = new Date(item.created_at);
        const month = date.toLocaleString("en-US", { month: "short" });

        if (grouped[month] !== undefined) {
          grouped[month] += Number(item.price || 0);
        }
      });
    }

    return months.map((month) => ({
      month,
      spend: grouped[month],
    }));
  }, [expenses, pantryItems]);

  const categoryData = useMemo(() => {
    const grouped: Record<string, number> = {};

    const source =
      expenses.length > 0
        ? expenses.map((item) => ({
            category: item.category,
            price: item.price,
          }))
        : pantryItems.map((item) => ({
            category: item.category,
            price: item.price,
          }));

    source.forEach((item) => {
      const category = item.category || "Others";
      grouped[category] = (grouped[category] || 0) + Number(item.price || 0);
    });

    const result = Object.entries(grouped).map(([name, value]) => ({
      name,
      value,
    }));

    return result.length > 0 ? result : [{ name: "No data", value: 1 }];
  }, [expenses, pantryItems]);

  const stats = [
    {
      icon: Package,
      title: "Total Pantry Items",
      value: totalItems,
      desc: "Live from Supabase",
    },
    {
      icon: Wallet,
      title: "Monthly Spend",
      value: `₱${monthlySpend.toLocaleString()}`,
      desc:
        expenses.length > 0
          ? "From grocery expenses"
          : "From pantry item prices",
    },
    {
      icon: AlertTriangle,
      title: "Expiring Soon",
      value: `${urgentExpiryItems.length} items`,
      desc: "Expired or within 3 days",
    },
    {
      icon: TrendingUp,
      title: "Waste Score",
      value: `${wasteScore}%`,
      desc: "Confirmed wasted items",
    },
  ];

  return (
    <div className="space-y-6 py-6">
      <header className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/20">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-cyan-300/80">
              Household Admin
            </p>

            <h1 className="mt-2 text-3xl font-semibold text-slate-50">
              Smart Pantry & Grocery Budget
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Monitor inventory, spending, food waste, and grocery planning in
              one dashboard.
            </p>
          </div>

          <Button
            onClick={() => router.push("/inventory/add")}
            className="h-12 rounded-3xl bg-cyan-400 px-5 font-semibold text-slate-950 hover:bg-cyan-300"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <Card
              key={stat.title}
              className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-2 shadow-xl shadow-slate-950/20"
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="grid h-12 w-12 place-items-center rounded-3xl bg-cyan-400/10 text-cyan-300">
                    <Icon className="h-6 w-6" />
                  </div>

                  <Badge className="rounded-full bg-cyan-400/10 text-cyan-300">
                    Live
                  </Badge>
                </div>

                <p className="mt-6 text-sm text-slate-400">{stat.title}</p>

                <h2 className="mt-2 text-3xl font-semibold text-slate-50">
                  {stat.value}
                </h2>

                <p className="mt-2 text-sm text-cyan-300">{stat.desc}</p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <Card className="rounded-[2rem] border border-white/10 bg-slate-950/90 shadow-xl shadow-slate-950/20">
        <CardHeader>
          <CardTitle className="text-xl text-slate-50">
            Expiring Soon Details
          </CardTitle>
        </CardHeader>

        <CardContent>
          {urgentExpiryItems.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {urgentExpiryItems.map((item) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const expiry = new Date(item.expiration_date!);
                expiry.setHours(0, 0, 0, 0);

                const diffDays =
                  (expiry.getTime() - today.getTime()) /
                  (1000 * 60 * 60 * 24);

                return (
                  <div
                    key={item.id}
                    className="rounded-3xl bg-slate-900/80 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-slate-100">
                        {item.item_name}
                      </p>

                      <Badge
                        className={
                          diffDays < 0
                            ? "rounded-full bg-red-500/15 text-red-300"
                            : "rounded-full bg-amber-500/15 text-amber-300"
                        }
                      >
                        {diffDays < 0 ? "Expired" : "Expiring Soon"}
                      </Badge>
                    </div>

                    <p className="mt-2 text-sm text-slate-400">
                      {diffDays < 0
                        ? `Expired on ${item.expiration_date}`
                        : `Expires on ${item.expiration_date}`}
                    </p>

                    <p className="mt-1 text-sm text-cyan-300">
                      Category: {item.category || "Uncategorized"}
                    </p>

                    <Button
                      onClick={() => handleMarkAsWasted(item)}
                      className="mt-4 h-10 w-full rounded-3xl bg-red-500/20 px-4 text-red-300 hover:bg-red-500/30"
                    >
                      Mark as Wasted
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No expiring items.</p>
          )}
        </CardContent>
      </Card>

      <section className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
        <Card className="rounded-[2rem] border border-white/10 bg-slate-950/90 shadow-xl shadow-slate-950/20">
          <CardHeader className="px-6 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl text-slate-50">
                  Monthly Grocery Spending
                </CardTitle>

                <p className="mt-1 text-sm text-slate-400">
                  Synced from grocery expenses or pantry item prices.
                </p>
              </div>

              <Button
                variant="outline"
                className="h-11 rounded-3xl border-white/10 text-slate-200 hover:bg-white/5"
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={spendData}>
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="spend"
                    stroke="#22d3ee"
                    strokeWidth={4}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/20">
          <CardTitle className="text-xl text-slate-50">
            Category Breakdown
          </CardTitle>

          <div className="mt-4 h-72">
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
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>
    </div>
  );
}