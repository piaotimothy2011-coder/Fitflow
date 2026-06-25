"use client";
import React, { useState } from "react";
import { useApp } from "./AppState";
import HomeScreen from "./HomeScreen";
import ActiveWorkout from "./ActiveWorkout";
import ProgressScreen from "./ProgressScreen";
import DietScreen from "./DietScreen";
import ProfileScreen from "./ProfileScreen";

type Tab = "home" | "progress" | "diet" | "profile";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "home", label: "Today", icon: "🏋️" },
  { id: "progress", label: "Progress", icon: "📈" },
  { id: "diet", label: "Diet", icon: "🥗" },
  { id: "profile", label: "Profile", icon: "👤" },
];

export default function MainTabs() {
  const [tab, setTab] = useState<Tab>("home");
  const [training, setTraining] = useState(false);
  const { currentWorkout } = useApp();

  if (training && currentWorkout) {
    return <ActiveWorkout onExit={() => setTraining(false)} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
        {tab === "home" && <HomeScreen onStart={() => setTraining(true)} />}
        {tab === "progress" && <ProgressScreen />}
        {tab === "diet" && <DietScreen />}
        {tab === "profile" && <ProfileScreen />}
      </div>

      <nav className="fixed bottom-0 w-full max-w-[440px] bg-bgPhone/95 backdrop-blur border-t border-border">
        <div className="flex">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-[11px] transition
                ${tab === t.id ? "text-accentGreen" : "text-textFaint"}`}>
              <span className="text-lg">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
