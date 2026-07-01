"use client";
import { useApp } from "./AppState";
import { Chip, SectionLabel } from "./ui";
import { Icon } from "./icons";
import { userInitials, type BiologicalSex } from "@/lib/models";
import { weightUnit, weightToDisplay, weightFromDisplay, heightToDisplay, heightFromDisplay } from "@/lib/units";

export default function ProfileScreen() {
  const app = useApp();
  const user = app.user;
  const prefs = app.preferences;

  const setUnits = (units: "metric" | "imperial") => app.setPreferences({ ...prefs, units });
  const setRest = (defaultRestSeconds: number) => app.setPreferences({ ...prefs, defaultRestSeconds });

  const survey = app.survey;
  const units = prefs.units;
  const patchSurvey = (patch: Partial<typeof survey>) => app.setSurvey({ ...survey, ...patch });
  const heightUnit = units === "metric" ? "cm" : "in";

  return (
    <div className="px-6 pt-9">
      <h1 className="font-display text-[44px] text-white leading-none mb-5">Profile</h1>

      {/* identity card */}
      <div className="rounded-2xl bg-bgCard border border-border p-5 mb-3 flex items-center gap-4">
        <div className="relative shrink-0">
          <div className="h-16 w-16 rounded-full bg-accentGreen text-deepGreen font-display text-2xl flex items-center justify-center ring-4 ring-accentGreen/15">
            {user ? userInitials(user) : "YOU"}
          </div>
        </div>
        <div className="min-w-0">
          <div className="truncate text-[18px] font-semibold text-white">{user?.name ?? "Athlete"}</div>
          <div className="truncate text-[13px] text-textFaint mt-0.5">{user?.email ?? "—"}</div>
          {app.cloudEnabled && (
            <div className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] text-accentGreen font-medium">
              <Icon name="check" size={13} /> Synced to cloud
            </div>
          )}
        </div>
      </div>

      {/* personal details */}
      <div className="rounded-2xl bg-bgCard border border-border p-5 mb-3">
        <SectionLabel className="mb-3">Personal details</SectionLabel>
        <div className="grid grid-cols-2 gap-2.5">
          <label>
            <span className="block text-textFaint text-[11px] mb-1.5">Weight ({weightUnit(units)})</span>
            <input type="number" inputMode="decimal" placeholder="—"
              value={survey.weightKg != null ? Math.round(weightToDisplay(survey.weightKg, units)) : ""}
              onChange={(e) => patchSurvey({ weightKg: e.target.value === "" ? null : weightFromDisplay(Number(e.target.value), units) })}
              className="w-full rounded-xl bg-bgPhone border border-borderStrong px-3 py-2.5 text-[16px] text-white outline-none focus:border-accentGreen transition" />
          </label>
          <label>
            <span className="block text-textFaint text-[11px] mb-1.5">Height ({heightUnit})</span>
            <input type="number" inputMode="decimal" placeholder="—"
              value={survey.heightCm != null ? Math.round(heightToDisplay(survey.heightCm, units)) : ""}
              onChange={(e) => patchSurvey({ heightCm: e.target.value === "" ? null : heightFromDisplay(Number(e.target.value), units) })}
              className="w-full rounded-xl bg-bgPhone border border-borderStrong px-3 py-2.5 text-[16px] text-white outline-none focus:border-accentGreen transition" />
          </label>
          <label>
            <span className="block text-textFaint text-[11px] mb-1.5">Age</span>
            <input type="number" inputMode="numeric" placeholder="—"
              value={survey.age ?? ""}
              onChange={(e) => patchSurvey({ age: e.target.value === "" ? null : Number(e.target.value) })}
              className="w-full rounded-xl bg-bgPhone border border-borderStrong px-3 py-2.5 text-[16px] text-white outline-none focus:border-accentGreen transition" />
          </label>
        </div>
        <div className="mt-3">
          <span className="block text-textFaint text-[11px] mb-1.5">Sex</span>
          <div className="flex flex-wrap gap-2">
            {(["male", "female", "other"] as BiologicalSex[]).map((s) => (
              <Chip key={s} label={s[0].toUpperCase() + s.slice(1)} selected={survey.sex === s} onClick={() => patchSurvey({ sex: s })} />
            ))}
          </div>
        </div>
        <p className="text-textFaint text-[11.5px] mt-3 leading-snug">Used to tailor calorie and starting-weight estimates.</p>
      </div>

      <div className="rounded-2xl bg-bgCard border border-border p-5 mb-3">
        <SectionLabel className="mb-3">Units</SectionLabel>
        <div className="grid grid-cols-2 gap-2.5">
          <Chip label="Imperial (lb)" selected={prefs.units === "imperial"} onClick={() => setUnits("imperial")} />
          <Chip label="Metric (kg)" selected={prefs.units === "metric"} onClick={() => setUnits("metric")} />
        </div>
      </div>

      <div className="rounded-2xl bg-bgCard border border-border p-5 mb-3">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-accentGreen"><Icon name="clock" size={15} /></span>
          <SectionLabel>Default rest timer</SectionLabel>
        </div>
        <div className="flex flex-wrap gap-2">
          {[45, 60, 90, 120, 180].map((s) => (
            <Chip key={s} label={s < 60 ? `${s}s` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`}
              selected={prefs.defaultRestSeconds === s} onClick={() => setRest(s)} />
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-bgCard border border-border p-5 mb-3">
        <SectionLabel className="mb-2">Your plan</SectionLabel>
        <div className="text-[13px] text-textFaint mb-3">
          {app.survey?.goal ? "Survey complete. Regenerate workouts anytime from Today." : "No survey yet."}
        </div>
        <button onClick={app.goToSurvey}
          className="w-full rounded-button border border-borderStrong text-white font-medium py-3 text-[14px] transition active:scale-[0.98] hover:bg-white/5">
          Retake survey
        </button>
      </div>

      <div className="flex flex-col gap-2 pt-1 pb-2">
        <button onClick={app.signOut}
          className="w-full rounded-button border border-borderStrong text-white font-medium py-3 text-[14px] transition active:scale-[0.98] hover:bg-white/5 flex items-center justify-center gap-2">
          <Icon name="back" size={16} /> Sign out
        </button>
        <button onClick={() => { if (confirm("This erases all your data on this device. Continue?")) app.resetAll(); }}
          className="rounded-button py-3 text-[14px] font-semibold text-red-400 transition hover:bg-red-500/10">
          Reset all data
        </button>
      </div>

      <div className="pt-2 pb-4 text-center text-[12px] text-textFaint">
        FitFlow · Train SMART. Move every day.
      </div>
    </div>
  );
}
