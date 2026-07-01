// Exercise library — ported from Models/ExerciseCatalog.swift
import type { MuscleGroup } from "./muscle";

export type TrainingStyle =
  | "hiit" | "hypertrophy" | "endurance" | "strength"
  | "mobility" | "mindful" | "power" | "general" | "corrective";

export function styleForGoal(goal: string): TrainingStyle {
  switch (goal) {
    case "Lose weight": return "hiit";
    case "Build muscle": return "hypertrophy";
    case "Improve endurance": return "endurance";
    case "Increase strength": return "strength";
    case "Improve flexibility": return "mobility";
    case "Reduce stress": return "mindful";
    case "Athletic performance": return "power";
    case "Stay active": return "general";
    case "Posture and rehab": return "corrective";
    default: return "general";
  }
}

// FitnessLevel as ordered number: completeBeginner 0 ... athlete 4
export type FitnessLevel = 0 | 1 | 2 | 3 | 4;
export function levelFrom(s: string): FitnessLevel {
  switch (s) {
    case "Complete beginner": return 0;
    case "Beginner": return 1;
    case "Intermediate": return 2;
    case "Advanced": return 3;
    case "Athlete": return 4;
    default: return 1;
  }
}

export interface CatalogExercise {
  name: string;
  tip: string;
  equipment: string[];
  bodyParts: string[];
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  minLevel: FitnessLevel;
  styles: TrainingStyle[];
}

const E = (
  name: string, tip: string, equipment: string[], bodyParts: string[],
  primaryMuscles: MuscleGroup[], secondaryMuscles: MuscleGroup[],
  minLevel: FitnessLevel, styles: TrainingStyle[]
): CatalogExercise => ({ name, tip, equipment, bodyParts, primaryMuscles, secondaryMuscles, minLevel, styles });

