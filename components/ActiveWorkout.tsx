"use client";
import React, { useEffect, useRef, useState } from "react";
import { useApp } from "./AppState";
import { Icon } from "./icons";
import ExerciseDetail from "./ExerciseDetail";
import { type Exercise } from "@/lib/models";
import {
  type Workout, type SetLog, type ExerciseSet, uuid, estimated1RM,
} from "@/lib/models";
import { isNew1RMPR } from "@/lib/personalRecords";
import { weightUnit } from "@/lib/units";
import { muscleDisplayName } from "@/lib/muscle";
import { isWeightedExercise } from "@/lib/exerciseCatalog";
import { isTimed } from "@/lib/workoutGenerator";
import { recommendedStartWeight, type Profile } from "@/lib/weightRecommendation";

export default function ActiveWorkout({ onExit }: { onExit: () => void }) {
  const { currentWorkout, setCurrentWorkout, finishWorkout, appendSetLogs, setLogs, preferences, survey, user } = useApp();
  const [w, setW] = useState<Workout | null>(currentWorkout);
  const [idx, setIdx] = useState(0);
  const [startedAt] = useState(Date.now());
  const [rest, setRest] = useState<number | null>(null);
  const [pr, setPr] = useState<string | null>(null);
  const [detail, setDetail] = useState<Exercise | null>(null);
  const [summary, setSummary] = useState(false);
  const [timer, setTimer] = useState<{ exId: string; setId: string; remaining: number } | null>(null);
  const pendingLogs = useRef<SetLog[]>([]);
  const priorLogs = useRef<SetLog[]>([...setLogs]);
  const unit = weightUnit(preferences.units);
  const scrollRef = useRef<HTMLDivElement>(null);
  const completeRef = useRef<(exId: string, setId: string) => void>(() => {});

  const profile: Profile = {
    bodyweightKg: survey.weightKg ?? user?.weightKg ?? null,
    sex: survey.sex ?? user?.sex ?? null,
    age: survey.age ?? user?.age ?? null,
    level: survey.level,
    units: preferences.units,
  };

  // rest timer
  useEffect(() => {
    if (rest == null) return;
    if (rest <= 0) { setRest(null); return; }
    const id = setTimeout(() => setRest((r) => (r == null ? null : r - 1)), 1000);
    return () => clearTimeout(id);
  }, [rest]);

  // scroll to top when switching exercises
  useEffect(() => { scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" }); }, [idx]);

  // reset any running set-timer when changing exercise
  useEffect(() => { setTimer(null); }, [idx]);

  // countdown for timed sets (stretches / holds) — auto-completes at zero
  useEffect(() => {
    if (!timer) return;
    if (timer.remaining <= 0) {
      completeRef.current(timer.exId, timer.setId);
      setTimer(null);
      return;
    }
    const id = setTimeout(() => setTimer((t) => (t ? { ...t, remaining: t.remaining - 1 } : null)), 1000);
    return () => clearTimeout(id);
  }, [timer]);

  // On open, pre-fill a recommended starting weight (from the user's profile)
  // for any weighted exercise whose sets haven't been given a weight yet.
  useEffect(() => {
    setW((prev) => {
      if (!prev) return prev;
      let changed = false;
      const exercises = prev.exercises.map((e) => {
        if (!isWeightedExercise(e.name)) return e;
        if (!e.sets.every((s) => s.weight === 0)) return e;
        const rec = recommendedStartWeight(e.name, profile);
        if (!rec) return e;
        changed = true;
        return { ...e, sets: e.sets.map((s) => ({ ...s, weight: rec })) };
      });
      return changed ? { ...prev, exercises } : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!w) { onExit(); return null; }

  const totalSets = w.exercises.reduce((a, e) => a + e.sets.length, 0);
  const doneSets = w.exercises.reduce((a, e) => a + e.sets.filter((s) => s.isCompleted).length, 0);
  const last = w.exercises.length - 1;
  const ex = w.exercises[idx];
  const timed = /\d+\s*sec/i.test(ex.detail) || isTimed(ex.name);
  const weighted = !timed && isWeightedExercise(ex.name);
  const recommended = weighted ? recommendedStartWeight(ex.name, profile) : null;

  const patchSet = (exId: string, setId: string, patch: Partial<ExerciseSet>) => {
    setW((prev) => prev && ({
      ...prev,
      exercises: prev.exercises.map((e) => e.id !== exId ? e : ({
        ...e, sets: e.sets.map((s) => s.id !== setId ? s : { ...s, ...patch }),
      })),
    }));
  };

  // Setting the first set's weight fills every set of the exercise; individual
  // sets can then be adjusted from there.
  const propagateWeight = (exId: string, weight: number) => {
    setW((prev) => prev && ({
      ...prev,
      exercises: prev.exercises.map((e) => e.id !== exId ? e : ({
        ...e, sets: e.sets.map((s) => ({ ...s, weight })),
      })),
    }));
  };

  const toggleComplete = (exId: string, setId: string) => {
    const exx = w.exercises.find((e) => e.id === exId)!;
    const set = exx.sets.find((s) => s.id === setId)!;
    const willComplete = !set.isCompleted;
    patchSet(exId, setId, { isCompleted: willComplete, completedAt: willComplete ? new Date().toISOString() : null });

    if (willComplete && !set.isWarmup) {
      const log: SetLog = {
        id: uuid(), date: new Date().toISOString(), exerciseName: exx.name,
        weight: set.weight, reps: set.reps,
        primaryMuscles: exx.primaryMuscles, secondaryMuscles: exx.secondaryMuscles,
      };
      if (isNew1RMPR(log, priorLogs.current)) {
        setPr(`${exx.name} — new 1RM ≈ ${Math.round(estimated1RM(log))} ${unit}!`);
        setTimeout(() => setPr(null), 3500);
      }
      priorLogs.current = [log, ...priorLogs.current];
      pendingLogs.current = [log, ...pendingLogs.current];
      setRest(preferences.defaultRestSeconds);
    }
  };
  completeRef.current = toggleComplete;

  const mmss = (s: number) => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.max(0, s) % 60).padStart(2, "0")}`;
  const startOrStop = (exId: string, setId: string, seconds: number) => {
    setTimer((t) => (t && t.setId === setId ? null : { exId, setId, remaining: Math.max(1, seconds || 30) }));
  };

  const finish = () => {
    if (pendingLogs.current.length) appendSetLogs(pendingLogs.current);
    const minutes = Math.max(1, Math.round((Date.now() - startedAt) / 60000));
    finishWorkout(w, minutes);
    onExit();
  };

  const cancel = () => {
    setCurrentWorkout(w); // persist any edits
    onExit();
  };

  const goNext = () => { if (idx < last) setIdx(idx + 1); else setSummary(true); };
  const goPrev = () => { if (idx > 0) setIdx(idx - 1); };

  const exDone = ex.sets.filter((s) => s.isCompleted).length;
  const exFull = exDone > 0 && exDone >= ex.sets.length;
  const muscles = ex.primaryMuscles.slice(0, 2).map((m) => muscleDisplayName[m]).join(" · ");
  const elapsedMin = Math.max(1, Math.round((Date.now() - startedAt) / 60000));

  // ---------- completion summary ----------
  if (summary) {
    const exercisesDone = w.exercises.filter((e) => e.sets.some((s) => s.isCompleted)).length;
    const volume = w.exercises.reduce((a, e) =>
      a + e.sets.filter((s) => s.isCompleted).reduce((b, s) => b + Math.max(0, s.weight) * s.reps, 0), 0);
    const Stat = ({ value, label }: { value: string; label: string }) => (
      <div className="flex-1 rounded-2xl bg-bgCard border border-border p-4 text-center">
        <div className="font-display text-[28px] leading-none text-accentGreen">{value}</div>
        <div className="text-textFaint text-[11px] mt-1.5 uppercase tracking-wider">{label}</div>
      </div>
    );
    return (
      <div className="min-h-screen flex flex-col px-6 pt-16">
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-accentGreen text-deepGreen flex items-center justify-center ff-pop">
            <Icon name="check" size={40} />
          </div>
          <div className="font-display text-[40px] text-white leading-tight mt-5">Workout complete</div>
          <p className="text-textMuted text-[14px] mt-2">{w.workoutName} · nice work showing up today.</p>
        </div>
        <div className="flex gap-2.5 mt-8">
          <Stat value={`${elapsedMin}`} label="Minutes" />
          <Stat value={`${exercisesDone}`} label="Exercises" />
          <Stat value={`${doneSets}`} label="Sets" />
        </div>
        {volume > 0 && (
          <div className="mt-2.5 rounded-2xl bg-mintBg p-5 flex items-center justify-between">
            <span className="text-deepGreen/70 text-[13px] font-semibold uppercase tracking-wider">Total volume</span>
            <span className="font-display text-[30px] text-deepGreen leading-none">{Math.round(volume).toLocaleString()} {unit}</span>
          </div>
        )}
        <div className="mt-auto py-6 space-y-3">
          <button onClick={finish}
            className="w-full rounded-2xl bg-accentGreen text-deepGreen font-bold py-4 text-[16px] active:scale-[0.98] transition">
            Finish & save
          </button>
          <button onClick={() => setSummary(false)}
            className="w-full rounded-2xl border border-borderStrong text-white font-medium py-3.5 text-[14px] active:scale-[0.98] transition hover:bg-white/5">
            Back to exercises
          </button>
        </div>
      </div>
    );
  }

  // ---------- guided exercise view ----------
  return (
    <div className="min-h-screen flex flex-col">
      {/* header + progress */}
      <div className="px-5 pt-8 pb-3 sticky top-0 bg-bgPhone/95 backdrop-blur z-20">
        <div className="flex items-center justify-between">
          <button onClick={cancel} aria-label="Exit"
            className="w-9 h-9 rounded-full bg-bgCard border border-border flex items-center justify-center text-textMuted hover:text-white transition active:scale-95">
            <Icon name="close" size={18} />
          </button>
          <div className="text-center">
            <div className="text-white text-[13px] font-semibold">{w.workoutName}</div>
            <div className="text-textFaint text-[11px]">Exercise {idx + 1} of {w.exercises.length}</div>
          </div>
          <div className="text-textFaint text-[12px] tabular-nums w-9 text-right">{doneSets}/{totalSets}</div>
        </div>
        {/* segmented progress */}
        <div className="flex gap-1 mt-3">
          {w.exercises.map((e, i) => {
            const d = e.sets.filter((s) => s.isCompleted).length;
            const p = e.sets.length ? d / e.sets.length : 0;
            return (
              <div key={e.id} className="flex-1 h-1.5 rounded-full bg-borderStrong overflow-hidden">
                <div className="h-full rounded-full bg-accentGreen transition-all duration-500"
                  style={{ width: `${(i < idx ? 1 : i === idx ? p : 0) * 100}%` }} />
              </div>
            );
          })}
        </div>
      </div>

      {pr && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-40 bg-white text-deepGreen rounded-full px-5 py-2.5 font-semibold shadow-lg ff-pop text-[14px]">
          <span className="inline-flex items-center gap-1.5"><Icon name="trophy" size={16} /> {pr}</span>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar px-5 pt-4 pb-4">
        {/* exercise hero */}
        <div className="relative overflow-hidden rounded-[22px] border border-accentGreen/25 bg-[#10160F] p-5">
          <div className="pointer-events-none absolute -top-16 -right-12 w-44 h-44 rounded-full bg-accentGreen/20 blur-[60px]" />
          <div className="relative">
            <div className="flex items-center gap-2 text-accentGreen text-[11px] uppercase tracking-[0.14em] font-bold">
              <span className="w-6 h-6 rounded-lg bg-accentGreen/15 flex items-center justify-center font-display text-[13px]">{idx + 1}</span>
              {exFull ? "Complete" : `${exDone}/${ex.sets.length} sets`}
            </div>
            <div className="font-display text-[34px] text-white leading-[1] mt-2">{ex.name}</div>
            <div className="flex flex-wrap gap-2 mt-3">
              {muscles && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] border border-white/10 px-3 py-1.5 text-[12px] font-medium text-white/90">
                  <span className="text-accentGreen"><Icon name="flame" size={13} /></span>{muscles}
                </span>
              )}
              {ex.detail && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] border border-white/10 px-3 py-1.5 text-[12px] font-medium text-white/90">
                  <span className="text-accentGreen"><Icon name="strength" size={13} /></span>{ex.detail}
                </span>
              )}
            </div>
            <button onClick={() => setDetail(ex)}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/[0.06] border border-white/10 px-4 py-2 text-[13px] font-semibold text-white active:scale-[0.97] transition hover:border-white/25">
              <span className="text-accentGreen"><Icon name="play" size={14} /></span> Watch demo
            </button>
            {ex.tip && (
              <div className="text-textFaint text-[12.5px] mt-4 flex items-start gap-1.5 leading-snug">
                <span className="text-accentGreen shrink-0 mt-0.5"><Icon name="bulb" size={14} /></span>{ex.tip}
              </div>
            )}
          </div>
        </div>

        {/* sets */}
        <div className="flex items-center justify-between mt-6 mb-2 px-1">
          <span className="text-textFaint text-[12px] font-semibold uppercase tracking-wider">Log your sets</span>
          <span className="text-textFaint text-[12px]">{timed ? "Hold · seconds" : weighted ? unit + " × reps" : "Bodyweight · reps"}</span>
        </div>
        {weighted && (
          <p className="text-textFaint text-[11.5px] mb-2.5 px-1 leading-snug">
            {recommended ? `Suggested ${recommended} ${unit} from your profile — ` : ""}set the first set's weight and it fills all sets.
          </p>
        )}
        <div className="space-y-2.5">
          {ex.sets.map((s, i) => (
            <div key={s.id}
              className={`rounded-2xl border p-3 flex items-center gap-3 transition
                ${s.isCompleted ? "bg-accentGreen/10 border-accentGreen/40" : "bg-bgCard border-border"}`}>
              <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-display text-[15px] shrink-0
                ${s.isCompleted ? "bg-accentGreen text-deepGreen" : "bg-borderStrong text-textMuted"}`}>
                {s.isWarmup ? "W" : i + 1}
              </span>
              {timed ? (
                <div className="flex-1 flex items-center gap-2">
                  <label className="relative flex-1">
                    <input type="number" inputMode="numeric" value={s.reps || ""}
                      onChange={(e) => patchSet(ex.id, s.id, { reps: Number(e.target.value) })}
                      placeholder="0"
                      className="w-full rounded-xl bg-bgPhone border border-borderStrong pl-3 pr-11 py-2.5 text-[16px] text-white outline-none focus:border-accentGreen transition" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-textFaint text-[11px]">sec</span>
                  </label>
                  <button onClick={() => startOrStop(ex.id, s.id, s.reps)} disabled={s.isCompleted} aria-label="Start timer"
                    className={`h-11 min-w-[68px] px-3 rounded-xl flex items-center justify-center gap-1.5 tabular-nums transition active:scale-95 disabled:opacity-40
                      ${timer?.setId === s.id ? "bg-accentGreen text-deepGreen" : "bg-bgPhone border border-borderStrong text-white"}`}>
                    {timer?.setId === s.id
                      ? <span className="font-display text-[18px]">{mmss(timer.remaining)}</span>
                      : (<><Icon name="play" size={15} /><span className="text-[13px] font-semibold">Go</span></>)}
                  </button>
                </div>
              ) : (
                <div className={`flex-1 grid gap-2 ${weighted ? "grid-cols-2" : "grid-cols-1"}`}>
                  {weighted && (
                    <label className="relative">
                      <input type="number" inputMode="decimal" value={s.weight || ""}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          if (i === 0) propagateWeight(ex.id, v); else patchSet(ex.id, s.id, { weight: v });
                        }}
                        placeholder="0"
                        className="w-full rounded-xl bg-bgPhone border border-borderStrong pl-3 pr-9 py-2.5 text-[16px] text-white outline-none focus:border-accentGreen transition" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-textFaint text-[11px]">{unit}</span>
                    </label>
                  )}
                  <label className="relative">
                    <input type="number" inputMode="numeric" value={s.reps || ""}
                      onChange={(e) => patchSet(ex.id, s.id, { reps: Number(e.target.value) })}
                      placeholder="0"
                      className="w-full rounded-xl bg-bgPhone border border-borderStrong pl-3 pr-11 py-2.5 text-[16px] text-white outline-none focus:border-accentGreen transition" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-textFaint text-[11px]">reps</span>
                  </label>
                </div>
              )}
              <button onClick={() => toggleComplete(ex.id, s.id)} aria-label="Complete set"
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition active:scale-90
                  ${s.isCompleted ? "bg-accentGreen text-deepGreen" : "bg-bgPhone border border-borderStrong text-textFaint hover:border-accentGreen/60"}`}>
                <Icon name="check" size={20} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* rest timer */}
      {rest != null && (
        <div className="mx-5 mb-2 rounded-2xl bg-accentGreen text-deepGreen px-4 py-3 flex items-center justify-between ff-pop">
          <span className="font-semibold text-[14px] inline-flex items-center gap-2"><Icon name="clock" size={16} /> Rest</span>
          <span className="font-display text-[28px] leading-none tabular-nums">{Math.floor(rest / 60)}:{String(rest % 60).padStart(2, "0")}</span>
          <button onClick={() => setRest(null)} className="text-deepGreen/70 text-[13px] font-medium underline">Skip</button>
        </div>
      )}

      {/* bottom navigation */}
      <div className="px-5 py-4 sticky bottom-0 bg-bgPhone/95 backdrop-blur border-t border-border">
        <div className="flex items-center gap-3">
          <button onClick={goPrev} disabled={idx === 0} aria-label="Previous exercise"
            className="w-14 h-[52px] shrink-0 rounded-2xl border border-borderStrong text-white flex items-center justify-center transition active:scale-95 disabled:opacity-30 disabled:active:scale-100 hover:bg-white/5">
            <Icon name="back" size={20} />
          </button>
          <button onClick={goNext}
            className="flex-1 h-[52px] rounded-2xl bg-accentGreen text-deepGreen font-bold text-[15px] flex items-center justify-center gap-2 active:scale-[0.98] transition">
            {idx < last ? (<>Next exercise <Icon name="chevron" size={18} /></>) : (<>Finish workout <Icon name="check" size={18} /></>)}
          </button>
        </div>
      </div>

      {detail && <ExerciseDetail exercise={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}
