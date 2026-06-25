// Ported from Services/WorkoutGenerator.swift (LocalWorkoutGenerator + smart plan)
import {
  EXERCISE_CATALOG, filterCatalog, forMuscles, levelFrom, styleForGoal,
  type CatalogExercise, type FitnessLevel, type TrainingStyle,
} from "./exerciseCatalog";
import { recoverySnapshot, overallReadiness, recommendedMuscles } from "./muscleRecovery";
import { muscleCategory, type MuscleGroup } from "./muscle";
import { newSet, type Exercise, type ExerciseSet, type SetLog, type Survey, type Workout, uuid } from "./models";

function exerciseCount(minutes: number, style: TrainingStyle): number {
  switch (style) {
    case "mobility": case "mindful":
      return minutes <= 30 ? 5 : minutes <= 60 ? 6 : 7;
    case "hiit": case "endurance":
      return minutes <= 20 ? 4 : minutes <= 45 ? 6 : 7;
    case "strength":
      return minutes <= 30 ? 4 : minutes <= 60 ? 5 : 6;
    default:
      return minutes <= 30 ? 5 : minutes <= 60 ? 6 : 7;
  }
}

// Deterministic fit score: how well an exercise matches the user's inputs.
function fitScore(ex: CatalogExercise, focus: string[], style: TrainingStyle, level: FitnessLevel): number {
  let s = 0;
  if (ex.styles.includes(style)) s += 3;                 // matches training goal
  const requested = focus.filter((f) => f !== "No preference" && f !== "");
  s += requested.filter((f) => ex.bodyParts.includes(f)).length * 2.5; // hits target areas
  s += ex.minLevel <= level ? 1 : -3;                    // appropriate for ability
  s -= Math.abs(level - ex.minLevel) * 0.3;              // not far below ability
  s += ex.primaryMuscles.length * 0.4;                   // favour compounds
  return s;
}

// Deterministic selection: same inputs always yield the same plan, with each
// requested focus area guaranteed representation. No randomness.
function balancedPick(pool: CatalogExercise[], focus: string[], style: TrainingStyle, level: FitnessLevel, count: number): CatalogExercise[] {
  const requested = focus.filter((f) => f !== "No preference" && f !== "");
  const ranked = [...pool].sort((a, b) =>
    (fitScore(b, focus, style, level) - fitScore(a, focus, style, level)) || a.name.localeCompare(b.name));
  const chosen: CatalogExercise[] = [];
  for (const area of requested) {
    if (chosen.length >= count) break;
    const pick = ranked.find((ex) => ex.bodyParts.includes(area) && !chosen.includes(ex));
    if (pick) chosen.push(pick);
  }
  for (const ex of ranked) {
    if (chosen.length >= count) break;
    if (!chosen.includes(ex)) chosen.push(ex);
  }
  return chosen;
}

const TIMED_KEYWORDS = [
  "plank", "hang", "stretch", "pose", "breathing", "flow", "hold", "wall sit",
  "jogging", "rope", "knees", "intervals", "bike", "carry", "salutation", "slides", "climber",
];
function isTimed(name: string): boolean {
  const lower = name.toLowerCase();
  return TIMED_KEYWORDS.some((k) => lower.includes(k));
}

function prescribe(style: TrainingStyle, level: FitnessLevel, name: string): string {
  const timed = isTimed(name);
  switch (style) {
    case "hiit": return timed ? "4 x 40 sec on / 20 off" : `4 x ${level >= 2 ? 15 : 12} reps`;
    case "hypertrophy": return `4 x ${level >= 2 ? 10 : 12} reps`;
    case "endurance": return timed ? "4 x 90 sec" : `3 x ${level >= 2 ? 20 : 15} reps`;
    case "strength": return `5 x ${level >= 3 ? 5 : 6} reps · 2-3 min rest`;
    case "mobility": return "3 x 45 sec per side";
    case "mindful": return "3 x 90 sec";
    case "power": return timed ? "5 x 30 sec" : "5 x 4 reps · full recovery";
    case "general": return timed ? "3 x 45 sec" : "3 x 12 reps";
    case "corrective": return "3 x 12 reps · slow tempo";
  }
}

export function setsFromPrescription(detail: string): ExerciseSet[] {
  const m = detail.match(/(\d+)\s*x\s*(\d+)/);
  if (!m) return [newSet(0, 10), newSet(0, 10), newSet(0, 10)];
  const n = Math.max(1, Math.min(parseInt(m[1], 10), 10));
  const reps = Math.max(1, Math.min(parseInt(m[2], 10), 200));
  return Array.from({ length: n }, () => newSet(0, reps));
}

