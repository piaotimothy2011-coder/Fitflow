"use client";
import React from "react";
import { useApp } from "./AppState";
import { PrimaryButton, GhostButton, Card } from "./ui";
import { workoutTargetedMuscles, exerciseCompletedSetCount } from "@/lib/models";
import { muscleDisplayName } from "@/lib/muscle";
import { SurveyCatalog } from "@/lib/surveyCatalog";

export default function HomeScreen({ onStart }: { onStart: () => void }) {
  const { user, currentWorkout, survey, goToSurvey, setCurrentWorkout } = useApp();
  if (!currentWorkout) return null;

  const muscles = workoutTargetedMuscles(currentWorkout).slice(0, 4).map((m) => muscleDisplayName[m]);
  const goalShort = SurveyCatalog.goalShortLabels[survey.goal] ?? survey.goal;

  return (
    <div className="px-7 pt-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-textFaint text-[13px]">Welcome back</div>
          <div className="font-display text-4xl text-white leading-none mt-1">{user?.name ?? "You"}</div>
        </div>
        <div className="w-11 h-11 rounded-full bg-accentGreen text-deepGreen font-display text-xl flex items-center justify-center">
          {(user?.name?.[0] ?? "Y").toUpperCase()}
        </div>
      </div>

      <Card className="p-5 mb-4 bg-gradient-to-br from-mintBg to-[#dcfce7]">
        <div className="text-deepGreen/70 text-[12px] uppercase tracking-wide font-semibold">{currentWorkout.tag}</div>
        <div className="font-display text-5xl text-deepGreen leading-none mt-1">{currentWorkout.workoutName}</div>
        <div className="text-midDeepGreen text-[14px] mt-2">{currentWorkout.meta}</div>
        {muscles.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {muscles.map((m) => (
              <span key={m} className="text-[12px] bg-deepGreen/10 text-deepGreen rounded-full px-2.5 py-1">{m}</span>
            ))}
          </div>
        )}
        <div className="mt-5">
          <button onClick={onStart}
            className="w-full rounded-button bg-deepGreen text-mintBg font-semibold py-3.5 text-[15px] active:scale-[0.98] transition">
            Start workout
          </button>
        </div>
      </Card>

      <div className="text-textFaint text-[13px] mb-2 mt-6">Today's exercises</div>
      <div className="space-y-2.5">
        {currentWorkout.exercises.map((ex) => {
          const done = exerciseCompletedSetCount(ex);
          return (
            <Card key={ex.id} className="p-4 flex items-center justify-between">
              <div className="min-w-0">
                <div className="text-white text-[15px] font-medium truncate">{ex.name}</div>
                <div className="text-textFaint text-[13px] mt-0.5">{ex.detail}</div>
              </div>
              <div className="text-textFaint text-[13px] shrink-0 ml-3">{done}/{ex.sets.length}</div>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 space-y-3">
        <GhostButton onClick={() => { setCurrentWorkout(null); goToSurvey(); }}>
          Generate a new plan ({goalShort})
        </GhostButton>
      </div>
    </div>
  );
}
