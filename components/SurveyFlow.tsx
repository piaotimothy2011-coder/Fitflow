"use client";
import React, { useState } from "react";
import { useApp } from "./AppState";
import { PrimaryButton } from "./ui";
import { Icon, type IconName } from "./icons";
import { SurveyCatalog, goalIcon } from "@/lib/surveyCatalog";
import { type Survey, type BiologicalSex } from "@/lib/models";
import { buildProgram } from "@/lib/workoutGenerator";
import { applyProgression } from "@/lib/progressionEngine";

const SEXES: { id: BiologicalSex; label: string }[] = [
  { id: "male", label: "Male" }, { id: "female", label: "Female" },
  { id: "other", label: "Other" }, { id: "preferNotToSay", label: "Prefer not to say" },
];

const TOTAL = 7;

export default function SurveyFlow() {
  const { survey, setSurvey, installProgram, setLogs, preferences } = useApp();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Survey>({ ...survey, mealsPerDay: survey.mealsPerDay || 3 });
  const [building, setBuilding] = useState(false);

  const update = (patch: Partial<Survey>) => setDraft((d) => ({ ...d, ...patch }));
  const toggle = (arr: string[], v: string): string[] =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  const canNext = () => (step === 0 ? draft.goal !== "" : step === 1 ? draft.level !== "" : true);

  const build = () => {
    setBuilding(true);
    setSurvey(draft);
    setTimeout(() => {
      const program = buildProgram(draft).map((w) => applyProgression(w, setLogs, preferences.units));
      installProgram(program);
    }, 700);
  };

  if (building) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-7 text-center">
        <div className="animate-pulse text-accentGreen mb-5"><Icon name="bolt" size={56} /></div>
        <div className="font-display text-5xl text-accentGreen leading-none">BUILDING YOUR PLAN</div>
        <p className="text-textMuted mt-3 max-w-[280px]">Matching exercises to your goal, equipment and recovery…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col px-6 pt-7 pb-6">
      {/* header */}
      <div className="mb-7">
        <div className="flex items-center justify-between mb-3 h-7">
          {step > 0 ? (
            <button onClick={() => setStep((s) => s - 1)} className="text-textMuted hover:text-white transition flex items-center gap-1 text-[14px]">
              <Icon name="back" size={18} /> Back
            </button>
          ) : <span />}
          <span className="text-textFaint text-[13px] font-medium">{step + 1} / {TOTAL}</span>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: TOTAL }).map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= step ? "bg-accentGreen" : "bg-borderStrong"}`} />
          ))}
        </div>
      </div>

      <div className="flex-1 no-scrollbar overflow-y-auto -mx-1 px-1">
        {step === 0 && (
          <Section title="What's your main goal?" subtitle="Everything in your plan is built around this.">
            <div className="grid grid-cols-2 gap-3">
              {SurveyCatalog.goals.map((g) => (
                <Tile key={g} icon={goalIcon[g] ?? "spark"} label={g} selected={draft.goal === g} onClick={() => update({ goal: g })} />
              ))}
            </div>
          </Section>
        )}

        {step === 1 && (
          <Section title="Your experience level" subtitle="So we match the intensity to your ability.">
            <div className="space-y-2.5">
              {SurveyCatalog.levels.map((l) => {
                const [t, d] = SurveyCatalog.levelLabels[l].split(" — ");
                return <Row key={l} title={t} desc={d} selected={draft.level === l} onClick={() => update({ level: l })} />;
              })}
            </div>
          </Section>
        )}

        {step === 2 && (
          <Section title="What equipment do you have?" subtitle="Pick everything you can train with — it filters every exercise.">
            <div className="grid grid-cols-2 gap-2.5">
              {SurveyCatalog.equipment.map((e) => (
                <SelChip key={e} label={e} selected={draft.equipment.includes(e)} onClick={() => update({ equipment: toggle(draft.equipment, e) })} />
              ))}
            </div>
          </Section>
        )}

        {step === 3 && (
          <Section title="Where do you want to focus?" subtitle="Optional — these areas get prioritised. Leave blank for full body.">
            <div className="grid grid-cols-2 gap-2.5">
              {SurveyCatalog.focus.map((f) => (
                <SelChip key={f} label={f} selected={draft.focus.includes(f)} onClick={() => update({ focus: toggle(draft.focus, f) })} />
              ))}
            </div>
          </Section>
        )}

        {step === 4 && (
          <Section title="Schedule & session length" subtitle="More active days raises your calorie target; length sets workout volume.">
            <Slider label="Days per week" icon="today" value={draft.days} min={1} max={7} unit={draft.days === 1 ? "day" : "days"} onChange={(v) => update({ days: v })} />
            <Slider label="Minutes per session" icon="clock" value={draft.minutes} min={15} max={90} step={5} unit="min" onChange={(v) => update({ minutes: v })} />
          </Section>
        )}

        {step === 5 && (
          <Section title="About you" subtitle="Powers your calorie & macro targets. All optional.">
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              {SEXES.map((s) => (
                <SelChip key={s.id} label={s.label} selected={draft.sex === s.id} onClick={() => update({ sex: s.id })} />
              ))}
            </div>
            <NumberField label="Age" value={draft.age} placeholder="30" onChange={(v) => update({ age: v })} />
            <NumberField label="Height (cm)" value={draft.heightCm} placeholder="170" onChange={(v) => update({ heightCm: v })} />
            <NumberField label="Weight (kg)" value={draft.weightKg} placeholder="70" onChange={(v) => update({ weightKg: v })} />
          </Section>
        )}

        {step === 6 && (
          <Section title="Nutrition preferences" subtitle="Shapes your meal targets and recipe suggestions.">
            <Label>Diet style</Label>
            <div className="grid grid-cols-2 gap-2.5 mb-5">
              {SurveyCatalog.dietStyles.map((d) => (
                <SelChip key={d} label={d} selected={draft.dietStyle === d} onClick={() => update({ dietStyle: d })} />
              ))}
            </div>
            <Slider label="Meals per day" icon="diet" value={draft.mealsPerDay || 3} min={2} max={6} unit="meals" onChange={(v) => update({ mealsPerDay: v })} />
            <Label>Allergies & restrictions</Label>
            <div className="grid grid-cols-2 gap-2.5">
              {SurveyCatalog.allergies.map((a) => (
                <SelChip key={a} label={a} selected={draft.allergies.includes(a)} onClick={() => update({ allergies: toggle(draft.allergies, a) })} />
              ))}
            </div>
          </Section>
        )}
      </div>

      <div className="pt-5">
        {step < TOTAL - 1 ? (
          <PrimaryButton onClick={() => setStep((s) => s + 1)} disabled={!canNext()}>Continue</PrimaryButton>
        ) : (
          <PrimaryButton onClick={build} disabled={!canNext()}>Build my plan</PrimaryButton>
        )}
      </div>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="mb-2 ff-pop">
      <h2 className="font-display text-[40px] text-white leading-[1.02]">{title}</h2>
      {subtitle && <p className="text-textMuted text-[14px] mt-2 mb-6 leading-snug">{subtitle}</p>}
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-textFaint text-[12px] font-semibold uppercase tracking-wider mb-2.5">{children}</div>;
}

function Tile({ icon, label, selected, onClick }: { icon: IconName; label: string; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`relative rounded-2xl border p-3.5 text-left transition active:scale-[0.97] flex flex-col gap-3 min-h-[104px]
        ${selected ? "border-accentGreen bg-accentGreen/10" : "border-borderStrong bg-bgCard hover:border-white/25"}`}>
      <span className={`w-11 h-11 rounded-xl flex items-center justify-center transition
        ${selected ? "bg-accentGreen text-deepGreen" : "bg-borderStrong text-accentGreen"}`}>
        <Icon name={icon} size={24} />
      </span>
      <span className={`text-[14.5px] font-semibold leading-tight ${selected ? "text-white" : "text-textMuted"}`}>{label}</span>
      {selected && <span className="absolute top-3 right-3 text-accentGreen"><Icon name="check" size={18} /></span>}
    </button>
  );
}

function Row({ title, desc, selected, onClick }: { title: string; desc?: string; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`w-full rounded-2xl border p-4 flex items-center gap-3 text-left transition active:scale-[0.99]
        ${selected ? "border-accentGreen bg-accentGreen/10" : "border-borderStrong bg-bgCard hover:border-white/25"}`}>
      <div className="flex-1 min-w-0">
        <div className={`text-[15px] font-semibold ${selected ? "text-white" : "text-white/90"}`}>{title}</div>
        {desc && <div className="text-textFaint text-[13px] mt-0.5">{desc}</div>}
      </div>
      <span className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition
        ${selected ? "border-accentGreen bg-accentGreen text-deepGreen" : "border-borderStrong"}`}>
        {selected && <Icon name="check" size={13} />}
      </span>
    </button>
  );
}

