// Ported from Services/ProgressionEngine.swift
import {
  type Workout, type Exercise, type ExerciseSet, type SetLog, type UnitSystem,
  exerciseAllMuscles,
} from "./models";

function mostRecentSession(logs: SetLog[]): SetLog[] | null {
  if (!logs.length) return null;
  const mostRecent = logs.reduce((a, b) => (new Date(a.date) > new Date(b.date) ? a : b));
  const day = new Date(mostRecent.date); day.setHours(0, 0, 0, 0);
  const dayEnd = new Date(day); dayEnd.setHours(23, 59, 59, 999);
  const dayLogs = logs.filter((l) => {
    const d = new Date(l.date);
    return d >= day && d <= dayEnd;
  });
  return dayLogs.length ? dayLogs : null;
}

function targetReps(ex: Exercise): number {
  const reps = ex.sets.map((s) => s.reps).filter((r) => r > 0).sort((a, b) => a - b);
  if (!reps.length) return 10;
  return reps[Math.floor(reps.length / 2)];
}

function bumpStep(ex: Exercise, units: UnitSystem): number {
  const all = exerciseAllMuscles(ex);
  const isCompound = ex.primaryMuscles.length >= 2 ||
    all.includes("quads") || all.includes("glutes") || all.includes("chest") ||
    all.includes("lats") || all.includes("lowerBack");
  if (units === "imperial") return isCompound ? 5 : 2.5;
  return isCompound ? 2.5 : 1;
}

function adjust(ex: Exercise, history: SetLog[], units: UnitSystem): Exercise {
  const logs = history.filter((l) => l.exerciseName === ex.name);
  const lastSession = mostRecentSession(logs);
  if (!lastSession) return ex;
  const bestSet = lastSession.reduce((a, b) => {
    if (a.weight !== b.weight) return a.weight > b.weight ? a : b;
    return a.reps >= b.reps ? a : b;
  });
  const tReps = targetReps(ex);
  const hitAll = lastSession.every((l) => l.reps >= tReps);
  const bump = bumpStep(ex, units);
  const newSets: ExerciseSet[] = ex.sets.map((set) => {
    if (bestSet.weight > 0) {
      const w = hitAll ? bestSet.weight + bump : bestSet.weight;
      return { ...set, weight: Math.round(w), reps: tReps, isCompleted: false, completedAt: null };
    }
    const baseReps = Math.max(bestSet.reps, set.reps);
    return { ...set, weight: 0, reps: hitAll ? baseReps + 1 : baseReps, isCompleted: false, completedAt: null };
  });
  return { ...ex, sets: newSets };
}

export function applyProgression(workout: Workout, history: SetLog[], units: UnitSystem = "imperial"): Workout {
  if (!history.length) return workout;
  return { ...workout, exercises: workout.exercises.map((ex) => adjust(ex, history, units)) };
}
