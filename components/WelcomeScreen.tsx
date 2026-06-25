"use client";
import React, { useState } from "react";
import { useApp } from "./AppState";
import { PrimaryButton, GhostButton } from "./ui";

export default function WelcomeScreen() {
  const { signUp } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  return (
    <div className="min-h-screen flex flex-col px-7 py-10">
      <div className="flex-1 flex flex-col justify-center">
        <div className="font-display text-7xl text-accentGreen leading-none">FITFLOW</div>
        <p className="text-textMuted text-[17px] mt-4 max-w-[300px]">
          Personalized workouts, smart progression, and nutrition — that adapt to you.
        </p>

        <div className="mt-10 space-y-3">
          {["Survey-built training plans", "Per-set logging + rest timer", "Recovery-aware smart plans", "Macro & water tracking"].map((f) => (
            <div key={f} className="flex items-center gap-3 text-[15px] text-white/90">
              <span className="text-accentGreen">●</span>{f}
            </div>
          ))}
        </div>
      </div>

      {!showForm ? (
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
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full rounded-button bg-bgCard border border-borderStrong px-4 py-3.5 text-[15px] outline-none focus:border-accentGreen"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email (optional)"
            type="email"
            className="w-full rounded-button bg-bgCard border border-borderStrong px-4 py-3.5 text-[15px] outline-none focus:border-accentGreen"
          />
          <PrimaryButton type="submit" disabled={!name.trim()}>Continue</PrimaryButton>
          <GhostButton onClick={() => setShowForm(false)}>Back</GhostButton>
        </form>
      )}
    </div>
  );
}
