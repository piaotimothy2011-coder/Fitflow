"use client";
import React from "react";
import { useApp } from "./AppState";
import { GhostButton, Card, SectionLabel } from "./ui";
import { Icon } from "./icons";
import { workoutTargetedMuscles, exerciseCompletedSetCount } from "@/lib/models";
import { muscleDisplayName } from "@/lib/muscle";
import { SurveyCatalog, goalIcon } from "@/lib/surveyCatalog";

export default function HomeScreen({ onStart }: { onStart: () => void }) {
  const { user, currentWorkout, survey, goToSurvey, setCurrentWorkout } = useApp();
  if (!currentWorkout) return null;

  const muscles = workoutTargetedMuscles(currentWorkout).slice(0, 4).map((m) => muscleDisplayName[m]);
  const goalShort = SurveyCatalog.goalShortLabels[survey.goal] ?? survey.goal;
  const exCount = currentWorkout.exercises.length;
  const doneCount = currentWorkout.exercises.filter((e) => exerciseCompletedSetCount(e) > 0).length;
  const minutes = currentWorkout.meta.match(/(\d+)\s*min/)?.[1];

  return (
    <div className="px-6 pt-9">
      {/* header */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <div className="text-textFaint text-[13px]">Welcome back</div>
          <div className="font-display text-[34px] text-white leading-none mt-1">{user?.name ?? "You"}</div>
        </div>
        <div className="w-11 h-11 rounded-full bg-accentGreen text-deepGreen font-display text-xl flex items-center justify-center">
          {(user?.name?.[0] ?? "Y").toUpperCase()}
        </div>
      </div>

      {/* hero workout card */}
      <Card className="p-5 mb-3 border-0 bg-gradient-to-br from-mintBg to-[#dcfce7]">
        <div className="flex items-center gap-1.5 text-deepGreen/70 text-[12px] uppercase tracking-wider font-bold">
          <Icon name={goalIcon[survey.goal] ?? "spark"} size={15} />
          {currentWorkout.tag}
        </div>
        <div className="font-display text-[44px] text-deepGreen leading-[0.95] mt-2">{currentWorkout.workoutName}</div>

        {/* mini stats */}
        <div className="flex gap-4 mt-3 text-deepGreen">
          {minutes && (
            <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold">
              <Icon name="clock" size={15} />{minutes} min
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold">
            <Icon name="strength" size={15} />{exCount} exercises
          </span>
        </div>

        {muscles.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {muscles.map((m) => (
              <span key={m} className="text-[12px] bg-deepGreen/10 text-deepGreen rounded-full px-2.5 py-1 font-medium">{m}</span>
            ))}
          </div>
        )}

        <button
          onClick={onStart}
          className="mt-5 w-full rounded-button bg-deepGreen text-mintBg font-semibold py-3.5 text-[15px] active:scale-[0.98] transition flex items-center justify-center gap-2"
        >
          <Icon name="flame" size={18} /> Start workout
        </button>
      </Card>

      {/* exercises */}
      <div className="flex items-center justify-between mt-7 mb-3">
        <SectionLabel>Today&apos;s exercises</SectionLabel>
        <span className="text-textFaint text-[12px]">{doneCount}/{exCount} done</span>
      </div>
      <div className="space-y-2.5">
        {currentWorkout.exercises.map((ex, i) => {
          const done = exerciseCompletedSetCount(ex);
          const fullyDone = done > 0 && done >= ex.sets.length;
          return (
            <Card key={ex.id} className="p-4 flex items-center gap-3.5">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-display text-lg shrink-0
                ${fullyDone ? "bg-accentGreen text-deepGreen" : "bg-borderStrong text-textMuted"}`}>
                {fullyDone ? <Icon name="check" size={18} /> : i + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-white text-[15px] font-medium truncate">{ex.name}</div>
                <div className="text-textFaint text-[13px] mt-0.5 truncate">{ex.detail}</div>
              </div>
              <div className="text-textFaint text-[13px] shrink-0">{done}/{ex.sets.length}</div>
            </Card>
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
