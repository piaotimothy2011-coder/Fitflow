"use client";
import React, { useState } from "react";
import { useApp } from "./AppState";
import { PrimaryButton, GhostButton } from "./ui";
import { Icon, LogoMark } from "./icons";

export default function WelcomeScreen() {
  const { signUp, signUpEmail, signInEmail, cloudEnabled } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const features = [
    "Survey-built training plans",
    "Per-set logging + rest timer",
    "Recovery-aware smart plans",
    "Macro & water tracking",
  ];

  async function handleCloudSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setInfo(null); setBusy(true);
    try {
      const res = mode === "signup"
        ? await signUpEmail(name, email.trim(), password)
        : await signInEmail(email.trim(), password);
      if (res.error) setError(res.error);
      else if (res.needsConfirm) setInfo("Check your email to confirm your account, then sign in.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "w-full rounded-button bg-bgCard border border-borderStrong px-4 py-3.5 text-[15px] outline-none focus:border-accentGreen";

  return (
    <div className="min-h-screen flex flex-col px-7 py-10">
      <div className="flex-1 flex flex-col justify-center">
        <LogoMark size={60} className="mb-5" />
        <div className="font-display text-7xl text-accentGreen leading-none">FITFLOW</div>
        <p className="text-[19px] mt-3 font-medium">
          Train <span className="text-accentGreen font-bold">SMART</span>. Move every day.
        </p>
        <p className="text-textMuted text-[15px] mt-2 max-w-[300px]">
          Personalized workouts, smart progression, and nutrition — that adapt to you.
        </p>

        <div className="mt-10 space-y-3">
          {features.map((f) => (
            <div key={f} className="flex items-center gap-3 text-[15px] text-white/90">
              <span className="text-accentGreen shrink-0"><Icon name="check" size={18} /></span>{f}
            </div>
          ))}
        </div>
      </div>

      {/* ---- Cloud mode: real email + password auth ---- */}
      {cloudEnabled ? (
        !showForm ? (
          <div className="space-y-3 pb-4">
            <PrimaryButton onClick={() => { setShowForm(true); setMode("signup"); }}>
              Get started
            </PrimaryButton>
            <GhostButton onClick={() => { setShowForm(true); setMode("signin"); }}>
              I already have an account
            </GhostButton>
            <p className="text-center text-textFaint text-[13px]">
              Your data syncs securely to the cloud, across devices.
            </p>
          </div>
        ) : (
          <form className="space-y-3 pb-4 ff-pop" onSubmit={handleCloudSubmit}>
            {mode === "signup" && (
              <input
                autoFocus value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Your name" className={inputCls}
              />
            )}
            <input
              value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="Email" type="email" autoComplete="email" className={inputCls}
            />
            <input
              value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 6 chars)" type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              className={inputCls}
            />
            {error && <p className="text-red-400 text-[13px]">{error}</p>}
            {info && <p className="text-accentGreen text-[13px]">{info}</p>}
            <PrimaryButton type="submit" disabled={busy || !email.trim() || password.length < 6}>
              {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
            </PrimaryButton>
            <button
              type="button"
              onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setError(null); setInfo(null); }}
              className="w-full text-center text-textMuted text-[13px] py-1"
            >
              {mode === "signup" ? "Have an account? Sign in" : "New here? Create an account"}
            </button>
            <GhostButton onClick={() => { setShowForm(false); setError(null); setInfo(null); }}>
              Back
            </GhostButton>
          </form>
        )
      ) : (
        /* ---- Local-only fallback (no Supabase configured) ---- */
        !showForm ? (
          <div className="space-y-3 pb-4">
            <PrimaryButton onClick={() => setShowForm(true)}>Get started</PrimaryButton>
            <p className="text-center text-textFaint text-[13px]">
              All data stays in your browser. No account server required.
            </p>
          </div>
        ) : (
          <form
            className="space-y-3 pb-4 ff-pop"
            onSubmit={(e) => { e.preventDefault(); signUp(name, email || undefined); }}
          >
            <input
              autoFocus value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Your name" className={inputCls}
            />
            <input
              value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="Email (optional)" type="email" className={inputCls}
            />
            <PrimaryButton type="submit" disabled={!name.trim()}>Continue</PrimaryButton>
            <GhostButton onClick={() => setShowForm(false)}>Back</GhostButton>
          </form>
        )
      )}
    </div>
  );
}