export const EXERCISE_CATALOG: CatalogExercise[] = [
  // Bodyweight
  E("Bodyweight Squat", "Drive knees out, chest tall", ["No equipment", "Yoga mat"], ["Lower body", "Glutes and legs", "Full body"], ["quads", "glutes"], ["hamstrings", "abs"], 0, ["hiit", "endurance", "general", "corrective", "strength", "hypertrophy"]),
  E("Push-up", "Full chest to floor, elbows ~45°", ["No equipment", "Yoga mat"], ["Upper body", "Chest and arms", "Full body"], ["chest", "triceps"], ["shoulders", "abs"], 1, ["hiit", "endurance", "general", "hypertrophy", "strength"]),
  E("Knee Push-up", "Hands under shoulders, brace core", ["No equipment", "Yoga mat"], ["Upper body", "Chest and arms"], ["chest", "triceps"], ["shoulders"], 0, ["hiit", "endurance", "general", "corrective"]),
  E("Glute Bridge", "Squeeze glutes hard at the top", ["No equipment", "Yoga mat"], ["Glutes and legs", "Lower body", "Back and posture"], ["glutes"], ["hamstrings", "lowerBack"], 0, ["hiit", "general", "corrective", "hypertrophy", "endurance"]),
  E("Plank", "Squeeze glutes, ribs down", ["No equipment", "Yoga mat"], ["Core and abs", "Full body"], ["abs"], ["obliques", "shoulders"], 0, ["hiit", "general", "corrective", "endurance"]),
  E("Mountain Climbers", "Drive knees fast, keep hips low", ["No equipment", "Yoga mat"], ["Core and abs", "Full body"], ["abs"], ["quads", "shoulders"], 1, ["hiit", "endurance", "power"]),
  E("Burpees", "Explode on the jump, control the landing", ["No equipment"], ["Full body"], ["quads", "chest"], ["shoulders", "abs", "triceps"], 2, ["hiit", "power", "endurance"]),
  E("Reverse Lunges", "Knee hovers above floor", ["No equipment", "Yoga mat", "Dumbbells"], ["Lower body", "Glutes and legs"], ["quads", "glutes"], ["hamstrings"], 1, ["hiit", "general", "hypertrophy", "strength", "endurance"]),
  E("Jump Squats", "Land soft, knees forward", ["No equipment"], ["Lower body", "Glutes and legs", "Full body"], ["quads", "glutes"], ["calves", "hamstrings"], 2, ["hiit", "power", "endurance"]),
  E("Wall Sit", "Thighs parallel, breathe steadily", ["No equipment"], ["Lower body", "Glutes and legs"], ["quads"], ["glutes"], 1, ["endurance", "general", "corrective"]),
  E("Bird Dog", "Move slow, brace core", ["No equipment", "Yoga mat"], ["Back and posture", "Core and abs"], ["lowerBack", "abs"], ["glutes"], 0, ["corrective", "general", "mobility"]),
  E("Dead Bug", "Lower back stays glued down", ["No equipment", "Yoga mat"], ["Core and abs", "Back and posture"], ["abs"], ["obliques"], 0, ["corrective", "general"]),
  // Dumbbell
  E("Goblet Squat", "Hold close to chest, elbows in", ["Dumbbells", "Kettlebells"], ["Lower body", "Glutes and legs"], ["quads", "glutes"], ["hamstrings", "abs"], 1, ["hypertrophy", "strength", "general", "hiit"]),
  E("Dumbbell Press", "Press straight up, lock out", ["Dumbbells"], ["Chest and arms", "Upper body", "Shoulders"], ["chest"], ["triceps", "shoulders"], 1, ["hypertrophy", "strength", "general"]),
  E("Dumbbell Row", "Pull elbow back, squeeze blade", ["Dumbbells"], ["Back and posture", "Upper body"], ["lats", "upperBack"], ["biceps"], 1, ["hypertrophy", "strength", "general", "corrective"]),
  E("Dumbbell Romanian Deadlift", "Push hips back, feel hamstrings", ["Dumbbells", "Kettlebells"], ["Glutes and legs", "Back and posture"], ["hamstrings", "glutes"], ["lowerBack"], 1, ["hypertrophy", "strength", "general"]),
  E("Dumbbell Shoulder Press", "Core braced, full lockout", ["Dumbbells"], ["Shoulders", "Upper body"], ["shoulders"], ["triceps"], 1, ["hypertrophy", "strength"]),
  E("Dumbbell Lateral Raise", "Lead with elbows, slight bend", ["Dumbbells"], ["Shoulders"], ["shoulders"], [], 1, ["hypertrophy"]),
  E("Dumbbell Biceps Curl", "Elbows pinned, no swing", ["Dumbbells"], ["Chest and arms", "Upper body"], ["biceps"], ["forearms"], 1, ["hypertrophy"]),
  E("Dumbbell Walking Lunges", "Step long, vertical shin", ["Dumbbells"], ["Lower body", "Glutes and legs"], ["quads", "glutes"], ["hamstrings"], 1, ["hypertrophy", "strength", "hiit", "endurance"]),
  // Barbell
  E("Back Squat", "Brace, descend with control", ["Barbell and rack", "Full gym"], ["Lower body", "Glutes and legs", "Full body"], ["quads", "glutes"], ["hamstrings", "lowerBack", "abs"], 2, ["strength", "hypertrophy", "power"]),
  E("Deadlift", "Push the floor away, neutral spine", ["Barbell and rack", "Full gym"], ["Full body", "Glutes and legs", "Back and posture"], ["hamstrings", "glutes", "lowerBack"], ["lats", "traps", "forearms"], 2, ["strength", "hypertrophy", "power"]),
  E("Bench Press", "Bar to mid-chest, tuck elbows", ["Barbell and rack", "Full gym"], ["Chest and arms", "Upper body"], ["chest"], ["triceps", "shoulders"], 2, ["strength", "hypertrophy"]),
  E("Overhead Press", "Glutes tight, ribs down", ["Barbell and rack", "Full gym"], ["Shoulders", "Upper body"], ["shoulders"], ["triceps", "traps"], 2, ["strength", "hypertrophy"]),
  E("Barbell Row", "Hinge to ~45°, pull to belt", ["Barbell and rack", "Full gym"], ["Back and posture", "Upper body"], ["lats", "upperBack"], ["biceps", "lowerBack"], 2, ["strength", "hypertrophy"]),
  // Pull-up bar
  E("Pull-up", "Lead with the chest, full lockout", ["Pull-up bar", "Full gym"], ["Back and posture", "Upper body", "Chest and arms"], ["lats", "upperBack"], ["biceps", "forearms"], 2, ["strength", "hypertrophy", "general"]),
  E("Hanging Knee Raise", "Curl pelvis, no swing", ["Pull-up bar", "Full gym"], ["Core and abs"], ["abs"], ["obliques", "forearms"], 2, ["strength", "hypertrophy", "general"]),
  E("Dead Hang", "Shoulders engaged, breathe", ["Pull-up bar", "Full gym"], ["Shoulders", "Back and posture", "Upper body"], ["forearms"], ["lats", "shoulders"], 1, ["corrective", "general", "mobility"]),
  // Kettlebell
  E("Kettlebell Swing", "Hinge hard, snap hips", ["Kettlebells"], ["Full body", "Glutes and legs", "Back and posture"], ["glutes", "hamstrings"], ["lowerBack", "shoulders"], 1, ["hiit", "power", "endurance", "strength"]),
  E("Kettlebell Goblet Carry", "Tall posture, breathe through nose", ["Kettlebells"], ["Core and abs", "Full body"], ["abs"], ["forearms", "traps"], 1, ["endurance", "general", "strength"]),
  // Resistance bands
  E("Band Pull-Apart", "Lead with elbows, slow return", ["Resistance bands"], ["Back and posture", "Shoulders"], ["upperBack", "shoulders"], ["traps"], 0, ["corrective", "general"]),
  E("Band Row", "Squeeze blades together", ["Resistance bands"], ["Back and posture", "Upper body"], ["lats", "upperBack"], ["biceps"], 1, ["hypertrophy", "general", "corrective"]),
  E("Band Pallof Press", "Resist rotation, breathe", ["Resistance bands"], ["Core and abs"], ["obliques", "abs"], [], 1, ["corrective", "general"]),
  // Cable / Full gym
  E("Cable Lat Pulldown", "Lead with chest, control return", ["Cable machine", "Full gym"], ["Back and posture", "Upper body"], ["lats"], ["biceps", "upperBack"], 1, ["hypertrophy", "strength", "general"]),
  E("Cable Row", "Pull to belt, pause briefly", ["Cable machine", "Full gym"], ["Back and posture", "Upper body"], ["lats", "upperBack"], ["biceps"], 1, ["hypertrophy", "strength", "general"]),
  E("Cable Triceps Pressdown", "Elbows pinned, full lockout", ["Cable machine", "Full gym"], ["Chest and arms", "Upper body"], ["triceps"], [], 1, ["hypertrophy"]),
  // Cardio
  E("Treadmill Intervals", "Steady recovery, hard work", ["Cardio machines", "Full gym"], ["Full body", "Lower body"], ["quads", "calves"], ["hamstrings", "glutes"], 1, ["endurance", "hiit", "power"]),
  E("Stationary Bike", "Spin smooth, cadence high", ["Cardio machines", "Full gym"], ["Lower body", "Full body"], ["quads"], ["calves", "glutes"], 0, ["endurance", "hiit", "general"]),
  E("Jump Rope", "Stay on balls of feet", ["No equipment"], ["Full body", "Lower body"], ["calves"], ["quads", "shoulders"], 1, ["hiit", "endurance", "power"]),
  E("Jogging in Place", "Breathe through your nose", ["No equipment"], ["Full body", "Lower body"], ["calves", "quads"], ["hamstrings"], 0, ["endurance", "hiit", "general"]),
  E("High Knees", "Drive arms for rhythm", ["No equipment"], ["Full body", "Lower body", "Core and abs"], ["quads", "abs"], ["calves"], 1, ["hiit", "endurance", "power"]),
  // Mobility / Yoga
  E("Hip Flexor Stretch", "Tuck pelvis for deeper stretch", ["No equipment", "Yoga mat"], ["Lower body", "Glutes and legs", "Back and posture"], ["quads"], [], 0, ["mobility", "mindful", "corrective"]),
  E("Thoracic Rotation", "Keep hips still", ["No equipment", "Yoga mat"], ["Back and posture", "Upper body"], ["upperBack"], ["obliques"], 0, ["mobility", "corrective", "mindful"]),
  E("Hamstring Stretch", "Flex foot toward you", ["No equipment", "Yoga mat"], ["Glutes and legs", "Lower body"], ["hamstrings"], [], 0, ["mobility", "mindful"]),
  E("Cat-Cow Flow", "Breathe with the movement", ["No equipment", "Yoga mat"], ["Back and posture", "Core and abs"], ["lowerBack"], ["abs"], 0, ["mobility", "mindful", "corrective"]),
  E("Pigeon Pose", "Relax into the ground", ["No equipment", "Yoga mat"], ["Glutes and legs", "Lower body"], ["glutes"], ["hamstrings"], 1, ["mobility", "mindful"]),
  E("Child's Pose", "Melt tension into the floor", ["No equipment", "Yoga mat"], ["Back and posture", "Full body"], ["lowerBack"], ["lats"], 0, ["mindful", "mobility"]),
  E("Sun Salutation", "Move with your breath", ["No equipment", "Yoga mat"], ["Full body"], ["abs"], ["shoulders", "hamstrings"], 1, ["mindful", "mobility"]),
  E("Box Breathing", "4 in, hold, out, hold", ["No equipment", "Yoga mat"], ["Full body"], [], [], 0, ["mindful", "endurance"]),
  // Power / Plyo
  E("Box Jumps", "Land soft, reset every rep", ["No equipment", "Full gym"], ["Lower body", "Glutes and legs", "Full body"], ["quads", "glutes"], ["calves", "hamstrings"], 2, ["power", "hiit"]),
  E("Broad Jump", "Swing arms, project forward", ["No equipment"], ["Lower body", "Glutes and legs", "Full body"], ["quads", "glutes"], ["hamstrings", "calves"], 2, ["power", "hiit"]),
  E("Lateral Bound", "Stick the landing", ["No equipment"], ["Lower body", "Glutes and legs"], ["glutes", "quads"], ["calves"], 2, ["power", "hiit"]),
  // Corrective
  E("Wall Slides", "Keep low back flat", ["No equipment"], ["Back and posture", "Shoulders", "Upper body"], ["shoulders", "upperBack"], ["traps"], 0, ["corrective", "mobility"]),
  E("90/90 Hip Switch", "Stay tall, even pressure", ["No equipment", "Yoga mat"], ["Lower body", "Glutes and legs", "Back and posture"], ["glutes"], ["lowerBack"], 1, ["corrective", "mobility"]),
  // ---- Expanded catalog ----
  // More bodyweight
  E("Incline Push-up", "Hands elevated, body straight", ["No equipment"], ["Upper body", "Chest and arms"], ["chest", "triceps"], ["shoulders"], 0, ["hiit", "endurance", "general", "hypertrophy"]),
  E("Diamond Push-up", "Hands together, elbows tight", ["No equipment", "Yoga mat"], ["Chest and arms", "Upper body"], ["triceps", "chest"], ["shoulders"], 2, ["hypertrophy", "strength", "hiit"]),
  E("Pike Push-up", "Hips high, press overhead", ["No equipment", "Yoga mat"], ["Shoulders", "Upper body"], ["shoulders"], ["triceps"], 2, ["hypertrophy", "strength"]),
  E("Side Plank", "Stack hips, brace obliques", ["No equipment", "Yoga mat"], ["Core and abs"], ["obliques"], ["abs", "shoulders"], 1, ["general", "corrective", "endurance"]),
  E("Superman", "Lift chest and thighs, squeeze", ["No equipment", "Yoga mat"], ["Back and posture", "Core and abs"], ["lowerBack"], ["glutes", "upperBack"], 0, ["corrective", "general"]),
  E("Bicycle Crunch", "Elbow to opposite knee, slow", ["No equipment", "Yoga mat"], ["Core and abs"], ["abs", "obliques"], [], 1, ["hiit", "general", "hypertrophy"]),
  E("Flutter Kicks", "Low back down, small kicks", ["No equipment", "Yoga mat"], ["Core and abs"], ["abs"], ["obliques"], 1, ["hiit", "endurance", "general"]),
  E("Jumping Jacks", "Steady rhythm, full range", ["No equipment"], ["Full body", "Lower body"], ["calves", "shoulders"], ["quads"], 0, ["hiit", "endurance", "general"]),
  E("Butt Kicks", "Fast heels to glutes", ["No equipment"], ["Full body", "Lower body"], ["hamstrings", "calves"], ["glutes"], 0, ["hiit", "endurance"]),
  E("Bulgarian Split Squat", "Back foot elevated, drop straight", ["No equipment", "Dumbbells"], ["Lower body", "Glutes and legs"], ["quads", "glutes"], ["hamstrings"], 2, ["hypertrophy", "strength", "general"]),
  E("Step-ups", "Drive through the top foot", ["No equipment", "Dumbbells"], ["Lower body", "Glutes and legs"], ["quads", "glutes"], ["hamstrings", "calves"], 1, ["general", "endurance", "hiit"]),
  E("Standing Calf Raise", "Full stretch, pause at top", ["No equipment", "Dumbbells"], ["Lower body", "Glutes and legs"], ["calves"], [], 0, ["hypertrophy", "general", "endurance"]),
  // More dumbbell
  E("Dumbbell Bench Press", "Press up and slightly in", ["Dumbbells"], ["Chest and arms", "Upper body"], ["chest"], ["triceps", "shoulders"], 1, ["hypertrophy", "strength"]),
  E("Dumbbell Fly", "Slight elbow bend, big stretch", ["Dumbbells"], ["Chest and arms"], ["chest"], ["shoulders"], 1, ["hypertrophy"]),
  E("Dumbbell Hammer Curl", "Neutral grip, no swing", ["Dumbbells"], ["Chest and arms", "Upper body"], ["biceps"], ["forearms"], 1, ["hypertrophy"]),
  E("Dumbbell Triceps Extension", "Elbows in, lower behind head", ["Dumbbells"], ["Chest and arms", "Upper body"], ["triceps"], [], 1, ["hypertrophy"]),
  E("Dumbbell Front Raise", "Lift to shoulder height, control", ["Dumbbells"], ["Shoulders"], ["shoulders"], [], 1, ["hypertrophy"]),
  E("Dumbbell Thruster", "Squat then press in one drive", ["Dumbbells"], ["Full body"], ["shoulders", "quads"], ["glutes", "triceps"], 2, ["hiit", "power", "strength"]),
  E("Dumbbell Deadlift", "Hips back, flat back, stand tall", ["Dumbbells"], ["Glutes and legs", "Back and posture"], ["hamstrings", "glutes"], ["lowerBack"], 1, ["strength", "hypertrophy", "general"]),
  // More barbell
  E("Front Squat", "Elbows high, upright torso", ["Barbell and rack", "Full gym"], ["Lower body", "Glutes and legs"], ["quads", "glutes"], ["abs", "lowerBack"], 3, ["strength", "hypertrophy", "power"]),
  E("Hip Thrust", "Chin tucked, squeeze at top", ["Barbell and rack", "Full gym"], ["Glutes and legs", "Lower body"], ["glutes"], ["hamstrings"], 2, ["hypertrophy", "strength"]),
  E("Incline Bench Press", "Bar to upper chest, tuck elbows", ["Barbell and rack", "Full gym"], ["Chest and arms", "Upper body"], ["chest"], ["shoulders", "triceps"], 2, ["strength", "hypertrophy"]),
  // More kettlebell
  E("Kettlebell Goblet Squat", "Hold at chest, sit down tall", ["Kettlebells"], ["Lower body", "Glutes and legs"], ["quads", "glutes"], ["hamstrings", "abs"], 1, ["hypertrophy", "strength", "hiit"]),
  E("Kettlebell Clean and Press", "Tame the arc, press overhead", ["Kettlebells"], ["Full body"], ["shoulders", "glutes"], ["quads", "triceps"], 2, ["power", "strength", "hiit"]),
  // Machines
  E("Leg Press", "Feet mid-platform, control depth", ["Cable machine", "Full gym"], ["Lower body", "Glutes and legs"], ["quads", "glutes"], ["hamstrings"], 1, ["hypertrophy", "strength"]),
  E("Leg Curl", "Curl heels, no hip rise", ["Cable machine", "Full gym"], ["Glutes and legs", "Lower body"], ["hamstrings"], ["calves"], 1, ["hypertrophy"]),
  E("Leg Extension", "Squeeze quads at the top", ["Cable machine", "Full gym"], ["Lower body"], ["quads"], [], 1, ["hypertrophy"]),
  E("Cable Face Pull", "Pull to eyes, elbows high", ["Cable machine", "Full gym"], ["Back and posture", "Shoulders"], ["upperBack", "shoulders"], ["traps"], 1, ["hypertrophy", "corrective", "general"]),
  // More pull-up bar
  E("Chin-up", "Palms toward you, chest to bar", ["Pull-up bar", "Full gym"], ["Back and posture", "Upper body", "Chest and arms"], ["lats", "biceps"], ["upperBack", "forearms"], 2, ["strength", "hypertrophy", "general"]),
  // More cardio
  E("Rowing Machine", "Legs, then hips, then arms", ["Cardio machines", "Full gym"], ["Full body", "Back and posture"], ["lats", "quads"], ["hamstrings", "biceps"], 1, ["endurance", "hiit", "general"]),
  E("Elliptical", "Smooth stride, upright posture", ["Cardio machines", "Full gym"], ["Full body", "Lower body"], ["quads", "glutes"], ["hamstrings", "calves"], 0, ["endurance", "general"]),
  // More mobility
  E("Downward Dog", "Long spine, heels reaching down", ["No equipment", "Yoga mat"], ["Full body", "Back and posture"], ["hamstrings", "shoulders"], ["calves"], 0, ["mobility", "mindful"]),
  E("Cobra Stretch", "Open chest, relax glutes", ["No equipment", "Yoga mat"], ["Back and posture", "Core and abs"], ["lowerBack"], ["abs", "chest"], 0, ["mobility", "mindful", "corrective"]),
  E("World's Greatest Stretch", "Big lunge, rotate open", ["No equipment", "Yoga mat"], ["Full body", "Lower body"], ["glutes", "hamstrings"], ["quads", "upperBack"], 1, ["mobility", "corrective"]),
];

