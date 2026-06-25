"use client";
import React, { useEffect, useRef, useState } from "react";
import { useApp } from "./AppState";
import { PrimaryButton, GhostButton } from "./ui";
import { Icon } from "./icons";
import ExerciseDetail from "./ExerciseDetail";
import { type Exercise } from "@/lib/models";
import {
  type Workout, type SetLog, type ExerciseSet, uuid, estimated1RM,
} from "@/lib/models";
import { isNew1RMPR } from "@/lib/personalRecords";
import { weightUnit } from "@/lib/units";

export default function ActiveWorkout({ onExit }: { onExit: () => void }) {
  const { currentWorkout, setCurrentWorkout, finishWorkout, appendSetLogs, setLogs, preferences } = useApp();
  const [w, setW] = useState<Workout | null>(currentWorkout);
  const [startedAt] = useState(Date.now());
  const [rest, setRest] = useState<number | null>(null);
  const [pr, setPr] = useState<string | null>(null);
  const [detail, setDetail] = useState<Exercise | null>(null);
  const pendingLogs = useRef<SetLog[]>([]);
  const priorLogs = useRef<SetLog[]>([...setLogs]);
  const unit = weightUnit(preferences.units);

  // rest timer
  useEffect(() => {
    if (rest == null) return;
    if (rest <= 0) { setRest(null); return; }
    const id = setTimeout(() => setRest((r) => (r == null ? null : r - 1)), 1000);
    return () => clearTimeout(id);
  }, [rest]);

  if (!w) { onExit(); return null; }

  const patchSet = (exId: string, setId: string, patch: Partial<ExerciseSet>) => {
    setW((prev) => prev && ({
      ...prev,
      exercises: prev.exercises.map((ex) => ex.id !== exId ? ex : ({
        ...ex, sets: ex.sets.map((s) => s.id !== setId ? s : { ...s, ...patch }),
      })),
    }));
  };

  const toggleComplete = (exId: string, setId: string) => {
    const ex = w.exercises.find((e) => e.id === exId)!;
    const set = ex.sets.find((s) => s.id === setId)!;
    const willComplete = !set.isCompleted;
    patchSet(exId, setId, { isCompleted: willComplete, completedAt: willComplete ? new Date().toISOString() : null });

    if (willComplete && !set.isWarmup) {
      const log: SetLog = {
        id: uuid(), date: new Date().toISOString(), exerciseName: ex.name,
        weight: set.weight, reps: set.reps,
        primaryMuscles: ex.primaryMuscles, secondaryMuscles: ex.secondaryMuscles,
      };
      if (isNew1RMPR(log, priorLogs.current)) {
        setPr(`${ex.name} — new 1RM ≈ ${Math.round(estimated1RM(log))} ${unit}!`);
        setTimeout(() => setPr(null), 3500);
      }
      priorLogs.current = [log, ...priorLogs.current];
      pendingLogs.current = [log, ...pendingLogs.current];
      setRest(preferences.defaultRestSeconds);
    }
  };

  const finish = () => {
    if (pendingLogs.current.length) appendSetLogs(pendingLogs.current);
    const minutes = Math.max(1, Math.round((Date.now() - startedAt) / 60000));
    finishWorkout(w, minutes);
    onExit();
  };

  const cancel = () => {
    setCurrentWorkout(w); // persist any target edits
    onExit();
  };

  const totalSets = w.exercises.reduce((a, e) => a + e.sets.length, 0);
  const doneSets = w.exercises.reduce((a, e) => a + e.sets.filter((s) => s.isCompleted).length, 0);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="px-7 pt-8 pb-4 sticky top-0 bg-bgPhone/95 backdrop-blur z-10 border-b border-border">
        <div className="flex items-center justify-between">
          <button onClick={cancel} className="text-textMuted hover:text-white transition text-[14px] flex items-center gap-1"><Icon name="back" size={17} /> Exit</button>
          <span className="text-textFaint text-[13px]">{doneSets}/{totalSets} sets</span>
        </div>
        <div className="font-display text-4xl text-white leading-none mt-2">{w.workoutName}</div>
      </div>

      {rest != null && (
        <div className="sticky top-[92px] z-10 mx-7 mt-3 rounded-card bg-accentGreen text-deepGreen px-4 py-3 flex items-center justify-between ff-pop">
          <span className="font-semibold">Rest</span>
          <span className="font-display text-3xl">{Math.floor(rest / 60)}:{String(rest % 60).padStart(2, "0")}</span>
          <button onClick={() => setRest(null)} className="text-deepGreen/70 text-[13px] underline">Skip</button>
        </div>
      )}

      {pr && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-30 bg-white text-deepGreen rounded-full px-5 py-2.5 font-semibold shadow-lg ff-pop text-[14px]">
          <span className="inline-flex items-center gap-1.5"><Icon name="trophy" size={16} /> {pr}</span>
        </div>
      )}

      <div className="flex-1 px-7 py-4 space-y-4">
        {w.exercises.map((ex) => (
          <div key={ex.id} className="bg-bgCard border border-border rounded-card p-4">
            <div className="flex items-baseline justify-between gap-2">
              <button onClick={() => setDetail(ex)} className="text-white text-[16px] font-semibold text-left flex items-center gap-1.5 active:opacity-70">
                {ex.name}<span className="text-red-500"><Icon name="play" size={14} /></span>
              </button>
              <div className="text-textFaint text-[12px] shrink-0">{ex.detail}</div>
            </div>
            {ex.tip && <div className="text-textFaint text-[12px] mt-1 flex items-center gap-1.5"><span className="text-accentGreen shrink-0"><Icon name="bulb" size={14} /></span>{ex.tip}</div>}

            <div className="mt-3 grid grid-cols-[28px_1fr_1fr_44px] gap-2 items-center text-[11px] text-textFaint uppercase tracking-wide">
              <span>Set</span><span>Weight ({unit})</span><span>Reps</span><span></span>
            </div>
            <div className="mt-1 space-y-2">
              {ex.sets.map((s, i) => (
                <div key={s.id} className="grid grid-cols-[28px_1fr_1fr_44px] gap-2 items-center">
                  <span className="text-textFaint text-[13px]">{i + 1}</span>
                  <input type="number" inputMode="decimal" value={s.weight || ""}
                    onChange={(e) => patchSet(ex.id, s.id, { weight: Number(e.target.value) })}
                    placeholder="0"
                    className="w-full min-w-0 rounded-lg bg-bgPhone border border-borderStrong px-3 py-2 text-[15px] outline-none focus:border-accentGreen" />
                  <input type="number" inputMode="numeric" value={s.reps || ""}
                    onChange={(e) => patchSet(ex.id, s.id, { reps: Number(e.target.value) })}
                    placeholder="0"
                    className="w-full min-w-0 rounded-lg bg-bgPhone border border-borderStrong px-3 py-2 text-[15px] outline-none focus:border-accentGreen" />
                  <button onClick={() => toggleComplete(ex.id, s.id)}
                    className={`h-9 rounded-lg flex items-center justify-center transition
                      ${s.isCompleted ? "bg-accentGreen text-deepGreen" : "bg-bgPhone border border-borderStrong text-textFaint"}`}>
                    <Icon name="check" size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="px-7 py-4 space-y-3 sticky bottom-0 bg-bgPhone/95 backdrop-blur border-t border-border">
        <PrimaryButton onClick={finish}>Finish workout</PrimaryButton>
      </div>

      {detail && <ExerciseDetail exercise={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}
