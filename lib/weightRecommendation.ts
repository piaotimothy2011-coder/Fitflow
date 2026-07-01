// Rough starting-weight suggestion from the user's profile (bodyweight, sex,
// age, experience level). This is only a gentle starting point, not coaching —
// the user can adjust every set. Returns a value in the user's DISPLAY unit
// (lb or kg), rounded to a sensible increment, or null when we lack bodyweight.
import { levelFrom } from "./exerciseCatalog";
import type { UnitSystem, BiologicalSex } from "./models";
import { weightToDisplay } from "./units";

// Working-set load as a fraction of bodyweight for a typical beginner.
// Barbell moves are total-bar load; dumbbell/kettlebell are per-implement.
const FRACTIONS: Record<string, number> = {
  "Back Squat": 0.55,
  "Deadlift": 0.70,
  "Bench Press": 0.45,
  "Overhead Press": 0.28,
  "Barbell Row": 0.40,
  "Goblet Squat": 0.25,
  "Dumbbell Press": 0.18,
  "Dumbbell Row": 0.18,
  "Dumbbell Romanian Deadlift": 0.20,
  "Dumbbell Shoulder Press": 0.14,
  "Dumbbell Lateral Raise": 0.05,
  "Dumbbell Biceps Curl": 0.08,
  "Dumbbell Walking Lunges": 0.18,
  "Kettlebell Swing": 0.22,
  "Kettlebell Goblet Carry": 0.22,
  "Cable Lat Pulldown": 0.45,
  "Cable Row": 0.40,
  "Cable Triceps Pressdown": 0.20,
};

export interface Profile {
  bodyweightKg?: number | null;
  sex?: BiologicalSex | null;
  age?: number | null;
  level?: string;
  units: UnitSystem;
}

export function recommendedStartWeight(name: string, p: Profile): number | null {
  const bw = p.bodyweightKg;
  if (!bw || bw <= 0) return null;
  const frac = FRACTIONS[name] ?? 0.2;

  const levelMult = [0.75, 1.0, 1.35, 1.7, 2.0][levelFrom(p.level ?? "Beginner")] ?? 1.0;
  const sexMult = p.sex === "female" ? 0.68 : p.sex === "male" ? 1.0 : 0.82;
  const age = p.age ?? 30;
  const ageMult = age >= 60 ? 0.8 : age >= 50 ? 0.88 : age >= 40 ? 0.95 : 1.0;

  const kg = bw * frac * levelMult * sexMult * ageMult;
  const disp = weightToDisplay(kg, p.units);
  if (p.units === "imperial") return Math.max(5, Math.round(disp / 5) * 5);
  return Math.max(2.5, Math.round(disp / 2.5) * 2.5);
}
