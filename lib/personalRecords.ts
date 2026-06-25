// Ported from Services/PersonalRecords.swift
import { estimated1RM, setVolume, type SetLog } from "./models";

export interface ExerciseRecord {
  exerciseName: string;
  bestWeight: number;
  best1RM: number;
  best1RMReps: number;
  best1RMWeight: number;
  bestReps: number;
  bestVolume: number;
  totalSets: number;
  lastTrained: string;
  prDate?: string | null;
}

export interface PRNotice {
  exerciseName: string;
  weight: number;
  reps: number;
  estimated1RM: number;
}

export function computeRecords(logs: SetLog[]): ExerciseRecord[] {
  const groups = new Map<string, SetLog[]>();
  for (const l of logs) {
    const arr = groups.get(l.exerciseName) ?? [];
    arr.push(l);
    groups.set(l.exerciseName, arr);
  }
  const records: ExerciseRecord[] = [];
  for (const [name, sets] of groups) {
    if (!sets.length) continue;
    const bestWeight = Math.max(...sets.map((s) => s.weight));
    const bestReps = Math.max(...sets.map((s) => s.reps));
    const bestVolume = Math.max(...sets.map(setVolume));
    const lastTrained = sets.reduce((a, b) => (new Date(a.date) > new Date(b.date) ? a : b)).date;
    const best1RMSet = sets.reduce((a, b) => (estimated1RM(a) >= estimated1RM(b) ? a : b));
    const best1RM = estimated1RM(best1RMSet);
    records.push({
      exerciseName: name, bestWeight, best1RM,
      best1RMReps: best1RMSet.reps, best1RMWeight: best1RMSet.weight,
      bestReps, bestVolume, totalSets: sets.length, lastTrained,
      prDate: best1RM > 0 ? best1RMSet.date : null,
    });
  }
  return records.sort((a, b) => (b.best1RM - a.best1RM) || (b.bestVolume - a.bestVolume));
}

export function isNew1RMPR(candidate: SetLog, priorLogs: SetLog[]): boolean {
  const c = estimated1RM(candidate);
  if (c <= 0) return false;
  const priorBest = Math.max(0, ...priorLogs
    .filter((l) => l.exerciseName === candidate.exerciseName)
    .map(estimated1RM));
  return c > priorBest + 0.01;
}
