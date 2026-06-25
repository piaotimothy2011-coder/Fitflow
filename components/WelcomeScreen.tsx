"use client";
import React, { useState } from "react";
import { useApp } from "./AppState";
import { PrimaryButton, GhostButton } from "./ui";
import { LogoMark } from "./icons";

function Background() {
  const particles = [
    { l: "12%", d: "0s", dur: "9s" }, { l: "28%", d: "2.5s", dur: "11s" },
    { l: "45%", d: "1.2s", dur: "8s" }, { l: "63%", d: "3.4s", dur: "12s" },
    { l: "78%", d: "0.8s", dur: "10s" }, { l: "90%", d: "2s", dur: "9.5s" },
  ];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="absolute inset-0 ff-grid opacity-[0.12]" />
      <div className="absolute -top-28 -left-24 w-[440px] h-[440px] rounded-full blur-[90px] opacity-50"
        style={{ background: "radial-gradient(circle, #22C55E, transparent 68%)", animation: "ff-aurora1 16s ease-in-out infinite" }} />
      <div className="absolute top-1/4 -right-32 w-[500px] h-[500px] rounded-full blur-[100px] opacity-40"
        style={{ background: "radial-gradient(circle, #4ADE80, transparent 68%)", animation: "ff-aurora2 20s ease-in-out infinite" }} />
      <div className="absolute -bottom-24 left-1/4 w-[400px] h-[400px] rounded-full blur-[90px] opacity-35"
        style={{ background: "radial-gradient(circle, #0EA5E9, transparent 70%)", animation: "ff-aurora3 24s ease-in-out infinite" }} />
      {particles.map((p, i) => (
        <span key={i} className="ff-particle absolute bottom-24 w-1 h-1 rounded-full bg-accentGreen/70"
          style={{ left: p.l, animationDelay: p.d, animationDuration: p.dur }} />
      ))}
      <div className="absolute inset-0" style={{ background: "radial-gradient(120% 90% at 50% 0%, transparent 40%, rgba(10,10,10,0.55) 100%)" }} />
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

  async function handleCloudSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setInfo(null); setBusy(true);
    try {
      const res = mode === "signup" ? await signUpEmail(name, email.trim(), password) : await signInEmail(email.trim(), password);
      if (res.error) setError(res.error);
      else if (res.needsConfirm) setInfo("Check your email to confirm your account, then sign in.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally { setBusy(false); }
  }

  const inputCls = "w-full rounded-button bg-bgCard/80 backdrop-blur border border-borderStrong px-4 py-3.5 text-[15px] outline-none focus:border-accentGreen";
  const back = () => { setShowForm(false); setError(null); setInfo(null); };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Background />
      <div className="relative z-10 min-h-screen flex flex-col px-7 pt-12 pb-8">
        {!showForm ? (
          <>
            <div className="flex-1">
              <LogoMark size={60} className="mb-5 ff-float" />
              <div className="font-display text-7xl text-accentGreen leading-none">FITFLOW</div>
              <p className="text-accentGreen text-[13px] font-bold uppercase tracking-[0.18em] mt-4">Your AI personal trainer</p>
              <h1 className="font-display text-[56px] leading-[0.92] text-white mt-3">
                BUILD MUSCLE.<br /><span className="text-accentGreen">LOSE FAT.</span><br />TRAIN SMARTER.
              </h1>
              <p className="text-textMuted text-[15px] mt-5 max-w-[310px] leading-snug">
                Answer a few questions — get a plan that builds and progresses itself.
              </p>
            </div>
            {cloudEnabled ? (
              <div className="space-y-3">
                <PrimaryButton onClick={() => { setShowForm(true); setMode("signup"); }}>Get started</PrimaryButton>
                <GhostButton onClick={() => { setShowForm(true); setMode("signin"); }}>I already have an account</GhostButton>
                <p className="text-center text-textFaint text-[13px]">Your data syncs securely across devices.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <PrimaryButton onClick={() => { setShowForm(true); setMode("signup"); }}>Get started</PrimaryButton>
                <p className="text-center text-textFaint text-[13px]">All data stays in your browser.</p>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="pt-2">
              <LogoMark size={48} className="mb-5" />
              <h2 className="font-display text-6xl text-white leading-none">
                {mode === "signup" ? "CREATE ACCOUNT" : "WELCOME BACK"}
              </h2>
              <p className="text-textMuted text-[14px] mt-2">
                {mode === "signup" ? "Your plan is 60 seconds away." : "Pick up right where you left off."}
              </p>
            </div>

            {cloudEnabled ? (
              <form className="mt-7 space-y-3" onSubmit={handleCloudSubmit}>
                {mode === "signup" && <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={inputCls} />}
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
                <GhostButton onClick={back}>Back</GhostButton>
              </form>
            ) : (
              <form className="mt-7 space-y-3" onSubmit={(e) => { e.preventDefault(); signUp(name, email || undefined); }}>
                <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={inputCls} />
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optional)" type="email" className={inputCls} />
                <PrimaryButton type="submit" disabled={!name.trim()}>Continue</PrimaryButton>
                <GhostButton onClick={back}>Back</GhostButton>
              </form>
            )}
            <div className="flex-1" />
          </>
        )}
      </div>
    </div>
  );
}
