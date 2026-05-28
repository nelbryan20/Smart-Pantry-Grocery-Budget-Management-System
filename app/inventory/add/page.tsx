"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Package } from "lucide-react";

export default function AddItemPage() {
  const router = useRouter();

  const [householdId, setHouseholdId] = useState("");
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("");
  const [price, setPrice] = useState("0");
  const [expirationDate, setExpirationDate] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getHousehold = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from("household_members")
        .select("household_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (data) {
        setHouseholdId(data.household_id);
      }
    };

    getHousehold();
  }, [router]);

  const handleAddItem = async () => {
    if (!itemName.trim()) {
      alert("Please enter item name");
      return;
    }

    if (!category.trim()) {
      alert("Please enter category");
      return;
    }

    if (!unit.trim()) {
      alert("Please enter unit");
      return;
    }

    if (!householdId) {
      alert("Please create a household first");
      return;
    }

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("pantry_items").insert({
      household_id: householdId,
      added_by: user?.id,
      item_name: itemName.trim(),
      category: category.trim(),
      quantity: Number(quantity),
      unit: unit.trim(),
      price: Number(price),
      expiration_date: expirationDate || null,
      status: "Good",
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    await supabase.from("grocery_expenses").insert({
      household_id: householdId,
      added_by: user?.id,
      item_name: itemName.trim(),
      category: category.trim(),
      quantity: Number(quantity),
      unit: unit.trim(),
      price: Number(price),
      purchase_date: new Date().toISOString().split("T")[0],
    });

    alert("Item added successfully!");
    router.push("/inventory");
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div
        className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-6 shadow-xl"
        style={{ width: "100%", maxWidth: "520px" }}
      >
        <div className="text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-3xl bg-cyan-400 text-slate-950">
            <Package className="h-7 w-7" />
          </div>

          <h1 className="mt-5 text-2xl font-semibold text-slate-50">
            Add Pantry Item
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Fill in the details below to add an item to your household pantry.
          </p>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">
              Item Name
            </label>
            <Input
              placeholder="Example: Milk, Chicken, Rice"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="h-12 rounded-3xl border-white/10 bg-slate-950/80"
            />
            <p className="mt-1 text-xs text-slate-500">
              Type the name of the food or grocery item.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">
              Category
            </label>
            <Input
              placeholder="Example: Dairy, Meat, Vegetables, Canned Goods"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-12 rounded-3xl border-white/10 bg-slate-950/80"
            />
            <p className="mt-1 text-xs text-slate-500">
              Use categories like Dairy, Meat, Vegetables, Bakery, Protein, or Canned Goods.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">
              Quantity
            </label>
            <Input
              type="number"
              placeholder="Example: 1, 2, 5"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="h-12 rounded-3xl border-white/10 bg-slate-950/80"
            />
            <p className="mt-1 text-xs text-slate-500">
              Enter how many items you have.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">
              Unit
            </label>
            <Input
              placeholder="Example: pcs, kg, pack, bottle, can"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="h-12 rounded-3xl border-white/10 bg-slate-950/80"
            />
            <p className="mt-1 text-xs text-slate-500">
              Use pcs for pieces, kg for kilo, bottle for drinks, pack for packaged items.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">
              Price
            </label>
            <Input
              type="number"
              placeholder="Example: 120"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="h-12 rounded-3xl border-white/10 bg-slate-950/80"
            />
            <p className="mt-1 text-xs text-slate-500">
              Enter the price in pesos. Example: 120 means ₱120.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">
              Expiration Date
            </label>
            <Input
              type="date"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              className="h-12 rounded-3xl border-white/10 bg-slate-950/80"
            />
            <p className="mt-1 text-xs text-slate-500">
              Select the date when the item will expire. Leave blank if it has no expiry date.
            </p>
          </div>
        </div>

        <Button
          type="button"
          onClick={handleAddItem}
          disabled={loading}
          className="mt-5 h-12 w-full rounded-3xl bg-cyan-400 font-semibold text-slate-950 hover:bg-cyan-300"
        >
          {loading ? "Adding..." : "Add Item"}
        </Button>
      </div>
    </main>
  );
}