function tagFor(style: TrainingStyle): string {
  return {
    hiit: "HIIT FAT BURN", hypertrophy: "HYPERTROPHY SPLIT", endurance: "CARDIO INTERVALS",
    strength: "HEAVY COMPOUNDS", mobility: "STRETCH AND MOBILITY", mindful: "MINDFUL MOVEMENT",
    power: "EXPLOSIVE PLYO", general: "FULL BODY MIX", corrective: "ACTIVATION AND CONTROL",
  }[style];
}
function descriptorFor(style: TrainingStyle): string {
  return {
    hiit: "HIIT Circuit", hypertrophy: "Strength", endurance: "Aerobic", strength: "Strength",
    mobility: "Flexibility", mindful: "Yoga Flow", power: "Power", general: "Full Body", corrective: "Corrective",
  }[style];
}
function workoutName(style: TrainingStyle, focus: string[]): string {
  const area = focus.find((f) => f !== "No preference" && f !== "");
  const focusFragment = ({
    "Upper body": "Upper", "Lower body": "Lower", "Core and abs": "Core",
    "Back and posture": "Posture", "Chest and arms": "Push", "Glutes and legs": "Legs",
    Shoulders: "Shoulder", "Full body": "Total Body",
  } as Record<string, string>)[area ?? ""] ?? "Full Body";
  const styleFragment = {
    hiit: "Burn", hypertrophy: "Builder", endurance: "Engine", strength: "Strength",
    mobility: "Flow", mindful: "Reset", power: "Power", general: "Session", corrective: "Reset",
  }[style];
  return `${focusFragment} ${styleFragment}`;
}

function effectiveLevel(survey: Survey): FitnessLevel {
  let level = levelFrom(survey.level);
  if (survey.age != null && survey.age >= 60 && level > 2) level = 2;
  return level;
}

export function buildWorkout(survey: Survey): Workout {
  const style = styleForGoal(survey.goal);
  const level = effectiveLevel(survey);
  const minutes = Math.max(15, survey.minutes);

  let pool = filterCatalog(survey.equipment, survey.focus, level, style);
  if (pool.length < 4) {
    pool = [...pool, ...filterCatalog(survey.equipment, survey.focus, level, "general")];
  }
  if (pool.length < 4) {
    const eq = new Set(survey.equipment.length ? survey.equipment : ["No equipment"]);
    pool = EXERCISE_CATALOG.filter((ex) => ex.equipment.some((e) => eq.has(e)) && level >= ex.minLevel);
  }
  const seen = new Set<string>();
  pool = pool.filter((ex) => (seen.has(ex.name) ? false : (seen.add(ex.name), true)));
  if (!pool.length) {
    pool = EXERCISE_CATALOG.filter((ex) => ex.equipment.includes("No equipment") && level >= ex.minLevel);
  }

  const count = exerciseCount(minutes, style);
  const picked = balancedPick(pool, survey.focus, style, level, count);
  const addRestNote = (survey.age ?? 0) >= 55;

  const exercises: Exercise[] = picked.map((ex) => {
    let detail = prescribe(style, level, ex.name);
    if (addRestNote && !detail.toLowerCase().includes("rest")) detail += " · rest as needed";
    return {
      id: uuid(), name: ex.name, detail, tip: ex.tip,
      sets: setsFromPrescription(detail),
      primaryMuscles: ex.primaryMuscles, secondaryMuscles: ex.secondaryMuscles,
    };
  });

  const meta = `${minutes} min · ${descriptorFor(style)} · ${exercises.length} exercises`;
  return { id: uuid(), workoutName: workoutName(style, survey.focus), tag: tagFor(style), meta, exercises };
}

function smartScore(
  ex: CatalogExercise, style: TrainingStyle,
  recovery: Map<MuscleGroup, number>, recentNames: Set<string>
): number {
  const avg = (ms: MuscleGroup[]) =>
    ms.length ? ms.reduce((a, m) => a + (recovery.get(m) ?? 1), 0) / ms.length : 1;
  const styleBonus = ex.styles.includes(style) ? 0.18 : 0;
  const recentPenalty = recentNames.has(ex.name) ? 0.3 : 0;
  return avg(ex.primaryMuscles) + avg(ex.secondaryMuscles) * 0.35 + styleBonus - recentPenalty;
}

function smartWorkoutName(muscles: Set<MuscleGroup>, style: TrainingStyle): string {
  const cats = new Set([...muscles].map(muscleCategory));
  let area = "Full Body";
  if (cats.size === 1 && cats.has("Lower Body")) area = "Lower Body";
  else if (cats.size === 1 && cats.has("Upper Body")) area = "Upper Body";
  else if (cats.size === 1 && cats.has("Back")) area = "Back";
  else if (cats.size === 1 && cats.has("Core")) area = "Core";
  switch (style) {
    case "mobility": case "mindful": case "corrective": return `Smart ${area} Reset`;
    case "strength": case "power": return `Smart ${area} Strength`;
    case "hiit": case "endurance": return `Smart ${area} Engine`;
    case "hypertrophy": return `Smart ${area} Builder`;
    default: return `Smart ${area} Session`;
  }
}

