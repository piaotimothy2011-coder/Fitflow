// Core data models — ported from Models/*.swift
import type { MuscleGroup } from "./muscle";

export const uuid = () =>
  (globalThis.crypto?.randomUUID?.() ??
    "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36));

// ---- Diet ----
export interface Macros {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}
export const zeroMacros = (): Macros => ({ calories: 0, proteinG: 0, carbsG: 0, fatG: 0 });
export function addMacros(a: Macros, b: Macros): Macros {
  return {
    calories: a.calories + b.calories,
    proteinG: a.proteinG + b.proteinG,
    carbsG: a.carbsG + b.carbsG,
    fatG: a.fatG + b.fatG,
  };
}

export interface DailyTargets {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  waterOz: number;
}
export const placeholderTargets = (): DailyTargets => ({
  calories: 2000, proteinG: 130, carbsG: 220, fatG: 70, waterOz: 64,
});

export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";
export const MEAL_SLOTS: MealSlot[] = ["breakfast", "lunch", "dinner", "snack"];
export const mealSlotLabel = (s: MealSlot) => s.charAt(0).toUpperCase() + s.slice(1);

export interface MealEntry {
  id: string;
  date: string; // ISO
  slot: MealSlot;
  name: string;
  servings: number;
  macros: Macros; // per serving
  externalId?: string | null;
}
export function mealTotalMacros(m: MealEntry): Macros {
  return {
    calories: Math.round(m.macros.calories * m.servings),
    proteinG: m.macros.proteinG * m.servings,
    carbsG: m.macros.carbsG * m.servings,
    fatG: m.macros.fatG * m.servings,
  };
}

export interface WaterEntry {
  id: string;
  date: string; // ISO
  amountOz: number;
}

export interface Recipe {
  id: string;
  name: string;
  subtitle: string;
  slot: MealSlot;
  macros: Macros;
  dietStyles: string[];
  freeOf: string[];
  cookMinutes: number;
  ingredients: string[];
  steps: string[];
}

// ---- Sex / units ----
export type BiologicalSex = "male" | "female" | "other" | "preferNotToSay";
export type UnitSystem = "metric" | "imperial";

// ---- User ----
export type AuthProvider = "email" | "apple" | "google";
export interface User {
  id: string;
  name: string;
  email?: string | null;
  age?: number | null;
  heightCm?: number | null;
  weightKg?: number | null;
  sex?: BiologicalSex | null;
  createdAt: string;
  authProvider: AuthProvider;
}
export function userInitials(u: User): string {
  const parts = u.name.trim().split(/\s+/).slice(0, 2);
  const r = parts.map((p) => p[0] ?? "").join("").toUpperCase();
  return r || "YOU";
}

export interface UserPreferences {
  units: UnitSystem;
  defaultRestSeconds: number;
  notificationsEnabled: boolean;
  dailyReminderHour: number;
  healthSyncEnabled: boolean;
}
export const defaultPreferences = (): UserPreferences => ({
  units: "imperial",
  defaultRestSeconds: 60,
  notificationsEnabled: false,
  dailyReminderHour: 18,
  healthSyncEnabled: false,
});

// ---- Survey ----
export interface Survey {
  goal: string;
  level: string;
  days: number;
  equipment: string[];
  focus: string[];
  minutes: number;
  sex?: BiologicalSex | null;
  age?: number | null;
  heightCm?: number | null;
  weightKg?: number | null;
  dietStyle: string;
  allergies: string[];
  mealsPerDay: number;
}
export const emptySurvey = (): Survey => ({
  goal: "", level: "", days: 3, equipment: [], focus: [], minutes: 30,
  sex: null, age: null, heightCm: null, weightKg: null,
  dietStyle: "", allergies: [], mealsPerDay: 3,
});
export const surveyIsComplete = (s: Survey) => s.goal !== "" && s.level !== "";

// ---- Workout ----
export interface ExerciseSet {
  id: string;
  weight: number;
  reps: number;
  isWarmup: boolean;
  isCompleted: boolean;
  completedAt?: string | null;
}
export const newSet = (weight = 0, reps = 10): ExerciseSet => ({
  id: uuid(), weight, reps, isWarmup: false, isCompleted: false, completedAt: null,
});

export interface Exercise {
  id: string;
  name: string;
  detail: string;
  tip: string;
  sets: ExerciseSet[];
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
}
export const exerciseAllMuscles = (e: Exercise): MuscleGroup[] =>
  [...e.primaryMuscles, ...e.secondaryMuscles];
export const exerciseCompletedSetCount = (e: Exercise) =>
  e.sets.filter((s) => s.isCompleted).length;
export const exerciseIsFullyLogged = (e: Exercise) =>
  e.sets.length > 0 && e.sets.every((s) => s.isCompleted);

export interface Workout {
  id: string;
  workoutName: string;
  tag: string;
  meta: string;
  exercises: Exercise[];
}
export function workoutTargetedMuscles(w: Workout): MuscleGroup[] {
  const seen = new Set<MuscleGroup>();
  const out: MuscleGroup[] = [];
  for (const ex of w.exercises) {
    for (const m of ex.primaryMuscles) {
      if (!seen.has(m)) { seen.add(m); out.push(m); }
    }
  }
  return out;
}
// Fresh copy: new ids, sets reset to not-completed, target weight/reps kept.
export function makeFreshCopy(w: Workout): Workout {
  return {
    id: uuid(),
    workoutName: w.workoutName,
    tag: w.tag,
    meta: w.meta,
    exercises: w.exercises.map((ex) => ({
      id: uuid(),
      name: ex.name,
      detail: ex.detail,
      tip: ex.tip,
      primaryMuscles: ex.primaryMuscles,
      secondaryMuscles: ex.secondaryMuscles,
      sets: ex.sets.map((s) => ({
        id: uuid(), weight: s.weight, reps: s.reps,
        isWarmup: s.isWarmup, isCompleted: false, completedAt: null,
      })),
    })),
  };
}

// ---- Logs ----
export interface WorkoutLog {
  id: string;
  date: string;
  workoutName: string;
  tag: string;
  exercisesCompleted: number;
  totalExercises: number;
  durationMinutes: number;
  goal: string;
}

export interface SetLog {
  id: string;
  date: string;
  exerciseName: string;
  weight: number;
  reps: number;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
}
export function setVolume(s: SetLog): number {
  const w = Math.max(s.weight, 0);
  return w > 0 ? w * s.reps : s.reps;
}
export function estimated1RM(s: { weight: number; reps: number }): number {
  if (s.weight <= 0 || s.reps <= 0) return 0;
  if (s.reps === 1) return s.weight;
  return s.weight * (1 + s.reps / 30);
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  createdAt: string;
  workout: Workout;
}
