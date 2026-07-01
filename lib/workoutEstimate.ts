// Rough estimate of how long a whole workout will take, in minutes.
// Adds up per-set work time + rest, plus a little setup time per exercise.
import { type Workout } from "./models";
import { isTimed } from "./workoutGenerator";

export function estimateWorkoutMinutes(w: Workout, defaultRestSeconds = 60): number {
  let seconds = 0;
  for (const ex of w.exercises) {
    const timed = /\d+\s*sec/i.test(ex.detail) || isTimed(ex.name);
    const offMatch = ex.detail.match(/(\d+)\s*(?:sec\s*)?off/i);
    const rest = offMatch ? Math.max(5, parseInt(offMatch[1], 10)) : defaultRestSeconds;
    for (const s of ex.sets) {
      const work = timed ? Math.max(10, s.reps) : Math.max(20, s.reps * 3);
      seconds += work + rest;
    }
    seconds += 15;
  }
  return Math.max(1, Math.round(seconds / 60));
}