function SelChip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`rounded-xl px-4 py-3 text-[14px] border transition text-left active:scale-[0.98]
        ${selected ? "bg-accentGreen text-deepGreen border-accentGreen font-semibold" : "bg-bgCard text-textMuted border-borderStrong hover:border-white/25"}`}>
      {label}
    </button>
  );
}

function Slider({ label, icon, value, min, max, step = 1, unit, onChange }:
  { label: string; icon: IconName; value: number; min: number; max: number; step?: number; unit: string; onChange: (v: number) => void }) {
  return (
    <div className="mb-7 rounded-2xl border border-borderStrong bg-bgCard p-4">
      <div className="flex justify-between items-center mb-3">
        <span className="text-[15px] text-white/90 flex items-center gap-2"><span className="text-accentGreen"><Icon name={icon} size={18} /></span>{label}</span>
        <span className="font-display text-2xl text-accentGreen">{value} {unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-accentGreen" />
    </div>
  );
}

function NumberField({ label, value, placeholder, onChange }:
  { label: string; value?: number | null; placeholder: string; onChange: (v: number | null) => void }) {
  return (
    <div className="mb-3">
      <label className="text-textFaint text-[13px]">{label}</label>
      <input type="number" inputMode="numeric" placeholder={placeholder} value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        className="mt-1 w-full rounded-button bg-bgCard border border-borderStrong px-4 py-3 text-[15px] outline-none focus:border-accentGreen" />
    </div>
  );
}
