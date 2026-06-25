"use client";
import React, { useMemo, useState } from "react";
import { useApp } from "./AppState";
import { Card, ProgressBar, PrimaryButton, GhostButton } from "./ui";
import { Icon } from "./icons";
import {
  type MealEntry, type MealSlot, MEAL_SLOTS, mealSlotLabel, mealTotalMacros,
  addMacros, zeroMacros, uuid,
} from "@/lib/models";
import { targetsForSurvey } from "@/lib/nutritionCalculator";
import { mealPlansForGoal } from "@/lib/mealPlanCatalog";
import { recipesFor } from "@/lib/recipeCatalog";
import { waterStepOz } from "@/lib/units";

export default function DietScreen() {
  const { survey, meals, water, addMeal, deleteMeal, addWater, preferences } = useApp();
  const [adding, setAdding] = useState<MealSlot | null>(null);

  const targets = useMemo(() => targetsForSurvey(survey), [survey]);
  const mealsPerDay = survey.mealsPerDay || 3;
  const today = new Date().toDateString();
  const todayMeals = meals.filter((m) => new Date(m.date).toDateString() === today);
  const consumed = todayMeals.map(mealTotalMacros).reduce(addMacros, zeroMacros());
  const todayWater = water.filter((w) => new Date(w.date).toDateString() === today)
    .reduce((a, w) => a + w.amountOz, 0);

  const plans = mealPlansForGoal(survey.goal);
  const recipes = recipesFor(survey.dietStyle, survey.allergies);

  const Ring = ({ label, value, goal, unit, color }: { label: string; value: number; goal: number; unit: string; color: string }) => (
    <div className="flex-1">
      <div className="flex justify-between text-[12px] mb-1">
        <span className="text-textMuted">{label}</span>
        <span className="text-textFaint">{Math.round(value)}/{goal}{unit}</span>
      </div>
      <ProgressBar value={goal ? value / goal : 0} color={color} />
    </div>
  );

  return (
    <div className="px-7 pt-10">
      <h1 className="font-display text-5xl text-white leading-none mb-5">Diet</h1>

      <Card className="p-5 mb-4">
        <div className="flex items-baseline justify-between mb-3">
          <span className="text-textFaint text-[13px]">Calories today</span>
          <span className="font-display text-3xl text-white">{consumed.calories}<span className="text-textFaint text-lg"> / {targets.calories}</span></span>
        </div>
        <ProgressBar value={targets.calories ? consumed.calories / targets.calories : 0} />
        <div className="text-textFaint text-[12px] mt-2">
          ≈ {Math.round(targets.calories / mealsPerDay)} kcal × {mealsPerDay} meals · {survey.days} active {survey.days === 1 ? "day" : "days"}/week
        </div>
        <div className="flex gap-4 mt-4">
          <Ring label="Protein" value={consumed.proteinG} goal={targets.proteinG} unit="g" color="#4ADE80" />
          <Ring label="Carbs" value={consumed.carbsG} goal={targets.carbsG} unit="g" color="#60A5FA" />
          <Ring label="Fat" value={consumed.fatG} goal={targets.fatG} unit="g" color="#FBBF24" />
        </div>
      </Card>

      <Card className="p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-textFaint text-[13px] flex items-center gap-1.5"><span className="text-[#38BDF8]"><Icon name="water" size={15} /></span>Water</span>
          <span className="font-display text-2xl text-white">{todayWater}<span className="text-textFaint text-base"> / {targets.waterOz} oz</span></span>
        </div>
        <ProgressBar value={targets.waterOz ? todayWater / targets.waterOz : 0} color="#38BDF8" />
        <div className="flex gap-2 mt-3">
          <GhostButton onClick={() => addWater(waterStepOz(preferences.units))}>+ 8 oz</GhostButton>
          <GhostButton onClick={() => addWater(16)}>+ 16 oz</GhostButton>
        </div>
      </Card>

      {MEAL_SLOTS.map((slot) => {
        const slotMeals = todayMeals.filter((m) => m.slot === slot);
        return (
          <div key={slot} className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white text-[15px] font-medium">{mealSlotLabel(slot)}</span>
              <button onClick={() => setAdding(slot)} className="text-accentGreen text-[13px] inline-flex items-center gap-1"><Icon name="plus" size={14} /> Add</button>
            </div>
            {slotMeals.length === 0 ? (
              <div className="text-textFaint text-[13px]">Nothing logged.</div>
            ) : (
              <div className="space-y-2">
                {slotMeals.map((m) => {
                  const tm = mealTotalMacros(m);
                  return (
                    <Card key={m.id} className="p-3 flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="text-white text-[14px] truncate">{m.name}</div>
                        <div className="text-textFaint text-[12px]">{tm.calories} kcal · P{Math.round(tm.proteinG)} C{Math.round(tm.carbsG)} F{Math.round(tm.fatG)}</div>
                      </div>
                      <button onClick={() => deleteMeal(m.id)} className="text-textFaint hover:text-white transition px-2"><Icon name="close" size={16} /></button>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      <div className="text-textFaint text-[12px] font-semibold uppercase tracking-wider mb-2.5 mt-7">Suggested recipes</div>
      <div className="space-y-2 mb-6">
        {recipes.slice(0, 5).map((r) => (
          <Card key={r.id} className="p-3 flex items-center justify-between">
            <div className="min-w-0">
              <div className="text-white text-[14px] truncate">{r.name}</div>
              <div className="text-textFaint text-[12px]">{r.subtitle} · {r.macros.calories} kcal</div>
            </div>
            <button
              onClick={() => addMeal({
                id: uuid(), date: new Date().toISOString(), slot: r.slot,
                name: r.name, servings: 1, macros: r.macros, externalId: r.id,
              })}
              className="text-accentGreen text-[13px] shrink-0 ml-3">Log</button>
          </Card>
        ))}
      </div>

      <div className="text-textFaint text-[12px] font-semibold uppercase tracking-wider mb-2.5">Meal plans for your goal</div>
      <div className="space-y-2 mb-6">
        {plans.map((p) => (
          <Card key={p.id} className="p-4">
            <div className="text-white text-[15px] font-medium">{p.title}</div>
            <div className="text-textFaint text-[12px] mt-0.5">{p.tagline}</div>
            <div className="text-textMuted text-[13px] mt-2">{p.summary}</div>
          </Card>
        ))}
      </div>

      {adding && (
        <AddMealSheet slot={adding} onClose={() => setAdding(null)} onAdd={(m) => { addMeal(m); setAdding(null); }} />
      )}
    </div>
  );
}

function AddMealSheet({ slot, onClose, onAdd }:
  { slot: MealSlot; onClose: () => void; onAdd: (m: MealEntry) => void }) {
  const [name, setName] = useState("");
  const [cal, setCal] = useState("");
  const [p, setP] = useState("");
  const [c, setC] = useState("");
  const [f, setF] = useState("");

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60" onClick={onClose}>
      <div className="w-full max-w-[440px] bg-bgCard border-t border-border rounded-t-3xl p-6 ff-pop" onClick={(e) => e.stopPropagation()}>
        <div className="font-display text-3xl text-white mb-4">Add to {mealSlotLabel(slot)}</div>
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Food name"
          className="w-full rounded-button bg-bgPhone border border-borderStrong px-4 py-3 mb-3 outline-none focus:border-accentGreen" />
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[["kcal", cal, setCal], ["P", p, setP], ["C", c, setC], ["F", f, setF]].map(([label, val, set]: any) => (
            <input key={label} type="number" inputMode="numeric" value={val} onChange={(e) => set(e.target.value)} placeholder={label}
              className="rounded-lg bg-bgPhone border border-borderStrong px-2 py-2 text-center outline-none focus:border-accentGreen" />
          ))}
        </div>
        <PrimaryButton disabled={!name.trim()} onClick={() => onAdd({
          id: uuid(), date: new Date().toISOString(), slot, name: name.trim(), servings: 1,
          macros: { calories: Number(cal) || 0, proteinG: Number(p) || 0, carbsG: Number(c) || 0, fatG: Number(f) || 0 },
          externalId: null,
        })}>Add</PrimaryButton>
        <button onClick={onClose} className="w-full text-textFaint text-[14px] mt-3">Cancel</button>
      </div>
    </div>
  );
}
