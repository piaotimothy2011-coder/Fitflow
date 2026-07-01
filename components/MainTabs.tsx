"use client";
import React, { useState } from "react";
import { useApp } from "./AppState";
import HomeScreen from "./HomeScreen";
import LibraryScreen from "./LibraryScreen";
import OutdoorRun from "./OutdoorRun";
import ActiveWorkout from "./ActiveWorkout";
import ProgressScreen from "./ProgressScreen";
import DietScreen from "./DietScreen";
import ProfileScreen from "./ProfileScreen";
import { Icon, type IconName } from "./icons";
import Ambient from "./Ambient";

type Tab = "home" | "library" | "run" | "diet" | "progress" | "profile";

// Note: "run" is a hidden route reached from the Home "Run Plan" card, not a
// bottom-nav tab, so the tracker gets the full screen while you run.
const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: "home", label: "Home", icon: "today" },
  { id: "library", label: "Library", icon: "library" },
  { id: "diet", label: "Diet", icon: "diet" },
  { id: "progress", label: "Progress", icon: "progress" },
  { id: "profile", label: "Profile", icon: "profile" },
];

export default function MainTabs() {
  const [tab, setTab] = useState<Tab>("home");
  const [training, setTraining] = useState(false);
  const { currentWorkout } = useApp();

  if (training && currentWorkout) {
    return <ActiveWorkout onExit={() => setTraining(false)} />;
  }

  // Run tracker takes over the full screen (no bottom nav) while active.
  if (tab === "run") {
    return <OutdoorRun onExit={() => setTab("home")} />;
  }

  return (
    <div className="relative min-h-screen flex flex-col">
      <Ambient />
      <div className="relative z-10 flex-1 overflow-y-auto no-scrollbar pb-24">
        {tab === "home" && <HomeScreen onStart={() => setTraining(true)} onProfile={() => setTab("profile")} onRun={() => setTab("run")} />}
        {tab === "library" && <LibraryScreen onStarted={() => setTab("home")} />}
        {tab === "diet" && <DietScreen />}
        {tab === "progress" && <ProgressScreen />}
        {tab === "profile" && <ProfileScreen />}
      </div>

      <nav className="fixed bottom-0 w-full max-w-[440px] bg-bgPhone/95 backdrop-blur border-t border-border z-20">
        <div className="flex px-1 pb-[env(safe-area-inset-bottom)]">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[10.5px] font-medium transition
                  ${active ? "text-accentGreen" : "text-textFaint hover:text-textMuted"}`}>
                <span className={`flex items-center justify-center w-10 h-7 rounded-full transition ${active ? "bg-accentGreen/15" : ""}`}>
                  <Icon name={t.icon} size={20} />
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
