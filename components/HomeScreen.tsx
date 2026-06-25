"use client";
import React from "react";
import { useApp } from "./AppState";
import { GhostButton, SectionLabel } from "./ui";
import { Icon } from "./icons";
import { workoutTargetedMuscles, exerciseCompletedSetCount } from "@/lib/models";
import { muscleDisplayName } from "@/lib/muscle";
import { SurveyCatalog, goalIcon } from "@/lib/surveyCatalog";

function Ring({ done, total }: { done: number; total: number }) {
  const pct = total ? done / total : 0;
  return (
    <div className="relative w-[58px] h-[58px] shrink-0">
      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
        <circle cx="18" cy="18" r="15.5" fill="none" stroke="#ffffff1a" strokeWidth="3.2" />
        <circle cx="18" cy="18" r="15.5" fill="none" stroke="#4ADE80" strokeWidth="3.2"
          strokeLinecap="round" pathLength={100} strokeDasharray={`${pct * 100} 100`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-[19px] text-white leading-none">{done}</span>
        <span className="text-[9px] text-textFaint leading-none mt-0.5">/{total}</span>
      </div>
    </div>
  );
}

export default function HomeScreen({ onStart, onProfile }: { onStart: () => void; onProfile?: () => void }) {
  const { user, currentWorkout, survey, goToSurvey, setCurrentWorkout } = useApp();
  if (!currentWorkout) return null;

  const muscles = workoutTargetedMuscles(currentWorkout).slice(0, 4).map((m) => muscleDisplayName[m]);
  const goalShort = SurveyCatalog.goalShortLabels[survey.goal] ?? survey.goal;
  const exCount = currentWorkout.exercises.length;
  const minutes = currentWorkout.meta.match(/(\d+)\s*min/)?.[1];
  const totalSets = currentWorkout.exercises.reduce((a, e) => a + e.sets.length, 0);
  const doneSets = currentWorkout.exercises.reduce((a, e) => a + e.sets.filter((s) => s.isCompleted).length, 0);
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

  const Pill = ({ icon, text }: { icon: "clock" | "strength" | "flame"; text: string }) => (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] border border-white/10 px-3 py-1.5 text-[12.5px] font-medium text-white/90">
      <span className="text-accentGreen"><Icon name={icon} size={14} /></span>{text}
    </span>
  );

  return (
    <div className="px-6 pt-9">
      {/* header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-textFaint text-[12px]">{today}</div>
          <div className="font-display text-[32px] text-white leading-none mt-1">
            Hi, {user?.name?.split(" ")[0] ?? "there"}
          </div>
        </div>
        <button onClick={onProfile} aria-label="Open profile"
          className="w-11 h-11 rounded-full bg-accentGreen text-deepGreen font-display text-xl flex items-center justify-center active:scale-95 transition">
          {(user?.name?.[0] ?? "Y").toUpperCase()}
        </button>
      </div>

      {/* hero card — dark, premium */}
      <div className="relative overflow-hidden rounded-[22px] border border-accentGreen/25 bg-[#10160F] p-5">
        <div className="pointer-events-none absolute -top-16 -right-12 w-44 h-44 rounded-full bg-accentGreen/20 blur-[60px]" />
        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-accentGreen text-[11px] uppercase tracking-[0.14em] font-bold">
                <Icon name={goalIcon[survey.goal] ?? "spark"} size={14} />{currentWorkout.tag}
              </div>
              <div className="font-display text-[40px] text-white leading-[0.95] mt-2">{currentWorkout.workoutName}</div>
            </div>
            <Ring done={doneSets} total={totalSets} />
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {minutes && <Pill icon="clock" text={`${minutes} min`} />}
            <Pill icon="strength" text={`${exCount} exercises`} />
            {muscles[0] && <Pill icon="flame" text={muscles.slice(0, 2).join(" · ")} />}
          </div>

          <button onClick={onStart}
            className="mt-5 w-full rounded-2xl bg-accentGreen text-deepGreen font-bold py-3.5 text-[15px] active:scale-[0.98] transition flex items-center justify-center gap-2">
            <Icon name="play" size={17} /> {doneSets > 0 ? "Resume workout" : "Start workout"}
          </button>
        </div>
      </div>

      {/* exercises */}
      <div className="flex items-center justify-between mt-8 mb-3">
        <SectionLabel>Today&apos;s exercises</SectionLabel>
        <span className="text-textFaint text-[12px]">{doneSets}/{totalSets} sets</span>
      </div>
      <div className="space-y-2.5">
        {currentWorkout.exercises.map((ex, i) => {
          const done = exerciseCompletedSetCount(ex);
          const fullyDone = done > 0 && done >= ex.sets.length;
          return (
            <div key={ex.id} className="bg-bgCard border border-border rounded-2xl p-3.5 flex items-center gap-3.5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-display text-lg shrink-0 transition
                ${fullyDone ? "bg-accentGreen text-deepGreen" : "bg-borderStrong text-textMuted"}`}>
                {fullyDone ? <Icon name="check" size={18} /> : i + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-white text-[15px] font-medium truncate">{ex.name}</div>
                <div className="text-textFaint text-[13px] mt-0.5 truncate">{ex.detail}</div>
              </div>
              <div className="text-textFaint text-[12px] shrink-0 tabular-nums">{done}/{ex.sets.length}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 mb-2">
        <GhostButton onClick={() => { setCurrentWorkout(null); goToSurvey(); }}>
          Generate a new plan ({goalShort})
        </GhostButton>
      </div>
    </div>
  );
}
