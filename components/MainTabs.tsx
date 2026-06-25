"use client";
import React, { useState } from "react";
import { useApp } from "./AppState";
import HomeScreen from "./HomeScreen";
import ActiveWorkout from "./ActiveWorkout";
import ProgressScreen from "./ProgressScreen";
import DietScreen from "./DietScreen";
import ProfileScreen from "./ProfileScreen";
import { Icon, type IconName } from "./icons";
import Ambient from "./Ambient";

type Tab = "home" | "progress" | "diet" | "profile";

const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: "home", label: "Today", icon: "today" },
  { id: "progress", label: "Progress", icon: "progress" },
  { id: "diet", label: "Diet", icon: "diet" },
  { id: "profile", label: "Profile", icon: "profile" },
];

export default function MainTabs() {
  const [tab, setTab] = useState<Tab>("home");
  const [training, setTraining] = useState(false);
  const { currentWorkout } = useApp();

  if (training && currentWorkout) {
    return <ActiveWorkout onExit={() => setTraining(false)} />;
  }

  return (
    <div className="relative min-h-screen flex flex-col">
      <Ambient />
      <div className="relative z-10 flex-1 overflow-y-auto no-scrollbar pb-24">
        {tab === "home" && <HomeScreen onStart={() => setTraining(true)} onProfile={() => setTab("profile")} />}
        {tab === "progress" && <ProgressScreen />}
        {tab === "diet" && <DietScreen />}
        {tab === "profile" && <ProfileScreen />}
      </div>

      <nav className="fixed bottom-0 w-full max-w-[440px] bg-bgPhone/95 backdrop-blur border-t border-border z-20">
        <div className="flex px-2 pb-[env(safe-area-inset-bottom)]">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition
                  ${active ? "text-accentGreen" : "text-textFaint hover:text-textMuted"}`}
              >
                <span className={`flex items-center justify-center w-11 h-7 rounded-full transition
                  ${active ? "bg-accentGreen/15" : "bg-transparent"}`}>
                  <Icon name={t.icon} size={21} />
                </span>
                {t.label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
