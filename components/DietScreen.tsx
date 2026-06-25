"use client";
import React, { useMemo, useState } from "react";
import { useApp } from "./AppState";
import { Card, PrimaryButton, SectionLabel } from "./ui";
import { Icon } from "./icons";
import {
  type MealEntry, type MealSlot, MEAL_SLOTS, mealSlotLabel, mealTotalMacros,
  addMacros, zeroMacros, uuid,
} from "@/lib/models";
import { targetsForSurvey } from "@/lib/nutritionCalculator";
import { mealPlansForGoal } from "@/lib/mealPlanCatalog";
import { recipesFor } from "@/lib/recipeCatalog";
import { waterStepOz } from "@/lib/units";
import { FOOD_CATALOG, type Food } from "@/lib/foodCatalog";

function CalRing({ consumed, target }: { consumed: number; target: number }) {
  const pct = target ? Math.min(consumed / target, 1) : 0;
  const remaining = Math.max(target - consumed, 0);
  return (
    <div className="relative w-[112px] h-[112px] shrink-0">
      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
        <circle cx="18" cy="18" r="15.8" fill="none" stroke="#052E1622" strokeWidth="3.6" />
        <circle cx="18" cy="18" r="15.8" fill="none" stroke="#16A34A" strokeWidth="3.6"
          strokeLinecap="round" pathLength={100} strokeDasharray={`${pct * 100} 100`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-[30px] text-deepGreen leading-none">{Math.round(remaining)}</span>
        <span className="text-[10px] text-midDeepGreen font-semibold uppercase tracking-wide mt-0.5">kcal left</span>
      </div>
    </div>
  );
}

function MacroBar({ label, value, goal }: { label: string; value: number; goal: number }) {
  const pct = goal ? Math.min(value / goal, 1) : 0;
  return (
    <div>
      <div className="flex justify-between text-[12px] mb-1">
        <span className="text-deepGreen font-semibold">{label}</span>
        <span className="text-midDeepGreen">{Math.round(value)}/{goal}g</span>
      </div>
      <div className="h-2 rounded-full bg-deepGreen/15 overflow-hidden">
        <div className="h-full rounded-full bg-midDeepGreen" style={{ width: `${pct * 100}%` }} />
      </div>
    </div>
  );
}

export default function DietScreen() {
  const { survey, meals, water, addMeal, deleteMeal, addWater, preferences } = useApp();
  const [adding, setAdding] = useState<MealSlot | null>(null);

  const targets = useMemo(() => targetsForSurvey(survey), [survey]);
  const mealsPerDay = survey.mealsPerDay || 3;
  const today = new Date().toDateString();
  const todayMeals = meals.filter((m) => new Date(m.date).toDateString() === today);
  const consumed = todayMeals.map(mealTotalMacros).reduce(addMacros, zeroMacros());
  const todayWater = water.filter((w) => new Date(w.date).toDateString() === today).reduce((a, w) => a + w.amountOz, 0);
  const waterPct = targets.waterOz ? Math.min(todayWater / targets.waterOz, 1) : 0;

  const plans = mealPlansForGoal(survey.goal);
  const recipes = recipesFor(survey.dietStyle, survey.allergies);

  return (
    <div className="px-6 pt-9">
      <h1 className="font-display text-[44px] text-white leading-none">Diet</h1>
      <p className="text-textMuted text-[14px] mt-1.5 mb-5">Eat to match your training.</p>

      {/* HERO — white card for visual impact */}
      <div className="rounded-[22px] bg-mintBg p-5 mb-3">
        <div className="flex items-center justify-between">
          <span className="text-deepGreen/70 text-[12px] font-bold uppercase tracking-wider">Calories today</span>
          <span className="text-midDeepGreen text-[13px] font-semibold">{Math.round(consumed.calories)} / {targets.calories}</span>
        </div>
        <div className="flex items-center gap-5 mt-3">
          <CalRing consumed={consumed.calories} target={targets.calories} />
          <div className="flex-1 space-y-2.5">
            <MacroBar label="Protein" value={consumed.proteinG} goal={targets.proteinG} />
            <MacroBar label="Carbs" value={consumed.carbsG} goal={targets.carbsG} />
            <MacroBar label="Fat" value={consumed.fatG} goal={targets.fatG} />
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-deepGreen/10 text-midDeepGreen text-[12px]">
          Target ≈ {Math.round(targets.calories / mealsPerDay)} kcal × {mealsPerDay} meals · based on {survey.days} active {survey.days === 1 ? "day" : "days"}/week
        </div>
      </div>

      {/* Water */}
      <Card className="p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-textFaint text-[13px] flex items-center gap-1.5"><span className="text-[#38BDF8]"><Icon name="water" size={15} /></span>Water</span>
          <span className="font-display text-2xl text-white">{todayWater}<span className="text-textFaint text-base"> / {targets.waterOz} oz</span></span>
        </div>
        <div className="h-2 rounded-full bg-borderStrong overflow-hidden">
          <div className="h-full rounded-full bg-[#38BDF8] transition-all" style={{ width: `${waterPct * 100}%` }} />
        </div>
        <div className="flex gap-2 mt-3">
          <button onClick={() => addWater(waterStepOz(preferences.units))} className="flex-1 rounded-button border border-borderStrong text-white py-2.5 text-[14px] font-medium active:scale-[0.98] transition hover:bg-white/5">+ 8 oz</button>
          <button onClick={() => addWater(16)} className="flex-1 rounded-button border border-borderStrong text-white py-2.5 text-[14px] font-medium active:scale-[0.98] transition hover:bg-white/5">+ 16 oz</button>
        </div>
      </Card>

      {/* Meals */}
      <SectionLabel className="mb-2.5">Today&apos;s meals</SectionLabel>
      <div className="space-y-3 mb-6">
        {MEAL_SLOTS.map((slot) => {
          const slotMeals = todayMeals.filter((m) => m.slot === slot);
          const slotCals = slotMeals.map(mealTotalMacros).reduce((a, m) => a + m.calories, 0);
          return (
            <Card key={slot} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white text-[15px] font-semibold">{mealSlotLabel(slot)}</div>
                  <div className="text-textFaint text-[12px] mt-0.5">{slotMeals.length ? `${Math.round(slotCals)} kcal logged` : "Nothing logged"}</div>
                </div>
                <button onClick={() => setAdding(slot)} aria-label="Add"
                  className="w-9 h-9 rounded-full bg-accentGreen/15 text-accentGreen flex items-center justify-center active:scale-95 transition">
                  <Icon name="plus" size={18} />
                </button>
              </div>
              {slotMeals.length > 0 && (
                <div className="mt-3 space-y-2">
                  {slotMeals.map((m) => {
                    const tm = mealTotalMacros(m);
                    return (
                      <div key={m.id} className="flex items-center justify-between bg-bgPhone rounded-xl px-3 py-2">
                        <div className="min-w-0">
                          <div className="text-white text-[14px] truncate">{m.name}</div>
                          <div className="text-textFaint text-[12px]">{tm.calories} kcal · P{Math.round(tm.proteinG)} C{Math.round(tm.carbsG)} F{Math.round(tm.fatG)}</div>
                        </div>
                        <button onClick={() => deleteMeal(m.id)} className="text-textFaint hover:text-white transition px-1"><Icon name="close" size={16} /></button>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Recipes */}
      <SectionLabel className="mb-2.5">Suggested recipes</SectionLabel>
      <div className="space-y-2.5 mb-6">
        {recipes.slice(0, 5).map((r) => (
          <Card key={r.id} className="p-3.5 flex items-center justify-between">
            <div className="min-w-0">
              <div className="text-white text-[14px] font-medium truncate">{r.name}</div>
              <div className="text-textFaint text-[12px]">{r.subtitle} · {r.macros.calories} kcal</div>
            </div>
            <button onClick={() => addMeal({ id: uuid(), date: new Date().toISOString(), slot: r.slot, name: r.name, servings: 1, macros: r.macros, externalId: r.id })}
              className="rounded-lg bg-accentGreen/15 text-accentGreen font-semibold text-[13px] px-3 py-1.5 shrink-0 ml-3 active:scale-95 transition">Log</button>
          </Card>
        ))}
      </div>

      {/* Meal plans */}
      <SectionLabel className="mb-2.5">Meal plans for your goal</SectionLabel>
      <div className="space-y-2.5 mb-6">
        {plans.map((p) => (
          <Card key={p.id} className="p-4">
            <div className="text-white text-[15px] font-medium">{p.title}</div>
            <div className="text-textFaint text-[12px] mt-0.5">{p.tagline}</div>
            <div className="text-textMuted text-[13px] mt-2">{p.summary}</div>
          </Card>
        ))}
      </div>

      {adding && <AddMealSheet slot={adding} onClose={() => setAdding(null)} onAdd={(m) => { addMeal(m); setAdding(null); }} />}
    </div>
  );
}

function AddMealSheet({ slot, onClose, onAdd }: { slot: MealSlot; onClose: () => void; onAdd: (m: MealEntry) => void }) {
  const [q, setQ] = useState("");
  const [custom, setCustom] = useState(false);
  const [name, setName] = useState("");
  const [cal, setCal] = useState("");
  const [p, setP] = useState("");
  const [c, setC] = useState("");
  const [f, setF] = useState("");

  const matches = q.trim()
    ? FOOD_CATALOG.filter((food) => food.name.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 8)
    : FOOD_CATALOG.slice(0, 8);

  const addFood = (food: Food) => {
    onAdd({
      id: uuid(), date: new Date().toISOString(), slot, name: food.name, servings: 1,
      macros: { calories: food.kcal, proteinG: food.p, carbsG: food.c, fatG: food.f }, externalId: null,
    });
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60" onClick={onClose}>
      <div className="w-full max-w-[440px] bg-bgCard border-t border-border rounded-t-3xl p-6 ff-pop max-h-[85vh] overflow-y-auto no-scrollbar" onClick={(e) => e.stopPropagation()}>
        <div className="font-display text-3xl text-white mb-4">Add to {mealSlotLabel(slot)}</div>

        {!custom ? (
          <>
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search foods…"
              className="w-full rounded-button bg-bgPhone border border-borderStrong px-4 py-3 mb-3 outline-none focus:border-accentGreen" />
            <div className="space-y-2">
              {matches.map((food) => (
                <button key={food.name} onClick={() => addFood(food)}
                  className="w-full flex items-center justify-between rounded-xl bg-bgPhone border border-borderStrong px-4 py-3 text-left active:scale-[0.98] transition hover:border-white/25">
                  <div className="min-w-0">
                    <div className="text-white text-[14px] font-medium truncate">{food.name}</div>
                    <div className="text-textFaint text-[12px]">{food.kcal} kcal · P{food.p} C{food.c} F{food.f}</div>
                  </div>
                  <span className="w-8 h-8 rounded-full bg-accentGreen/15 text-accentGreen flex items-center justify-center shrink-0"><Icon name="plus" size={16} /></span>
                </button>
              ))}
              {matches.length === 0 && <p className="text-textFaint text-[13px] py-2">No match in our food list.</p>}
            </div>
            <button onClick={() => { setCustom(true); setName(q); }}
              className="w-full mt-3 text-center text-textMuted text-[13px] py-2">Can&apos;t find it? Enter manually</button>
          </>
        ) : (
          <>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Food name"
              className="w-full rounded-button bg-bgPhone border border-borderStrong px-4 py-3 mb-3 outline-none focus:border-accentGreen" />
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[["kcal", cal, setCal], ["P", p, setP], ["C", c, setC], ["F", f, setF]].map(([label, val, set]: any) => (
                <input key={label} type="number" inputMode="numeric" value={val} onChange={(e) => set(e.target.value)} placeholder={label}
                  className="w-full min-w-0 rounded-lg bg-bgPhone border border-borderStrong px-2 py-2 text-center outline-none focus:border-accentGreen" />
              ))}
            </div>
            <PrimaryButton disabled={!name.trim()} onClick={() => onAdd({
              id: uuid(), date: new Date().toISOString(), slot, name: name.trim(), servings: 1,
              macros: { calories: Number(cal) || 0, proteinG: Number(p) || 0, carbsG: Number(c) || 0, fatG: Number(f) || 0 }, externalId: null,
            })}>Add</PrimaryButton>
            <button onClick={() => setCustom(false)} className="w-full text-textMuted text-[13px] mt-3">Back to search</button>
          </>
        )}
        <button onClick={onClose} className="w-full text-textFaint text-[14px] mt-3">Cancel</button>
      </div>
    </div>
  );
}