export function buildSmartPlan(survey: Survey, setLogs: SetLog[]): Workout {
  if (!setLogs.length) {
    const first = buildWorkout(survey);
    return { ...first, workoutName: "Smart Starter", tag: "SMART PLAN" };
  }
  const style = styleForGoal(survey.goal);
  const level = effectiveLevel(survey);
  const minutes = Math.max(15, survey.minutes);

  const states = recoverySnapshot(setLogs);
  const recoveryByMuscle = new Map(states.map((s) => [s.muscle, s.recovery] as const));
  const readiness = overallReadiness(setLogs);
  const fresh = states.filter((s) => s.recovery >= 0.4).sort((a, b) => b.recovery - a.recovery).slice(0, 5).map((s) => s.muscle);
  const targetMuscles = new Set(fresh.length ? fresh : recommendedMuscles(setLogs, 5));

  let pool = forMuscles(targetMuscles, survey.equipment, level);
  if (pool.length < 4) pool = [...pool, ...filterCatalog(survey.equipment, survey.focus, level, style)];
  if (pool.length < 4) {
    pool = [...pool, ...EXERCISE_CATALOG.filter((ex) =>
      level >= ex.minLevel && (ex.styles.includes(style) || ex.primaryMuscles.some((m) => targetMuscles.has(m))))];
  }
  if (pool.length < 4) {
    pool = [...pool, ...EXERCISE_CATALOG.filter((ex) => ex.equipment.includes("No equipment") && level >= ex.minLevel)];
  }
  const seen = new Set<string>();
  pool = pool.filter((ex) => (seen.has(ex.name) ? false : (seen.add(ex.name), true)));

  const recentNames = new Set(setLogs
    .filter((l) => Date.now() - new Date(l.date).getTime() < 48 * 3_600_000)
    .map((l) => l.exerciseName));

  const count = exerciseCount(minutes, style);
  const scored = [...pool].sort((a, b) =>
    smartScore(b, style, recoveryByMuscle, recentNames) - smartScore(a, style, recoveryByMuscle, recentNames));
  const picked = scored.slice(0, count);

  const exercises: Exercise[] = picked.map((ex) => {
    let detail = prescribe(style, level, ex.name);
    if (readiness < 0.55 && !detail.toLowerCase().includes("rest")) detail += " · controlled pace";
    return {
      id: uuid(), name: ex.name, detail, tip: ex.tip,
      sets: setsFromPrescription(detail),
      primaryMuscles: ex.primaryMuscles, secondaryMuscles: ex.secondaryMuscles,
    };
  });

  if (!exercises.length) {
    const fb = buildWorkout(survey);
    return { ...fb, workoutName: "Smart Fallback", tag: "SMART PLAN", meta: `${fb.meta} · fallback` };
  }
  const readinessPct = Math.round(readiness * 100);
  const meta = `${minutes} min · Recovery-aware · ${readinessPct}% readiness · ${exercises.length} exercises`;
  return { id: uuid(), workoutName: smartWorkoutName(targetMuscles, style), tag: "SMART PLAN", meta, exercises };
}


// ---- Multi-day program (long-term plan) ----
function splitsForDays(days: number, survey: Survey): string[][] {
  const userFocus = survey.focus.filter((f) => f && f !== "No preference");
  if (userFocus.length >= 2) {
    return Array.from({ length: days }, (_, i) => [userFocus[i % userFocus.length]]);
  }
  const presets: Record<number, string[][]> = {
    1: [["Full body"]],
    2: [["Upper body"], ["Lower body"]],
    3: [["Upper body"], ["Lower body"], ["Full body"]],
    4: [["Chest and arms"], ["Back and posture"], ["Glutes and legs"], ["Core and abs"]],
    5: [["Chest and arms"], ["Back and posture"], ["Glutes and legs"], ["Shoulders"], ["Core and abs"]],
    6: [["Chest and arms"], ["Back and posture"], ["Glutes and legs"], ["Shoulders"], ["Core and abs"], ["Full body"]],
    7: [["Chest and arms"], ["Back and posture"], ["Glutes and legs"], ["Shoulders"], ["Core and abs"], ["Full body"], ["Full body"]],
  };
  return presets[days] ?? presets[3];
}

// Build a full weekly program: one distinct session per training day.
export function buildProgram(survey: Survey): Workout[] {
  const days = Math.max(1, Math.min(survey.days || 3, 7));
  return splitsForDays(days, survey).map((focus) => buildWorkout({ ...survey, focus }));
}
