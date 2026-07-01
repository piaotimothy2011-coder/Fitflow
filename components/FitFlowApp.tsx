"use client";
import React, { useState } from "react";
import { AppStateProvider, useApp } from "./AppState";
import WelcomeScreen from "./WelcomeScreen";
import SurveyFlow from "./SurveyFlow";
import MainTabs from "./MainTabs";
import { LogoMark } from "./icons";
import { PrimaryButton } from "./ui";
import InstallPrompt from "./InstallPrompt";

function UpdatePasswordScreen() {
  const { updatePassword } = useApp();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (pw.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (pw !== pw2) { setError("Passwords do not match."); return; }
    setBusy(true);
    const res = await updatePassword(pw);
    setBusy(false);
    if (res.error) setError(res.error);
  };
  const inputCls = "w-full rounded-button bg-bgCard border border-borderStrong px-4 py-3.5 text-[15px] text-white outline-none focus:border-accentGreen";
  return (
    <div className="min-h-screen flex flex-col px-7 pt-16">
      <LogoMark size={48} className="mb-4" />
      <h2 className="font-display text-[40px] text-white leading-none">SET A NEW PASSWORD</h2>
      <p className="text-textMuted text-[14px] mt-2">Choose a new password for your account.</p>
      <form className="mt-8 space-y-3.5" onSubmit={submit}>
        <input autoFocus type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New password (min 6 chars)" className={inputCls} />
        <input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="Confirm new password" className={inputCls} />
        {error && <p className="text-red-400 text-[13px]">{error}</p>}
        <PrimaryButton type="submit" disabled={busy}>{busy ? "Saving…" : "Update password"}</PrimaryButton>
      </form>
    </div>
  );
}

function Shell() {
  const { hydrated, route, authRecovery } = useApp();

  return (
    <div className="min-h-screen w-full flex justify-center bg-bgRoot">
      <div className="w-full max-w-[440px] min-h-screen bg-bgPhone relative">
        {!hydrated ? (
          <div className="h-screen flex flex-col items-center justify-center gap-4">
            <LogoMark size={64} className="animate-pulse" />
            <div className="font-display text-5xl text-accentGreen">FITFLOW</div>
          </div>
        ) : authRecovery ? (
          <UpdatePasswordScreen />
        ) : route === "welcome" ? (
          <WelcomeScreen />
        ) : route === "survey" ? (
          <SurveyFlow />
        ) : (
          <MainTabs />
        )}
      </div>
    </div>
  );
}

export default function FitFlowApp() {
  return (
    <AppStateProvider>
      <Shell />
      <InstallPrompt />
    </AppStateProvider>
  );
}
