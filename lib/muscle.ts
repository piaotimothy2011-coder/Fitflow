// Muscle taxonomy + recovery model — ported from Models/Muscle.swift

export type BodyRegion = "front" | "back";

export const MUSCLE_GROUPS = [
  "chest", "shoulders", "biceps", "triceps", "forearms",
  "abs", "obliques", "lats", "upperBack", "lowerBack", "traps",
  "glutes", "quads", "hamstrings", "calves",
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const muscleDisplayName: Record<MuscleGroup, string> = {
  chest: "Chest", shoulders: "Shoulders", biceps: "Biceps", triceps: "Triceps",
  forearms: "Forearms", abs: "Abs", obliques: "Obliques", lats: "Lats",
  upperBack: "Upper Back", lowerBack: "Lower Back", traps: "Traps",
  glutes: "Glutes", quads: "Quads", hamstrings: "Hamstrings", calves: "Calves",
};

export function muscleRegion(m: MuscleGroup): BodyRegion {
  switch (m) {
    case "chest": case "biceps": case "abs": case "obliques":
    case "quads": case "forearms": case "shoulders":
      return "front";
    default:
      return "back";
  }
}

export function recoveryHours(m: MuscleGroup): number {
  switch (m) {
    case "quads": case "hamstrings": case "glutes":
    case "lats": case "chest": case "upperBack":
      return 72;
    case "lowerBack": case "shoulders": case "traps":
      return 60;
    default:
      return 48; // biceps, triceps, abs, obliques, calves, forearms
  }
}

export function muscleCategory(m: MuscleGroup): string {
  switch (m) {
    case "chest": case "shoulders": case "biceps": case "triceps": case "forearms":
      return "Upper Body";
    case "lats": case "upperBack": case "lowerBack": case "traps":
      return "Back";
    case "abs": case "obliques":
      return "Core";
    default:
      return "Lower Body"; // glutes, quads, hamstrings, calves
  }
}

export type RecoveryStatus = "fresh" | "recovering" | "fatigued";

export function recoveryStatus(recovery: number): RecoveryStatus {
  if (recovery >= 0.85) return "fresh";
  if (recovery >= 0.4) return "recovering";
  return "fatigued";
}

export interface MuscleState {
  muscle: MuscleGroup;
  recovery: number; // 0..1
  lastTrained?: string; // ISO date
}
