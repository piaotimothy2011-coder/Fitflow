// Ported from Models/MealPlanCatalog.swift
import { addMacros, zeroMacros, uuid, type Macros, type MealSlot } from "./models";

export interface PlanMeal {
  id: string;
  slot: MealSlot;
  name: string;
  blurb: string;
  macros: Macros;
}
export interface MealPlan {
  id: string;
  title: string;
  goals: string[];
  summary: string;
  perDayCalories: number;
  tagline: string;
  meals: PlanMeal[];
}
export function planTotalMacros(p: MealPlan): Macros {
  return p.meals.map((m) => m.macros).reduce(addMacros, zeroMacros());
}
function pm(slot: MealSlot, name: string, blurb: string, m: Macros): PlanMeal {
  return { id: uuid(), slot, name, blurb, macros: m };
}
const M = (calories: number, proteinG: number, carbsG: number, fatG: number): Macros =>
  ({ calories, proteinG, carbsG, fatG });

export const MEAL_PLANS: MealPlan[] = [
  {
    id: uuid(), title: "Lean Cut", goals: ["Lose weight", "weight"],
    summary: "Moderate deficit with high protein to keep muscle while the scale drops. Two big meals, one protein-forward snack.",
    perDayCalories: 1800, tagline: "High protein · 1,800 kcal",
    meals: [
      pm("breakfast", "Greek yogurt + berries + walnuts", "1 cup non-fat Greek yogurt, ½ cup mixed berries, 1 tbsp walnuts, drizzle of honey.", M(320, 28, 32, 9)),
      pm("lunch", "Grilled chicken + quinoa bowl", "6 oz grilled chicken, ¾ cup quinoa, roasted veg, lemon-tahini.", M(520, 48, 50, 14)),
      pm("snack", "Apple + 2 tbsp peanut butter", "Slice the apple — natural PB only.", M(260, 8, 28, 16)),
      pm("dinner", "Baked salmon + sweet potato + broccoli", "5 oz salmon, 1 medium sweet potato, 1½ cup broccoli, olive oil.", M(560, 40, 50, 22)),
    ],
  },
  {
    id: uuid(), title: "Muscle Builder", goals: ["Build muscle", "muscle"],
    summary: "Calorie surplus, protein at every meal, carbs around training. Designed to support hard lifting without sloppy gain.",
    perDayCalories: 2900, tagline: "Calorie surplus · 2,900 kcal",
    meals: [
      pm("breakfast", "Oatmeal + 4 egg whites + 2 eggs", "1 cup oats with milk, eggs scrambled, banana, drizzle of honey.", M(620, 42, 80, 16)),
      pm("lunch", "Beef + rice + veggies", "8 oz lean ground beef, 1 cup jasmine rice, peppers + onions, soy sauce.", M(780, 55, 80, 22)),
      pm("snack", "Protein shake + banana + almonds", "Whey shake (30 g), banana, 20 almonds. Eat 60 min after lifting.", M(480, 35, 45, 16)),
      pm("dinner", "Chicken thigh + pasta + spinach", "8 oz chicken thigh, 1½ cup whole-wheat pasta, sautéed spinach + olive oil.", M(820, 60, 85, 24)),
    ],
  },
  {
    id: uuid(), title: "Endurance Fuel", goals: ["Improve endurance", "endurance", "Athletic performance"],
    summary: "Carb-forward to power long runs, rides, and conditioning. Protein still gets covered to repair, but carbs are the headline.",
    perDayCalories: 2600, tagline: "Carb-forward · 2,600 kcal",
    meals: [
      pm("breakfast", "Banana oat smoothie", "1 cup oats, banana, 1 tbsp peanut butter, milk, dash of cinnamon. Quick fuel.", M(540, 22, 90, 12)),
      pm("lunch", "Turkey + rice burrito bowl", "5 oz ground turkey, 1 cup rice, black beans, salsa, avocado.", M(720, 42, 92, 18)),
      pm("snack", "Date + almond bar", "Two Medjool dates with a tbsp of almond butter — packs quick carbs.", M(280, 5, 50, 8)),
      pm("dinner", "Salmon + couscous + roasted veg", "5 oz salmon, 1 cup couscous, roasted zucchini and bell pepper.", M(700, 45, 78, 20)),
    ],
  },
  {
    id: uuid(), title: "Strength Focus", goals: ["Increase strength", "strength", "power"],
    summary: "Maintenance calories with very high protein — supports heavier lifts without packing on extra body fat.",
    perDayCalories: 2400, tagline: "Very high protein · 2,400 kcal",
    meals: [
      pm("breakfast", "Cottage cheese + eggs + toast", "1 cup low-fat cottage cheese, 3 eggs, 2 slices whole-grain toast.", M(560, 50, 40, 20)),
      pm("lunch", "Tuna + rice + edamame", "6 oz tuna steak, 1 cup rice, 1 cup steamed edamame, soy + sesame.", M(640, 55, 65, 14)),
      pm("snack", "Hard-boiled eggs + jerky", "2 hard-boiled eggs, 1 oz beef jerky — easy portable protein.", M(260, 28, 4, 14)),
      pm("dinner", "Steak + potatoes + green beans", "8 oz sirloin, 6 oz baby potatoes, 1½ cup green beans, olive oil.", M(760, 60, 50, 30)),
    ],
  },
  {
    id: uuid(), title: "Balanced Maintenance",
    goals: ["Stay active", "active", "Improve flexibility", "Posture and rehab", "Reduce stress"],
    summary: "Even macros — supports day-to-day training without trying to gain or lose weight. Easy to follow long-term.",
    perDayCalories: 2200, tagline: "Balanced · 2,200 kcal",
    meals: [
      pm("breakfast", "Avocado toast + 2 eggs", "2 slices whole-grain toast, ½ avocado, 2 eggs, tomato, chilli flakes.", M(460, 22, 35, 22)),
      pm("lunch", "Chicken Caesar wrap", "5 oz grilled chicken, romaine, light Caesar, parmesan, whole-wheat wrap.", M(560, 38, 45, 22)),
      pm("snack", "Trail mix + clementine", "¼ cup trail mix and a clementine. Don't over-pour the trail mix.", M(240, 6, 28, 12)),
      pm("dinner", "Tofu stir-fry + rice", "8 oz tofu, mixed veg, 1 cup brown rice, sesame-ginger sauce.", M(620, 36, 70, 20)),
    ],
  },
];

export function mealPlansForGoal(goal: string): MealPlan[] {
  const g = goal.toLowerCase();
  const hits = MEAL_PLANS.filter((p) =>
    p.goals.some((x) => g.includes(x.toLowerCase()) || x.toLowerCase().includes(g)));
  return hits.length ? hits : MEAL_PLANS;
}
