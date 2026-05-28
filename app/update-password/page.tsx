"use client";

import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Lock, Package } from "lucide-react";

export default function UpdatePasswordPage() {
  const router = useRouter();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      alert("Please fill in both password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Password updated successfully!");
    router.push("/login");
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-[420px] rounded-[2rem] border border-white/10 bg-slate-950/90 p-6 shadow-xl">
        <div className="text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-3xl bg-cyan-400 text-slate-950">
            <Package className="h-7 w-7" />
          </div>

          <h1 className="mt-5 text-2xl font-semibold text-slate-50">
            Update Password
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Enter your new password below.
          </p>
        </div>

        <div className="mt-6 space-y-3">
          <div className="relative">
            <Lock className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
            <Input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="h-12 rounded-3xl border-white/10 bg-slate-950/80 pl-11"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
            <Input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-12 rounded-3xl border-white/10 bg-slate-950/80 pl-11"
            />
          </div>
        </div>

        <Button
          type="button"
          onClick={handleUpdatePassword}
          disabled={loading}
          className="mt-5 h-12 w-full rounded-3xl bg-cyan-400 font-semibold text-slate-950 hover:bg-cyan-300"
        >
          {loading ? "Updating..." : "Update Password"}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </main>
  );
}