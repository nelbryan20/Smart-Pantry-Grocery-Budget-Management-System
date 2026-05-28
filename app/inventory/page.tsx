"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Filter, Plus, Search, Pencil, Trash2 } from "lucide-react";

interface PantryItem {
  id: string;
  item_name: string;
  category: string | null;
  quantity: number | null;
  unit: string | null;
  expiration_date: string | null;
  status: string | null;
}

const categories = ["All", "Dairy", "Protein", "Meat", "Vegetables", "Bakery"];

export default function InventoryPage() {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);

  const fetchInventory = async () => {
    const { data, error } = await supabase
      .from("pantry_items")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching inventory:", error.message);
      return;
    }

    setPantryItems(data || []);
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const getDaysUntilExpiry = (date: string | null) => {
    if (!date) return null;

    const today = new Date();
    const expiry = new Date(date);

    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);

    return Math.ceil(
      (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
  };

  const getAutoStatus = (item: PantryItem) => {
    const days = getDaysUntilExpiry(item.expiration_date);

    if (days === null) return item.status || "Good";
    if (days < 0) return "Expired";
    if (days <= 3) return "Expiring Soon";

    return "Good";
  };

  const urgentItems = useMemo(() => {
    return pantryItems.filter((item) => {
      const status = getAutoStatus(item);
      return status === "Expired" || status === "Expiring Soon";
    });
  }, [pantryItems]);

  const visibleItems = useMemo(() => {
    return pantryItems.filter((item) => {
      const query = search.toLowerCase();
      const itemName = item.item_name?.toLowerCase() || "";
      const category = item.category?.toLowerCase() || "";

      const matchesSearch =
        itemName.includes(query) || category.includes(query);

      const matchesCategory = filter === "All" || item.category === filter;

      return matchesSearch && matchesCategory;
    });
  }, [search, filter, pantryItems]);

  return (
    <div className="space-y-6 py-6">
      <header className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/20">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-cyan-300/80">
              Pantry Inventory
            </p>

            <h1 className="mt-2 text-3xl font-semibold text-slate-50">
              Manage fresh stock and expiry.
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Filter items, track expiry dates, and keep quantities updated before grocery day.
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

      <section className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
        <Card className="rounded-[2rem] border border-white/10 bg-slate-950/90 shadow-xl shadow-slate-950/20">
          <CardHeader className="px-6 pt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-2xl text-slate-50">
                  Inventory table
                </CardTitle>

                <p className="mt-1 text-sm text-slate-400">
                  Search, filter, and manage pantry items in one place.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative w-full sm:w-72">
                  <Search className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search items"
                    className="h-12 rounded-3xl border-white/10 bg-slate-950/80 pl-11 text-slate-100 placeholder:text-slate-500"
                  />
                </div>

                <Button
                  variant="outline"
                  className="h-12 rounded-3xl border-white/10 text-slate-200 hover:bg-white/5"
                >
                  <Filter className="mr-2 h-4 w-4" />
                  {filter}
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-hidden rounded-[1.75rem] border-t border-white/10">
              <table className="w-full border-separate border-spacing-0 text-left text-sm text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400">
                  <tr>
                    <th className="px-6 py-4">Item</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Quantity</th>
                    <th className="px-6 py-4">Expiry</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {visibleItems.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-10 text-center text-slate-500"
                      >
                        No pantry items found.
                      </td>
                    </tr>
                  ) : (
                    visibleItems.map((item) => {
                      const status = getAutoStatus(item);

                      return (
                        <tr
                          key={item.id}
                          className="border-t border-white/10 bg-slate-950/90 hover:bg-slate-900/90"
                        >
                          <td className="px-6 py-4 font-semibold text-slate-50">
                            {item.item_name}
                          </td>

                          <td className="px-6 py-4">
                            {item.category || "Uncategorized"}
                          </td>

                          <td className="px-6 py-4">
                            {item.quantity || 0} {item.unit || ""}
                          </td>

                          <td className="px-6 py-4">
                            {item.expiration_date || "No expiry"}
                          </td>

                          <td className="px-6 py-4">
                            <Badge
                              className={`rounded-full px-3 py-1 text-[0.7rem] ${
                                status === "Expired"
                                  ? "bg-red-500/15 text-red-300"
                                  : status === "Expiring Soon"
                                  ? "bg-amber-500/15 text-amber-300"
                                  : "bg-cyan-500/15 text-cyan-300"
                              }`}
                            >
                              {status}
                            </Badge>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                className="h-10 rounded-3xl border-white/10 px-3 text-slate-300 hover:bg-white/5"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>

                              <Button
                                variant="outline"
                                className="h-10 rounded-3xl border-white/10 px-3 text-slate-300 hover:bg-white/5"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>

          <CardFooter className="justify-between px-6">
            <p className="text-sm text-slate-400">
              Showing {visibleItems.length} of {pantryItems.length} pantry items.
            </p>

            <Button
              onClick={fetchInventory}
              className="rounded-3xl bg-cyan-400 px-4 text-slate-950 hover:bg-cyan-300"
            >
              Sync inventory
            </Button>
          </CardFooter>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/20">
            <CardTitle className="text-xl text-slate-50">
              Category snapshot
            </CardTitle>

            <div className="mt-4 space-y-3">
              {categories.slice(1).map((category) => (
                <div key={category} className="rounded-3xl bg-slate-900/80 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-slate-400">{category}</p>

                      <p className="mt-1 text-lg font-semibold text-slate-100">
                        {
                          pantryItems.filter((item) => item.category === category)
                            .length
                        }{" "}
                        items
                      </p>
                    </div>

                    <Badge className="rounded-full bg-cyan-400/10 text-cyan-300">
                      Live
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/20">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-xl text-slate-50">
                  Best action plan
                </CardTitle>

                <p className="mt-2 text-sm text-slate-400">
                  Use these inventory actions to reduce waste this week.
                </p>
              </div>

              <Badge
                className={`rounded-full ${
                  urgentItems.length > 0
                    ? "bg-red-400/10 text-red-300"
                    : "bg-emerald-400/10 text-emerald-300"
                }`}
              >
                {urgentItems.length > 0 ? "Action Needed" : "Healthy"}
              </Badge>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-3xl bg-slate-900/80 p-4">
                <h3 className="text-sm font-semibold text-slate-100">
                  Urgent expiry
                </h3>

                {urgentItems.length > 0 ? (
                  <div className="mt-2 space-y-2">
                    {urgentItems.map((item) => (
                      <p key={item.id} className="text-sm text-slate-400">
                        {item.item_name} — {getAutoStatus(item)} on{" "}
                        {item.expiration_date}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-400">
                    No urgent expiry items.
                  </p>
                )}
              </div>

              <div className="rounded-3xl bg-slate-900/80 p-4">
                <h3 className="text-sm font-semibold text-slate-100">
                  Plan a fresh stock day
                </h3>

                <p className="mt-2 text-sm text-slate-400">
                  Use current pantry items first before adding more groceries.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}