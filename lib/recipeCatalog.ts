// Representative subset ported from Models/RecipeCatalog.swift
import { uuid, type Recipe, type Macros, type MealSlot } from "./models";

const M = (calories: number, proteinG: number, carbsG: number, fatG: number): Macros =>
  ({ calories, proteinG, carbsG, fatG });
const R = (
  name: string, subtitle: string, slot: MealSlot, macros: Macros,
  dietStyles: string[], freeOf: string[], cookMinutes: number,
  ingredients: string[], steps: string[]
): Recipe => ({ id: uuid(), name, subtitle, slot, macros, dietStyles, freeOf, cookMinutes, ingredients, steps });

export const RECIPE_CATALOG: Recipe[] = [
  R("Greek Yogurt Parfait", "Berries · Granola · Honey", "breakfast", M(380, 24, 48, 9),
    ["Omnivore", "Vegetarian", "Mediterranean"],
    ["Gluten-free", "Nut-free", "Soy-free", "Egg-free", "Shellfish-free", "No restrictions"], 5,
    ["1 cup plain Greek yogurt (2%)", "½ cup mixed berries", "⅓ cup low-sugar granola", "1 tsp honey"],
    ["Layer yogurt, berries, then granola in a bowl.", "Drizzle with honey. Serve immediately."]),
  R("Veggie Tofu Scramble", "Spinach · Bell Pepper · Turmeric", "breakfast", M(320, 22, 14, 20),
    ["Vegetarian", "Vegan", "Mediterranean"],
    ["Dairy-free", "Gluten-free", "Nut-free", "Egg-free", "Shellfish-free", "No restrictions"], 10,
    ["200g firm tofu, crumbled", "1 cup spinach", "½ red bell pepper, diced", "½ tsp turmeric", "Salt, pepper, olive oil"],
    ["Heat olive oil over medium heat.", "Add bell pepper, sauté 2 min.", "Add tofu and turmeric, cook 5 min, breaking it up.", "Stir in spinach until wilted. Season and serve."]),
  R("Oatmeal with Almond Butter", "Banana · Cinnamon · Chia", "breakfast", M(420, 14, 58, 16),
    ["Vegetarian", "Vegan", "Mediterranean"],
    ["Dairy-free", "Soy-free", "Egg-free", "Shellfish-free", "No restrictions"], 7,
    ["1 cup rolled oats", "1 cup almond milk", "1 tbsp almond butter", "½ banana, sliced", "1 tsp chia seeds", "Cinnamon"],
    ["Simmer oats with almond milk 5 min.", "Top with almond butter, banana, chia, cinnamon."]),
  R("Grilled Chicken Quinoa Bowl", "Quinoa · Veg · Lemon-Tahini", "lunch", M(520, 48, 50, 14),
    ["Omnivore", "Mediterranean", "Paleo"],
    ["Dairy-free", "Gluten-free", "Nut-free", "Egg-free", "Shellfish-free", "No restrictions"], 20,
    ["6 oz chicken breast", "¾ cup cooked quinoa", "1 cup roasted vegetables", "1 tbsp tahini", "Lemon juice"],
    ["Grill seasoned chicken 6-7 min per side.", "Assemble quinoa, veg, sliced chicken.", "Whisk tahini + lemon, drizzle over."]),
  R("Turkey Burrito Bowl", "Rice · Beans · Avocado", "lunch", M(720, 42, 92, 18),
    ["Omnivore"],
    ["Dairy-free", "Gluten-free", "Nut-free", "Egg-free", "Shellfish-free", "No restrictions"], 18,
    ["5 oz ground turkey", "1 cup cooked rice", "½ cup black beans", "¼ avocado", "Salsa"],
    ["Brown the turkey with spices.", "Layer rice, beans, turkey.", "Top with salsa and avocado."]),
  R("Baked Salmon Plate", "Sweet Potato · Broccoli", "dinner", M(560, 40, 50, 22),
    ["Omnivore", "Pescatarian", "Mediterranean", "Paleo"],
    ["Dairy-free", "Gluten-free", "Nut-free", "Egg-free", "Shellfish-free", "No restrictions"], 25,
    ["5 oz salmon fillet", "1 medium sweet potato", "1½ cup broccoli", "1 tbsp olive oil"],
    ["Roast sweet potato 25 min at 200°C.", "Bake salmon 12-15 min.", "Steam broccoli, drizzle with olive oil."]),
  R("Tofu Stir-Fry", "Mixed Veg · Brown Rice", "dinner", M(620, 36, 70, 20),
    ["Vegetarian", "Vegan"],
    ["Dairy-free", "Nut-free", "Egg-free", "Shellfish-free", "No restrictions"], 20,
    ["8 oz firm tofu", "2 cups mixed stir-fry veg", "1 cup brown rice", "Sesame-ginger sauce"],
    ["Pan-fry cubed tofu until golden.", "Add veg, stir-fry 4 min.", "Toss with sauce, serve over rice."]),
  R("Protein Shake", "Whey · Banana · Almonds", "snack", M(480, 35, 45, 16),
    ["Omnivore", "Vegetarian"],
    ["Gluten-free", "Egg-free", "Shellfish-free", "No restrictions"], 3,
    ["1 scoop whey protein", "1 banana", "20 almonds", "1 cup milk"],
    ["Blend whey, banana, milk.", "Eat almonds on the side."]),
];

function matchesFilters(r: Recipe, dietStyle: string, allergies: string[]): boolean {
  if (dietStyle && r.dietStyles.length && !r.dietStyles.includes(dietStyle)) return false;
  const restrictions = allergies.filter((a) => a !== "No restrictions");
  for (const a of restrictions) {
    if (!r.freeOf.includes(a)) return false;
  }
  return true;
}

export function recipesFor(dietStyle: string, allergies: string[]): Recipe[] {
  const hits = RECIPE_CATALOG.filter((r) => matchesFilters(r, dietStyle, allergies));
  return hits.length ? hits : RECIPE_CATALOG;
}
