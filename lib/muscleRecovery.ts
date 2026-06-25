// Ported from Services/MuscleRecoveryEngine.swift
import { MUSCLE_GROUPS, recoveryHours, type MuscleGroup, type MuscleState } from "./muscle";
import { setVolume, type SetLog } from "./models";

const FULL_HIT_VOLUME = 4000;

export function recoverySnapshot(logs: SetLog[], now = new Date()): MuscleState[] {
  const fatigue = new Map<MuscleGroup, number>();
  const lastTrained = new Map<MuscleGroup, string>();

  const apply = (log: SetLog, muscles: MuscleGroup[], weightFactor: number, hoursElapsed: number) => {
    for (const muscle of muscles) {
      const decay = Math.max(0, 1 - hoursElapsed / recoveryHours(muscle));
      if (decay <= 0) continue;
      const depth = Math.min(1, setVolume(log) / FULL_HIT_VOLUME) * weightFactor;
      fatigue.set(muscle, (fatigue.get(muscle) ?? 0) + depth * decay);
      const existing = lastTrained.get(muscle);
      if (!existing || new Date(log.date) > new Date(existing)) lastTrained.set(muscle, log.date);
    }
  };

  for (const log of logs) {
    const hoursElapsed = (now.getTime() - new Date(log.date).getTime()) / 3_600_000;
    if (hoursElapsed < 0) continue;
    apply(log, log.primaryMuscles, 1, hoursElapsed);
    apply(log, log.secondaryMuscles, 0.5, hoursElapsed);
  }

  return MUSCLE_GROUPS.map((muscle) => {
    const f = Math.min(1, Math.max(0, fatigue.get(muscle) ?? 0));
    return { muscle, recovery: 1 - f, lastTrained: lastTrained.get(muscle) };
  });
}

export function recommendedMuscles(logs: SetLog[], limit = 4, now = new Date()): MuscleGroup[] {
  return recoverySnapshot(logs, now)
    .sort((a, b) => b.recovery - a.recovery)
    .slice(0, limit)
    .map((s) => s.muscle);
}

export function overallReadiness(logs: SetLog[], now = new Date()): number {
  const states = recoverySnapshot(logs, now);
  if (!states.length) return 1;
  return states.reduce((acc, s) => acc + s.recovery, 0) / states.length;
}
