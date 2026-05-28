"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Package, Copy, RefreshCw } from "lucide-react";

export default function CreateHouseholdPage() {
  const router = useRouter();

  const [householdName, setHouseholdName] = useState("");
  const [householdId, setHouseholdId] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [newCodeLoading, setNewCodeLoading] = useState(false);

  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  useEffect(() => {
    const getExistingHousehold = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: household } = await supabase
        .from("households")
        .select("*")
        .eq("admin_id", user.id)
        .limit(1)
        .single();

      if (!household) return;

      setHouseholdId(household.id);
      setHouseholdName(household.household_name);

      const { data: invite } = await supabase
        .from("household_invites")
        .select("invite_code")
        .eq("household_id", household.id)
        .eq("is_used", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (invite) {
        setInviteCode(invite.invite_code);
      }
    };

    getExistingHousehold();
  }, []);

  const handleCreateHousehold = async () => {
    if (!householdName.trim()) {
      alert("Please enter household name");
      return;
    }

    setLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      alert("Please login first");
      router.push("/login");
      setLoading(false);
      return;
    }

    const code = generateInviteCode();

    const { data: household, error } = await supabase
      .from("households")
      .insert({
        household_name: householdName.trim(),
        admin_id: user.id,
      })
      .select()
      .single();

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    const { error: memberError } = await supabase
      .from("household_members")
      .insert({
        household_id: household.id,
        user_id: user.id,
        role: "admin",
      });

    if (memberError) {
      alert(memberError.message);
      setLoading(false);
      return;
    }

    const { error: inviteError } = await supabase
      .from("household_invites")
      .insert({
        household_id: household.id,
        invite_code: code,
        is_used: false,
      });

    if (inviteError) {
      alert(inviteError.message);
      setLoading(false);
      return;
    }

    setHouseholdId(household.id);
    setInviteCode(code);

    alert("Household created successfully!");
    setLoading(false);
  };

  const handleGenerateNewCode = async () => {
    if (!householdId) {
      alert("Create a household first");
      return;
    }

    setNewCodeLoading(true);

    const newCode = generateInviteCode();

    await supabase
      .from("household_invites")
      .update({
        is_used: true,
      })
      .eq("household_id", householdId)
      .eq("is_used", false);

    const { error } = await supabase
      .from("household_invites")
      .insert({
        household_id: householdId,
        invite_code: newCode,
        is_used: false,
      });

    if (error) {
      alert(error.message);
      setNewCodeLoading(false);
      return;
    }

    setInviteCode(newCode);
    alert("New invite code generated!");
    setNewCodeLoading(false);
  };

  const copyInviteCode = async () => {
    await navigator.clipboard.writeText(inviteCode);
    alert("Invite code copied!");
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div
        className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-6 shadow-xl"
        style={{ width: "100%", maxWidth: "460px" }}
      >
        <div className="text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-3xl bg-cyan-400 text-slate-950">
            <Package className="h-7 w-7" />
          </div>

          <h1 className="mt-5 text-2xl font-semibold text-slate-50">
            Create Household
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Create a household and share the invite code with mobile users.
          </p>
        </div>

        <div className="mt-6">
          <Input
            placeholder="Enter household name"
            value={householdName}
            onChange={(e) => setHouseholdName(e.target.value)}
            disabled={!!householdId}
            className="h-12 rounded-3xl border-white/10 bg-slate-950/80"
          />
        </div>

        {!householdId && (
          <Button
            type="button"
            onClick={handleCreateHousehold}
            disabled={loading}
            className="mt-5 h-12 w-full rounded-3xl bg-cyan-400 font-semibold text-slate-950 hover:bg-cyan-300"
          >
            {loading ? "Creating..." : "Create Household"}
          </Button>
        )}

        {inviteCode && (
          <div className="mt-6 rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-center">
            <p className="text-sm text-slate-400">Invite Code</p>

            <p className="mt-2 text-3xl font-bold tracking-[0.2em] text-cyan-300">
              {inviteCode}
            </p>

            <div className="mt-4 flex gap-2">
              <Button
                type="button"
                onClick={copyInviteCode}
                variant="outline"
                className="flex-1 rounded-3xl border-cyan-400/20 text-cyan-300"
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </Button>

              <Button
                type="button"
                onClick={handleGenerateNewCode}
                disabled={newCodeLoading}
                className="flex-1 rounded-3xl bg-cyan-400 font-semibold text-slate-950 hover:bg-cyan-300"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {newCodeLoading ? "Generating..." : "New Code"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}