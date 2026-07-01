"use client";
import React from "react";
import { useApp } from "./AppState";
import { SectionLabel } from "./ui";
import { Icon } from "./icons";
import { SurveyCatalog, goalIcon } from "@/lib/surveyCatalog";
import { makeFreshCopy } from "@/lib/models";
import { buildWorkout } from "@/lib/workoutGenerator";
import { applyProgression } from "@/lib/progressionEngine";

export default function LibraryScreen({ onStarted }: { onStarted: () => void }) {
  const { survey, setSurvey, templates, deleteTemplate, setCurrentWorkout, setLogs, preferences } = useApp();

  // Changing the goal keeps the rest of your survey answers and instantly
  // rebuilds today's workout for the new goal — no need to retake the survey.
  const customizeForGoal = (goal: string) => {
    const next = { ...survey, goal };
    setSurvey(next);
    let w = buildWorkout(next);
    w = applyProgression(w, setLogs, preferences.units);
    setCurrentWorkout(w);
    onStarted();
  };

  const startTemplate = (id: string) => {
    const t = templates.find((x) => x.id === id);
    if (!t) return;
    setCurrentWorkout(makeFreshCopy(t.workout));
    onStarted();
  };

  return (
    <div className="px-6 pt-9">
      <h1 className="font-display text-[44px] text-white leading-none">Library</h1>
      <p className="text-textMuted text-[14px] mt-1.5 mb-6">Re-run a saved plan, or switch your plan to any goal — your workout updates instantly.</p>

      {templates.length > 0 && (
        <div className="mb-7">
          <SectionLabel className="mb-3">Saved plans</SectionLabel>
          <div className="space-y-2.5">
            {templates.map((t) => (
              <div key={t.id} className="rounded-2xl bg-bgCard border border-border p-4 flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-accentGreen/15 text-accentGreen flex items-center justify-center shrink-0">
                  <Icon name="bookmark" size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-white text-[15px] font-medium truncate">{t.name}</div>
                  <div className="text-textFaint text-[12px] mt-0.5">{t.workout.exercises.length} exercises</div>
                </div>
                <button onClick={() => startTemplate(t.id)}
                  className="rounded-lg bg-accentGreen text-deepGreen font-semibold text-[13px] px-3.5 py-2 active:scale-95 transition">Start</button>
                <button onClick={() => deleteTemplate(t.id)} aria-label="Delete" className="text-textFaint hover:text-white transition px-1">
                  <Icon name="close" size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <SectionLabel className="mb-3">Build a plan by goal</SectionLabel>
      <div className="grid grid-cols-2 gap-3 pb-4">
        {SurveyCatalog.goals.map((g) => (
          <button key={g} onClick={() => customizeForGoal(g)}
            className="rounded-2xl border border-borderStrong bg-bgCard p-3.5 text-left transition active:scale-[0.97] hover:border-white/25 flex flex-col gap-3 min-h-[104px]">
            <span className="w-11 h-11 rounded-xl bg-borderStrong text-accentGreen flex items-center justify-center">
              <Icon name={goalIcon[g] ?? "spark"} size={24} />
            </span>
            <span className="text-[14.5px] font-semibold text-textMuted leading-tight">{g}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