function intersects<T>(a: Iterable<T>, b: Set<T>): boolean {
  for (const x of a) if (b.has(x)) return true;
  return false;
}

// Equipment that adds external load, so a weight (lb/kg) is meaningful.
// Everything else — bodyweight, bands, cardio, pull-up bar, yoga — is logged
// by reps/time only, so the weight input is hidden for those.
const LOAD_EQUIPMENT = new Set([
  "Dumbbells", "Kettlebells", "Barbell and rack", "Cable machine",
]);
const CATALOG_BY_NAME = new Map(EXERCISE_CATALOG.map((e) => [e.name, e]));

// True when the exercise is normally loaded with external weight.
export function isWeightedExercise(name: string): boolean {
  const e = CATALOG_BY_NAME.get(name);
  if (!e) return false; // unknown / bodyweight-style move: reps only
  return e.equipment.some((q) => LOAD_EQUIPMENT.has(q));
}

// Equipment the user must own for weights to be relevant at all. If they train
// with no weights (e.g. "No equipment"), we never show a weight input or a
// weight recommendation.
const USER_WEIGHT_EQUIPMENT = new Set([
  "Dumbbells", "Kettlebells", "Barbell and rack", "Cable machine", "Full gym",
]);
export function userUsesWeights(equipment: string[]): boolean {
  return equipment.some((q) => USER_WEIGHT_EQUIPMENT.has(q));
}

export function filterCatalog(
  equipment: string[], focus: string[], level: FitnessLevel, style: TrainingStyle
): CatalogExercise[] {
  const focusSet = new Set(focus.filter((f) => f !== "No preference" && f !== ""));
  const userEquip = new Set(equipment.length ? equipment : ["No equipment"]);
  return EXERCISE_CATALOG.filter((ex) => {
    if (!intersects(ex.equipment, userEquip)) return false;
    if (level < ex.minLevel) return false;
    if (!ex.styles.includes(style)) return false;
    if (focusSet.size > 0 && !intersects(ex.bodyParts, focusSet)) return false;
    return true;
  });
}

export function forMuscles(
  muscles: Set<MuscleGroup>, equipment: string[], level: FitnessLevel
): CatalogExercise[] {
  const userEquip = new Set(equipment.length ? equipment : ["No equipment"]);
  return EXERCISE_CATALOG.filter((ex) => {
    if (!intersects(ex.equipment, userEquip)) return false;
    if (level < ex.minLevel) return false;
    return intersects(ex.primaryMuscles, muscles);
  });
}
