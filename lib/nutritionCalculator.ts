// Ported from Services/NutritionCalculator.swift
import type { Survey, DailyTargets, Macros, BiologicalSex } from "./models";

export function mifflinStJeor(sex: BiologicalSex, ageYears: number, heightCm: number, weightKg: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  if (sex === "male") return base + 5;
  if (sex === "female") return base - 161;
  return base - 78;
}

export function activityMultiplier(daysPerWeek: number, level: string): number {
  let levelBoost: number;
  switch (level) {
    case "Complete beginner": levelBoost = 0; break;
    case "Beginner": levelBoost = 0.03; break;
    case "Intermediate": levelBoost = 0.06; break;
    case "Advanced": levelBoost = 0.1; break;
    case "Athlete": levelBoost = 0.14; break;
    default: levelBoost = 0.04;
  }
  let base: number;
  if (daysPerWeek <= 1) base = 1.2;
  else if (daysPerWeek <= 3) base = 1.375;
  else if (daysPerWeek <= 5) base = 1.55;
  else if (daysPerWeek === 6) base = 1.725;
  else base = 1.9;
  return base + levelBoost;
}

export function adjustedCalories(tdee: number, goal: string): number {
  switch (goal) {
    case "Lose weight": return tdee * 0.8;
    case "Build muscle": return tdee * 1.1;
    case "Increase strength": return tdee * 1.05;
    case "Athletic performance": return tdee * 1.05;
    default: return tdee;
  }
}

export function macroSplit(calories: number, goal: string): Macros {
  let proteinPct: number, fatPct: number;
  switch (goal) {
    case "Build muscle":
    case "Increase strength": proteinPct = 0.3; fatPct = 0.25; break;
    case "Lose weight": proteinPct = 0.35; fatPct = 0.3; break;
    case "Improve endurance": proteinPct = 0.2; fatPct = 0.25; break;
    case "Athletic performance": proteinPct = 0.28; fatPct = 0.25; break;
    default: proteinPct = 0.25; fatPct = 0.3;
  }
  const carbsPct = Math.max(0, 1 - proteinPct - fatPct);
  return {
    calories,
    proteinG: (calories * proteinPct) / 4,
    carbsG: (calories * carbsPct) / 4,
    fatG: (calories * fatPct) / 9,
  };
}

export function waterTarget(weightKg: number, daysPerWeek: number): number {
  const ml = weightKg * 33 + daysPerWeek * 250;
  const oz = ml / 29.5735;
  return Math.max(48, Math.round(oz / 8) * 8);
}

export function targetsForSurvey(s: Survey): DailyTargets {
  const bmr = mifflinStJeor(s.sex ?? "preferNotToSay", s.age ?? 30, s.heightCm ?? 170, s.weightKg ?? 70);
  const tdee = bmr * activityMultiplier(s.days, s.level);
  const calories = Math.round(adjustedCalories(tdee, s.goal));
  const m = macroSplit(calories, s.goal);
  return {
    calories,
    proteinG: Math.round(m.proteinG),
    carbsG: Math.round(m.carbsG),
    fatG: Math.round(m.fatG),
    waterOz: waterTarget(s.weightKg ?? 70, s.days),
  };
}
