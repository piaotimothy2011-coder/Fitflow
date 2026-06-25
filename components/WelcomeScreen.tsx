"use client";
import React, { useState } from "react";
import { useApp } from "./AppState";
import { PrimaryButton, GhostButton } from "./ui";
import { Icon, LogoMark } from "./icons";

function Background() {
  const particles = [
    { l: "12%", d: "0s", dur: "9s" }, { l: "28%", d: "2.5s", dur: "11s" },
    { l: "45%", d: "1.2s", dur: "8s" }, { l: "63%", d: "3.4s", dur: "12s" },
    { l: "78%", d: "0.8s", dur: "10s" }, { l: "90%", d: "2s", dur: "9.5s" },
  ];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* tech grid (masked to a soft circle) */}
      <div className="absolute inset-0 ff-grid opacity-[0.12]" />

      {/* drifting aurora glows */}
      <div className="absolute -top-28 -left-24 w-[440px] h-[440px] rounded-full blur-[90px] opacity-50"
        style={{ background: "radial-gradient(circle, #22C55E, transparent 68%)", animation: "ff-aurora1 16s ease-in-out infinite" }} />
      <div className="absolute top-1/4 -right-32 w-[500px] h-[500px] rounded-full blur-[100px] opacity-40"
        style={{ background: "radial-gradient(circle, #4ADE80, transparent 68%)", animation: "ff-aurora2 20s ease-in-out infinite" }} />
      <div className="absolute -bottom-24 left-1/4 w-[400px] h-[400px] rounded-full blur-[90px] opacity-35"
        style={{ background: "radial-gradient(circle, #0EA5E9, transparent 70%)", animation: "ff-aurora3 24s ease-in-out infinite" }} />

      {/* sweeping scan light */}
      <div className="absolute inset-x-0 h-1/3"
        style={{ background: "linear-gradient(to bottom, transparent, rgba(74,222,128,0.10), transparent)", animation: "ff-scan 9s ease-in-out infinite" }} />

      {/* rising particles */}
      {particles.map((p, i) => (
        <span key={i} className="ff-particle absolute bottom-24 w-1 h-1 rounded-full bg-accentGreen/70"
          style={{ left: p.l, animationDelay: p.d, animationDuration: p.dur }} />
      ))}

      {/* legibility vignette */}
      <div className="absolute inset-0"
        style={{ background: "radial-gradient(120% 90% at 50% 0%, transparent 40%, rgba(10,10,10,0.55) 100%)" }} />
    </div>
  );
}

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

  const pillars: { icon: "strength" | "spark" | "flame" | "diet"; text: string }[] = [
    { icon: "strength", text: "Custom plan from a 60-second quiz" },
    { icon: "spark", text: "Weights auto-progress every session" },
    { icon: "flame", text: "Recovery-aware — trains fresh muscles" },
    { icon: "diet", text: "Macros, water & PRs in one place" },
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
    "w-full rounded-button bg-bgCard/80 backdrop-blur border border-borderStrong px-4 py-3.5 text-[15px] outline-none focus:border-accentGreen";

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Background />
      <div className="relative z-10 min-h-screen flex flex-col px-7 py-10">
        <div className="flex-1 flex flex-col justify-center">
          <LogoMark size={60} className="mb-5 ff-float" />
          <div className="font-display text-7xl text-accentGreen leading-none">FITFLOW</div>
          <p className="text-[22px] mt-3 font-semibold leading-snug">
            Your AI personal trainer.<br />Train <span className="text-accentGreen">SMART</span>, move every day.
          </p>

          <div className="mt-9 space-y-2.5">
            {pillars.map((p) => (
              <div key={p.text} className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-accentGreen/15 text-accentGreen flex items-center justify-center shrink-0">
                  <Icon name={p.icon} size={18} />
                </span>
                <span className="text-[14.5px] text-white/90 font-medium">{p.text}</span>
              </div>
            ))}
          </div>
        </div>

        {cloudEnabled ? (
          !showForm ? (
            <div className="space-y-3 pb-4">
              <PrimaryButton onClick={() => { setShowForm(true); setMode("signup"); }}>Get started</PrimaryButton>
              <GhostButton onClick={() => { setShowForm(true); setMode("signin"); }}>I already have an account</GhostButton>
              <p className="text-center text-textFaint text-[13px]">Your data syncs securely to the cloud, across devices.</p>
            </div>
          ) : (
            <form className="space-y-3 pb-4 ff-pop" onSubmit={handleCloudSubmit}>
              {mode === "signup" && (
                <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={inputCls} />
              )}
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" autoComplete="email" className={inputCls} />
              <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (min 6 chars)" type="password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"} className={inputCls} />
              {error && <p className="text-red-400 text-[13px]">{error}</p>}
              {info && <p className="text-accentGreen text-[13px]">{info}</p>}
              <PrimaryButton type="submit" disabled={busy || !email.trim() || password.length < 6}>
                {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
              </PrimaryButton>
              <button type="button" onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setError(null); setInfo(null); }}
                className="w-full text-center text-textMuted text-[13px] py-1">
                {mode === "signup" ? "Have an account? Sign in" : "New here? Create an account"}
              </button>
              <GhostButton onClick={() => { setShowForm(false); setError(null); setInfo(null); }}>Back</GhostButton>
            </form>
          )
        ) : (
          !showForm ? (
            <div className="space-y-3 pb-4">
              <PrimaryButton onClick={() => setShowForm(true)}>Get started</PrimaryButton>
              <p className="text-center text-textFaint text-[13px]">All data stays in your browser. No account server required.</p>
            </div>
          ) : (
            <form className="space-y-3 pb-4 ff-pop" onSubmit={(e) => { e.preventDefault(); signUp(name, email || undefined); }}>
              <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={inputCls} />
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optional)" type="email" className={inputCls} />
              <PrimaryButton type="submit" disabled={!name.trim()}>Continue</PrimaryButton>
              <GhostButton onClick={() => setShowForm(false)}>Back</GhostButton>
            </form>
          )
        )}
      </div>
    </div>
  );
}
