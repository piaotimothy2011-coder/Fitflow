import type { IconName } from "@/components/icons";
// Survey catalogue — ported from Models/Survey.swift (SurveyCatalog)
export const SurveyCatalog = {
  goals: [
    "Lose weight", "Build muscle", "Improve endurance", "Increase strength",
    "Improve flexibility", "Reduce stress", "Athletic performance",
    "Posture and rehab",
  ],
  goalShortLabels: {
    "Lose weight": "Lose weight",
    "Build muscle": "Build muscle",
    "Improve endurance": "Endurance",
    "Increase strength": "Strength",
    "Improve flexibility": "Flexibility",
    "Reduce stress": "Reduce stress",
    "Athletic performance": "Performance",
    "Posture and rehab": "Posture rehab",
  } as Record<string, string>,
  levels: ["Complete beginner", "Beginner", "Intermediate", "Advanced", "Athlete"],
  levelLabels: {
    "Complete beginner": "Complete beginner — I rarely exercise",
    "Beginner": "Beginner — I work out occasionally",
    "Intermediate": "Intermediate — I train 1 to 3x per week",
    "Advanced": "Advanced — I train 4 or more times per week",
    "Athlete": "Athlete — I compete or train intensively",
  } as Record<string, string>,
  equipment: [
    "No equipment", "Dumbbells", "Resistance bands", "Pull-up bar",
    "Kettlebells", "Barbell and rack", "Cable machine", "Full gym",
    "Cardio machines", "Yoga mat",
  ],
  focus: [
    "Full body", "Upper body", "Lower body", "Core and abs",
    "Back and posture", "Chest and arms", "Glutes and legs",
    "Shoulders", "No preference",
  ],
  dietStyles: ["Omnivore", "Vegetarian", "Vegan", "Pescatarian", "Keto", "Paleo", "Mediterranean"],
  allergies: [
    "Dairy-free", "Gluten-free", "Nut-free", "Soy-free", "Egg-free",
    "Shellfish-free", "Low sodium", "Low sugar", "No restrictions",
  ],
};

// Flat-green icon name for each goal (see components/icons.tsx).
export const goalIcon: Record<string, IconName> = {
  "Lose weight": "scale",
  "Build muscle": "muscle",
  "Improve endurance": "endurance",
  "Increase strength": "strength",
  "Improve flexibility": "flexibility",
  "Reduce stress": "calm",
  "Athletic performance": "athletic",
  "Posture and rehab": "posture",
};
