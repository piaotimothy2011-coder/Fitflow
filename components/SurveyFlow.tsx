"use client";
import React, { useState } from "react";
import { useApp } from "./AppState";
import { PrimaryButton, GhostButton, Chip, ProgressBar } from "./ui";
import { SurveyCatalog, goalIcon } from "@/lib/surveyCatalog";
import { Icon } from "./icons";
import { type Survey, type BiologicalSex } from "@/lib/models";
import { buildWorkout, buildSmartPlan } from "@/lib/workoutGenerator";
import { applyProgression } from "@/lib/progressionEngine";

const SEXES: { id: BiologicalSex; label: string }[] = [
  { id: "male", label: "Male" }, { id: "female", label: "Female" },
  { id: "other", label: "Other" }, { id: "preferNotToSay", label: "Prefer not to say" },
];

export default function SurveyFlow() {
  const { survey, setSurvey, setCurrentWorkout, setLogs, preferences } = useApp();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Survey>({ ...survey });
  const [building, setBuilding] = useState(false);

  const totalSteps = 6;
  const update = (patch: Partial<Survey>) => setDraft((d) => ({ ...d, ...patch }));

  const toggle = (arr: string[], value: string): string[] =>
    arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value];

  const canNext = () => {
    switch (step) {
      case 0: return draft.goal !== "";
      case 1: return draft.level !== "";
      default: return true;
    }
  };

  const build = () => {
    setBuilding(true);
    setSurvey(draft);
    setTimeout(() => {
      let w = draft && setLogs.length ? buildSmartPlan(draft, setLogs) : buildWorkout(draft);
      w = applyProgression(w, setLogs, preferences.units);
      setCurrentWorkout(w);
    }, 700);
  };

  if (building) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-7 text-center">
        <div className="animate-pulse text-accentGreen mb-5">
          <Icon name="spark" size={56} />
        </div>
        <div className="font-display text-5xl text-accentGreen leading-none">BUILDING YOUR PLAN</div>
        <p className="text-textMuted mt-3 max-w-[280px]">Matching exercises to your goal, equipment and recovery…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col px-7 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-textFaint text-[13px]">Step {step + 1} of {totalSteps}</span>
          <span className="text-textFaint text-[13px]">{Math.round(((step + 1) / totalSteps) * 100)}%</span>
        </div>
        <ProgressBar value={(step + 1) / totalSteps} />
      </div>

      <div className="flex-1 no-scrollbar overflow-y-auto">
        {step === 0 && (
          <Section title="What's your main goal?" subtitle="We'll build your plan around this.">
            <div className="grid grid-cols-1 gap-2.5">
              {SurveyCatalog.goals.map((g) => (
                <Chip
                  key={g}
                  icon={<Icon name={goalIcon[g] ?? "spark"} size={22} />}
                  label={g}
                  selected={draft.goal === g}
                  onClick={() => update({ goal: g })}
                />
              ))}
            </div>
          </Section>
        )}

        {step === 1 && (
          <Section title="Your experience level" subtitle="So intensity matches your ability.">
            <div className="grid grid-cols-1 gap-2.5">
              {SurveyCatalog.levels.map((l) => (
                <Chip key={l} label={SurveyCatalog.levelLabels[l]} selected={draft.level === l} onClick={() => update({ level: l })} />
              ))}
            </div>
          </Section>
        )}

        {step === 2 && (
          <Section title="What equipment do you have?" subtitle="Pick everything you can use.">
            <div className="grid grid-cols-2 gap-2.5">
              {SurveyCatalog.equipment.map((e) => (
                <Chip key={e} label={e} selected={draft.equipment.includes(e)} onClick={() => update({ equipment: toggle(draft.equipment, e) })} />
              ))}
            </div>
          </Section>
        )}

        {step === 3 && (
          <Section title="Where do you want to focus?" subtitle="Optional — leave blank for full body.">
            <div className="grid grid-cols-2 gap-2.5">
              {SurveyCatalog.focus.map((f) => (
                <Chip key={f} label={f} selected={draft.focus.includes(f)} onClick={() => update({ focus: toggle(draft.focus, f) })} />
              ))}
            </div>
          </Section>
        )}

        {step === 4 && (
          <Section title="Schedule & session length" subtitle="Tune the volume to your week.">
            <Slider label="Days per week" value={draft.days} min={1} max={7} unit="days" onChange={(v) => update({ days: v })} />
            <Slider label="Minutes per session" value={draft.minutes} min={15} max={90} step={5} unit="min" onChange={(v) => update({ minutes: v })} />
          </Section>
        )}

        {step === 5 && (
          <Section title="About you" subtitle="Powers your calorie & macro targets. All optional.">
            <div className="grid grid-cols-2 gap-2.5 mb-3">
              {SEXES.map((s) => (
                <Chip key={s.id} label={s.label} selected={draft.sex === s.id} onClick={() => update({ sex: s.id })} />
              ))}
            </div>
            <NumberField label="Age" value={draft.age} placeholder="30" onChange={(v) => update({ age: v })} />
            <NumberField label="Height (cm)" value={draft.heightCm} placeholder="170" onChange={(v) => update({ heightCm: v })} />
            <NumberField label="Weight (kg)" value={draft.weightKg} placeholder="70" onChange={(v) => update({ weightKg: v })} />
            <div className="mt-3">
              <div className="text-textFaint text-[13px] mb-2">Diet style</div>
              <div className="grid grid-cols-2 gap-2.5">
                {SurveyCatalog.dietStyles.map((d) => (
                  <Chip key={d} label={d} selected={draft.dietStyle === d} onClick={() => update({ dietStyle: d })} />
                ))}
              </div>
            </div>
          </Section>
        )}
      </div>

      <div className="space-y-3 pt-4">
        {step < totalSteps - 1 ? (
          <PrimaryButton onClick={() => setStep((s) => s + 1)} disabled={!canNext()}>Continue</PrimaryButton>
        ) : (
          <PrimaryButton onClick={build} disabled={!canNext()}>Build my plan</PrimaryButton>
        )}
        {step > 0 && <GhostButton onClick={() => setStep((s) => s - 1)}>Back</GhostButton>}
      </div>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="mb-2">
      <h2 className="font-display text-4xl text-white leading-tight">{title}</h2>
      {subtitle && <p className="text-textMuted text-[14px] mt-1.5 mb-5">{subtitle}</p>}
      {children}
    </div>
  );
}

function Slider({ label, value, min, max, step = 1, unit, onChange }:
  { label: string; value: number; min: number; max: number; step?: number; unit: string; onChange: (v: number) => void }) {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-baseline mb-2">
        <span className="text-[15px] text-white/90">{label}</span>
        <span className="font-display text-2xl text-accentGreen">{value} {unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-accentGreen" />
    </div>
  );
}

function NumberField({ label, value, placeholder, onChange }:
  { label: string; value?: number | null; placeholder: string; onChange: (v: number | null) => void }) {
  return (
    <div className="mb-3">
      <label className="text-textFaint text-[13px]">{label}</label>
      <input
        type="number" inputMode="numeric" placeholder={placeholder}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        className="mt-1 w-full rounded-button bg-bgCard border border-borderStrong px-4 py-3 text-[15px] outline-none focus:border-accentGreen"
      />
    </div>
  );
}
