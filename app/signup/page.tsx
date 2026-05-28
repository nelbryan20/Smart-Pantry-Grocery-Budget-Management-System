"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Lock, Mail, Package, User } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      alert("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    const user = data.user;

    if (user) {
      const { error: profileError } = await supabase.from("profiles").insert([
        {
          id: user.id,
          full_name: fullName,
          email: email,
        },
      ]);

      if (profileError) {
        alert(profileError.message);
        setLoading(false);
        return;
      }
    }

    alert("Account created successfully. Please login.");
    router.push("/login");

    setLoading(false);
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
            Create Account
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Sign up for Smart Pantry Grocery Budget
          </p>
        </div>

        <div className="mt-6 space-y-3">
          <div className="relative">
            <User className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-12 rounded-3xl border-white/10 bg-slate-950/80 pl-11"
            />
          </div>

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

          <div className="relative">
            <Lock className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
            <Input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-12 rounded-3xl border-white/10 bg-slate-950/80 pl-11"
            />
          </div>
        </div>

        <Button
          type="button"
          onClick={handleSignup}
          disabled={loading}
          className="mt-5 h-12 w-full rounded-3xl bg-cyan-400 font-semibold text-slate-950 hover:bg-cyan-300"
        >
          {loading ? "Creating..." : "Create Account"}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>

        <p className="mt-5 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-cyan-300">
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}