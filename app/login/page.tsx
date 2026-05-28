"use client";

import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Lock, Mail, Package } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Please enter your email and password.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    if (!data.session) {
      alert("Login session not created.");
      return;
    }

    router.push("/dashboard");
  };

  const handleForgotPassword = async () => {
    if (!email) {
      alert("Please enter your email address first.");
      return;
    }

    setResetLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/update-password`,
    });

    setResetLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Password reset email sent. Please check your inbox.");
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div
        className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-6 shadow-xl"
        style={{ width: "100%", maxWidth: "420px" }}
      >
        <div className="text-center">
          <div
            className="mx-auto grid place-items-center rounded-3xl bg-cyan-400 text-slate-950"
            style={{ width: "56px", height: "56px" }}
          >
            <Package className="h-7 w-7" />
          </div>

          <h1 className="mt-5 text-2xl font-semibold text-slate-50">
            Welcome Back
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Login to Smart Pantry Grocery Budget
          </p>
        </div>

        <div className="mt-6 space-y-3">
          <div className="relative">
            <Mail className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 rounded-3xl border-white/10 bg-slate-950/80 pl-11"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 rounded-3xl border-white/10 bg-slate-950/80 pl-11"
            />
          </div>
        </div>

        <div className="mt-3 text-right">
          <button
            type="button"
            onClick={handleForgotPassword}
            disabled={resetLoading}
            className="text-sm font-medium text-cyan-300 hover:text-cyan-200"
          >
            {resetLoading ? "Sending..." : "Forgot Password?"}
          </button>
        </div>

        <Button
          type="button"
          onClick={handleLogin}
          disabled={loading}
          className="mt-5 h-12 w-full rounded-3xl bg-cyan-400 font-semibold text-slate-950 hover:bg-cyan-300"
        >
          {loading ? "Logging in..." : "Login"}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>

        <p className="mt-5 text-center text-sm text-slate-400">
          Don’t have an account?{" "}
          <Link href="/signup" className="font-medium text-cyan-300">
            Sign Up
          </Link>
        </p>
      </div>
    </main>
  );
}