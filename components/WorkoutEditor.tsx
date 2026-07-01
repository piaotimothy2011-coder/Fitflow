"use client";
import React, { useState } from "react";
import { useApp } from "./AppState";
import { Icon } from "./icons";
import { SectionLabel } from "./ui";
import { EXERCISE_CATALOG } from "@/lib/exerciseCatalog";
import { setsFromPrescription, isTimed } from "@/lib/workoutGenerator";
import { muscleDisplayName } from "@/lib/muscle";
import { uuid, newSet, type Workout, type Exercise } from "@/lib/models";

export default function WorkoutEditor({ onExit }: { onExit: () => void }) {
  const { currentWorkout, setCurrentWorkout } = useApp();
  const [w, setW] = useState<Workout | null>(currentWorkout);
  const [adding, setAdding] = useState(false);
  const [q, setQ] = useState("");

  if (!w) { onExit(); return null; }

  const update = (exercises: Exercise[]) => setW({ ...w, exercises });

  const removeEx = (id: string) => update(w.exercises.filter((e) => e.id !== id));

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= w.exercises.length) return;
    const arr = [...w.exercises];
    [arr[i], arr[j]] = [arr[j], arr[i]];
    update(arr);
  };

  const changeSets = (id: string, delta: number) => {
    update(w.exercises.map((e) => {
      if (e.id !== id) return e;
      let sets = [...e.sets];
      if (delta > 0 && sets.length < 10) {
        const lastS = sets[sets.length - 1];
        sets.push(newSet(lastS?.weight ?? 0, lastS?.reps ?? 10));
      } else if (delta < 0 && sets.length > 1) {
        sets = sets.slice(0, -1);
      }
      return { ...e, sets };
    }));
  };

  const addExercise = (name: string) => {
    const ce = EXERCISE_CATALOG.find((c) => c.name === name);
    if (!ce) return;
    const timedAdd = isTimed(ce.name) || ce.styles.includes("mobility") || ce.styles.includes("mindful");
    const detail = timedAdd ? "3 x 45 sec" : "3 x 10 reps";
    const ex: Exercise = {
      id: uuid(), name: ce.name, detail, tip: ce.tip,
      sets: setsFromPrescription(detail),
      primaryMuscles: ce.primaryMuscles, secondaryMuscles: ce.secondaryMuscles,
    };
    update([...w.exercises, ex]);
    setAdding(false);
    setQ("");
  };

  const save = () => { setCurrentWorkout({ ...w, meta: w.meta.replace(/\d+\s*exercises/, `${w.exercises.length} exercises`) }); onExit(); };

  const present = new Set(w.exercises.map((e) => e.name));
  const options = EXERCISE_CATALOG
    .filter((c) => !present.has(c.name))
    .filter((c) => q.trim() === "" || c.name.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="min-h-screen flex flex-col">
      {/* header */}
      <div className="px-5 pt-8 pb-3 sticky top-0 bg-bgPhone/95 backdrop-blur z-20 flex items-center justify-between border-b border-border">
        <button onClick={onExit} aria-label="Cancel"
          className="w-9 h-9 rounded-full bg-bgCard border border-border flex items-center justify-center text-textMuted hover:text-white transition active:scale-95">
          <Icon name="close" size={18} />
        </button>
        <div className="font-display text-[20px] text-white">Edit workout</div>
        <button onClick={save}
          className="rounded-full bg-accentGreen text-deepGreen font-bold text-[13px] px-4 py-2 active:scale-95 transition">
          Save
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-4">
        <SectionLabel className="mb-2.5">{w.exercises.length} exercise{w.exercises.length === 1 ? "" : "s"}</SectionLabel>
        <div className="space-y-2.5">
          {w.exercises.map((e, i) => (
            <div key={e.id} className="rounded-2xl bg-bgCard border border-border p-3.5">
              <div className="flex items-start gap-3">
                <div className="flex flex-col gap-1 pt-0.5">
                  <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up"
                    className="text-textFaint hover:text-white disabled:opacity-25 transition"><Icon name="chevron" size={16} className="-rotate-90" /></button>
                  <button onClick={() => move(i, 1)} disabled={i === w.exercises.length - 1} aria-label="Move down"
                    className="text-textFaint hover:text-white disabled:opacity-25 transition"><Icon name="chevron" size={16} className="rotate-90" /></button>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-white text-[15px] font-semibold truncate">{e.name}</div>
                  <div className="text-textFaint text-[12px] mt-0.5 truncate">
                    {e.primaryMuscles.slice(0, 2).map((m) => muscleDisplayName[m]).join(" · ")}
                  </div>
                </div>
                <button onClick={() => removeEx(e.id)} aria-label="Remove exercise"
                  className="text-textFaint hover:text-red-400 transition shrink-0"><Icon name="close" size={18} /></button>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                <span className="text-textFaint text-[12px] uppercase tracking-wider">Sets</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => changeSets(e.id, -1)} aria-label="Fewer sets"
                    className="w-8 h-8 rounded-lg border border-borderStrong text-white flex items-center justify-center active:scale-90 transition hover:bg-white/5">−</button>
                  <span className="font-display text-[20px] text-white w-6 text-center tabular-nums">{e.sets.length}</span>
                  <button onClick={() => changeSets(e.id, 1)} aria-label="More sets"
                    className="w-8 h-8 rounded-lg border border-borderStrong text-white flex items-center justify-center active:scale-90 transition hover:bg-white/5"><Icon name="plus" size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button onClick={() => setAdding(true)}
          className="w-full mt-4 rounded-2xl border border-dashed border-borderStrong text-white font-medium py-3.5 text-[14px] flex items-center justify-center gap-2 active:scale-[0.98] transition hover:bg-white/5">
          <Icon name="plus" size={17} /> Add exercise
        </button>
      </div>

      {/* add-exercise picker */}
      {adding && (
        <div className="fixed inset-0 z-50 flex justify-center">
          <div className="w-full max-w-[440px] bg-bgPhone flex flex-col ff-pop">
            <div className="px-5 pt-8 pb-3 flex items-center justify-between border-b border-border">
              <button onClick={() => { setAdding(false); setQ(""); }} aria-label="Close"
                className="w-9 h-9 rounded-full bg-bgCard border border-border flex items-center justify-center text-textMuted hover:text-white transition active:scale-95">
                <Icon name="close" size={18} />
              </button>
              <div className="font-display text-[20px] text-white">Add exercise</div>
              <span className="w-9" />
            </div>
            <div className="px-5 py-3">
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search exercises…" autoFocus
                className="w-full rounded-xl bg-bgCard border border-borderStrong px-4 py-3 text-[15px] text-white outline-none focus:border-accentGreen transition" />
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-6 space-y-2">
              {options.length === 0 && (
                <p className="text-textFaint text-[14px] text-center pt-8">No matching exercises.</p>
              )}
              {options.map((c) => (
                <button key={c.name} onClick={() => addExercise(c.name)}
                  className="w-full flex items-center gap-3 rounded-2xl bg-bgCard border border-border p-3.5 text-left active:scale-[0.99] transition hover:border-white/20">
                  <span className="w-9 h-9 rounded-xl bg-accentGreen/15 text-accentGreen flex items-center justify-center shrink-0"><Icon name="dumbbell" size={17} /></span>
                  <div className="min-w-0 flex-1">
                    <div className="text-white text-[14.5px] font-medium truncate">{c.name}</div>
                    <div className="text-textFaint text-[12px] truncate">{c.primaryMuscles.slice(0, 2).map((m) => muscleDisplayName[m]).join(" · ")} · {c.equipment[0]}</div>
                  </div>
                  <span className="text-accentGreen shrink-0"><Icon name="plus" size={18} /></span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
